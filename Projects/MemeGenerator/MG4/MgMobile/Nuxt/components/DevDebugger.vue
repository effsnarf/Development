<template lang="pug">
div("class"="comp-dev-debugger debugger")
  div("class"="flex")
    span("v-text"="'🔎🧊'")
    input("v-model"="query")
  div
    table
      tr("v-for"="match in matches")
        td("v-for"="s in [...match]", "v-text"="s")
</template>

<script>
export default {
  name: "DevDebugger",
  data() {
    return {
      query: null,
      vAllComps: null,
      matches: null,
    };
  },
  methods: {
    search: function (query) {
      const elApp = document.querySelector(".app");
      const elPage = elApp.firstElementChild;
      const vPage = elPage.__vueParentComponent;
      const descs = this.getDescendantInstances(vPage);
      this.vAllComps = descs;
      this.matches = this.getAllMatches(query);
      console.log(this.matches);
    },
    getAllMatches: function (query) {
      if (!query?.length) return [];
      const matches = [];
      query = query.toLowerCase();
      for (const vComp of this.vAllComps) {
        for (let key of Object.keys(vComp.data)) {
          key = key.toLowerCase();
          if (key.includes(query)) {
            matches.push([
              "📦",
              vComp.type.name,
              "🧊",
              key,
              "🟰",
              vComp.data[key],
            ]);
          }
        }
      }
      return matches;
    },
    getDescendantInstances: function (vueInstance) {
      const descendants = [];

      function findDescendants(instance) {
        if (!instance || !instance.subTree || !instance.subTree.children)
          return;

        instance.subTree.children.forEach((child) => {
          if (child && child.component) {
            descendants.push(child.component);
            findDescendants(child.component);
          }
        });
      }

      descendants.push(vueInstance);
      findDescendants(vueInstance);
      return descendants;
    },
  },
  watch: {
    query: function (newQuery) {
      this.search(newQuery);
    },
  },
};
</script>

<style scoped>
div {
  font-family: Courier New;
}
.debugger {
  position: fixed;
  top: 1em;
  right: 1em;
  max-width: 40vw;
  border-radius: 0.5em;
}
span {
  white-space: nowrap;
}
</style>
