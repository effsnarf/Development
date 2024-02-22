<template lang="pug">
div(":class"="{ active: active }", "class"="comp-app-menu-item menu-item")
  a("class"="content")
    div("class"="image")
      img(":src"="image")
    div("v-text"="text", "class"="text")
</template>

<script>

export default {
  name: 'AppMenuItem',
  components: {
  },
  mixins: [],
  props: {
    image: {
      default: null,
    },
    text: {
      default: null,
    },
    active: {
      default: null,
    },
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
.menu-item {
  border-radius: 0;
}
.menu-item:hover {
  background: #00000010;
}
.active {
  background-repeat: no-repeat;
  background-position: right;
}
.content {
  display: flex;
  align-items: center;
  width: 10em;
  margin: auto;
  padding: 5px;
}
.text {
  width: 7em;
}
a {
  padding: 0.5em;
  color: black;
  cursor: pointer;
}
.image {
  width: 2em;
}
</style>