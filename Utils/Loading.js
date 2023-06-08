"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loading = void 0;
var Loading = /** @class */ (function () {
    function Loading(info) {
        this.info = info;
        this.isRunning = false;
        this.startTime = null;
    }
    Loading.startNew = function (info) {
        var loading = new Loading(info);
        loading.start(info);
        return loading;
    };
    Loading.prototype.start = function (info) {
        this.startTime = Date.now();
        this.isRunning = true;
        this.showInfo();
    };
    Loading.prototype.stop = function () {
        if (!this.isRunning)
            return;
        this.isRunning = false;
        this.startTime = null;
        process.stdout.write("\r");
        process.stdout.clearLine(0);
    };
    Loading.prototype.showInfo = function () {
        if (!this.isRunning)
            return;
        var elapsedTime = Date.now() - this.startTime;
        process.stdout.write("\r");
        process.stdout.write("".concat(elapsedTime.unitifyTime(), " ").concat(this.info || ""));
        if (this.isRunning) {
            setTimeout(this.showInfo.bind(this), 100);
        }
    };
    return Loading;
}());
exports.Loading = Loading;
