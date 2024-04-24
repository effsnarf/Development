<template lang="pug">
div("class"="comp-app-tournament-new flex-column gap-1 flex")
  h2("v-text"="'New Tournament'")
  table
    tbody
      tr
        td
          div("v-text"="'Players'", "class"="hint")
        td
          select("v-model"="playerCount")
            option("v-for"="pco in playerCountOptions", "v-text"="pco", ":value"="pco")
      tr
        td
          div("v-text"="'Entry fee'", "class"="hint")
        td
          select("v-model"="entryFee")
            option("v-for"="fee in entryFees", "v-text"="'$' + fee", ":value"="fee")
  div("class"="gap-1 flex")
    div("v-text"="'Prizes'", "class"="hint")
    div("v-text"="'$' + prizePool")
  div
    AppTournamentPrizeList(":playerCount"="playerCount", ":entryFee"="entryFee")
  div
    button("v-text"="'✔️ Start tournament'")
</template>

<script>
export default {
  name: "AppTournamentNew",
  data() {
    return {
      playerCountOptions: [10, 30, 50, 100],
      entryFees: [0.1, 0.5, 1, 2, 5, 10],
      playerCount: 10,
      entryFee: 1,
    };
  },
  computed: {
    prizePool: function () {
      return this.playerCount * this.entryFee;
    },
  },
};
</script>

<style scoped>
.hint {
  color: gray;
}
select {
  width: 10em;
  text-align: center;
}
td {
  padding: 0.5rem;
}
</style>
