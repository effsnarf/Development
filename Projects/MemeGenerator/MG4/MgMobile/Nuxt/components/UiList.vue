<template lang="pug">
div("class"="comp-ui-list")
  div("v-for"="i in 10", "class"="comp-ui-list-item", "@click"="onClickListItem")
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
  methods: {
    onClickListItem: function (e) {
      const listItem = e.target.closest(".comp-ui-list-item");
      listItem.classList.add("selected-active");
    },
  },
};
</script>

<style scoped></style>
