<template>

<div class="meow-comp-25412">
<div v-if="relatedGenerators?.length" class="">
<transition name="slide-in-list" class="">
<h2 v-if="gensAreRelated" class="mb-4">See also</h2></transition>
<transition-group name="slide-in-list" tag="div" class="">
<div v-for="(generator, index) in relatedGenerators" :key="generator.generatorID" :style="{  'transition-delay': `calc(0.1s * ${index})` }" class="">
<component :generator="generator" is="mg2-generator" class=""></component></div></transition-group></div></div>
</template>
<script>
export default
{"props":{"instance":null,"generator":null,"generators":null},"data":function() { return {"_meow":{"comp":{"_id":25412,"name":"MG2.See.Also"},"rateLimit":{}},"gensAreRelated":null}; },"computed":{},"asyncComputed":{"relatedGenerators":{"get":async function() {
            let gens = [];

if (this.instance) gens.push((await this.$mgApi.Generators_Search(this.instance.displayName)));
if (this.generator) gens.push(...(await this.$mgApi.Generators_Search(this.generator.displayName)));

if (this.generators?.length > 1)
{
  let gens2 = (await Promise.all(this.generators.map(g => this.$mgApi.Generators_Search(g.displayName))));
  gens2 = gens2.flatMap(g => g);
  gens2 = gens2.sortBy(g => -g.instancesCount);
  gens.push(...gens2);
}


function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

let names = gens.map(g => g.displayName);
names = names.filter(onlyUnique);

gens = names.map(name => gens.find(g => (g.displayName == name)));

this.gensAreRelated = true;

if (!gens.length)
{
  this.gensAreRelated = false;
  gens.push(...(await this.$mgApi.Generators_Select_ByPopular()));
}

return gens;

          }}},"methods":{},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-See.Also"}
</script>

<style scoped>

</style>