import path from "path";
import "@shared/Extensions";
import { Types } from "@shared/Types";
import { Configuration } from "@shared/Configuration";
import { Files } from "@shared/Files";
import { Analytics } from "@shared/Analytics";
import {
  Console,
  Layout,
  Log,
  ObjectLog,
  LargeText,
  Bar,
  Unit,
} from "@shared/Console";
import { LoadBalancer, IncomingItem } from "@shared/LoadBalancer";

(async () => {
  const config = Configuration.new({
    quitIfChanged: [__filename.replace(".temp.ts", "")],
    toAbsolutePaths: ["process"],
    types: Types,
  }).data;

  const getIncomingLogTitle = (
    count: number = 0,
    countPerSecond: number = 0,
    countPerMinute: number = 0
  ) => {
    const title = config.title;
    // const title = `${
    //   config.title
    // } ─ ${config.incoming.address.stringifyAddress()}`;
    const items = count;
    return `${title} ─ (${items.severity(10, 30)} ${
      `reqs`.gray
    }) (${countPerSecond}${`/s`.gray}) (${countPerMinute}${`/m`.gray})`;
  };

  const getNodeLogTitle = (node: any, successRate?: number) => {
    return `${node.name} ─ ${`${node.address.host.yellow}:${
      node.address.port.toString().green
    }`} (${successRate ? successRate.stringify("%") : ""})`;
  };

  const incomingItemToString = (item: IncomingItem) => {
    const elapsedS = (Date.now() - item.dt) / 1000;
    let elapsedStr = elapsedS.toFixed(2);
    if (elapsedS < 0.1) elapsedStr = elapsedStr.green;
    else if (elapsedS < 0.5) elapsedStr = elapsedStr.yellow;
    else elapsedStr = elapsedStr.bgRed;

    const attempt = `(${item.attempt})`.gray;

    const isProcessing = (
      item.isProcessing ? "processing".yellow : "queued".gray
    ).padStart(10);

    const url = item.request.url;

    return `${elapsedStr} ${attempt} ${isProcessing} ${url}`;
  };

  // Create the load balancer
  const loadBalancer = LoadBalancer.new(config.incoming);

  // Create the main log
  const mainLog = Log.new(getIncomingLogTitle());
  const incomingItemsLog = ObjectLog.new(getIncomingLogTitle(), () =>
    loadBalancer.incomingItems
      .getItems()
      .sort((a: IncomingItem, b: IncomingItem) => b.dt - a.dt)
      .map((item: IncomingItem) => incomingItemToString(item))
  );

  const counterLog = LargeText.new("Requests per minute");
  counterLog.text = "0";

  // Create a log for each node
  const nodeLogs = config.nodes.map((node: any) =>
    Log.new(getNodeLogTitle(node))
  );

  // Create a health bar for each node
  const healthBars = config.nodes.map((node: any, i: number) =>
    Bar.new("", "y")
  );

  // Create the dashboard layout
  const layout = Layout.new();
  // Add the incoming items log and the counter log
  layout.addColumn(Unit.box("0%", "0%", "40%", "48%"), [
    incomingItemsLog,
    counterLog,
  ]);
  // Add the nodes
  layout.addRow(
    Unit.box("40%", "0%", "100%", "50%"),
    [nodeLogs[0], healthBars[0]],
    ["50%", "10%"]
  );
  layout.addRow(
    Unit.box("40%", "50%", "100%", "50%"),
    [nodeLogs[1], healthBars[1]],
    ["50%", "10%"]
  );
  // Add the main log
  layout.addColumn(Unit.box("0%", "50%", "40%", "50%"), [mainLog]);

  console.clear();

  // Render the dashboard
  const renderDashboard = () => {
    layout.render();
    // Set the console window title
    process.title = `${config.title} (${loadBalancer.stats.requests.per.minute.count})`;
  };
  setInterval(renderDashboard, 1000 / 1);

  const checkNodes = () => {
    return;
    const nodes = loadBalancer.getNodes();
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // If the node is unhealthy, restart it
      if (
        node.health.successRate < config.node.restart.health &&
        loadBalancer.getNode(i).process.started <
          Date.now() - config.node.restart.timeout * 60 * 1000
      ) {
        mainLog.log(
          `Node ${i + 1}: Health < ${
            `${Math.round(config.node.restart.health * 100)}%`.bgWhite
          }`.bgRed
        );
        mainLog.log(`Node ${i + 1}: Restarting..`.bgRed);
        //loadBalancer.restartNode(i);
      }
    }
  };

  // Connect the load balancer to the dashboard
  // Log events in the dashboard
  loadBalancer.events.on("log", (data: any) => {
    if (!data.node) {
      mainLog.log(data.text);
      return;
    }

    const log = nodeLogs[data.node.index];
    log.log(data.text);
    return;
  });
  // Update incoming items count in the dashboard
  loadBalancer.events.on("incoming-items", (count: any) => {
    const title = getIncomingLogTitle(
      count,
      loadBalancer.stats.requests.per.second.count,
      loadBalancer.stats.requests.per.minute.count
    );
    mainLog.title = title;
    incomingItemsLog.title = title;
    loadBalancer.stats.requests.per.second.count.toLocaleString();
    counterLog.text =
      loadBalancer.stats.requests.per.minute.count.toLocaleString();
  });
  // Update health check status in the dashboard
  loadBalancer.events.on(
    "node-successRate",
    (index: number, successRate: number) => {
      // Update the node title
      nodeLogs[index].title = getNodeLogTitle(
        loadBalancer.getNode(index),
        successRate
      );
      // Update the node health bar
      healthBars[index].value = successRate;
    }
  );
  // Every minute, check the nodes' health
  setInterval(checkNodes, 60 * 1000);
  // Update the node status (enabled/disabled) in the dashboard
  loadBalancer.events.on("node-enabled", (index: number, enabled: boolean) => {
    nodeLogs[index].options.isDimmed = !enabled;
  });

  // Analytics
  if (config.analytics?.database) {
    (async () => {
      const adb = config.analytics.database;
      const analytics = await Analytics.new(adb.connectionString, adb.dbName);
      // Every minute, track requests/minute and response times in analytics
      const rtpm = loadBalancer.stats.response.times.per.minute;
      setInterval(() => {
        analytics.create(
          "traffic",
          "requests.per.minute",
          loadBalancer.stats.requests.per.minute.count
        );
        analytics.create(
          "traffic",
          "response.time.per.minute.average",
          rtpm.average
        );
      }, 60 * 1000);
    })();
  }

  // Assign keys
  const shift12345678 = "!@#$%^&*";
  mainLog.log("Press [q] to quit");
  mainLog.log("Press [1, 2, ..] to enable/disable nodes");
  mainLog.log("Press shift+[1, 2, ..] to start node processes");
  for (var i = 0; i < config.nodes.length; i++) {
    const char = (i + 1).toString();
    Console.on.key(char, (char: string) =>
      loadBalancer.toggleNodeEnabled(parseInt(char) - 1)
    );
    Console.on.key(shift12345678.charAt(i), async (char: string) => {
      const index = [...shift12345678].findIndex((c) => c == char);
      loadBalancer.restartNode(index);
    });
  }
  // If [esc] is pressed, stop the load balancer
  Console.on.key("q", () => {
    process.exit();
  });

  const syncNodeVersions = async (masterNode: any, cloneNode: any) => {
    const masterFolder = path.dirname(
      masterNode.process.path || masterNode.process
    );
    const nodeFolder = path.dirname(
      cloneNode.process.path || cloneNode.process
    );
    // Sync the node folder with the master node folder
    if (masterFolder == nodeFolder) return;
    mainLog.log(`Syncing ${masterNode.name.green} <- ${cloneNode.name.yellow}`);

    await Files.SyncFolders(
      masterFolder,
      nodeFolder,
      {
        exclude: config.sync.exclude || [],
      },
      true,
      (progress, message) => {
        if (message) mainLog.log(message);
      }
    );
  };

  // Create nodes from the config in the load balancer
  for (const node of config.nodes) {
    await syncNodeVersions(config.nodes[0], node);
    // Add the node
    loadBalancer.addNode(node);
  }

  // Set the console window title
  process.title = config.title;

  // Start the load balancer
  loadBalancer.start();
})();
