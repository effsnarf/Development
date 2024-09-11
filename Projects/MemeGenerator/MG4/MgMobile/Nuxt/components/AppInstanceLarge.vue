<template lang="pug">
UiElement("@input"="(e) => elInfo = e", "class"="comp-app-instance-large")
  div("v-if"="instance1", "class"="instance")
    UiLink(":url"="'/instance/' + instance1?.instanceID")
      div
        div("class"="texts")
          div(":style"="text0Style", "v-text"="instance1.text0", "class"="text1")
          div(":style"="text1Style", "v-text"="instance1.text1", "class"="text2")
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
  data() {
    return {
      elInfo: null,
      text0Style: null,
      text1Style: null,
    };
  },
  methods: {
    getTextStyle: function (elInfo, index) {
      if (!elInfo) return {};
      const style = {};
      const text = this.instance1[`text${index}`];
      const elw = elInfo.width;
      const fontSize = elw / 7;
      style.fontSize = this.getFontSize(text, elw);
      return style;
    },
    getFontSize: function (s, width) {
      if (!s) return 0;
      if (!width) return 0;
      const size = Math.min(
        3,
        ((Math.max(14, 36 - s.length / 6) / 50) * width) / 150,
      );
      return `${size * 1.5}rem`;
    },
  },
  computed: {
    instance1: function () {
      if (this.instance) return this.instance;
      return {
        instanceID: 1,
        text0: "Pain is temporary",
        text1: "Glory is eternal",
      };
    },
    instanceImageUrl: function () {
      return `https://i.imgur.com/QwWQw2v.jpeg`;
    },
  },
  watch: {
    elInfo: {
      handler: function (newElInfo) {
        this.text0Style = this.getTextStyle(newElInfo, 0);
        this.text1Style = this.getTextStyle(newElInfo, 1);
      },
      immediate: false,
      deep: true,
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
    -0.5vh 0.5vh 0.2vh #000,
    0.2vh -0.2vh 0.2vh #000;
  font-family: impact;
}
.text2 {
  position: absolute;
  bottom: 0;
}
</style>
