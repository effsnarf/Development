var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
var IntervalCounter = /** @class */ (function () {
    function IntervalCounter(timeSpan) {
        this.timeSpan = timeSpan;
        this._sum = 0;
        this.items = [];
    }
    IntervalCounter.prototype.track = function (value) {
        var dt = Date.now();
        this.items.push({ dt: dt, value: value });
        this._sum += value;
        while (this.items.length && this.items[0].dt < dt - this.timeSpan) {
            var oldItem = this.items.shift();
            if (!oldItem)
                throw new Error("This shouldn't happen");
            this._sum -= oldItem.value;
        }
    };
    Object.defineProperty(IntervalCounter.prototype, "count", {
        get: function () {
            return this.items.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(IntervalCounter.prototype, "sum", {
        get: function () {
            return this._sum;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(IntervalCounter.prototype, "average", {
        get: function () {
            return Math.round(this._sum / this.count);
        },
        enumerable: false,
        configurable: true
    });
    return IntervalCounter;
}());
var Timer = /** @class */ (function () {
    function Timer(data, onDone) {
        this.isRunning = false;
        this.started = null;
        this.logs = new Map();
        this._data = data;
        this.onDone = onDone;
    }
    Timer.new = function (data, onDone) {
        if (data === void 0) { data = null; }
        if (onDone === void 0) { onDone = function () { }; }
        return new Timer(data, onDone);
    };
    Timer.measure = function (action) {
        return Timer.new().measure({}, action);
    };
    Timer.start = function () {
        var timer = Timer.new();
        timer.start();
        return timer;
    };
    Timer.prototype.log = function (key, value) {
        if (!value && !this.isRunning)
            throw new Error("Timer must be running to log");
        if (!value)
            value = this.elapsed || 0;
        if (!this.logs.has(key))
            this.logs.set(key, []);
        var log = this.logs.get(key);
        log === null || log === void 0 ? void 0 : log.push(value);
        return this;
    };
    Timer.prototype.getLogs = function () {
        return __spreadArray([], this.logs.entries(), true).map(function (e) {
            return { key: e[0], average: e[1].average() };
        });
    };
    Timer.prototype.measure = function (data, action) {
        return __awaiter(this, void 0, void 0, function () {
            var ex_1, ended;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = __assign(__assign({}, this._data), data);
                        this.start();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, action()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        ex_1 = _a.sent();
                        data.ex = ex_1;
                        return [3 /*break*/, 5];
                    case 4:
                        ended = Date.now();
                        this.stop();
                        data.elapsed = this.elapsed;
                        this.onDone(data);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Timer.prototype.start = function () {
        this.started = Date.now();
        this.isRunning = true;
    };
    Timer.prototype.stop = function () {
        this.isRunning = false;
    };
    Timer.prototype.restart = function () {
        this.stop();
        this.start();
    };
    Object.defineProperty(Timer.prototype, "elapsed", {
        get: function () {
            if (!this.started)
                return null;
            return Date.now() - this.started;
        },
        enumerable: false,
        configurable: true
    });
    return Timer;
}());
