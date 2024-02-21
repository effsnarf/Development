<template lang="pug">
div("class"="comp-app app")
  div("class"="columns")
    div("class"="column1")
      SideBar()
    div("class"="column2")
      UserList()
  div()
    UiHtmlStyle("v-for"="comp in $root.comps", ":key"="comp.name", ":component"="comp", ":document-head"="true")
</template>

<script>
import SideBar from './components/SideBar.vue'
import UserList from './components/UserList.vue'

export default {
  name: 'App',
  components: {
    SideBar,
    UserList,
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
.app, .columns, .columns > div {
  min-height: 100vh;
}
.columns {
  display: flex;
  flex-direction: row;
}
.column1 {
  flex-shrink: 1;
}
.column2 {
  background: white;
  border-radius: 2em;
  flex-grow: 1;
}
</style>