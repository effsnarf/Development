<template>

<div class="meow-comp-25483">
<input type="color" :value="value" @input="$emit(`input`, $event.target.value)" class="cursor-pointer"/></div>
</template>
<script>
export default
{"props":{"value":null},"data":function() { return {"_meow":{"comp":{"_id":25483,"name":"MG2.Input.Color"},"rateLimit":{}}}; },"computed":{},"asyncComputed":{},"methods":{},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Input.Color"}
</script>

<style scoped>
input
{
  width: 3em;
  height: 3em;
}

</style>