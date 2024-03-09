<template lang="pug">
div("class"="comp-app-sidebar")
  AppBox("v-if"="false", "title"="Meet the Meme")
  AppBox(":padding"="'0'", "title"="More Characters")
    template("v-slot:content")
      AppGallery(":template"="'app.generator.small'", ":items"="moreGenerators", ":per-row"="1", ":gap"="'0'")
</template>

<script>
import AppBox from "./AppBox.vue";
import AppGallery from "./AppGallery.vue";
import AppGeneratorSmall from "./AppGeneratorSmall.vue";

export default {
  name: "AppSidebar",
  components: {
    AppBox,
    AppGallery,
    AppGeneratorSmall,
  },
  data() {
    return {
      moreGenerators: null,
    };
  },
  mounted: async function () {
    await this.init();
  },
  methods: {
    init: async function () {
      const url = `https://db.memegenerator.net/MemeGenerator/Generators`;
      this.moreGenerators = (await (await fetch(url)).json()).slice(0, 8);
    },
  },
};
</script>

<style scoped></style>
