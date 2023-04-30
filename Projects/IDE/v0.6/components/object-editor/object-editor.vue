<template lang="pug">
div(v-if="node")
  table
    tr(v-for="entry in [...Object.entries(pathObj).filter(showEntry)].sort()" :key="entry[0]")
      th(v-text="entry[0]")
      td
        div(v-if="isObject(entry[1])")
          object-editor(:node="node", :path="[...path, entry[0]]", @prop-change="onPropChange")
        div(v-else)
          object-value-editor(:path="[...path, entry[0]]", :value="entry[1]", @value-input="onPropChange(node?._id, [...path, entry[0]].join('.'), $event)")
</template>

<script>
import { msg } from '~/code/util/msg';
import { Utility } from '~/code/util/utility';

export default {
    props: {
        path: {
            type: Array,
            default: () => [],
        },
        node: {
            type: Object,
        },
    },
    data() {
        return {
            pathObj: null,
        }
    },
    methods: {
        showEntry(entry) {
            //if (entry[0].startsWith('_')) return false;
            if (entry[0] == 'children') return false;
            return true;
        },
        onPropChange(nodeID, name, value) {
            this.$emit(`prop-change`, nodeID, name, value);
        },
        isObject(value) {
            return typeof value == 'object' && value != null;
        },
        setPathObj() {
            if (!this.node) return;
            if (!this.path?.length) {
                this.pathObj = this.node;
                return;
            }
            this.pathObj = Utility.getObjProperty(this.node, this.path.join('.'));
        }
    },
    watch: {
        node: {
            handler(node) {
                this.setPathObj();
            },
            immediate: true,
        },
        path: {
            handler(path) {
                this.setPathObj();
            },
            immediate: true,
        }
    }
}
</script>

<style scoped>
tr:hover
{
    background-color: #ffffff30;
}
td
{
    padding: 0.5em;
}
</style>
