<template lang="pug">
div("class"="comp-generator")
  div("class"="page-header")
    AppGeneratorSmall
  div("class"="page-content-container")
    div("class"="page-content")
      UiList("class"="instance-list", ":items"="instances")
        AppInstanceLarge
</template>

<script>
export default {
  name: "Generator",
  props: {
    urlName: {
      default: null,
    },
    pageIndex: {
      default: null,
    },
  },
  mounted: async function () {},
  methods: {
    init: async function () {},
    getMockupInstances: function () {
      return Array(10).fill(null);
    },
  },
  computed: {
    instances: function () {
      return this.getMockupInstances();
    },
  },
};
</script>

<style scoped>
.instance-list {
  gap: 4vh;
}
</style>
