<template lang="pug">
div.flex
    div {{ number }}
    div.letter {{ unit }}
</template>

<script>
import "../../../../../../Shared/Extensions";

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
    },
    computed: {
        humanized() {
            return this.value?.humanize();
        },
        number() {
            // Extract the number (and places) from the humanized string
            return this.humanized?.match(/(\d+)(\.\d+)?/)?.first();
        },
        unit() {
            // Extract the unit from the humanized string
            return this.humanized?.match(/[a-zA-Z]+/)?.first();
        }
    }
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