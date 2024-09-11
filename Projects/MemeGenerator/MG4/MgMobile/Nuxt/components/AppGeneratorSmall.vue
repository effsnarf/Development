<template lang="pug">
div("class"="comp-app-generator-small")
  AppGeneratorData("ref"="data1", ":generator"="generator")
  div
    UiLink(":generator"="generator1")
      div("class"="flex1")
        div("class"="image")
          img(":src"="generatorImageUrl")
        div
          div("v-text"="generator1?.displayName", "class"="name")
          div("v-text"="'3k posts'", "class"="dimmed")
    div("class"="bottom-right")
      div("class"="buttons1")
        div("title"="share", "v-text"="'➤'", "class"="button1")
        div("title"="generate", "v-text"="'✏️'", "class"="button1")
</template>

<script>
export default {
  name: "AppGeneratorSmall",
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
