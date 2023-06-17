<template>

<div :to="url" class="meow-comp-25356 ">
<component :to="url" :href="url" :target="target" :is="(target ? `a` : `NuxtLink`)" class="link">
<div @click="(e) =&gt; onClick(e, url)" class="">
<div v-text="text" v-if="text" class=""></div>
<slot name="default"></slot></div></component></div>
</template>
<script>
export default
{"props":{"text":null,"url":null,"enabled":{"default":true},"target":null},"data":function() { return {"_meow":{"comp":{"_id":25356,"name":"MG2.Link"},"rateLimit":{}}}; },"computed":{},"asyncComputed":{},"methods":{"getRoot":function () {
        let depth = 10;

let vm = this.$parent;

while ((depth--) && (vm?._data?._meow?.comp?.name != `MG2.App`)) vm = vm.$parent;

return vm;

      },"getNav":function () {
        return this.getRoot()?.$refs?.nav1;

      },"onClick":function (e, url) {
        //if (window.$nuxt) return;
if (this.target) return;

e.preventDefault();
e.stopPropagation();

this.getNav()?.goto(url);

return false;

      }},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Link"}
</script>

<style scoped>
*
{
  cursor: pointer;
}

.link
{
  display: block;
  border-radius: 0.5em !important;
  opacity: 0.8 !important;
  cursor: pointer;
  transition: 0.15s;
}

.link:hover
{
  text-decoration: none;
  background: #ffffff30;
  opacity: 1;
}

</style>