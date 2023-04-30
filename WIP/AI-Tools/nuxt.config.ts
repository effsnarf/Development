// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    build: {
    },    
    css: [
        '~/node_modules/shorthandcss/dist/shorthand.css',
        '~/css/default.css',
        '~/css/shorthand.scss',
        '~/css/transitions.css',
        '~/css/style.css',
    ],
    components: {
        global: true,
        dirs: [
            '~/components',
        ]
    },
    plugins: [
        { src: '~/plugins/js-yaml.js' }
    ]
})
