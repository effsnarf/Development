// #region UnitClass, Type, Size, Percentage, color
interface UnitClass {
  units: string[];
  unitToValue: { [key: string]: number };
  prevUnit(unit: string): string;
  nextUnit(unit: string): string;
}

class Time {
  static readonly units: string[] = [
    "ms",
    "s",
    "m",
    "h",
    "d",
    "w",
    "M",
    "y",
    "decade",
    "century",
  ];

  static readonly unitToValue: { [key: string]: number } = {
    ms: 1,
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
    w: 1000 * 60 * 60 * 24 * 7,
    M: 1000 * 60 * 60 * 24 * 30,
    y: 1000 * 60 * 60 * 24 * 30 * 365,
    decade: 1000 * 60 * 60 * 24 * 30 * 365 * 10,
    century: 1000 * 60 * 60 * 24 * 30 * 365 * 100,
  };

  static prevUnit(unit: string) {
    return this.units[this.units.indexOf(unit) - 1];
  }

  static nextUnit(unit: string) {
    return this.units[this.units.indexOf(unit) + 1];
  }
}

class Size {
  static readonly units: string[] = [
    "b",
    "kb",
    "mb",
    "gb",
    "tb",
    "pb",
    "eb",
    "zb",
    "yb",
  ];

  static readonly unitToValue: { [key: string]: number } = {
    b: 1,
    kb: 1000,
    mb: 1000 * 1000,
    gb: 1000 * 1000 * 1000,
    tb: 1000 * 1000 * 1000 * 1000,
    pb: 1000 * 1000 * 1000 * 1000 * 1000,
    eb: 1000 * 1000 * 1000 * 1000 * 1000 * 1000,
    zb: 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000,
    yb: 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000,
  };

  static prevUnit(unit: string) {
    return this.units[this.units.indexOf(unit) - 1];
  }

  static nextUnit(unit: string) {
    return this.units[this.units.indexOf(unit) + 1];
  }
}

class Percentage {
  static readonly units: string[] = ["%"];

  static readonly unitToValue: { [key: string]: number } = {
    "%": 100,
  };

  static prevUnit(unit: string) {
    return this.units[this.units.indexOf(unit) - 1];
  }

  static nextUnit(unit: string) {
    return this.units[this.units.indexOf(unit) + 1];
  }
}

const color = {
  fromNumber: {
    0: "reset",
    1: "bright",
    2: "dim",
    4: "underscore",
    5: "blink",
    7: "reverse",
    8: "hidden",
    30: "black",
    31: "red",
    32: "green",
    33: "yellow",
    34: "blue",
    35: "magenta",
    36: "cyan",
    37: "white",
    40: "bgBlack",
    41: "bgRed",
    42: "bgGreen",
    43: "bgYellow",
    44: "bgBlue",
    45: "bgMagenta",
    46: "bgCyan",
    47: "bgWhite",
  } as any,
  toNumber: {
    reset: "0",
    bright: "1",
    dim: "2",
    underscore: "4",
    blink: "5",
    reverse: "7",
    hidden: "8",
    black: "30",
    red: "31",
    green: "32",
    yellow: "33",
    blue: "34",
    magenta: "35",
    cyan: "36",
    white: "37",
    bgBlack: "40",
    bgRed: "41",
    bgGreen: "42",
    bgYellow: "43",
    bgBlue: "44",
    bgMagenta: "45",
    bgCyan: "46",
    bgWhite: "47",
  } as any,
  toChar: {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m",
  } as any,
};
// #endregion

