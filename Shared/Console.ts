import { exec } from "child_process";
import * as jsyaml from "js-yaml";

// Replaces console.log()
// Shows timestamps, etc

const readline = require("readline");
const cfonts = require("cfonts");
import * as util from "util";
import "colors";
import "./Extensions";

class Unit {
  public readonly percentage: number;

  constructor(
    percentage: number | null,
    chars: number | null,
    public readonly direction: "x" | "y"
  ) {
    if (percentage != null) {
      if (percentage < 0 || percentage > 100)
        throw new Error(
          `Percentage must be between 0 and 100 (was ${percentage})`
        );
      this.percentage = percentage;
    } else if (chars != null) {
      if (chars < 0 || chars > this.windowSize[this.dir])
        throw new Error(
          `Chars must be between 0 and ${
            this.windowSize[this.dir]
          } (was ${chars})`
        );
      this.percentage = Math.round((chars * 100) / this.windowSize[this.dir]);
    } else {
      throw new Error("Either percentage or chars must be set");
    }
  }

  get chars() {
    return Math.round((this.windowSize[this.dir] * this.percentage) / 100);
  }

  private get dir() {
    return this.direction === "x" ? "width" : "height";
  }

  private get windowSize() {
    return Console.getWindowSize();
  }

  static percent(percentage: number, direction: "x" | "y") {
    return new Unit(percentage, null, direction);
  }

  static chars(chars: number, direction: "x" | "y") {
    return new Unit(null, chars, direction);
  }

  // Convert a string like "50%" to a Unit object
  static parse(s: string, direction: "x" | "y") {
    const percentage = parseInt(s.replace("%", ""));
    return new Unit(percentage, null, direction);
  }

  // Convert a string like "50%" or a Unit object to a Unit object
  static from(s: number | string | Unit, direction: "x" | "y") {
    if (typeof s === "number") return new Unit(null, s, direction);
    if (typeof s === "string") return Unit.parse(s, direction);
    return s;
  }

  static box(x: string, y: string, width: string, height: string) {
    return {
      x: Unit.from(x, "x"),
      y: Unit.from(y, "y"),
      width: Unit.from(width, "x"),
      height: Unit.from(height, "y"),
    };
  }

  toString() {
    return `${this.percentage}% (${this.direction})`;
  }
}

interface Box {
  x: Unit;
  y: Unit;
  width: Unit;
  height: Unit;
}

interface ConsoleOptions {
  isDimmed: boolean;
}

interface DrawOptions {
  border: boolean;
}

abstract class ConsoleElement {
  options: ConsoleOptions = {
    isDimmed: false,
  };

  constructor(public title: string, public status?: string) {}

  async render(box: Box) {
    await this._render(box.x, box.y, box.width, box.height);
  }

