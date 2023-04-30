<template lang="pug">
app-layout-style(:node="node", :selection="selection")
  input(v-model="nodeValue")
</template>

<script>
import Base from '../base';
import { Utility } from '~/code/util/utility';

export default {
  extends: Base,
  data() {
    return {
      usesNodeValue: true
    };
  },
  methods: {
  },
  watch: {
  },
}
</script>

<style scoped>
.input
{
  padding: 0;
  margin: 0;
}
</style>
