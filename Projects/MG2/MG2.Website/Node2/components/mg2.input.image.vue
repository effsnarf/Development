<template>

<div class="meow-comp-25486">
<div class="">
<div @click="openDialogue" class="clickable">
<transition name="slide-in-list">
<img src="/img/upload.png" v-if="(!mgImage) || isLoading" :class="{ loading: isLoading }"/>
<component :mg-image="mgImage" v-if="mgImage &amp;&amp; (!isLoading)" is="mg2-image" class=""></component></transition></div>
<div class=""></div>
<div class="">
<input type="file" ref="file1" @change="onFileSelected" name="file" class="hidden"/></div></div></div>
</template>
<script>
export default
{"props":{"value":null},"data":function() { return {"_meow":{"comp":{"_id":25486,"name":"MG2.Input.Image"},"rateLimit":{}},"mgImage":null,"isLoading":null}; },"computed":{},"asyncComputed":{},"methods":{"onFileSelected":async function (e) {
        this.isLoading = true;

try
{
  let formData = new FormData();

  formData.append("file", this.$refs.file1.files[0]);

  let result = (await fetch (`https://db.memegenerator.net/upload`, {
    method: "POST", 
    body: formData
  }));

  result = (await result.json());
  let filename = result.filename;

  let mgImage = (await this.$dbp.api.mgImages.all.create(filename));

  this.$emit(`input`, mgImage);
}
catch (ex)
{
  alertify.error(ex.toString());
}
finally
{
  this.isLoading = false;
}


      },"openDialogue":function () {
        this.$refs.file1.click();

      }},"watch":{"value":{"deep":true,"immediate":true,"handler":async function(newValue, oldValue) {
      this.mgImage = newValue;

    }}},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Input.Image"}
</script>

<style scoped>

</style>