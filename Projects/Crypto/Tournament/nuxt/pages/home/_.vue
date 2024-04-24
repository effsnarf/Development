<template lang="pug">
div("class"="comp-home h100vh flex-center")
  div
    div("class"="flex-column gap-2 flex")
      div
        button("v-text"="'➕ start new tournament'", "@click"="toggleNewTournament")
      div("class"="gap-2 flex")
        div
          AppTournament("v-for"="tourn in tourns")
        transition("name"="slide")
          AppTournamentNew("v-if"="showNewForm")
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      tourns: null,
      showNewForm: false,
    };
  },
  mounted: async function () {
    await this.init();
  },
  methods: {
    toggleNewTournament: function () {
      this.showNewForm = !this.showNewForm;
    },
    init: async function () {},
  },
};
</script>

<style scoped></style>
