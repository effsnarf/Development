<template lang="pug">
div("class"="comp-ui-select")
  div(":style"="{ 'max-width': ((direction == 'horizontal') ? null : null) }")
    UiInputTextBox("v-if"="showSearchBox", "icon"="🔎", "type"="search", ":hint"="searchHint", "v-model"="query")
    div("class"="list-container")
      div("v-if"="(type=='toggle')")
        transition("name"="slide2")
          div(":key"="valueIndex", "v-html"="getOptionText(valueIndex)", "@click"="toggleValue($event, +1)", "@contextmenu"="toggleValue($event, -1)", "class"="clickable")
      select("v-if"="(type=='dropdown')", ":value"="valueIndex", "@input"="onInput(parseInt($event.target.value))")
        option("v-for"="(item, index) in options", ":value"="index", "v-html"="item")
      UiList("v-if"="(type=='list')", "v-slot:slotProps", ":items"="options", ":selected-index"="valueIndex", ":direction"="direction", ":is-item-visible"="_isOptionVisible", ":get-item-key"="_getItemKey", ":can-select-none"="canSelectNone", "@item-hover"="onItemHover($event)", "@input"="onInput($event)")
        template
          slot(":item"="slotProps.item")
          UiTitle("v-if"="showText", ":icon"="_getItemIcon(slotProps.item)", ":html"="__getItemText(slotProps.item)", ":number"="_getItemNumber(slotProps.item)")
</template>

<script>
export default {
  name: "UiSelect",
  props: {
    options: {
      default: null,
    },
    value: {
      default: 0,
    },
    inputType: {
      default: "index",
    },
    direction: {
      default: "vertical",
    },
    showText: {
      default: true,
    },
    searchHint: {
      default: null,
    },
    showSearch: {
      default: null,
    },
    type: {
      default: "list",
    },
    itemIcon: {
      default: null,
    },
    isOptionVisible: {
      default: null,
    },
    getItemIcon: {
      default: null,
    },
    getItemText: {
      default: null,
    },
    getItemNumber: {
      default: null,
    },
    getItemTooltip: {
      default: null,
    },
    getItemKey: {
      default: null,
    },
    canSelectNone: {
      default: true,
    },
  },
  data() {
    return {
      query: null,
    };
  },
  methods: {
    _isOptionVisible: function (item) {
      const isQueryFilter =
        this.query && this.query.length
          ? this.__getItemText(item)
              .toLowerCase()
              .includes(this.query.toLowerCase())
          : true;
      const isOptionVisibleFilter = this.isOptionVisible
        ? this.isOptionVisible(item)
        : true;
      return isQueryFilter && isOptionVisibleFilter;
    },
    getOptionText: function (index) {
      let s = this.options[index];
      if (this.getItemText) s = this.getItemText(s);
      if (this.itemIcon) s = `${this.itemIcon} ${s}`;
      if (this.type === "toggle") {
        if (s?.length > 2) s = `${s}`;
      }
      return s;
    },
    getOptionTooltip: function (index) {
      if (this.getItemTooltip) return this.getItemTooltip(this.options[index]);
      return null;
    },
    onItemHover: function (e) {
      this.$emit("item-hover", e);
    },
    onInput: function (index) {
      const value = this.inputType === "index" ? index : this.options[index];
      if (this.value === value) value = null;
      this.$emit("input", value);
    },
    _getItemKey: function (item) {
      if (this.getItemKey) return this.getItemKey(item);
      if (this.getItemText) return this.getItemText(item);
      return this.item;
    },
    _getItemIcon: function (item) {
      if (this.getItemIcon) return this.getItemIcon(item);
      return null;
    },
    __getItemText: function (item) {
      let s = this._getItemText(item);
      if (this.itemIcon) s = `${this.itemIcon} ${s}`;
      return s;
    },
    _getItemText: function (item) {
      if (this.getItemText) return this.getItemText(item);
      const text = item;
      return text;
    },
    _getItemNumber: function (item) {
      if (this.getItemNumber) return this.getItemNumber(item);
      return null;
    },
    toggleValue: function (e, delta) {
      e.preventDefault();
      e.stopPropagation();
      const index = this.valueIndex;
      let newIndex = (index + delta) % this.options.length;
      if (newIndex < 0) newIndex = this.options.length - 1;
      this.onInput(newIndex);
    },
  },
  computed: {
    valueIndex: function () {
      if (this.inputType === "index") return this.value;
      return this.options?.indexOf(this.value);
    },
    showSearchBox: function () {
      if (typeof this.showSearch === "boolean") return this.showSearch;
      return this.type === "list" && this.options?.length > 10;
    },
  },
  watch: {
    query: function () {
      this.$emit("input:query", this.query);
    },
  },
};
</script>

<style scoped>
div {
  white-space: nowrap;
}
.list-container {
  max-height: 30em;
  overflow-x: hidden;
  overflow-y: auto;
}
.comp-ui-list {
  user-select: none;
}
li {
  margin: 0 !important;
  padding: 0.2em 0.5em;
}
li.selected {
  border: 1px solid #ffffff80;
  box-shadow: -6px 6px 6px black;
}
li div {
  white-space: nowrap;
}
.clickable {
  text-align: center;
  user-select: none;
  padding: 0 0.5em;
}
.clickable:hover {
  background: #ffffff20;
}
</style>
