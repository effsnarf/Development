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
exports.Database = void 0;
const FileSystemDatabase_1 = require("./FileSystemDatabase");
const MongoDatabase_1 = require("./MongoDatabase");
class Database {
    static new(configNode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (configNode.path)
                return FileSystemDatabase_1.FileSystemDatabase.new(configNode.path);
            if (configNode.connectionString) {
                return MongoDatabase_1.MongoDatabase.new(configNode.connectionString, configNode.database);
            }
            throw new Error("Invalid database configuration: " + JSON.stringify(configNode));
        });
    }
}
exports.Database = Database;
