<template lang="pug">
div("class"="comp-index")
  AppGallery("title"="Popular Images", ":template"="'app.instance.medium'", ":items"="instances1")
  AppGallery("title"="Popular Memes", ":template"="'app.generator.medium'", ":items"="generators1")
</template>

<script>
import Generator from "./Generator.vue";

export default {
  name: "Index",
  components: {
    Generator,
  },
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
    init: async function () {
      const url1 = `https://db.memegenerator.net/MemeGenerator/Instances`;
      this.instances1 = (await (await fetch(url1)).json()).slice(0, 9);
      const url2 = `https://db.memegenerator.net/MemeGenerator/Generators`;
      this.generators1 = (await (await fetch(url2)).json()).slice(0, 9);
    },
  },
};
</script>

<style scoped></style>
