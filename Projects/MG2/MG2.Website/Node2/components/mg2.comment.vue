<template>

<div v-if="comment" class="meow-comp-25374">
<div class="comment">
<div class="comment-text">
<div v-text="comment.text" class=""></div>
<div class="flex">
<div v-text="getTimestamp(comment)" :key="timestampKey" v-if="showTimestamp(comment)" class="opacity-30 flex-equal"></div>
<div style="grid-template: 1fr / 1fr 1fr 1fr; font-size: 0.5rem;" class="grid flex-equal mt-1">
<div class=""></div>
<component :item="comment" is="mg2-voter" class=""></component>
<div class=""></div></div>
<div class="flex-equal text-right">
<a @click="toggleReply" class="clickable opacity-50">reply</a></div></div></div>
<div class="comment-replies">
<component :entity-name="entityName" :entity-i-d="entityID" :parent-comment-i-d="comment._id" :comments="allComments" :parentComment="comment" ref="comments1" @reload="$emit(`reload`)" is="mg2-comments" class=""></component></div></div></div>
</template>
<script>
export default
{"props":{"comment":null,"allComments":null,"entityName":null,"entityID":null},"data":function() { return {"_meow":{"comp":{"_id":25374,"name":"MG2.Comment"},"rateLimit":{}},"timestampKey":0,"refreshTimestampHandler":null}; },"computed":{},"asyncComputed":{},"methods":{"getTimestamp":function (comment) {
        if (!comment) return null;

return `${window.util.date.timeAgo(new Date(comment.created).valueOf())}`;

      },"toggleReply":function () {
        this.$refs.comments1.toggleReply();

      },"mounted":function () {
        this.refreshTimestampHandler = setInterval(this.refreshTimestamp.bind(this), 3000);

      },"unmounted":function () {
        clearInterval(this.refreshTimestampHandler);

      },"refreshTimestamp":function () {
        this.timestampKey++;

      },"showTimestamp":function (comment) {
        let minute = (60 * 1000);
let hour = (60 * minute);
let day = (24 * hour);
let month = (30 * day);
if ((Date.now() - comment.created) > (3 * month)) return false;

return true;

      }},"watch":{},"unmounted":function () {
        clearInterval(this.refreshTimestampHandler);

      },"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    this.refreshTimestampHandler = setInterval(this.refreshTimestamp.bind(this), 3000);

    
    
      },"name":"MG2-Comment"}
</script>

<style scoped>
.comment-text
{
  background: #ffffff30;
  margin-bottom: 0.2em;
  padding: 0.2em 0.5em;
  border-radius: 0.5em;
  word-break: break-word;
}

.comment-replies
{
  padding-left: 2em;
}

</style>