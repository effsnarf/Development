<template lang="pug">
div("class"="comp-app-generator-list comp-ui-list")
  div("v-for"="generator in generators", "class"="comp-ui-list-item")
    AppGeneratorSmall(":generator"="generator", ":show-count"="false", ":show-buttons"="false")
</template>

<script>
export default {
  name: "AppGeneratorList",
  props: {
    relatedTo: {
      default: null,
    },
  },
  methods: {
    getGenerators: function () {
      return [
        this.relatedTo,
        this.relatedTo,
        this.relatedTo,
        this.relatedTo,
        this.relatedTo,
        this.relatedTo,
      ];
    },
  },
  computed: {
    generators: function () {
      return this.getGenerators();
    },
  },
};
</script>

<style scoped></style>
