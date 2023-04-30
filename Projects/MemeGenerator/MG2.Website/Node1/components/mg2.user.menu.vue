<template>

<div class="meow-comp-25403 mb-2">
<div v-if="(mgUser)" class="">
<component :mg-user="mgUser" is="mg2-user" class=""></component></div>
<div v-if="(!mgUser)" class="">
<div v-text="`🔑 Login`" @click="showLoginForm=!showLoginForm" class="button"></div>
<div v-show="showLoginForm" class="">
<component @login="mgUser=$event" @login-session-key="$root.$emit(`login-session-key`, $event)" is="mg2-login-form" class=""></component></div></div></div>
</template>
<script>
export default
{"props":{"showLoginForm":null},"data":function() { return {"_meow":{"comp":{"_id":25403,"name":"MG2.User.Menu"},"rateLimit":{}},"mgUser":null}; },"computed":{},"asyncComputed":{},"methods":{"mounted":function () {
        this.$root.$on(`login`, (mgUser) => {
  this.mgUser = mgUser;
});

      }},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    this.$root.$on(`login`, (mgUser) => {
  this.mgUser = mgUser;
});

    
    
      },"name":"MG2-User.Menu"}
</script>

<style scoped>
.button
{
  width: 100%;
  border-radius: 0.5rem;
}

</style>