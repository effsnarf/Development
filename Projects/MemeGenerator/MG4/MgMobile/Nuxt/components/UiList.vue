<template lang="pug">
div(":style"="listStyle", "class"="comp-ui-list")
  div("v-for"="item in items", "class"="comp-ui-list-item", "@click"="onClickListItem")
    slot(":item"="item")
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
  computed: {
    listStyle: function () {
      const style = {};
      style.display = "flex";
      style.flexDirection = "column";
      return style;
    },
  },
};
</script>

<style scoped></style>
