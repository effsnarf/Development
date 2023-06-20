<template lang="pug">
div.app
  div.column
    admin-select(:options="app.options" v-model="app.value")
  div.column
    admin-select(:options="last.options" v-model="last.value")
  div
    div.bars
      div.bar
        admin-chart2(:app="app.value", category="LoadBalancer", event="requests", :last="last.value", :every="every", type="count")
        admin-chart2(:app="app.value", category="LoadBalancer", event="response.time", :last="last.value", :every="every", type="average")
</template>

<script>
import "../../../../../Shared/Extensions";

export default {
    data() {
        return {
            app: {
                options: ["MG.DBP", "MG.Web"],
                value: "MG.DBP"
            },
            last: {
                options: ["1 month", "1 week", "1 day", "1 hour"],
                value: "1 hour"
            },
            bars: {
                value: 60
            }
        };
    },
    async mounted() {
    },
    methods: {
    },
    computed: {
        every() {
            return (this.last.value.deunitify() / this.bars.value).unitifyTime().withoutColors();
        }
    }
};
</script>

<style scoped>
.app {
    display: flex;
    gap: 1em;
    padding: 1em;
    height: 100vh;
    overflow-x: hidden;
    overflow-y: scroll;
}

.column
{
    width: 10%;
}


.bars {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.bar {
    display: flex;
    margin: auto;
    width: min-content;
    gap: 1rem;
}
</style>
