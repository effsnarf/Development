<template lang="pug">
div("class"="comp-app-instance-large instance")
  a
    div
      div("class"="texts")
        div("v-text"="'Pain is temporary'", "class"="text1")
        div("v-text"="'Glory is eternal'", "class"="text2")
      img(":src"="instanceImageUrl")
  div("class"="buttons1")
    div("v-text"="'➤'", "class"="button1")
    div("class"="flex ac")
      div("v-text"="'💬'", "class"="button1")
      div("v-text"="'12'")
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

<style scoped>
.texts {
  position: absolute;
  width: 100%;
  height: calc(100% - 10px);
}
.text1,
.text2 {
  width: 100%;
  text-transform: uppercase;
  text-align: center;
  text-shadow:
    -0.1em 0.1em 0.02em #000,
    0.04em -0.04em 0.04em #000;
  font-family: impact;
  font-size: 36px;
}
.text2 {
  position: absolute;
  bottom: 0;
}
</style>
