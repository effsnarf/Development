<template lang="pug">
div("class"="comp-app-comment-comments")
  AppComment("v-for"="comment in comments", ":key"="comment.commentID", ":comment"="comment")
</template>

<script>
export default {
  name: "AppCommentComments",
  props: {
    instance: {
      default: null,
    },
  },
  data() {
    return {
      comments: null,
    };
  },
  mounted: async function () {
    await this.init();
  },
  methods: {
    init: async function () {
      const url1 = `https://db.memegenerator.net/MemeGenerator/api/Comments/select/by?entityID=${this.entityID}`;
      this.comments = await (await fetch(url1)).json();
    },
  },
  computed: {
    entityID: function () {
      if (this.instance) return this.instance.instanceID;
      return null;
    },
  },
};
</script>

<style scoped></style>
