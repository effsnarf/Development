<template lang="pug">
div("class"="comp-app-comment comment")
  div("v-text"="comment.text", "class"="text")
  div("class"="row1")
    div
    div("v-text"="toFriendlyTime(comment.created)", "class"="time")
</template>

<script>
export default {
  name: "AppComment",
  props: {
    comment: {
      default: null,
    },
  },
  methods: {
    toFriendlyTime: function (time) {
      return new Date(time).toLocaleString();
    },
  },
};
</script>

<style scoped>
.comment {
  padding: 1em;
  margin: 1em;
  border-radius: 0.5em;
  background: #80808030;
  box-shadow: -1px 1px 1px #888;
}
.row1 {
  display: flex;
  justify-content: space-between;
  gap: 1em;
  opacity: 0.5;
}
</style>
