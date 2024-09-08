<template lang="pug">
div("class"="comp-home")
  div("v-text"="'Home'")
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      instances1: null,
      generators1: null,
    };
  },
  mounted: async function () {
    await this.init();
  },
  methods: {
    init: async function () {
      const url1 = `https://db.memegenerator.net/MemeGenerator/Instances`;
      this.instances1 = (await (await fetch(url1)).json()).slice(0, 9);
      const url2 = `https://db.memegenerator.net/MemeGenerator/Generators`;
      this.generators1 = (await (await fetch(url2)).json()).slice(0, 9);
    },
  },
};
</script>

<style scoped></style>
