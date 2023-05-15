import "../Shared/Extensions";
import fs from "fs";
import "colors";
import http from "http";
import axios, { AxiosResponse, AxiosResponseHeaders } from "axios";
import { Types } from "./Types";
import { System } from "./System";
import { Process } from "./Process";
import { Events } from "./Events";
import { HealthMonitor } from "./HealthMonitor";
import { Timer, IntervalCounter } from "./Timer";

interface Node {
  name: string;
  address: Types.Address;
  process: Process;
  enabled: boolean;
  health: HealthMonitor;
}

interface NodeItem {
  index: number;
  node: Node;
}

class NodeSwitcher {
  private readonly nodes: Node[] = [];

  constructor(private events: Events) {}

  add(node: Node) {
    node.process =
      typeof node.process == "string"
        ? Process.new(node.name, node.process as unknown as string, this.events)
        : node.process;
    node.enabled = true;
    node.health = new HealthMonitor(1000 * 60 * 1);
    this.nodes.push(node as Node);
    node.on("enabled", (enabled: boolean) =>
      this.emitNodeEvent(node, "enabled", enabled)
    );
    node.health.on("successRate", (successRate: number) => {
      this.emitNodeEvent(node, "successRate", successRate);
    });
  }

  get(index: number) {
    return this.nodes[index];
  }

  getNodes() {
    return this.nodes;
  }

  emitNodeEvent(node: Node, event: string, data: any) {
    const index = this.nodes.indexOf(node);
    this.events.emit(`node-${event}`, index, data);
  }

  toggleEnabled(index: number) {
    // We don't allow disabling all nodes
    if (
      this.nodes.filter((node) => node.enabled).length === 1 &&
      this.nodes[index].enabled
    ) {
      this.events.emit("log", { text: "Cannot disable all nodes".bgRed });
      return;
    }
    this.nodes[index].enabled = !this.nodes[index].enabled;
  }

  getNextNode(index: number) {
    do {
      index++;
      index %= this.nodes.length;
      let item = this.nodes[index];
      if (item.enabled) return { index, node: item };
    } while (true);
  }
  getRandomNode(): NodeItem {
    let item = this._getRandomNode();
    while (!item.node.enabled) item = this._getRandomNode();
    return item;
  }

  private _getRandomNode(): NodeItem {
    // Get a random node
    const index = Math.floor(Math.random() * this.nodes.length);
    const node = this.nodes[index];
    return { index, node };
  }
}

interface IncomingItem {
  id: number;
  isProcessing: boolean;
  nodeItem: NodeItem;
  dt: number;
  attempt: number;
  request: http.IncomingMessage;
  response: http.ServerResponse;
}

interface LoadBalancerOptions {
  address: Types.Address;
  cors: string[];
  os: {
    restart: {
      url: string;
    };
  };
  request: {
    timeout: number;
  };
  severity: {
    time: [number, number, "<" | ">"];
  };
}

class IncomingItemCollection {
  private items: IncomingItem[] = [];

  constructor(
    private nodeSwitcher: NodeSwitcher,
    private events: Events,
    public attempts: number
  ) {}

  add(incomingItem: IncomingItem) {
    this.items.push(incomingItem);
    this.events.emit("incoming-items", this.items.length);
  }

  remove(incomingItem: IncomingItem) {
    const index = this.items.findIndex((item) => item.id === incomingItem.id);
    if (index === -1) return;
    this.items.splice(index, 1);
    this.events.emit("incoming-items", this.items.length);
  }

  filter(predicate: (item: IncomingItem) => boolean) {
    return this.items.filter(predicate);
  }

  getItems() {
    return [...this.items];
  }
}

