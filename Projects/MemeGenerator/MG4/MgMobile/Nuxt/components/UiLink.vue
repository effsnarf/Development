<template lang="pug">
UiNuxtLink("ref"="nuxtLink1", "v-if"="url1", ":url"="url1", "class"="comp-ui-link")
  slot
</template>

<script>
export default {
  name: "UiLink",
  props: {
    generator: {
      default: null,
    },
    url: {
      default: null,
    },
  },
  computed: {
    url1: function () {
      if (this.generator) return `/generator${this.generator.urlName}`;
      return null;
    },
  },
};
</script>

<style scoped>
.link1 {
  cursor: pointer;
}
</style>
