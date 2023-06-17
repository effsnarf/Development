<template>

<div class="meow-comp-25342">
<div class="gallery">
<div v-for="item in items" class="">
<component :instance="item" is="mg2-instance" class=""></component></div></div>
<component is="mg2-pager" class=""></component></div>
</template>
<script>
export default
{"props":{"items":null},"data":function() { return {"_meow":{"comp":{"_id":25342,"name":"MG2.Gallery"},"rateLimit":{}}}; },"computed":{},"asyncComputed":{},"methods":{},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Gallery"}
</script>

<style scoped>
.gallery
{
  display: grid;
  grid-template: 1fr / 1fr;
  grid-gap: 0.5vw;
  margin-bottom: 1em;
}

</style>