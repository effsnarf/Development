<template lang="pug">
div("class"="comp-instance")
  div("class"="page-header")
    AppGeneratorSmall
  div("class"="page-content")
    div("class"="page-sticky1 comp-ui-list-item")
      AppInstanceLarge("class"="scroll-resize-to-50p")
    AppCommentList
</template>

<script>
export default {
  name: "Instance",
  props: {
    instanceID: {
      default: null,
    },
  },
  mounted: async function () {},
  methods: {
    init: async function () {},
  },
};
</script>

<style scoped></style>
