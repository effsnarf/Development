<template lang="pug">
a("v-text"="text1", "class"="comp-app-link")
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
  },
};
</script>

<style scoped></style>
