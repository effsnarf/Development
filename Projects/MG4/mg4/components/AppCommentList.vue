<template lang="pug">
div("class"="comp-app-comment-list")
  AppProgress("v-if"="is.loading")
  AppComment("v-for"="comment in comments", ":key"="comment.commentID", ":comment"="comment")
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
      is: { loading: false },
    };
  },
  mounted: async function () {
    await this.init();
  },
  methods: {
    init: async function () {
      this.is.loading = true;
      try {
        const url1 = `https://db.memegenerator.net/MemeGenerator/api/Comments/select/by?entityID=${this.entityID}`;
        this.comments = await (await fetch(url1)).json();
      } finally {
        this.is.loading = false;
      }
    },
  },
  computed: {
    entityID: function () {
      if (this.instanceID) return this.instanceID;
      return null;
    },
  },
};
</script>

<style scoped></style>
