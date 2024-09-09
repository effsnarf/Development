<template lang="pug">
a(":href"="'/' + generator1?.urlName", "class"="comp-app-generator-medium")
  AppGeneratorData("ref"="data1", ":generator"="generator")
  img(":src"="generatorImageUrl")
  a("class"="title", "v-text"="generator1?.displayName", ":href"="'/' + generator1?.urlName")
</template>

<script>
export default {
  name: "AppGeneratorMedium",
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
  mounted: function () {},
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
