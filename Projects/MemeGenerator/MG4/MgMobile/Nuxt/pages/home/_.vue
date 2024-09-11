<template lang="pug">
div("class"="comp-home")
  div("class"="page-header")
    h1("v-text"="'Meme Generator'")
  div("class"="page-content")
    UiList
      AppGeneratorSmall(":show-buttons"="false")
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      instances1: null,
      generators1: null,
    };
  },
  mounted: async function () {
    await this.init();
  },
  methods: {
    init: async function () {},
  },
};
</script>

<style scoped></style>
