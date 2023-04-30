<template lang="pug">
ul
    li(v-for="node of nodes")
        tree-node-a(:node="node", :selection="selection")
</template>

<script>
import { msg } from '~/code/util/msg';
import { Utility } from '~/code/util/utility';

export default {
    props: {
        nodes: {
            type: Array,
            required: true
        },
        selection: {
            type: Object
        }
    },
    data() {
        return {
        };
    },
    methods: {
    },
}
</script>