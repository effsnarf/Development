<template lang="pug">
div("class"="comp-app")
  AppHeader
  div("class"="page")
    div("class"="columns")
      div("class"="column")
        AppSidebar
      div("class"="main")
        AppPageGenerator
      div("class"="column", "v-text"="' '")
  div
    UiHtmlStyle("v-for"="comp in $root.comps", ":key"="comp.name", ":component"="comp", ":document-head"="true")
</template>

<script>
import AppHeader from "./components/AppHeader.vue";
import AppPageGenerator from "./components/AppPageGenerator.vue";
import AppSidebar from "./components/AppSidebar.vue";

export default {
  name: "App",
  components: {
    AppHeader,
    AppPageGenerator,
    AppSidebar,
  },
};
</script>

<style scoped></style>
