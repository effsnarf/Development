<template>
  <Nuxt />
</template>

<script>
export default {
  watch: {
    $route(to, from) {
      this.$root.$emit(`route-changed`, to);
    },
  },
};
</script>
