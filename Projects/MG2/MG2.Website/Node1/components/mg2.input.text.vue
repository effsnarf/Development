<template>

<div class="meow-comp-25485">
<input v-model="myValue" :placeholder="hint" :style="{ textTransform: textTransform }" class=""/></div>
</template>
<script>
export default
{"props":{"value":null,"hint":null,"textTransform":null},"data":function() { return {"_meow":{"comp":{"_id":25485,"name":"MG2.Input.Text"},"rateLimit":{}},"myValue":null}; },"computed":{},"asyncComputed":{},"methods":{},"watch":{"value":{"deep":true,"immediate":false,"handler":async function(newValue, oldValue) {
      this.myValue = newValue;

    }},"myValue":{"deep":true,"immediate":false,"handler":async function(newMyValue, oldMyValue) {
      this.$emit(`input`, newMyValue);

    }}},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Input.Text"}
</script>

<style>
input
{
  border-radius: 0.3em;
  padding: 0.2em 0.5em;
}

</style>