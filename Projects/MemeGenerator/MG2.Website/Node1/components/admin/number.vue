<template lang="pug">
div.card
    div.top
        div.icon {{ icon }}
        div.number {{ formatNumber(number) }}
        div.unit {{ unit }}
    div.text {{ text }}
</template>

<script>
export default {
    props: {
        number: {
            type: Number,
            default: 0
        },
        icon: {
            type: String,
            default: ''
        },
        text: {
            type: String,
            default: ''
        },
        unit: {
            type: String,
            default: ''
        }
    },
    methods: {
        formatNumber(number) {
            if (number == null) return null;
            if (typeof number == 'string') number = parseFloat(number);
            return number.toLocaleString();
        }
    }
};
</script>

<style scoped>
.card
{
    line-height: 1;
}
.card > div
{
    text-align: center;
}
.top
{
    display: flex;
    align-items: baseline;
    margin: auto;
    width: min-content;
}
.top
{
    white-space: nowrap;
}
.number {
    font-size: 500%;
}
.unit
{
    font-size: 400%;
    opacity: 0.4;
}
.icon {
    font-size: 200%;
    margin: auto;
}
.text {
    font-size: 120%;
    opacity: 0.6;
    line-height: 1.2em;
}
</style>