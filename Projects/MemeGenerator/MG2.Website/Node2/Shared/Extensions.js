"use strict";
class TimeSpan {
    constructor(value) {
      this.value = value;
    }
  
    static new(value) {
      return new TimeSpan(value);
    }

    static fromMinutes(minutes) {
        return TimeSpan.new(minutes * 60 * 1000);
    }
  
    toString() {
      const seconds = this.value / 1000;
      const minutes = seconds / 60;
      const hours = minutes / 60;
      const days = hours / 24;
  
      if (days >= 1) return `${days.toFixed(1)} day${days >= 2 ? "s" : ""}`;
      if (hours >= 1) return `${hours.toFixed(1)} hour${hours >= 2 ? "s" : ""}`;
      if (minutes >= 1) return `${minutes.toFixed(1)} minute${minutes >= 2 ? "s" : ""}`;
      if (seconds >= 1) return `${seconds.toFixed(1)} second${seconds >= 2 ? "s" : ""}`;
      return `${this.value} ms`;
    }
  }
  
if (typeof Number !== "undefined") {
Number.prototype.toTimeSpan = function () {
    return TimeSpan.new(this.valueOf());
};

Number.prototype.fromMinutes = function () {
    return TimeSpan.new(this.valueOf() * 60 * 1000);
};
}
  
if (typeof Object !== "undefined") {
    Object.traverse = function (onValue) {
        const traverse = function (node, key, value) {
            onValue(node, key, value);
            if (value && typeof value === "object") {
                for (const k of Object.keys(value)) {
                    traverse(value, k, value[k]);
                }
            }
        };
        traverse(this, "", this);
    };
    Object.toCamelCaseKeys = function () {
        const result = {};
        for (const key of Object.keys(this)) {
            result[key.toCamelCase()] = this[key];
        }
        return result;
    };
    Object.stringify = function () {
        return JSON.stringify(this);
    };
}
if (typeof Function !== "undefined") {
    Function.prototype.getArgumentNames = function () {
        const code = this.toString();
        const args = code
            .slice(code.indexOf("(") + 1, code.indexOf(")"))
            .match(/([^\s,]+)/g);
        return args || [];
    };
}
if (typeof Array !== "undefined") {
    Array.prototype.last = function () {
        return this[this.length - 1];
    };
    Array.prototype.stringify = function () {
        return JSON.stringify(this);
    };
}
if (typeof String !== "undefined") {
    String.prototype.alignRight = function () {
        const width = process.stdout.columns;
        const padding = " ".repeat(Math.max(width - this.length, 0));
        return `${padding}${this}`;
    };
    String.prototype.shorten = function (maxLength) {
        if (this.length > maxLength)
            return this.slice(0, maxLength) + "...";
        return this.toString();
    };
    String.prototype.trimAll = function () {
        return this.replace(/[\t\n]/g, "").trim();
    };
    // Trim double quotes from a string if they exist
    String.prototype.trimDoubleQuotes = function () {
        if (this.startsWith('"') && this.endsWith('"'))
            return this.slice(1, -1);
        return this.toString();
    };
    String.prototype.stripHtmlTags = function () {
        return (this
            // Replace <br /> with a new line
            .replace(/<br\s*[\/]?>/gi, "\n")
            // Remove HTML tags
            .replace(/(<([^>]+)>)/gi, " "));
    };
    String.prototype.decodeHtml = function () {
        return (this.replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            // Replace &#[number]; with the unicode character
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec)));
    };
    String.prototype.getWords = function () {
        // Get the words using a regex
        return this.match(/\w+/g) || [];
    };
    String.prototype.toCamelCase = function () {
        // Lowercase the first letter
        return this.charAt(0).toLowerCase() + this.slice(1);
      };    
    String.prototype.parseJSON = function () {
        return JSON.parse(this.toString());
    };
}
