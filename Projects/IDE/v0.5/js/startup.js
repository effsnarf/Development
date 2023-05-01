

var nodeHoverBuffer = {};


const localCache = {
  get: async (key, getValue) => {
    // We get the value either way
    const promise = new Promise(async (resolve, reject) => {
      const value = await getValue();
      localStorage.setItem(key, JSON.stringify(value));
      resolve(value);
    });
    // We get the value from the cache if it exists
    const cachedValue = JSON.parse(localStorage.getItem(key) || null);
    if (cachedValue) return cachedValue;
    // We get the value from the promise
    return await promise;
  }
}


function CssLibrary(url) {

  this.init = async function() {
    this.cssCode = (await (await fetch(url)).text());
    var classNameRegex = /^\.[a-z]([a-z0-9-]+)?(__([a-z0-9]+-?)+)?(--([a-z0-9]+-?)+){0,2}$/;
    this.classNames = {};
    this.classNames.all = css.parse(this.cssCode).stylesheet.rules
      .flatMap(r => r.selectors)
      .filter(s => s)
      .filter(s => s.startsWith(`.`))
      .filter(s => classNameRegex.test(s))
      .map(s => s.substr(1));
    this.classNames.all.sort();
  }
  this.init();
}



const animateCSS = (element, animation, prefix = 'animate__') =>
  // We create a Promise and return it
  new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    var node = (typeof(element) != "string") ? element : document.querySelector(element);
    node = $(node)[0];

    node.classList.add(`${prefix}animated`, animationName, "animate__faster");

    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd(event) {
      event.stopPropagation();
      node.classList.remove(`${prefix}animated`, animationName);
      resolve('Animation ended');
    }

    node.addEventListener('animationend', handleAnimationEnd, {once: true});
  });


  if (true)
  {
    var getExceptionKeywords = (ex) => {
      if (!ex) return null;
      var keywords = [];
      var s = ex.toString();
      var r = /\(reading '(.+)'\)/g;
      keywords.push(...[...s.matchAllRegexes(r)].map(m => m[1]));
      var r = / (.+) is not defined/g;
      keywords.push(...[...s.matchAllRegexes(r)].map(m => m[1]));
      return keywords;
    };

    if (true)
    {
      Vue.config.errorHandler = function (ex, vm, info) {
        if (vm?.$data?._meow?.comp)
        {
          var comp = compDom.get.comp.byID(vm.$data._meow.comp._id);
          ideVueApp.onCompError(vm, { comp: comp }, ex);
        }
        else
        {
          ideVueApp.onCompError(vm, null, ex);
        }
      };
    }
  }



