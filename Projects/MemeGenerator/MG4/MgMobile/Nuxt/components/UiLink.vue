<template lang="pug">
UiNuxtLink("ref"="nuxtLink1", "v-if"="url1", ":url"="url1", "class"="comp-ui-link")
  slot
</template>

<script>
export default {
  name: "UiLink",
  props: {
    generator: {
      default: null,
    },
    instance: {
      default: null,
    },
    url: {
      default: null,
    },
  },
  computed: {
    url1: function () {
      if (this.generator) return `/generator${this.generator.urlName}`;
      if (this.instance) return `/instance/${this.instance.instanceID}`;
      if (this.url) return this.url;
      return null;
    },
  },
};
</script>

<style scoped>
.link1 {
  cursor: pointer;
}
</style>
