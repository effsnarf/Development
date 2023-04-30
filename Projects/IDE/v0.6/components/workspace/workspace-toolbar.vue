
<template lang="pug">
div.box
  h3 🛠 Tools
  div.flex.flex-column(style="gap: 0.3em;")
    ide-tool-new-node(type="folder", :dic="{ name: '[folder]' }")
    ide-tool-new-node(type="component", :dic="{ name: '[component]' }")
    ide-tool-new-node(type="layout.panel", :dic="{ direction: 'horizontal' }")
    ide-tool-new-node(type="layout.list", :dic="{ direction: 'vertical' }")
    ide-tool-new-node(type="content.image", :dic="{ dtb: { expr: null } }")
    ide-tool-new-node(type="content.text", :dic="{ text: null, dtb: { expr: null } }")
    ide-tool-new-node(type="input.text")
    ide-tool-new-node(type="data.variable", :dic="{ name: '[variable]' }")
    ide-tool-new-node(type="code.method", :dic="{ name: '[method name]', args: '', body: '' }")
    ide-tool-new-node(type="link", :dic="{ from: null, to: null }")
</template>

<script>
export default {
  props: {
  },
  data() {
    return {
    }
  },
  methods: {
    getNewNode(type, props = {}) {
      return Object.assign({
        type: `${type}`
      }, props);
    }
  },
  watch: {
  },
}
</script>


<style scoped>
div
{

}
</style>