document.addEventListener("DOMContentLoaded", async function() {


  Vue.component(`progress-bar`, {
    props: {
      value: {
        default: 0,
      },
    },
    template: util.haml(`%div.progress-bar\n  %div.progress-bar-fill{":style": "{ width: \`$\{value*100}%\` }"}\n`),
  });

  Vue.component(`ide-system-hourglass`, {
    data: function() {
      return {
        timer: null,
        started: null,
        elapsed: null,
        progress: null,
      };
    },
    methods: {
      start: function() {
        this.stop();
        this.started = Date.now();
        this.timer = setInterval(this.worker, 100);
      },
      stop: function() {
        clearInterval(this.timer);
      },
      worker: function() {
        this.elapsed = (Date.now() - this.started);
      }
    },
    mounted: function() {
    },
    template: util.haml(`%div{"v-if": "timer"}\n  %div.hourglass\n  %div\n    %progress-bar.mt-l1{":value": "progress"}\n  %div.hidden.text-center.opacity-50{"v-text": "\`\${(elapsed / 1000).toFixed(2)}s\`"}`)
  });


  Vue.component(`ide-system-splash-intro`, {
    props: {
      wordDuration: {
        default: 1,
      },
      words: {
        default: ["", "Meow", ""]
      }
    },
    template: util.haml(`
%div.ide-system-splash-intro
  %div{"class": "container"}
    %div testing
    %div{"class": "morphing"}
      %div{"class": "word", ":style": "{ 'animation-duration': \`$\{(wordDuration * words.length)\}s\`, 'animation-delay': \`-$\{wordDuration * (words.length + 1 - index)\}s\` }", "v-for": "(word, index) in words", "v-text": "word"}`)
  });


  var initVueApp = () => {
    var ideVueApp =  new Vue({
      el: "#app",
      data: {
        isIniting: false,
        showSplashIntro: false,
        key1: 1,
        funcs: {
          ide: [],
          user: []
        },
        comps: {
          ide: [],
          user: []
        },
        timers: {
          recompile: {
            comp: {}
          }
        },
        css: {
          library: {
            shorthand: (new CssLibrary('/css/lib/shorthand.css'))
          }
        },
        errors: []
      },
      computed: {
      },
      methods: {
        getFunc: function(_id) {
          return this.funcs.user.find(f => (f._id == _id));
        },
        addUserComp: function (comp) {
          // if comp already exists, create a copy
          if (this.comps.user.find(c => (c._id == comp._id)))
          {
            return;
            //comp = compDom.create.comp(comp);
          }
          //
          this.comps.user.push(comp);
          liveData.dbp.api.componentClasses.user.add(comp._id);
          liveData.watch.item(`ComponentClasses`, comp);
          compDom.components.value.push(comp);
        },
        createNewComp: async function () {
          var newComp = (await compDom.create.comp());
          this.comps.user.push(newComp);
          compDom.components.value.push(newComp);
          liveData.watch.item("ComponentClasses", newComp, { on: { changed: this.onCompChanged } });
        },
        onCompsLoaded: function(ldItems) {
          //comps.sort((a,b) => (b.last?.selected - a.last?.selected));
        },
        onCompChanged: function(comp) {
          // this is triggered by a watcher, who watches and notifies data, not references
          comp = compDom.get.comp.byID(comp._id);
          //console.log(`${comp.name} changed`);
          this.$emit("ide-comp-changed-2", comp);
        },
        onCompChanged2: async function(comp) {
          var timers = this.timers.recompile.comp;
          clearTimeout(timers[comp._id]);
          timers[comp._id] = setTimeout(async () => {
            await this.recompileComp(comp);
          }, 3000);
        },
        isDuplicateError: function(error, items, ex) {
          if (!error) return false;
          if (error.ex.toString() == ex.toString()) return true;
        },
        onCompError: async function(vue, items, ex) {
          console.warn(ex);
          var keywords = getExceptionKeywords(ex);
          if ((items?.length) && (items[0].comp))
          {
            var specificItems = (await compDom.search.all(keywords, items[0].comp, false, true));
            if (specificItems) items = specificItems;
          }
          var lastError = this.errors[this.errors.length - 1];
          if (this.isDuplicateError(lastError, items, ex) && ((Date.now() - lastError.dt) < 600)) return;
          this.errors.push({ dt: (new Date()), vueInfo: { data: compDom.get.vue.info.data(vue) }, items: items, text: ex.toString(), ex: ex });
          alertify.error(`⚠️ ${ex.toString()}`);
        },
        recompileComp: async function(comp) {
          // biztos ami biztos
          comp = compDom.get.comp.byID(comp._id);
          await vueUserComponentCompiler.compile(comp, { fix: false });
          this.$emit("ide-comp-recompiled", comp);
        },
        onCompDeleted: async function(comp) {
          compDom.components.value.splice(compDom.components.value.findIndex(c => (c._id == comp._id)), 1);
          this.comps.ide.splice(this.comps.ide.findIndex(c => (c._id == comp._id)), 1);
          this.comps.user.splice(this.comps.user.findIndex(c => (c._id == comp._id)), 1);
        },
        getIdeComp: function(compName) {
          return this.comps.ide.find(c => (c.name == compName)) ||
          this.comps.ide.find(c => (c.name.kebabize() == compName));
        },
        init: async function() {
          var isLocalhost = window.location.host.startsWith(`localhost`);
          if (isLocalhost)
          {
            await this.initIde();
            this.showSplashIntro = false;
          }
          else
          {
            await Promise.all([this.initIde()]);
          }
          $(`.body-background`).fadeIn(3000);
          //this.refresh();
          this.reload();
        },
        initIde: async function() {
          this.$on("ide-comp-changed-2", this.onCompChanged2)
          this.isIniting = true;
          this.$refs.hourglass1.start();
          await liveData.dbp.createApiMethods({logToConsole: true});
          const start = Date.now();
          this.comps.ide = await localCache.get('ide-component-classes', async () => await liveData.dbp.api.componentClasses.ide.get());
          const end = Date.now();
          const duration = (end - start) / 1000;
          compDom.components.value.push(...this.comps.ide);
          this.comps.ide.forEach(comp => liveData.watch.item("ComponentClasses", comp, { on: { changed: this.onCompChanged } }));
          await vueUserComponentCompiler.compileAll(this.comps.ide, { fix: false }, (p) => { this.$refs.hourglass1.progress = p; });
          this.$refs.hourglass1.stop();
          this.isIniting = false;
        },
        reload: async function() {
          // load user functions
          this.funcs.user = (await liveData.dbp.api.functions.user.get());

          var started = Date.now();
          // first, remove all existing user comps from global comp list
          var allComps = compDom.components.value;
          // we already loaded ide comps on init, so remove all user comps from global list
          var ideCompIDs = this.comps.ide.map(c => c._id);
          // user comp ids are ([all comps] - [ide comps])
          var userComps = allComps.filter(c => (!ideCompIDs.includes(c._id)));
          var userCompIDs = userComps.map(c => c._id);
          // unwatch all user comps
          userCompIDs.forEach(id => liveData.unwatch.item(`ComponentClasses`, id));
          // remove all user comps from global list
          allComps.removeAll(c => userCompIDs.includes(c._id));
          // clear ui user comp list
          this.comps.user.splice(0, this.comps.user.length);
          // get user comps from server
          //var msg = alertify.message(`<h2>Loading user components</h2><div class="hourglass"></div>`).delay(0);
          var userComps = (await liveData.dbp.api.componentClasses.user.get());
          //msg.dismiss();
          // we can have comps.ide and comps.user containing same comps
          // but the object reference has to be to one watched data item.
          // from the user comps, find the ide comps
          var ideCompIDs = userComps
            .filter(c => (this.comps.ide.find(idec => (idec._id == c._id))))
            .map(c => c._id);
          // remove user comps that already exist in the ide comps
          // user may own ide comps
          userComps = userComps.filter(c => (!ideCompIDs.includes(c._id)));
          // populate user comps from ide comps items
          userComps.push(...this.comps.ide.filter(idec => ideCompIDs.includes(idec._id)));
          this.comps.user = userComps;

          var components = compDom.components.value;
          // user components that are not in the global comp list yet, i.e not ide comps
          var newComps = this.comps.user.filter(c => (!components.find(c2 => (c2._id == c._id))));
          // global components list only contains one copy of each components
          components.push(...newComps);
          newComps.forEach(comp => liveData.watch.item("ComponentClasses", comp, { on: { changed: this.onCompChanged } }));
          await vueUserComponentCompiler.compileAll(newComps, { fix: true });
        },
        refresh: function() {
          this.key1++;
        },
        with: util.with,
        debug: (...args) => {
          console.log(...args);
        }
      },
      mounted: function() {
        this.init();
      },
    });

    window.log = {
      info: () => {}
    };

    window.ideVueApp = ideVueApp;
  }

  initVueApp();


});
