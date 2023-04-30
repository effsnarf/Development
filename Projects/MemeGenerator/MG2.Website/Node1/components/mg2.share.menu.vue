<template>

<div class="meow-comp-25415">
<div :class="{ visible: isVisibleDelayed}" v-if="isVisible" class="share-menu">
<input :value="url" @click="copyToClipboard" class="fs-m3 mb-l1 clickable"/>
<component ref="alert1" is="mg2-alert" class=""></component>
<div ref="shareWidgetContainer">
<component is="mg2-share-widget" class=""></component></div></div></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25415,"name":"MG2.Share.Menu"},"rateLimit":{"isVisibleDelayed":{"timer":null,"value":null,"nextValue":null}}},"isVisible":null,"url":null}; },"computed":{"isVisibleDelayed":{"get":function() { return this.$data._meow.rateLimit.isVisibleDelayed.value },"set":function(newValue) {
            
          var rateLimit = this.$data._meow.rateLimit;
          rateLimit.newValue = newValue;
          if (rateLimit.isVisibleDelayed.timer) return;
          rateLimit.isVisibleDelayed.timer = setTimeout(() => {
            rateLimit.isVisibleDelayed.value = rateLimit.newValue;
            rateLimit.isVisibleDelayed.timer = null;
          }, 400);
        
        }}},"asyncComputed":{},"methods":{"attachShareWidget":function () {
        $($(`.mg-share-widget`).get(0)).appendTo(this.$refs.shareWidgetContainer);

      },"toggle":function (shareData) {
        if (this.isVisible)
{
  this.hide();
  return;
}

this.$root.$emit(`hide-share-menus`);

this.isVisible = true;

//this.attachShareWidget();

setTimeout(() => {
  this.$root.$emit(`set-share-data`, shareData);
}, 200);



      },"mounted":function () {
        this.$root.$on(`set-share-data`, (shareData) => {
  this.url = shareData.url;
});

this.$root.$on(`hide-share-menus`, this.hide);

      },"hide":function () {
        this.isVisible = false;

      },"copyToClipboard":async function () {
        await navigator.clipboard.writeText(this.url);

this.$refs.alert1.set(`Copied to clipboard.`);

      }},"watch":{"isVisible":{"deep":true,"immediate":true,"handler":async function(newIsVisible, oldIsVisible) {
      this.isVisibleDelayed = newIsVisible;

    }}},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    this.$root.$on(`set-share-data`, (shareData) => {
  this.url = shareData.url;
});

this.$root.$on(`hide-share-menus`, this.hide);

    
    
      },"name":"MG2-Share.Menu"}
</script>

<style scoped>
.share-menu
{
  max-height: 0;
  height: 0;
  padding: 0;
  opacity: 1;
  overflow: hidden;
  z-index: -10;
  height: 5em;
  text-align: center;
  background: #ffffff30;
  border-radius: 1em;
  box-shadow: -12px 12px 12px #00000080;
  z-index: 100;
  transition: 0.5s;
}

.share-menu.visible
{
  max-height: 10em;
  height: 10em;
  padding: 1em;
  opacity: 1;
  z-index: 10;
}

input
{
  padding: 0.5em 1em;
  color: #ffffff80;
  cursor: pointer;
}

</style>