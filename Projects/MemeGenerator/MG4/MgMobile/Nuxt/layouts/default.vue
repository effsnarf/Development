<template lang="pug">
div("class"="comp-default")
  DevDebugger
  div("class"="mobile")
    div("class"="app")
      transition("name"="page")
        slot
</template>

<script>
export default {
  name: "Default",
  mounted: function () {
    this.init();
  },
  methods: {
    init: function () {
      if (window.scollListener1isRegistered) return;
      window.addEventListener("scroll", this.handleScroll.bind(this), true);
      window.scollListener1isRegistered = true;
    },
    handleScroll: function () {
      const elements = document.querySelectorAll(".page-content");

      elements.forEach((element) => {
        const scrollTop = element.scrollTop || 0;
        const clientHeight = element.clientHeight || 0;

        element.className = element.className
          .replace(/scroll-top-\d+vh/g, "")
          .trim();

        const percentage = Math.min(
          Math.floor((scrollTop / clientHeight) * 100),
          100,
        );
        const scrollClass = `scroll-top-${percentage}vh`;

        element.classList.add(scrollClass);
      });
    },
  },
};
</script>

<style scoped>
.footer-spacer {
  height: 10vh;
}
</style>
