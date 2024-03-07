<template lang="pug">
div("class"="comp-app-header-tiers tiers")
  div("class"="page")
    div("class"="items")
      a("class"="tier", "v-for"="tier in tiers", ":key"="tier.name", "v-text"="tier.name + ' tier'")
</template>

<script>
export default {
  name: "AppHeaderTiers",
  data() {
    return {
      tiers: [
        { name: "God" },
        { name: "Demigod" },
        { name: "Legendary" },
        { name: "Top" },
        { name: "Fascinating" },
        { name: "Meh" },
        { name: "Lame" },
        { name: "Fail" },
      ],
    };
  },
};
</script>

<style scoped>
.tiers {
  background: #ddd;
}
.tiers .items {
  display: flex;
  gap: 1em;
  justify-content: center;
}
a {
  margin: 0.5em 0 0 0;
  padding: 0.5em 1.5em;
  border-radius: 0.5em 0.5em 0 0;
  color: black;
  text-decoration: none;
}
a:hover {
  background: #ccc;
}
</style>
