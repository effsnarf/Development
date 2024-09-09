<template lang="pug">
div("class"="comp-ui-list")
  div("v-for"="i in 10")
    slot
</template>

<script>
export default {
  name: "UiList",
  props: {
    items: {
      default: null,
    },
  },
};
</script>

<style scoped></style>
