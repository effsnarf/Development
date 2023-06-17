<template>

<div :key="key1" class="meow-comp-25395">
<div style="grid-template: 1fr / 1fr 1fr 1fr;" :class="{ 'opacity-50': isLoading, upvoted: (item.entityVotesSummary.userVoteScore &gt; 0), downvoted: (item.entityVotesSummary.userVoteScore &lt; 0) }" v-if="item?.entityVotesSummary" class="grid text-center">
<button @click="vote(-1)" class="down">🡇</button>
<div v-text="item.entityVotesSummary.totalVotesSum" style="white-space: nowrap; font-size: 1.2em;" class="opacity-50 score mx-2"></div>
<button @click="vote(1)" class="up">🡅</button></div></div>
</template>
<script>
export default
{"props":{"item":null},"data":function() { return {"_meow":{"comp":{"_id":25395,"name":"MG2.Voter"},"rateLimit":{}},"key1":0,"isLoading":null}; },"computed":{"entityName":{"get":function() { if (!this.item) return null;

if (this.item.commentID) return "Comment";
if (this.item.instanceID) return "Instance";
if (this.item.generatorID) return "Generator";

return null;
 }},"entityID":{"get":function() { let en = this.entityName;

if (!en) return null;

en = `${en[0].toLowerCase()}${en.substr(1)}`;

let fieldName = (`${en}ID`);

return this.item[fieldName];
 }}},"asyncComputed":{},"methods":{"vote":async function (score) {
        this.isLoading = true;

if (score == this.item.entityVotesSummary.userVoteScore) score = 0;

let evs = (await this.$dbp.api.votes.all.vote(this.entityName, this.entityID, score));

// API bug, (userVoteScore==0) is
// not serialized in the response
evs.userVoteScore = (evs.userVoteScore ?? 0);

this.item.entityVotesSummary = evs;

this.isLoading = false;

this.refresh();

      },"refresh":function () {
        this.key1++;

      }},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Voter"}
</script>

<style scoped>
*
{
  font-size: 1.1em;
  color: white;
}

button
{
  border: none;
  padding: 0 !important;
  box-shadow: none;
  opacity: 0.3;
  background: none;
  cursor: pointer;
  transition: 0s;
  z-index: 100;
}

button:hover
{
  opacity: 0.6;
}

.upvoted .score,
.downvoted .score
{
  font-weight: bold;
}

.downvoted button.down,
.downvoted .score
{
  opacity: 0.6 !important;
  color: #ff8060;
}
.upvoted button.down
{
  opacity: 0.1;
}
.upvoted button.down:hover
{
  opacity: 0.2;
}
.upvoted button.up,
.upvoted .score
{
  opacity: 0.6 !important;
  color: #00afff;
}
.downvoted button.up
{
  opacity: 0.1;
}
.downvoted button.up:hover
{
  opacity: 0.2;
}

</style>