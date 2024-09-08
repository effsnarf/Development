<template lang="pug">
a("class"="comp-app-link hover-underline", "v-text"="text1", ":href"="url1")
</template>

<script>
export default {
  name: "AppLink",
  props: {
    generator: {
      default: null,
    },
    text: {
      default: null,
    },
  },
  computed: {
    text1: function () {
      if (this.generator) return this.generator.displayName;
      return this.text;
    },
    url1: function () {
      if (this.generator) return `/${this.generator.urlName}`;
      return null;
    },
  },
};
</script>

<style scoped></style>
