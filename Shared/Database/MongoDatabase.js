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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDatabase = void 0;
require("../Extensions");
const Extensions_Objects_1 = require("../Extensions.Objects");
const Timer_1 = require("../Timer");
const DatabaseBase_1 = require("./DatabaseBase");
const mongodb_1 = require("mongodb");
class MongoDatabase extends DatabaseBase_1.DatabaseBase {
    constructor(connectionString, database) {
        super();
        this.database = database;
        this.onMethodDone = [];
        this.client = new mongodb_1.MongoClient(connectionString);
    }
    static new(connectionString, database) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("Connecting to MongoDB...".gray);
            // console.log(`  ${connectionString.yellow}`);
            // console.log(`  ${database.green}`);
            // Check whether the database exists
            const databaseNames = yield MongoDatabase.getDatabaseNames(connectionString);
            if (!databaseNames.find((d) => d === database)) {
                throw new Error(`Database ${database} not found (${connectionString})).`);
            }
            const db = new MongoDatabase(connectionString, database);
            yield db.client.connect();
            return db;
        });
    }
    find(collectionName, query, sort, limit, skip, lowercaseFields) {
        return __awaiter(this, void 0, void 0, function* () {
            let docs = yield this.aggregate(collectionName, [
                {
                    $match: query,
                },
                {
                    $sort: sort,
                },
                {
                    $skip: skip,
                },
                {
                    $limit: limit,
                },
            ]);
            if (lowercaseFields)
                docs = docs.map((d) => {
                    if (typeof d == "object")
                        return Extensions_Objects_1.Objects.toCamelCaseKeys(d);
                    return d;
                });
            return docs;
        });
    }
    findIterable(collectionName, query, sort, limit, skip, lowercaseFields) {
        return __asyncGenerator(this, arguments, function* findIterable_1() {
            const docs = yield __await(this.find(collectionName, query, sort, limit, skip));
            for (const doc of docs) {
                yield yield __await(doc);
            }
        });
    }
    aggregate(collectionName, pipeline) {
        return __awaiter(this, void 0, void 0, function* () {
            // Remove any empty stages (e.g. { $match: null } or { $match: {} } or { $sort: {} })
            pipeline = pipeline.filter((p) => {
                const values = Object.values(p);
                if (!values)
                    return false;
                // { $match: {...}, [something else]: {...} } - we want to remove this
                if (values.length != 1)
                    return false;
                // { $match: null } - we want to remove this
                if (values[0] == null)
                    return false;
                if (typeof values[0] == "object") {
                    const data = values[0];
                    // { $match: {} } - we want to remove this
                    if (Object.keys(data).length == 0)
                        return false;
                }
                return true;
            });
            const timer = Timer_1.Timer.start();
            const collection = yield this.getCollection(collectionName);
            const docs = yield (yield collection.aggregate(pipeline)).toArray();
            timer.stop();
            this.removeDollarSigns(pipeline);
            this.upsert("_DbAnalytics", {
                dt: Date.now(),
                event: "aggregate",
                collection: collectionName,
                pipeline: pipeline,
            }, false);
            return docs;
        });
    }
    _upsert(collectionName, doc, returnNewDoc = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.getCollection(collectionName);
            const result = yield collection.updateOne({ _id: doc._id }, { $set: doc }, {
                upsert: true,
            });
            if (!returnNewDoc)
                return doc._id;
            const newDoc = yield collection.findOne({ _id: doc._id });
            return newDoc;
        });
    }
    _delete(collectionName, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.getCollection(collectionName);
            yield collection.deleteMany(query);
        });
    }
    count(collectionName, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.getCollection(collectionName);
            const result = yield collection.countDocuments(query);
            return result;
        });
    }
    getNewIDs(count) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.getCollection("_IdentityIntegers");
            const result = yield collection.findOneAndUpdate({ _id: null }, { $inc: { uniqueID: count } }, { upsert: true, returnOriginal: true });
            const start = ((_a = result.value) === null || _a === void 0 ? void 0 : _a.uniqueID) || 1;
            // Return an array of IDs
            return Array.from(Array(count).keys()).map((i) => start + i);
        });
    }
    getNewID() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.getCollection("_Settings");
            const result = yield collection.findOneAndUpdate({ name: "global.unique.id" }, { $inc: { uniqueID: 1 } }, { upsert: true, returnOriginal: false });
            return ((_a = result.value) === null || _a === void 0 ? void 0 : _a.uniqueID) || 1;
        });
    }
    getCollectionNames() {
        return __awaiter(this, void 0, void 0, function* () {
            const collections = yield (yield this.client.db(this.database))
                .listCollections()
                .toArray();
            return collections.map((c) => c.name);
        });
    }
    getCollection(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.client.db(this.database)).collection(collectionName);
        });
    }
    static getDatabaseNames(connectionString) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = new mongodb_1.MongoClient(connectionString);
                yield client.connect();
                const databases = yield client.db().admin().listDatabases();
                yield client.close();
                return databases.databases.map((d) => d.name);
            }
            catch (ex) {
                console.log("Connection string: ");
                console.log(connectionString);
                throw ex;
            }
        });
    }
    removeDollarSigns(obj) {
        Extensions_Objects_1.Objects.traverse(obj, (node, key, value) => {
            if (key.startsWith("$")) {
                node[key.substring(1)] = value;
                delete node[key];
            }
        });
    }
}
exports.MongoDatabase = MongoDatabase;
