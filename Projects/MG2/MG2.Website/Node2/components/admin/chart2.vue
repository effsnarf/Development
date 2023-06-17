<template lang="pug">
div
    //pre {{ chart }}
    admin-chart(v-if="chart", :total="chart.total?.value", :data="chart.chart?.data", :title="chart.chart?.text", :icon="chart.icon")
</template>

<script>
export default {
    name: 'chart2',
    props: {
        chart: Object,
    },
    data() {
        return {
        }
    },
    methods: {
    },
}
</script>