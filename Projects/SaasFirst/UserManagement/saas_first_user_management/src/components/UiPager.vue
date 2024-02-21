<template lang="pug">
div("class"="comp-ui-pager pager-buttons")
  div("v-for"="i in getPageIndexes(pageCount)", "v-text"="(i + 1)", ":class"="{ selected: (i === value) }", "@click"="onClickPage(i)", "class"="pager-button")
</template>

<script>

export default {
  name: 'UiPager',
  components: {
  },
  mixins: [],
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
  },
  data() {
    return {
    }
  },
  methods: {
    getPageIndexes:
      function(pageCount) {
  return Array.from({ length: pageCount }, (v, i) => i);
},
    onClickPage:
      function(pageIndex) {
  this.$emit("input", pageIndex);
},
  },
  computed: {
    pageCount: function() {
  return Math.ceil(this.itemsCount / this.pageSize);
},
  },
  watch: {
  },
}
</script>

<style>
.pager-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5em;
}
.pager-button {
  padding: 0.5em 1em;
  border-radius: 0.5em;
  background: #80808030;
  cursor: pointer;
}
.pager-button:hover {
  background: #80808040;
}
.pager-button.selected, .pager-button.selected:hover {
  background: #80808080 !important;
}
</style>