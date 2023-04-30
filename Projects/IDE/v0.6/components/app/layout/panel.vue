<template lang="pug">
app-layout-style(v-if="node", :node="node", :selection="selection")
  app-layout-children(:node="node", :data-items="dataItems", :selection="selection")
</template>

<script>
import Base from '../base';

export default {
  extends: Base,
    props: {
    },
    data() {
        return {
        };
    },
    methods: {
    }
}
</script>


<style scoped>
</style>
