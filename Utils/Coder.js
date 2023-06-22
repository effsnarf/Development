"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Coder = void 0;
var colors_1 = require("colors");
var js_yaml_1 = require("js-yaml");
var fs_1 = require("fs");
var os_1 = require("os");
var path_1 = require("path");
var typescript_1 = require("typescript");
require("./Extensions");
var StringBuilder_1 = require("./StringBuilder");
var tsc = typescript_1.factory;
var Coder;
(function (Coder) {
    var CodeGenerator = /** @class */ (function () {
        function CodeGenerator() {
            var _this = this;
            this.call = {
                method: function (method, args) {
                    // Make sure the args array is defined
                    args = args || [];
                    // Split the logMethodName string by '.' to get the individual property names
                    var propertyNames = method.split(".");
                    // Start with an identifier for the first property name
                    var currentExpression = tsc.createIdentifier(propertyNames[0]);
                    // Iterate over the remaining property names and construct a PropertyAccessExpression for each one
                    for (var i = 1; i < propertyNames.length - 1; i++) {
                        currentExpression = tsc.createPropertyAccessChain(currentExpression, tsc.createToken(typescript_1.SyntaxKind.QuestionDotToken), tsc.createIdentifier(propertyNames[i]));
                    }
                    var propAccessChain = tsc.createPropertyAccessChain(currentExpression, tsc.createToken(typescript_1.SyntaxKind.QuestionDotToken), tsc.createIdentifier(propertyNames[propertyNames.length - 1]));
                    // Create a CallExpression for the method with an argument of "arg"
                    var methodCall = tsc.createCallExpression(propAccessChain, undefined, args.map(function (arg) { return _this.toNode(arg); }));
                    // Create an if statement that checks whether global.test.test is defined before calling it
                    var ifStatement = tsc.createIfStatement(propAccessChain, tsc.createExpressionStatement(methodCall), undefined);
                    return ifStatement;
                },
            };
        }
        CodeGenerator.nodeToCode = function (node, sourceFile) {
            var printer = typescript_1.createPrinter();
            var modifiedCode = printer.printNode(typescript_1.EmitHint.Unspecified, node, sourceFile);
            return modifiedCode;
        };
        CodeGenerator.prototype.nodeToCode = function (node, sourceFile) {
            return CodeGenerator.nodeToCode(node, sourceFile);
        };
        CodeGenerator.prototype.toNode = function (value) {
            // if it's already a TypeScript node, just return it
            if (value === null || value === void 0 ? void 0 : value.kind)
                return value;
            return this.literal(value);
        };
        CodeGenerator.findExpression = function (node) {
            if (typescript_1.isExpressionStatement(node)) {
                return node.expression;
            }
            else if (typescript_1.isBinaryExpression(node)) {
                return node;
            }
            else {
                for (var _i = 0, _a = node.getChildren(); _i < _a.length; _i++) {
                    var child = _a[_i];
                    var expression = CodeGenerator.findExpression(child);
                    if (expression) {
                        return expression;
                    }
                }
                return undefined;
            }
        };
        CodeGenerator.prototype.literal = function (value) {
            if (value === null) {
                return tsc.createNull();
            }
            if (typeof value === "boolean") {
                return value ? tsc.createTrue() : tsc.createFalse();
            }
            if (typeof value === "string") {
                return tsc.createStringLiteral(value);
            }
            throw new Error("Unsupported literal type: (".concat(typeof value, ") ").concat(value));
        };
        CodeGenerator.prototype.expression = function (code) {
            var sourceFile = typescript_1.createSourceFile("", code, typescript_1.ScriptTarget.Latest);
            var expression = CodeGenerator.findExpression(sourceFile);
            if (!expression)
                throw new Error("Invalid expression: ".concat(code));
            //console.log(CodeGenerator.nodeToString(expression, sourceFile));
            return expression;
        };
        CodeGenerator.prototype.statement = function (statement) {
            var sourceFile = typescript_1.createSourceFile("", statement, typescript_1.ScriptTarget.Latest);
            var statementNode = sourceFile.statements[0];
            if (!statementNode)
                throw new Error("Invalid statement: ".concat(statement));
            //console.log(CodeGenerator.nodeToString(statementNode, sourceFile));
            return statementNode;
        };
        CodeGenerator.prototype.block = function () {
            var statements = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                statements[_i] = arguments[_i];
            }
            return tsc.createBlock(statements);
        };
        return CodeGenerator;
    }());
    var Hooker = /** @class */ (function () {
        function Hooker() {
            var _this = this;
            this.hooks = {
                method: {
                    enter: [],
                    return: [],
                    exit: [],
                },
                statement: {
                    before: [],
                    after: [],
                },
                expression: [],
            };
            this.on = {
                method: {
                    enter: function (hook) {
                        _this.hooks.method.enter.push(hook);
                    },
                    return: function (hook) {
                        _this.hooks.method.return.push(hook);
                    },
                    exit: function (hook) {
                        _this.hooks.method.exit.push(hook);
                    },
                },
                statement: {
                    before: function (hook) {
                        _this.hooks.statement.before.push(hook);
                    },
                    after: function (hook) {
                        _this.hooks.statement.after.push(hook);
                    },
                },
                expression: function (hook) {
                    _this.hooks.expression.push(hook);
                },
            };
        }
        Hooker.prototype.factory = function (program, options) {
            var _this = this;
            return function (context) {
                return function (sourceFile) {
                    var code = new CodeGenerator();
                    var visitor = function (node) {
                        // For classes, log the class name
                        if (typescript_1.isClassDeclaration(node)) {
                            var classDeclaration = node;
                            //console.log(classDeclaration.name?.getText(sourceFile));
                        }
                        // For methods, log the method name and arguments
                        if (typescript_1.isMethodDeclaration(node)) {
                            var method = node;
                            var body = method.body;
                            //console.log(method.name.getText(sourceFile));
                        }
                        if (typescript_1.isMethodDeclaration(node)) {
                            var method_1 = node;
                            var body = method_1.body;
                            if (body) {
                                var newBody = body;
                                // We want to capture all the expressions in every statement
                                // For example, for IF statements, we capture the value of the condition
                                // by wrapping the condition expression with a logging function
                                // so that
                                // if (condition) {
                                // becomes
                                // if (log(condition)) {
                                // (using this.hooks.expression)
                                var hookExpressionsVisitor_1 = function (node) {
                                    if (typescript_1.isExpressionStatement(node)) {
                                        var nodeCode = code.nodeToCode(node, sourceFile);
                                        // Log the type of the expression
                                        //console.log();
                                        //console.log(ts.SyntaxKind[node.kind].yellow);
                                        //console.log(nodeCode.gray);
                                        if (typescript_1.isBinaryExpression(node) ||
                                            typescript_1.isCallExpression(node)) {
                                            if (_this.hooks.expression.length > 1)
                                                throw new Error("Currently only one expression hook is supported");
                                            if (_this.hooks.expression.length == 0)
                                                return node;
                                            var hookedExpression = _this.hooks.expression[0](node, typescript_1.visitEachChild(node, hookExpressionsVisitor_1, context), sourceFile);
                                            return hookedExpression;
                                        }
                                    }
                                    return typescript_1.visitEachChild(node, hookExpressionsVisitor_1, context);
                                };
                                // newBody = tsc.createBlock([
                                //   ts.visitEachChild(
                                //     newBody,
                                //     hookExpressionsVisitor,
                                //     context
                                //   ) as ts.Statement,
                                // ]);
                                // Before and after each statement in the method body,
                                // add before.statement and after.statement hooks
                                newBody = tsc.createBlock(newBody.statements.map(function (statement) {
                                    // Wrap all the expressions in the statement
                                    // Add the before.statement hook
                                    var getHooks = function (hooks) {
                                        return hooks
                                            .map(function (hook) { return hook(statement); })
                                            .map(function (block) { return block.statements; })
                                            .flatMap(function (statements) { return statements; });
                                    };
                                    var newStatement = tsc.createBlock([
                                        tsc.createTryStatement(
                                        // try (before)
                                        tsc.createBlock(__spreadArray(__spreadArray([], getHooks(_this.hooks.statement.before), true), [
                                            typescript_1.visitEachChild(statement, hookExpressionsVisitor_1, context),
                                        ], false)), 
                                        // catch
                                        undefined, 
                                        // finally (after)
                                        tsc.createBlock(__spreadArray([], getHooks(_this.hooks.statement.after), true))),
                                    ], true);
                                    return newStatement;
                                }));
                                // Capture the return value by putting the entire method body in an arrow function
                                newBody = tsc.createBlock(__spreadArray(__spreadArray([
                                    code.statement("const methodBody = (async () => { ".concat(CodeGenerator.nodeToCode(newBody, sourceFile), " });")),
                                    code.statement("const methodResult = methodBody();")
                                ], _this.hooks.method.return.map(function (hook) {
                                    return hook(method_1, "methodResult");
                                }), true), [
                                    code.statement("return methodResult;"),
                                ], false));
                                // Capture entering the method
                                newBody = tsc.createBlock(__spreadArray(__spreadArray([], _this.hooks.method.enter.map(function (hook) { return hook(method_1); }), true), [
                                    newBody,
                                ], false), true);
                                // Capture exiting the method
                                var finallyBlock = tsc.createBlock([
                                    tsc.createBlock(__spreadArray([], _this.hooks.method.exit.map(function (hook) { return hook(method_1); }), true), true),
                                ]);
                                var tryFinallyBlock = tsc.createBlock([
                                    tsc.createTryStatement(tsc.createBlock(newBody.statements, true), undefined, finallyBlock),
                                ]);
                                return tsc.updateMethodDeclaration(method_1, 
                                //method.decorators,
                                method_1.modifiers, method_1.asteriskToken, method_1.name, method_1.questionToken, method_1.typeParameters, method_1.parameters, method_1.type, tryFinallyBlock);
                            }
                        }
                        return typescript_1.visitEachChild(node, visitor, context);
                    };
                    return typescript_1.visitNode(sourceFile, visitor);
                };
            };
        };
        return Hooker;
    }());
    var Log = /** @class */ (function () {
        function Log() {
            var _this = this;
            this.method = {
                entered: function (name, args) {
                    //console.log("enter", name, args);
                    return _this.add("method", { name: name, args: args }, true);
                },
                returned: function (name, returnValue) {
                    //console.log("return", name, returnValue);
                    _this.currentNode.value = returnValue;
                },
                exited: function (name) {
                    //console.log("exit", name);
                    _this.go.up();
                },
            };
            this.statement = {
                before: function (code) {
                    return _this.add("statement", { code: code }, true);
                },
                after: function (code) {
                    _this.go.up();
                },
            };
            this.expression = function (code, value) {
                _this.add("expression", { code: code, value: value });
                return value;
            };
            this.go = {
                up: function () {
                    if (!_this.currentNode.parent)
                        throw new Error("Can't go up from root.");
                    _this.currentNode = _this.currentNode.parent;
                },
                to: function (node) {
                    _this.currentNode = node;
                },
            };
            this.root = {
                type: "root",
                subs: [],
            };
            this.currentNode = this.root;
        }
        Log.prototype.traverse = function (node, callback) {
            callback(node);
            var children = node.subs;
            if (children) {
                for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                    var child = children_1[_i];
                    this.traverse(child, callback);
                }
            }
        };
        Log.prototype.stringifyYaml = function () {
            return js_yaml_1.dump(this.root);
        };
        Log.prototype.stringify = function () {
            return this.stringifyNode(this.root).join("\n");
        };
        Log.prototype.stringifyNode = function (node, indentation) {
            if (indentation === void 0) { indentation = 0; }
            var sb = new StringBuilder_1.StringBuilder(indentation);
            sb.addLines(this.stringifyItem(sb, node));
            sb.indent();
            for (var _i = 0, _a = node.subs || []; _i < _a.length; _i++) {
                var sub = _a[_i];
                sb.addLines(this.stringifyNode(sub, sb.indentation));
            }
            // for (let sub of (node.subs || []).filter((s) => s.type == "expression"))
            //   sb.addLines(this.stringifyNode(sub, sb.indentation));
            // for (let sub of (node.subs || []).filter((s) => s.type == "statement"))
            //   sb.addLines(this.stringifyNode(sub, sb.indentation));
            // for (let sub of (node.subs || []).filter((s) => s.type == "method"))
            //   sb.addLines(this.stringifyNode(sub, sb.indentation));
            sb.unindent();
            return sb.getLines();
        };
        Log.prototype.stringifyItem = function (sb, item) {
            var _a, _b;
            if (item.type === "root")
                return [colors_1.gray("root")];
            if (item.type === "method") {
                var args = (_a = item.args) === null || _a === void 0 ? void 0 : _a.map(function (arg) { return JSON.stringify(arg); }).join(", ");
                var s = [];
                s.push("".concat(colors_1.green(item.name || ""), "(").concat(args, ")"));
                if (item.value)
                    s.push(" ".concat(colors_1.gray("returned"), " ").concat(colors_1.black(colors_1.bgGreen(JSON.stringify(item.value)))));
                return [s.join("")];
            }
            if (item.type === "statement") {
                if (!item.code)
                    throw new Error("statement without code");
                return ((_b = item.code) === null || _b === void 0 ? void 0 : _b.split("\n").map(function (s) { return colors_1.gray(s); }));
            }
            if (item.type === "expression") {
                return [
                    "".concat(colors_1.cyan(item.code || ""), " ").concat("->".gray, " ").concat(colors_1.black(colors_1.bgCyan(JSON.stringify(item.value)))),
                ];
            }
            return ["type: ".concat(item.type, " (stringify not implemented)")];
        };
        Log.prototype.add = function (type, item, goIn) {
            if (goIn === void 0) { goIn = false; }
            item.type = type;
            item.parent = this.currentNode;
            item.subs = item.subs || [];
            if (!this.currentNode.subs)
                this.currentNode.subs = [];
            this.currentNode.subs.push(item);
            if (goIn)
                this.currentNode = item;
            return item;
        };
        return Log;
    }());
    Coder.Log = Log;
    var App = /** @class */ (function () {
        function App() {
        }
        App.addDebuggingCode = function (tsSourceOrPath) {
            var tsSourcePath = tsSourceOrPath;
            if (tsSourceOrPath.split("\n").length > 1) {
                tsSourcePath = path_1.resolve(os_1.tmpdir(), "".concat(Date.now().valueOf(), ".ts"));
                fs_1.writeFileSync(tsSourcePath, tsSourceOrPath);
            }
            var code = new CodeGenerator();
            var hooker = new Hooker();
            var compilerOptions = {};
            var program = typescript_1.createProgram([tsSourcePath], compilerOptions);
            var sourceFile = program.getSourceFile(tsSourcePath);
            if (!sourceFile)
                throw new Error("".concat(tsSourcePath, " not found."));
            hooker.on.method.enter(function (method) {
                var methodName = method.name.getText(sourceFile);
                return code.block(code.statement("if ((global as any).log) (global as any).log.method.entered(\"".concat(methodName, "\", [...arguments])")));
            });
            hooker.on.method.exit(function (method) {
                var methodName = method.name.getText(sourceFile);
                return code.block(code.statement("if ((global as any).log) (global as any).log.method.exited(\"".concat(methodName, "\")")));
            });
            // hooker.on.method.return(
            //   (method: ts.MethodDeclaration, returnVarName: string) => {
            //     const methodName = method.name.getText(sourceFile);
            //     return code.block(
            //       code.statement(
            //         `global.log.method.returned("${methodName}", ${returnVarName})`
            //       )
            //     );
            //   }
            // );
            // hooker.on.statement.before((statement: ts.Statement) => {
            //   const statementCode = CodeGenerator.nodeToCode(statement, sourceFile);
            //   return code.block(
            //     code.call.method("global.log.statement.before", [statementCode])
            //   );
            // });
            // hooker.on.statement.after((statement: ts.Statement) => {
            //   const statementCode = CodeGenerator.nodeToCode(statement, sourceFile);
            //   return code.block(
            //     code.call.method("global.log.statement.after", [statementCode])
            //   );
            // });
            // hooker.on.expression(
            //   (
            //     loggedExpression: ts.Expression,
            //     executedExpression: ts.Expression,
            //     sourceFile: ts.SourceFile
            //   ) => {
            //     const loggedExpressionCode = CodeGenerator.nodeToCode(
            //       loggedExpression,
            //       sourceFile
            //     );
            //     const executedExpressionCode = CodeGenerator.nodeToCode(
            //       executedExpression,
            //       sourceFile
            //     );
            //     return code.expression(
            //       `global.log.expression(${JSON.stringify(
            //         loggedExpressionCode
            //       )}, ${executedExpressionCode})`
            //     );
            //   }
            // );
            var result = typescript_1.transform(sourceFile, [
                hooker.factory(program, compilerOptions),
            ]);
            var newSourceFile = result.transformed[0];
            var newSource = CodeGenerator.nodeToCode(newSourceFile, newSourceFile);
            return newSource;
        };
        return App;
    }());
    Coder.App = App;
})(Coder || (Coder = {}));
exports.Coder = Coder;
