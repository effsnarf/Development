<template lang="pug">
div(v-if="node", :key="key1")
    div.flex.line
        transition(name="fade")
            div.w-4
                input-toggle(v-if="node.children?.length", :key="uiState?.expanded[node._id]", :value="uiState?.expanded[node._id]", @input="onExpandedToggle(node, $event)", :icons='["➕", "➖"]')
        div
            div.tree-node-item(:class="getCssClass(node)", @click="onClick(node)" @mouseenter="onMouseEnter(node)", @mouseleave="onMouseLeave(node)")
                dnd-dropzone(:drop-item="node", @dropzone-dragenter="onMouseEnter(node)", @dropzone-dragleave="onMouseLeave(node)", @dropzone-drop="onDropzoneDrop")
                    dnd-draggable(:drag-item="node")
                        component(:is="nodeComponent", :tree="tree", :node="node")
    transition-group.ml-l1(name="fade-down", tag="ul")
        li(v-if="(!node.type) || (uiState?.expanded[node._id])", v-for="child in node.children", :key="getNodeKey(child)")
            tree-node(:ui-state="uiState", :tree="tree", :node="child", :node-component="nodeComponent", :get-node-key="getNodeKey", :selection="selection" v-bind="$attrs")
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
        getNodeKey: {
            type: Function,
            default: (node) => node._id
        },
        selection: {
            type: Object,
        },
    },
    data() {
        return {
            key1: 1,
            isExpanded: true,
        };
    },
    watch: {
        uiState: {
            handler(newUiState) {
                if (!newUiState) return;
                newUiState.expanded = (newUiState.expanded || {});
            },
            immediate: true,
        },
    },
    methods: {
        getCssClass(node) {
            let cls = {};

            cls.hovered = (node?._id) && (node?._id === this.selection?.hovered?._id);
            cls.selected = (node?._id) && (node?._id === this.selection?.selected?._id);

            return cls;
        },
        onClick(node) {
            this.$emit(`node-click`, node);
        },
        onExpandedToggle(node, value) {
            this.uiState.expanded[node._id] = value;
            this.refresh();
        },
        onMouseEnter(node) {
            this.$emit(`node-mouseenter`, node);
        },
        onMouseLeave(node) {
            this.$emit(`node-mouseleave`, node);
        },
        onDropzoneDrop(dragItem, dropItem) {
            // Expand the dropped node
            this.onExpandedToggle(this.node, true);
            this.onMouseLeave(this.node);
            this.$emit(`node-dropzone-drop`, dragItem, dropItem);
        },
        refresh()
        {
            this.key1++;
        }
    }
}
</script>


<style scoped>
.line > div:nth-child(2)
{
    flex-grow: 1;
}
</style>
