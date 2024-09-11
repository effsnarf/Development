<template lang="pug">
div("class"="comp-generator")
  div("class"="page-header")
    AppGeneratorSmall
  UiList("class"="instance-list")
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
  },
};
</script>

<style scoped>
.instance-list {
  margin: 3vh 0;
  gap: 4vh;
}
</style>
