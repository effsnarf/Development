<template lang="pug">
app-layout-comp(v-for="child in node?.children", :node="child", :data-items="dataItems", :selection="selection", :key="node._id")
</template>

<script>
  import Base from '../base';
  
  export default {
    extends: Base,
      props: {
      },
      data() {
          return {
          };
      },
      methods: {
      }
  }
</script>

