// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    build: {
    },
    css: [
        '~/node_modules/shorthandcss/dist/shorthand.css',
        `~/lib/leader-line/src/leader-line.css`,
        '~/css/default.css',
        '~/css/drag-and-drop.css',
        '~/css/shorthand.scss',
        '~/css/transitions.css',
        '~/css/style.css',
    ],
    components: {
        global: true,
        dirs: [
            '~/components',
        ]
    }
})
