import path from "path";
import fs from "fs";
import * as yaml from "js-yaml";

const isDevEnv = (process.env.NODE_ENV != 'production');
const envPort = isDevEnv ? 'http' : 'https';
const dbProxyHost = isDevEnv ? 'localhost:4040' : 'db.memegenerator.net';
const config = yaml.load(fs.readFileSync(path.resolve(__dirname, 'config.yaml'), 'utf8'));
export default {
  ssr: false,

  server: config.server,

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: "Meme Generator",
    htmlAttrs: {
      lang: "en",
    },
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "" },
      { name: "format-detection", content: "telephone=no" },
    ],
    script: [
      { src: `https://www.googletagmanager.com/gtag/js?id=G-P952PRPTTR`, async: true },
      { src: `https://code.jquery.com/jquery-3.6.1.js` },
      { src: `${envPort}://${dbProxyHost}/utility.js` },
      { src: `/api/client.js` },
      { src: `https://cdnjs.cloudflare.com/ajax/libs/postscribe/2.0.8/postscribe.min.js` },
      { src: `https://www.gstatic.com/charts/loader.js` },
      {
        src: `https://cdnjs.cloudflare.com/ajax/libs/AlertifyJS/1.13.1/alertify.js`,
      },
      {
        src: `https://cdnjs.cloudflare.com/ajax/libs/history.js/1.8/compressed/history.min.js`
      },
      { async: true, src: `https://static.addtoany.com/menu/page.js` },
      //{ src: "/js/startup.js", body: true },
      { src: `/js/startup.js` },
    ],
    link: [
      { rel: "icon", type: "image/x-icon", href: "/img/favicon.ico" },

      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css?family=Kulim+Park|Satisfy|Source+Code+Pro&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/shorthandcss@1.1.1/dist/shorthand.min.css",
      },
      {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/AlertifyJS/1.13.1/css/alertify.css",
      },
      {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/AlertifyJS/1.13.1/css/themes/bootstrap.css",
      },
      {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/AlertifyJS/1.13.1/css/themes/default.css",
      },
      {
        rel: "stylesheet",
        href: "/css/default.css",
      },
      {
        rel: "stylesheet",
        href: "/css/mg2.style.css",
      },
      {
        rel: "stylesheet",
        href: "/css/mg2.admin.style.css",
      }
    ],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    `~/plugins/vue-async-computed.js`,
    `~/plugins/localStorage.js`,
    `~/plugins/mg.api.js`,
    `~/plugins/DatabaseProxy.js`,
    //`~/plugins/route.js`
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    "@nuxt/typescript-build"
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    extend(config, { isDev, isClient }) {
      // Add support for Pug files
      config.module.rules.push({
        test: /\.pug$/,
        loader: 'pug-plain-loader'
      })
    }
  },

  typescript: {
    loaders: {
      ts: {
        silent: true
      },
      tsx: {
        silent: true
      }
    }
  },

  serverMiddleware: [
    { path: "/api", handler: '~/server/middleware/api' },
    { path: "/img", handler: '~/server/middleware/img' },
  ],
};
