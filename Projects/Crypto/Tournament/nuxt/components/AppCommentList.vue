<template lang="pug">
div("class"="comp-app-comment-list")
  UiProgress("v-if"="is.loading")
  AppComment("v-for"="comment in comments", ":key"="comment.commentID", ":comment"="comment")
  div("v-if"="noComments", "v-text"="'No comments'", "class"="no-comments")
</template>

<script>
export default {
  name: "AppCommentList",
  props: {
    instanceID: {
      default: null,
    },
  },
  data() {
    return {
      comments: null,
      is: { loading: 0, loaded: false },
    };
  },
  mounted: async function () {
    await this.init();
  },
  methods: {
    init: async function () {
      this.is.loading++;
      try {
        const url1 = `https://db.memegenerator.net/MemeGenerator/api/Comments/select/by?entityID=${this.entityID}`;
        this.comments = await (await fetch(url1)).json();
      } finally {
        this.is.loading--;
        this.is.loaded = true;
      }
    },
  },
  computed: {
    entityID: function () {
      if (this.instanceID) return this.instanceID;
      return null;
    },
    noComments: function () {
      return this.is.loaded && !this.comments?.length;
    },
  },
};
</script>

<style scoped>
.no-comments {
  text-align: center;
  opacity: 0.5;
}
</style>
