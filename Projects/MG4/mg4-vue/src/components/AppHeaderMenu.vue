<template lang="pug">
div("class"="comp-app-header-menu")
  div("class"="page")
    div("class"="columns")
      div
        AppLogo
      div("class"="main")
        div("class"="items")
          a("v-for"="item in items", ":class"="{ selected: isSelected(item) }", ":key"="item.name", "v-text"="item.name")
      div("class"="column")
        AppSearch
</template>

<script>
import AppLogo from "./AppLogo.vue";
import AppSearch from "./AppSearch.vue";

export default {
  name: "AppHeaderMenu",
  components: {
    AppLogo,
    AppSearch,
  },
  data() {
    return {
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
      return item.url === window.location.pathname;
    },
  },
};
</script>

<style scoped>
.columns {
  align-items: baseline;
}
.items {
  position: relative;
  top: 1px;
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
