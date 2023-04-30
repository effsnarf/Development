<template>

<div v-if="mgUser" class="meow-comp-25407">
<component :url="`/user/${mgUser.mgUserID}`" is="mg2-link" class="">
<template >
<div class="flex">
<div >
<component :image-i-d="mgUser.imageID" css-class="w-l2" is="mg2-image" class=""></component></div>
<h2 v-text="mgUser.username" class="ml-2"></h2>
<div v-if="showClearButton" class="flex-grow-1 text-right">
<button @click.stop.prevent="$emit('clear')" class="float-right">✗</button></div></div></template></component></div>
</template>
<script>
export default
{"props":{"mgUser":null,"showClearButton":null},"data":function() { return {"_meow":{"comp":{"_id":25407,"name":"MG2.User"},"rateLimit":{}}}; },"computed":{},"asyncComputed":{},"methods":{},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-User"}
</script>

<style scoped>

</style>