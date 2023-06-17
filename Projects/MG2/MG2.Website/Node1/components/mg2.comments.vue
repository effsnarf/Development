<template>

<div class="meow-comp-25373 ">
<div :class="{ 'comments-container': (parentCommentID ? false : true) }" v-if="(entityID || comments)" class="">
<h2 v-text="title" v-if="title" class="opacity-50 mb-5"></h2>
<div v-if="false &amp;&amp; (!parentCommentID) &amp;&amp; (allComments?.length)" class="">
<h4 v-text="`${allComments?.length} comments`" class="fs-m3"></h4></div>
<transition name="slide-in-list" tag="div">
<div v-show="(!parentCommentID) || showReplyForm" class="">
<component :entity-name="entityName" :entity-i-d="entityID" :parent-comment-i-d="parentCommentID" @posted="reload(true)" :parent-comment="parentComment" @cancel="showReplyForm=!showReplyForm" ref="createComment1" is="mg2-comment-create" class=""></component></div></transition>
<transition-group tag="div" name="slide-in-list" class="">
<div tag="div" v-for="(comment, index) in visibleComments" :key="comment.commentID" :style="{  'transition-delay': `calc(0.1s * ${index})` }" class="">
<component :comment="comment" :all-comments="allComments" :entityName="entityName" :entityID="entityID" @reload="reload" is="mg2-comment" class=""></component></div></transition-group></div></div>
</template>
<script>
export default
{"props":{"entityName":null,"entityID":null,"comments":null,"parentCommentID":null,"parentComment":null,"title":null},"data":function() { return {"_meow":{"comp":{"_id":25373,"name":"MG2.Comments"},"rateLimit":{}},"key1":0,"showReplyForm":null}; },"computed":{"visibleComments":{"get":function() { var items = this.allComments
  .filter(c => !this.isSpamComment(c))
  .filter(c => (c.parentCommentID == this.parentCommentID));

items = this.sortComments(items);

return items;
 }},"allComments":{"get":function() { return (this.comments || this.entityComments || []); }}},"asyncComputed":{"entityComments":{"get":async function() {
            if (!this.entityName) return [];
if (!this.entityID) return [];

if (this.key1); // for reload

let comments = (await this.$mgApi.Comments_Select(this.entityName, this.entityID, this.parentCommentID));

return comments;

          }}},"methods":{"isSpamComment":function (comment) {
        
          if (!comment) return null;
          if (comment.entityVotesSummary?.totalVotesSum <= -3) return true;
          var text = comment?.text?.toLowerCase();
          if (!text) return null;
          var spamWords = [
            `http:/`,
            `https:/`,
            `.com`,
            `whatsapp`,
            `\\u00AD`,
            `@gmail`,
            `+9`,
            `make money`,
            `pornhub`,
            `$`,
            `nude`,
          ];
          if (spamWords.some((s) => text.includes(s))) return true;
          return false;

      },"getReplies":function (comment) {
        
      },"reload":function (hideReplyForm) {
        if (hideReplyForm)
{
  this.showReplyForm = !this.showReplyForm;
}

if (this.parentCommentID)
{
  this.$emit(`reload`);
}
else
{
  this.key1++;
}


      },"toggleReply":function () {
        this.showReplyForm = (!this.showReplyForm);

      },"sortComments":function (comments) {
        let minute = (60 * 1000);

let aboutNow = (Date.now() - (1 * minute));

let items = [...comments];

let isRecent = (it => ((new Date(it.created)).valueOf() > aboutNow));

let newItems = items.filter(isRecent);
let oldItems = items.filter(it => (!isRecent(it)));

newItems = newItems.sortBy(a => -(new Date(a.created).valueOf()));

items = [...newItems, ...oldItems];

return items;

      }},"watch":{"showReplyForm":{"deep":true,"immediate":false,"handler":async function(newShowReplyForm, oldShowReplyForm) {
      if (newShowReplyForm)
{
  setTimeout(() => {
    this.$refs.createComment1.focus();
  }, 400);
}

    }}},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Comments"}
</script>

<style scoped>
.comments-container
{
  height: 80vh;
  padding: 0 0.5em;
  overflow-x: hidden;
  overflow-y: auto;
}

textarea
{
  min-height: 4em !important;
  height: 4em !important;
}

h2
{
  line-height: 1em;
}

</style>