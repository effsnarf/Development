<template lang="pug">
a(":href"="'/' + generator.urlName", "class"="comp-app-generator-medium")
  img(":src"="generatorImageUrl")
  a("class"="title", "v-text"="generator.displayName", ":href"="'/' + generator.urlName")
</template>

<script>
export default {
  name: "AppGeneratorMedium",
  props: {
    generator: {
      default: null,
    },
  },
  computed: {
    generatorImageUrl: function () {
      return `https://img.memegenerator.net/images/${this.generator.imageID}.jpg`;
    },
  },
};
</script>

<style scoped>
a {
  display: flex;
  flex-direction: column;
}
img {
  border-radius: 0.5em 0.5em 0 0;
}
.title {
  width: 100%;
  color: white;
  background-color: black;
  text-align: center;
  border-radius: 0 0 0.5em 0.5em;
  text-decoration: none !important;
}
</style>
