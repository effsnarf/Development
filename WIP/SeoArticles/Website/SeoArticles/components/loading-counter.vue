<template lang="pug">
  span
    h3
      span {{ text }}..
      span.ml-l1.opacity-50
        span {{ elapsedText }}
        span.opacity-50 ms
    progress-bar(v-if="total", :value="elapsed", :max="total")
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'LoadingCounter',
  props: {
    text: {
      type: String,
      default: 'Loading'
    },
    total: {
      type: Number,
      default: null
    },
    interval: {
      type: Number,
      default: 100
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      started: Date.now(),
      elapsed: null
    }
  },
  computed: {
    elapsedText () {
      // return the elapsed time in seconds, rounded to 1 decimal places
      return (this.elapsed / 1000).toFixed(1)
    }
  },
  watch: {
    isLoading () {
      this.reset()
    }
  },
  mounted () {
    this.start()
  },
  methods: {
    start () {
      this.update()
    },
    update () {
      this.elapsed = (Date.now() - this.started)
      setTimeout(this.update, this.interval)
    },
    reset () {
      this.started = Date.now()
      this.elapsed = null
    }
  }
})
</script>
