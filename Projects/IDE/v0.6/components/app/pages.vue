<template lang="pug">
div.flex.flex-row(style="gap: 1em;")
    div(v-for="page of node.children")
        app-layout-comp(:node="page", :selection="selection")
</template>

<script>
import Base from './base';

export default {
    extends: Base,
    props: {
        selection: {
            type: Object
        }
    },
    data() {
        return {
        };
    },
    methods: {
    },
}
</script>
