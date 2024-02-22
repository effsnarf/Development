<template lang="pug">
div("class"="comp-app-sort-button flex")
  a("v-text"="text", "@click"="() => $emit('sort-by', field)")
  span("v-if"="sort.field == field")
    span("v-if"="sort.direction == 1", "v-text"="'🔺'")
    span("v-if"="sort.direction == -1", "v-text"="'🔻'")
</template>

<script>
export default {
  name: "AppSortButton",
  props: {
    text: {
      default: null,
    },
    field: {
      default: null,
    },
    sort: {
      default: null,
    },
  },
};
</script>

<style></style>
