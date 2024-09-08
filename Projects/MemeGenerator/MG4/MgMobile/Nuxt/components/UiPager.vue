<template lang="pug">
div("v-if"="showPageButtons", "class"="comp-ui-pager pager-buttons")
  a("class"="pager-button", ":class"="{ selected: (i === value) }", "v-for"="i in getPageIndexes(visiblePagesCount)", "v-text"="(i + 1)", ":href"="getPageButtonUrl(i)", "@click"="onClickPage(i)")
</template>

<script>
export default {
  name: "UiPager",
  props: {
    itemsCount: {
      default: null,
    },
    pageSize: {
      default: null,
    },
    value: {
      default: null,
    },
    urlFormat: {
      default: null,
    },
  },
  methods: {
    getPageButtonUrl: function (pageIndex) {
      if (!this.urlFormat) return null;
      const urlPageIndex = pageIndex + 1;
      return this.urlFormat.replace("${pageIndex}", urlPageIndex);
    },
    getPageIndexes: function (pageCount) {
      return Array.from({ length: pageCount }, (v, i) => i);
    },
    onClickPage: function (pageIndex) {
      this.$emit("input", pageIndex);
    },
  },
  computed: {
    visiblePagesCount: function () {
      return Math.min(10, this.pageCount);
    },
    pageCount: function () {
      return Math.ceil(this.itemsCount / this.pageSize);
    },
    showPageButtons: function () {
      return this.itemsCount > this.pageSize;
    },
  },
};
</script>

<style scoped>
.pager-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5em;
}
.pager-button {
  padding: 0.5em 1em;
  border-radius: 0.5em;
  background: #80808030;
  text-decoration: none;
  cursor: pointer;
}
.pager-button:hover {
  background: #80808060;
}
.pager-button.selected,
.pager-button.selected:hover {
  background: #80808080 !important;
}
</style>
