if (typeof(require) != "undefined")
{
  var util = require("../../../../Anat.dev/DatabaseProxy/utility.js");

  var YAML = require("yaml");
  var HAML = require("hamljs");
  var Handlebars = require("Handlebars");

  var compDom = require("./comp-dom.js");
  var viewDom = require("./view-dom.js");
}




String.prototype.doubleTrim = function(length) {
  if (!this) return this;
  return this.trim().substring(length, (this.length - length * 2 + 1));
}



var toArray = (s) => {
  if (!s) return [];
  if (Array.isArray(s)) return s;
  if (typeof(s) != "string") return [];
  return s.split(",").map(a => a.trim()).filter(a => a);
}


var error1 = function(ex)
{
  console.warn(ex);
  //debugger;
}

var compiler = {};

compiler.clone = (obj) => {
  var started = Date.now();
  var result = (() => {
    if (!obj) return obj;
    if (typeof(obj) == `function`) return obj;
    if (Array.isArray(obj)) return [...obj];
    //return obj;
    return JSON.parse(JSON.stringify(obj));
  })();
  var stopped = Date.now();
  var elapsed = (stopped - started);
  //if (elapsed > 10) debugger;
  return result;
}


var toFunction = (args, body, debugLocation) => {
  if (!args) args = [];
  if (!body) body = "";

  //try
  {
    var func = (eval(`(async function(${args.join(", ")}) {
      ${body}
    })`));

    return func;
  }
  //catch (ex)
  {
    //debugger;
  }
}

var toVuePropProperty = function(compClass, prop) {
  if (prop.default.enabled && prop.persisted.enabled) throw `${compClass.name}.${prop.name} can't both have a default value and also be persisted.`;
  if (prop.default.enabled && prop.computed.enabled) throw `${compClass.name}.${prop.name} can't both have a default value and also be computed.`;
  if (prop.routeParam.enabled && prop.computed.enabled) throw `${compClass.name}.${prop.name} can't both be a route parameter and also be computed.`;

  if (prop.default.enabled)
  {
    try
    {
      //var func = (eval(`(function() { return ${JSON.stringify(prop.default.value)} })`));
      var defaultValue = compiler.clone(prop.default.value);
      return {
        default: defaultValue
      }
    }
    catch (ex)
    {
      debugger;
      throw `Property ${prop.name} default value doesn't compile.`;
    }
  }

  if (prop.persisted.enabled)
  {
    return {
      default: toFunction([], prop.persisted.load.body)
    };
  }

  return null;
}

compiler.isAsyncCode = (code) => {
  if (!code) return false;
  return /\bawait\b/.test(code);
}


compiler.preprocess = (compClass) => {
  compClass = JSON.parse(JSON.stringify(compClass));

  compClass.props.forEach(prop => {
    if (prop.rateLimit?.enabled)
    {
      if (prop.computed?.enabled)
      {
        throw `${compClass.name}.${prop.name} can be either computed or rate limited but not both.`;
      }
      prop.computed.enabled = true;
      prop.computed.get = (prop.computed.get || {});
      prop.computed.set = (prop.computed.set || {});
      prop.computed.get.body = `return this.$data._meow.rateLimit.${prop.name}.value`;
      prop.computed.set.args = `newValue`;
      if (prop.rateLimit.value.type == `debounce`)
      {
        prop.computed.set.body = `
          var rateLimit = this.$data._meow.rateLimit;
          rateLimit.newValue = newValue;
          if (rateLimit.${prop.name}.timer) return;
          rateLimit.${prop.name}.timer = setTimeout(() => {
            rateLimit.${prop.name}.value = rateLimit.newValue;
            rateLimit.${prop.name}.timer = null;
          }, ${prop.rateLimit.value.delay});
        `;
      }
      else if (prop.rateLimit.value.type == `throttle`)
      {
        prop.computed.set.body = `
          var rateLimit = this.$data._meow.rateLimit;
          var newValue2 = newValue;
          clearTimeout(rateLimit.${prop.name}.timer);
          rateLimit.${prop.name}.timer = setTimeout(() => {
            rateLimit.${prop.name}.value = newValue2;
          }, ${prop.rateLimit.value.delay});
        `;
      }
      else throw `rateLimit type ${prop.rateLimit.value.type} not implemented.`;
    }
  });

  return compClass;
}


