<template lang="pug">
transition-group(tag="ul", class="getListClass()" name="fade-move" vue-comp="data-list")
    li(v-for="(item, index) in getItems()" :key="getItemKey(item)" :class="getItemClass(getIndex(index), item)" @mouseenter="onItemEnter(getIndex(index))" @mouseleave="onItemLeave(getIndex(index))" @click="onItemClick(getIndex(index))")
        data-something(:value="item")
</template>

<script>
export default {
  name: 'DataList',
  props: {
    value: {
      required: true
    },
    reversed: {
      type: Boolean
    },
    doneUntil: {
    },
    itemKey: {
      type: Function
    }
  },
  data() {
    return {
      items: [],
      selected: {
        index: null
      }
    };
  },
  watch: {
    value: {
      handler(value) {
        this.items = value;
      },
      immediate: true
    }
  },
  methods: {
    getListClass() {
      return {
      };
    },
    getItemClass(index, item) {
      return {
        selected: (this.selected.index == index),
        done: this.isDone(index, item)
      };
    },
    getItems() {
      if (!this.items) return [];
      let items = [...this.toArray(this.items)];
      if (this.reversed) items = items.reverse();
      return items;
    },
    toArray(obj) {
      if (!obj) return obj;
      if (Array.isArray(obj)) return obj;
      // dictionary
      if (typeof (obj) == `object`) return Object.values(obj);
      throw `Not implemented`;
    },
    isDone(index, item) {
      return (this.doneUntil && (this.doneUntil(index, item)));
    },
    onItemClick(index) {
      if (index == this.selected.index) index = null;
      this.selected.index = index;
      this.$emit(`item-click`, { index, item: this.items[index] });
    },
    onItemEnter(index) {
      this.$emit(`item-enter`, { index, item: this.items[index] });
    },
    onItemLeave(index) {
      this.$emit(`item-leave`, { index, item: this.items[index] });
    },
    getItemKey(item) {
      if (this.itemKey) return this.itemKey(item);
      return JSON.stringify(item);
    },
    getIndex(index) {
      if (this.reversed) return (this.items.length - index - 1);
      return index;
    },
  }
}
</script>

<style scoped>
li {
  cursor: pointer !important;
}
</style>