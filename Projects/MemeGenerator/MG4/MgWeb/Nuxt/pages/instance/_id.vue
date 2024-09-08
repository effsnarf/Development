<template>
  <div>
    <Instance :instanceID="instanceID" />
  </div>
</template>

<script>
import Instance from './_'

export default {
  components: {
    Instance,
  },
  computed: {
    instanceID() {
      return this.$route.params.id
    },
  },
}
</script>
