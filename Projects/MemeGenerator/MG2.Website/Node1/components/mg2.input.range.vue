<template>

<div class="meow-comp-25482">
<div class="slidercontainer">
<input type="range" :min="min" :max="max" :value="value" @input="$emit(`input`, parseInt($event.target.value))" :title="title" :step="step" class="slider"/></div></div>
</template>
<script>
export default
{"props":{"min":null,"max":null,"value":null,"title":null,"showNumber":{"default":true},"step":null},"data":function() { return {"_meow":{"comp":{"_id":25482,"name":"MG2.Input.Range"},"rateLimit":{}}}; },"computed":{},"asyncComputed":{},"methods":{},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    
    
    
      },"name":"MG2-Input.Range"}
</script>

<style scoped>
.slidecontainer {
  width: 100%; /* Width of the outside container */
}

/* The slider itself */
.slider {
  -webkit-appearance: none;  /* Override default CSS styles */
  appearance: none;
  width: 100%; /* Full-width */
  height: 25px; /* Specified height */
  background: #ffffff30; /* Grey background */
  box-shadow: inset -3px 3px 2px #000000;
  outline: none; /* Remove outline */
  opacity: 0.7; /* Set transparency (for mouse-over effects on hover) */
  transition: opacity .1s;
}

/* Mouse-over effects */
.slider:hover {
  opacity: 1; /* Fully shown on mouse-over */
}

/* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; /* Override default look */
  appearance: none;
  width: 1.5em; /* Set a specific slider handle width */
  height: 1.5em; /* Slider handle height */
  background: #ffffffa0;
  border-radius: 0.3em;
  box-shadow: inset -2px 2px 1px #ffffff, -2px 2px 1px #000000;
  cursor: pointer; /* Cursor on hover */
}

.slider::-moz-range-thumb {
  width: 25px; /* Set a specific slider handle width */
  height: 25px; /* Slider handle height */
  background: #046DAA; /* Green background */
  cursor: pointer; /* Cursor on hover */
}
</style>