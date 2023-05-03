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
  toShortPath(): string;
  toAbsolutePath(path: any): string;
}

if (typeof String !== "undefined") {
  String.prototype.is = function (type: any): boolean {
    return is(this, type);
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
