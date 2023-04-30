// var method = compDom.get.comp.item("ide-db-changes").methods.find(m => (m.name == "getDesc"));

// var source = `function ${method.name}(${method.args}) { \n${method.body}\n }`;


var source = `
function fibonacci(num) {
    if(num < 2) {
        return num;
    }
    else {
        return fibonacci(num-1) + fibonacci(num - 2);
    }
}`;




var ide = {
    performance: {
        data: {},
        method: {
            depths: {}
        },
        clear: () => {
            ide.performance.data = {};
        },
        info: () => {
            console.log(`times`);
            console.log(ide.performance.get.all.data(`times`));
            console.log(`elapsed.total`);
            console.log(ide.performance.get.all.data(`elapsed.total`));
            console.log(`elapsed.average`);
            console.log(ide.performance.get.all.data(`elapsed.average`));
        },
        get: {
            data: (key) => {
                var data = ide.performance.data;
                data[key] = (data[key] || { times: 0, elapsed: { total: 0, average: 0 } });
                return data[key];
            },
            all: {
                data: (sortByKey) => {
                    var data = ide.performance.data;
                    var entries = Object.entries(data);
                    entries = entries.sortBy(e => util.getProperty(e[1], sortByKey));
                    entries = entries.map(e => {
                        var item = { key: e[0] };
                        item[sortByKey] = util.getProperty(e[1], sortByKey);
                        return item;
                    });
                    entries.reverse();
                    return entries;
                }
            }
        },
        measure: {
            start: (key) => {
                var data = ide.performance.get.data(key);
                data.started = Date.now();
            },
            stop: (key) => {
                var data = ide.performance.get.data(key);
                data.stopped = Date.now();
                var elapsed = (data.stopped - data.started);
                //if (data.times == 0) data.elapsed.average = elapsed;
                //else data.elapsed.average = (((data.elapsed.average * data.times) + elapsed) / (data.times + 1));
                //data.times++;
                data.elapsed.total += elapsed;
                //if (elapsed > 10) console.log(elapsed, `${key}`);
            },
            func: (key, func) => {
                ide.performance.measure.start(key);
                var result = func();
                ide.performance.measure.stop(key);
                return result;
            },
            funcAsync: async (key, func) => {
                ide.performance.measure.start(key);
                var result = (await func());
                ide.performance.measure.stop(key);
                return result;
            }
        },
        track: {
            method: {
                enter: (methodPath) => {
                    var depths = ide.performance.method.depths;
                    var depth = (depths[methodPath] = ((depths[methodPath] || { entered: null, depth: 0, maxDepth: 0 })));
                    depth.depth++;
                    depth.maxDepth++;
                    if (depth.depth == 1) depth.entered = Date.now();
                    if (false)
                    {
                        var item = compDom.itemPath.to.item(methodPath);
                        var method = item.method;
                        var fullName = `${method.comp().name}.${method.name}`;
                        console.log(`${fullName} has been entered ${depth.depth} times deep`);
                    }
                },
                exit: (methodPath) => {
                    var depths = ide.performance.method.depths;
                    var depth = depths[methodPath];
                    depth.depth--;
                    if (depth.depth == 0)
                    {
                        var item = compDom.itemPath.to.item(methodPath);
                        if (item)
                        {
                            var method = item.method;
                            var methodName = `${method.comp().name}.${method.name}`;
                            var elapsed = (Date.now() - depth.entered);
                            if (depth.maxDepth > 10)
                            {
                                if (elapsed > 50)
                                {
                                    console.warn(`${util.number.commas(elapsed)}ms`, `(${depth.maxDepth} calls deep)`, methodName);
                                }
                            }
                        }
                        depth.maxDepth = 0;
                    }
                }
            }
        },
        bindToFunctions: (obj, path) => {
        }
    },
    if: {
        skip: {
            path: (path) => {
                var isAwait = path.type.startsWith("Await");
                if ((!isAwait) && (path.container.type == `AwaitExpression`)) return true;
                return false;
            }
        }
    },
    util: {
        to: {
            sourceItem: (sourcePath) => {
                var comp = compDom.get.comp.item(sourcePath[0]);
                var method = comp.methods.find(m => (m.name == sourcePath[1]));
                if (method) return { method: util.with(method, `comp`, comp) };
                var prop = comp.props.find(p => (p.name == sourcePath[1]));
                if (prop) return { prop: util.with(prop, `comp`, comp) };
                return null;
            },
            loc: (code, line, col, length) => {
                var start = 0;
                var lines = code.split(`\n`);
                for (var i = 0; i < line; i++) start += lines[i].length;
                start += col;
                return { start: start, end: (start + length) };
            },
        },
        loc: {
            inc: {
                start: (loc, offset) => {
                    return { start: (loc.start + offset), end: loc.end };
                }
            }
        },
        get: {
            newCode: (item, expressionID, path) => {
                var itemPath = compDom.item.to.itemPath(item);
                if (itemPath[1] == null) debugger;
                var itemPath = compDom.item.to.itemPath(item);
                itemPath = [...itemPath, { ceid: expressionID } ];
                var itemPathStr = JSON.stringify(itemPath);
                if (path.type == `CallExpression`)
                {
                    var isAwait = path.type.startsWith(`await`);
                    var code = ide.util.get.node.code(path, path.node);
                    if (isAwait) code = `(await ${code})`;
                    var newCode = `ide_debugger_log_exp(${itemPathStr}, (${code}))`;
                    if (isAwait) newCode = `(await ${newCode})`;
                    return newCode;
                }
                if (path.type == `AssignmentExpression`)
                {
                    var left = ide.util.get.node.code(path, path.node.left);
                    var right = ide.util.get.node.code(path, path.node.right);
                    var newCode = `${left} = ide_debugger_log_exp(${itemPathStr}, (${right}));`;
                    return newCode;
                }
                return ide.util.get.node.code(path, path.node);
            },
            node: {
                code: (path, node) => {
                    var code = path.hub.getCode().substring(node.loc.start.index, node.loc.end.index);
                    return code;
                },
            },
            path: {
                loc: (path) => {
                    var loc = { start: path.node.start, end: path.node.end };
                    return loc;
                }
            }
        },
        getLocWithoutFuncDec: (loc, sourceCode) => {
            var lines = sourceCode.split(`\n`);
            return {
                start: (loc.start - lines[0].length),
                end: (loc.end - lines[0].length)
            };
        },
        wrapWithFunction: (code) => {
            return `(async function() {\n${code}\n})`;
        },
        unwrapFunction: (code) => {
            var lines = code.split(`\n`);
            lines.splice(0, 1);
            lines.splice((lines.length - 1), 1);
            return lines.join(`\n`);
        }
    },
    code: {
        check: {
            method: (method) => {
                if (!method.body) return [];
                var comp = method.comp();
                var func = `async function ${method.name}(${method.args||''}) {\n${method.body}\n}`;
                var lines = method.body.split(`\n`);
                var items = [];
                
                var getWarning = (sourceCode, line, col, code, info) => {
                    return {
                        loc: ide.util.to.loc(sourceCode, line, col, code.length),
                        code: code,
                        info: info
                    }
                };

                lines.forEach((line, lineIndex) => {
                    // calls to non existing members "this.property" or "this.method"
                    var thisPropCalls = line.matchAllRegexes(/this\.(\w+)/g);
                    var warns = thisPropCalls
                        // if member name doesn't exist in comp
                        .filter(match => (!comp.props.find(prop => (prop.name == match[1]))) &&
                            (!comp.methods.find(m => (m.name == match[1]))))
                        // collect warnings
                        .map(match => getWarning(method.body, lineIndex, (match.index + `this.`.length), match[1], `No property or method named "${match[1]}" on ${comp.name}.`));
                    items.push(...warns);
                });
                
                // jshint
                var jshints = ide.code.check.jshint(func, -1);
                items.push(...jshints.slice(0, 1));
                return items;
            },
            jshint: (code, lineOffset = 0) => {
                JSHINT(code, {esversion:11});
                return JSHINT.errors.map(e => {
                    return {
                        loc: ide.util.to.loc(code, (e.line - 1 + lineOffset), (e.character - 1), 2),
                        code: e.evidence,
                        info: e.reason
                    };
                });
            }
        },
        getExpressions: (sourceItem) => {
            var sourceMap = ide.get.source.map(sourceItem);
            var sourceCode = ide.get.source.code(sourceItem);
            sourceCode = ide.util.wrapWithFunction(sourceCode);
            var expressions = [];
            try
            {
                ide.debugger.process.once(sourceCode, ide.debugger.babel.collectExpressions(expressions, { excludeFuncDeclLoc: true }));
                return expressions;
            }
            catch (ex)
            {
                console.log(ex);
                return [];
            }
        },
        compile: (compClass) => {
            for (method of compClass.methods)
            {
                method = util.with(method, `comp`, compClass);
                delete method.expressions;
                delete method.errors;
                method.code = (method.code || {});
                method.code.elements = ide.code.getExpressions({ method: method });
                method.code.errors = ide.code.check.method(method);
            }
        }
    },
    debugger: {
        id: 0,
        items: [],
        addIdeCalls: (item) => {
            var sourceMap = ide.get.source.map(item);
            var sourceCode = ide.get.source.code(item);
            sourceCode = ide.util.wrapWithFunction(sourceCode);
            // Babel's replaceWithSourceCode fails on await expressions, even when
            // the replaced code is literally the same path node code, so we
            // buffer the replace strings and execute them outside Babel's transformer.
            try
            {
                var replaces = [];
                var resultSource = ide.debugger.process.iterate(sourceCode, (iteration) => ide.debugger.babel.addDebuggerCalls(item, replaces, iteration));
                while (resultSource.includes(`ide_compiler_replace`)) replaces.forEach((r, i) => { resultSource = resultSource.replaceAll(`ide_compiler_replace(${i})`, replaces[i]); });
                resultSource = ide.util.unwrapFunction(resultSource);
                return resultSource;
            }
            catch (ex)
            {
                console.log(ex);
                return null;
            }
        },
        process: {
            once: (source, processor) => {
                var changes = [];
                Babel.registerPlugin("ide-debugger", processor);
                var output = Babel.transform(source, { plugins: ["ide-debugger"], }).code;
                return output;
            },
            iterate: (source, processor) => {
                var attempts = 10;
                var output = null;
                var iteration = { number: -1, unskip: 0, done: false };
                while (attempts--)
                {
                    iteration.done = false;
                    iteration.number++;
                    Babel.registerPlugin("ide-debugger-iterate", processor(iteration));
                    output = Babel.transform(source, { plugins: ["ide-debugger-iterate"], }).code;
                    if (output == source) break;
                    source = output;
                }
                return output;
            }
        },
        babel: {
            getVisitorObj: (visit) => {
                return {
                    AwaitExpression: visit,
                    CallExpression: visit,
                    BinaryExpression: visit,
                    AssignmentExpression: visit,
                    //ReturnStatement: visit
                };
            },
            addDebuggerCalls: (item, replaces, iteration) => {
                var visit = {
                    exit(path) {
                        if (iteration.done) return;
                        var code = path.hub.getCode().substring(path.node.start, path.node.end);
                        //console.log(`iteration: `, iteration.number);
                        //console.log(`path code is: `, code);
                        if (path.node.callee?.name?.startsWith(`ide_debugger_`)) return;
                        if (ide.if.skip.path(path)) return;
                        if (!("skip" in iteration)) iteration.skip = iteration.number;
                        if (iteration.skip - iteration.unskip) { iteration.skip--; return; }
                        // found code to replace
                        var isAwait = path.type.startsWith("Await");
                        var newCode = ide.util.get.newCode(item, iteration.number, path);
                        // if we're replacing code that contains another ide_compiler_replace
                        // call, then we're effectively consolidating nodes, and disrupting
                        // the effectiveness of the (skip iteration count), so we need to
                        // compensate with an unskip count.
                        if (newCode.includes(`ide_compiler_replace`)) iteration.unskip++;
                        // uncomment this and the other console.log lines in this method
                        // to understand what's going on 
                        //console.log(`addDebuggerCall`, iteration.number, newCode);
                        if (isAwait) newCode = `(await ${newCode})`;
                        replaces.push(newCode);
                        path.replaceWithSourceString(`ide_compiler_replace(${(replaces.length - 1)})`);
                        path.skip();
                        iteration.done = true;
                        delete iteration.skip;
                    }
                };
                
                return function() {
                    return {
                        visitor: ide.debugger.babel.getVisitorObj(visit),
                    };
                }
            },
            collectExpressions: (expressions, options) => {
                var visit = {
                    exit(path) {
                        if (ide.if.skip.path(path)) return;
                        var loc = { start: path.node.start, end: path.node.end };
                        var code = ide.util.get.node.code(path, path.node);
                        //console.log(`collect:`, code, expressions.length);
                        if (options.excludeFuncDeclLoc) loc = ide.util.getLocWithoutFuncDec(loc, path.hub.getCode());
                        expressions.push({ loc: loc, code: code });
                        path.skip();
                    }
                };
                
                return function() {
                    return {
                        visitor: ide.debugger.babel.getVisitorObj(visit),
                    };
                }
            }
        },
        log: {
            method: {
                enter: (vue, methodPath, args) => {
                    var method = compDom.itemPath.to.item(methodPath)?.method;
                    if (!method) return;
                    var argNames = compDom.get.arg.names(method.args);
                    var argsObj = Object.fromEntries(argNames.map((a,i) => [a, args[i]]));
                    var itemValue = { typedValue: { type: `object`, value: argsObj } };
                    var item = {
                        id: (ide.debugger.id++),
                        type: `method.enter`,
                        //vue: compDom.to.typedValue(vue),
                        els: [{ get: () => vue.$el }],
                        item: { method: method },
                        title2: JSON.stringify(argsObj).shorten(50),
                        value: itemValue,
                        buttons: [{
                            text: `▶️ execute`,
                            click: () => { vue[method.name](...Object.values(itemValue.typedValue.value)); }
                        }]
                    };
                    ide.debugger.items.push(item);
                    Vue.nextTick(() => ideVueApp.$emit(`debug.event`));
                }
            },
            prop: {
                value: {
                    set: (vue, propPath, value) => {
                        var prop = compDom.itemPath.to.item(propPath).prop;
                        var item = {
                            id: (ide.debugger.id++),
                            type: `prop.value.set`,
                            item: { prop: prop },
                            value: compDom.to.typedValue(value)
                        };
                        //ide.debugger.items.push(item);
                        //Vue.nextTick(() => ideVueApp.$emit(`debug.event`));
                    }
                }
            },
            exp: (itemPath, expValue) => {
                var expItem = compDom.itemPath.to.item(itemPath);
                var els = [];
                els.push(...viewDom.toIndirect(viewDom.toDomElements(expValue)));
                var item = {
                    id: (ide.debugger.id++),
                    type: `exp`,
                    item: expItem,
                    els: els,
                    value: compDom.to.typedValue(expValue)
                };
                ide.debugger.items.push(item);
                Vue.nextTick(() => ideVueApp.$emit(`debug.event`));
                
                return expValue;
            },
            ex: (item, ex) => {
                var item = {
                    id: (ide.debugger.id++),
                    type: `ex`,
                    item: item,
                    ex: ex
                };
                ide.debugger.items.push(item);
            }
        },
    },
    source: {
        maps: {}
    },
    get: {
        source: {
            map: (sourceItem) => {
                var sourcePath = ide.get.source.path(sourceItem);
                var sourceMap = (ide.source.maps[sourcePath] || (ide.source.maps[sourcePath] = {}));
                sourceMap.path = (sourceMap.path || (sourceMap.path = sourcePath));
                sourceMap.expressions = (sourceMap.expressions || (sourceMap.expressions = []));
                return sourceMap;
            },
            path: (sourceItem) => {
                if (sourceItem?.method)
                {
                    var method = sourceItem.method;
                    return [method.comp().name, method.name];
                }
                throw `Source item not recognized (forgot to wrap?).`;
            },
            code: (sourceItem) => {
                if (sourceItem?.method) return sourceItem.method.body;
                throw `Source item not recognized (forgot to wrap?).`;
            }
        }
    },
};


var ide_debugger_log_expression = () => {};
var ide_debugger_log_exp = ide.debugger.log.exp;


//var result = ide.debugger.addIdeCalls(source);



