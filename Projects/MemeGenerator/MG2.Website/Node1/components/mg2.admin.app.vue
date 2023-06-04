<template lang="pug">
    div.app
        h2 Admin
        div.bars
            div.bar
                admin-chart(icon="🎈", :header="'test'", :total="40", :title="'test'", :data="[1,2,3,4,5,6,7,8]")
</template>

<script>
export default {
    data() {
        return {
        };
    },
    methods: {
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
