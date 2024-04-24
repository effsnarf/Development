<template lang="pug">
div("class"="comp-app-header-menu")
  div("class"="page")
    div("class"="columns")
      div
        AppLogo
      div("class"="main")
        div("class"="items")
          a("v-for"="item in items", ":class"="{ selected: isSelected(item) }", ":key"="item.name", "v-text"="item.name", ":href"="item.url")
      div("class"="column")
        AppSearch("v-model"="query")
</template>

<script>
export default {
  name: "AppHeaderMenu",
  data() {
    return {
      query: null,
      items: [
        { name: "Home", url: "/" },
        { name: "Characters" },
        { name: "Images" },
        { name: "Popular" },
        { name: "Newest" },
      ],
    };
  },
  methods: {
    isSelected: function (item) {
      return this.$route.path === item.url;
    },
  },
  watch: {
    query: function () {
      this.$emit("update-query", this.query);
    },
  },
};
</script>

<style scoped>
.comp-app-search {
  position: relative;
  top: -0.2em;
}
.columns {
  align-items: baseline;
}
.items {
  position: relative;
  top: 2px;
  display: flex;
  gap: 1em;
  justify-content: center;
}
a {
  margin: 0.5em 0 0 0;
  padding: 0.5em 1.5em;
  border-radius: 0.5em 0.5em 0 0;
  color: white;
  text-decoration: none;
}
a:hover {
  background: #333;
}
a.selected {
  color: black;
  background: #ddd;
  font-weight: bold;
}
</style>