// #region Interfaces
interface Number {
  _is(obj: any, type: any): boolean;
  is(type: any): boolean;
  seconds(): number;
  minutes(): number;
  hours(): number;
  days(): number;
  weeks(): number;
  months(): number;
  years(): number;
  wait(options?: { log: boolean }): void;
  isBetween(min: number, max: number, strictOrder?: boolean): boolean;
  isBetweenOrEq(min: number, max: number, strictOrder?: boolean): boolean;
  pluralize(plural: string): string;
  unitify(
    unitClass: UnitClass,
    unit?: string[] | string,
    places?: number
  ): string;
  unitifyTime(unit?: string[] | string): string;
  unitifySize(unit?: string[] | string): string;
  unitifyPercent(): string;
  toProgressBar(barLength?: number): string;
  severify(green: number, yellow: number, direction: "<" | ">"): string;
  severifyByHttpStatus(): string;
  getSeverityColor(
    green: number,
    yellow: number,
    direction: "<" | ">",
    bgRed?: boolean
  ): string;
  toFixedRounded(places: number): string;
  ordinalize(): string;
}

interface String {
  is(type: any): boolean;
  isColorCode(): boolean;

  pad(align: "left" | "right", fillString: string): string;

  nextChar(): string;
  getChars(): Generator<string, void, unknown>;

  colorize(color: string): string;
  singularize(): string;
  pluralize(): string;
  antonym(): string;

  severify(green: number, yellow: number, direction: "<" | ">"): string;
  severifyByHttpStatus(statusCode?: number): string;
  deunitify(unitClass: UnitClass): number;
  deunitifyTime(): number;
  deunitifySize(): number;
  deunitifyPercent(): number;

  getUnit(): string;
  getUnitClass(): UnitClass | null;
  withoutUnit(): string;

  padStartChars(maxLength: number, fillString?: string): string;
  sliceChars(start: number | undefined, end?: number | undefined): string;
  alignRight(): string;
  shorten(maxLength: number, ellipsis?: boolean): string;
  toLength(
    length: number,
    ellipsis?: boolean,
    align?: "left" | "right"
  ): string;
  splitOnWidth(width: number): string[];
  trimAll(): string;
  trimDoubleQuotes(): string;
  stripHtmlTags(): string;
  decodeHtml(): string;
  getMatches(regex: RegExp): string[];
  getWords(): string[];
  toCamelCase(): string;
  parseJSON(): any;
  truncate(maxLength: number): string;
  getCharsCount(): number;

  getColorCodesLength(): number;
  withoutColors(): string;
  showColorCodes(): string;
  colorsToHandleBars(): string;
  handlebarsColorsToHtml(): string;
  handlebarsColorsToConsole(): string;
  colorsToHtml(): string;
  parseColorCodes(): string;

  toShortPath(comparePath?: string): string;
  toAbsolutePath(path: any): string;
  toNumber(): number;

  isEqualPath(path: string): boolean;
  normalizePath(): string;
  sanitizePath(): string;
  findParentDir(dirName: string): string;

  ipToNumber(): number;
  decodeBase64(): string;
  hashCode(): number;
}

interface Array<T> {
  sum(): number;
  average(): number;
  first(): any;
  last(): any;
  joinColumns(columns: (number | null)[], ellipsis?: boolean): string;
  distinct(project?: ((item: T) => any) | null): T[];
  except(...items: T[]): T[];
  sortBy(project: (item: T) => any): T[];
  sortByDesc(project: (item: T) => any): T[];
  stringify(): string;
}

interface Function {
  is(type: any): boolean;
  getArgumentNames(): string[];
  postpone(ms: number): (...args: any[]) => any;
}
// #endregion

