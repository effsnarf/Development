<template lang="pug">
div("class"="comp-app-generator-small")
  AppGeneratorData("ref"="data1", ":generator"="generator")
  div("v-if"="generator1")
    UiLink(":generator"="generator1")
      div("class"="flex1")
        div("class"="image")
          img(":src"="generator1.imageUrl")
        div("v-if"="showName")
          div("v-text"="generator1.displayName", "class"="name")
          div("v-if"="showPostCount", "v-text"="'3k posts'", "class"="dimmed")
    div("v-if"="showButtons", "class"="bottom-right")
      div("class"="buttons1")
        div("title"="share", "v-text"="'➤'", "class"="button1")
        UiLink(":url"="'/create/instance/' + generator1.urlName")
          div("title"="generate", "v-text"="'✏️'", "class"="button1")
</template>

<script>
export default {
  name: "AppGeneratorSmall",
  props: {
    generator: {
      default: null,
    },
    showButtons: {
      default: true,
    },
    showName: {
      default: true,
    },
    showPostCount: {
      default: true,
    },
  },
  data() {
    return {
      generator1: null,
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
