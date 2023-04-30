<template lang="pug">
div(v-text="value")
</template>

<script>
export default {
  name: 'DataPrimitive',
  props: {
    value: {
      required: true
    }
  }
}
</script>