// #region Number
if (typeof Number !== "undefined") {
  // #warning This is a hack to save the _is function somewhere we can access it
  // This is needed because we can't export or import anything from Extensions.ts
  // Usage: (0)._is([obj], [type])
  // Examples:
  //   (0)._is(5, Number) // true
  //   (0)._is(5, String) // false
  //   (0)._is("5", String) // true
  //   (0)._is("5", Number) // false
  Number.prototype._is = function (obj: any, type: any): boolean {
    switch (type) {
      case String:
        return typeof obj === "string" || obj instanceof String;
      case Number:
        return typeof obj === "number" && isFinite(obj);
      case Boolean:
        return typeof obj === "boolean";
      case Array:
        return Array.isArray(obj);
      case Object:
        return obj !== null && typeof obj === "object" && !Array.isArray(obj);
      default:
        return obj instanceof type;
    }
  };

  Number.prototype.is = function (type: any): boolean {
    return (0)._is(this, type);
  };

  Number.prototype.seconds = function (): number {
    return this.valueOf() * 1000;
  };

  Number.prototype.minutes = function (): number {
    return (this.valueOf() * 60).seconds();
  };

  Number.prototype.hours = function (): number {
    return (this.valueOf() * 60).minutes();
  };

  Number.prototype.days = function (): number {
    return (this.valueOf() * 24).hours();
  };

  Number.prototype.weeks = function (): number {
    return (this.valueOf() * 7).days();
  };

  Number.prototype.months = function (): number {
    return (this.valueOf() * 30).days();
  };

  Number.prototype.years = function (): number {
    return (this.valueOf() * 365).days();
  };

  Number.prototype.wait = function (options = { log: false }): Promise<void> {
    let timer: any = null;
    let started = Date.now();
    if (options.log) {
      timer = setInterval(() => {
        const elapsed = started + this.valueOf() - Date.now();
        process.stdout.write(`\r`);
        process.stdout.write(`${`Waiting -`.gray}${elapsed.unitifyTime()}\r`);
      }, 100);
    }
    return new Promise((resolve) =>
      setTimeout(() => {
        if (timer) {
          clearInterval(timer);
          process.stdout.write("\r");
          process.stdout.clearLine(0);
        }
        resolve();
      }, this.valueOf())
    );
  };

  Number.prototype.isBetween = function (
    min: number,
    max: number,
    strictOrder?: boolean
  ): boolean {
    // strictOrder: if false, max could be min and vice versa
    const value = this.valueOf();
    if (strictOrder) return value > min && value < max;
    return (value > min && value < max) || (value > max && value < min);
  };

  Number.prototype.isBetweenOrEq = function (
    min: number,
    max: number,
    strictOrder?: boolean
  ): boolean {
    // strictOrder: if false, max could be min and vice versa
    const value = this.valueOf();
    if (strictOrder) return value >= min && value <= max;
    return (value >= min && value <= max) || (value >= max && value <= min);
  };

  Number.prototype.pluralize = function (plural: string): string {
    const singular = plural.singularize();
    if (this.valueOf() === 1) return `${this} ${singular}`;
    return `${this} ${plural}`;
  };

  Number.prototype.unitify = function (
    unitClass: UnitClass,
    unit?: string[] | string
  ): string {
    // ["m", "s", "ms"] should:
    // return "230ms" if value is < 1000
    // return "1.23s" if value is < 60000 and > 1000
    // return "1.23m" if value is > 60000
    if (!unit?.length) unit = unitClass.units;
    let value = this.valueOf();
    // Percent is a special case
    if (unitClass == Percentage) return `${Math.round(value * 100)}${`%`.gray}`;

    const units = !Array.isArray(unit)
      ? [unit]
      : unit.sortByDesc((u) => unitClass.unitToValue[u]);

    if (this == 0) return `0${units.last()}`.gray;

    for (const u of units) {
      const currentUnitValue = unitClass.unitToValue[u];
      const nextUnitValue = unitClass.unitToValue[unitClass.nextUnit(u)];
      if (value.isBetweenOrEq(currentUnitValue, nextUnitValue)) {
        const unitValue = value / currentUnitValue;

        if (unitValue >= 10 || u == units.last()) {
          return `${unitValue.toFixed(0)}${u.gray}`;
        }
        return `${unitValue.toFixedRounded(2)}${u.gray}`;
      }
    }
    if (value == 0) return `${value}${units.last().gray}`;
    return `${value.toFixed(0)}${units.last().gray}`;
  };

  Number.prototype.unitifyTime = function (unit?: string[] | string): string {
    return this.unitify(Time, unit);
  };

  Number.prototype.unitifySize = function (unit?: string[] | string): string {
    return this.unitify(Size, unit);
  };

  Number.prototype.unitifyPercent = function (): string {
    return this.unitify(Percentage);
    //return `${Math.round(this.valueOf() * 100)}${`%`.gray}`;
  };

  Number.prototype.toProgressBar = function (barLength?: number): string {
    const value = this.valueOf();
    if (!barLength) barLength = 50;
    barLength = barLength - ` 100%`.length;
    const progressLength = Math.round(value * barLength);
    const bar = "█".repeat(progressLength);
    const emptyLength = barLength - progressLength;
    const empty = emptyLength <= 0 ? "" : "█".repeat(emptyLength).gray;
    return `${bar}${empty} ${value.unitifyPercent().withoutColors()}`;
  };

  Number.prototype.severify = function (
    green: number,
    yellow: number,
    direction: "<" | ">"
  ): string {
    return this.toString().colorize(
      this.getSeverityColor(green, yellow, direction, true)
    );
  };

  Number.prototype.severifyByHttpStatus = function (): string {
    const value = this.valueOf();
    return value.severify(200, 400, "<");
  };

  Number.prototype.getSeverityColor = function (
    green: number,
    yellow: number,
    direction: "<" | ">",
    bgRed?: boolean
  ): string {
    const value = this.valueOf();
    if (direction == "<") {
      if (value <= green) return "green";
      if (value <= yellow) return "yellow";
      return bgRed ? "bgRed" : "red";
    }
    if (direction == ">") {
      if (value >= green) return "green";
      if (value >= yellow) return "yellow";
      return bgRed ? "bgRed" : "red";
    }
    throw new Error(`Invalid direction: ${direction}`);
  };

  Number.prototype.toFixedRounded = function (places: number): string {
    const value = this.valueOf();
    let str = value.toFixed(places);
    while (str.endsWith("0")) str = str.slice(0, -1);
    if (str.endsWith(".")) str = str.slice(0, -1);
    return str;
  };

  Number.prototype.ordinalize = function (): string {
    const number = this.valueOf();

    if (number === 0) {
      return "0"; // No ordinal representation for 0
    }
    const suffixes = ["th", "st", "nd", "rd"];
    const mod100 = number % 100;
    const mod10 = number % 10;

    if (mod10 === 1 && mod100 !== 11) {
      return number + "st";
    } else if (mod10 === 2 && mod100 !== 12) {
      return number + "nd";
    } else if (mod10 === 3 && mod100 !== 13) {
      return number + "rd";
    } else {
      return number + "th";
    }
  };
}
// #endregion

