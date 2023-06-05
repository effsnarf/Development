<template lang="pug">
ul
    li(v-for="option of options" :key="option", :class="getCssClass(option)", @click="onClick(option)")
        span {{ option }}
</template>

<script>
export default {
    props: {
        options: {
            type: Array,
        },
        value: {
        },
    },
    data() {
        return {
        };
    },
    async mounted() {
    },
    methods: {
        getCssClass(option) {
            return {
                selected: option === this.value,
            };
        },
        onClick(option) {
            this.$emit("input", option);
        },
    },
    computed: {
    }
};
</script>

<style scoped>
ul {
    list-style-type: none;
    cursor: pointer;
}
li {
    padding: 0.5em 1em;
    background: #ffffff30;
}
li:hover
{
    background: #ffffff60;
}
.selected {
    border: 2px solid #ffffffa0;
    background-color: #ffffff80;
}
.selected:hover {
    background-color: #ffffff80;
}
</style>