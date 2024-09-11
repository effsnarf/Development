<template lang="pug">
div("class"="comp-app-comment-list comments")
  AppComment("v-for"="comment in comments1", ":comment"="comment")
  AppCommentBox
</template>

<script>
export default {
  name: "AppCommentList",
  props: {
    instance: {
      default: null,
    },
    comments: {
      default: null,
    },
  },
  methods: {
    getMockupComments: function () {
      const commentCount = 20;
      const comment1 = {
        _id: 1,
        text: "first post best post",
      };
      const comments = [];
      for (let i = 0; i < commentCount; i++) {
        const comment = JSON.parse(JSON.stringify(comment1));
        comment._id = i + 1;
        comments.push(comment);
      }
      return comments;
    },
  },
  computed: {
    comments1: function () {
      return this.getMockupComments();
    },
  },
};
</script>

<style scoped>
.comments {
  display: flex;
  flex-direction: column;
  gap: 0.3vh;
}
</style>
