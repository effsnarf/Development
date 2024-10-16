import path from "path";
import "@shared/Extensions";
import { Objects } from "@shared/Extensions.Objects";
import { Types } from "@shared/Types";
import { Configuration } from "@shared/Configuration";
import { System } from "@shared/System";
import { Timer } from "@shared/Timer";
import { Files } from "@shared/Files";
import { Logger } from "@shared/Logger";
import { MultiCache, MemoryCache } from "@shared/Cache";
import { Analytics, ItemType } from "@shared/Analytics";
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

let cacheQueueSize = 0;

(async () => {
  // #region Configuration
  const configObj = await Configuration.new({
    quitIfChanged: [path.resolve("../../../Shared/LoadBalancer.ts")],
    toAbsolutePaths: ["process"],
    types: Types,
  });

  const config = configObj.data;

  // #endregion

  // #region Helper functions
  const uptime = Timer.start();

  const getMainTitle = (
    count: number = 0,
    countPerSecond: number = 0,
    countPerMinute: number = 0,
    memoryCacheItems: number = 0
  ) => {
    const title = config.title;
    // const title = `${
    //   config.title
    // } ─ ${config.incoming.address.stringifyAddress()}`;
    const items = count;
    return `${title} ─ ${
      `up`.gray
    }${uptime.elapsed?.unitifyTime()} ${items.severify(10, 30, "<")}${
      `rq`.gray
    } ${
      `cpu`.gray
    }${System.usage.cpu.unitifyPercent()} ${System.usage.memory.unitifySize()} ${
      `mc`.gray
    }${memoryCacheItems} ${`cq`.gray}${cacheQueueSize}`;
  };

  const getNodeLogTitle = (
    node: any,
    successRate: number = 0,
    elapsedAverage: number = 0
  ) => {
    elapsedAverage = Math.round(elapsedAverage);
    const elapsedAverageStr = elapsedAverage
      .unitifyTime()
      .severify(
        ...(config.incoming.severity.time as [number, number, "<" | ">"])
      );

    return `${node.name} ─ ${`${node.address.host.yellow}:${
      node.address.port.toString().green
    }`} ${successRate?.toProgressBar(30, 0.9, 0.8, ">")}${
      `───`.gray
    }${elapsedAverageStr}`;
  };

  const incomingItemToStrings = (item: IncomingItem) => {
    const elapsedStr = (Date.now() - item.dt)
      .unitifyTime()
      .severify(
        ...(config.incoming.severity.time as [number, number, "<" | ">"])
      );

    const attempt = `${item.attempt.ordinalize()}`;

    const isProcessing = (
      item.isProcessing ? "processing".yellow : "queued".gray
    ).padStart(10);

    const url = item.request.url;

    return [
      `${elapsedStr} ${attempt} ${isProcessing} ${url}`,
      ...item.infos.map((info) => `  ${info}`),
    ];
  };
  // #endregion

  // Create the load balancer
  const loadBalancer = await LoadBalancer.new({
    title: config.title,
    ...config.incoming,
  });

  Objects.on(
    loadBalancer.cache?.health,
    "successRate",
    (successRate: number) => {
      cacheLog.title = `Cache ${successRate.toProgressBar(30, 0.8, 0.6, ">")}`;
    }
  );

  // #region Dashboard

  // #region Dashboard setup

  // Create the main log
  const mainConsoleLog = Log.new(config.title);
  const mainLog = mainConsoleLog;
  const cacheLog = Log.new("Cache", {
    columns: [4, 3, 6, 6],
    breakLines: false,
    extraSpaceForBytes: true,
  });
  const processedItemsLog = ObjectLog.new(config.title, () =>
    loadBalancer.incomingItems
      .getItems()
      .sort((a: IncomingItem, b: IncomingItem) => a.dt - b.dt)
      .flatMap((item: IncomingItem) => incomingItemToStrings(item))
  );

  if (config.incoming.cache) {
    mainConsoleLog.log(
      ...["Cache:", ...Objects.yamlify(config.incoming.cache).split("\n")]
    );
  } else {
    mainConsoleLog.log("No cache");
  }

  // Log the start of the app
  mainConsoleLog.log(`Starting ${config.title}...`);

  mainLog.log(
    `Configuration loaded from ${configObj.configPaths
      .map((cp) => cp.toShortPath())
      .join(", ")}`
  );

  if (configObj.nextRestartTime) {
    mainLog.log(
      `Next restart at ${
        configObj.nextRestartTime.toLocaleTimeString().bgRed
      } (${`every`.gray} ${config.process.restart.periodically.every})`
    );
  }

  const counterLog = LargeText.new("Requests per minute");
  counterLog.text = "0";

  // Create a log for each node
  const nodeLogs = config.nodes.map((node: any) =>
    Log.new(getNodeLogTitle(node), {
      columns: [4, 3, 6, 6],
      breakLines: false,
      extraSpaceForBytes: true,
    })
  ) as Log[];

  // #region 📃 Logging

  // Create a file system logger
  const debugLog = Logger.new(config.log);
  debugLog.log(`Configuration loaded from ${configObj.configPaths.join(", ")}`);
  debugLog.log(Objects.yamlify(config));

  if (config.log?.enabled) {
    mainConsoleLog.log(`Logging to ${`${config.log.path.toShortPath()}`}`);
  } else {
    mainConsoleLog.log(
      `File system logging is disabled. To enable it, set ${
        `log.enabled`.yellow
      } to ${`true`.yellow} and ${"log.path".yellow} in ${configObj.configPaths
        .map((cp) => cp.toShortPath())
        .join(" or ")}`
    );
  }

  // Log all console output to the file system
  Objects.on(mainConsoleLog, mainConsoleLog.log, (...args: any[]) => {
    debugLog.log(...args);
  }) as any;

  // Log all node output to the file system
  if (config.log?.requests?.min.ms) {
    nodeLogs.forEach((nodeLog: Log, index: number) => {
      Objects.on(nodeLog, nodeLog.log, (...args: any[]) => {
        const ms = args
          .find((a) => a?.getUnitClass()?.name == "Time")
          ?.deunitify();
        if (ms && ms < config.log.requests.min.ms) return;
        //fsLog.log(...[config.nodes[index].name, ...args]);
      });
    });
  }

  // Log unhandled errors
  process.on("uncaughtException", async (ex: any) => {
    mainLog.log(`Uncaught exception:`, ex.stack.bgRed);
    debugLog.log(`Uncaught exception:`, ex.stack);
    await debugLog.flush();
  });

  // #endregion

  // Create a health bar for each node
  const healthBars = config.nodes.map((node: any, i: number) =>
    Bar.new("", "y")
  );

  // #endregion

  // #region Create the dashboard layout
  const layouts: Layout[] = [];
  const layout1 = Layout.new();
  // Add the counter log
  layout1.addColumn(Unit.box("0%", "0%", "30%", "28%"), [counterLog]);
  // Add the incoming items log
  layout1.addRow(Unit.box("30%", "0%", "20%", "100%"), [cacheLog]);
  // Add the nodes
  layout1.addRow(
    Unit.box("50%", "0%", "50%", "50%"),
    [nodeLogs[0], healthBars[0]],
    ["40%", "10%"]
  );
  layout1.addRow(
    Unit.box("50%", "50%", "50%", "50%"),
    [nodeLogs[1], healthBars[1]],
    ["40%", "10%"]
  );
  // Add the main log
  layout1.addColumn(Unit.box("0%", "30%", "30%", "70%"), [mainConsoleLog]);
  // Alternative dashboard layout
  const layout2 = Layout.new();
  layout2.addColumn(Unit.box("0%", "0%", "100%", "100%"), [
    cacheLog,
    processedItemsLog,
  ]);
  // Layout selection
  layouts.push(layout1, layout2);
  let selectedLayoutIndex = 0;
  // #endregion

  // #region Render the dashboard
  console.clear();

  const renderDashboard = () => {
    layouts[selectedLayoutIndex].render();
    // Set the console window title
    process.title = `${config.title} (${loadBalancer.stats.requests.per.minute.count})`;
  };
  setInterval(renderDashboard, 1000 / 1);
  // #endregion

  // #region Connect load balancer events to the dashboard
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
          //loadBalancer.sendRestartSignal(i);
        }
      }
    }
    setTimeout(checkNodesAgain, interval);
  };
  // Log events in the dashboard
  loadBalancer.events.on("log", (data: any) => {
    if (!data.text && !data.texts) {
      debugLog.log(data);
      return;
    }

    if (data.type) {
      if (data.type == "cache") {
        cacheLog.log(...(data.texts || [data.text]));
        return;
      }
      throw new Error(`Unknown log type: ${data.type}`);
    }

    const log = (data.node ? nodeLogs[data.node.index] : mainLog) as Log;
    log.log(...(data.texts || [data.text]));
    debugLog.log(...(data.texts || [data.text]));
  });
  loadBalancer.events.on("error", (ex: any) => {
    debugLog.log(ex.stack);
  });
  // Update incoming items count in the dashboard
  loadBalancer.events.on("incoming-items", (count: any) => {
    const memoryCache = (loadBalancer.cache as MultiCache).caches.find(
      (c) => c instanceof MemoryCache
    ) as MemoryCache;

    const title = getMainTitle(
      count,
      loadBalancer.stats.requests.per.second.count,
      loadBalancer.stats.requests.per.minute.count,
      memoryCache?.count
    );
    counterLog.title = title;
    counterLog.text =
      loadBalancer.stats.requests.per.minute.count.toLocaleString();
    processedItemsLog.title = `${loadBalancer.incomingItems.getItems().length}`;
  });
  loadBalancer.events.on("cache-queue", (count: any) => {
    cacheQueueSize = count;
  });
  // Update health check status in the dashboard
  loadBalancer.events.on(
    "node-success-rate",
    (index: number, successRate: number) => {
      // Update the node title
      nodeLogs[index].title = getNodeLogTitle(
        loadBalancer.getNode(index),
        successRate,
        loadBalancer.getNode(index).health.average
      );
      // Update the node health bar
      healthBars[index].value = successRate;
      // Update the average health bar
      const averageHealth =
        healthBars.reduce(
          (sum: number, bar: Bar) => sum + (bar.value || 0),
          0
        ) / healthBars.length;
      //counterLog.color = "white";
    }
  );
  loadBalancer.events.on(
    "node-elapsed-average",
    (index: number, elapsedAverage: number) => {
      nodeLogs[index].title = getNodeLogTitle(
        loadBalancer.getNode(index),
        loadBalancer.getNode(index).health.successRate,
        elapsedAverage
      );
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
    healthBars[index].options.isDimmed = !enabled;
  });
  // #endregion

  // #endregion

  // #region ⌨ Console keys

  // Assign keys
  const shift12345678 = "!@#$%^&*";
  mainConsoleLog.log("Press [q] to quit".bgWhite.black);
  mainConsoleLog.log("Press [`] to switch layouts".bgWhite.black);
  mainConsoleLog.log("Press [1, 2, ..] to enable/disable nodes".bgWhite.black);
  mainConsoleLog.log(
    "Press shift+[1, 2, ..] to send restart signal".bgWhite.black
  );
  for (var i = 0; i < config.nodes.length; i++) {
    const char = (i + 1).toString();
    Console.on.key(char, (char: string) =>
      loadBalancer.toggleNodeEnabled(parseInt(char) - 1)
    );
    Console.on.key(shift12345678.charAt(i), async (char: string) => {
      const index = [...shift12345678].findIndex((c) => c == char);

      await syncNodeVersions(config.nodes[0], config.nodes[index]);
      mainLog.log(`Restarting node ${index + 1}..`);
      await loadBalancer.sendRestartSignal(index);
    });
  }
  // If [q] is pressed, stop the load balancer
  Console.on.key("q", () => {
    mainLog.log(`Quitting..`);
    renderDashboard();
    process.exit();
  });

  // If [`] is pressed, switch layouts
  Console.on.key("`", () => {
    selectedLayoutIndex = (selectedLayoutIndex + 1) % layouts.length;
  });

  // #endregion

  // #region 🔄 Synching nodes

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

  // #endregion

  // Set the console window title
  process.title = config.title;

  // Start the load balancer
  loadBalancer.start();
})();
