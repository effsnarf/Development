<template lang="pug">
div("class"="comp-app-instance-large")
  a
    img(":src"="instanceImageUrl")
</template>

<script>
export default {
  name: "AppInstanceLarge",
  props: {
    instance: {
      default: null,
    },
  },
  computed: {
    instanceImageUrl: function () {
      return `https://i.imgur.com/QwWQw2v.jpeg`;
    },
  },
};
</script>

<style scoped></style>
