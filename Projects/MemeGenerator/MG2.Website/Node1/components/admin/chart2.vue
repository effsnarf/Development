<template lang="pug">
    admin-chart(:header="`${app} ${category}`", :title="`last ${last} every ${every}`", :data="values", :total="values.average()")
</template>

<script>
import "../../../../../../Shared/Extensions";

export default {
    props: {
        app: {
            type: String,
        },
        category: {
            type: String,
        },
        event: {
            type: String,
        },
        last: {
            type: String,
        },
        every: {
            type: String,
        },
        type: {
            type: String,
        },
    },
    data: () => ({
        values: [],
    }),
    mounted() {
        this.fetchData();
    },
    methods: {
        async fetchData() {
            this.values = (await (await fetch(this.url)).json());
        },
    },
    computed: {
        url() {
            const { app, category, event, last, every, type } = this;
            return `https://db.memegenerator.net/analytics/${app}/${category}/${event}/last/${last}/every/${every}/${type}`;
        },
    },
}
</script>