const colorCodes = {
  codeNumToColor: {
    "0": "reset",
    "1": "bright",
    "2": "dim",
    "4": "underscore",
    "5": "blink",
    "7": "reverse",
    "8": "hidden",
    "30": "black",
    "31": "red",
    "32": "green",
    "33": "yellow",
    "34": "blue",
    "35": "magenta",
    "36": "cyan",
    "37": "white",
    "40": "bgBlack",
    "41": "bgRed",
    "42": "bgGreen",
    "43": "bgYellow",
    "44": "bgBlue",
    "45": "bgMagenta",
    "46": "bgCyan",
    "47": "bgWhite",
  } as any,
  colorToCodeNum: {
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
  colorToCodeChar: {
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

const is = (value: any, type: any) => {
  switch (type) {
    case String:
      return typeof value === "string" || value instanceof String;
    case Number:
      return typeof value === "number" && isFinite(value);
    case Boolean:
      return typeof value === "boolean";
    case Array:
      return Array.isArray(value);
    case Object:
      return (
        value !== null && typeof value === "object" && !Array.isArray(value)
      );
    default:
      return value instanceof type;
  }
};

interface Number {
  is(type: any): boolean;
  stringify(unit: string, places?: number): string;
  severity(green: number, yellow: number): string;
}

if (typeof Number !== "undefined") {
  Number.prototype.is = function (type: any): boolean {
    return is(this, type);
  };

  Number.prototype.stringify = function (
    unit: string,
    places?: number
  ): string {
    if (!places) places = 0;
    let value = this.valueOf();
    if (unit == "bar") {
      if (!places) places = 50;
      const barLength = places - ` 100%`.length;
      const progressLength = Math.round(value * barLength);
      const bar = "█".repeat(progressLength);
      const emptyLength = barLength - progressLength;
      const empty = emptyLength <= 0 ? "" : "█".repeat(emptyLength).gray;
      return `${bar}${empty} ${value.stringify("%").withoutColors()}`;
    }
    if (unit == "s") value = value / 1000;
    if (unit == "m") value = value / 1000 / 60;

    const isNegative = value < 0;
    const absValue = Math.abs(value);
    const isInteger = absValue % 1 === 0;
    let stringValue = isInteger ? absValue.toString() : absValue.toFixed(2);
    const sign = isNegative ? "-" : "";
    if (unit == "%") {
      stringValue = (absValue * 100).toFixed(places);
      if (absValue < 0.8) stringValue = stringValue.bgRed.black;
      else if (absValue < 0.95) stringValue = stringValue.bgYellow.black;
      else stringValue = stringValue.green;
    }
    return `${sign}${stringValue}${unit.gray}`;
  };

  Number.prototype.severity = function (green: number, yellow: number): string {
    const value = this.valueOf();
    if (value < green) return value.toString().green;
    if (value < yellow) return value.toString().yellow;
    return value.toString().bgRed;
  };
}

// interface Number {
//   toTimeSpan(): TimeSpan;
//   fromMinutes(): TimeSpan;
// }

// if (typeof Number !== "undefined") {
//   Number.prototype.toTimeSpan = function (): TimeSpan {
//     return TimeSpan.new(this.valueOf());
//   };

//   Number.prototype.fromMinutes = function (): TimeSpan {
//     return TimeSpan.new(this.valueOf() * 60 * 1000);
//   };
// }

interface Object {
  is(type: any): boolean;
  clone(): any;
  on(key: string, callback: (value: any) => void): void;
  traverse(onValue: (node: any, key: string, value: any) => void): void;
  toCamelCaseKeys(): any;
  stringify(): string;
  deepMerge(...objects: any[]): any;
}

if (typeof Object !== "undefined") {
  Object.prototype.is = function (type: any): boolean {
    return is(this, type);
  };

  Object.prototype.clone = function () {
    return JSON.parse(JSON.stringify(this));
  };

  Object.prototype.on = function (key: string, callback: (value: any) => void) {
    const self = this as any;
    // If already has a getter/setter, replace it
    const descriptor = Object.getOwnPropertyDescriptor(self, key);
    if (descriptor && (descriptor.get || descriptor.set)) {
      if (!descriptor.get)
        throw new Error("Cannot watch a non-getter property");
      if (!descriptor.set)
        throw new Error("Cannot watch a non-setter property");
      const getter = descriptor.get;
      const setter = descriptor.set;
      Object.defineProperty(self, key, {
        get: function () {
          return getter();
        },
        set: function (newValue) {
          setter(newValue);
          callback(newValue);
        },
      });
      return;
    }
    // Store the value in a private variable
    let value = self[key];
    // Create a getter/setter for the property
    Object.defineProperty(self, key, {
      get: function () {
        return value;
      },
      set: function (newValue) {
        value = newValue;
        callback(newValue);
      },
    });
  };

  Object.prototype.traverse = function (
    onValue: (node: any, key: string, value: any) => void
  ) {
    const traverse = function (node: any, key: string, value: any) {
      onValue(node, key, value);
      if (value && typeof value === "object") {
        for (const k of Object.keys(value)) {
          traverse(value, k, value[k]);
        }
      }
    };
    traverse(this, "", this);
  };

  Object.prototype.toCamelCaseKeys = function () {
    const result = {};
    for (const key of Object.keys(this)) {
      (result as any)[key.toCamelCase()] = (this as any)[key];
    }
    return result;
  };

  Object.prototype.stringify = function (): any {
    return JSON.stringify(this);
  };

  Object.prototype.deepMerge = function (...objects: any[]): any {
    const deepMerge = (target: any, source: any) => {
      if (typeof target !== "object" || typeof source !== "object") {
        return target;
      }

      const merged = target.clone();
      for (const key of Object.keys(source)) {
        if (key in merged) {
          merged[key] = deepMerge(merged[key], source[key]);
        } else {
          merged[key] = source[key];
        }
      }
      return merged;
    };

    let result = this;
    for (const object of objects) {
      result = deepMerge(result, object);
    }
    return result;
  };
}

interface Array<T> {
  sum(): number;
  last(): any;
  distinct(project?: ((item: T) => any) | null): T[];
  except(...items: T[]): T[];
  stringify(): string;
}

interface Function {
  is(type: any): boolean;
  getArgumentNames(): string[];
}

if (typeof Function !== "undefined") {
  Function.prototype.is = function (type: any): boolean {
    return is(this, type);
  };

  Function.prototype.getArgumentNames = function () {
    const code = this.toString();
    const args = code
      .slice(code.indexOf("(") + 1, code.indexOf(")"))
      .match(/([^\s,]+)/g);
    return args || [];
  };
}

if (typeof Array !== "undefined") {
  Array.prototype.sum = function () {
    return this.reduce((a, b) => a + b, 0);
  };

  Array.prototype.last = function () {
    return this[this.length - 1];
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

  Array.prototype.stringify = function (): any {
    return JSON.stringify(this);
  };
}

interface String {
  is(type: any): boolean;
  color(color: string): string;
  padStartChars(maxLength: number, fillString?: string): string;
  sliceChars(start: number | undefined, end?: number | undefined): string;
  alignRight(): string;
  shorten(maxLength: number): string;
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
  toShortPath(): string;
  toAbsolutePath(path: any): string;
}

if (typeof String !== "undefined") {
  String.prototype.is = function (type: any): boolean {
    return is(this, type);
  };

  String.prototype.color = function (color: string): string {
    return eval(`this.${color}`);
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

  String.prototype.shorten = function (maxLength: number): string {
    if (this.length > maxLength) return this.slice(0, maxLength) + "...";
    return this.toString();
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
        const colorName = colorCodes.codeNumToColor[colorCode];
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
      if (!colorCodes.colorToCodeNum[color]) return content;
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
      if (!colorCodes.colorToCodeChar[color]) return content;
      return `${
        colorCodes.colorToCodeChar[color]
      }${content.handlebarsColorsToConsole()}${
        colorCodes.colorToCodeChar["reset"]
      }`;
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

  String.prototype.toShortPath = function (): string {
    const path = this.toString().replace(/\\/g, "/");
    let parts = path.split("/");
    // Return the last 2 parts of the path
    parts = parts.slice(Math.max(parts.length - 2, 0));
    let s = `${parts[0].yellow}${`\\`.gray}${parts[1]}`;
    if (parts.length > 2) {
      s = `${s} (${parts.slice(0, -2).join("\\")})`.gray;
    }
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
}
