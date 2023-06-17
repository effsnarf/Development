<template>

<div class="meow-comp-25400">
<div class="mb-l2">
<textarea :placeholder="hint" v-model="text" :style="getTextAreaHeightStyle()" ref="textArea1" class=""></textarea>
<div class="flex justify-between">
<div class="">
<a @click="$emit(`cancel`)" v-if="parentCommentID" class="clickable block mt-1">🡄 cancel</a></div>
<transition name="slide-in-list">
<button v-if="text" @click="post" class="clickable">✔️ Post</button></transition></div></div></div>
</template>
<script>
export default
{"props":{"entityName":null,"entityID":null,"parentCommentID":null,"parentComment":null},"data":function() { return {"_meow":{"comp":{"_id":25400,"name":"MG2.Comment.Create"},"rateLimit":{}},"text":null,"isLoading":null,"showForm":null}; },"computed":{"hint":{"get":function() { if (!this.parentComment) return `comment…`;

let maxLength = 20;

let s = (this.parentComment.text || '');

if (s.length > maxLength) s = `${s.substr(0, maxLength)}…`;

return `reply to "${s}"`; }}},"asyncComputed":{},"methods":{"post":async function () {
        this.isLoading = true;

let text = this.text;
this.text = null;

await this.$mgApi.Comment_Create(this.entityName, this.entityID, this.parentCommentID, text);

this.isLoading = false;

this.$emit(`posted`);

      },"getTimestamp":function (comment) {
        if (!comment) return null;

return `${window.util.date.timeAgo(new Date(comment.created).valueOf())} ago`;

      },"getTextAreaHeightStyle":function () {
        let height = (this.parentCommentID ? 2 : 2);

if (this.text) height = 4;

let s = `min-height: ${height}em !important; height: ${height}em !important;`;

return s;

      },"focus":function () {
        this.$refs.textArea1.focus();

      }},"watch":{"parentCommentID":{"deep":true,"immediate":true,"handler":async function(newParentCommentID, oldParentCommentID) {
      this.showForm = (!newParentCommentID);

    }}},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Comment.Create"}
</script>

<style scoped>
textarea
{
  transition: 0.4s;
}


</style>