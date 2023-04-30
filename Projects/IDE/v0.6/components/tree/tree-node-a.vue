<template lang="pug">
div.line(v-if="node")
    div.opacity-50(v-if="!node._id") empty
    div(v-else-if="node._id")
        span(v-text="util.getNodeIcon(node.type)")
        span.mx-1.opacity-30 {{ node._id }}
        span {{`${util.getNodeDesc(tree, node)}`}}
        span.opacity-50(v-if="(node.type=='folder') && (node.children?.length)") ({{ node.children?.length }})
</template>

<script>
import { Utility } from '~/code/util/utility';

export default {
    props: {
        tree: {
            type: Object,
        },
        node: {
            type: Object,
        },
    },
    data() {
        return {
            util: Utility,
        };
    },
}
</script>

<style scoped>
.line
{
    max-width: 14em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