  private async _render(
    _x: string | Unit,
    _y: string | Unit,
    _width: string | Unit,
    _height: string | Unit
  ) {
    const x = Unit.from(_x, "x");
    const y = Unit.from(_y, "y");
    const width = Unit.from(_width, "x");
    const height = Unit.from(_height, "y");

    const lines = await this.draw(width, height);

    // Draw the lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      Console.moveCursorTo(x.chars, y.chars + i);
      console.log(line);
    }
  }

  // Width and height are in percentage
  async draw(
    width: string | Unit,
    height: string | Unit,
    options: DrawOptions = { border: true }
  ): Promise<string[]> {
    width = Unit.from(width, "x");
    height = Unit.from(height, "y");

    if (!options.border) return this._draw(width, height);

    const innerWidth = Unit.from(width.chars - 4, "x");
    const innerHeight = Unit.from(height.chars - 2, "y");
    // Draw the element
    let lines = await this._draw(innerWidth, innerHeight);
    // Make sure that the total length of the line is no more than the available width
    lines = lines.map((line) => line?.truncate(innerWidth.chars));
    // Make sure that the total number of lines is no more than the available height
    lines = lines.slice(0, innerHeight.chars);
    // We surround the element with a box
    // The top line of the box contains the title
    const titleLine = this.getTitleLine(innerWidth);
    // The bottom line of the box is a line
    const statusLine = this.getStatusLine(innerWidth);
    // Pad with empty lines
    while (lines.length < innerHeight.chars) lines.push("");
    // Pad the lines with spaces
    lines = lines.map((line) => {
      const content = `${line}${
        " ".repeat(Math.max(0, innerWidth.chars - line.getCharsCount())).white
      }`.truncate(innerWidth.chars);
      return `${`│`.gray} ${content} ${`│`.gray}`;
    });

    // Add the title and bottom line to the lines
    lines.unshift(titleLine);
    lines.push(statusLine);

    // Dim the lines if needed
    if (this.options.isDimmed)
      lines = lines.map((line) => line.withoutColors().gray);

    // Return the lines
    return lines;
  }

  private getTitleLine(innerWidth: Unit) {
    return this.getTextLine(this.title, innerWidth, "left", "top");
  }

  private getStatusLine(innerWidth: Unit) {
    return this.getTextLine(this.status, innerWidth, "center", "bottom");
  }

  private getTextLine(
    text: string | undefined,
    innerWidth: Unit,
    hPos: "left" | "center" | "right",
    vPos: "top" | "bottom"
  ) {
    if (!text) text = "";
    text = text.truncate(innerWidth.chars - 2);
    const corners =
      vPos == "top"
        ? {
            left: "┌",
            right: "┐",
          }
        : {
            left: "└",
            right: "┘",
          };

    text =
      hPos == "left"
        ? `${text.white}${
            "─".repeat(innerWidth.chars - text.getCharsCount() + 2).gray
          }`
        : hPos == "center"
        ? `${
            "─".repeat(
              Math.floor((innerWidth.chars - text.getCharsCount()) / 2) + 1
            ).gray
          }${text.white}${
            "─".repeat(
              Math.ceil((innerWidth.chars - text.getCharsCount()) / 2) + 1
            ).gray
          }`
        : hPos == "right"
        ? `${"─".repeat(innerWidth.chars - text.getCharsCount() + 2).gray}${
            text.white
          }`
        : "";

    return `${corners.left.gray}${text}${corners.right.gray}`;
  }

  protected abstract _draw(
    w: string | Unit,
    h: string | Unit
  ): Promise<string[]>;
}

interface LogItem {
  dt: number;
  args: any[];
}

type LargeFont = "block" | "simple" | "simpleBlock" | "3d" | "tiny";

class LargeText extends ConsoleElement {
  text: string = "";
  color: string = "system";

  constructor(status: string, public font: LargeFont = "block") {
    super("", status);
  }

  static new(status: string, font: LargeFont = "block") {
    return new LargeText(status, font);
  }

  protected async _draw(
    width: string | Unit,
    height: string | Unit
  ): Promise<string[]> {
    const w = Unit.from(width, "x");
    const h = Unit.from(height, "y");

    if (!this.text?.trim().length) return [];

    const result = cfonts.render(this.text, {
      font: this.font, // define the font face
      align: "left", // define text alignment
      colors: [this.color], // define all colors
      background: "transparent", // define the background color, you can also use `backgroundColor` here as key
      letterSpacing: 1, // define letter spacing
      lineHeight: 1, // define the line height
      space: false, // define if the output text should have empty lines on top and on the bottom
      maxLength: "0", // define how many character can be on one line
      gradient: false, // define your two gradient colors
      independentGradient: false, // define if you want to recalculate the gradient for each new line
      transitionGradient: false, // define if this is a transition between colors directly
      env: "node",
    });

    let lines: string[] = [];
    lines.push("");
    lines.push(...result.string.split("\n"));

    // Center the text by the width
    lines = lines.map((line: string) => {
      const padding = Math.max(
        0,
        Math.floor((w.chars - line.getCharsCount()) / 2)
      );
      return `${" ".repeat(padding)}${line}`;
    });

    return lines;
  }
}

class Bar extends ConsoleElement {
  private _value: number | undefined;

  get value() {
    return this._value;
  }
  set value(value: number | undefined) {
    this._value = value;
    this.status = `${value?.unitifyPercent() || ""}`;
  }

  constructor(
    title: string,
    private direction: "x" | "y",
    value: number | undefined
  ) {
    super(title);
    this.value = value;
  }

  static new(title: string, direction: "x" | "y", value?: number | undefined) {
    return new Bar(title, direction, value);
  }

