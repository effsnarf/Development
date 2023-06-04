<template lang="pug">
    div.app
        h2 Admin
        div.bars
            div.bar
                admin-chart(header="MG.Web", icon="🎈", title="Requests per minute", :data="chart1", :total="chart1?.average().toFixed(0)")
                admin-chart(header="MG.DBP", icon="🎈", title="Requests per minute", :data="chart2", :total="chart2?.average().toFixed(0)")
</template>

<script>
export default {
    data() {
        return {
            chart1: null,
            chart2: null,
        };
    },
    async mounted() {
        this.chart1 = (await (await fetch('https://db.memegenerator.net/analytics/MG.Web/LoadBalancer/requests.per.minute/last/1h/every/1m/sum')).json());
        this.chart2 = (await (await fetch('https://db.memegenerator.net/analytics/MG.DBP/LoadBalancer/requests.per.minute/last/1h/every/1m/sum')).json());
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
