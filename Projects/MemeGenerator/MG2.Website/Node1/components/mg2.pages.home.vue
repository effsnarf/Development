<template>

<div class="meow-comp-25508">
<component is="mg2-page" class="">
<template v-slot:main="" class="">
<component :url="`/${item}`" v-for="item in [`Courage-Wolf`, `Insanity-Wolf`, `Foul-Bachelor-Frog`, `Y-U-No`]" is="mg2-link" class="">
<template >
<h2 v-text="item" class=""></h2></template></component></template></component></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25508,"name":"MG2.Pages.Home"},"rateLimit":{}}}; },"computed":{},"asyncComputed":{},"methods":{},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Pages.Home"}
</script>

<style scoped>

</style>