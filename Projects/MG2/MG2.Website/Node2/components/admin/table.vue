<template lang="pug">
div.card
    table(v-if="data?.length")
        thead
            th(v-for="key in Object.keys(data[0])")
                | {{key}}
        tbody
            tr(v-for="item in data", @click="itemClick(item)")
                td(v-for="key in Object.keys(item)")
                    .content
                        | {{item[key]}}
</template>

<script>
export default {
    props: {
        icon: {
            type: String,
        },
        title: {
            type: String,
        },
        data: {
            type: Array,
            default: () => []
        }
    },
    methods: {
        itemClick(item) {
            console.log(item);
            this.$emit('item-click', item);
        }
    },
}
</script>

<style scoped>
.content
{
    height: 1.5em;
    overflow: hidden;
}
tr:hover
{
    background-color: #ffffff30;
}
td
{
    padding-right: 1em;
}
</style>
