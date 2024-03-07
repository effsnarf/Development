<template lang="pug">
div("class"="comp-app-header-links links")
  div("class"="page")
    div("class"="items")
      a("class"="link", "v-for"="generator in generators", ":key"="generator.urlName", "v-text"="generator.displayName")
</template>

<script>
export default {
  name: "AppHeaderLinks",
  data() {
    return {
      generators: null,
    };
  },
  mounted: async function () {
    const url = `https://db.memegenerator.net/MemeGenerator/Generators`;
    this.generators = (await (await fetch(url)).json()).slice(0, 8);
  },
};
</script>

<style scoped>
.links {
  background: #444;
}
.links .items {
  display: flex;
  gap: 1em;
  justify-content: space-evenly;
}
a {
  color: white;
}
</style>
