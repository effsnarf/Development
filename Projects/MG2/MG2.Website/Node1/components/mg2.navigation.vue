<template>

<div style="max-height: 8em;" class="meow-comp-25358">
<div style="grid-template: 1fr / 1fr 1fr 1fr;" class="grid">
<div class="">
<div class=""></div>
<div v-for="url in history" class="">
<a v-text="url" :href="url" @click.prevent.stop="goto(url)" class="white block"></a></div></div>
<div v-if="(!history?.length)" class="">
<div v-for="link in links" class="">
<button v-text="link" @click="goto(link)" class="w-100pc"><!-- Futurama-Fry --></button></div></div>
<div class="">
<div v-text="`pageName: ${pageName}`" class=""></div>
<div v-text="`instanceID: ${instanceID}`" class=""></div>
<div v-text="`urlName: ${urlName}`" class=""></div></div>
<div class="">
<input v-model="url" :disabled="true" class=""/></div></div></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25358,"name":"MG2.Navigation"},"rateLimit":{}},"url":null,"links":null,"urlName":null,"pageName":null,"instanceID":null,"history":null,"mgUserID":null,"mgUserContentEntity":null,"categoryName":null}; },"computed":{},"asyncComputed":{},"methods":{"mounted":function () {
        
this.links = [];

this.links.push(`/`);
this.links.push(`/Futurama-Fry`);
this.links.push(`/Insanity-Wolf`);
this.links.push(`/instance/23169557`);

Object.keys(this._data).forEach(prop => {
  this.$watch(prop, (value) => {
    if ((prop == `pageName`) && (!value)) return;
    this.$parent.$emit(`ide-route-param-changed-${prop}`, value);
  });
});


window.addEventListener('popstate', (e) => {
  this.url = e.state.url;
});


if (this.$route)
{
  if (typeof(history) != `undefined`) this.goto(this.$route.path);
}


this.$root.$on(`goto`, (url) => {
  this.goto(url);
});


window.mgPopNav = (url) => {
  this.url = url;
};


      },"goto":function (url) {
        history.pushState({url: url}, null, url);

this.url = url;

      },"onUrlChanged":function (url) {
        this.pageName = ``;
this.mgUserID = null;
this.mgUserContentEntity = null;
this.instanceID = null;
this.urlName = null;

if (!url) return;

this.$root.$emit(`page-view`, url);

if (!this.history?.includes(url)) this.history.push(url);


if (url == `/login`)
{
  this.pageName = `login`;
  return;
}

if (url.startsWith(`/user/`))
{
  this.mgUserID = parseInt(url.substr(`/user/`.length));
  this.mgUserContentEntity = (url.substr(`/user/${this.mgUserID}/`.length) || `instances`)
    .toLowerCase()
    .replace(`memes`, `generators`)
    .replace(`posts`, `instances`);
  this.pageName = `user`;
  return;
}

if (url == `/create/generator`)
{
  this.urlName = null;
  this.pageName = `create-generator`;
  return;
}

if (url == `/create/instance`)
{
  this.urlName = null;
  this.pageName = `create-instance`;
  return;
}

if (url.endsWith(`/caption`))
{
  this.urlName = url.getRegexMatches(`/(.+)/`, 1)[0];
  this.pageName = `create-instance`;
  return;
}

if (url.startsWith(`/instance/`))
{
  this.instanceID = parseInt(url.split(`/`)[2]);
  this.pageName = `instance`;
  return;
}

if (url.startsWith(`/category/`))
{
  this.urlName = null;
  this.categoryName = (url.split(`/`)[2]);
  this.pageName = `category`;
  return;
}

if (url.startsWith(`/privacy-policy`))
{
  this.pageName = `privacy-policy`;
  return;
}

// '/Generator'
if (url.length > 1)
{
  this.urlName = url.split(`/`)[1];
  this.pageName = `generator`;
  return;
}

this.pageName = `home`;


      }},"watch":{"url":{"deep":true,"immediate":true,"handler":async function(newUrl, oldUrl) {
      setTimeout(() => {
  this.onUrlChanged(newUrl);
}, 100);

    }},"history":{"deep":true,"immediate":false,"handler":async function(value, oldValue) {
              var timerKey = 'history_persisted_save_timer';
              clearTimeout(this[timerKey]);
              this[timerKey] = setTimeout(async () => {
                var func = (async function(newHistory) { newHistory.sort();

this.$localStorage.setItem(`MG2.Navigation.history`, JSON.stringify(newHistory));
 }).bind(this);
                await func(value);
              }, 400);
            }}},"mounted":async function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    this.history = (await (async function() {
      return JSON.parse(this.$localStorage.getItem(`MG2.Navigation.history`) || `[]`);

    }.bind(this))());
    
    
    
this.links = [];

this.links.push(`/`);
this.links.push(`/Futurama-Fry`);
this.links.push(`/Insanity-Wolf`);
this.links.push(`/instance/23169557`);

Object.keys(this._data).forEach(prop => {
  this.$watch(prop, (value) => {
    if ((prop == `pageName`) && (!value)) return;
    this.$parent.$emit(`ide-route-param-changed-${prop}`, value);
  });
});


window.addEventListener('popstate', (e) => {
  this.url = e.state.url;
});


if (this.$route)
{
  if (typeof(history) != `undefined`) this.goto(this.$route.path);
}


this.$root.$on(`goto`, (url) => {
  this.goto(url);
});


window.mgPopNav = (url) => {
  this.url = url;
};


    
    
      },"name":"MG2-Navigation"}
</script>

<style scoped>

</style>