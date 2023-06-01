"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var Time = /** @class */ (function () {
    function Time() {
    }
    Time.prevUnit = function (unit) {
        return this.units[this.units.indexOf(unit) - 1];
    };
    Time.nextUnit = function (unit) {
        return this.units[this.units.indexOf(unit) + 1];
    };
    Time.units = [
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
    Time.unitToValue = {
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
    return Time;
}());
var Size = /** @class */ (function () {
    function Size() {
    }
    Size.prevUnit = function (unit) {
        return this.units[this.units.indexOf(unit) - 1];
    };
    Size.nextUnit = function (unit) {
        return this.units[this.units.indexOf(unit) + 1];
    };
    Size.units = [
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
    Size.unitToValue = {
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
    return Size;
}());
var Percentage = /** @class */ (function () {
    function Percentage() {
    }
    Percentage.prevUnit = function (unit) {
        return this.units[this.units.indexOf(unit) - 1];
    };
    Percentage.nextUnit = function (unit) {
        return this.units[this.units.indexOf(unit) + 1];
    };
    Percentage.units = ["%"];
    Percentage.unitToValue = {
        "%": 100,
    };
    return Percentage;
}());
var UnitClasses = [Time, Size, Percentage];
var color = {
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
    },
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
    },
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
    },
};
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
    Number.prototype._is = function (obj, type) {
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
    Number.prototype.is = function (type) {
        return (0)._is(this, type);
    };
    Number.prototype.seconds = function () {
        return this.valueOf() * 1000;
    };
    Number.prototype.minutes = function () {
        return (this.valueOf() * 60).seconds();
    };
    Number.prototype.hours = function () {
        return (this.valueOf() * 60).minutes();
    };
    Number.prototype.days = function () {
        return (this.valueOf() * 24).hours();
    };
    Number.prototype.weeks = function () {
        return (this.valueOf() * 7).days();
    };
    Number.prototype.months = function () {
        return (this.valueOf() * 30).days();
    };
    Number.prototype.years = function () {
        return (this.valueOf() * 365).days();
    };
    Number.prototype.wait = function (options) {
        var _this = this;
        if (options === void 0) { options = { log: false }; }
        var timer = null;
        var started = Date.now();
        if (options.log) {
            timer = setInterval(function () {
                var elapsed = started + _this.valueOf() - Date.now();
                process.stdout.write("\r");
                process.stdout.write("".concat("Waiting -".gray).concat(elapsed.unitifyTime(), "\r"));
            }, 100);
        }
        return new Promise(function (resolve) {
            return setTimeout(function () {
                if (timer) {
                    clearInterval(timer);
                    process.stdout.write("\r");
                    process.stdout.clearLine(0);
                }
                resolve();
            }, _this.valueOf());
        });
    };
    Number.prototype.isBetween = function (min, max, strictOrder) {
        // strictOrder: if false, max could be min and vice versa
        var value = this.valueOf();
        if (strictOrder)
            return value > min && value < max;
        return (value > min && value < max) || (value > max && value < min);
    };
    Number.prototype.isBetweenOrEq = function (min, max, strictOrder) {
        // strictOrder: if false, max could be min and vice versa
        var value = this.valueOf();
        if (strictOrder)
            return value >= min && value <= max;
        return (value >= min && value <= max) || (value >= max && value <= min);
    };
    Number.prototype.pluralize = function (plural) {
        var singular = plural.singularize();
        if (this.valueOf() === 1)
            return "".concat(this, " ").concat(singular);
        return "".concat(this, " ").concat(plural);
    };
    Number.prototype.unitify = function (unitClass, unit) {
        // ["m", "s", "ms"] should:
        // return "230ms" if value is < 1000
        // return "1.23s" if value is < 60000 and > 1000
        // return "1.23m" if value is > 60000
        if (!(unit === null || unit === void 0 ? void 0 : unit.length))
            unit = unitClass.units;
        var value = this.valueOf();
        // Percent is a special case
        if (unitClass == Percentage)
            return "".concat(Math.round(value * 100)).concat("%".gray);
        var units = !Array.isArray(unit)
            ? [unit]
            : unit.sortByDesc(function (u) { return unitClass.unitToValue[u]; });
        if (this == 0)
            return "0".concat(units.last()).gray;
        for (var _i = 0, units_1 = units; _i < units_1.length; _i++) {
            var u = units_1[_i];
            var currentUnitValue = unitClass.unitToValue[u];
            var nextUnitValue = unitClass.unitToValue[unitClass.nextUnit(u)];
            if (value.isBetweenOrEq(currentUnitValue, nextUnitValue)) {
                var unitValue = value / currentUnitValue;
                if (unitValue >= 10 || u == units.last()) {
                    return "".concat(unitValue.toFixed(0)).concat(u.gray);
                }
                return "".concat(unitValue.toFixedRounded(2)).concat(u.gray);
            }
        }
        if (value == 0)
            return "".concat(value).concat(units.last().gray);
        return "".concat(value.toFixed(0)).concat(units.last().gray);
    };
    Number.prototype.unitifyTime = function (unit) {
        return this.unitify(Time, unit);
    };
    Number.prototype.unitifySize = function (unit) {
        return this.unitify(Size, unit);
    };
    Number.prototype.unitifyPercent = function () {
        return this.unitify(Percentage);
        //return `${Math.round(this.valueOf() * 100)}${`%`.gray}`;
    };
    Number.prototype.toProgressBar = function (barLength) {
        var severifyArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            severifyArgs[_i - 1] = arguments[_i];
        }
        var value = this.valueOf();
        if (!barLength)
            barLength = 50;
        barLength = barLength - " 100%".length;
        var progressLength = Math.round(value * barLength);
        var bar = "█".repeat(progressLength);
        var emptyLength = barLength - progressLength;
        var empty = emptyLength <= 0 ? "" : "█".repeat(emptyLength).gray;
        var s = "".concat(bar).concat(empty, " ").concat(value.unitifyPercent().withoutColors());
        if (severifyArgs.length)
            s = s.colorize(value.getSeverityColor(severifyArgs[0], severifyArgs[1], severifyArgs[2]));
        return s;
    };
    Number.prototype.severify = function (green, yellow, direction) {
        return this.toString().colorize(this.getSeverityColor(green, yellow, direction, true));
    };
    Number.prototype.severifyByHttpStatus = function () {
        var value = this.valueOf();
        return value.severify(200, 400, "<");
    };
    Number.prototype.getSeverityColor = function (green, yellow, direction, bgRed) {
        var value = this.valueOf();
        if (direction == "<") {
            if (value <= green)
                return "green";
            if (value <= yellow)
                return "yellow";
            return bgRed ? "bgRed" : "red";
        }
        if (direction == ">") {
            if (value >= green)
                return "green";
            if (value >= yellow)
                return "yellow";
            return bgRed ? "bgRed" : "red";
        }
        throw new Error("Invalid direction: ".concat(direction));
    };
    Number.prototype.toFixedRounded = function (places) {
        var value = this.valueOf();
        var str = value.toFixed(places);
        while (str.endsWith("0"))
            str = str.slice(0, -1);
        if (str.endsWith("."))
            str = str.slice(0, -1);
        return str;
    };
    Number.prototype.ordinalize = function () {
        var number = this.valueOf();
        if (number === 0) {
            return "0"; // No ordinal representation for 0
        }
        var suffixes = ["th", "st", "nd", "rd"];
        var mod100 = number % 100;
        var mod10 = number % 10;
        if (mod10 === 1 && mod100 !== 11) {
            return number + "st";
        }
        else if (mod10 === 2 && mod100 !== 12) {
            return number + "nd";
        }
        else if (mod10 === 3 && mod100 !== 13) {
            return number + "rd";
        }
        else {
            return number + "th";
        }
    };
}
// #endregion
// #region String
if (typeof String !== "undefined") {
    String.prototype.is = function (type) {
        return (0)._is(this, type);
    };
    String.prototype.isColorCode = function () {
        return this.startsWith("\x1b[");
    };
    String.prototype.pad = function (align, fillString) {
        if (!align)
            align = "left";
        if (align === "left")
            return "".concat(fillString).concat(this);
        return "".concat(this).concat(fillString);
    };
    // Returns the next character in the string ("abcd" => "a")
    // In case of console color codes, it returns the whole color code
    String.prototype.nextChar = function () {
        var s = this.toString();
        if (s.isColorCode()) {
            return s.slice(0, 5);
        }
        return s[0];
    };
    // "[red]ab[/reset]cdef" -> ["[red]", "a", "b", "[reset]", "c", "d", "e", "f"]
    String.prototype.getChars = function () {
        var s, char;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    s = this.toString();
                    _a.label = 1;
                case 1:
                    if (!(s.length > 0)) return [3 /*break*/, 3];
                    char = s.nextChar();
                    return [4 /*yield*/, char];
                case 2:
                    _a.sent();
                    s = s.slice(char.length);
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    };
    String.prototype.colorize = function (color) {
        return eval("this.".concat(color));
    };
    String.prototype.singularize = function () {
        if (this.endsWith("ies"))
            return this.slice(0, -3) + "y";
        if (this.endsWith("s"))
            return this.slice(0, -1);
        return this.toString();
    };
    String.prototype.pluralize = function () {
        if (this.endsWith("y"))
            return this.slice(0, -1) + "ies";
        if (this.endsWith("s"))
            return this.toString();
        return this + "s";
    };
    String.prototype.antonym = function () {
        var antonyms = [
            ["up", "down"],
            ["left", "right"],
            ["top", "bottom"],
            ["start", "end"],
            ["before", "after"],
            ["above", "below"],
            ["first", "last"],
            ["front", "back"],
        ];
        for (var _i = 0, antonyms_1 = antonyms; _i < antonyms_1.length; _i++) {
            var _a = antonyms_1[_i], a = _a[0], b = _a[1];
            if (this === a)
                return b;
            if (this === b)
                return a;
        }
        return this.toString();
    };
    String.prototype.severify = function (green, yellow, direction) {
        var valueStr = this.toString();
        var unitClass = valueStr.getUnitClass();
        if (!unitClass)
            throw new Error("No unit class found");
        var value = valueStr.deunitify(unitClass);
        var unit = valueStr.getUnit();
        var color = value.getSeverityColor(green, yellow, direction, true);
        return "".concat(value.unitify(unitClass).withoutUnit().colorize(color)).concat(unit.gray);
    };
    String.prototype.severifyByHttpStatus = function (statusCode) {
        if (!statusCode)
            statusCode = this.split(" ")
                .map(function (s) { return parseInt(s); })
                .find(function (n) { return !isNaN(n); });
        if (!statusCode)
            return this.toString();
        return this.colorize(statusCode.getSeverityColor(200, 400, "<"));
    };
    String.prototype.deunitify = function (unitClass) {
        // Percentages are special, because they are relative to 100
        if (unitClass === Percentage) {
            var value_1 = parseFloat(this.withoutUnit());
            return value_1 / 100;
        }
        var s = this.withoutColors();
        var unit = s.getUnit();
        var value = parseFloat(s.withoutUnit());
        return value * (unit ? unitClass.unitToValue[unit] : 1);
    };
    String.prototype.deunitifyTime = function () {
        return this.deunitify(Time);
    };
    String.prototype.deunitifySize = function () {
        return this.deunitify(Size);
    };
    String.prototype.deunitifyPercent = function () {
        return this.deunitify(Percentage);
    };
    String.prototype.getUnit = function () {
        return this.withoutColors().replace(/[0-9\.]/g, "");
    };
    String.prototype.getUnitClass = function () {
        var unit = this.getUnit();
        if (Time.units.includes(unit))
            return Time;
        if (Size.units.includes(unit))
            return Size;
        if (Percentage.units.includes(unit))
            return Percentage;
        return null;
    };
    String.prototype.withoutUnit = function () {
        return this.withoutColors().replace(/[^0-9.-]/g, "");
    };
    String.prototype.padStartChars = function (maxLength, fillString) {
        if (fillString === undefined)
            fillString = " ";
        var result = this;
        while (result.getCharsCount() < maxLength) {
            result = fillString + result;
        }
        return result.toString();
    };
    // Slice a string by character count instead of by byte count
    // Copies color codes too but doesn't count them in the character count
    String.prototype.sliceChars = function (start, end) {
        if (start === undefined)
            start = 0;
        if (end === undefined)
            end = this.length;
        var result = "";
        var charCount = 0;
        for (var i = 0; i < this.length; i++) {
            var char = this[i];
            if (char === "\u001b") {
                var colorCode = this.slice(i, i + 9);
                result += colorCode;
                i += colorCode.length - 1;
                continue;
            }
            if (charCount >= start && charCount < end)
                result += char;
            charCount++;
        }
        return result;
    };
    String.prototype.alignRight = function () {
        var width = process.stdout.columns;
        var padding = " ".repeat(Math.max(width - this.length, 0));
        return "".concat(padding).concat(this);
    };
    String.prototype.shorten = function (maxLength, ellipsis) {
        if (ellipsis === void 0) { ellipsis = true; }
        if (maxLength == null)
            return this.toString();
        if (ellipsis)
            maxLength -= 2;
        var s = this.toString();
        if (s.getCharsCount() > maxLength) {
            s = s.sliceChars(0, maxLength);
            if (ellipsis)
                s += "..";
        }
        return s;
    };
    String.prototype.toLength = function (length, ellipsis, align) {
        if (!align)
            align = "left";
        var s = (this || "").toString().shorten(length, ellipsis);
        if (length)
            s = s.pad(align.antonym(), " ".repeat(Math.max(0, length - s.getCharsCount())));
        return s;
    };
    String.prototype.splitOnWidth = function (width) {
        var lines = [];
        var currentLine = "";
        var colorStack = [];
        for (var _i = 0, _a = this.getChars(); _i < _a.length; _i++) {
            var char = _a[_i];
            if (char.isColorCode())
                colorStack.push(char);
            if (currentLine.getCharsCount() >= width) {
                // new line
                if (colorStack.length > 0)
                    // reset the color
                    currentLine += color.toChar.reset;
                lines.push(currentLine);
                currentLine = "";
                colorStack.forEach(function (c) { return (currentLine += c); });
                colorStack = [];
            }
            currentLine += char;
        }
        if (currentLine.length > 0)
            lines.push(currentLine);
        return lines;
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
            .replace(/&#(\d+);/g, function (match, dec) {
            return String.fromCharCode(dec);
        })
            // Replace &#x[number]; with the unicode character
            .replace(/&#x([0-9a-f]+);/gi, function (match, hex) {
            return String.fromCharCode(parseInt(hex, 16));
        }));
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
    String.prototype.truncate = function (maxLength) {
        if (this.getCharsCount() <= maxLength)
            return this.toString();
        var ellipsis = "..";
        maxLength = Math.max(0, maxLength - ellipsis.length);
        // Strip the color codes from the string
        //const stripped = this.replace(/\x1b\[[0-9;]*m/g, "");
        // Truncate the string
        //return stripped.slice(0, maxLength) + ellipsis;
        // Construct a new string with the max length
        // Copy the characters from the original string
        // Include the color codes but count only the characters that are not color codes
        // Add ".." to the end of the string
        var result = "";
        var charsCount = 0;
        for (var i = 0; i < this.length; i++) {
            var char = this.charAt(i);
            result += char;
            if (char === "\x1b") {
                // Skip the color code
                while (this.charAt(i) !== "m") {
                    i++;
                    result += this.charAt(i);
                }
            }
            else {
                charsCount++;
            }
            if (charsCount >= maxLength)
                break;
        }
        // At the end of the string, add the ellipsis
        result += ellipsis;
        // At the end of the string, reset the color
        result += "\x1b[0m";
        return result;
    };
    String.prototype.getCharsCount = function () {
        return this.length - this.getColorCodesLength();
    };
    String.prototype.getColorCodesLength = function () {
        var colorCodeRegex = /\x1b\[[0-9;]*m/g; // matches all ANSI escape sequences for console color codes
        var matches = this.match(colorCodeRegex);
        return matches ? matches.join("").length : 0;
    };
    String.prototype.withoutColors = function () {
        return this.replace(/\x1b\[[0-9;]*m/g, "");
    };
    String.prototype.showColorCodes = function () {
        return this.replace(/\x1B\[/g, "\\x1B[");
    };
    String.prototype.colorsToHandleBars = function () {
        // Create a regular expression pattern to match each console color escape sequence and replace it with the corresponding handlebars-style syntax
        var pattern = /\x1B\[(\d+)m(.+?)\x1B\[(\d+)m/g;
        var result = this.replace(pattern, function (match, colorCode, content) {
            var colorName = color.fromNumber[colorCode.toNumber()];
            if (colorName) {
                return "{{#".concat(colorName, "}}").concat(content, "{{/").concat(colorName, "}}");
            }
            else {
                return content;
            }
        });
        if (result.includes("\x1B")) {
            return result.colorsToHandleBars();
        }
        return result;
    };
    String.prototype.handlebarsColorsToHtml = function () {
        var pattern = /\{\{\#([^\{\}]*?)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
        var result = this.replace(pattern, function (match, color, content) {
            if (!color.colorToCodeNum[color])
                return content;
            return "<span class=\"".concat(color, "\">").concat(content.handleBarsColorsToHtml(), "</span>");
        });
        // If pattern is found, call the function recursively
        if (result.match(pattern)) {
            return result.handlebarsColorsToHtml();
        }
        return result;
    };
    String.prototype.handlebarsColorsToConsole = function () {
        // {{#red}}Hello {{#green}}World{{/green}}!{{/red}}
        // {{#red}}
        var pattern = /\{\{\#([^\{\}]*?)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
        // {{/red}}
        var result = this.replace(pattern, function (match, color, content) {
            if (!color.colorToCodeChar[color])
                return content;
            return "".concat(color.colorToCodeChar[color]).concat(content.handlebarsColorsToConsole()).concat(color.colorToCodeChar["reset"]);
        });
        // If pattern is found, call the function recursively
        if (result.match(pattern)) {
            return result.handlebarsColorsToConsole();
        }
        return result;
    };
    String.prototype.colorsToHtml = function () {
        return this.colorsToHandleBars().handlebarsColorsToHtml();
    };
    String.prototype.parseColorCodes = function () {
        var escapeRegex = /\x1b\[(\d+)m/g; // matches escape sequences in the form \x1b[<number>m
        var resetCode = "\x1b[0m"; // reset code to remove all colors and styles
        return this.replace(escapeRegex, function (_, code) {
            var colorCode = {
                30: "\x1b[30m",
                31: "\x1b[31m",
                32: "\x1b[32m",
                33: "\x1b[33m",
                34: "\x1b[34m",
                35: "\x1b[35m",
                36: "\x1b[36m",
                37: "\x1b[37m", // white
            }[code];
            return colorCode ? colorCode : resetCode;
        });
    };
    String.prototype.toShortPath = function (comparePath) {
        var path = this.toString().replace(/\\/g, "/");
        var allParts = path.split("/");
        // Return the last 2 parts of the path
        var parts = allParts.slice(Math.max(allParts.length - 2, 0));
        var s = "".concat(parts[0].yellow).concat("\\".gray).concat(parts[1]);
        if (parts.length > 2) {
            s = "".concat(s, " (").concat(parts.slice(0, -2).join("\\"), ")").gray;
        }
        if (comparePath) {
            var compareParts_1 = comparePath.replace(/\\/g, "/").split("/");
            var diffs = allParts.filter(function (part, index) {
                return part !== compareParts_1[index];
            });
            if (diffs.length > 0) {
                s = "".concat(diffs.join("\\").gray, "..\\").concat(s);
            }
        }
        s = "".concat("..\\".gray).concat(s);
        return s;
    };
    // Convert a relative path to an absolute path
    // If the path is already absolute, return it as is
    // If the path is relative, convert from the current working directory
    // If the path contains ..\, resolve the path
    String.prototype.toAbsolutePath = function (path) {
        if (path.isAbsolute(this.toString()))
            return path.resolve(this.toString());
        return path.resolve(path.join(process.cwd(), this.toString()));
    };
    String.prototype.toNumber = function () {
        return parseFloat(this.withoutColors());
    };
    String.prototype.isEqualPath = function (path) {
        return this.toString().normalizePath() === path.normalizePath();
    };
    String.prototype.normalizePath = function () {
        return this.toString().replace(/\//g, "\\");
    };
    // Make a string safe to use as a filename or directory name
    String.prototype.sanitizePath = function () {
        var sanitizePart = function (s) {
            if (s.length == 2 && s[1] == ":")
                return s;
            // Invalid characters in Windows filenames: \ / : * ? " < > |
            var invalidCharsRegex = /[\x00-\x1f\\\/:*?"<>|]/g;
            s = s.replace(invalidCharsRegex, "_");
            return s;
        };
        var parts = this.toString().replace(/\\/g, "/").split("/");
        var dirName = parts.slice(0, -1);
        var fileName = parts.slice(-1)[0];
        var extension = fileName.split(".").slice(-1)[0];
        var sanitized = __spreadArray(__spreadArray([], dirName, true), [
            sanitizePart(fileName.split(".").slice(0, -1).join(".")),
        ], false).join("/") + (extension ? ".".concat(extension) : "");
        return sanitized;
    };
    String.prototype.findParentDir = function (dirName) {
        var parts = this.toString().normalizePath().split("\\");
        var index = parts.indexOf(dirName);
        if (index === -1)
            throw new Error("Could not find ".concat(dirName, " in path"));
        return parts.slice(0, index + 1).join("\\");
    };
    String.prototype.ipToNumber = function () {
        var parts = this.split(".");
        return (parseInt(parts[0]) * 256 * 256 * 256 +
            parseInt(parts[1]) * 256 * 256 +
            parseInt(parts[2]) * 256 +
            parseInt(parts[3]));
    };
    String.prototype.decodeBase64 = function () {
        return Buffer.from(this, "base64").toString("ascii");
    };
    String.prototype.hashCode = function () {
        var str = this.toString();
        var hash = 0;
        if (str.length === 0) {
            return hash;
        }
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
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
        return this.reduce(function (a, b) { return a + b; }, 0);
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
    Array.prototype.joinColumns = function (columns, ellipsis) {
        if (!columns.length)
            return this.join(" ");
        return this.map(function (item, i) { return "".concat((item || "").toLength(columns[i], ellipsis, "right")); }).join(" ");
    };
    Array.prototype.distinct = function (project) {
        if (!project)
            project = function (item) { return item; };
        var result = [];
        var map = new Map();
        for (var _i = 0, _a = this; _i < _a.length; _i++) {
            var item = _a[_i];
            var key = project ? project(item) : item;
            if (!map.has(key)) {
                map.set(key, true);
                result.push(item);
            }
        }
        return result;
    };
    Array.prototype.except = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        return this.filter(function (item) { return !items.includes(item); });
    };
    Array.prototype.sortBy = function (project) {
        return __spreadArray([], this, true).sort(function (a, b) {
            var aKey = project(a);
            var bKey = project(b);
            if (aKey < bKey)
                return -1;
            if (aKey > bKey)
                return 1;
            return 0;
        });
    };
    Array.prototype.sortByDesc = function (project) {
        return __spreadArray([], this.sortBy(project), true).reverse();
    };
    Array.prototype.stringify = function () {
        return JSON.stringify(this);
    };
}
// #endregion
// #region Function
if (typeof Function !== "undefined") {
    Function.prototype.is = function (type) {
        return (0)._is(this, type);
    };
    Function.prototype.getArgumentNames = function () {
        var code = this.toString();
        var args = code
            .slice(code.indexOf("(") + 1, code.indexOf(")"))
            .match(/([^\s,]+)/g);
        return args || [];
    };
    Function.prototype.postpone = function (delay) {
        var fn = this;
        return function () {
            setTimeout(fn, delay);
        };
    };
}
// #endregion