  protected _draw(
    width: string | Unit,
    height: string | Unit
  ): Promise<string[]> {
    const w = Unit.from(width, "x");
    const h = Unit.from(height, "y");
    return new Promise((resolve) => {
      const lines: string[] = [];
      if (this.value === undefined) {
        lines.push(`?`);
        resolve(lines);
        return;
      }
      if (this.direction === "x") {
        lines.push(`Only vertical bars are implemented for now`);
      } else {
        for (let yi = 0; yi < h.chars; yi++) {
          const iValue = 1 - yi / (h.chars - 1);
          const withinPercent = iValue <= this.value;
          let line = (withinPercent ? "█" : "▒").repeat(w.chars);
          //let line = iValue.toString();
          if (!withinPercent) line = line.gray;
          else {
            if (this.value < 0.8) line = line.red;
            else if (this.value < 0.9) line = line.yellow;
            else line = line.green;
          }
          lines.push(line);
        }
      }
      resolve(lines);
    });
  }
}

interface LogOptions {
  columns: (number | null)[];
  breakLines: boolean;
  extraSpaceForBytes: boolean;
}

class Log extends ConsoleElement {
  private maxItems = 100;
  private items: LogItem[] = [];
  showDate: boolean = true;
  reverseItems: boolean = true;

  constructor(title: string, private readonly logOptions?: LogOptions) {
    super(title);
  }

  static new(
    title: string,
    logOptions: LogOptions = {
      columns: [],
      breakLines: true,
      extraSpaceForBytes: true,
    }
  ) {
    return new Log(title, logOptions);
  }

  log(...args: any[]) {
    if (!args?.filter((a) => a).length) return;
    const item = {
      dt: Date.now(),
      args: args,
    };
    this.items.push(item);
  }

  protected _draw(
    width: string | Unit,
    height: string | Unit
  ): Promise<string[]> {
    width = Unit.from(width, "x");
    height = Unit.from(height, "y");
    return new Promise((resolve) => {
      const lines: string[] = [];
      const items = this.reverseItems ? [...this.items].reverse() : this.items;
      items.forEach((item) => {
        const dt = new Date(item.dt);
        const dtString = `${dt.toLocaleTimeString()}`;
        const dateStr = !this.showDate ? "" : `${dtString.gray} `;
        const args = [...item.args];
        if (this.logOptions?.extraSpaceForBytes) {
          args.forEach((arg, i) => {
            if (typeof arg == "string" && arg?.getUnit({ throw: false }) == "b")
              args[i] = arg + " ";
          });
        }
        const line = `${dateStr}${args.joinColumns(
          this.logOptions?.columns || [],
          false
        )}`;
        lines.push(line);
        // const widthLines = !this.logOptions?.breakLines
        //   ? [line]
        //   : line.splitOnWidth((width as Unit).chars);
        // lines.push(...widthLines);
      });
      resolve(lines);
    });
  }
}

class ObjectLog extends ConsoleElement {
  constructor(title: string, private readonly getData: () => any) {
    super(title);
  }

  static new(title: string, getData: () => any) {
    return new ObjectLog(title, getData);
  }

  protected _draw(
    width: string | Unit,
    height: string | Unit
  ): Promise<string[]> {
    return (async () => {
      const log = await this.getLogElement();
      return log.draw(width, height, { border: false });
    })();
  }

  private async getLogElement() {
    const data = await this.getData();
    const log = Log.new(this.title);
    log.showDate = false;
    log.reverseItems = false;
    if (Array.isArray(data)) {
      data.forEach((item) => log.log(item));
    } else {
      const yaml = jsyaml.dump(data);
      yaml
        .split("\n")
        .reverse()
        .map((line) => line.gray)
        .forEach((line) => log.log(line));
    }
    return log;
  }
}

interface LayoutItem {
  box: Box;
  element: ConsoleElement;
}

class Layout {
  public items: LayoutItem[] = [];

  private constructor() {}

  static new() {
    return new Layout();
  }

  add(box: Box, element: ConsoleElement) {
    this.items.push({ box, element });
  }

  addRow(
    box: Box,
    elements: ConsoleElement[],
    sizes: (number | string | Unit)[] = []
  ) {
    this.addRowOrColumn(box, elements, sizes, "x");
  }

  addColumn(
    box: Box,
    elements: ConsoleElement[],
    sizes: (number | string | Unit)[] = []
  ) {
    this.addRowOrColumn(box, elements, sizes, "y");
  }

