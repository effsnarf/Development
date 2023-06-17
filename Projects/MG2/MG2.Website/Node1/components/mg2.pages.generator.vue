<template>

<div class="meow-comp-25509">
<component is="mg2-page" class="">
<template v-slot:main="" v-if="generator" class="">
<div style="gap: 2em;" class="flex flex-column">
<div ref="titleBanner" class="title-banner">
<div class="">
<component :image-i-d="generator.imageID" css-class="title-image" is="mg2-image" class=""></component></div>
<div v-if="titleInstance" class="title-text">
<div v-text="getTitleText()" class=""></div>
<div v-text="`- ${generator.displayName}`" style="transition-delay: 1s;" class="title-signature"></div></div></div>
<div style="gap: 2em;" class="flex mt-l2">
<div class=""></div>
<div v-for="generator in generators?.slice(0, 6)" class="">
<component :generator="generator" :show-title="false" image-css-class="small-generator" is="mg2-generator" class="flex-equal"></component></div></div></div></template></component></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25509,"name":"MG2.Pages.Generator"},"rateLimit":{}},"urlName":null}; },"computed":{},"asyncComputed":{"generator":{"get":async function() {
            if (!this.urlName) return null;

return (await MgApi.Generator_Select_ByUrlNameOrGeneratorID(null, this.urlName));

          }},"titleInstance":{"get":async function() {
            if (!this.urlName) return null;

let insts = (await MgApi.Instances_Select_ByPopular(`en`, null, this.urlName));

let index = Math.round(Math.random() * (insts.length - 1));

return insts[index];


          }},"chart":{"get":async function() {
            if (!this.generator) return null;

return (await this.$dbp.api.generators.select.chart(this.generator.generatorID));

          }},"generators":{"get":async function() {
            if (!this.generator) return null;

let gens = (await this.$mgApi.Generators_Search(this.generator.displayName));

gens = gens.filter(g => (g.generatorID != this.generator.generatorID));

return gens;
          }},"instances":{"get":async function() {
            if (!this.generator) return [];

let insts = (await this.$mgApi.Instances_Select_ByPopular(`en`, null, this.generator.urlName));

return insts;

          }}},"methods":{"getTitleText":function () {
        let tit = this.titleInstance;

let text = [tit.text0, tit.text1]
  .filter(s => s)
  .join(`, `);

text = text.toLowerCase();

text = `${text[0].toUpperCase()}${text.substr(1)}`;

if (!text.endsWith(`.`)) text += `.`;

return text;

      },"mounted":function () {
        
      },"trackSticky":function () {
        setInterval(() => {
  let el = this.$refs.titleBanner;
  if (!el) return;

  let rect = el.getBoundingClientRect();

  if (rect.top < 220) $(el).addClass(`stickied`); else $(el).removeClass(`stickied`);
}, 100);

      }},"watch":{"generator":{"deep":true,"immediate":false,"handler":async function(newGenerator, oldGenerator) {
      if (newGenerator)
{
  setTimeout(this.trackSticky.bind(this), 0);
}

    }}},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
      var eventName = `ide-route-param-changed-urlName`;
      var handler = (value) => { this.urlName = value; };
      this.$parent.$on(eventName, handler);
      
this.urlName = this.$route?.params.urlName;
    
    
    
    
    
      },"name":"MG2-Pages.Generator"}
</script>

<style scoped>
*
{
  transition: 1s;
}

.chart
{
  width: 20em;
  aspect-ratio: 6 / 3;
  border: 3px solid white;
}

.title-banner
{
  max-height: 30em;
  overflow: hidden;
  position: sticky;
  top: 7em;
  z-index: 1000;
}

.title-banner.stickied
{
  max-height: 12em;
  padding: 1em;
  background: black;
}
.title-banner.stickied .title-image
{
  width: 10em;
  height: 10em;
}
.title-banner.stickied .title-text,
.title-banner.stickied .title-signature
{
  opacity: 0;
}

.title-image
{
  display: flex;
  width: 30em;
  height: 25em;
  border-radius: 3em;
  box-shadow: -6px 6px 6px black;
}

.title-text
{
  position: absolute;
  top: 100%;
  left: 3em;
  font-family: Qwigley;
  font-size: 6rem;
  line-height: 0.9em;
  text-shadow: -10px 10px 4px black;
  transform: translateY(-100%);
}

.title-signature
{
  text-align: right;
  font-size: 4rem;
  opacity: 0.5;
  margin-top: 0.1em;
}

.small-generator
{
  height: 7em;
  filter: grayscale(1);
}

.small-generator:hover
{
  filter: none;
}


</style>