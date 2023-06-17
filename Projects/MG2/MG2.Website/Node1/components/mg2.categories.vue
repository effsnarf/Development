<template>

<div class="meow-comp-25470">
<transition-group tag="div" name="slide-in-grid" class="gallery1">
<div v-for="(category, index) in visibleCategories" :key="category.name" :style="{ 'transition-delay': `calc(0.05s * ${index})` }" class="">
<component :category="category" :is-selected="(selectedCategory?.name == category.name)" is="mg2-category" class=""></component></div></transition-group></div>
</template>
<script>
export default
{"props":{"selectedCategory":null,"visible":null},"data":function() { return {"_meow":{"comp":{"_id":25470,"name":"MG2.Categories"},"rateLimit":{}}}; },"computed":{"visibleCategories":{"get":function() { if (this.visible) return this.categories;

return [];
 }}},"asyncComputed":{"categories":{"get":async function() {
            return (await this.$dbp.api.categories.all.get());

          }}},"methods":{},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Categories"}
</script>

<style scoped>
.gallery1
{
  display: flex;
  gap: 1em;
  flex-wrap: wrap;
}

.gallery1 > div
{
  width: calc(50% - 1em);
}

@media (max-width: 1400px)
{
  .gallery1
  {
    grid-template: 1fr / 1fr 1fr 1fr;
  }
}

@media (max-width: 900px)
{
  .gallery1
  {
    grid-template: 1fr / 1fr 1fr;
  }
}




</style>