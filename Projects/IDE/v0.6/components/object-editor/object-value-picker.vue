<template lang="pug">
div
  ul.horizontal
    li.box(v-for="option in options", @click="$emit('prop-change', node._id, propPath, option)")
      div
        layout-transition
            app-layout-comp(:key="getNodeOption(node, option)", :node="getNodeOption(node, option)")
</template>

<script>
import { Utility } from '~/code/util/utility';

export default {
    props: {
        node: {
            type: Object,
        },
        propPath: {
            type: String,
        },
        options: {
            type: Array,
            default: () => [],
        },
    },
    methods: {
        getNodeOption(node, option) {
            if (!node) return null;
            node = JSON.parse(JSON.stringify(node));
            Utility.setObjProperty(node, this.propPath, option);
            return node;
        },
    }
}
</script>


<style scoped>
li
{
    margin-bottom: 1em;
    cursor: pointer;
}

li > div
{
    pointer-events: none;
}
</style>
