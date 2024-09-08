<template lang="pug">
div("class"="comp-default")
  h3("v-text"="'Layout'")
  div
    slot
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
