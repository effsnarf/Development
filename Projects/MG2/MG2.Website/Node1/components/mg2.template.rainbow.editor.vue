<template>

<div v-if="item" class="meow-comp-25481">
<div class="">
<div style="gap: 1em;" class="flex flex-column">
<div class="">
<component v-model="item.image.mgImage" ref="imagePicker1" is="mg2-input-image" class=""></component></div>
<div class="flex justify-around">
<component @input="onChange" v-model="item.colors[0]" is="mg2-input-color" class=""></component>
<component @input="onChange" v-model="item.colors[1]" is="mg2-input-color" class=""></component></div>
<div class="">
<component :min="1" :max="24" @input="onChange" v-model="item.areas" title="areas" is="mg2-input-range" class=""></component>
<component :min="1" :max="24" @input="onChange" v-model="item.shades" title="shades" is="mg2-input-range" class=""></component>
<component :min="0" :max="360" title="rotate" :show-number="false" v-model="item.rotate" is="mg2-input-range" class=""></component>
<component min="0" max="100" title="blur" v-model="item.blur" :show-number="false" is="mg2-input-range" class=""></component></div>
<div class="">
<div class="flex mt-l1 toggle-image-fit">
<input type="checkbox" @input="toggleImageFit" :title="(item.image.fit || 'contain')" class="w-l3 cursor-pointer"/>
<div v-text="(item.image.fit || 'contain')" class=""></div></div></div></div></div></div>
</template>
<script>
export default
{"props":{"value":null},"data":function() { return {"_meow":{"comp":{"_id":25481,"name":"MG2.Template.Rainbow.Editor"},"rateLimit":{}},"item":null}; },"computed":{},"asyncComputed":{},"methods":{"onChange":function () {
        this.$emit(`input`, this.item);


      },"toggleImageFit":function () {
        this.item.image.fit = (this.item.image.fit == `contain`) ? `cover` : `contain`;

this.onChange();

      },"pickImage":function () {
        this.$refs.imagePicker1.openDialogue();

      }},"watch":{"value":{"deep":true,"immediate":true,"handler":async function(newValue, oldValue) {
      this.item = newValue;

    }}},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Template.Rainbow.Editor"}
</script>

<style scoped>
@media (max-width: 1400px)
{
  .toggle-image-fit
  {
    display: none;
  }
}

</style>