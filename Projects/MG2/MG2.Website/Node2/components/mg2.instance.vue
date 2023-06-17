<template>

<div v-if="instance" class="meow-comp-25341">
<div class="mg-instance">
<component :show-frame="showButtons" is="mg2-box" class="">
<template >
<component :url="getInstanceUrl(instance)" target="_blank" is="mg2-link" class="">
<template >
<div @click="handleClick" class="">
<component :instance="instance" @load="onInstanceImageLoaded" ref="instanceImage1" is="mg2-instance-image" class=""></component>
<div v-if="(showButtons &amp;&amp; instance.commentsCount)" class="speech-bubble m-auto">
<span v-text="instance.commentsCount" class="comments-count"></span></div></div></template></component></template></component>
<div v-if="showButtons" class="">
<div style="grid-template: 1fr / 1fr 0fr 1fr;" class="grid mt-2">
<div class="flex">
<component :generator="instance" :show-title="false" image-css-class="h-100pc" is="mg2-generator" class="mt-2 clickable w-l2"></component>
<component :share-data="shareData" is="mg2-share-widget" class="mt-2 ml-l2"></component></div>
<div class=""></div>
<div class="flex">
<component :item="instance" style="margin-top: 0.3em;" is="mg2-voter" class=""></component></div></div>
<div class="">
<component ref="shareMenu1" is="mg2-share-menu" class=""></component></div></div></div></div>
</template>
<script>
export default
{"props":{"instance":null,"showButtons":{"default":true},"onClick":null,"clickable":{"default":true}},"data":function() { return {"_meow":{"comp":{"_id":25341,"name":"MG2.Instance"},"rateLimit":{}},"isImageLoaded":null}; },"computed":{"shareData":{"get":function() { if (!this.instance) return null;

return this.getShareData();
 }}},"asyncComputed":{},"methods":{"share":function () {
        navigator.share(this.shareData);

      },"handleClick":function (e) {
        if (!this.clickable)
{
  e.preventDefault();
  return false;
}

if (!this.onClick) return;

e.preventDefault();
e.stopPropagation();

this.$root.$emit(`something-click`);

this.onClick(this.instance);

      },"onInstanceImageLoaded":function () {
        this.isImageLoaded = true;


      },"getShareData":function () {
        if (!this.instance) return null;

let instanceImageUrl = `https://img.memegenerator.net/instances/${this.instance.instanceID}.jpg`;

return {
    title: this.instance.displayName,
    text: [this.instance.text0, this.instance.text1].filter(s => s).join(` `),
    url: this.getInstanceUrl(this.instance),
    //url: instanceImageUrl,
    imageUrl: instanceImageUrl
};


      },"onShareClick":function () {
        let shareData = this.getShareData();

this.$refs.shareMenu1.toggle(shareData);

      },"getInstanceUrl":function (instance) {
        let text = [instance.text0, instance.text1].join(` `);
text = util.removeDuplicateSpaces(text);
text = util.toUrlFriendly(text);

let url = `https://memegenerator.net/instance/${instance.instanceID}`;//${text}`;


return url;


      },"head":function () {
        
      },"mounted":function () {
        this.shareData = this.getShareData();

      }},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    this.shareData = this.getShareData();

    
    
      },"name":"MG2-Instance"}
</script>

<style scoped>
* {
  font-size: 1.2rem;
}

.mg-instance
{
  max-width: 30em;
}

.inst-fade-in {
  opacity: 0;
  transition: 1s;
}

.inst-fade-in.on {
  opacity: 1;
}

.speech-bubble {
  width: 2.5em;
  height: 2em;
  background: url(/img/speech-bubble.png);
  background-size: 100% 100%;
  position: absolute;
  bottom: -0em;
  right: -0.6em;
  padding-right: 0.2em;
  opacity: 0.8;
  filter: drop-shadow(-4px 3px 2px black);
  z-index: 10;
}

.selected .speech-bubble {
  opacity: 1;
}

.comments-count {
  display: block;
  color: black;
  text-shadow: none;
  text-align: center;
  font-size: 1.1em;
  font-weight: bold;
  padding: 0.1em 0 0.5em 0;
}

.clickable {
  opacity: 0.7;
}

.clickable:hover {
  opacity: 1;
}
</style>