<template lang="pug">
div.card
    table(v-if="tableData?.length")
        thead
            th(v-for="key in Object.keys(tableData[0])")
                | {{key}}
        tbody
            tr(v-for="item in tableData", @click="itemClick(item)")
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
            this.$emit('item-click', item);
        }
    },
    computed: {
        tableData() {
            if (!this.data?.length) return [];
            if (this.data.map(v => typeof v).find(t => (t == 'number'))) {
                return this.data.map(value => { return { value }; });
            }
            return this.data;
        }
    }
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
