<template lang="pug">
div(v-text="value")
</template>

<script>
export default {
  name: 'DataDictionary',
  props: {
    value: {
      required: true
    }
  }
}
</script>
