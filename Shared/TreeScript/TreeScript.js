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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeScript = void 0;
const yaml = __importStar(require("js-yaml"));
require("../Extensions");
const Extensions_Objects_1 = require("../Extensions.Objects");
var NodeType;
(function (NodeType) {
    NodeType[NodeType["CodeBlock"] = 0] = "CodeBlock";
})(NodeType || (NodeType = {}));
class TreeScript {
    constructor(source) {
        this.source = yaml.load(source);
        this.yaml = yaml.dump(this.source);
        this.output = TreeScript.compile(this.source);
    }
    static new(source) {
        return new TreeScript(source);
    }
    static compile(source) {
        const handlebars = require("handlebars");
        // Register the templates as helpers
        Object.entries(source.templates).forEach((entry) => {
            const templateName = entry[0];
            const code = entry[1];
            if (code.is(String)) {
                handlebars.registerHelper(templateName, (context) => {
                    return handlebars.compile(code, TreeScript.handlebarsOptions)(context);
                });
                return;
            }
            if (code.args)
                handlebars.registerHelper(templateName, (...argValues) => {
                    const args = {};
                    code.args.forEach((argName, index) => {
                        args[argName] = argValues[index];
                    });
                    //console.log(args);
                    return handlebars.compile(code.code, TreeScript.handlebarsOptions)(args);
                });
        });
        const output = handlebars.compile(source.templates.main, TreeScript.handlebarsOptions)(source.data);
        return output;
    }
    parse(source) {
        let tree = yaml.load(source);
        // Traverse the tree, if any value is a TreeScript (compilable YAML), compile it.
        Extensions_Objects_1.Objects.traverse(tree, (node, key, value) => {
            if (!value)
                return;
            if (value.is(Array)) {
                node[key] = value.map((item) => TreeScript.tryParse(item));
            }
            if (value.is(String)) {
                try {
                    // Compile the sub TreeScript branch
                    const branch = yaml.load(value);
                    // If the YAML compiled branch is still a string, it's not a TreeScript.
                    if (branch.is(String))
                        return;
                    // Replace the string with the compiled branch.
                    node[key] = new TreeScript(value).source;
                }
                catch (ex) {
                    if (ex instanceof yaml.YAMLException) {
                        // Ignore this error, it's probably not a TreeScript.
                    }
                    else {
                        throw ex;
                    }
                }
            }
        });
        return tree;
    }
    static tryParse(value) {
        if (!(value === null || value === void 0 ? void 0 : value.is(String)))
            return value;
        try {
            return new TreeScript(value).source;
        }
        catch (ex) {
            if (ex instanceof yaml.YAMLException) {
                // Ignore this error, it's probably not a TreeScript.
            }
            else {
                throw ex;
            }
        }
    }
}
exports.TreeScript = TreeScript;
TreeScript.handlebarsOptions = {
    // Prevents handlebars from escaping HTML
    noEscape: true,
};