// meaning Vue "props" (parameters passed between components),
// not component properties (data, computed, watches, etc)
compiler.toVueProps = (compClass) => {
  var props = compClass.props;
  var vprops = {};

  props
    .filter(p => (p.props?.enabled))
    .forEach(p => {
      vprops[p.name] = toVuePropProperty(compClass, p);
    });

  return vprops;
};

compiler.toVueDataDefault = (prop) => {
  if (prop.persisted.enabled)
  {
    if (prop.default.enabled) throw `${prop.name} can't be both persisted and have a default value.`;

    //
  }

  if (prop.default.enabled)
  {
    return util.clone(prop.default.value);
  }
  return null;
}

compiler.toVueData = (compClass, origComp) => {
  var props = compClass.props;
  var data = {};

  var rateLimitedPropsObj = {};
  props
    .filter(p => (p.rateLimit?.enabled))
    .forEach(p => {
    rateLimitedPropsObj[p.name] = { timer: null, value: null, nextValue: null };
  });
  data._meow = {};
  data._meow.comp = { _id: compClass._id, name: compClass.name };

  data._meow.rateLimit = rateLimitedPropsObj;

  props
    .filter(p => (!p.props?.enabled) && (!p.computed?.enabled))
    .forEach(p => {
      data[p.name] = compiler.toVueDataDefault(p);
    });

  return data;
};

compiler.toVueComputeds = (compClass, origComp) => {
  var computeds = {};

  compClass.props
    .filter(p => (p.computed?.enabled))
    .filter(p => (!compiler.isAsyncCode(p.computed.get?.body || p.computed.getter) && (!compiler.isAsyncCode(p.computed.set?.body || p.computed.setter))))
    .forEach(p => {
      var origProp = origComp.props.find(p2 => (p2.name == p.name));
      origProp.errors = (origProp.errors || []);
      origProp.errors.splice(0);
      var obj = {};
      try
      {
        var getBody = (p.computed.get?.body || p.computed.getter);
        var setArgs = (p.computed.set?.args || "value");
        var setBody = (p.computed.set?.body || p.computed.setter);
        if (getBody)
        {
          if (compiler.mode == `production`)
          {
            obj.get = eval(`(function() { ${getBody} })`);
          }
          else {
            obj.get = eval(`(function() {
            try
            {
              ${getBody}
            }
            catch (ex)
            {
              ideVueApp.onCompError(this, [compDom.get.item(${compClass._id}, ${p.id})], ex);
            }
          })`);
          }
        }
        if (setBody) obj.set = eval(`(function(${setArgs}) {
            ${setBody}
        })`);
      }
      catch (ex)
      {
        origProp.errors.push({ text: ex.toString(), ex: ex });
        throw ex;
      }
      computeds[p.name] = obj;
    });

  return computeds;
};

compiler.toVueAsyncComputeds = (compClass) => {
  var asyncComputeds = {};
  compClass.props
    .filter(p => (p.computed?.enabled))
    .filter(p => (compiler.isAsyncCode(p.computed?.get?.body || p.computed?.getter) || (compiler.isAsyncCode(p.computed?.set?.body || p.computed?.setter))))
    .forEach(p => {
      var obj = {};
      try
      {
        try {
          obj.get = eval(`(async function() {
            ${p.computed.get?.body || p.computed.getter}
          })`);
        } catch (ex) {
          console.error(`${compClass.name}[${p.name}] (computed): ${ex.toString()}`);
          obj.get = (async () => null);
        } finally {

        }
      }
      catch (ex)
      {
        if (typeof(ideVueApp) == `undefined`) throw ex; else ideVueApp.onCompError(this, [compDom.get.item(compClass._id, p.id)], ex);
      }
      asyncComputeds[p.name] = obj;
    });
  return asyncComputeds;
};

