<template lang="pug">
NuxtLink("ref"="nuxtLink1", ":to"="url", "class"="comp-ui-nuxt-link")
  div("class"="null-link")
    slot
</template>

<script>
export default {
  name: "UiNuxtLink",
  props: {
    url: {
      default: null,
    },
  },
};
</script>

<style scoped></style>
