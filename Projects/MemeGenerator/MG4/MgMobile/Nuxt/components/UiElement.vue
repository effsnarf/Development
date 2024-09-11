<template lang="pug">
div("class"="comp-ui-element")
  slot
</template>

<script>
export default {
  name: "UiElement",
  data() {
    return {
      info: { width: null, height: null },
    };
  },
  mounted: function () {
    this.init();
  },
  methods: {
    init: function () {
      this.refresh();
    },
    refresh: function () {
      const el = this.$el;
      if (!el.isConnected) return;

      const info = this.info;

      info.width = el.clientWidth;
      info.height = el.clientHeight;

      requestAnimationFrame(this.refresh.bind(this));
    },
  },
  watch: {
    info: {
      handler: function (newInfo) {
        newInfo = JSON.parse(JSON.stringify(newInfo));
        this.$emit("input", newInfo);
      },
      immediate: false,
      deep: true,
    },
  },
};
</script>

<style scoped></style>
