<template lang="pug">
div()
    div("class"="meme", "v-text"="'Meme'")
    div("class"="generator", "v-text"="'Generator'")
</template>

<script>
export default {
  props: {
  },
  data () {
    return {
    }
  },
  methods: {
  },
  computed: {

  },
  watch: {

  },
  mounted () {

  }
}
</script>

<style scoped>
.meme
{
  font-size: 6vh;
}

.generator
{
  font-size: 3vh;
}

div
{
  font-family: impact;
  text-transform: uppercase;
  line-height: 1em;
  text-align: center;
  top: -0.1rem;
  text-shadow: -1px 5px 3px;
}

</style>
