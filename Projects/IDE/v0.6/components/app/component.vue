<template lang="pug">
app-layout-style(v-if="node", :node="node", :selection="selection", @click.stop="onClick")
    app-layout-root(:node="util.getChildFolder(node, 'layout')", :data-items="componentDataItems", :selection="selection")
    
    //div.mt-l2(v-if="Object.entries(variables||{}).length")
        table.w-100pc
            tr(v-for="variable in variables")
                td {{variable.icon}} {{variable.name}}
                td.text-right
                    data-something.w-l10.h-6.bg-gray-40.border.overflow-hidden(:value="state[variable._id]")
</template>

<script>
import Base from './base';
import { msg } from '~/code/util/msg';
import { Utility } from '~/code/util/utility';
import { Events } from '~/code/util/events';

export default {
    extends: Base,
    props: {
    },
    data() {
        return {
            isAppComponent: true,
            events: (new Events()),
            util: Utility,
            usesNodeValue: true,
        };
    },
    methods: {
        async onClick() {
            //console.log(this.nodePath.stringifyIds());
            await this.appApp.appSwitchboard.mvcRuntimeClicked(this._.uid, this.nodePath.map(n => n._id).join('.'), this.dataItems);
        },
    },
    computed: {
        // An app component's node value can be passed on to its children as a data item.
        // This is an easy way to pass data to a component's children.
        componentDataItems: {
            get() {
                if (this.dataItems.length) return this.dataItems;
                if (this.nodeValue) return [this.nodeValue];
                return [];
            },
        },
    },
    watch: {
    },
}
</script>
    