compiler.toVueWatchers = (compClass, props) => {
  var watch = {};

  if (compiler.mode == `production`)
  {
    props
      .filter(prop => (prop.watch?.enabled || prop.persisted?.enabled))
      .forEach(prop => {
          watch[prop.name] = {
            deep: true,
            immediate: (prop.persisted?.enabled ? false : prop.watch.immediate)
          };

          let watchHandler = toFunction(toArray(prop.watch.method.args), prop.watch.method.body);

          let persistedHandler =
            eval(`(async function(value, oldValue) {
              var timerKey = '${prop.name}_persisted_save_timer';
              clearTimeout(this[timerKey]);
              this[timerKey] = setTimeout(async () => {
                var func = (async function(${prop.persisted.save.args}) { ${prop.persisted.save.body} }).bind(this);
                await func(value);
              }, 400);
            })`);

          if (prop.watch?.enabled) watch[prop.name].handler = watchHandler;
          if (prop.persisted?.enabled) watch[prop.name].handler = persistedHandler;
      });
  }
  else
  {
    props.forEach(prop => {
      watch[prop.name] = {
        deep: true,
        immediate: prop.watch.immediate,
        handler: async function(value, oldValue) {

          if (prop.watch?.enabled)
          {
            try
            {
              var debugLocation = {
                vue: this,
                loc: `${this.$options.name}.${prop.name}.watch.handler`
              };
              var func = null;
              if (prop.watch.method?.body)
              {
                func = toFunction(toArray(prop.watch.method.args), prop.watch.method.body, debugLocation).bind(this);
              }
              else
              {
                func = toFunction(["value", "oldValue"], prop.watch.handler, debugLocation).bind(this);
              }
              await func(value);
            }
            catch (ex)
            {
              if (typeof(ideVueApp) == `undefined`) throw ex; else ideVueApp.onCompError(this, [compDom.get.item(compClass._id, prop.id)], ex);
            }
          }

          if (prop.persisted?.enabled)
          {
            var timerKey = `${prop.name}_persisted_save_timer`;
            clearTimeout(this[timerKey]);
            this[timerKey] = setTimeout(async () => {
              try
              {
                var func = (eval(`(async function(${prop.persisted.save.args}) { ${prop.persisted.save.body} })`)).bind(this);
                await func(value);
              }
              catch (ex)
              {
                console.error(`Error in ${this.$options.name}.${prop.name}.persisted.save`);
                console.error(ex);
                console.error(prop.persisted.save);
              }
            }, 400);
          }
        }
      };
    });
  }


  return watch;
};

