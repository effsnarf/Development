<template>

<div class="meow-comp-25480">
<component title="Create a new character" :padded="true" is="mg2-box" class="">
<template >
<div style="gap: 1em;" class="grid">
<component v-model="template" @input="onChange" ref="rainbowEditor1" is="mg2-template-rainbow-editor" class=""></component>
<div @click="$refs.rainbowEditor1.pickImage()" class="cursor-pointer">
<component style="" :item="template" is="mg2-template-rainbow" class=""></component></div>
<div class="">
<a target="_blank" href="https://www.remove.bg/" style="white-space: nowrap" title="remove background" class="block text-center mt-3">❌bg 🔗</a></div>
<div class="">
<component hint="name your character…" text-transform="capitalize" v-model="displayName" is="mg2-input-text" class="fs-m3"></component>
<transition name="slide-in-list" class="">
<div v-if="existingGenerator" style="max-width: 20em;" class="mt-3">
<component :generator="existingGenerator" :large-title="true" is="mg2-generator" class=""></component></div></transition>
<transition name="slide-in-list" class="">
<div v-if="error" v-html="error" class="error mt-3"></div></transition>
<transition name="slide-in-list" class="">
<div v-if="canCreate" class="text-center mt-4">
<button @click="create" :class="{ loading: isCreating }" class="">✔️ Create</button></div></transition></div></div></template></component></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25480,"name":"MG2.Generator.Create"},"rateLimit":{"displayNameDelayed":{"timer":null,"value":null,"nextValue":null}}},"template":{"colors":["#ff0000","#ffff00"],"areas":6,"shades":6,"rotate":90,"blur":0,"image":{"mgImage":{"_id":73527769,"ext":"png"},"fit":"contain","pos":{"x":0,"y":0},"size":1}},"displayName":null,"error":null,"existingGenerator":null,"isCreating":null,"sessionKey":null}; },"computed":{"displayNameDelayed":{"get":function() { return this.$data._meow.rateLimit.displayNameDelayed.value },"set":function(newValue) {
            
          var rateLimit = this.$data._meow.rateLimit;
          var newValue2 = newValue;
          clearTimeout(rateLimit.displayNameDelayed.timer);
          rateLimit.displayNameDelayed.timer = setTimeout(() => {
            rateLimit.displayNameDelayed.value = newValue2;
          }, 400);
        
        }}},"asyncComputed":{"canCreate":{"get":async function() {
            if (!(await this.isDisplayNameValid(this.displayNameDelayed))) return false;

return true;

          }}},"methods":{"onChange":function () {
        
      },"isDisplayNameValid":async function (s) {
        this.error = null;
this.existingGenerator = null;

if (!s) return false;

let s2 = util.toUrlFriendly(s);

let generator = (await this.$dbp.api.generators.select.one(null, s2));

if (Object.keys(generator||{}) == 0) return true;

this.existingGenerator = generator;

this.error = `A character called <strong>${s}</strong> already exists.`;

return false;

      },"create":async function () {
        this.isCreating = true;

try
{
  let template = {...{ type: `rainbow` }, ...this.template};

  let generator = (await this.$dbp.api.generators.create.one(this.sessionKey, template, this.displayNameDelayed));

  this.$root.$emit(`goto`, `/${generator.urlName}`);
}
finally
{
  this.isCreating = false;
}

      },"mounted":function () {
        this.$root.$on(`login-session-key`, (sessionKey) => {
  this.sessionKey = sessionKey;
});

      },"toggleImageFit":function () {
        this.template.image.fit = (this.template.image.fit == `contain`) ? `cover` : `contain`;

      }},"watch":{"displayName":{"deep":true,"immediate":false,"handler":async function(newDisplayName, oldDisplayName) {
      this.error = null;
this.existingGenerator = null;

this.displayNameDelayed = newDisplayName;

    }}},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    this.$root.$on(`login-session-key`, (sessionKey) => {
  this.sessionKey = sessionKey;
});

    
    
      },"name":"MG2-Generator.Create"}
</script>

<style scoped>
.grid
{
  grid-template: 1fr / 1fr 3fr;
}

</style>