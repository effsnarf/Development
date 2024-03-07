<template lang="pug">
div("class"="comp-app-header-header header")
  AppHeaderLinks
  div("class"="page")
    AppLogo
</template>

<script>
import AppLogo from "./AppLogo.vue";

export default {
  name: "AppHeaderHeader",
  components: {
    AppLogo,
  },
};
</script>

<style>
.header {
  color: white;
  background-color: #000;
}
</style>
