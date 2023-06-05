<template lang="pug">
div
    admin-chart(:class="cssClass", :header="`${event}`", :title="`last ${last} every ${every}`", :data="values", :color="color")
    admin-table(:data="values.sortBy(v => -v)")
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
        isBusy: 0
    }),
    mounted() {
        this.fetchData();
    },
    methods: {
        async fetchData() {
            this.isBusy++;
            this.values = await (await fetch(this.url)).json();
            this.isBusy--;
        },
    },
    computed: {
        url() {
            let { app, category, event, last, every, type } = this;
            last = last.deunitify().unitifyTime();
            every = every.deunitify().unitifyTime();
            let url = `https://db.memegenerator.net/analytics/${app}/${category}/${event}/last/${last}/every/${every}/${type}`;
            url = url.withoutColors();
            return url;
        },
        color() {
            return {
                "requests": "green",
                "response.time": "blue",
            }[this.event] || "";
        },
        cssClass() {
            const cls = {};
            if (this.isBusy) cls["opacity-70"] = true;
            return cls;
        }
    },
    watch: {
        url: {
            handler() {
                this.fetchData();
            },
            immediate: true
        }
    }
}
</script>