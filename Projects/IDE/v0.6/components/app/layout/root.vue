<template lang="pug">
app-layout-style(v-if="node", :node="node")
  app-layout-children(:node="node", :data-items="dataItems" :selection="selection")
</template>
  
<script>
  import Base from '../base';
  import { Events } from '~/code/util/events';
  
  export default {
    extends: Base,
      props: {
      },
      data() {
          return {
          };
      },
      async mounted() {
      },
      methods: {
      }
  }
</script>
