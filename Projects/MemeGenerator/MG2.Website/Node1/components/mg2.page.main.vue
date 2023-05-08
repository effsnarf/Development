<template>

<div class="meow-comp-25474">
<component is="mg2-page" class="">
<template v-slot:sidebar-left="" class="">
<component :instance="instance" :generator="generator" :generators="((!pageName) || (pageName == `home`)) ? null : streamGenerators" is="mg2-see-also" class=""></component></template>
<template v-slot:sidebar-large="" class="">
<div v-if="(!mgUserRoute?.mgUserID)" class="">
<component :selected-category="{name: categoryName}" :visible="true" is="mg2-categories" class=""></component></div>
<div v-if="mgUserRoute?.mgUserID" class="mb-l3">
<component :mg-user-i-d="mgUserRoute?.mgUserID" :mg-user-content-entity="mgUserRoute?.contentEntity" @clear="clearUserMenu" is="mg2-pages-user-sidebar" class=""></component>
<hr class="my-l1 opacity-20"/></div></template>
<template v-slot:body2="" class="">
<div v-if="(pageName == 'home')" class="vertical-ads">
<component type="mobile-app" ad-network="memegenerator" is="mg2-ad" class=""></component></div>
<div class="">
<transition name="slide-in-list" class="">
<component :generator="generator" v-if="showCreateInstanceForm" :key="generator?.generatorID" is="mg2-instance-create" class="mb-l2 mg2-instance-create"></component></transition>
<component entity-name="Instance" :entity-i-d="instance?.instanceID" :title="getInstanceText(instance)" is="mg2-comments" class=""></component></div></template>
<template v-slot:body="" class="">
<div class="mb-l3">
<transition name="slide-in-list" class="">
<component v-if="(false) && (pageName == `create-generator`)" is="mg2-generator-create" class=""></component></transition>
<component :instance="instance" v-if="showInstance" is="mg2-instance" class=""></component></div>
<component :get-items="getStreamItems" :selected-item="selectedItem" ref="stream1" @scroll="onScroll" @items-changed="onGalleryStreamItemsChanged" is="mg2-gallery-infinite-scroll" class=""></component></template></component></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25474,"name":"MG2.Page.Main"},"rateLimit":{"streamHasItems":{"timer":null,"value":null,"nextValue":null}}},"pageName":null,"pageQueue":[],"isMounted":null,"instanceID":null,"getStreamItems":null,"urlName":null,"categoryName":null,"mgUserContentEntity":null,"mgUserID":null,"mgUserRoute":{"mgUserID":null,"contentEntity":null},"scrollTop":null,"streamItem":null,"showCreateInstanceForm":true,"streamGenerators":null}; },"computed":{"selectedItem":{"get":function() { if (this.instanceID) return { instanceID: this.instanceID };

return this.instance;
 }},"showCategories":{"get":function() { if (!this.pageName) return true;

if (this.pageName == `home`) return true;
if (this.pageName == `category`) return true;

return false;
 }},"showInstance":{"get":function() { if (!this.instance) return false;

let stream1 = this.$refs.stream1;

if (!stream1?.items?.length) return true;

if (stream1?.items.find(item => (item.instanceID == this.instance.instanceID))) return false;

return true;
 }},"instanceIndex":{"get":function() { let items = this.$refs.stream1?.items;

if (!items?.length) return null;
if (!this.instance) return null;

return (items.findIndex(it => (it.instanceID == this.instance.instanceID)));
 }},"streamHasItems":{"get":function() { return this.$data._meow.rateLimit.streamHasItems.value },"set":function(newValue) {
            
          var rateLimit = this.$data._meow.rateLimit;
          var newValue2 = newValue;
          clearTimeout(rateLimit.streamHasItems.timer);
          rateLimit.streamHasItems.timer = setTimeout(() => {
            rateLimit.streamHasItems.value = newValue2;
          }, 1000);
        
        }},"showLargeAds":{"get":function() { return (!this.pageName) || (this.pageName == `home`);
 }}},"asyncComputed":{"instance":{"get":async function() {
            if (!this.instanceID) return null;

return (await this.$dbp.api.instances.select.one(this.instanceID));

          }},"generator":{"get":async function() {
            if ((!this.instanceID) && (!this.urlName)) return null;

if (this.instance?.generatorID || this.urlName) return (await this.$dbp.api.generators.select.one(this.instance?.generatorID, this.urlName));

// an instance has some of the relevant generator info
if (this.instanceID) return (await this.$mgApi.Instance_Select(this.instanceID));

return null;

          }}},"methods":{"gotoHomePage":async function () {
        this.getStreamItems = async (pageIndex, lastItem) => {
  return (await this.$dbp.api.instances.streams.get(lastItem?.posted));
};


      },"mounted":function () {
        this.isMounted = true;

if (typeof(window) != `undefined`)
{
  if (window.location.pathname == `/`) this.gotoHomePage();
}

this.processPageQueue();

      },"processPageQueue":function () {
        if (!this.pageQueue.length) return;

let newPageName = this.pageQueue.shift();

if (!newPageName) newPageName = `home`;
if (newPageName == `homepage`) newPageName = `home`;

newPageName = `${newPageName[0].toUpperCase()}${newPageName.substr(1)}`;

let methodName = `goto${newPageName}Page`;

if (this[methodName]) this[methodName]();

      },"gotoGeneratorPage":function () {
        
      },"getInstanceText":function (instance) {
        if (!instance) return null;

return [instance.text0, instance.text1]
  .filter(s => s)
  .join(` - `);

      },"gotoUserPage":function () {
        
      },"setStreamItemsByMgUser":async function () {
        this.getStreamItems = (async (pageIndex) => {
  let mgUserID = this.mgUserRoute.mgUserID;
  if (!mgUserID) return [];

  let entity = this.mgUserRoute.contentEntity;
  if (!entity) return null;

  let obj = {
    'generators': `Generators_Select_ByMgUser`,
    'liked-generators': `Generators_Select_ByUpvoted`,
    'instances': `Instances_Select_ByMgUser`,
    'liked-instances': `Instances_Select_ByUpvoted`
  };

  let method = obj[entity];

  return (await this.$mgApi[method](mgUserID, pageIndex)).items;

});

      },"clearUserMenu":function () {
        this.mgUserRoute.mgUserID = null;
this.mgUserRoute.contentEntity = null;

      },"onScroll":function (e) {
        this.scrollTop = e.scrollTop;
this.streamItem = e.visibleItem;

      },"onGalleryStreamItemsChanged":function (items) {
        items = (items?.filter(it => !it.ad) || []);

this.streamGenerators = items
  .map(it => it.displayName)
  .distinct()
  .map(dn => { return {
    generatorID: items.find(it => (it.displayName == dn)).generatorID,
    displayName: dn
  }; });

      }},"watch":{"pageName":{"deep":true,"immediate":true,"handler":async function(newPageName, oldPageName) {
      if (!newPageName) return;

this.pageQueue.push(newPageName);

if (this.isMounted) this.processPageQueue();

    }},"instance":{"deep":true,"immediate":true,"handler":async function(newInstance, oldInstance) {
      // show other instances from the same generator

if (!newInstance) return;

if (!this.getStreamItems)
{
  this.getStreamItems = async () => {
    return (await this.$dbp.api.instances.streams.get());
  };
}



// if creating a new instance while
// browsing the stream, insert it

let stream1 = this.$refs.stream1;
let items = stream1?.items;

if ((items?.length) && newInstance)
{
  let streamItem = items.find(it => (it.instanceID == newInstance.instanceID));

  if (streamItem)
  {
    stream1.scrollToItem(streamItem);
    return;
  }

  if (this.streamItem)
  {
    // new item
    items.splice(this.streamItem.index, 0, newInstance);
    stream1.scrollTo 
(this.streamItem.scrollTop);
  }
  else
  {
    items.unshift(newInstance);
    stream1.scrollTo(0);
  }
}

    }},"urlName":{"deep":true,"immediate":false,"handler":async function(newUrlName, oldUrlName) {
      if (!newUrlName) return;

this.getStreamItems = async (pageIndex) => {
  return (await this.$dbp.api.instances.select.popular(`en`, pageIndex, newUrlName));
};


    }},"categoryName":{"deep":true,"immediate":false,"handler":async function(newCategoryName, oldCategoryName) {
      if (!newCategoryName) return;

this.getStreamItems = async (pageIndex) => {
  return (await this.$dbp.api.instances.streams.getByCategory(this.categoryName, pageIndex));
};


    }},"mgUserContentEntity":{"deep":true,"immediate":false,"handler":async function(newMgUserContentEntity, oldMgUserContentEntity) {
      if (!newMgUserContentEntity) return;

this.mgUserRoute.contentEntity = newMgUserContentEntity;

this.setStreamItemsByMgUser();

    }},"mgUserID":{"deep":true,"immediate":false,"handler":async function(newMgUserID, oldMgUserID) {
      if (!newMgUserID) return;

this.mgUserRoute.mgUserID = newMgUserID;

this.setStreamItemsByMgUser();

    }}},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
      var eventName = `ide-route-param-changed-pageName`;
      var handler = (value) => { this.pageName = value; };
      this.$parent.$on(eventName, handler);
      

      var eventName = `ide-route-param-changed-instanceID`;
      var handler = (value) => { this.instanceID = value; };
      this.$parent.$on(eventName, handler);
      

      var eventName = `ide-route-param-changed-urlName`;
      var handler = (value) => { this.urlName = value; };
      this.$parent.$on(eventName, handler);
      

      var eventName = `ide-route-param-changed-categoryName`;
      var handler = (value) => { this.categoryName = value; };
      this.$parent.$on(eventName, handler);
      

      var eventName = `ide-route-param-changed-mgUserContentEntity`;
      var handler = (value) => { this.mgUserContentEntity = value; };
      this.$parent.$on(eventName, handler);
      

      var eventName = `ide-route-param-changed-mgUserID`;
      var handler = (value) => { this.mgUserID = value; };
      this.$parent.$on(eventName, handler);
      
this.pageName = this.$route?.params.pageName;
this.instanceID = this.$route?.params.instanceID;
this.urlName = this.$route?.params.urlName;
this.categoryName = this.$route?.params.categoryName;
this.mgUserContentEntity = this.$route?.params.mgUserContentEntity;
this.mgUserID = this.$route?.params.mgUserID;
    
    
    this.isMounted = true;

if (typeof(window) != `undefined`)
{
  if (window.location.pathname == `/`) this.gotoHomePage();
}

this.processPageQueue();

    
    
      },"name":"MG2-Page.Main"}
</script>

<style scoped>
@media (max-width: 1400px) {
  .vertical-ads
  {
    display: none;
  }
}

@media (max-width: 900px)
{
  .mg2-instance-create
  {
    display: none;
  }
}

</style>