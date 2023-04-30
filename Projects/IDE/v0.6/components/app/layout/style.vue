<template lang="pug">
div(v-if="node", :class="util.getCssClass(node, selection)", :style="util.getStyle(node)" :data-node-id="node._id")
  slot
</template>

<script>
import Base from '../base';

export default {
    extends: Base,
    data() {
        return {
        };
    },
}
</script>


<style scoped>
.layout {
    display: flex;
    min-width: 2em;
    min-height: 2em;
    border: 2px solid #ffffff30;
    transition: 0.2s;
}

.layout.horizontal {
    flex-direction: row;
}

.layout.vertical {
    flex-direction: column;
}

</style>
