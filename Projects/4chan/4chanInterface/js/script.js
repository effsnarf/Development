const FourChanInterfaceVueOptions = {
    data() {
      return {
        thread: null,
      };
    },
    mounted() {
      this.init();
    },
    methods: {
      async init() {
        debugger;
        const url = `https://a.4cdn.org/${this.board}/thread/${this.threadID}.json`;
        this.thread = await (await fetch(url)).json();
      },
      summarizeThread() {
        alert("Summarizing thread");
      },
    },
    computed: {
      board() {
        return this.urlParts[3];
      },
      threadID() {
        return parseInt(this.urlParts[5]);
      },
      urlParts() {
        return window.location.href.split("/");
      },
    },
  }


function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}


function initializeVueFromSFC(sfcString, vueOptions) {
    // Regular expressions to extract template and script
    const templateRegex = /<template>([\s\S]*?)<\/template>/;
    //const scriptRegex = /<script>[\s\S]*?export default\s*({[\s\S]*?})\s*<\/script>/;

    // Extract template and script content
    const templateMatch = sfcString.match(templateRegex);
    //const scriptMatch = sfcString.match(scriptRegex);

    const template = templateMatch ? templateMatch[1].trim() : '';
    //const scriptContent = scriptMatch ? scriptMatch[1].trim() : '';

    const componentOptions = vueOptions;

    // Add template to component options if it exists
    if (template) {
        componentOptions.template = template;
    }

    const div = document.createElement('div');
    document.body.appendChild(div);
    Vue.createApp(componentOptions).mount(div);
    //new Vue(componentOptions).$mount(div);
}

  
async function addCustomWindow() {
    try {
      const vueSfc = (await (await fetch(chrome.runtime.getURL('/vue/interface.vue'))).text());
      initializeVueFromSFC(vueSfc, FourChanInterfaceVueOptions);
    } catch (err) {
        console.error('Error adding custom window:', err);
    }
}

addCustomWindow();
