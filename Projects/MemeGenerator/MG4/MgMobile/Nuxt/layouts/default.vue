<template lang="pug">
div("class"="comp-default mobile")
  div("class"="app")
    transition("name"="page", "@enter"="enter", "@beforeLeave"="beforeLeave")
      slot
</template>

<script>
export default {
  name: "Default",
  methods: {
    beforeLeave: async function (pageEl, done) {},
  },
};
</script>

<style scoped>
.footer-spacer {
  height: 10vh;
}
</style>
