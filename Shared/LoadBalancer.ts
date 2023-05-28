import "../Shared/Extensions";
import util from "util";
import fs from "fs";
import "colors";
import http from "http";
import axios, { AxiosResponse, AxiosResponseHeaders } from "axios";
import { Cache, CacheBase } from "./Cache";
import { Objects } from "./Extensions.Objects";
import { Types } from "./Types";
import { System } from "./System";
import { Process } from "./Process";
import { Http } from "./Http";
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
    Objects.on(node, "enabled", (enabled: boolean) =>
      this.emitNodeEvent(node, "enabled", enabled)
    );
    Objects.on(node.health, "successRate", (successRate: number) => {
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
  infos: string[];
  nodeItem: NodeItem;
  dt: number;
  attempt: number;
  request: http.IncomingMessage;
  response: http.ServerResponse;
  requestPostData: any;
  returnToClient: boolean;
}

interface CachedResponse {
  dt: number;
  status: {
    code: number;
    text: string;
  };
  headers: any;
  body: string;
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
  cache: {
    max: {
      age: string;
    };
    store: any;
    ignore: [];
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
  cache!: CacheBase | null;
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

  static async new(options: LoadBalancerOptions) {
    const lb = new LoadBalancer(options);
    lb.cache = await Cache.new(options.cache.store);
    lb.cache.events.on("error", (ex: any) => {
      lb.events.emit("error", ex);
    });
    return lb;
  }

  addNode(node: Node) {
    this.nodeSwitcher.add(node);

    this.log(`Added node ${node.name.green}`);
  }

  getNode(index: number) {
    return this.nodeSwitcher.get(index);
  }

  getNodes() {
    return this.nodeSwitcher.getNodes();
  }

  async getResponseStream(response: AxiosResponse<any>) {
    return new Promise<string>((resolve, reject) => {
      let data = "";
      response.data.on("data", (chunk: any) => {
        data += chunk;
      });
      response.data.on("end", () => {
        resolve(data);
      });
      response.data.on("error", (error: any) => {
        reject(error);
      });
    });
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

    const requestPostData = await Http.getPostData(request);

    const incomingItem: IncomingItem = {
      id: this.incomingItemID++, // Unique ID for this request
      isProcessing: false, // Is this request being processed?
      infos: [], // Information about this request
      nodeItem, // The node that will process this request
      dt: Date.now(), // The time this request was received
      attempt: 0, // Which attempt is this?
      request, // The request object
      response, // The response object
      requestPostData: requestPostData, // The request body
      returnToClient: true, // Should this request be returned to the client?
    };

    // Remove &_uid=1685119338348 from the URL (uniquifies the request)
    let url = incomingItem.request.url;
    url = url?.replace(/&_uid=\d+/g, "");
    incomingItem.request.url = url;

    this.incomingItems.add(incomingItem);

    this.processIncomingItem(incomingItem);
  }

  private removeIncomingItem(item: IncomingItem, status?: number) {
    item.infos.push(`${`removing`.yellow} ${`(${item.attempt} attempts)`}`);
    const elapsed = Date.now() - item.dt;
    // Remove the item from the incoming items collection
    this.incomingItems.remove(item);
    if (item.returnToClient) {
      // Respond with a 504 Gateway Timeout
      item.response.statusCode = 504;
      item.response.end();
    }
    // Log the timeout
    this.log(
      `${`Timed out`.bgRed} ${elapsed
        .unitifyTime()
        .severify(...this.options.severity.time)}: ${
        (status || "").toString().padStart(3).bgRed
      } ${item.request.url?.bgRed}`
    );
  }

  private async nodeResponseSuccess(
    incomingItem: IncomingItem,
    nodeResponse: AxiosResponse<any>,
    elapsed: number
  ) {
    incomingItem.infos.push(
      `${elapsed.unitifyTime().severify(...this.options.severity.time)} ${
        `success`.green
      }`
    );

    if (elapsed < 50) {
      incomingItem.nodeItem.node.health.trackSuccess();
    } else {
      incomingItem.nodeItem.node.health.trackFailure();
    }

    const uElapsed = elapsed
      .unitifyTime()
      .severify(...this.options.severity.time);
    const status = nodeResponse.status;

    let statusStr = status.severifyByHttpStatus();

    const url = incomingItem.request.url?.severifyByHttpStatus(status);

    incomingItem.infos.push(`writing headers`);

    if (this.cache) {
      if (this.isCachable(incomingItem.request)) {
        try {
          let data = await this.getResponseStream(nodeResponse);
          if (typeof data != "string") data = Objects.jsonify(data);

          // Get the response data
          const cachedResponse = {
            dt: Date.now(),
            url: incomingItem.request.url,
            status: {
              code: nodeResponse.status,
              text: nodeResponse.statusText,
            },
            headers: nodeResponse.headers,
            body: data,
          };
          delete cachedResponse.headers["access-control-allow-origin"];
          await this.cache.set(incomingItem.request.url || "", cachedResponse);
        } catch (ex: any) {
          this.log(`${`Error caching response`}\n${ex.message}`);
          try {
            this.log(util.inspect(nodeResponse.data, true, 10000, false));
          } catch (ex: any) {
            this.log(`Error inspecting response body`);
          }
        }
      }
    }

    if (incomingItem.returnToClient) {
      incomingItem.response.statusCode = status;
      incomingItem.response.statusMessage = nodeResponse?.statusText || "";

      const getNodeHeaders = (options: { cors: boolean }) =>
        Object.keys(nodeResponse?.headers || {}).filter(
          (key) =>
            key.toLowerCase().startsWith("access-control-allow-origin") ===
            options.cors
        );

      // Copy all the headers from the node response to the incoming response
      // except CORS headers
      getNodeHeaders({ cors: false }).forEach((key) => {
        incomingItem.response.setHeader(
          key,
          nodeResponse?.headers[key] as string
        );
      });

      const nodeCorsHeaders = getNodeHeaders({ cors: true });
      // If the node response has CORS headers, log a warning
      // if (nodeCorsHeaders.length) {
      //   this.log(
      //     `${`Not forwarding node CORS headers`.bgYellow.black}: ${nodeCorsHeaders
      //       .map((key) => `${key}: ${nodeResponse?.headers[key]}`)
      //       .join(", ")}`
      //   );
      // }

      incomingItem.infos.push(`piping data`);

      nodeResponse.data.pipe(incomingItem.response);
    }

    let nodeResponseSize = parseInt(
      nodeResponse.headers["content-length"] || 0
    ).unitifySize();

    const displayItem = incomingItem.request.url?.endsWith(".jpg")
      ? false
      : true;

    if (displayItem) {
      // Log the successful attempt
      this.log({
        node: { index: incomingItem.nodeItem.index },
        texts: [
          incomingItem.request.method,
          statusStr,
          nodeResponseSize,
          uElapsed,
          url,
        ],
      });
    }

    incomingItem.infos.push(`removing item from queue`);

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

    incomingItem.infos.push(
      `${uElapsed} ${ex.status || ""} ${ex.message?.bgRed}`
    );
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
      incomingItem.infos.push(
        `trying again ${`(${incomingItem.attempt.ordinalize()} attempt)`}`
      );
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
    const timer = Timer.start();

    const { request, response, nodeItem } = incomingItem;

    if (request.url == this.options.os?.restart?.url) {
      await System.restartComputer();
    }

    // CORS
    if (this.options?.cors?.length) {
      for (const origin of this.options.cors) {
        if (origin == request.headers.origin) {
          try {
            response.setHeader("Access-Control-Allow-Origin", origin);
          } catch (ex) {
            this.events.emit("error", ex);
          }
        }
      }
    }

    incomingItem.isProcessing = true;

    // Check if we have a cached response
    if (this.cache) {
      if (this.isCachable(request)) {
        const cachedResponse = (await this.cache.get(
          request.url || ""
        )) as CachedResponse;
        if (cachedResponse) {
          incomingItem.returnToClient = false;
          this.sendToClient(incomingItem, cachedResponse);

          this.log({
            type: "cache",
            texts: [
              incomingItem.request.method,
              cachedResponse.status.code.severifyByHttpStatus(),
              cachedResponse.body.length.unitifySize().gray,
              timer.elapsed
                ?.unitifyTime()
                .severify(...this.options.severity.time),
              incomingItem.request.url?.gray,
            ],
          });
          // If the cached response is still valid, we don't need to process the request
          // Otherwise, we'll process the request and update the cache
          // In any case, we'll return any available cached response to the client immediately
          // and process the request in the background to avoid making the client wait for the response
          // whenever possible.
          if (
            Date.now() - cachedResponse.dt <
            this.options.cache?.max?.age?.deunitifyTime()
          ) {
            this.incomingItems.remove(incomingItem);
            return;
          }
        }
      }
    }

    const url = `${nodeItem.node.address.protocol}://${nodeItem.node.address.host}:${nodeItem.node.address.port}${request.url}`;

    let logMsg = request.url || "";

    try {
      const options = {
        url,
        method: request.method as any,
        headers: request.headers,
        data: incomingItem.requestPostData,
        // We want to proxy the data as-is,
        responseType: "stream",
        // We want to proxy the request as-is,
        // let the client handle the redirects
        maxRedirects: 0,
      } as any;

      if (this.options.request?.timeout) {
        options.timeout = this.options.request.timeout * 1000;
      }

      incomingItem.infos.push(`${`Proxying request to`.gray} ${options.url}`);
      // for (const line of Objects.yamlify(options).split("\n"))
      //   incomingItem.infos.push(line);

      const response = await axios.request(options);

      timer.stop();

      incomingItem.infos.push(
        `${`Got response in`.gray} ${timer.elapsed?.unitifyTime()}`
      );

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
        incomingItem.infos.push(ex.message.bgRed);
        if (ex.code != "ECONNREFUSED") {
          this.log({
            node: { index: incomingItem.nodeItem.index },
            texts: [null, null, null, ex.message.bgRed],
          });
        }
        this.nodeResponseFailure(incomingItem, ex, logMsg, timer.elapsed!);
        return;
      }
    } finally {
      timer.stop();
      incomingItem.infos.push(
        `${timer.elapsed
          ?.unitifyTime()
          .severify(
            ...this.options.severity.time
          )} ${response.statusCode.severifyByHttpStatus()}`
      );
    }
  }

  private async sendToClient(
    incomingItem: IncomingItem,
    cachedResponse: CachedResponse
  ): Promise<void> {
    const { response } = incomingItem;
    const { status } = cachedResponse;
    const { headers, body } = cachedResponse;

    response.statusCode = status.code;
    response.statusMessage = status.text;
    response.writeHead(status.code, headers);
    response.end(body);
  }

  toggleNodeEnabled(nodeIndex: number) {
    this.nodeSwitcher.toggleEnabled(nodeIndex);
  }

  async restartNode(nodeIndex: number) {
    const node = this.getNode(nodeIndex);
    await node.process.restart();
  }

  private log(data: any) {
    if (typeof data == "string") data = { text: data };
    this.events.emit("log", data);
  }

  private isCachable(request: http.IncomingMessage) {
    if (!this.cache) return false;
    if (request.method != "GET") return false;
    if (!request.url) return false;
    if (
      [".jpg", ".jpeg", ".png", ".gif", ".webm", ".webp"].some((ext) =>
        request.url?.toLowerCase().endsWith(ext)
      )
    )
      return false;
    if (
      this.options.cache?.ignore?.some((pattern: string) =>
        request.url?.match(pattern)
      )
    )
      return false;
    return true;
  }

  start() {
    const server = http.createServer(this.handleRequest.bind(this));

    server.listen(this.options.address.port, this.options.address.host, () => {
      this.log(
        `Load balancer started on ${`${Types.stringify(
          this.options.address,
          "Address"
        )}`}`
      );
    });
  }
}

export { LoadBalancer, IncomingItem };