compiler.methodToFunction = (compClass, method, origMethod) => {
  var debuggerStatement = null;
  var debuggerCode = ``;

  var method2 = util.with(method, "comp", compClass);

  if (!compClass.name.startsWith(`IDE.`))
  {
    debuggerCode += `ide.debugger.log.method.enter(this, [${compClass._id}, ${method.id}], [...arguments]);\n`;
  }
  //debuggerCode = `console.log(\`${compClass.name}.${method.name}\`);`;
  //
  //debuggerCode += `var methodItem = compDom.itemPath.to.item(["${compClass.name}", "${method.name}"]);\n`;
  //debuggerCode += `var method = methodItem?.method;\n`;
  //debuggerCode += `if (method?.code?.debugInBrowser)\n`;
  //debuggerCode += `{`;
  //debuggerCode += `  debugger;`;
  //debuggerCode += `}`;
  var compileFunc = (args, body) => {
    args = (args || "");
    var argsWords = args.split(`,`).map(a => a.getWords()[0]).filter(a => a);
    //console.log(argsWords);
    var isAsync = (compiler.isAsyncCode(body) ? "async" : "");
    var isAwait = (compiler.isAsyncCode(body) ? "await" : "");

    if (compiler.mode == `production`)
    {
      return eval(`(${isAsync} function (${args}) {
        ${(body || "")}
      })`);
    }

    return eval(`(${isAsync} function(${args}) {
      try
      {
        var methodKey = \`${compClass.name}.${method.name}\`;
        var logMethod = false;

        //if (['IDE.Component', 'IDE.Movable', 'IDE.Input.Text', 'IDE.Draggable', 'IDE.Dropzone', 'IDE.Icon', 'IDE.User.Account'].some(s => methodKey.startsWith(s))) logMethod = false;
        //if (['.mounted', '.adjustSize', '.adjustInputWidth', '.adjustTextAreaSize', '.getScopedStyles'].some(s => methodKey.endsWith(s))) logMethod = false;
        //if (methodKey.endsWith('.mounted')) logMethod = false;

        if (methodKey == 'IDE.Context.pin') logMethod = true;

        if (logMethod)
        {
          gtag('event', 'user.activity', {'method': methodKey});
        }

        if (${method.id}) ide.performance.track.method.enter([${compClass._id}, ${method.id}]);

        ${(debuggerCode || "")}


        var _meow_method = ${isAsync} function (${args}) {
          ${(body || "")}
        }.bind(this);

        
        if (${method.options?.rateLimit?.enabled})
        {
          let _origMethod = _meow_method;
          _meow_method =  ${isAsync} function (${args}) {
            var rateLimit = this.$data._meow.rateLimit;
            rateLimit._methods = (rateLimit._methods || {});
            clearTimeout(rateLimit._methods.${method.name});
            rateLimit._methods.${method.name} = setTimeout(() => _origMethod(${args}), (${method.options?.rateLimit?.delay || 400}));
          }.bind(this);
        }


        if (!${method.options?.cache?.result})
        {
          var started = Date.now();
          var result = (${isAwait} _meow_method(${argsWords.join(`, `)}));
          var stopped = Date.now();
          var elapsed = (stopped - started);
          //if (elapsed > 50) console.log(util.number.commas(elapsed) + "ms", "${compClass.name}.${method.name}");
          return result;
        }
        else
        {
          var started = Date.now();
          var itemPath = [${compClass._id}, ${method.id}];

          var argsKey = JSON.stringify({ ${argsWords.map(a => `${a}: ${a}`)} });
          argsKey = argsKey.hashCode();

          window._meow = (window._meow || { cache: { methods: {} } });
          var methods = window._meow.cache.methods;
          methods[itemPath] = (methods[itemPath] || {});
          if (!methods[itemPath][argsKey]) methods[itemPath][argsKey] = { invoked: Date.now(), result: (${isAwait} _meow_method(${argsWords.join(`, `)})) }

          var stopped = Date.now();
          var elapsed = (stopped - started);
          //if (elapsed > 50) console.log(util.number.commas(elapsed) + "ms", "(cached)", "${compClass.name}.${method.name}");

          return methods[itemPath][argsKey].result;
        }
      }
      catch (ex)
      {
        ideVueApp.onCompError(this, [compDom.get.item(${compClass._id}, ${method.id})], ex);
      }
      finally
      {
        if (${method.id}) ide.performance.track.method.exit([${compClass._id}, ${method.id}]);
      }
    })`);
  }
  try
  {
    origMethod.errors = (origMethod.errors || []);
    origMethod.errors.splice(0);

    var body = method.body;

    var addDebugCalls = false;

    // debug all methods except IDE components
    //if (!compClass.name.toLowerCase().startsWith(`ide.`)) addDebugCalls = true;

    // debug a specific component
    //if (compClass.name == `IDE.Input.Css.Class.Names`) addDebugCalls = true;

    // custom mounted method
    if (!('id' in method2)) addDebugCalls = false;

    if (addDebugCalls) body = ide.debugger.addIdeCalls({ method: method2 });

    var methodFunc = compileFunc(method.args, body);

    return methodFunc;
  }
  catch (ex)
  {
    origMethod.errors.push({ text: ex.toString(), ex: ex });
    throw ex;
  }
};

compiler.toVueMethod = (compClass, method, origMethod) => {
  var methodFunc = compiler.methodToFunction(compClass, method, origMethod);
  return methodFunc;
};

compiler.toVueMethods = (compClass, origComp) => {
  var methods = compClass.methods;

  var ms = {};
  methods.forEach((method, i) => {
    ms[method.name] = compiler.toVueMethod(compClass, method, origComp.methods[i]);
  });

  return ms;
};

compiler.toVueHooks = (compClass) => {
  var hooks = {};

  hooks.mounted = util.handlebars(compClass, `
    async function() {
      {{#each props}}

      {{#if persisted.enabled}}
      this.{{name}} = await (async function() { {{{persisted.load}}} })();
      {{/if}}

      this.$watch("{{name}}", {
        handler: function (newValue) {
          ide.debugger.log.prop.value.set(this, [${compClass._id}, {{id}}], newValue);
        },
        deep: true,
        immediate: true
      });

      {{/each}}
    }
  `);

  try
  {
    hooks.mounted = eval(`(${hooks.mounted})`);
  }
  catch (ex)
  {
    throw ex;
  }

  return hooks;
}

