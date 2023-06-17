<template>

<div :class="(cssClass || 'w-100pc')" class="meow-comp-25344">
<img :src="imageSrc" @load="$emit('load')" class="object-cover w-100pc"/></div>
</template>
<script>
export default
{"props":{"src":null,"imageID":null,"cssClass":null,"square":null,"mgImage":null},"data":function() { return {"_meow":{"comp":{"_id":25344,"name":"MG2.Image"},"rateLimit":{}},"isImageLoaded":null}; },"computed":{"imageSrc":{"get":function() { return this.getImageSrc();
 }}},"asyncComputed":{},"methods":{"getImageSrc":function () {
        if (this.src) return this.src;

if (this.imageID) return `https://img.memegenerator.net/images/${this.imageID}.jpg`;

if (this.mgImage) return `https://img.memegenerator.net/images/${this.mgImage._id}.${this.mgImage.ext || `jpg`}`;

      }},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Image"}
</script>

<style scoped>
img
{
  aspect-ratio: 1;
  background: #ffffff80;
  border-radius: 0.5rem;
  box-shadow: -0.3em 0.3em 0.2em #00000060;
}

</style>