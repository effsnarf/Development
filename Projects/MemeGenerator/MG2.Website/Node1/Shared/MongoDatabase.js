"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.push(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.push(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDatabase = void 0;
require("./Extensions");
const Decorators_1 = require("./Decorators");
const mongodb_1 = require("mongodb");
let MongoDatabase = (() => {
    let _classDecorators = [(0, Decorators_1.measurePerformance)((context, method, args, result, dt) => {
            for (const callback of context.onMethodDone) {
                callback(method, args, result, dt);
            }
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MongoDatabase = _classThis = class {
        constructor(connectionString, database) {
            this.onMethodDone = [];
            this.database = database;
            this.client = new mongodb_1.MongoClient(connectionString);
        }
        static new(connectionString, database) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!connectionString) throw new Error(`Connection string is required to connect to ${database}.`);
                // console.log("Connecting to MongoDB...".gray);
                // console.log(`  ${connectionString.yellow}`);
                // console.log(`  ${database.green}`);
                // Check whether the database exists
                const databaseNames = yield MongoDatabase.getDatabaseNames(connectionString);
                if (!databaseNames.find((d) => d === database)) {
                    throw new Error(`Database ${database} not found.`);
                }
                const db = new MongoDatabase(connectionString, database);
                yield db.client.connect();
                return db;
            });
        }
        find(collectionName, query, sort = {}, limit, skip, lowercaseFields = true) {
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
                        if (typeof(d) == "object") return Object.toCamelCaseKeys.apply(d);
                        return d;
                    });
                return docs;
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
                    const data = values[0];
                    // { $match: null } - we want to remove this
                    if (data == null)
                        return false;
                    // { $match: {} } - we want to remove this
                    if (Object.keys(data).length == 0)
                        return false;
                    return true;
                });
                const collection = yield this.getCollection(collectionName);
                const docs = yield (yield collection.aggregate(pipeline)).toArray();
                return docs;
            });
        }
        upsert(collectionName, doc) {
            return __awaiter(this, void 0, void 0, function* () {
                const collection = yield this.getCollection(collectionName);
                if (!doc._id)
                    doc._id = yield this.getNewID();
                const result = yield collection.updateOne({ _id: doc._id }, { $set: doc }, {
                    upsert: true,
                });
                const newDoc = yield collection.findOne({ _id: doc._id });
                return newDoc;
            });
        }
        count(collectionName, query) {
            return __awaiter(this, void 0, void 0, function* () {
                const collection = yield this.getCollection(collectionName);
                const result = yield collection.countDocuments(query);
                return result;
            });
        }
        getNewID() {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                const collection = yield this.getCollection("_Settings");
                const result = yield collection.findOneAndUpdate({}, { $inc: { UniqueID: 1 } }, { upsert: true, returnOriginal: false });
                return ((_a = result.value) === null || _a === void 0 ? void 0 : _a.UniqueID) || 1;
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
                const client = new mongodb_1.MongoClient(connectionString);
                yield client.connect();
                const databases = yield client.db().admin().listDatabases();
                yield client.close();
                return databases.databases.map((d) => d.name);
            });
        }
    };
    __setFunctionName(_classThis, "MongoDatabase");
    (() => {
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name }, null, _classExtraInitializers);
        exports.MongoDatabase = MongoDatabase = _classThis = _classDescriptor.value;
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return exports.MongoDatabase = MongoDatabase = _classThis;
})();
exports.MongoDatabase = MongoDatabase;
