import path from "path";
import "@shared/Extensions";
import { Types } from "@shared/Types";
import { Configuration } from "@shared/Configuration";
import { Files } from "@shared/Files";
import { EmptyLogger, MultiLogger, FileSystemLogger } from "@shared/Logger";
import { Analytics } from "@shared/Analytics";
import { Database } from "@shared/Database/Database";
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
  const configObj = await Configuration.new({
    quitIfChanged: [__filename.replace(".temp.ts", "")],
    toAbsolutePaths: ["process"],
    types: Types,
  });

  const config = configObj.data;

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
    return `${title} ─ (${items.severify(10, 30, "<")} ${
      `reqs`.gray
    }) (${countPerSecond}${`/s`.gray}) (${countPerMinute}${`/m`.gray})`;
  };

  const getNodeLogTitle = (node: any, successRate?: number) => {
    return `${node.name} ─ ${`${node.address.host.yellow}:${
      node.address.port.toString().green
    }`} (${
      successRate ? successRate.unitifyPercent().severify(0.9, 0.8, ">") : ""
    })`;
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
  const mainConsoleLog = Log.new(getIncomingLogTitle());
  const incomingItemsLog = ObjectLog.new(getIncomingLogTitle(), () =>
    loadBalancer.incomingItems
      .getItems()
      .sort((a: IncomingItem, b: IncomingItem) => b.dt - a.dt)
      .map((item: IncomingItem) => incomingItemToString(item))
  );

  // Create a file system logger
  const fsLog = !config.log?.enabled
    ? EmptyLogger.new()
    : FileSystemLogger.new(config.log.path);

  if (fsLog instanceof EmptyLogger) {
    mainConsoleLog.log(
      `File system logging is disabled. To enable it, set ${
        `log.enabled`.yellow
      } to ${`true`.yellow} and ${"log.path".yellow} in ${configObj.configPaths
        .map((cp) => cp.toShortPath())
        .join(" or ")}`
    );
  } else {
    mainConsoleLog.log(`Logging to ${`${config.log.path.toShortPath()}`}`);
  }

  // Main logger logs to console and file system (if enabled)
  const mainLog = MultiLogger.new([mainConsoleLog, fsLog]);

  mainLog.log(
    `Configuration loaded from ${configObj.configPaths
      .map((cp) => cp.toShortPath())
      .join(", ")}`
  );

  const counterLog = LargeText.new("Requests per minute");
  counterLog.text = "0";

  // Create a log for each node
  const nodeLogs = config.nodes.map((node: any) =>
    Log.new(getNodeLogTitle(node), { breakLines: false })
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
  layout.addColumn(Unit.box("0%", "50%", "40%", "50%"), [mainConsoleLog]);

  console.clear();

  // Render the dashboard
  const renderDashboard = () => {
    layout.render();
    // Set the console window title
    process.title = `${config.title} (${loadBalancer.stats.requests.per.minute.count})`;
  };
  setInterval(renderDashboard, 1000 / 1);

  const checkNodesAgain = async (interval: number) => {
    const nodes = loadBalancer.getNodes();
    if (config.node.restart.enabled) {
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
              `${Math.round(config.node.restart.health * 100)}%`.bgWhite.black
            }`.bgRed
          );
          mainLog.log(`Node ${i + 1}: Restarting..`.bgRed);

          await syncNodeVersions(config.nodes[0], config.nodes[i]);
          loadBalancer.restartNode(i);
        }
      }
    }
    setTimeout(checkNodesAgain, interval);
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
    mainConsoleLog.title = title;
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
      // Update the average health bar
      const averageHealth =
        healthBars.reduce(
          (sum: number, bar: Bar) => sum + (bar.value || 0),
          0
        ) / healthBars.length;
      counterLog.color = averageHealth
        .getSeverityColor(0.8, 0.5, ">")
        .replace("green", "white");
    }
  );
  // Check the nodes' health periodically
  const interval = 10 * 1000;
  setTimeout(() => {
    checkNodesAgain(interval);
  }, interval);
  // Update the node status (enabled/disabled) in the dashboard
  loadBalancer.events.on("node-enabled", (index: number, enabled: boolean) => {
    nodeLogs[index].options.isDimmed = !enabled;
  });

  // Analytics
  if (config.analytics?.database) {
    (async () => {
      const analytics = await Analytics.new(
        await Database.new(config.analytics.database)
      );
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
      // Every second, track long running incoming items in analytics
      setInterval(() => {
        const items = loadBalancer.incomingItems
          .getItems()
          .filter((item: IncomingItem) => (Date.now() - item.dt) / 1000 > 5)
          .sort((a: IncomingItem, b: IncomingItem) => b.dt - a.dt)
          .map((item: IncomingItem) => {
            return {
              dt: {
                started: item.dt,
                elapsed: Date.now() - item.dt,
              },
              isProcessing: item.isProcessing,
              attempt: item.attempt,
              url: item.request.url,
            };
          });
        for (const item of items) {
          analytics.create("loadBalancer", "processing", item);
        }
      }, 1000);
    })();
  }

  // Assign keys
  const shift12345678 = "!@#$%^&*";
  mainConsoleLog.log("Press [q] to quit".bgWhite.black);
  mainConsoleLog.log("Press [1, 2, ..] to enable/disable nodes".bgWhite.black);
  mainConsoleLog.log(
    "Press shift+[1, 2, ..] to start node processes".bgWhite.black
  );
  for (var i = 0; i < config.nodes.length; i++) {
    const char = (i + 1).toString();
    Console.on.key(char, (char: string) =>
      loadBalancer.toggleNodeEnabled(parseInt(char) - 1)
    );
    Console.on.key(shift12345678.charAt(i), async (char: string) => {
      const index = [...shift12345678].findIndex((c) => c == char);

      await syncNodeVersions(config.nodes[0], config.nodes[index]);
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
    //mainLog.log(`Syncing ${masterNode.name.green} <- ${cloneNode.name.yellow}`);

    await Files.syncFolders(
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

  // Master node
  const masterNode = config.nodes[0];

  // Create nodes from the config in the load balancer
  for (const [index, node] of config.nodes.entries()) {
    await syncNodeVersions(masterNode, node);
    // Add the node
    loadBalancer.addNode(node);
  }

  // Watch the master node folder for changes
  const nodeFolder = path.dirname(
    masterNode.process.path || masterNode.process
  );
  Files.watch(
    [nodeFolder],
    { recursive: true, exclude: config.sync.exclude },
    async (paths) => {
      for (const [index, node] of config.nodes.entries()) {
        if (index == 0) continue;
        mainLog.log(`Syncing ${node.name.yellow} <- ${masterNode.name.green}`);
        await syncNodeVersions(masterNode, node);
      }
      mainLog.log(`Not restarting node (temporarily disabled)`);
      //loadBalancer.restartNode(node.index);
    },
    (message) => mainLog.log(message)
  );

  // Set the console window title
  process.title = config.title;

  // Start the load balancer
  loadBalancer.start();
})();
