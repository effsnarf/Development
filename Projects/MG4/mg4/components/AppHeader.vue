<template lang="pug">
div("class"="comp-app-header header")
  AppHeaderLinks
  AppHeaderMenu("@update-query"="onUpdateQuery")
  div("class"="page")
    div("v-if"="showSearchResults", "class"="search-generators")
      div("v-if"="is.loading", "class"="loader")
        v-progress-circular(":indeterminate"="true")
      AppGallery(":template"="'app.generator.small'", ":items"="searchGenerators1", ":per-row"="1")
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
      query: { value: null, timeout: { handler: null, delay: 400 } },
      is: { loading: 0 },
      searchGenerators1: null,
    };
  },
  mounted: async function () {
    await this.searchGenerators();
  },
  methods: {
    onUpdateQuery: function (query) {
      clearTimeout(this.query.timeout.handler);
      this.query.timeout.handler = setTimeout(() => {
        this.updateQueryValue(query);
      }, this.query.timeout.delay);
    },
    updateQueryValue: function (query) {
      this.query.value = query;
      this.searchGenerators(query);
    },
    searchGenerators: async function (query) {
      this.searchGenerators1 = null;
      if (!query) return;
      this.is.loading++;
      try {
        const url = `https://api.memegenerator.net//Generators_Search?q=${query}&pageIndex=0&pageSize=12&apiKey=demo`;
        this.searchGenerators1 = (await (await fetch(url)).json()).result.slice(
          0,
          8,
        );
      } finally {
        this.is.loading--;
      }
    },
  },
  computed: {
    showSearchResults: function () {
      if (this.is.loading) return true;
      if (this.searchGenerators1?.length) return true;
      return false;
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
  border-radius: 0.5em;
  background: #ddd;
  box-shadow: -16px 16px 32px black;
  z-index: 1;
}
.loader {
  display: flex;
  justify-content: center;
  margin-top: 1em;
}
</style>
