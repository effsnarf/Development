<template lang="pug">
div("class"="comp-app-voter horizontal voter")
  div("class"="score", "v-text"="score")
</template>

<script>
export default {
  name: "AppVoter",
  props: {
    instance: {
      default: null,
    },
  },
  computed: {
    score: function () {
      return this.instance?.totalVotesScore;
    },
  },
};
</script>

<style scoped></style>
