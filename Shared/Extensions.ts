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
    "de",
    "ce",
  ];

  static readonly longUnits: string[] = [
    "milliseconds",
    "seconds",
    "minutes",
    "hours",
    "days",
    "weeks",
    "months",
    "years",
    "decades",
    "centuries",
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

  static readonly longUnits: string[] = [
    "bytes",
    "kilobytes",
    "megabytes",
    "gigabytes",
    "terabytes",
    "petabytes",
    "exabytes",
    "zettabytes",
    "yottabytes",
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

  static readonly longUnits: string[] = ["percent"];

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

const UnitClasses = [Time, Size, Percentage];

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
  _compare(obj1: any, obj2: any): number;
  _getObjectType(obj: any): any;
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
  toProgressBar(barLength?: number, ...severifyArgs: any[]): string;
  severify(green: number, yellow: number, direction: "<" | ">"): string;
  severifyByHttpStatus(): string;
  getSeverityColor(
    green: number,
    yellow: number,
    direction: "<" | ">",
    bgRed?: boolean
  ): string;
  getHttpSeverityColor(): string;
  toFixedRounded(places: number): string;
  roundTo(places: number): number;
  getEnumName(enumType: any): string;
  ordinalize(): string;
  humanize(): string;
}

interface String {
  is(type: any): boolean;
  isColorCode(): boolean;

  isLowerCase(): boolean;

  pad(align: "left" | "right", fillString: string): string;

  nextChar(): string;
  getChars(): Generator<string, void, unknown>;

  c(color: string): string;
  colorize(color: string): string;
  singularize(): string;
  pluralize(): string;
  antonym(): string;

  severify(
    green: number,
    yellow: number,
    direction: "<" | ">",
    value?: number
  ): string;
  severifyByHttpStatus(statusCode?: number, bgRed?: boolean): string;
  deunitify(): number;

  getUnit(options?: { throw: boolean }): string;
  getUnitClass(): UnitClass | null;
  withoutUnit(): string;

  padStartChars(maxLength: number, fillString?: string): string;
  padEndChars(maxLength: number, fillString?: string): string;
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
  getCaseWords(): string[];
  toCamelCase(): string;
  toTitleCase(): string;
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
  splitPath(): string[];
  normalizePath(): string;
  sanitizePath(): string;
  findParentDir(dirName: string): string;

  ipToNumber(): number;
  decodeBase64(): string;
  hashCode(): number;

  parseEnum<T>(enumType: T): T[keyof T] | null;
}

interface Array<T> {
  all(predicate: (item: T) => boolean): boolean;
  toMap(getKey: (item: T) => any): object;
  contains(item: T, getItemKey?: (item: T) => any): boolean;
  reversed(): T[];
  removeAt(index: number): void;
  insertAt(index: number, item: T, appendToEnd: boolean): void;
  removeBy(predicate: (item: T) => boolean): void;
  removeByField(key: string, value: any): void;
  clear(stagger?: number): void;
  add(items: any[], stagger?: number): void;
  take(count: number): T[];
  replace(
    getNewItems: () => Promise<any[]>,
    stagger: number,
    getItemKey?: (item: any) => any
  ): void;
  sum(getValue?: (item: T) => number, getWeight?: (item: T) => number): number;
  min(): number;
  max(): number;
  average(
    getValue?: (item: any) => number,
    getWeight?: (item: any) => number
  ): number;
  first(): any;
  last(): any;
  back(): any;
  skip(count: number): T[];
  joinColumns(columns: (number | null)[], ellipsis?: boolean): string;
  distinct(project?: ((item: T) => any) | null): T[];
  except(...items: T[]): T[];
  exceptBy(items: T[], getItemKey?: (item: T) => any): T[];
  exceptLast(count: number): T[];
  sortBy(...projects: ((item: T) => any)[]): T[];
  sortByDesc(...projects: ((item: T) => any)[]): T[];
  stringify(): string;
  onlyTruthy<T>(): T[];
  shuffle(): T[];
  rotate(count: number): T[];
}

interface Function {
  is(type: any): boolean;
  getArgumentNames(): string[];
  postpone(ms: number): (...args: any[]) => any;
  debounce(ms: number): (...args: any[]) => any;
  throttle(ms: number): (...args: any[]) => any;
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
    const objType = Number.prototype._getObjectType(obj);
    if (objType === null) return obj instanceof type;
    if (objType !== type) return false;
    return true;
  };

  // #warning This is a hack to save the _is function somewhere we can access it
  // This is needed because we can't export or import anything from Extensions.ts
  Number.prototype._compare = function (obj1: any, obj2: any): number {
    const compare = (obj1: any, obj2: any): number => {
      if (obj1 === obj2) return 0;

      // Handle numbers
      if (typeof obj1 === "number" || typeof obj2 === "number") {
        if (obj1 == undefined) obj1 = 0;
        if (obj2 == undefined) obj2 = 0;
        if (typeof obj1 === "number" && typeof obj2 === "number") {
          return obj1 - obj2;
        }
      }

      // Handle strings
      if (typeof obj1 === "string" && typeof obj2 === "string") {
        return obj1.localeCompare(obj2);
      }

      // Handle dates
      if (obj1 instanceof Date && obj2 instanceof Date) {
        return obj1.getTime() - obj2.getTime();
      }

      // Handle arrays
      if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length == 1 && obj2.length == 1)
          return compare(obj1[0], obj2[0]);
        throw new Error("Arrays are not supported");
      }

      throw new Error(
        `Cannot compare ${obj1} (${typeof obj1}) with ${obj2} (${typeof obj2})`
      );
    };

    return compare(obj1, obj2);
  };

  Number.prototype._getObjectType = function (obj: any) {
    if (typeof obj === "string" || obj instanceof String) return String;
    if (typeof obj === "number" && isFinite(obj)) return Number;
    if (typeof obj === "boolean") return Boolean;
    if (Array.isArray(obj)) return Array;
    if (obj !== null && typeof obj === "object" && !Array.isArray(obj))
      return Object;
    return null;
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
        process.stdout.write(
          `${`Waiting -`.c("gray")}${elapsed.unitifyTime()}\r`
        );
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
    if (unitClass == Percentage)
      return `${Math.round(value * 100)}${`%`.c("gray")}`;

    const units = !Array.isArray(unit)
      ? [unit]
      : unit.sortByDesc((u) => unitClass.unitToValue[u]);

    if (!value) return `0${units.last()}`.c("gray");

    for (const u of units) {
      const currentUnitValue = unitClass.unitToValue[u];
      const nextUnitValue = unitClass.unitToValue[unitClass.nextUnit(u)];
      if (value.isBetweenOrEq(currentUnitValue, nextUnitValue)) {
        const unitValue = value / currentUnitValue;

        if (unitValue >= 10 || u == units.last()) {
          return `${unitValue.toFixed(0)}${u.c("gray")}`;
        }
        return `${unitValue.toFixedRounded(2)}${u.c("gray")}`;
      }
    }
    if (value == 0) return `${value}${units.last().c("gray")}`;
    return `${value.toFixed(0)}${units.last().c("gray")}`;
  };

  Number.prototype.unitifyTime = function (unit?: string[] | string): string {
    return this.unitify(Time, unit);
  };

  Number.prototype.unitifySize = function (unit?: string[] | string): string {
    return this.unitify(Size, unit);
  };

  Number.prototype.unitifyPercent = function (): string {
    return this.unitify(Percentage);
    //return `${Math.round(this.valueOf() * 100)}${`%`.c("gray")}`;
  };

  Number.prototype.toProgressBar = function (
    barLength?: number,
    ...severifyArgs: any[]
  ): string {
    const value = this.valueOf();
    if (!barLength) barLength = 50;
    barLength = barLength - ` 100%`.length;
    const progressLength = Math.round(value * barLength);
    const bar = "█".repeat(progressLength);
    const emptyLength = barLength - progressLength;
    const empty = emptyLength <= 0 ? "" : "█".repeat(emptyLength).c("gray");
    let s = `${bar}${empty} ${value.unitifyPercent().withoutColors()}`;
    if (severifyArgs.length)
      s = s.colorize(
        value.getSeverityColor(
          severifyArgs[0],
          severifyArgs[1],
          severifyArgs[2]
        )
      );
    return s;
  };

  Number.prototype.severify = function (
    green: number,
    yellow: number,
    direction: "<" | ">",
    value?: number
  ): string {
    if (value === undefined) value = this.valueOf();
    const color = value.getSeverityColor(green, yellow, direction, true);
    let s = value.toString().colorize(color);
    if (color == "bgRed") s = s.colorize("white");
    return s;
  };

  Number.prototype.severifyByHttpStatus = function (): string {
    const value = this.valueOf();
    return value.toString().colorize(value.getHttpSeverityColor());
  };

  Number.prototype.getSeverityColor = function (
    green: number,
    yellow: number,
    direction: "<" | ">",
    bgRed?: boolean
  ): string {
    const value = this.valueOf();
    if (direction == "<") {
      if (value === null || value === undefined || Number.isNaN(value))
        return "gray";
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

  Number.prototype.getHttpSeverityColor = function () {
    const value = this.valueOf();
    if (value == 404) return "yellow";
    return value.getSeverityColor(200, 400, "<", true);
  };

  Number.prototype.toFixedRounded = function (places: number): string {
    const value = this.valueOf();
    let str = value.toFixed(places);
    while (str.endsWith("0")) str = str.slice(0, -1);
    if (str.endsWith(".")) str = str.slice(0, -1);
    return str;
  };

  Number.prototype.roundTo = function (places: number): number {
    return parseFloat(this.toFixed(places));
  };

  Number.prototype.getEnumName = function (enumType: any): string {
    const value = this.valueOf();
    const keys = Object.keys(enumType);
    for (const key of keys) {
      if (enumType[key] == value) return key;
    }
    return "";
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

  Number.prototype.humanize = function (): string {
    const value = this.valueOf();
    if (value < 0) return `-${(-value).humanize()}`;
    if (value < 10) {
      // If no fraction, return as integer
      if (value % 1 === 0) return value.toString();
      return value.toFixed(2);
    }
    if (value < 1000) return Math.round(value).toLocaleString();
    if (value < 1000000) return `${(value / 1000).toLocaleString()}k`;
    if (value < 1000000000) return `${(value / 1000000).toLocaleString()}m`;
    return `${(value / 1000000000).toLocaleString()}b`;
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

  String.prototype.isLowerCase = function (): boolean {
    return this.toLowerCase() === this.toString();
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

  String.prototype.c = function (color: string): string {
    return this.colorize(color);
  };

  String.prototype.colorize = function (color: string): string {
    if (!(String.prototype as any)[color]) return this.toString();
    return eval(`this.${color}`);
  };

  String.prototype.singularize = function (): string {
    if (this.endsWith("ies")) return this.slice(0, -3) + "y";
    if (this.endsWith("s")) return this.slice(0, -1);
    return this.toString();
  };

  String.prototype.pluralize = function (): string {
    if (this.endsWith("ay")) return this + "s";
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
    const valueStr = this.toString();
    const unitClass = valueStr.getUnitClass();
    if (!unitClass) {
      const value = parseFloat(valueStr);
      const color = value.getSeverityColor(green, yellow, direction);
      return valueStr.colorize(color);
    }
    const value = valueStr.deunitify();
    const unit = valueStr.getUnit();
    const color = value.getSeverityColor(green, yellow, direction, true);
    let coloredValue = value.unitify(unitClass).withoutUnit().colorize(color);
    if (color == "bgRed") coloredValue = coloredValue.white;
    return `${coloredValue}${unit.c("gray")}`;
  };

  String.prototype.severifyByHttpStatus = function (
    statusCode?: number,
    bgRed?: boolean
  ): string {
    if (!statusCode)
      statusCode = this.split(" ")
        .map((s) => parseInt(s))
        .find((n) => !isNaN(n));
    if (!statusCode) return this.toString();
    return this.colorize(statusCode.getHttpSeverityColor());
  };

  String.prototype.deunitify = function (): number {
    const unitClass = this.getUnitClass();
    if (!unitClass) throw new Error(`No unit class found for ${this}`);
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

  String.prototype.getUnit = function (
    options: { throw: boolean } = { throw: true }
  ): string {
    let word = this.withoutColors()
      .replace(/[0-9\.]/g, "")
      .trim();
    if (word.length > 2) word = word.pluralize();
    // Search for the long unit name ("seconds", "bytes", "percentages")
    for (const unitClass of UnitClasses) {
      let index = unitClass.longUnits.indexOf(word);
      if (index != -1) {
        const lus = unitClass.longUnits
          .map((lu) => lu[0])
          .join("")
          .toLowerCase();
        const sus = unitClass.units.join("").toLowerCase();
        if (lus == sus) return unitClass.units[index];
        if (word.startsWith("month")) return "M";
        return word[0];
      }
    }
    // Search for the short unit name ("s", "B", "%")
    for (const unitClass of UnitClasses) {
      let index = unitClass.units.indexOf(word);
      if (index != -1) return unitClass.units[index];
    }
    if (options.throw) {
      throw new Error(`No unit found for "${word}"`);
    } else {
      return "";
    }
  };

  String.prototype.getUnitClass = function (): UnitClass | null {
    const unit = this.getUnit({ throw: false });
    if (Time.units.includes(unit)) return Time;
    if (Size.units.includes(unit)) return Size;
    if (Percentage.units.includes(unit)) return Percentage;
    return null;
  };

  String.prototype.withoutUnit = function (): string {
    return this.withoutColors()
      .replace(/[^0-9.-]/g, "")
      .trim();
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

  String.prototype.padEndChars = function (
    maxLength: number,
    fillString?: string
  ): string {
    if (fillString === undefined) fillString = " ";
    let result = this;
    while (result.getCharsCount() < maxLength) {
      result += fillString;
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

  String.prototype.getCaseWords = function (): string[] {
    // Split "titleCaseString" into "title case string"
    return this.replace(/([A-Z])/g, " $1").split(" ");
  };

  String.prototype.toCamelCase = function (): string {
    // Lowercase the first letter
    return this.charAt(0).toLowerCase() + this.slice(1);
  };

  String.prototype.toTitleCase = function (): string {
    // Uppercase the first letter of each word
    return this.replace(/\w\S*/g, (txt: string) => {
      return txt.charAt(0).toUpperCase() + txt.substring(1);
    });
  };

  String.prototype.parseJSON = function () {
    if (this == "undefined") return undefined;
    if (!this) return null;
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
    let s = `${parts[0].yellow}${`\\`.c("gray")}${parts[1]}`;
    if (parts.length > 2) {
      s = `${s} (${parts.slice(0, -2).join("\\")})`.c("gray");
    }
    if (comparePath) {
      const compareParts = comparePath.replace(/\\/g, "/").split("/");
      const diffs = allParts.filter((part, index) => {
        return part !== compareParts[index];
      });
      if (diffs.length > 0) {
        s = `${diffs.join("\\").c("gray")}..\\${s}`;
      }
    }
    s = `${`..\\`.c("gray")}${s}`;
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

  String.prototype.splitPath = function (): string[] {
    return this.toString().replace(/\\/g, "/").split("/");
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
    if (index != -1) return parts.slice(0, index + 1).join("\\");
    throw new Error(`Could not find ${dirName} in ${this}`);
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

  // Case insensitive
  String.prototype.parseEnum = function (enumType: any): any {
    const str = this.toString();
    // If the string is a number, return the number
    if (str.match(/^\d+$/)) return parseInt(str);
    for (const key in enumType) {
      if (key.toLowerCase() == str.toLowerCase()) return enumType[key];
    }
    return null;
  };
}
// #endregion

// #region Array
if (typeof Array !== "undefined") {
  Array.prototype.toMap = function (
    getKey: (item: any) => any,
    getValue?: (item: any) => any
  ) {
    if (!getValue) getValue = (item) => item;
    const map = {} as any;
    this.forEach((item) => {
      map[getKey(item)] = getValue!(item);
    });
    return map;
  };

  Array.prototype.all = function (predicate: (item: any) => boolean) {
    return this.findIndex((item) => !predicate(item)) == -1;
  };

  Array.prototype.contains = function (
    item: any,
    getItemKey?: (item: any) => any
  ) {
    if (getItemKey) {
      const key = getItemKey(item);
      return this.find((i) => getItemKey(i) == key) != null;
    }
    return this.indexOf(item) != -1;
  };

  Array.prototype.reversed = function () {
    return this.slice().reverse();
  };

  Array.prototype.removeAt = function (index: number) {
    this.splice(index, 1);
  };

  Array.prototype.insertAt = function (
    index: number,
    item: any,
    appendToEnd: boolean
  ) {
    if (appendToEnd && index > this.length) index = this.length;
    this.splice(index, 0, item);
  };

  Array.prototype.removeBy = function (predicate: (item: any) => boolean) {
    const index = this.findIndex(predicate);
    if (index != -1) this.removeAt(index);
  };

  Array.prototype.removeByField = function (key: string, value: any) {
    this.removeBy((item) => item[key] == value);
  };

  Array.prototype.clear = function (stagger?: number) {
    if (!stagger) {
      this.splice(0, this.length);
      return;
    }
    const removeOne = () => {
      if (this.length > 0) {
        this.pop();
        setTimeout(removeOne, stagger);
      }
    };
    removeOne();
  };

  Array.prototype.add = async function (items: any[], stagger: number = 0) {
    if (!Array.isArray(items)) items = [items];
    items = [...items];
    if (!stagger) {
      this.push(...items);
      return;
    }
    const addOne = async () => {
      if (items.length > 0) {
        this.push(items.shift());
        setTimeout(addOne, stagger);
      }
    };
    addOne();
  };

  Array.prototype.take = function (count: number) {
    return this.slice(0, count);
  };

  Array.prototype.replace = async function (
    getNewItems: () => Promise<any[]>,
    stagger: number = 0,
    getItemKey?: (item: any) => string
  ) {
    if (getItemKey) {
      let newItems = await getNewItems();
      const processNext = async (i: number) => {
        if (i > Math.max(this.length, newItems.length)) return;
        if (this[i] && !newItems.contains(this[i], getItemKey))
          this.removeAt(i);
        if (newItems[i] && !this.contains(newItems[i], getItemKey))
          this.insertAt(i, newItems[i], true);
        setTimeout(() => processNext(i + 1), stagger);
      };
      processNext(0);
    } else {
      this.clear(stagger);
      this.add(await getNewItems(), stagger);
    }
  };

  Array.prototype.sum = function (
    getValue?: (item: any) => number,
    getWeight?: (item: any) => number
  ) {
    if (!getValue) getValue = (item) => item;
    if (!getWeight) getWeight = (item) => 1;

    let sum = 0;

    for (const item of this) {
      sum += getValue(item) * getWeight(item);
    }

    return sum;
  };

  Array.prototype.min = function () {
    return Math.min.apply(null, this);
  };

  Array.prototype.max = function () {
    return Math.max.apply(null, this);
  };

  Array.prototype.average = function (
    getValue?: (item: any) => number,
    getWeight?: (item: any) => number
  ) {
    if (this.length === 0) {
      return 0;
    }

    if (!getValue) getValue = (item) => item;
    if (!getWeight) getWeight = (item) => 1;

    let sum = this.map(
      (n) => (getValue as any)(n) * (getWeight as any)(n)
    ).sum();
    return (sum / this.length).roundTo(3);
  };

  Array.prototype.first = function () {
    return this[0];
  };

  Array.prototype.last = function () {
    return this[this.length - 1];
  };

  Array.prototype.back = function () {
    return this.slice(0, this.length - 1);
  };

  Array.prototype.skip = function (count: number) {
    return this.slice(count);
  };

  Array.prototype.joinColumns = function (
    columns: (number | null)[],
    ellipsis?: boolean
  ) {
    if (!columns.length) return this.join(" ");
    return this.map((item, i) => {
      if (typeof item != "string") item = JSON.stringify(item);
      return `${(item || "").toLength(columns[i], ellipsis, "right")}`;
    }).join(" ");
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

  Array.prototype.exceptBy = function (
    items: any[],
    getItemKey?: (item: any) => any
  ) {
    if (!getItemKey) getItemKey = (item) => item;
    const itemKeys = items.map(getItemKey);
    return this.filter((item) => !itemKeys.includes((getItemKey as any)(item)));
  };

  Array.prototype.exceptLast = function (count: number) {
    return this.slice(0, this.length - count);
  };

  Array.prototype.sortBy = function (...projects: ((item: any) => any)[]) {
    return this.sort((a, b) => {
      const aVals = projects.map((project) => project(a));
      const bVals = projects.map((project) => project(b));
      return (0)._compare(aVals, bVals);
    });
  };

  Array.prototype.sortByDesc = function (...projects: ((item: any) => any)[]) {
    return [...this.sortBy(...projects)].reverse();
  };

  Array.prototype.stringify = function (): any {
    return JSON.stringify(this);
  };

  Array.prototype.onlyTruthy = function (): any {
    return this.filter((item) => !!item);
  };

  Array.prototype.shuffle = function (): any {
    return this.sortBy(() => Math.random() - 0.5);
  };

  Array.prototype.rotate = function (count: number = 1): any {
    const arr = this;

    if (arr.length == 0 || count == 0) return [...arr]; // Return an empty array if the array is empty

    const rotations = count % arr.length; // Calculate the effective number of rotations

    if (rotations === 0) {
      return arr.slice(); // Return a copy of the original array if no rotations are needed
    }

    const rotatedPart = arr.slice(0, rotations); // Extract the elements to be rotated
    const remainingPart = arr.slice(rotations); // Extract the remaining elements

    return remainingPart.concat(rotatedPart); // Concatenate the two parts to get the rotated array
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

  /**
   * If the original function is called multiple times within the specified delay,
   * the function will only be executed once at the end.
   */
  Function.prototype.debounce = function (delay: number) {
    const fn = this;
    let timeout: any;
    return function (this: any, ...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(async function () {
        await fn.apply(context, args);
      }, delay);
    };
  };

  /**
   * If the original function is called multiple times within the specified delay,
   * it will execute once every delay time.
   */
  Function.prototype.throttle = function (delay: number) {
    const fn = this;
    let timeout: any;
    return function (this: any, ...args) {
      fn.prototype.nextArgs = args;
      const context = this;
      if (!timeout) {
        timeout = setTimeout(async function () {
          await fn.apply(context, fn.prototype.nextArgs);
          timeout = null;
        }, delay);
      }
    };
  };
}

// #endregion
