<template lang="pug">
    admin-chart(:header="`${app} ${category}`", :title="`last ${last} every ${every}`", :data="values", :total="values.average().toFixed(0)")
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
            return `https://db.memegenerator.net/analytics/MG.Web/LoadBalancer/requests.per.minute/last/${this.last}/every/${this.every}/${this.type}`;
        },
    },
}
</script>