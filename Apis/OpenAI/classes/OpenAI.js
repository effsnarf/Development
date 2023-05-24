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
exports.OpenAI = void 0;
const { encode, decode } = require("gpt-3-encoder");
const axios_1 = __importDefault(require("axios"));
const colors = __importStar(require("colors"));
const Loading_1 = require("../../../Shared/Loading");
var Model;
(function (Model) {
    Model["Davinci"] = "text-davinci-003";
    Model["Gpt35Turbo"] = "gpt-3.5-turbo";
})(Model || (Model = {}));
var RequestType;
(function (RequestType) {
    RequestType["Completion"] = "completions";
    RequestType["Edit"] = "edits";
    RequestType["Chat"] = "chat/completions";
})(RequestType || (RequestType = {}));
class OpenAI {
    static new(log = true) {
        if (!this.apiKey)
            throw new Error("API key not set. Use OpenAI.apiKey = 'your key'");
        return new OpenAI(this.apiKey, Model.Davinci, log);
    }
    constructor(apiKey, model, log = true) {
        this.loading = new Loading_1.Loading();
        // This includes the request and the response
        this.maxTotalTokens = 4097;
        this._log = log;
        this.endpoint = "https://api.openai.com/v1/";
        this.apiKey = apiKey;
        this.model = model;
        this.messages = [];
    }
    // Makes sure that the prompt is not too long
    // replyTokens is the number of tokens to allow for the reply
    shortenPrompt(prompt, replyTokens) {
        // Based on this.maxTotalTokens, binary search for the right length
        let min = 0;
        let max = prompt.length;
        let mid = Math.floor((min + max) / 2);
        while (min < max) {
            let tokens = this.getTokens(prompt.substring(0, mid));
            if (tokens > this.maxTotalTokens - replyTokens) {
                max = mid;
            }
            else {
                min = mid + 1;
            }
            mid = Math.floor((min + max) / 2);
        }
        prompt = prompt.substring(0, mid);
        const tokens = this.getTokens(prompt);
        console.log(`Prompt shortened to ${tokens} tokens`.gray);
        return prompt;
    }
    // Makes sure that the total tokens if JSON.stringify(messages) is not too much
    // replyTokens is the number of tokens to allow for the reply
    shortenMessages(messages, replyTokens) {
        const originalLength = messages.length;
        // Based on this.maxTotalTokens, binary search for the right length
        let min = 0;
        let max = messages.length;
        let mid = Math.floor((min + max) / 2);
        while (min < max) {
            let tokens = this.getTokens(messages.slice(0, mid));
            if (tokens > this.maxTotalTokens - replyTokens) {
                max = mid;
            }
            else {
                min = mid + 1;
            }
            mid = Math.floor((min + max) / 2);
            if (mid <= 0)
                throw `mid is ${mid}`;
        }
        messages = messages.slice(0, mid);
        const tokens = this.getTokens(JSON.stringify(messages));
        console.log(`Messages shortened to ${messages.length}/${originalLength} messages, ${tokens} tokens`
            .gray);
        return messages;
    }
    getTokens(message) {
        if (!message) {
            throw `message is ${message}`;
        }
        if (typeof message != "string") {
            message = JSON.stringify(message);
        }
        const tokens = encode(message).length;
        return tokens;
    }
    makeRequest(model, type, dataProps) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = this.getTokens(dataProps.prompt || dataProps.input || dataProps.messages || dataProps);
            const maxReplyTokens = this.maxTotalTokens - tokens;
            if (false)
                console.log(`Max reply tokens: ${maxReplyTokens} (${tokens} tokens used)`.gray);
            const data = Object.assign({ model: model, max_tokens: maxReplyTokens }, dataProps);
            if (false)
                console.log(data.stringify().shorten(400));
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            };
            const endpoint = `${this.endpoint}${type}`;
            let response;
            try {
                this.loading.start();
                response = yield axios_1.default.post(endpoint, data, {
                    headers,
                });
                this.log();
                if (dataProps.messages) {
                    //this.log(colors.cyan(dataProps.messages.last().content).shorten(100));
                }
                else {
                    this.log(JSON.stringify(dataProps).shorten(100));
                }
            }
            catch (ex) {
                let msg = (_c = (_b = (_a = ex.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.message;
                this.log();
                this.log(colors.red(msg));
                throw msg || ex;
            }
            finally {
                this.loading.stop();
            }
            let choices = response.data.choices;
            if (choices.length > 1)
                throw `${choices.length} choices returned`;
            if (choices[0].text)
                choices[0].text = choices[0].text.trim();
            if (choices[0].message)
                choices[0].message.content = choices[0].message.content.trim();
            let reply = (choices[0].text || choices[0].message);
            this.log();
            this.log(((reply === null || reply === void 0 ? void 0 : reply.content) || reply).green);
            return reply;
        });
    }
    complete(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.makeRequest(this.model, RequestType.Completion, {
                prompt,
            });
        });
    }
    edit(input, instruction) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.makeRequest(this.model, RequestType.Edit, {
                input,
                instruction,
            });
        });
    }
    chat(messages, maxReplyTokens) {
        return __awaiter(this, void 0, void 0, function* () {
            if (maxReplyTokens) {
                messages = this.shortenMessages(messages, maxReplyTokens);
            }
            return yield this.makeRequest(Model.Gpt35Turbo, RequestType.Chat, {
                messages,
            });
        });
    }
    log(message) {
        if (this._log) {
            if (message)
                console.log(message);
            else
                console.log();
        }
    }
}
exports.OpenAI = OpenAI;
OpenAI.apiKey = `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`;
