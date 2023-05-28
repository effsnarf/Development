import path from "path";
import "@shared/Extensions";
import { Objects } from "@shared/Extensions.Objects";
import { Types } from "@shared/Types";
import { Configuration } from "@shared/Configuration";
import { Timer } from "@shared/Timer";
import { Files } from "@shared/Files";
import { Logger } from "@shared/Logger";
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
    countPerMinute: number = 0
  ) => {
    const title = config.title;
    // const title = `${
    //   config.title
    // } ─ ${config.incoming.address.stringifyAddress()}`;
    const items = count;
    return `${title} ─ (${
      `uptime`.gray
    } ${uptime.elapsed?.unitifyTime()}) (${items.severify(10, 30, "<")} ${
      `reqs`.gray
    }) (${countPerSecond}${`/s`.gray}) (${countPerMinute}${`/m`.gray})`;
  };

  const getNodeLogTitle = (node: any, successRate?: number) => {
    return `${node.name} ─ ${`${node.address.host.yellow}:${
      node.address.port.toString().green
    }`} (${
      successRate ? successRate?.unitifyPercent().severify(0.9, 0.8, ">") : ""
    })`;
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
  const loadBalancer = await LoadBalancer.new(config.incoming);

  // #region Dashboard

  // #region Dashboard setup

  // Create the main log
  const mainConsoleLog = Log.new(config.title);
  const mainLog = mainConsoleLog;
  const incomingItemsLog = ObjectLog.new(config.title, () =>
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
  const fsLog = Logger.new(config.log);

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
    fsLog.log(...args);
  }) as any;

  // Log all node output to the file system
  if (config.log?.requests?.min.ms) {
    nodeLogs.forEach((nodeLog: Log, index: number) => {
      Objects.on(nodeLog, nodeLog.log, (...args: any[]) => {
        const ms = args
          .find((a) => a?.getUnitClass()?.name == "Time")
          ?.deunitifyTime();
        if (ms && ms < config.log.requests.min.ms) return;
        //fsLog.log(...[config.nodes[index].name, ...args]);
      });
    });
  }

  // Log unhandled errors
  process.on("uncaughtException", async (ex: any) => {
    fsLog.log(`Uncaught exception:`, ex.stack);
    await fsLog.flush();
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
  layout1.addColumn(Unit.box("30%", "0%", "20%", "100%"), [incomingItemsLog]);
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
  layout2.add(Unit.box("0%", "0%", "100%", "100%"), incomingItemsLog);
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
          loadBalancer.restartNode(i);
        }
      }
    }
    setTimeout(checkNodesAgain, interval);
  };
  // Log events in the dashboard
  loadBalancer.events.on("log", (data: any) => {
    if (!data.text && !data.texts) {
      fsLog.log(data);
      return;
    }

    const log = (data.node ? nodeLogs[data.node.index] : mainLog) as Log;
    log.log(...(data.texts || [data.text]));
    fsLog.log(...(data.texts || [data.text]));
  });
  loadBalancer.events.on("error", (ex: any) => {
    fsLog.log(ex.stack);
  });
  // Update incoming items count in the dashboard
  loadBalancer.events.on("incoming-items", (count: any) => {
    const title = getMainTitle(
      count,
      loadBalancer.stats.requests.per.second.count,
      loadBalancer.stats.requests.per.minute.count
    );
    counterLog.title = title;
    loadBalancer.stats.requests.per.second.count.toLocaleString();
    counterLog.text =
      loadBalancer.stats.requests.per.minute.count.toLocaleString();
    incomingItemsLog.title = `${loadBalancer.incomingItems.getItems().length}`;
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
  // #endregion

  // #endregion

  // #region Analytics
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
      setInterval(async () => {
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
  // #endregion

  // #region ⌨ Console keys

  // Assign keys
  const shift12345678 = "!@#$%^&*";
  mainConsoleLog.log("Press [q] to quit".bgWhite.black);
  mainConsoleLog.log("Press [`] to switch layouts".bgWhite.black);
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
