<template lang="pug">
div("class"="comp-app-header header")
  AppHeaderLinks
  AppHeaderMenu
  div("class"="page")
    AppGallery("v-if"="showSearchResults", "class"="search-generators", ":template"="'app.generator.small'", ":items"="searchGenerators1", ":per-row"="1")
  AppHeaderTiers
</template>

<script>
import AppGallery from "./AppGallery.vue";
import AppGeneratorSmall from "./AppGeneratorSmall.vue";
import AppHeaderLinks from "./AppHeaderLinks.vue";
import AppHeaderMenu from "./AppHeaderMenu.vue";
import AppHeaderTiers from "./AppHeaderTiers.vue";

export default {
  name: "AppHeader",
  components: {
    AppGallery,
    AppGeneratorSmall,
    AppHeaderLinks,
    AppHeaderMenu,
    AppHeaderTiers,
  },
  data() {
    return {
      searchGenerators1: null,
      showSearchResults: false,
    };
  },
  mounted: async function () {
    await this.searchGenerators();
  },
  methods: {
    searchGenerators: async function () {
      const url = `https://db.memegenerator.net/MemeGenerator/Generators`;
      this.searchGenerators1 = (await (await fetch(url)).json()).slice(0, 8);
    },
  },
};
</script>

<style scoped>
.header {
  margin-bottom: 1em;
  color: white;
  background: linear-gradient(0deg, #000000a0, #000000);
}
.search-generators {
  position: absolute;
  right: 0;
  width: 25em;
  border: 1px solid black;
  box-shadow: -16px 16px 32px black;
  z-index: 1;
}
</style>
