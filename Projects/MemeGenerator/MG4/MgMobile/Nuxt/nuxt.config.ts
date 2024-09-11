// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  ssr: false,
  devtools: { enabled: true },
  app: {
    pageTransition: {
      name: "page",
      mode: "default",
    },
  },
  css: [`~/css/global.css`, `~/css/transitions.scss`],
});