class LoadBalancer {
  incomingItemID: number = 1;
  events = new Events();
  private readonly nodeSwitcher = new NodeSwitcher(this.events);
  readonly stats = {
    // Incoming requests from web users
    requests: {
      per: {
        second: new IntervalCounter(1000),
        minute: new IntervalCounter(1000 * 60),
      },
      track: () => {
        this.stats.requests.per.second.track(1);
        this.stats.requests.per.minute.track(1);
      },
    },
    // Responses from the nodes
    // This measures website code execution time, etc
    response: {
      times: {
        per: {
          minute: new IntervalCounter(1000 * 60),
        },
        track: (elapsed: number) => {
          this.stats.response.times.per.minute.track(elapsed);
        },
      },
    },
  };
  incomingItems: IncomingItemCollection = new IncomingItemCollection(
    this.nodeSwitcher,
    this.events,
    10
  );

  constructor(private options: LoadBalancerOptions) {}

  static new(options: LoadBalancerOptions) {
    return new LoadBalancer(options);
  }

  addNode(node: Node) {
    this.nodeSwitcher.add(node);

    this.logText(`Added node ${node.name.green}`);
  }

  getNode(index: number) {
    return this.nodeSwitcher.get(index);
  }

  getNodes() {
    return this.nodeSwitcher.getNodes();
  }

  getResponseBodySize(response: AxiosResponse<any>) {
    let size = 0;
    if (response.data?.headers)
      size = parseInt(response.data.headers["content-length"] || "0");
    return (
      size ||
      parseInt(
        response.headers["content-length"] || response.data.length || "0"
      )
    );
  }

  ignoreRequest(request: http.IncomingMessage) {
    if (request.url?.startsWith("/api/Analytics/")) {
      if (!request.url.startsWith("/api/Analytics/new")) return true;
      return false;
    }
    return false;
  }

  async handleRequest(
    request: http.IncomingMessage,
    response: http.ServerResponse
  ) {
    this.stats.requests.track();

    if (this.ignoreRequest(request)) {
      response.end();
      return;
    }

    const nodeItem = this.nodeSwitcher.getRandomNode();

    const incomingItem: IncomingItem = {
      id: this.incomingItemID++, // Unique ID for this request
      isProcessing: false, // Is this request being processed?
      nodeItem, // The node that will process this request
      dt: Date.now(), // The time this request was received
      attempt: 0, // Which attempt is this?
      request, // The request object
      response, // The response object
    };

    this.incomingItems.add(incomingItem);

    this.processIncomingItem(incomingItem);
  }

  private removeIncomingItem(item: IncomingItem, status?: number) {
    const elapsed = Date.now() - item.dt;
    // Remove the item from the incoming items collection
    this.incomingItems.remove(item);
    // Respond with a 504 Gateway Timeout
    item.response.statusCode = 504;
    item.response.end();
    // Log the timeout
    this.logText(
      `${`Timed out`.bgRed} ${elapsed.unitifyTime("s")}: ${
        (status || "").toString().padStart(3).bgRed
      } ${item.request.url?.bgRed}`
    );
  }

  private nodeResponseSuccess(
    incomingItem: IncomingItem,
    nodeResponse: AxiosResponse<any>,
    elapsed: number
  ) {
    if (elapsed < 50) {
      incomingItem.nodeItem.node.health.trackSuccess();
    } else {
      incomingItem.nodeItem.node.health.trackFailure();
    }

    const uElapsed = elapsed
      .unitifyTime()
      .severify(...this.options.severity.time);
    const status = nodeResponse.status;
    const sizeKB = !nodeResponse
      ? "?"
      : this.getResponseBodySize(nodeResponse).unitifySize();

    let statusStr = this.colorByStatus(status, status);

    const url = this.colorByStatus(incomingItem.request.url, status);

    incomingItem.response.writeHead(
      status,
      nodeResponse?.statusText,
      nodeResponse?.headers as any
    );
    nodeResponse.data.pipe(incomingItem.response);

    const displayItem = incomingItem.request.url?.endsWith(".jpg")
      ? false
      : true;

    if (displayItem) {
      // Log the successful attempt
      this.log({
        node: { index: incomingItem.nodeItem.index },
        texts: [statusStr, sizeKB, uElapsed, url],
      });
    }

    // Successfully processed the incoming item
    this.incomingItems.remove(incomingItem);
  }

