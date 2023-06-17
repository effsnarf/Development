<template>

<transition name="slide-in-list" class="meow-comp-25477 ">
<div v-text="myText" v-if="myText" @click="dismiss" class="my-l1"></div></transition>
</template>
<script>
export default
{"props":{"text":null},"data":function() { return {"_meow":{"comp":{"_id":25477,"name":"MG2.Alert"},"rateLimit":{}},"myText":null,"timeout":3000}; },"computed":{},"asyncComputed":{},"methods":{"dismiss":function () {
        this.myText = null;

      },"set":function (text) {
        this.myText = text;

      }},"watch":{"text":{"deep":true,"immediate":false,"handler":async function(newText, oldText) {
      this.myText = newText;

    }},"myText":{"deep":true,"immediate":false,"handler":async function(newMyText, oldMyText) {
      if (!newMyText) return;

setTimeout(() => {
  this.dismiss();
}, this.timeout);

    }}},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Alert"}
</script>

<style scoped>
.message
{
  border-radius: 0.5em;
  background: #ffffff40;
  padding: 0.5em 1em;
}

</style>