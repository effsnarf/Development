<template lang="pug">
app-layout-style(:node="node", :selection="selection")
  div
    div.opacity-50(v-if="!computedValue") {{ _defaultValue }}
    div(v-text="computedValue")
    div {{ nodePath.stringifyIds() }}
</template>
  
  <script>
  import Base from '../base';
  
  export default {
    extends: Base,
    props: {
    },
    data: {
      _defaultValue: `🆎 [text]`,
      usesNodeValue: true,
    },
    watch: {
      node: {
        handler(node) {
          this.defaultValue = (node ? node.text : _defaultValue);
        },
        immediate: true,
      }
    },
    mounted() {
    },
  }
  </script>
  
  
  <style scoped>
  div
  {
      max-width: 8em;
      max-height: 1.6em;
      /* overflow ellipsis */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
  }
  </style>
  