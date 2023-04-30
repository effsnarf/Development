<template lang="pug">
  div(v-if="example")
    img(:src="example.image?.url")
    h3 {{ example.topic }}
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  props: {
    example: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
    }
  }
})
</script>

<style scoped>
img
{
    aspect-ratio: 2 / 3;
    border-radius: 1em;
    object-fit: cover;
}
</style>
