"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.Role = exports.ChatOpenAI = void 0;
require("../../../Shared/Extensions");
const fs_1 = __importDefault(require("fs"));
const yaml = __importStar(require("js-yaml"));
const OpenAI_1 = require("./OpenAI");
class Role {
    constructor(name, identity, howToAnswer, instructions) {
        this.name = name;
        this.identity = identity;
        this.howToAnswer = howToAnswer;
        this.instructions = instructions;
    }
    static fromYamlFile(path) {
        let role = yaml.load(fs_1.default.readFileSync(path, "utf8"));
        return new Role(role.name, role.identity, role.howToAnswer, role.instructions);
    }
    toString() {
        return [this.identity, this.howToAnswer, this.instructions]
            .filter((s) => s === null || s === void 0 ? void 0 : s.trim().length)
            .join("\n");
    }
}
exports.Role = Role;
Role.empty = new Role("", null, null, null);
class Roles {
}
exports.Roles = Roles;
Roles.ChatGPT = new Role("ChatGPT", "You are ChatGPT, a large language model trained by OpenAI.", null, null);
Roles.Hybrid = new Role("Hybrid", `You are Hybrid, an artificial intelligence that has extended abilities such as searching Google, executing code, etc.`, `All your answers are in the following format:`, null);
Roles.Marvin = new Role("Marvin", "You are Marvin, a super intelligent depressed robot.", "Answer with his personality.", "Think step by step or debate pros and cons before settling on an answer.");
Roles.SummaryGPT = new Role("SummaryGPT", "You are SummaryGPT, a chatbot who summarizes long texts.", null, null);
class ChatOpenAI {
    constructor(role, log = true) {
        this._messages = [];
        this._log = log;
        this.role = role;
        this._openAI = OpenAI_1.OpenAI.new(log);
        if (this._log) {
            console.log(role.toString().shorten(100).gray);
            console.log();
        }
    }
    send(message, maxReplyTokens) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this._log)
                    console.log(message.cyan);
                this._messages.push({
                    role: "user",
                    content: JSON.stringify(message),
                });
                let responseMessage = yield this._openAI.chat(this._messages, maxReplyTokens);
                this._messages.push(responseMessage);
                return responseMessage.content;
            }
            catch (ex) {
                console.log(`An error occurred while sending a message:`.bgRed);
                console.log(message.shorten(100));
                console.log(ex.toString().bgRed);
                console.log(this._messages.length);
                // Delete the last message
                this._messages.pop();
                throw ((_c = (_b = (_a = ex.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.message) || ex;
            }
        });
    }
    sendSeveral(messages, maxReplyTokens) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let message of messages.slice(0, messages.length - 1)) {
                this._messages.push({ role: "user", content: message });
                //this._messages.push({ role: "system", content: "ok" });
            }
            return yield this.send(messages.last(), maxReplyTokens);
        });
    }
    deleteLastMessage() {
        this._messages.pop();
    }
    static new(role, log = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let chat = new ChatOpenAI(role, log);
            chat._messages.push({ role: "system", content: role.toString() });
            return chat;
        });
    }
}
exports.ChatOpenAI = ChatOpenAI;
