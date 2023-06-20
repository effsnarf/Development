<template lang="pug">
a-link(":url"="`/${urlName}`")
  layout-horizontal-1()
    image(":url"="$urls.image(imageID)")
    layout-vertical-1()
      text(":value"="displayName")
      number(":value"="instancesCount")
</template>

<script>
export default {
  props: {
    imageID: null,
    urlName: null,
    displayName: null,
    instancesCount: null,
  },
  data () {
    return {
    }
  },
  methods: {
  },
  computed: {

  },
  watch: {

  },
  mounted () {

  }
}
</script>

<style scoped>
</style>
