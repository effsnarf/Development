<template lang="pug">
div.flex
    div {{ formatNumber(value) }}
    div.letter {{ getLetter(value) }}
</template>

<script>
export default {
    props: {
        value: {
            type: Number,
        },
    },
    data() {
        return {
        }
    },
    methods: {
        formatNumber(number) {
            if (number == null) return null;
            if (typeof number == 'string') number = parseFloat(number);
            
            if (number < 1000) return number;
            if (number < 1000000) return (number / 1000).toFixed(1);
            if (number < 1000000000) return (number / 1000000).toFixed(1);
            return (number / 1000000000).toFixed(1);
        },
        getLetter(number) {
            if (number == null) return null;
            if (typeof number == 'string') number = parseFloat(number);
            
            if (number < 1000) return '';
            if (number < 1000000) return 'k';
            if (number < 1000000000) return 'm';
            return 'b';
        },
    },
}
</script>

<style scoped>
.flex
{
    align-items: baseline;
}
.letter
{
    font-size: 70%;
    opacity: 0.4;
}
</style>