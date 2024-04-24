<template lang="pug">
div("class"="comp-app-tournament-prize-list scroll")
  table
    tbody
      tr("v-for"="i in winnerCount")
        td("v-text"="(i) + ' place'")
        td("v-text"="'$' + getPrize(i - 1)")
</template>

<script>
export default {
  name: "AppTournamentPrizeList",
  props: {
    playerCount: {
      default: null,
    },
    entryFee: {
      default: null,
    },
  },
  methods: {
    getPrize: function (place) {
      return Math.floor(this.prizePool / this.winnerCount);
    },
    quadraticRoots: function (a, b, c) {
      const discriminant = b * b - 4 * a * c;
      if (discriminant < 0) {
        return [];
      } else if (discriminant === 0) {
        return [-b / (2 * a)];
      } else {
        const sqrtDiscriminant = Math.sqrt(discriminant);
        return [
          (-b + sqrtDiscriminant) / (2 * a),
          (-b - sqrtDiscriminant) / (2 * a),
        ];
      }
    },
  },
  computed: {
    prizes: function () {
      return this.getPrizes(
        this.playerCount,
        this.entryFee,
        this.winnerCount,
        this.prizePool,
      );
    },
    prizePool: function () {
      return this.playerCount * this.entryFee;
    },
    winnerCount: function () {
      return Math.floor(this.playerCount / 3);
    },
  },
};
</script>

<style scoped>
.scroll {
  max-height: 40vh;
  overflow: auto;
}
table {
  width: 100%;
}
td {
  padding: 0 0.5rem;
  border: 1px solid #ffffff40;
}
td:nth-child(2) {
  text-align: center;
}
</style>
