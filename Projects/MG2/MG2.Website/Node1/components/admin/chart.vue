<template lang="pug">
    div.card(:class="getCssClass()")
        h2.header(v-if="header") {{ header }}
        div.chart.flex
            div.column
                admin-num.opacity-50(:value="minValue")
                admin-num(:value="middleValue")
                admin-num.opacity-50(:value="maxValue")
            div
                canvas.ml-l1(ref="canvas1", width="400", height="200", @mousemove="onMouseMove", @mouseout="onMouseOut")
        div.flex.justify-center.items-center
            div.title
                div.icon {{ icon }}
                div.text {{ title || '♻' }}
            admin-num.total(:value="hoveredData||total")
</template>

<script>
export default {
    props: {
        icon: {
            type: String,
        },
        header: {
            type: String,
        },
        total: {
            type: Number,
        },
        title: {
            type: String,
        },
        getValue: {
            type: Function,
            default: x => x
        },
        data: {
            type: Array,
            default: () => []
        },
        color: {
            type: String,
        },
    },
    data: () => ({
        hoveredIndex: null
    }),
    methods: {
        getCssClass() {
            const cls = {};
            if (!this.data?.length) cls.empty = true;
            if (this.color) cls[`chart-${this.color}`] = true;
            return cls;
        },
        drawChart(data) {
            if (!this.data?.length) return;

            this.ctx.clearRect(0, 0, this.width, this.height);
            this.ctx.beginPath();
            this.ctx.moveTo(this.paddingX, this.paddingY + this.chartHeight);
            for (let i = 0; i < this.data.length; i++) {
                const x = this.paddingX + i * this.step;
                const y = this.paddingY + this.chartHeight - (this.getValue(this.data[i]) - this.min) * this.stepY;
                this.drawBar(x, this.getValue(this.data[i]), '#ffffff80');
            }
            this.ctx.lineTo(this.paddingX + this.chartWidth, this.paddingY + this.chartHeight);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff80';
            this.ctx.stroke();
        },
        drawBar(x, value, color) {
            const y = this.paddingY + this.chartHeight - (value - this.min) * this.stepY;
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, this.step, this.chartHeight - y + this.paddingY);
        },
        // Set hovered data
        onMouseMove(e) {
            const x = e.offsetX;
            const i = Math.floor((x - this.paddingX) / this.step);
            this.hoveredIndex = i;
        },
        onMouseOut(e) {
            this.hoveredIndex = null;
        }
    },
    watch: {
        data: {
            handler: async function (data) {
                await this.$nextTick();
                this.drawChart(data);
            },
            immediate: true,
            deep: true
        },
        hoveredIndex: {
            handler: async function (newIndex, oldIndex) {
                if (newIndex === oldIndex) return;
                await this.$nextTick();
                this.drawChart(this.data);
                if (newIndex !== null) {
                    const value = this.getValue(this.data[newIndex]);
                    this.drawBar(this.hoveredX, value, '#ffffff80');
                }
            },
            immediate: true,
            deep: true
        }
    },
    computed: {
        canvas() {
            return this.$refs.canvas1;
        },
        ctx() {
            return this.canvas.getContext('2d');
        },
        width() {
            return this.canvas.width;
        },
        height() {
            return this.canvas.height;
        },
        padding() {
            return 0;
        },
        paddingX() {
            return this.width * this.padding;
        },
        paddingY() {
            return this.height * this.padding;
        },
        chartWidth() {
            return this.width - this.paddingX * 2;
        },
        chartHeight() {
            return this.height - this.paddingY * 2;
        },
        step() {
            return this.chartWidth / this.data.length;
        },
        stepY() {
            return this.chartHeight / this.range;
        },
        min: {
            get: function () {
                if (!this.data?.length) return 0;
                return Math.round(Math.min(...this.data.map(x => this.getValue(x))));
            },
            deep: true
        },
        max: {
            get: function () {
                if (!this.data?.length) return 0;
                return Math.round(Math.max(...this.data.map(x => this.getValue(x))) * 1.1);
            },
            deep: true
        },
        minValue: {
            get: function () {
                return (this.data||[]).filter(v => v).min();
            },
            deep: true
        },
        averageValue: {
            get: function () {
                return (this.data||[]).filter(v => v).average();
            },
            deep: true
        },
        middleValue: {
            get: function () {
                return (this.minValue + this.maxValue) / 2;
            },
            deep: true
        },
        maxValue: {
            get: function () {
                return (this.data||[]).filter(v => v).max();
            },
            deep: true
        },        
        range() {
            return this.max - this.min;
        },
        hoveredData() {
            if (this.hoveredIndex === null) return null;
            const value = this.data[this.hoveredIndex];
            return value;
        },
        hoveredX() {
            if (this.hoveredIndex === null) return null;
            return this.paddingX + this.hoveredIndex * this.step;
        },
    }
}
</script>

<style scoped>
h2
{
    font-size: 140%;
    margin-bottom: 0.5em;
}
canvas
{
    filter: drop-shadow(-3px 3px 1px black);
    border: 2px solid white;
    border-radius: 0.5em;
}
.total
{
    text-align: center;
    font-size: 200%;
    margin-left: 1em;
}
.title
{
    display: flex;
    justify-content: center;
    text-align: center;
    font-size: 160%;
    line-height: 1.2;
    margin: 0.5em 0;
    opacity: 0.6;
}
.column
{
    display: flex;
    flex-direction: column-reverse;
    justify-content: space-between;
    text-align: center;
    font-size: 160%;
}

.chart-green
{
    background: #80ff8060;
}
.chart-blue
{
    background: #40a0ffa0;
}

.empty
{
    opacity: 0.4;
}
</style>
