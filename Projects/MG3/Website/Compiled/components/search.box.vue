<template lang="pug">
text-box("value"="value", "@input"="onInput")
</template>

<script>
export default {
  props: {
    value: null,
  },
  data () {
    return {
    }
  },
  methods: {
    onInput: function(newValue) {
  this.$emit('input', newValue);
}

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
</style>
