<template>

<div class="meow-comp-25469">
<div v-if="category" :class="{ selected: isSelected }" class="category">
<component :url="`/category/${category.name}`" is="mg2-link" class="">
<template >
<div class="">
<component :image-i-d="getImageID(category)" :square="true" is="mg2-image" class=""></component></div></template>
<template >
<div v-text="category.name.split(` `).reverse()[0]" class="text-center fs-m2"></div></template></component></div></div>
</template>
<script>
export default
{"props":{"category":null,"isSelected":null},"data":function() { return {"_meow":{"comp":{"_id":25469,"name":"MG2.Category"},"rateLimit":{}}}; },"computed":{},"asyncComputed":{},"methods":{"mounted":function () {
        this.categoryName = window.location.href.split(`/`).reverse()[0];

      },"getImageID":function (category) {
        let imageIDs = category.imageIDs;

return imageIDs[Math.round(Math.random() * (imageIDs.length - 1))];

      }},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    this.categoryName = window.location.href.split(`/`).reverse()[0];

    
    
      },"name":"MG2-Category"}
</script>

<style scoped>
.category
{
  filter: grayscale(1);
  opacity: 0.8;
}

.category:hover
{
  filter: none;
  opacity: 1;
}

.category.selected
{
  filter: none;
  opacity: 1;
  box-shadow: -10px 10px 10px #000;
}


</style>