compiler.toVueTemplate = (compClass, origComp) => {
  try
  {
    origComp.view.errors = (origComp.view.errors || []);
    origComp.view.errors.splice(0);

    var emptyValuePH = `${Date.now()}`;
    var cbNode = (node) => {
      node.attrs = (node.attrs || []);
      //node.attrs.push({ name: "v-ide-debugger" });
      node.attrs?.forEach(attr => { if ((attr.name) && (!attr.value)) attr.value = emptyValuePH; });
    };
    var haml = viewDom.nodeToHaml(compClass, compClass.view.node, 0, cbNode, true);
    var html = null;
    if (typeof(util) != `undefined`) html = util.haml(haml); else html = HAML.render(haml);
    html = html?.replaceAll(emptyValuePH, "");

    // Doesn't work in node.js
    if (false)
    {
      var $html = $(html);
      if ($html.length > 1) throw `${compClass.name}: View should contain exactly one root element.`;
      if ($html.length == 0) html = `<div></div>`;
    }

    return html;
  }
  catch (ex)
  {
    origComp.view.errors.push({ text: ex.toString(), ex: ex });
    if (typeof(ideVueApp) == `undefined`) throw ex; else ideVueApp.onCompError(null, [{ comp: origComp }], ex);
    //throw ex;
  }
};


if (true)
{
  compiler.onErrorCaptured = function (ex, vm, info) {
    if (vm?.$data?._meow)
    {
      var comp = compDom.get.comp.byID(vm?.$data?._meow?.comp?._id);
      if (typeof(ideVueApp) == `undefined`) throw ex; else ideVueApp.onCompError(vm, [{ comp: comp }], ex);
    }
    else
    {
      throw ex;
    }
    return (false);
  };
}


compiler.toVueComponentOptions = (compClass) => {
  if (!compClass) return {};

  var origComp = compClass;
  compClass = compiler.preprocess(compClass);

  let vueData = compiler.toVueData(compClass, origComp);

  var compOptions = {
    _ide_data: {
      comment: `This is to view the generated data model in the IDE. The actual data model is in a {}.data = function() which is not rendered in JSON.`,
      data: vueData
    },
    props: compiler.toVueProps(compClass),
    data: eval(`(function() { return ${JSON.stringify(vueData)}; })`),  //.replace(/"([^"]+)":/g, '$1:')}; })`), // remove quotes from property names
    computed: compiler.toVueComputeds(compClass, origComp),
    asyncComputed: compiler.toVueAsyncComputeds(compClass),
    methods: compiler.toVueMethods(compClass, origComp),
    watch: compiler.toVueWatchers(compClass, compClass.props),
    template: compiler.toVueTemplate(compClass, origComp),
    errorCaptured: compiler.onErrorCaptured,
  };

  if (compiler.mode == `production`) delete compOptions._ide_data;

  // add hook methods (.hook property, not really used)
  var isHookMethod = (m) => ((["unmounted"].includes(m.name) && (!["mounted"].includes(m.name))));
  compClass.methods
    .filter(m => isHookMethod(m))
    .forEach(m => { compOptions[m.name] = compOptions.methods[m.name]; });

  // create mounted hook with our and possiblty user's code
  var mounted = compClass.methods.find(m => (m.name == `mounted`));
  var unmounted = compClass.methods.find(m => (m.name == `unmounted`));

  // route params
  var propRouteParams = [];

  let routeParamProps = compClass.props
    .filter(p => p.routeParam?.enabled);

    routeParamProps.forEach(prop => {
      propRouteParams.push(`this.${prop.name} = this.$route?.params.${prop.name};`);
    });

  let routeParamPropNames = routeParamProps.map(p => p.name);

  var routeParams = `
    let paramHandler = (name, value) => {
      if (!${JSON.stringify(routeParamPropNames)}.includes(name)) return;
      if (name in this) this[name] = value;
    };
  
    this.$parent.$on('ide-route-param-changed', paramHandler);
    if (this.$parent.$parent) this.$parent.$parent.$on('ide-route-param-changed', paramHandler);
    `;
  
  // persisted loads
  var propPersisteds = [];
  propPersisteds = compClass.props
    .filter(p => p.persisted.enabled)
    .map(p => `
    this.${p.name} = (await (${toFunction([], p.persisted.load.body).toString()}.bind(this))());
    `);
  // $watch for every prop
  var propWatches = [];
  if (compClass.options?.debug)
  {
    propWatches = compClass.props
      //.filter(p => false)
      .map(p => `this.$watch("${p.name}", {
      handler: function(newValue) {
        ide.debugger.log.prop.value.set(this, [${compClass._id}, ${p.id}], newValue);
      },
      deep: true,
      immediate: false
    });`);
  }

  let debugVueInConsole = [`
    if (false) $(this.$el).on("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(this);
    });
    `];

  if (compiler.mode == `production`)
  {
    debugVueInConsole = [];
    propWatches = [];
  }

  let ideInits = [];
  ideInits.push(`if (this.$getApp) this.$app = this.$getApp();`);


  var mountedMethod = {
    name: `mounted`,
    args: null,
    body: `
    ${ideInits.join(`\n`)}
    ${routeParams}
    ${propRouteParams.join(`\n`)}
    ${propPersisteds.join(`\n`)}
    ${propWatches.join(`\n`)}
    ${(mounted?.body || ``)}
    ${debugVueInConsole.join(`\n`)}
    `
  };
  compOptions.mounted = compiler.toVueMethod(compClass, mountedMethod, (mounted || {errors:[]}));
  if (unmounted) compOptions.unmounted = compiler.toVueMethod(compClass, unmounted, unmounted);

  return compOptions;
}

