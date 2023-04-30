<template lang="pug">
div(style="border: 12px solid #666; padding: 1em;")
    app-pages(:node="node.children[0]", :selection="selection")
</template>

<script>
import { msg } from '~/code/util/msg';
import Base from './base';
import { AppSwitchboard } from '~~/code/app/app-switchboard';

export default {
    extends: Base,
    props: {
        appSource: {
            type: Object,
            required: true
        },
        appSwitchboard: {
            type: Object,
            required: true
        },
    },
    data() {
        return {
            isAppApp: true,
        };
    },
    methods: {
    },
}
</script>
