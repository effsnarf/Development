<template>

<div v-if="instance" class="meow-comp-25414">
<div :key="key1" class="">
<div class="optimized-instance-container img">
<div ref="image1" :class="`${(imageCssClass || `w-100pc`)}`" class="">
<component :item="instance.template" v-if="instance.template" @load="onImageLoaded" is="mg2-template-rainbow" class=""></component>
<img :src="`https://img.memegenerator.net/images/${instance.imageID}.jpg`" @load="onImageLoaded" v-if="!instance.template" :class="`${(imageCssClass || `w-100pc`)}`" class=""/></div>
<div :style="`font-size: ${getFontSize(instance.text0)}em !important`" v-text="instance.text0" v-if="showText" class="optimized-instance-text0"></div>
<div :style="`font-size: ${getFontSize(instance.text1)}em !important`" v-text="instance.text1" v-if="showText" class="optimized-instance-text1"></div></div></div></div>
</template>
<script>
export default
{"props":{"instance":null,"showText":{"default":true},"imageCssClass":null},"data":function() { return {"_meow":{"comp":{"_id":25414,"name":"MG2.Instance.Image"},"rateLimit":{}},"width":null,"key1":0}; },"computed":{},"asyncComputed":{},"methods":{"getFontSize":function (s) {
        if (!s) return 0;
if (!this.width) return 0;

return Math.max(14, (36 - (s.length / 6))) / 50 *  this.width / 150;

      },"onImageLoaded":function (e) {
        this.$emit(`load`);

this.recalc();

      },"refresh":function () {
        this.recalc();

this.key1++;

      },"mounted":function () {
        window.addEventListener(`resize`, function(event) {
  this.refresh();
}.bind(this));

      },"recalc":function () {
        if (!this.$refs.image1) return;

let rect = this.$refs.image1.getBoundingClientRect();

this.width = Math.round(rect.width);

      }},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    window.addEventListener(`resize`, function(event) {
  this.refresh();
}.bind(this));

    
    
      },"name":"MG2-Instance.Image"}
</script>

<style scoped>
img
{
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.5em;
  box-shadow: -10px 10px 10px #000000a0;
}

.optimized-instance-container {
  position: relative;
}

.optimized-instance-text0, .optimized-instance-text1 {
    position: absolute;
    text-align: center;
    display: block;
    width: 100%;
    top: 0px;
    overflow: hidden;
    color: white;
    line-height: 1.2em;
    font-family: Impact, Oswald;
    text-transform: uppercase;
    text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000;
    -webkit-font-smoothing: antialiased;
    box-sizing: border-box;
    padding: 0.3em;
}

.optimized-instance-text1
{
    top: initial;
    bottom: 0px;
}

</style>