compiler.unregisterFromVue = (compName) => {
  delete Vue.options.components[compName.kebabize()];
}




compiler.compile = async (compClass, options = { fix: true }) => {
  var promise = new Promise(async (resolve, reject) => {
    try
    {
      if (options.fix) await compDom.fix.comp(compClass);
      if (!compClass) { resolve(); return; }
      if (compClass.safeMode) { reject(`compClass is set to safe mode, not compiling.`); return; }
      if (options.fix) viewDom.fixPaths(compClass.view.node);
      //alertify.message(`Compiling ${compClass.name}`);
      var compName = compDom.get.comp.name.vueName(compClass);
      var vueOptions = compiler.toVueComponentOptions(compClass);
      if (typeof(Vue) != `undefined`) var vueComp = Vue.component(compName, vueOptions);
      resolve(vueComp);
    }
    catch (ex)
    {
      console.error(`Error compiling ${compClass.name}`);
      reject(ex);
    }
  });
  return promise;
}


compiler.compileAll = async (comps, options = { fix: true }, onProgress) => {
  var promise = new Promise(async (resolve) => {
    var started = Date.now();

    console.log(`starting compileAll`);

    let i = 0;
    let total = comps.length;

    comps = [...comps];
    var compileNext;
    compileNext = async () => {
      var comp = comps.shift();

      //console.log(`Compiling ${comp.name}...`);

      try { await compiler.compile(comp, options); }
      catch (ex) {
        console.error(`Error compiling ${comp.name}`);
        console.error(comp);
        console.error(ex);
      }
      
      i++;
      let percent = (!total) ? 1 : (i / total);
      if (onProgress) onProgress(percent);
      console.log(`compileAll (${i} / ${total})`);
      console.log(`[${"#".repeat(percent*30)}${" ".repeat(30 - percent*30)}] ${Math.round(percent*100)}%`);

      if (comps.length <= 0)
      {
        var stopped = (Date.now() - started);
        console.log(`compileAll ${stopped}ms`);
        resolve();
      }
      else
      {
        setTimeout(compileNext, 1);
      }
    }
    await compileNext();
  });
  return promise;
}



var myExports = compiler;

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = myExports;
  }
} else {
  Vue.prototype.$getApp = function() {
    let vue = this.$parent;
    while ((!vue.isApp) && (vue.$parent)) vue = vue.$parent;
    return (vue?.isApp ? vue : null);
  };

  Vue.prototype.$localStorage = window.$localStorage;
  Vue.prototype.$mgApi = window.MgApi;

  let dbp = (new anat.dev.DatabaseProxy(`db.memegenerator.net`, `MemeGenerator`));
  (async() => {
    await dbp.createEntityMethods();
    await dbp.createApiMethods();
  })();
  
  Vue.prototype.$dbp = dbp;
  Vue.prototype.$graph = new GraphDatabase();
  Vue.prototype.$dataBinder = new DataBinder();

  window.vueUserComponentCompiler = compiler;
}
