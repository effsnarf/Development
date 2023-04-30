<template lang="pug">
app-layout-style(:node="node", :selection="selection")
  img(:src="computedValue")
</template>

<script>
import Base from '../base';
import { DataBinder } from '~/code/util/data-binder';

export default {
  extends: Base,
  props: {
  },
  data() {
    return {
      defaultValue: `/_nuxt/img/image-placeholder.webp`,
      usesNodeValue: true,
    };
  },
  computed: {
  }
}
</script>


<style scoped>
img
{
    width: 3em;
}
</style>
