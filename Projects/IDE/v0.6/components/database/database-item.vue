<template lang="haml">
div.flex.flex-row
  div.opacity-50 ⚪
  div.opacity-70= value.uid
  div= value
</template>
  
<script>
export default {
  name: 'DatabaseItem',
  props: {
    value: {
      type: Object,
      required: true
    }
  },
  computed: {
    item() {
      return this.value?.redo;
    }
  }
}
</script>
