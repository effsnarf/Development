<template lang="pug">
div("class"="comp-app")
  AppHeader
  div("class"="page")
    div("class"="columns")
      div("class"="column")
        AppSidebar
      div("class"="main")
        AppPageHome
      div("class"="column", "v-text"="' '")
  div
    UiHtmlStyle("v-for"="comp in $root.comps", ":key"="comp.name", ":component"="comp", ":document-head"="true")
</template>

<script>
import AppHeader from "./components/AppHeader.vue";
import AppPageHome from "./components/AppPageHome.vue";
import AppSidebar from "./components/AppSidebar.vue";

export default {
  name: "App",
  components: {
    AppHeader,
    AppPageHome,
    AppSidebar,
  },
};
</script>

<style scoped></style>