// #region String
if (typeof String !== "undefined") {
  String.prototype.is = function (type: any): boolean {
    return (0)._is(this, type);
  };

  String.prototype.isColorCode = function (): boolean {
    return this.startsWith("\x1b[");
  };

  String.prototype.pad = function (
    align: "left" | "right",
    fillString: string
  ) {
    if (!align) align = "left";
    if (align === "left") return `${fillString}${this}`;
    return `${this}${fillString}`;
  };

  // Returns the next character in the string ("abcd" => "a")
  // In case of console color codes, it returns the whole color code
  String.prototype.nextChar = function (): string {
    const s = this.toString();
    if (s.isColorCode()) {
      return s.slice(0, 5);
    }
    return s[0];
  };

  // "[red]ab[/reset]cdef" -> ["[red]", "a", "b", "[reset]", "c", "d", "e", "f"]
  String.prototype.getChars = function* () {
    let s = this.toString();
    while (s.length > 0) {
      const char = s.nextChar();
      yield char;
      s = s.slice(char.length);
    }
  };

  String.prototype.colorize = function (color: string): string {
    return eval(`this.${color}`);
  };

  String.prototype.singularize = function (): string {
    if (this.endsWith("ies")) return this.slice(0, -3) + "y";
    if (this.endsWith("s")) return this.slice(0, -1);
    return this.toString();
  };

  String.prototype.pluralize = function (): string {
    if (this.endsWith("y")) return this.slice(0, -1) + "ies";
    if (this.endsWith("s")) return this.toString();
    return this + "s";
  };

  String.prototype.antonym = function (): string {
    const antonyms = [
      ["up", "down"],
      ["left", "right"],
      ["top", "bottom"],
      ["start", "end"],
      ["before", "after"],
      ["above", "below"],
      ["first", "last"],
      ["front", "back"],
    ];
    for (const [a, b] of antonyms) {
      if (this === a) return b;
      if (this === b) return a;
    }
    return this.toString();
  };

  String.prototype.severify = function (
    green: number,
    yellow: number,
    direction: "<" | ">"
  ): string {
    const unitClass = this.getUnitClass();
    if (!unitClass) throw new Error("No unit class found");
    const value = this.deunitify(unitClass);
    const unit = this.getUnit();
    const color = value.getSeverityColor(green, yellow, direction, true);
    return `${value.unitify(unitClass).withoutUnit().colorize(color)}${
      unit.gray
    }`;
  };

  String.prototype.severifyByHttpStatus = function (
    statusCode?: number
  ): string {
    if (!statusCode)
      statusCode = this.split(" ")
        .map((s) => parseInt(s))
        .find((n) => !isNaN(n));
    if (!statusCode) return this.toString();
    return this.colorize(statusCode.getSeverityColor(200, 400, "<"));
  };

  String.prototype.deunitify = function (unitClass: UnitClass): number {
    // Percentages are special, because they are relative to 100
    if (unitClass === Percentage) {
      const value = parseFloat(this.withoutUnit());
      return value / 100;
    }
    const s = this.withoutColors();
    const unit = s.getUnit();
    const value = parseFloat(s.withoutUnit());
    return value * (unit ? unitClass.unitToValue[unit] : 1);
  };

  String.prototype.deunitifyTime = function (): number {
    return this.deunitify(Time);
  };

  String.prototype.deunitifySize = function (): number {
    return this.deunitify(Size);
  };

  String.prototype.deunitifyPercent = function (): number {
    return this.deunitify(Percentage);
  };

  String.prototype.getUnit = function (): string {
    return this.withoutColors().replace(/[0-9\.]/g, "");
  };

  String.prototype.getUnitClass = function (): UnitClass | null {
    const unit = this.getUnit();
    if (Time.units.includes(unit)) return Time;
    if (Size.units.includes(unit)) return Size;
    if (Percentage.units.includes(unit)) return Percentage;
    return null;
  };

  String.prototype.withoutUnit = function (): string {
    return this.withoutColors().replace(/[^0-9.-]/g, "");
  };

  String.prototype.padStartChars = function (
    maxLength: number,
    fillString?: string
  ): string {
    if (fillString === undefined) fillString = " ";
    let result = this;
    while (result.getCharsCount() < maxLength) {
      result = fillString + result;
    }
    return result.toString();
  };

  // Slice a string by character count instead of by byte count
  // Copies color codes too but doesn't count them in the character count
  String.prototype.sliceChars = function (
    start: number | undefined,
    end?: number | undefined
  ): string {
    if (start === undefined) start = 0;
    if (end === undefined) end = this.length;
    let result = "";
    let charCount = 0;
    for (let i = 0; i < this.length; i++) {
      const char = this[i];
      if (char === "\u001b") {
        const colorCode = this.slice(i, i + 9);
        result += colorCode;
        i += colorCode.length - 1;
        continue;
      }
      if (charCount >= start && charCount < end) result += char;
      charCount++;
    }
    return result;
  };

  (String.prototype as any).alignRight = function (): string {
    const width = process.stdout.columns;
    const padding = " ".repeat(Math.max(width - this.length, 0));
    return `${padding}${this}`;
  };

  String.prototype.shorten = function (
    maxLength: number,
    ellipsis: boolean = true
  ): string {
    if (maxLength == null) return this.toString();
    if (ellipsis) maxLength -= 2;
    let s = this.toString();
    if (s.getCharsCount() > maxLength) {
      s = s.sliceChars(0, maxLength);
      if (ellipsis) s += "..";
    }
    return s;
  };

  String.prototype.toLength = function (
    length: number,
    ellipsis?: boolean,
    align?: "left" | "right"
  ): string {
    if (!align) align = "left";
    let s = (this || "").toString().shorten(length, ellipsis);
    if (length)
      s = s.pad(
        align.antonym() as "left" | "right",
        " ".repeat(Math.max(0, length - s.getCharsCount()))
      );
    return s;
  };

  String.prototype.splitOnWidth = function (width: number): string[] {
    const lines: string[] = [];
    let currentLine = "";
    let colorStack = [];
    for (const char of this.getChars()) {
      if (char.isColorCode()) colorStack.push(char);
      if (currentLine.getCharsCount() >= width) {
        // new line
        if (colorStack.length > 0)
          // reset the color
          currentLine += color.toChar.reset;
        lines.push(currentLine);
        currentLine = "";
        colorStack.forEach((c) => (currentLine += c));
        colorStack = [];
      }
      currentLine += char;
    }
    if (currentLine.length > 0) lines.push(currentLine);
    return lines;
  };

  String.prototype.trimAll = function (): string {
    return this.replace(/[\t\n]/g, "").trim();
  };

  // Trim double quotes from a string if they exist
  String.prototype.trimDoubleQuotes = function (): string {
    if (this.startsWith('"') && this.endsWith('"')) return this.slice(1, -1);
    return this.toString();
  };

  (String.prototype as any).stripHtmlTags = function (): string {
    return (
      this
        // Replace <br /> with a new line
        .replace(/<br\s*[\/]?>/gi, "\n")
        // Remove HTML tags
        .replace(/(<([^>]+)>)/gi, " ")
    );
  };

  (String.prototype as any).decodeHtml = function (): string {
    return (
      this.replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        // Replace &#[number]; with the unicode character
        .replace(/&#(\d+);/g, (match: any, dec: any) =>
          String.fromCharCode(dec)
        )
        // Replace &#x[number]; with the unicode character
        .replace(/&#x([0-9a-f]+);/gi, (match: any, hex: any) =>
          String.fromCharCode(parseInt(hex, 16))
        )
    );
  };

  String.prototype.getWords = function (): string[] {
    // Get the words using a regex
    return this.match(/\w+/g) || [];
  };

  String.prototype.toCamelCase = function (): string {
    // Lowercase the first letter
    return this.charAt(0).toLowerCase() + this.slice(1);
  };

  String.prototype.parseJSON = function (): string {
    return JSON.parse(this.toString());
  };

  String.prototype.truncate = function (maxLength: number): string {
    if (this.getCharsCount() <= maxLength) return this.toString();

    const ellipsis = "..";
    maxLength = Math.max(0, maxLength - ellipsis.length);

    // Strip the color codes from the string
    //const stripped = this.replace(/\x1b\[[0-9;]*m/g, "");
    // Truncate the string
    //return stripped.slice(0, maxLength) + ellipsis;

    // Construct a new string with the max length
    // Copy the characters from the original string
    // Include the color codes but count only the characters that are not color codes
    // Add ".." to the end of the string
    let result = "";
    let charsCount = 0;
    for (let i = 0; i < this.length; i++) {
      const char = this.charAt(i);
      result += char;
      if (char === "\x1b") {
        // Skip the color code
        while (this.charAt(i) !== "m") {
          i++;
          result += this.charAt(i);
        }
      } else {
        charsCount++;
      }
      if (charsCount >= maxLength) break;
    }
    // At the end of the string, add the ellipsis
    result += ellipsis;
    // At the end of the string, reset the color
    result += "\x1b[0m";
    return result;
  };

  String.prototype.getCharsCount = function (): number {
    return this.length - this.getColorCodesLength();
  };

  String.prototype.getColorCodesLength = function (): number {
    const colorCodeRegex = /\x1b\[[0-9;]*m/g; // matches all ANSI escape sequences for console color codes
    const matches = this.match(colorCodeRegex);
    return matches ? matches.join("").length : 0;
  };

  String.prototype.withoutColors = function (): string {
    return this.replace(/\x1b\[[0-9;]*m/g, "");
  };

  String.prototype.showColorCodes = function (): string {
    return this.replace(/\x1B\[/g, "\\x1B[");
  };

  String.prototype.colorsToHandleBars = function (): string {
    // Create a regular expression pattern to match each console color escape sequence and replace it with the corresponding handlebars-style syntax
    const pattern = /\x1B\[(\d+)m(.+?)\x1B\[(\d+)m/g;
    const result = this.replace(
      pattern,
      (match: any, colorCode: string, content: string) => {
        const colorName = color.fromNumber[colorCode.toNumber()];
        if (colorName) {
          return `{{#${colorName}}}${content}{{/${colorName}}}`;
        } else {
          return content;
        }
      }
    );

    if (result.includes("\x1B")) {
      return result.colorsToHandleBars();
    }

    return result;
  };

  String.prototype.handlebarsColorsToHtml = function (): string {
    const pattern = /\{\{\#([^\{\}]*?)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    const result = this.replace(pattern, (match, color, content) => {
      if (!color.colorToCodeNum[color]) return content;
      return `<span class="${color}">${content.handleBarsColorsToHtml()}</span>`;
    });
    // If pattern is found, call the function recursively
    if (result.match(pattern)) {
      return result.handlebarsColorsToHtml();
    }
    return result;
  };

  String.prototype.handlebarsColorsToConsole = function (): string {
    // {{#red}}Hello {{#green}}World{{/green}}!{{/red}}
    // {{#red}}
    const pattern = /\{\{\#([^\{\}]*?)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    // {{/red}}
    let result = this.replace(pattern, (match, color, content) => {
      if (!color.colorToCodeChar[color]) return content;
      return `${
        color.colorToCodeChar[color]
      }${content.handlebarsColorsToConsole()}${color.colorToCodeChar["reset"]}`;
    });
    // If pattern is found, call the function recursively
    if (result.match(pattern)) {
      return result.handlebarsColorsToConsole();
    }
    return result;
  };

  String.prototype.colorsToHtml = function (): string {
    return this.colorsToHandleBars().handlebarsColorsToHtml();
  };

  String.prototype.parseColorCodes = function (): string {
    const escapeRegex = /\x1b\[(\d+)m/g; // matches escape sequences in the form \x1b[<number>m
    const resetCode = "\x1b[0m"; // reset code to remove all colors and styles

    return this.replace(escapeRegex, (_, code) => {
      const colorCode = (
        {
          30: "\x1b[30m", // black
          31: "\x1b[31m", // red
          32: "\x1b[32m", // green
          33: "\x1b[33m", // yellow
          34: "\x1b[34m", // blue
          35: "\x1b[35m", // magenta
          36: "\x1b[36m", // cyan
          37: "\x1b[37m", // white
        } as any
      )[code];

      return colorCode ? colorCode : resetCode;
    });
  };

  String.prototype.toShortPath = function (comparePath?: string): string {
    const path = this.toString().replace(/\\/g, "/");
    const allParts = path.split("/");
    // Return the last 2 parts of the path
    const parts = allParts.slice(Math.max(allParts.length - 2, 0));
    let s = `${parts[0].yellow}${`\\`.gray}${parts[1]}`;
    if (parts.length > 2) {
      s = `${s} (${parts.slice(0, -2).join("\\")})`.gray;
    }
    if (comparePath) {
      const compareParts = comparePath.replace(/\\/g, "/").split("/");
      const diffs = allParts.filter((part, index) => {
        return part !== compareParts[index];
      });
      if (diffs.length > 0) {
        s = `${diffs.join("\\").gray}..\\${s}`;
      }
    }
    s = `${`..\\`.gray}${s}`;
    return s;
  };

  // Convert a relative path to an absolute path
  // If the path is already absolute, return it as is
  // If the path is relative, convert from the current working directory
  // If the path contains ..\, resolve the path
  String.prototype.toAbsolutePath = function (path: any): string {
    if (path.isAbsolute(this.toString())) return path.resolve(this.toString());
    return path.resolve(path.join(process.cwd(), this.toString()));
  };

  String.prototype.toNumber = function (): number {
    return parseFloat(this.withoutColors());
  };

  String.prototype.isEqualPath = function (path: any): boolean {
    return this.toString().normalizePath() === path.normalizePath();
  };

  String.prototype.normalizePath = function (): string {
    return this.toString().replace(/\//g, "\\");
  };

  // Make a string safe to use as a filename or directory name
  String.prototype.sanitizePath = function (): string {
    const sanitizePart = (s: string) => {
      if (s.length == 2 && s[1] == ":") return s;
      // Invalid characters in Windows filenames: \ / : * ? " < > |
      const invalidCharsRegex = /[\x00-\x1f\\\/:*?"<>|]/g;
      s = s.replace(invalidCharsRegex, "_");
      return s;
    };

    const parts = this.toString().replace(/\\/g, "/").split("/");

    const dirName = parts.slice(0, -1);
    const fileName = parts.slice(-1)[0];
    const extension = fileName.split(".").slice(-1)[0];

    const sanitized =
      [
        ...dirName,
        sanitizePart(fileName.split(".").slice(0, -1).join(".")),
      ].join("/") + (extension ? `.${extension}` : "");

    return sanitized;
  };

  String.prototype.findParentDir = function (dirName: string): string {
    const parts = this.toString().normalizePath().split("\\");
    const index = parts.indexOf(dirName);
    if (index === -1) throw new Error(`Could not find ${dirName} in path`);
    return parts.slice(0, index + 1).join("\\");
  };

  String.prototype.ipToNumber = function (): number {
    let parts = this.split(".");
    return (
      parseInt(parts[0]) * 256 * 256 * 256 +
      parseInt(parts[1]) * 256 * 256 +
      parseInt(parts[2]) * 256 +
      parseInt(parts[3])
    );
  };

  String.prototype.decodeBase64 = function (): string {
    return Buffer.from(this, "base64").toString("ascii");
  };

  String.prototype.hashCode = function (): number {
    const str = this.toString();
    let hash = 0;
    if (str.length === 0) {
      return hash;
    }
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  };
}
// #endregion

// #region Array
if (typeof Array !== "undefined") {
  Array.prototype.sum = function () {
    return this.reduce((a, b) => a + b, 0);
  };

  Array.prototype.average = function () {
    return parseFloat((this.sum() / this.length).toFixed(2));
  };

  Array.prototype.first = function () {
    return this[0];
  };

  Array.prototype.last = function () {
    return this[this.length - 1];
  };

  Array.prototype.joinColumns = function (
    columns: (number | null)[],
    ellipsis?: boolean
  ) {
    if (!columns.length) return this.join(" ");
    return this.map(
      (item, i) => `${(item || "").toLength(columns[i], ellipsis, "right")}`
    ).join(" ");
  };

  Array.prototype.distinct = function (project?: ((item: any) => any) | null) {
    if (!project) project = (item) => item;
    const result = [];
    const map = new Map();
    for (const item of this) {
      const key = project ? project(item) : item;
      if (!map.has(key)) {
        map.set(key, true);
        result.push(item);
      }
    }
    return result;
  };

  Array.prototype.except = function (...items: any[]) {
    return this.filter((item) => !items.includes(item));
  };

  Array.prototype.sortBy = function (project: (item: any) => any) {
    return [...this].sort((a, b) => {
      const aKey = project(a);
      const bKey = project(b);
      if (aKey < bKey) return -1;
      if (aKey > bKey) return 1;
      return 0;
    });
  };

  Array.prototype.sortByDesc = function (project: (item: any) => any) {
    return [...this.sortBy(project)].reverse();
  };

  Array.prototype.stringify = function (): any {
    return JSON.stringify(this);
  };
}
// #endregion

// #region Function
if (typeof Function !== "undefined") {
  Function.prototype.is = function (type: any): boolean {
    return (0)._is(this, type);
  };

  Function.prototype.getArgumentNames = function () {
    const code = this.toString();
    const args = code
      .slice(code.indexOf("(") + 1, code.indexOf(")"))
      .match(/([^\s,]+)/g);
    return args || [];
  };

  Function.prototype.postpone = function (delay: number) {
    const fn = this;
    return () => {
      setTimeout(fn, delay);
    };
  };
}

// #endregion
