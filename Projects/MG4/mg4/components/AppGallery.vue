<template lang="pug">
AppBox(":title"="title", "class"="comp-app-gallery")
  template("v-slot:content")
    div(":style"="galleryStyle", "class"="gallery")
      div("v-for"="item in items", ":is"="templateName", "v-bind"="wrapProps(item)", "class"="item")
</template>

<script>
import AppBox from "./AppBox.vue";
import AppGeneratorMedium from "./AppGeneratorMedium.vue";
import AppGeneratorSmall from "./AppGeneratorSmall.vue";
import AppInstanceMedium from "./AppInstanceMedium.vue";

export default {
  name: "AppGallery",
  components: {
    AppBox,
    AppGeneratorMedium,
    AppGeneratorSmall,
    AppInstanceMedium,
  },
  props: {
    title: {
      default: null,
    },
    template: {
      default: null,
    },
    items: {
      default: null,
    },
    perRow: {
      default: 3,
    },
    gap: {
      default: null,
    },
  },
  methods: {
    wrapProps: function (item) {
      const itemType = this.getItemType(item);
      const props = {};
      props[itemType] = item;
      return props;
    },
    getItemType: function (item) {
      if (item.instanceID) return "instance";
      if (item.generatorID) return "generator";
      return null;
    },
    getGalleryStyle: function () {
      const gs = {};
      gs.gridTemplate = `1fr / repeat(${this.perRow}, 1fr)`;
      if (this.gap) gs.gap = this.gap;
      return gs;
    },
  },
  computed: {
    galleryStyle: function () {
      return this.getGalleryStyle();
    },
    templateName: function () {
      return this.template
        .split(".")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("");
    },
  },
};
</script>

<style scoped>
.gallery {
  display: grid;
  grid-template: 1fr / 1fr 1fr 1fr;
  gap: 1.5em;
}
</style>
