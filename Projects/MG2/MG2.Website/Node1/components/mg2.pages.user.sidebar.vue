<template>

<div v-if="mgUserID" class="meow-comp-25409">
<component :show-frame="false" is="mg2-box" class="">
<template >
<div class="">
<component :mg-user="mgUser" :show-clear-button="true" @clear="$emit('clear')" is="mg2-user" class="mb-5"></component>
<div class="">
<component :show-frame="(mgUserContentEntity == `instances`)" is="mg2-box" class="">
<template >
<component :url="`/user/${mgUserID}/posts`" is="mg2-link" class="">
<template >
<h3 class="">
<component text="Posts Created" :number="createdInstances?.totalItemsCount" is="mg2-label" class=""></component></h3></template>
<template ></template></component></template></component>
<component :show-frame="(mgUserContentEntity == `generators`)" is="mg2-box" class="">
<template >
<component :url="`/user/${mgUserID}/memes`" is="mg2-link" class="">
<template >
<h3 class="">
<component text="Memes Created" :number="createdGenerators?.totalItemsCount" is="mg2-label" class=""></component></h3></template></component></template>
<template ></template></component>
<component :show-frame="(mgUserContentEntity == `liked-instances`)" is="mg2-box" class="">
<template >
<component :url="`/user/${mgUserID}/liked-posts`" is="mg2-link" class="">
<template >
<h3 class="">
<component text="Posts Liked" :number="upvotedInstances?.totalItemsCount" is="mg2-label" class=""></component></h3></template></component></template>
<template ></template></component>
<component :show-frame="(mgUserContentEntity == `liked-generators`)" is="mg2-box" class="">
<template >
<component :url="`/user/${mgUserID}/liked-memes`" is="mg2-link" class="">
<template >
<h3 class="">
<component text="Memes Liked" :number="upvotedGenerators?.totalItemsCount" is="mg2-label" class=""></component></h3></template></component></template>
<template ></template></component></div></div></template></component></div>
</template>
<script>
export default
{"props":{"mgUserID":null,"mgUserContentEntity":null},"data":function() { return {"_meow":{"comp":{"_id":25409,"name":"MG2.Pages.User.Sidebar"},"rateLimit":{}}}; },"computed":{},"asyncComputed":{"createdGenerators":{"get":async function() {
            if (!this.mgUserID) return [];

return (await this.$mgApi.Generators_Select_ByMgUser(this.mgUserID));

          }},"mgUser":{"get":async function() {
            if (!this.mgUserID) return null;

let mgUser = (await this.$dbp.entity(`MgUsers`).listOne({_id: this.mgUserID}));

return mgUser;

          }},"upvotedGenerators":{"get":async function() {
            if (!this.mgUserID) return [];

return (await this.$mgApi.Generators_Select_ByUpvoted(this.mgUserID));

          }},"createdInstances":{"get":async function() {
            if (!this.mgUserID) return [];

return (await this.$mgApi.Instances_Select_ByMgUser(this.mgUserID));

          }},"upvotedInstances":{"get":async function() {
            if (!this.mgUserID) return [];

return (await this.$mgApi.Instances_Select_ByUpvoted(this.mgUserID));

          }}},"methods":{},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Pages.User.Sidebar"}
</script>

<style scoped>
.grid-1
{
  flex-wrap: wrap;
  display: flex;
  justify-content: center;
}
.grid-1 > div
{
  width: 20%;
}

.grid-2
{
  flex-wrap: wrap;
  display: flex;
  justify-content: center;
  gap: 2%;
}
.grid-2 > div
{
  width: 31%;
  filter: grayscale(1);
}
.grid-2 > div:hover
{
  filter: none;
}


h3
{
  font-size: 1.2rem;
}


</style>