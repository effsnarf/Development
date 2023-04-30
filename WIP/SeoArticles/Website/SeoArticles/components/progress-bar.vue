<template lang="pug">
  div.progress
    div.bar(:style="{ width: `${percentage}%` }")
    div
      | {{ percentage }}%
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'ProgressBar',
  props: {
    value: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    }
  },
  data () {
    return {
    }
  },
  computed: {
    percentage () {
      return Math.min(100, Math.round((this.value / this.max) * 100))
    }
  }
})
</script>

<style scoped>
.progress
{
  position: relative;
  height: 1.5em;
  background-color: #ffffff80;
  border-radius: 0.5rem;
  overflow: hidden;
}
.bar
{
  height: 100%;
  background-color: #ffffffaa;
  transition: width 0.2s ease-in-out;
}
.progress > div
{
  position: absolute;
  width: 100%;
  height: 100%;
  text-align: center;
  color: white;
}
</style>