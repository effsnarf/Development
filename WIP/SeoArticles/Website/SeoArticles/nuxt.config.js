import fs from "fs";
import path from "path";

export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  server: {
    // host: 'localhost',
    // port: 3020
    host: '10.35.16.38',
    port: 443,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl/meow.energy.key.txt')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl/meow.energy.crt'))
    }
  },

  serverMiddleware: [
    '~/middleware/apify.ts'
  ],

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'SeoArticles',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    script: [
      { src: '/js/apify.client.js' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: '/css/lib/shorthand.css' },
      { rel: 'stylesheet', href: '/css/default.css' },
      { rel: 'stylesheet', href: '/css/shorthand.css' },
      { rel: 'stylesheet', href: '/css/transitions.css' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build'
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios'
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: '/'
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    publicPath: '/js/'
  },

}
