<template lang="pug">
div("class"="comp-app-page-generator")
  AppBox
    template("v-slot:content")
      img("class"="generator-image", ":src"="getImageUrl(generator?.imageID)")
      h1("v-text"="generator?.displayName")
      div("class"="poem")
        div("v-for"="stanza in poem", "v-text"="stanza", "class"="stanza")
      div("v-if"="false", "v-text"="generator?.desc?.article", "class"="article")
  AppGallery(":template"="'app.instance.medium'", ":items"="instances1")
</template>

<script>
import AppBox from "./AppBox.vue";
import AppGallery from "./AppGallery.vue";
import AppInstanceMedium from "./AppInstanceMedium.vue";

export default {
  name: "AppPageGenerator",
  components: {
    AppBox,
    AppGallery,
    AppInstanceMedium,
  },
  data() {
    return {
      urlName: "Socially-Awkward-Penguin",
      generator: null,
      instances1: null,
    };
  },
  mounted: async function () {
    await this.init();
  },
  methods: {
    init: async function () {
      const urlName = this.urlName;
      const url1 = `https://db.memegenerator.net/MemeGenerator/api/Generators/select/one?urlName="${urlName}"`;
      this.generator = await (await fetch(url1)).json();
      const url2 = `https://db.memegenerator.net/MemeGenerator/api/Instances/select/popular?languageCode=%22en%22&pageIndex=0&urlName=%22${urlName}%22`;
      this.instances1 = (await (await fetch(url2)).json()).slice(0, 9);
    },
    getPoem: function () {
      const poems = this.generator?.desc?.poem;
      if (!poems) return [];
      const index = Math.floor(Math.random() * poems.length);
      return poems[index];
    },
    getImageUrl: function (imageID) {
      if (!imageID) return null;
      return `https://img.memegenerator.net/images/${imageID}.jpg`;
    },
  },
  computed: {
    poem: function () {
      return this.getPoem();
    },
  },
};
</script>

<style scoped>
.flex1 {
  display: flex;
  flex-direction: row;
  gap: 1em;
}
.generator-image {
  width: 20%;
  margin: 0.5em 1em 0.5em 0;
  float: left;
  border-radius: 0.5em;
  box-shadow: -3px 3px 10px black;
}
.article {
  height: 4.5em;
  overflow: hidden;
}
.poem {
  display: flex;
  flex-direction: column;
  margin: auto;
  width: fit-content;
  padding: 1em;
  font-size: 130%;
  color: white;
  background: #00000060;
  border-radius: 0.5em;
  box-shadow: inset -3px 3px 10px black;
  text-shadow: -2px 2px 1px black;
}
h1 {
  font-size: 3em;
}
</style>
