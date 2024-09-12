<template lang="pug">
div("class"="comp-create-instance")
  AppData(":urlName"="urlName", "v-model:pageData"="pd")
  div("class"="page-header")
    AppGeneratorSmall
  div("class"="page-content-container")
    div("class"="page-content")
      AppInstanceCreate(":generator"="pd?.generator")
</template>

<script>
export default {
  name: "CreateInstance",
  props: {
    urlName: {
      default: null,
    },
  },
  data() {
    return {
      pd: null,
    };
  },
  mounted: async function () {},
  methods: {
    init: async function () {},
  },
};
</script>

<style scoped></style>
