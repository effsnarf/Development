<template lang="pug">
div("class"="comp-app-instance-medium")
  a(":href"="instanceUrl")
    img(":src"="instanceImageUrl")
  div("class"="menu")
    AppLink(":generator"="instance")
    AppVoter("v-if"="false", ":instance"="instance")
    AppLink("v-if"="false", "text"="generate")
  div("class"="dimmed menu")
    div("v-text"="(instance.commentsCount + ' comments')")
</template>

<script>
export default {
  name: "AppInstanceMedium",
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
