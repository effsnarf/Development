<template lang="pug">
span.toggle-button.cursor-pointer(@mousedown="onClick") {{icons[Number(value||0)]}}
</template>

<script>
export default {
    props: {
        value: {
            type: Boolean,
        },
        icons: {
            type: Array,
            default: () => [`⬛`, `✔️`]
        },
    },
    methods: {
        onClick() {
            this.$emit(`input`, !this.value);
        }
    }
}
</script>

<style scoped>
.toggle-button
{
    opacity: 0.5;
}

.toggle-button:hover
{
    opacity: 1;
}
</style>