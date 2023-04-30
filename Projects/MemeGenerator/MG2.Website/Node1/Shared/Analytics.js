"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analytics = void 0;
const MongoDatabase_1 = require("./MongoDatabase");
class Analytics {
    constructor() { }
    static new(connectionString = null, database = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!connectionString)
                connectionString = Analytics.defaults.connectionString;
            if (!database)
                database = Analytics.defaults.database;
            const analytics = new Analytics();
            analytics.db = yield MongoDatabase_1.MongoDatabase.new(connectionString, database);
            return analytics;
        });
    }
    create(category, event, value, elapsed) {
        return __awaiter(this, void 0, void 0, function* () {
            const dt = Date.now();
            const data = {
                d: dt,
                c: category,
                e: event,
                v: value,
            };
            if (elapsed != undefined)
                data["elp"] = elapsed;
            const doc = yield this.db.upsert("Events", data);
            return doc;
        });
    }
    update(eventID, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const newDoc = yield this.db.upsert("Events", { _id: eventID, v: value });
            return newDoc;
        });
    }
    count(category, event) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.count("Events", { c: category, e: event });
        });
    }
}
exports.Analytics = Analytics;
Analytics.defaults = {
    connectionString: "",
    database: "",
};
