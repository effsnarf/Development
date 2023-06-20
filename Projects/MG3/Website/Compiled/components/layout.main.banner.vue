<template lang="pug">
div("class"="image")
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
.image
{
  background: url("/img/banners/(7).jpg");
  width: calc(100% - 4em);
  height: calc(100% - 1em);
  margin: 0.3em 0 0 3em;
  filter: grayscale(1);
  border-radius: 0.5em;
  background-size: cover!important;
  background-position: 50% 30%!important;
}

</style>
