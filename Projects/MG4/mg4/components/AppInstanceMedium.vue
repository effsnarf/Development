<template lang="pug">
div("class"="comp-app-instance-medium")
  a(":href"="instanceUrl")
    img(":src"="instanceImageUrl")
  div("class"="menu")
    AppLink(":generator"="instance")
    AppVoter("v-if"="false", ":instance"="instance")
    AppLink("v-if"="false", "text"="generate")
</template>

<script>
import AppLink from "./AppLink.vue";
import AppVoter from "./AppVoter.vue";

export default {
  name: "AppInstanceMedium",
  components: {
    AppLink,
    AppVoter,
  },
  props: {
    instance: {
      default: null,
    },
  },
  computed: {
    instanceUrl: function () {
      return `/instance/${this.instance._id}`;
    },
    instanceImageUrl: function () {
      return `https://img.memegenerator.net/instances/250x250/${this.instance._id}.jpg`;
    },
  },
};
</script>

<style scoped>
.menu {
  display: flex;
  justify-content: space-between;
}
a {
  color: #2244aa;
}
</style>
