<template lang="pug">
div("class"="comp-home")
  div("class"="page-header")
    h1("v-text"="'Meme Generator'")
  div("class"="page-content")
    UiList(":items"="generators")
      AppGeneratorSmall(":show-buttons"="false")
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      instances: null,
      generators: null,
    };
  },
  mounted: async function () {
    await this.init();
  },
  methods: {
    init: async function () {
      this.generators = await this.getGenerators();
    },
    getGenerators: async function () {
      return Array(10).fill(null);
    },
  },
};
</script>

<style scoped></style>
