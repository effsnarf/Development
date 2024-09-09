<template lang="pug">
a(":href"="'/generator' + generator1?.urlName", "class"="comp-app-generator-mobile-small1")
  AppGeneratorData("ref"="data1", ":generator"="generator")
  div("class"="flex1")
    div("class"="image")
      img(":src"="generatorImageUrl")
    div
      div("v-text"="generator1?.displayName", "class"="name")
      div("v-text"="'3k posts'", "class"="dimmed")
</template>

<script>
export default {
  name: "AppGeneratorMobileSmall1",
  props: {
    generator: {
      default: null,
    },
  },
  data() {
    return {
      generator1: null,
      generatorImageUrl: null,
    };
  },
};
</script>

<style scoped>
.flex1 {
  display: flex;
}
.image {
  width: 20%;
  margin-right: 5%;
}
</style>
