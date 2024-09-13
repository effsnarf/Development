<template lang="pug">
div("class"="comp-app-generator-data")
</template>

<script>
export default {
  name: "AppGeneratorData",
  props: {
    generator: {
      default: null,
    },
  },
  mounted: function () {
    this.init();
  },
  methods: {
    init: async function (derived) {
      if (!derived) derived = this.$parent;
      derived.generator1 = this.generator1;
    },
  },
  computed: {
    generator1: function () {
      if (this.generator) return this.generator;
      return {
        urlName: "Courage-Wolf",
        displayName: "Courage Wolf",
        imageUrl: "https://i.imgur.com/QwWQw2v.jpeg",
      };
    },
  },
  watch: {
    generator1: function () {
      this.init();
    },
  },
};
</script>

<style scoped></style>
