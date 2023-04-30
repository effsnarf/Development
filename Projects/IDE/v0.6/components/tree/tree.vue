<template lang="pug">
div
    tree-node(:ui-state="uiState", :tree="tree", :node="node", :node-component="nodeComponent", :selection="selection" :get-node-key="getNodeKey", @node-click="onNodeClick" @node-mouseenter="onNodeMouseEnter", @node-mouseleave="onNodeMouseLeave", @node-dropzone-drop="onNodeDropzoneDrop")
</template>



<script>
import { msg } from '~/code/util/msg';

export default {
    props: {
        uiState: {
            type: Object,
        },
        tree: {
            type: Object,
        },
        node: {
            type: Object,
        },
        nodeComponent: {
            type: String,
            required: true
        },
        selection: {
            type: Object,
        },
        getNodeKey: {
            type: Function,
            default: (node) => node._id
        }
    },
    data() {
        return {
        };
    },
    methods: {
        onNodeClick(node) {
            if (node?._id == this.selection?.selected?._id) node = null;
            this.$emit(`node-selected`, node);
        },
        onNodeMouseEnter(node) {
            if (!node?._id) return;
            this.$emit(`node-hovered`, node);
        },
        onNodeMouseLeave(node) {
            if (node?._id == this.selection?.hovered?._id) this.$emit(`node-hovered`, null);
        },
        onNodeDropzoneDrop(dragItem, dropItem) {
            this.$emit(`node-drop`, dragItem, dropItem);
        },
    },
    watch: {
        "hovered.node": {
            handler(node) {
                this.$emit(`node-hovered`, node);
            },
        },
    }
}
</script>
