<template lang="pug">
div("class"="comp-app-comment-box")
  textarea("v-model"="commentText")
  div("class"="buttons1")
    div(":class"="{ disabled: !commentText }", "v-text"="'✔️'", "class"="button1")
</template>

<script>
export default {
  name: "AppCommentBox",
  data() {
    return {
      commentText: null,
    };
  },
};
</script>

<style scoped>
.comp-app-comment-box {
  margin-top: 1vh;
}
</style>
