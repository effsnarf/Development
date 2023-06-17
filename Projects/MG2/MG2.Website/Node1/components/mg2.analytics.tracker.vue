<template>

<div class="meow-comp-25468"></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25468,"name":"MG2.Analytics.Tracker"},"rateLimit":{}},"events":{"interactions":0},"saveInterval":1000,"browserExitDone":null,"visitStarted":null,"session":{"interactions":0}}; },"computed":{},"asyncComputed":{},"methods":{"mounted":function () {
        this.register();

this.$root.$on(`page-view`, (url) => {
  if (!url) url = window.location.pathname;
  if (typeof(dataLayer) != `undefined`)
  {
    dataLayer.push({
    'event': 'pageview',     
      'page_location': url
    });
  }
});

this.$root.$on(`something-click`, this.onSomethingClick.bind(this));

      },"register":async function () {
        if (window.mgAnalyticsRegistered) return;

window.mgAnalyticsRegistered = true;


//await this.$dbp.api.analytics.track.events({action: "enter"});



let appEl;
if (!(appEl = this.getAppEl())) return;

this.getInteractionEvents().forEach(eventName => {
  appEl.addEventListener(eventName, this.onInteraction.bind(this));
});

window.addEventListener('click', this.onSomethingClick.bind(this));

setTimeout(this.save.bind(this), this.saveInterval);

window.addEventListener('beforeunload', () => {
  this.onBrowserExit();
});


      },"onEvent":function (eventName, ...args) {
        if (eventName == `interaction`)
{
  this.events.interactions++;

  this.session.interactions++;
}

      },"save":function () {
        if (!window.mgAnalyticsRegistered) return;

if (this.hasEvents())
{
  //this.$dbp.api.analytics.track.events(this.events);

  this.clear();
}

setTimeout(this.save.bind(this), this.saveInterval);

      },"onBrowserExit":function () {
        if (this.browserExitDone) return;

if (this.session.interactions == 0) return;

let events = {
  action: "exit",
  session: this.session
};

//this.$dbp.api.analytics.track.events(events);

this.browserExitDone = true;


      },"clear":function () {
        this.events = { interactions: 0};

      },"hasEvents":function () {
        if (this.events.interactions) return true;

return false;

      },"getAppEl":function () {
        let appEl = this.$el.parentElement;

if (![...appEl.classList].includes(`app`))
{
  alertify.warning(`MG2.Analytics only works inside MGs.App`);
  return null;
}

return appEl;


      },"onInteraction":function () {
        this.onEvent(`interaction`);

      },"unmounted":function () {
        let appEl;
if (!(appEl = this.getAppEl())) return;

this.getInteractionEvents().forEach(eventName => {
  appEl.removeEventListener(eventName, this.onInteraction.bind(this));
});

      },"getInteractionEvents":function () {
        return `scroll, mousemove`.split(`,`).map(s => s.trim());


      },"ajaxSync":function (url, onSuccess) {
        $.ajax({
  type: 'GET',
  async: false,
  url: url,
  success: onSuccess
});

      },"onSomethingClick":function () {
        
//this.$dbp.api.analytics.track.events({ click: 1 });

      }},"watch":{},"unmounted":function () {
        let appEl;
if (!(appEl = this.getAppEl())) return;

this.getInteractionEvents().forEach(eventName => {
  appEl.removeEventListener(eventName, this.onInteraction.bind(this));
});

      },"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    this.register();

this.$root.$on(`page-view`, (url) => {
  if (!url) url = window.location.pathname;
  if (typeof(dataLayer) != `undefined`)
  {
    dataLayer.push({
    'event': 'pageview',     
      'page_location': url
    });
  }
});

this.$root.$on(`something-click`, this.onSomethingClick.bind(this));

    
    
      },"name":"MG2-Analytics.Tracker"}
</script>

<style scoped>

</style>