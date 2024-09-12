<template>
  <CreateInstance :urlName="urlName" />
</template>

<script>
import CreateInstance from "~/pages/createinstance/_.vue";

export default {
  components: {
    CreateInstance,
  },
  computed: {
    urlName() {
      return this.$route.params.urlName;
    },
  },
};
</script>
