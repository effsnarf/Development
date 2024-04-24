<template lang="pug">
div("class"="comp-default")
  Nuxt
  div
    UiHtmlStyle("v-for"="comp in $root.comps", ":key"="comp.name", ":component"="comp", ":document-head"="true")
</template>

<script>
export default {
  name: "Default",
};
</script>

<style scoped>
.footer-spacer {
  height: 10vh;
}
</style>
