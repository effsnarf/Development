<template lang="pug">
input("type"="text", "value"="value", "@input"="onInput")
</template>

<script>
export default {
  props: {
    value: null,
    hint: null,
  },
  data () {
    return {
    }
  },
  methods: {
    onInput: function(e) {
  this.value = e.target.value;
  this.$emit('input', this.value);
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
