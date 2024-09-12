<template lang="pug">
div("v-if"="generator", "class"="comp-app-instance-create")
  div("class"="comp-ui-list-item")
    AppInstanceLarge(":instance"="instance", ":show-buttons"="false", ":key"="key1")
  input("class"="comp-ui-list-item", "type"="text", "v-model"="text0")
  input("class"="comp-ui-list-item", "type"="text", "v-model"="text1")
</template>

<script>
export default {
  name: "AppInstanceCreate",
  props: {
    generator: {
      default: null,
    },
  },
  data() {
    return {
      text0: null,
      text1: null,
      key1: null,
    };
  },
  methods: {
    refresh: function () {
      this.key1++;
    },
  },
  computed: {
    instance: function () {
      return {
        genImageUrl: this.generator.imageUrl,
        text0: this.text0,
        text1: this.text1,
      };
    },
  },
  watch: {
    text0: function () {
      this.refresh();
    },
    text1: function () {
      this.refresh();
    },
  },
};
</script>

<style scoped>
input[type="text"] {
  text-align: center;
  text-transform: uppercase;
}
</style>
