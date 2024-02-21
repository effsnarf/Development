<template lang="pug">
div("class"="comp-side-bar flex")
  div("class"="sidebar")
    div("class"="flex justify-center")
      img("class"="logo", "src"="/images/logo.png")
    div
      AppMenu
</template>

<script>
import AppMenu from './AppMenu.vue'

export default {
  name: 'SideBar',
  components: {
    AppMenu,
  },
  mixins: [],
  props: {
  },
  data() {
    return {
    }
  },
  methods: {
  },
  computed: {
  },
  watch: {
  },
}
</script>

<style>
.sidebar {
  width: 14em;
  height: 100vh;
  background: #E9EFF2;
}
.sidebar a {
  text-decoration: none !important;
}
.logo {
  margin: 30px;
}
</style>