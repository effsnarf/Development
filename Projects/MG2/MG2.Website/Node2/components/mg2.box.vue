<template>

<div class="meow-comp-25339">
<h2 v-text="title" class="fs-m3"></h2>
<div :class="(showFrame ? 'box' : '')" class="">
<div :style="`padding: ${(padded ? `1` : 0)}em`" class="body">
<slot class=""></slot></div></div></div>
</template>
<script>
export default
{"props":{"title":null,"showFrame":{"default":true},"padded":null},"data":function() { return {"_meow":{"comp":{"_id":25339,"name":"MG2.Box"},"rateLimit":{}}}; },"computed":{},"asyncComputed":{},"methods":{},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Box"}
</script>

<style scoped>
.box
{
  padding: 0;
  border-radius: 0.5em;
  background: #ffffff30;
}

.selected .box
{
  border: 2px solid white;
  box-shadow: inset -12px 12px 12px #000;
}

.box > .body
{
  min-height: 5vh;
  padding: 0em;
}

@media (max-width: 900px) {
  .box > .body
  {
    padding: 0em;
  }
}

</style>