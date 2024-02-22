<template lang="pug">
div("class"="comp-side-bar flex")
  div("class"="sidebar")
    div
      div("class"="logo")
        img("src"="/images/logo.png")
      AppMenu
    div("class"="user-badge")
      img("src"="/images/user.png")
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
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  width: 14em;
  height: 100vh;
  background: #E9EFF2;
}
.sidebar a {
  text-decoration: none !important;
}
.logo {
  margin-top: 32px;
}
.user-badge {
  margin-bottom: 58px;
}
.logo, .user-badge {
  display: flex;
  justify-content: center;
}
</style>