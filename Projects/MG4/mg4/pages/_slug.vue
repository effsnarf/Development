<template>
  <Generator :urlName="urlName" />
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
  },
}
</script>
