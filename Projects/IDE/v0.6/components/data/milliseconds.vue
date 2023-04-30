<template lang="pug">
span
    data-number.value(:value="value", :format-value="value => Math.round(value).toLocaleString()", :duration="10")
    sub ms
</template>

<script>
export default {
    props: {
        value: {
            type: [Number],
            default: 0,
            required: true,
        },
    }
}
</script>

<style scoped>
.value
{
    font-weight: bold;
    color: lightgreen;
}
</style>
