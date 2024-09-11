<template>
  <Instance :instanceID="instanceID" />
</template>

<script>
import Instance from "~/pages/instance/_.vue";

export default {
  components: {
    Instance,
  },
  computed: {
    instanceID() {
      return this.$route.params.instanceID;
    },
  },
};
</script>