  private addRowOrColumn(
    box: Box,
    elements: ConsoleElement[],
    sizes: (number | string | Unit)[] = [],
    direction: "x" | "y"
  ) {
    const otherDirection = direction === "x" ? "y" : "x";
    const directionSize = direction === "x" ? "width" : "height";
    const otherDirectionSize = direction === "x" ? "height" : "width";
    if (!sizes?.length)
      sizes = Array(elements.length).fill(
        box[directionSize].chars / elements.length
      );
    if (elements.length !== sizes.length)
      throw new Error("The number of elements and widths must be equal");
    const unitSizes = sizes.map((w) => Unit.from(w, "x"));
    elements.forEach((element, index) => {
      const start = Unit.from(
        box[direction].chars +
          unitSizes
            .slice(0, index)
            .map((s) => s.chars)
            .sum(),
        direction
      );
      const itemBox = {} as any;
      itemBox[direction] = start;
      itemBox[otherDirection] = box[otherDirection];
      itemBox[directionSize] = unitSizes[index];
      itemBox[otherDirectionSize] = box[otherDirectionSize];
      this.add(itemBox, element);
    });
  }

  async render() {
    for (const item of this.items) await item.element.render(item.box);
  }
}

class Console2 {
  private redrawsPerSecond = 4;
  private isRefreshing = false;
  private elements: ConsoleElement[] = [];

  add(element: ConsoleElement) {
    this.elements.push(element);
  }

  start() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    this.redraw();
  }

  stop() {
    this.isRefreshing = false;
  }

  private async redraw() {
    await this.draw();
    if (this.isRefreshing)
      setTimeout(this.redraw.bind(this), 1000 / this.redrawsPerSecond);
  }

  private async draw() {
    for (const el of this.elements) {
    }
  }
}

class Console {
  private redrawPerSecond = 1;

  private headerItems: string[] = [];
  private header2Items: string[] = [];
  private items: any[] = [];

  private constructor() {
    setInterval(() => {
      this.redraw();
    }, 1000 / this.redrawPerSecond);
  }

  static new() {
    return new Console();
  }

  private static _on = {
    _keyHandlers: new Map(),
    _lineHandlers: new Map(),
  };

  static on = {
    _initialized: false,
    _init: () => {
      readline.emitKeypressEvents(process.stdin);
      readline
        .createInterface({
          input: process.stdin,
          output: process.stdout,
        })
        .on("line", (line: string) => {
          const handlers = [...Console._on._lineHandlers.values()].flatMap(
            (h) => h
          );
          handlers.forEach((handler: any) => handler(line));
        });
      process.stdin.setRawMode(true);
      process.stdin.on("keypress", (key) => {
        const handlers = Console._on._keyHandlers.get(key);
        if (handlers) handlers.forEach((handler: any) => handler(key));
      });
      Console.on._initialized = true;
    },
    key: (key: string, callback: (key: string) => void) => {
      if (!Console.on._initialized) Console.on._init();
      const handlers = Console._on._keyHandlers.get(key) || [];
      handlers.push(callback);
      Console._on._keyHandlers.set(key, handlers);
    },
    line: (cbKey: any, callback: (line: string) => void) => {
      if (!Console.on._initialized) Console.on._init();
      const handlers = Console._on._lineHandlers.get(cbKey) || [];
      handlers.push(callback);
      Console._on._lineHandlers.set(cbKey, handlers);
    },
  };

  static off = {
    line: (cbKey: any) => {
      Console._on._lineHandlers.delete(cbKey);
    },
  };

  static readLines(question: string) {
    return new Promise<string>((resolve) => {
      const cbKey = Date.now();
      const lines: string[] = [];
      console.log(question.green);
      console.log(
        `${`(type`.gray} ${`double enter`} ${`to finish)`.gray}`.gray
      );
      console.log();
      Console.on.line(cbKey, (line: string) => {
        lines.push(line);
        if (
          lines.length > 2 &&
          [...lines].reverse().take(2).join("").length === 0
        ) {
          console.log();
          Console.off.line(cbKey);
          return resolve(lines.join("\n").trim());
        }
      });
    });
  }

  static execute(
    command: string,
    directory: string,
    throwIfError = true,
    timeout = 5000
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        cwd: directory,
        timeout: timeout, // Set the timeout here
      };

