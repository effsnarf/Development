<template lang="pug">
a(":href"="'/' + generator.urlName", "class"="comp-app-generator-small")
  div("class"="flex")
    div("class"="image")
      img(":src"="generatorImageUrl")
    div("v-text"="generator.displayName", "class"="name")
</template>

<script>
export default {
  name: "AppGeneratorSmall",
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
  padding: 0.7em 1em;
  border-radius: 0.5em;
  text-decoration: none;
}
a:hover {
  background-color: #00000010;
}
.flex {
  gap: 1em;
}
.image {
  width: 20%;
}
</style>
