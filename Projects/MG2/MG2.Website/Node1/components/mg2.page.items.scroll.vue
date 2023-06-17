<template>

<div class="meow-comp-25413">
<component :class="" :is-content-centered="(!selectedInstance)" ref="mg2Page" is="mg2-page" class="">
<template v-slot:sidebar-large="" class="">
<div v-show="(!selectedInstance)" class="">
<slot name="sidebar-large" v-slot:sidebar-large="" class=""></slot></div></template>
<template v-slot:body="" class="">
<component :get-items="loadMoreItems" :item-props="getInstanceProps()" ref="gallery1" :selected-item="selectedInstance" is="mg2-gallery-infinite-scroll"></component></template>
<template v-slot:sidebar-right="" class="">
<slot name="sidebar-right" class=""></slot>
<div v-if="selectedInstance" class="">
<div class="mb-5">
<component :generator="selectedInstance" ref="createInst1" @active="showComments=(!$event)" is="mg2-instance-create" class=""></component></div>
<div v-show="showComments" class="">
<div v-text="getInstanceText(selectedInstance)" class="instance-text"></div>
<component entity-name="Instance" :entity-i-d="selectedInstance?.instanceID" v-if="selectedInstance" is="mg2-comments" class=""></component></div></div></template>
<template v-slot:sidebar-righter="" class="">
<component :instance="selectedInstance" v-if="showSelectedInstanceRelatedGenerators" is="mg2-see-also" class=""></component>
<slot name="sidebar-righter" class=""></slot></template></component></div>
</template>
<script>
export default
{"props":{"loadMoreItems":null,"showSelectedInstanceRelatedGenerators":{"default":true}},"data":function() { return {"_meow":{"comp":{"_id":25413,"name":"MG2.Page.Items.Scroll"},"rateLimit":{}},"selectedInstance":null,"showComments":true,"showCaptionForm":null}; },"computed":{},"asyncComputed":{},"methods":{"onInstanceClick":function (instance) {
        if (instance == this.selectedInstance) instance = null;

this.selectedInstance = null;

this.$nextTick(() => {
  this.selectedInstance = instance;
});

      },"getInstanceProps":function () {
        return { onClick: this.onInstanceClick };

      },"clear":function () {
        this.$refs.gallery1?.clear();

      },"getInstanceText":function (inst) {
        return [inst.text0, inst.text1]
  .join(` - `);

      }},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Page.Items.Scroll"}
</script>

<style scoped>
.instance-text
{
  opacity: 0.7;
  margin-top: 1em;
  font-size: 140%;
}

</style>