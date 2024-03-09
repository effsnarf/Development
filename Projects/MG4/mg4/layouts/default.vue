<template lang="pug">
div("class"="comp-default")
  AppHeader
  div("class"="page")
    div("class"="columns")
      div("class"="column")
        AppSidebar
      div("class"="main")
        Nuxt
      div("class"="column", "v-text"="' '")
  div
    UiHtmlStyle("v-for"="comp in $root.comps", ":key"="comp.name", ":component"="comp", ":document-head"="true")
</template>

<script>
export default {
  name: "Default",
};
</script>

<style scoped></style>
