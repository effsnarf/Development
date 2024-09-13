<template lang="pug">
div("class"="comp-app-header")
  UiLink(":url"="'/'")
    div("v-text"="'Meme Generator'", "class"="title")
</template>

<script>
export default {
  name: "AppHeader",
};
</script>

<style scoped>
.comp-app-header {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0);
}
.title {
  font-family: impact;
  font-size: 3vh;
  text-transform: uppercase;
  opacity: 1;
  text-shadow: 0vh -0.1vh 2px white;
  color: black;
}
</style>
