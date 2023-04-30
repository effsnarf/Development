<template lang="pug">
.box
  .flex.justify-between
    h3 Actions
    .flex(:class="getCssClass()", style="gap: 1em;")
      button(@click="actionStack.clear();") ✖ clear
      button(@click="actionStack.undo();") ◀ undo
      button(@click="actionStack.redo();") redo ▶
  div
    data-list(:value="actionStack?.items._value", :item-key="action => action._id", :reversed="true", :done-until="(index, item) => (actionStack.pointer.get() >= index)")
</template>
  
<script>
export default {
  props: {
    actionStack: {
      type: Object,
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    getCssClass(item) {
      let cls = {};

      if (!this.enabled) {
        cls.disabled = true;
      }

      return cls;
    }
  }
}
</script>
