<template lang="pug">
app-layout-style(v-if="node", :node="node", :selection="selection")
    // If no items
    div.opacity-50(v-if="(!computedValue?.length)")
        span ⚪ No items
    // If no item template is defined for the list, show some blank items
    div(v-if="(!node.children?.length)", v-for="item in computedValue")
        div.empty-item {{ item }}
    app-layout-children(v-if="node.children?.length", v-for="item in computedValue", :key="getItemKey(item)" :node="node", :data-items="[item, ...dataItems]", :selection="selection")
</template>
  
<script>
import Base from '../base';

export default {
  extends: Base,
    props: {
        items: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            defaultValue: [],
            usesNodeValue: true,
        };
    },
    mounted() {
    },
    computed: {
        itemTemplateNodes() {
            return this.node?.children;
        },
    },
    methods: {
        getItemKey(item) {
            // TODO: This is a hack. We need to find a better way to identify list items
            if (item.instanceID) return item.instanceID;
            if (item.generatorID) return item.generatorID;
            msg.warning(`List item key not found`);
            return null;
        },
    },
    watch: {
    }
}
</script>
  

<style scoped>
.layout.list
{
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;
}

.layout.list.horizontal {
    flex-direction: row;
}

.layout.list.vertical {
    flex-direction: column;
}
.layout.list > div
{
    flex-grow: 1;
    border: 1px solid white;
}
.layout.list .list-item
{
    min-width: 10em;
    min-height: 3em;
}
.empty-item
{
    max-width: 15em;
    height: 1.4rem;
    overflow: hidden;
    opacity: 0.5;
}
</style>
