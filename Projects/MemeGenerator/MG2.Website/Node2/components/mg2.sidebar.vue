<template>

<div style="" class="meow-comp-25340">
<div class="">
<div class="">
<component is="mg2-user-menu" class=""></component>
<component url="/create/generator" is="mg2-link" class="">
<template >
<span class="flex button justify-around">
<span class="">👤</span>
<span class="">Create a Meme</span>
<span class="">➕</span></span></template></component></div>
<div class="">
<div class="flex mb-2 fs-m1">
<div class="mr-1">🔎</div>
<input type="search" placeholder="memes…" v-model="query" class="px-2"/></div>
<transition-group name="slide-in-list" class="">
<div v-for="(generator, index) in generators1" :key="generator.generatorID" :style="{  'transition-delay': `calc(0.1s * ${index})` }" class="">
<component :generator="generator" is="mg2-generator" class=""></component></div></transition-group></div></div></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25340,"name":"MG2.Sidebar"},"rateLimit":{"queryDelayed":{"timer":null,"value":null,"nextValue":null}}},"generators1":null,"query":null,"isSearching":null}; },"computed":{"queryDelayed":{"get":function() { return this.$data._meow.rateLimit.queryDelayed.value },"set":function(newValue) {
            
          var rateLimit = this.$data._meow.rateLimit;
          rateLimit.newValue = newValue;
          if (rateLimit.queryDelayed.timer) return;
          rateLimit.queryDelayed.timer = setTimeout(() => {
            rateLimit.queryDelayed.value = rateLimit.newValue;
            rateLimit.queryDelayed.timer = null;
          }, 400);
        
        }}},"asyncComputed":{},"methods":{"mounted":async function () {
        this.generators1 = (await this.search(null));

      },"search":async function (query) {
        this.isSearching = true;

try
{
  if (!query) return [];
  //if (!query) return (await this.$mgApi.Generators_Select_ByPopular());

  return (await this.$dbp.api.generators.select.search(query));
}
finally
{
  this.isSearching = false;
}


      }},"watch":{"query":{"deep":true,"immediate":false,"handler":async function(newQuery, oldQuery) {
      this.queryDelayed = newQuery;

    }},"queryDelayed":{"deep":true,"immediate":true,"handler":async function(newQueryDelayed, oldQueryDelayed) {
      this.generators1 = (await this.search(newQueryDelayed));

    }}},"mounted":async function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    this.generators1 = (await this.search(null));

    
    
      },"name":"MG2-Sidebar"}
</script>

<style scoped>
.button
{
  display: block;
  width: 100%;
  height: auto;
  padding: 0.5em;
  margin-bottom: 1em;
  border-radius: 0.5em;
  opacity: 0.7;
  font-size: 1em;
}

.button:hover
{
  opacity: 1;
  text-decoration: none;
}

</style>