  private nodeResponseFailure(
    incomingItem: IncomingItem,
    ex: any,
    logMsg: string,
    elapsed: number
  ) {
    incomingItem.nodeItem.node.health.trackFailure();

    const uElapsed = elapsed
      .unitifyTime()
      .severify(...this.options.severity.time);

    // Failed to process the incoming item
    // Increment the attempt counter
    incomingItem.attempt++;
    // Log the failed attempt
    this.log({
      node: { index: incomingItem.nodeItem.index },
      texts: [
        (ex.status || "").toString().bgRed,
        null, // sizeKB,
        uElapsed,
        `(${incomingItem.attempt.ordinalize()} attempt) ${
          logMsg.bgWhite.black
        }`,
      ],
    });

    // We haven't reached the maximum number of attempts
    if (incomingItem.attempt < this.incomingItems.attempts) {
      // Try again with another node
      incomingItem.nodeItem = this.nodeSwitcher.getNextNode(
        incomingItem.nodeItem.index
      );
      // Try again
      setTimeout(() => this.processIncomingItem.bind(this)(incomingItem), 1000);
    } else {
      // We've reached the maximum number of attempts
      // Remove the item from the queue
      this.removeIncomingItem(incomingItem, ex.status);
    }
  }

  private async processIncomingItem(incomingItem: IncomingItem) {
    const { request, response, nodeItem } = incomingItem;

    if (request.url == this.options.os?.restart?.url) {
      await System.restartComputer();
    }

    // CORS
    if (this.options?.cors?.length) {
      for (const origin of this.options.cors) {
        response.setHeader("Access-Control-Allow-Origin", origin);
      }
    }

    incomingItem.isProcessing = true;

    incomingItem.nodeItem;

    const url = `${nodeItem.node.address.protocol}://${nodeItem.node.address.host}:${nodeItem.node.address.port}${request.url}`;

    let logMsg = request.url || "";

    const timer = Timer.start();

    try {
      const options = {
        url,
        method: request.method as any,
        headers: request.headers,
        data: (request as any).body,
        // We want to proxy the data as-is,
        responseType: "stream",
        // We want to proxy the request as-is,
        // let the client handle the redirects
        maxRedirects: 0,
      } as any;

      if (this.options.request?.timeout) {
        options.timeout = this.options.request.timeout * 1000;
      }

      const response = await axios.request(options);

      timer.stop();

      if (response.status == 200 && timer.elapsed)
        this.stats.response.times.track(timer.elapsed);

      this.nodeResponseSuccess(incomingItem, response, timer.elapsed!);
    } catch (ex: any) {
      timer.stop();
      // Some HTTP status codes are not errors (304 Not Modified, 404 Not Found, etc.)
      // Axios throws an error for these status codes
      // We're handling them as successes
      if (ex.response) {
        this.nodeResponseSuccess(incomingItem, ex.response, timer.elapsed!);
        return;
      } else {
        if (ex.code != "ECONNREFUSED") {
          this.log({
            node: { index: incomingItem.nodeItem.index },
            texts: [null, null, null, ex.message.bgRed],
          });
        }
        this.nodeResponseFailure(incomingItem, ex, logMsg, timer.elapsed!);
        return;
      }
    }
  }

  toggleNodeEnabled(nodeIndex: number) {
    this.nodeSwitcher.toggleEnabled(nodeIndex);
  }

  async restartNode(nodeIndex: number) {
    const node = this.getNode(nodeIndex);
    await node.process.restart();
  }

  private colorByStatus(s: any, status: number) {
    s = s.toString();
    if (status >= 200 && status < 300) return s.green;
    else if (status >= 300 && status < 400) return s.yellow;
    else if (status >= 400 && status < 500) return s.bgRed;
    return s;
  }

  private log(data: any) {
    this.events.emit("log", data);
  }

  private logText(text: string) {
    this.log({ text });
  }

  start() {
    const server = http.createServer(this.handleRequest.bind(this));

    server.listen(this.options.address.port, this.options.address.host, () => {
      this.logText(
        `Load balancer started on ${`${Types.stringify(
          this.options.address,
          "Address"
        )}`}`
      );
    });
  }
}

export { LoadBalancer, IncomingItem };
