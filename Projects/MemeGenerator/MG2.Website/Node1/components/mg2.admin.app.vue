<template lang="pug">
    div.app
        h2 Admin
        div.bars
            div.bar
                admin-chart2(app="MG.Web", category="LoadBalancer", event="requests.per.minute", last="1d", every="30m", type="sum")
                admin-chart2(app="MG.Web", category="LoadBalancer", event="requests.per.minute", last="1h", every="1m", type="sum")
                admin-chart2(app="MG.Web", category="LoadBalancer", event="requests.per.minute", last="10m", every="1m", type="sum")
            div.bar
                admin-chart2(app="MG.DBP", category="LoadBalancer", event="requests.per.minute", last="1d", every="30m", type="sum")
                admin-chart2(app="MG.DBP", category="LoadBalancer", event="requests.per.minute", last="1h", every="1m", type="sum")
                admin-chart2(app="MG.DBP", category="LoadBalancer", event="requests.per.minute", last="10m", every="1m", type="sum")
</template>

<script>
export default {
    data() {
        return {
        };
    },
    async mounted() {
    },
    methods: {
    },
    computed: {
    }
};
</script>

<style scoped>
.app {
    height: 100vh;
    overflow-x: hidden;
    overflow-y: scroll;
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