      exec(command, options, (error: any, stdout: any, stderr: any) => {
        if (error) {
          if (error.code === "ETIMEDOUT") {
            reject(new Error("Command execution timed out"));
          } else if (throwIfError) {
            reject(error);
          } else {
            resolve(error.message || error);
          }
        } else {
          resolve(stdout);
        }
      });
    });
  }

  static moveCursorTo(x: number, y: number) {
    x = Math.round(x);
    y = Math.round(y);
    process.stdout.write(`\u001b[${y + 1};${x}H`);
  }

  static moveCursorUp(lines: number = 1) {
    process.stdout.write(`\u001b[${lines}A`);
  }

  header(...items: string[]) {
    for (const item of items) this.headerItems.push(item);
  }

  header2(...items: string[]) {
    for (const item of items) this.header2Items.push(item);
  }

  log(...args: any[]) {
    // Make sure log never exceeds [maxItems] items
    // Get the height of the window in lines
    const maxItems =
      process.stdout.getWindowSize()[1] - this.headerItems.length - 3;
    // Remove the oldest items until the number of items is less than the max
    while (this.items.length > maxItems) this.items.shift();

    const item = {
      dt: Date.now(),
      args: args,
    };
    this.items.push(item);
  }

  error(...args: any[]) {
    for (const arg of args) {
      this.log(...Console.objectToLines(arg).map((line) => line.bgRed));
    }
  }

  static getWindowSize() {
    const window = process.stdout.getWindowSize();
    return {
      width: window[0],
      height: window[1] - 4,
    };
  }

  static percentToChars(percent: number, direction: "x" | "y") {
    const window = Console.getWindowSize();
    const size = direction == "x" ? window.width : window.height;
    return Math.round((size * percent) / 100);
  }

  // Returns util.inspect(obj) with colors, or obj.toString() if it's a string
  // Also, if the result has multiple lines, it will be split into an array of lines
  static objectToLines(obj: any): string[] {
    let str =
      typeof obj == "string"
        ? obj
        : require("util").inspect(obj, { colors: true });
    // Split the string into lines
    const lines = str.split("\r");
    return lines;
  }

  redraw() {
    console.clear();

    const window = Console.getWindowSize();

    // Print the header
    this.headerItems.forEach((item) => {
      console.log(item);
    });

    // Print an empty line
    console.log();

    // Print the items
    [...this.items].reverse().forEach((item) => {
      const dt = new Date(item.dt);
      const dtString = `${dt.toLocaleTimeString()}`;
      // Make sure that the total length of the line is no more than the available width
      const args = this.truncate(item.args, window.width - dtString.length);
      console.log(`${dtString.gray}`, ...args);
    });

    // Header2 is drawn in the top right corner, not reversed
    // For each line, first we calculate the starting position, which is the width of the window minus the length of the longest line
    // Then we print the line at that position
    // We also draw a box (empty spaces) below the header2 lines

    // First, get the dimensions of the box
    const boxWidth = !this.header2Items.length
      ? 0
      : Math.max(
          ...this.header2Items.map((item) => {
            // .length won't work because of the colors
            return item.replace(/\x1b\[[0-9;]*m/g, "").length + 1;
          })
        );
    const boxHeight = this.header2Items.length;
    // Next, draw the box (lines of empty spaces)
    for (let y = 1; y <= boxHeight + 1; y++) {
      // Bounding box
      if (y == 1 || y == boxHeight + 1) {
        console.log(
          `\x1b[${y};${window.width - boxWidth}f${
            " ".repeat(boxWidth + 2).gray
          }`
        );
        continue;
      }
      const x = window.width - boxWidth;
      console.log(
        `\x1b[${y};${x}f${" ".gray}${" ".repeat(boxWidth - 1)}${" ".gray}`
      );
    }

    // Draw the header2 lines
    let y = 1;
    this.header2Items.forEach((item) => {
      const x = window.width - boxWidth;
      // Place the cursor at the starting position (x, y), then print the line
      console.log(`\x1b[${y + 1};${x + 1}f${item}`);
      y++;
    });

    // Put the cursor at the bottom of the screen
    console.log(`\x1b[${window.height - 1};${0}f`);
  }

  truncate(args: any[], maxLength: number) {
    const length = 0;
    const result = [];
    for (const arg of args) {
      const argString = arg.toString();
      if (length + argString.length > maxLength) {
        result.push(argString.substring(0, maxLength - length));
        break;
      }
      result.push(arg);
    }
    return result;
  }
}

export { Console, Layout, Log, ObjectLog, LargeText, Bar, Unit };
