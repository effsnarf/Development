<template>

<div v-if="item" style="aspect-ratio: 1" class="meow-comp-25478 w-100pc">
<div class="overflow-hidden layers">
<div :style="getStyle()" class="">
<component ref="canvas1" @hook:mounted="onCanvasMounted" is="mg2-canvas" class=""></component></div>
<img :src="`https://img.memegenerator.net/images/${item.image.mgImage._id}.${item.image.mgImage.ext||'jpg'}`" :style="{ 'object-fit': (item.image.fit || 'contain') }" v-if="item?.image?.mgImage?._id" @load="$emit(`load`)" class=""/></div></div>
</template>
<script>
export default
{"props":{"item":{"default":{"colors":["#ff0000","#ffff00"],"areas":6,"shades":6,"rotate":90}}},"data":function() { return {"_meow":{"comp":{"_id":25478,"name":"MG2.Template.Rainbow"},"rateLimit":{}},"canvas1":null}; },"computed":{},"asyncComputed":{},"methods":{"draw":function () {
        if (!this.item) return;
if (!this.item.areas) return;
if (!this.item.colors.length) return;

let canvas1 = this.$refs.canvas1;

var radius = Math.max(canvas1?.width, canvas1?.height);

if (!radius)
{
  setTimeout(this.draw.bind(this), 100);
  return;
}

var middle = {
  x: (canvas1.width / 2),
  y: (canvas1.height / 2)
};

canvas1.clear();

var lineWidth = 10;

var angle = (360 / this.item.areas);

var color0 = this.item.colors[0];
var color1 = this.item.colors[1];

var col0 = canvas1.colorToRgba(color0);
var col1 = canvas1.colorToRgba(color1);

// tween two colors, repeating
var colors = [];
var colorsCount = (this.item.shades || this.item.areas);
if (!colorsCount) return;

for (var i = 0; i < colorsCount; i++)
{
  var shadeAmount = (i == 0) ? 0 : (i / (colorsCount - 1));
  var colorValue = {
    r: Math.round(col0.r + (col1.r - col0.r) * shadeAmount),
    g: Math.round(col0.g + (col1.g - col0.g) * shadeAmount),
    b: Math.round(col0.b + (col1.b - col0.b) * shadeAmount),
    a: Math.round(col0.a + (col1.a - col0.a) * shadeAmount),
  };
  var hexColor = canvas1.rgbaToColor(colorValue).substr(1);
  var lineColor = `#${hexColor}`;
  colors.push(lineColor);
}

var colorIndex = 0;

for (var i = 0; i < 360; i += angle)
{
  var k = (this.item.rotate + i);

  // gradient
  //var colorValue = Math.round(i / 360 * 255).toString(16).padStart(2, "0");
  //var hexColor = colorValue.toString(16);

  for (var j = 0; j < angle; j += 1)
  {
    var end = canvas1.angleToXy((k + j), radius);

    canvas1.drawLine(middle.x, middle.y, (middle.x + end.x), (middle.y - end.y), lineWidth, colors[colorIndex]);
  }
  colorIndex = ((colorIndex + 1) % colorsCount);
}

      },"mounted":function () {
        //this.canvas1 = this.$refs.canvas1;

      },"onCanvasMounted":function () {
        setTimeout(this.draw.bind(this), 0);

this.$watch("item", this.draw.bind(this), {deep: true});

      },"getStyle":function () {
        let style = {};

let blur = Math.round(20 * ((this.item.blur || 0) / 100));

style.filter = `blur(${blur}px)`;

return style;

      }},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    //this.canvas1 = this.$refs.canvas1;

    
    
      },"name":"MG2-Template.Rainbow"}
</script>

<style scoped>
.layers,
.layers > *
{
  width: 100%;
  height: 100%;
}

.layers
{
  position: relative;
}

.layers > *
{
  position: absolute;
}


</style>