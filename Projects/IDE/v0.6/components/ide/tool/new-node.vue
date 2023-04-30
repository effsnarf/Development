<template lang="pug">
dnd-draggable.tool(:drag-item="util.getNewNode(type, dic)")
    div {{util.getNodeIcon(type)}} {{type.split('.').pop()}}
</template>

<script>
import { Utility } from '~/code/util/utility';

export default {
    props: {
        type: {
            type: String,
            required: true
        },
        dic: {
            type: Object,
            default: () => {
                return {};
            }
        },
    },
    data() {
        return {
            util: Utility,
        }
    },
    methods: {
    },
    watch: {
    },
}
</script>

<style scoped>
.tool
{
  display: flex;
  align-items: center;
  padding: 0.2em;
  white-space: nowrap;
  border: 1px solid gray;
}
</style>
