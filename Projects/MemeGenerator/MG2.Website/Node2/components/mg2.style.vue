<template>

<div class="meow-comp-25476"></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25476,"name":"MG2.Style"},"rateLimit":{}}}; },"computed":{},"asyncComputed":{},"methods":{},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Style"}
</script>

<style>
.app
{
  color: white;
}


.sticky {
  top: 7.2rem;
  align-self: flex-start;
  max-height: 100vh;
  overflow: hidden;
}


.page-width {
  width: min(100%, 1280px);
  margin: auto;
}

.slide-in-list-move,
.slide-in-list-leave-active,
.slide-in-list-enter-active
{
  transition: 0.5s ease-in-out;
  max-height: 10em;
  overflow: hidden;
}

.slide-in-list-enter, 
.slide-in-list-leave-to
{
  max-height: 0;
  overflow: hidden;
  opacity: 0 !important;
}
  
.slide-in-list-enter
{
  transform: translateX(3em);
}
.slide-in-list-leave-to
{
  transform: translateX(-3em);
}




.slide-in-list2-move,
.slide-in-list2-leave-active,
.slide-in-list2-enter-active
{
  transition: 0.5s ease-in-out;
  max-height: 5em;
}

.slide-in-list2-enter, 
.slide-in-list2-leave-to
{
  max-height: 0;
  opacity: 0 !important;
}
  
.slide-in-list2-enter
{
  transform: translateY(-3em);
}
.slide-in-list2-leave-to
{
  transform: translateX(-3em);
}






.slide-in-list-large-move,
.slide-in-list-large-leave-active,
.slide-in-list-large-enter-active
{
  transition: 1s ease-in-out;
  max-height: 40em;
  overflow: hidden;
}

.slide-in-list-large-enter, 
.slide-in-list-large-leave-to
{
  max-height: 0;
  overflow: hidden;
  opacity: 0 !important;
}
  
.slide-in-list-large-enter
{
  transform: translateY(30em);
}
.slide-in-list-large-leave-to
{
  transform: translateY(-30em);
}





.slide-in-grid-move,
.slide-in-grid-leave-active,
.slide-in-grid-enter-active
{
  transition: 0.5s ease-in-out;
  max-height: 10em;
  overflow: hidden;
}

.slide-in-grid-enter, 
.slide-in-grid-leave-to
{
  max-height: 0;
  overflow: hidden;
  opacity: 0 !important;
}
  
.slide-in-grid-enter
{
  transform: translateY(-5em);
}
.slide-in-grid-leave-to
{
  transform: translateY(-5em);
}


.clickable {
  opacity: 0.7;
  cursor: pointer;
}
.clickable:hover {
  opacity: 1;
}

</style>