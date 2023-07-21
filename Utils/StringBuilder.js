"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringBuilder = void 0;
var StringBuilder = /** @class */ (function () {
    function StringBuilder(indent) {
        if (indent === void 0) { indent = 0; }
        this.lines = [];
        this.indentation = 0;
        this.indentation = indent;
    }
    StringBuilder.prototype.getLines = function () {
        return this.lines;
    };
    StringBuilder.prototype.addLine = function (line) {
        this.lines.push(this.getIndentStr() + line);
        return this;
    };
    StringBuilder.prototype.addLines = function (lines) {
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            this.addLine(line);
        }
        return this;
    };
    StringBuilder.prototype.indent = function () {
        this.indentation++;
        return this;
    };
    StringBuilder.prototype.unindent = function () {
        this.indentation--;
        return this;
    };
    StringBuilder.prototype.getIndentStr = function () {
        return " ".repeat(this.indentation);
    };
    StringBuilder.prototype.toString = function () {
        return this.lines.join("\n");
    };
    return StringBuilder;
}());
exports.StringBuilder = StringBuilder;
