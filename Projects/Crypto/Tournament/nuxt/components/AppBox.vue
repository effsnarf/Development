<template lang="pug">
div("class"="comp-app-box box")
  div("v-text"="title", "class"="title")
  div(":style"="contentStyle", "class"="content")
    slot("name"="content")
</template>

<script>
export default {
  name: "AppBox",
  props: {
    title: {
      default: null,
    },
    padding: {
      default: null,
    },
  },
  methods: {
    getContentStyle: function () {
      const cs = {};
      if (this.padding) cs.padding = this.padding;
      return cs;
    },
  },
  computed: {
    contentStyle: function () {
      return this.getContentStyle();
    },
  },
};
</script>

<style scoped>
.box {
  border-radius: 0.5em;
  background: #ddd;
}
.title {
  text-align: center;
  color: white;
  font-size: 120%;
  background: black;
  border-radius: 0.5em 0.5em 0 0;
}
.content {
  padding: 1em;
}
</style>
