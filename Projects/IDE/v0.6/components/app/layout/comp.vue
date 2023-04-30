<template lang="pug">
div
    component(v-if="node", :is="util.getNodeCompName(node.type)", :node="node", :data-items="dataItems", :selection="selection")
</template>
    
<script>
    import Base from '../base';
    
    export default {
    extends: Base,
        props: {
        },
        data() {
            return {
            };
        },
        methods: {
        }
    }
</script>
