<template>
  <Generator :urlName="urlName" :pageIndex="pageIndex" />
</template>

<script>
import Generator from '~/pages/generator/_.vue'

export default {
  components: {
    Generator,
  },
  computed: {
    urlName() {
      return this.$route.params.slug
    },
    pageIndex() {
      return this.$route.params.pageIndex
    },
  },
}
</script>
