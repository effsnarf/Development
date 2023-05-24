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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemDatabase = void 0;
const fs = require("fs");
const path = require("path");
const Extensions_Objects_1 = require("../Extensions.Objects");
const Files_1 = require("../Files");
const DatabaseBase_1 = require("./DatabaseBase");
class FileSystemDatabase extends DatabaseBase_1.DatabaseBase {
    constructor(basePath) {
        super();
        this.basePath = basePath;
        // Create basePath if it doesn't exist
        if (!fs.existsSync(basePath)) {
            fs.mkdirSync(basePath, { recursive: true });
        }
    }
    static new(basePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = new FileSystemDatabase(basePath);
            return db;
        });
    }
    find(collectionName, query, sort, limit, skip, lowercaseFields) {
        return __awaiter(this, void 0, void 0, function* () {
            const collectionPath = path.join(this.basePath, collectionName);
            if (!fs.existsSync(collectionPath))
                return [];
            if (query)
                throw new Error("Query not implemented");
            if (sort)
                throw new Error("Sort not implemented");
            if (skip)
                throw new Error("Skip not implemented");
            let docs = [];
            for (const filePath of Files_1.Files.listFiles(collectionPath, {
                recursive: true,
            })) {
                if (limit && docs.length >= limit)
                    break;
                docs.push(JSON.parse(fs.readFileSync(filePath, "utf8")));
            }
            if (lowercaseFields)
                docs = docs.map((d) => Extensions_Objects_1.Objects.toCamelCaseKeys(d));
            return docs;
        });
    }
    findIterable(collectionName, query, sort, limit, skip, lowercaseFields) {
        return __asyncGenerator(this, arguments, function* findIterable_1() {
            const collectionPath = path.join(this.basePath, collectionName);
            if (!fs.existsSync(collectionPath))
                return yield __await(void 0);
            if (query)
                throw new Error("Query not implemented");
            if (sort)
                throw new Error("Sort not implemented");
            if (skip)
                throw new Error("Skip not implemented");
            let docsYieldedCount = 0;
            // List files in collectionPath recursively
            for (const file of Files_1.Files.listFiles(collectionPath, { recursive: true })) {
                if (limit && docsYieldedCount >= limit)
                    return yield __await(void 0);
                let doc = JSON.parse(fs.readFileSync(file, "utf8"));
                if (lowercaseFields) {
                    doc = Extensions_Objects_1.Objects.toCamelCaseKeys(doc);
                }
                yield yield __await(doc);
                docsYieldedCount++;
            }
            return yield __await(void 0); // No more docs
        });
    }
    aggregate(collectionName, pipeline) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
        });
    }
    _upsert(collectionName, doc, returnNewDoc) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = this.getFilePath(collectionName, doc._id);
            const json = JSON.stringify(doc);
            fs.writeFileSync(filePath, json);
            if (!returnNewDoc)
                return doc._id;
            return doc;
        });
    }
    _delete(collectionName, query) {
        var _a, e_1, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (var _d = true, _e = __asyncValues(this.findIterable(collectionName, query)), _f; _f = yield _e.next(), _a = _f.done, !_a;) {
                    _c = _f.value;
                    _d = false;
                    try {
                        const doc = _c;
                        const filePath = this.getFilePath(collectionName, doc._id);
                        fs.unlinkSync(filePath);
                    }
                    finally {
                        _d = true;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    count(collectionName, query) {
        return new Promise((resolve, reject) => {
            if (query)
                throw new Error("Query not implemented");
            let count = 0;
            for (const file of Files_1.Files.listFiles(path.join(this.basePath, collectionName), { recursive: true })) {
                count++;
                console.log(`${count.toLocaleString().green} ${`files found in`.gray} ${collectionName.yellow}`);
                // Move the cursor up one line
                process.stdout.write("\u001B[1A");
            }
            // Move the cursor down one line
            console.log();
            resolve(count);
        });
    }
    getNewIDs(count) {
        return __awaiter(this, void 0, void 0, function* () {
            const ids = yield Promise.all(Array.from(Array(count).keys()).map((i) => __awaiter(this, void 0, void 0, function* () { return this.getNewID(); })));
            ids.sort();
            return ids;
        });
    }
    getNewID() {
        return __awaiter(this, void 0, void 0, function* () {
            const uniqueIdFilePath = path.join(this.basePath, "uniqueID.json");
            if (!fs.existsSync(uniqueIdFilePath)) {
                fs.writeFileSync(uniqueIdFilePath, "1");
            }
            const uniqueID = JSON.parse(yield fs.promises.readFile(uniqueIdFilePath, "utf8"));
            const newId = uniqueID + 1;
            yield fs.writeFileSync(uniqueIdFilePath, newId.toString());
            return uniqueID;
        });
    }
    getCollectionNames() {
        return __awaiter(this, void 0, void 0, function* () {
            // List folders in basePath
            const folders = yield fs.promises.readdir(this.basePath, {
                withFileTypes: true,
            });
            const collectionNames = folders
                .filter((f) => f.isDirectory())
                .map((f) => f.name);
            return collectionNames;
        });
    }
    getFilePath(collectionName, id) {
        const dir1 = Math.floor(id / 1000000).toString();
        const dir2 = Math.floor(id / 1000).toString();
        const dirPath = path.join(this.basePath, collectionName, dir1, dir2);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        const filePath = path.join(dirPath, `${id}.json`);
        return filePath;
    }
}
exports.FileSystemDatabase = FileSystemDatabase;
