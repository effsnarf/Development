<template>

<div class="meow-comp-25402">
<div class="">
<input type="file" @change="onFileSelected" ref="input1" class=""/></div></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25402,"name":"MG2.Image.Upload"},"rateLimit":{}},"inActiveTimeout":null}; },"computed":{},"asyncComputed":{},"methods":{"onFileSelected":async function () {
        let uploadUrl = `https://memegenerator.net/Xhr/UploadImage`;

let formData = new FormData();           

formData.append("file", this.$refs.input1.files[0]);

await fetch(uploadUrl, {
  method: "POST", 
  body: formData
});    

alert('The file has been uploaded successfully.');

      }},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Image.Upload"}
</script>

<style scoped>

</style>