<template lang="pug">
div
  div.absolute-bottom-right.m-l1
    button
  div
</template>

<script>
import { Main } from '~/code/main'

export default {
  data() {
    return {
      main: null
    }
  },
  async mounted() {
      this.main = (await Main.construct(this.$jsYaml));
    },
    methods: {
    }
}
</script>


<style scoped>
.cunt
{
  color: pink;
}
</style>