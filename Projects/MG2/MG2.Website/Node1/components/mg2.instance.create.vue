<template>

<div class="meow-comp-25473">
<div v-if="generator" class="">
<component :url="`/${generator.urlName}`" is="mg2-link" class="">
<template >
<div style="gap: 1em;" class="flex">
<h4 v-text="generator.displayName" class=""></h4></div></template></component>
<div :class="{ on: showImage }" class="trans1">
<component :instance="newInstance" ref="instImg1" is="mg2-instance-image" class=""></component></div>
<div class="grid1">
<div >
<component :url="`/${generator.urlName}`" is="mg2-link" class="">
<template >
<component :instance="generator" is="mg2-instance-image" class=""></component></template>
<template ></template></component></div>
<div class="">
<input placeholder="top text" v-model="text0" type="text" class="mb-2"/>
<input placeholder="bottom text" v-model="text1" type="text" class=""/></div></div>
<div v-show="showCreateButton" class="text-center">
<select v-model="languageCode" class="">
<option v-for="language in languages" v-text="language.nativeName" :value="language.languageCode" class=""></option></select>
<div :class="{ loading: isLoading }" class="">
<button @click="createInstance">✔️ Create</button></div></div></div></div>
</template>
<script>
export default
{"props":{"generator":null,"showIfEmpty":null},"data":function() { return {"_meow":{"comp":{"_id":25473,"name":"MG2.Instance.Create"},"rateLimit":{}},"text0":null,"text1":null,"languageCode":null,"isLoading":null}; },"computed":{"showCreateButton":{"get":function() { return (this.text0 || this.text1);
 }},"showImage":{"get":function() { return (this.showIfEmpty) || (this.text0 || this.text1);
 }},"newInstance":{"get":function() { if (!this.generator) return null;

return {
  imageID: this.generator.imageID,
  template: this.generator.template,
 
  text0: this.text0,
  text1: this.text1
};
 }}},"asyncComputed":{"languages":{"get":async function() {
            return (await this.$dbp.languages.list());

          }}},"methods":{"createInstance":async function () {
        let attempts = 4;
let instance = null;

let createInst = async () => {
  return (await this.$dbp.api.instances.create.one(this.languageCode, this.generator.generatorID, this.generator.imageID, this.text0, this.text1));
}

this.isLoading = true;

try
{
  while ((!instance) && (attempts--))
  {
    instance = await createInst();
    await new Promise(r => setTimeout(r, 400));
  }
}
finally
{
  this.isLoading = false;
}

if (!instance)
{
  alertify.error(`An error occurred. Try again later.`);
  return;
}

this.text0 = null;
this.text1 = null;

let url = `/instance/${instance.instanceID}/${util.toUrlFriendly(this.getInstanceText(instance))}`;

this.$parent.$parent.$parent.$refs.nav1.goto(url);


      },"getInstanceText":function (instance) {
        if (!instance) return null;

return [instance.text0, instance.text1]
  .filter(s => s)
  .join(` - `);

      },"toFriendlyNumber":function (number) {
        return util.number.friendly(number);

      }},"watch":{"languageCode":{"deep":true,"immediate":false,"handler":async function(value, oldValue) {
              var timerKey = 'languageCode_persisted_save_timer';
              clearTimeout(this[timerKey]);
              this[timerKey] = setTimeout(async () => {
                var func = (async function(newLanguageCode) { this.$localStorage.setItem(`languageCode`, newLanguageCode);
 }).bind(this);
                await func(value);
              }, 400);
            }},"showCreateButton":{"deep":true,"immediate":true,"handler":async function(newShowCreateButton, oldShowCreateButton) {
      this.$emit(`active`, newShowCreateButton);

    }}},"mounted":async function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    this.languageCode = (await (async function() {
      return (this.$localStorage.getItem(`languageCode`) || `en`);

    }.bind(this))());
    
    
    
    
    
      },"name":"MG2-Instance.Create"}
</script>

<style scoped>
input[type=text]
{
  font-size: 120%;
  text-align: center;
  text-transform: uppercase;
}

.grid1
{
  display: grid;
  grid-template: 1fr / 3.6em 1fr;
  grid-gap: 1em;
}

.trans1
{
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  margin-bottom: 0.5em;
  transition: 1s;
}
.trans1.on
{
  max-height: 30em;
  opacity: 1;
}

</style>