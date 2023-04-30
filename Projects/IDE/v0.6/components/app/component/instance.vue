<template lang="pug">
app-layout-style(v-if="node", :node="node", :selection="selection")
    app-component(:node="compNode", :data-items="dataItems", :selection="selection")
</template>

<script>
import { msg } from '~/code/util/msg';
import { Utility } from '~/code/util/utility';
import Base from '../base';

export default {
    extends: Base,
    props: {
    },
    data() {
        return {
            compVars: {},
        };
    },
    mounted() {
        this.init();
    },
    computed: {
        compNode() {
            if (!this.appApp?.node) return null;
            if (!this.node) return null;
            if (this.node.type == `component.instance`)
            {
                let compsNode = Utility.getChildFolder(this.appApp.node, 'components');
                let compNode = compsNode.children.find(c => (c._id == this.node.comp._id));
                return compNode;
            }
            return this.node;
        },
    },
    methods: {
        init() {
        },
    },
}
</script>
