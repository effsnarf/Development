<template>

<div class="meow-comp-25335">
<div class="">
<div class="page-width items-center">
<div class="header-grid">
<component is="mg2-logo" class=""></component>
<div class="leaderboard my-1 mx-l1">
<div :style="getMgBannerStyleObj()" class="hero-image"></div></div>
<div class="h-l4 flex-grow-1 text-right">
<a target="_blank" href="https://play.google.com/store/apps/details?id=meme.generator" class="">
<img src="/img/google-play-logo.png" class="h-100pc"/></a></div></div>
<div class=""></div></div></div></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25335,"name":"MG2.Header"},"rateLimit":{}}}; },"computed":{"heroImageUrl":{"get":function() { var bannerID = Math.round(Math.random() * 26);

return `/img/banners/(${bannerID}).jpg`;

 }}},"asyncComputed":{"categories":{"get":async function() {
            return (await this.$dbp.api.categories.all.get());

          }}},"methods":{"getMgBannerStyleObj":function () {
        return {
  background: `url("${this.heroImageUrl}")`
};

      },"getCategoryImageID":function (category) {
        let imgs = category.imageIDs;

let index = Math.round(Math.random() * (imgs.length - 1));

return imgs[index];

      }},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Header"}
</script>

<style scoped>
*
{
  color: white;
}

a:hover {
  text-decoration: underline;
}

.category-link
{
  opacity: 0.8;
}
.category-link:hover
{
  opacity: 1;
}

.category-title
{
  width: 4em;
  overflow: hidden;
  text-align: center;
  opacity: 0.5;
}
a:hover .category-title
{
  opacity: 1;
}

.header-grid
{
  display: grid;
  grid-template: 1fr / 10em 1fr 6em;
  align-items: center;
  width: min(1280px, min(100vw, calc(100vw - 320px - 2em)));
  margin: auto;
}

@media (max-width: 1200px) {
  .header-grid
  {
    width: 100%;
  }
}

@media (max-width: 1000px) {
  .header-grid
  {
    grid-template: 1fr / 10em 1fr 5em;
  }
  .leaderboard
  {
    visibility: hidden;
    width: 1em !important;
  }
}

@media (max-width: 1300px) {
  .header-grid
  {
    padding: 0 1em;
  }
}

.leaderboard
{
  width: 100%;
  height: 90px;
}

.hero-image
{
  width: calc(100% - 4em);
  height: calc(100% - 1em);
  margin: 0.3em 0 0 3em;
  filter: grayscale(1);
  border-radius: 0.5em;
  background-size: cover !important;
  background-position: 50% 30% !important;
}

</style>