<template lang="pug">
div("class"="comp-app-progress loader")
  v-progress-circular(":indeterminate"="true")
</template>

<script>
export default {
  name: "AppProgress",
};
</script>

<style scoped>
.loader {
  display: flex;
  justify-content: center;
  margin-top: 1em;
}
</style>
