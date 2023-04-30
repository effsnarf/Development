<template>

<div v-if="generator" class="meow-comp-25343 generator">
<div class="generator">
<div v-if="!showTitle" class="h-100pc">
<component :url="`/${generator.urlName}`" is="mg2-link" class="">
<template >
<component :instance="generator" :show-text="false" :image-css-class="imageCssClass" is="mg2-instance-image"></component></template>
<template ></template>
<template >
<div v-if="showName" class="text-center">
<div v-text="`${generator.displayName}`" class="display-name"></div>
<div v-text="util.number.friendly(generator.instancesCount, 0)" class="opacity-50 instances-count"></div></div></template></component></div>
<div v-if="showTitle" class="">
<component :url="`/${generator.urlName}`" is="mg2-link">
<template >
<div class="generator-grid">
<div class="">
<component :instance="generator" :show-text="false" :image-css-class="imageCssClass" is="mg2-instance-image" class=""></component></div>
<div :class="(largeTitle ? 'fs-m4' : '')" class="generator-title">
<div v-text="generator.displayName" v-if="(!subTitle)" class="generator-name"></div>
<div v-text="subTitle" v-if="subTitle" class="opacity-50 fs-m1 generator-subtitle"></div>
<div v-text="util.number.friendly(generator.instancesCount, 0)" v-if="generator.instancesCount" class="opacity-50 generator-instances-count"></div></div></div></template></component></div></div></div>
</template>
<script>
export default
{"props":{"generator":null,"showTitle":{"default":true},"showName":null,"imageCssClass":null,"largeTitle":null,"subTitle":null},"data":function() { return {"_meow":{"comp":{"_id":25343,"name":"MG2.Generator"},"rateLimit":{}}}; },"computed":{"util":{"get":function() { return window.util;
 }}},"asyncComputed":{},"methods":{},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Generator"}
</script>

<style scoped>
.generator {
  margin-bottom: 0.5em;
}

.generator-name {
  line-height: 1.3em;
}

.generator-grid {
  display: grid;
  grid-template: 1fr / 25% 1fr;
  gap: 1em;
}

.generator .link {}

.generator .link:hover {
  box-shadow: -4px 4px 4px #00000080;
}

.generator-subtitle {}
</style>