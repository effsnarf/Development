<template lang="pug">
div
  div.action-item-row.flex.flex-row.h-6
    div.w-l2.text-center.opacity-50(v-text="item._id")
    div.w-l2.text-center(v-text="redo?.module.icon")
    div.w-l3.ellipsis(v-text="redo?.module.name")
    div.w-l2.text-center(v-text="redo?.method.icon")
    div.w-l7
      div(v-if="redo.desc", v-text="redo.desc")
      div(v-else)
        div.w-l4(v-text="redo.method.name")
        div.w-l4.opacity-50(v-text="redo.args")
        data-something.w-l6(:value="redo.result")
    div.w-l3.text-right
      div(v-if="(undefined != redo?.ts?.elapsed)")
        span(v-text="redo.ts.elapsed")
        span.opacity-50 ms
</template>
  
<script>
export default {
  props: {
    value: {
      type: Object,
      required: true
    }
  },
  methods: {
    getChildren(item) {
      return this.parent.filter(c => (c.parent?._id == item._id));
    }
  },
  computed: {
    item() {
      return this.value;
    },
    redo() {
      return (this.value?.redo || this.value?.redos[0]);
    },
  }
}
</script>


<style scoped>
div
{
  overflow: hidden;
}
</style>
