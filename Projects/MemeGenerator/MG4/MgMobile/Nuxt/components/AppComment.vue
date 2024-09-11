<template lang="pug">
div("class"="comp-app-comment comp-ui-list-item comment", "v-text"="comment.text")
</template>

<script>
export default {
  name: "AppComment",
  props: {
    comment: {
      default: null,
    },
  },
};
</script>

<style scoped>
.comment {
  padding: 0.5em;
  border-radius: 0.5em;
  background: #808080a0;
  opacity: 0.6;
  transition: background-color 0.3s;
}
.comment:hover {
  background: #808080e0;
  transition: background-color 0s;
}
</style>
