<template lang="pug">
div
</template>

<script>
import { Utility } from '~/code/util/utility';
import { Logger } from '~/code/util/logger';
import { msg } from '~/code/util/msg';
import { DataBinder } from '~/code/util/data-binder';
import { RuntimeMvcComp, AppSwitchboard } from '~/code/app/app-switchboard';

export default {
    props: {
        node: {
            type: Object,
        },
        dataItems: {
            type: Object,
            default: () => {
                return [];
            }
        },
        selection: {
            type: Object,
            default: () => {
                return {
                    hovered: { _id: null },
                    selected: { _id: null }
                }
            }
        },
    },
    data() {
        return {
            util: Utility,
            nodeValue: null,
            switchboard: null
        };
    },
    methods: {
        // The switchboard updates the node value
        setNodeValue(value) {
            if (!this.usesNodeValue) return;
            Logger.log(`</>✏️`, `base`, `setNodeValue`, null, { uid: this._.uid, node: this.node, value });
            this.nodeValue = value;
        },
        isReceivesNodeValuesFromSwitchboard() {
            if ([`folder`,
                `layout.panel`,
                `component`
                ].includes(this.node.type)) return false;

            let vueCompType = this.$options.__file.split('/').last().split('.').first();

            if ([`application`,
                `root`,
                `style`,
                `comp`,
                `instance`,
                `panel`,
                `children`
            ].includes(vueCompType)) return false;

            return true;
        },
    },
    computed: {
        appComp: {
            get() {
                let appComp = this.util.app.getAppComponent(this);
                return appComp;
            },
        },
        appApp: {
            get() {
                let appApp = this.util.app.getAppApp(this);
                return appApp;
            },
        },
        nodePath: {
            get() {
                let file = this.$options.__file.split('/').last();
                // Search parent vue components and collect their node properties
                let nodePath = [];
                let vue = this;
                while (vue)
                {
                    if (vue.node) {
                        // Exclude irrelevant nodes
                        if ((vue.node?.type == `folder`) && (vue.node?.name != `pages`)) {
                            vue = vue.$parent;
                            continue;
                        }
                        if ([`layout.panel`].find(a => (vue.node?.type == a))) {
                            vue = vue.$parent;
                            continue;
                        }
                        // Make sure the node is not already in the path
                        if (!nodePath.find(n => (n._id == vue.node._id)))
                        {
                            nodePath.push(vue.node);
                        }
                    }
                    vue = vue.$parent;
                }
                nodePath.reverse();
                return nodePath;
            },
        },
        computedValue: {
            get() {
                return (this.nodeValue || this.boundValue);
            },
        },
        boundValue: {
            get() {
                return DataBinder.resolve(this.node, this.dataItems, this.defaultValue);
            },
        },
    },
    watch: {
        appApp: {
            handler: async function (newAppApp, oldValue) {
                if (!newAppApp) return;
                this.switchboard = newAppApp.appSwitchboard;
                if (this.node) this.switchboard.register(await RuntimeMvcComp.fromVue(this));
            },
            immediate: true,
        },
        nodeValue: {
            handler: function (newValue, oldValue) {
                if (Utility.isNully(newValue) && Utility.isNully(oldValue)) return;
                // TODO: Slow
                if (Utility.areEqual(newValue, oldValue)) return;
                this.appApp.appSwitchboard.mvcRuntimeChangedNodeValue(this._.uid, this.nodePath.map(n => n._id).join('.'), newValue);
            },
            immediate: true,
            deep: true
        },
    },
    mounted() {
    },
    unmounted() {
        if (!this.switchboard) return;
        this.switchboard.unregister(this._.uid);
    }
}
</script>
