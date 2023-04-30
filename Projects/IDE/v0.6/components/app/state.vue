<template lang="pug">
div.box(v-if="app", :key="app.state.key")
    h3 App State

    table
        tr(v-for="[nodePath, value] in app.state.values")
            td
                tree-node-a(:value="getNodeFromPath(nodePath)" :selection="selection")
            td
                data-something.value(:value="value")
</template>

<script>
import { msg } from '~/code/util/msg';
import Base from './base';
import { Utility } from '~/code/util/utility';
import { AppApplication } from '~/code/app/app-application';

export default {
    extends: Base,
    props: {
        app: {
            type: AppApplication,
            required: true
        },
        selection: {
            type: Object
        }
    },
    data() {
        return {
            util: Utility,
        };
    },
    methods: {
        getNodeFromPath(nodePath) {
            const nodeID = parseInt(nodePath.split('.').reverse()[0]);
            return this.app.source.tree.getNode(nodeID);
        }
    }
}
</script>

<style>
.value
{
    max-height: 1.5em;
    overflow: hidden;
}
</style>