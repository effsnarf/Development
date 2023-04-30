<template>

<div class="meow-comp-25404">
<component is="mg2-box" class="">
<template >
<div v-if="mgUser" class="">
<div class="flex">
<div class="w-l5 mr-5">
<component :image-i-d="mgUser.imageID" is="mg2-image" class=""></component></div>
<h3 class="">Welcome, fren!</h3></div>
<div class="text-center">
<component :text="`${mgUser.username}'s profile page 🡆`" :url="`/user/${mgUser.mgUserID}`" is="mg2-link" class="button"></component></div></div></template>
<template >
<div v-if="(!mgUser)" class="">
<div :class="{ disabled: (isLoading) }" class="">
<input placeholder="username" v-model="savedUsername" class=""/>
<input placeholder="password" v-model="savedPassword" type="password" class=""/></div>
<div v-if="isLoading" class="loading"></div>
<div v-if="(savedUsername &amp;&amp; savedPassword &amp;&amp; !isLoading)" class="text-center">
<button @click="login(savedUsername, savedPassword)" class="">🔑 Login</button></div></div></template></component></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25404,"name":"MG2.Login.Form"},"rateLimit":{}},"savedUsername":null,"savedPassword":null,"loginData":null,"mgUser":null,"isLoading":null}; },"computed":{},"asyncComputed":{},"methods":{"getApp":function () {
        return this.$parent?.$parent;

      },"login":async function (username, password) {
        if (!username) throw `Username?`;
if (!password) throw `Password?`;

this.loginData = null;

this.isLoading = true;

await new Promise(r => setTimeout(r, 600));

try
{
  this.loginData = (await this.$mgApi.MgUser_Login(username, password));
  this.mgUser = this.loginData?.mgUser;
  this.$emit(`login-session-key`, this.loginData.loginSession.sessionKey);
  this.$emit(`login`, this.mgUser);
}
catch (ex)
{
  alertify.error(ex.toString());
}
finally
{
  this.isLoading = false;
}

      },"loginSavedCreds":async function () {
        if (!this.savedUsername) return;
if (!this.savedPassword) return;

//alertify.message(`${this.savedUsername} / ${this.savedPassword}`);

await this.login(this.savedUsername, this.savedPassword);

      },"mounted":async function () {
        await this.loginSavedCreds();

      }},"watch":{"savedUsername":{"deep":true,"immediate":false,"handler":async function(value, oldValue) {
              var timerKey = 'savedUsername_persisted_save_timer';
              clearTimeout(this[timerKey]);
              this[timerKey] = setTimeout(async () => {
                var func = (async function(newSavedUsername) { this.$localStorage.setItem(`username`, newSavedUsername);
 }).bind(this);
                await func(value);
              }, 400);
            }},"savedPassword":{"deep":true,"immediate":false,"handler":async function(value, oldValue) {
              var timerKey = 'savedPassword_persisted_save_timer';
              clearTimeout(this[timerKey]);
              this[timerKey] = setTimeout(async () => {
                var func = (async function(newSavedPassword) { this.$localStorage.setItem(`password`, newSavedPassword);
 }).bind(this);
                await func(value);
              }, 400);
            }}},"mounted":async function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    this.savedUsername = (await (async function() {
      return (this.$localStorage.getItem(`username`));

    }.bind(this))());
    

    this.savedPassword = (await (async function() {
      return this.$localStorage.getItem(`password`);

    }.bind(this))());
    
    
    await this.loginSavedCreds();

    
    
      },"name":"MG2-Login.Form"}
</script>

<style scoped>
input
{
  text-shadow: none;
}

</style>