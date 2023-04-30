<template>

<div class="meow-comp-25479">
<canvas width="800" height="800" ref="canvas1" class="w-100pc h-100pc"></canvas></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25479,"name":"MG2.Canvas"},"rateLimit":{}},"context":null,"width":null,"height":null}; },"computed":{},"asyncComputed":{},"methods":{"angleToXy":function (angle, radius) {
        var cos = Math.cos(angle * (Math.PI / 180));

var sin = Math.sin(angle * (Math.PI / 180));

return {
  x: (radius * cos),
  y: (radius * sin)
};


      },"blur":async function (passes) {
        var imageObject = await this.getImageObject();

var i, x, y;
passes = passes || 4;
this.context.globalAlpha = 0.125;
// Loop for each blur pass.
for (i = 1; i <= passes; i++) {
  for (y = -1; y < 2; y++) {
    for (x = -1; x < 2; x++) {
        this.context.drawImage(imageObject, x, y);
    }
  }
}
this.context.globalAlpha = 1.0;

      },"clear":function () {
        if (!this.context) return;

this.context.clearRect(0, 0, this.$refs.canvas1.width, this.$refs.canvas1.height);

      },"colorToRgba":function (color) {
        if (!color) return null;


if( color[0]=="#" )
{ // hex notation
  color = color.replace( "#", "" ) ;
  var bigint = parseInt(color, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;
  return {r:r,
          g:g,
          b:b,
          a:255} ;
} else if( color.indexOf("rgba(")==0 ) { // already in rgba notation
  color = color.replace( "rgba(", "" ).replace( " ", "" ).replace( ")", "" ).split( "," ) ;
  return {r:color[0],
          g:color[1],
          b:color[2],
          a:color[3]*255} ;
} else {
  console.error( "warning: can't convert color to rgba: " + color ) ;
  return {r:0,
          g:0,
          b:0,
          a:0} ;
}

      },"drawLine":function (x1, y1, x2, y2, width, color) {
        this.context.beginPath();
this.context.moveTo(x1, y1);
this.context.lineTo(x2, y2);

this.context.lineWidth = width;

this.context.strokeStyle = color;

this.context.stroke();

      },"generateRandomColor":function () {
        var letters = '0123456789ABCDEF' ;
var color = '#' ;
for( var i=0; i<6; i++ ) {
    color += letters[Math.floor(Math.random() * 16)] ;
}
return color ;

      },"getImageObject":function () {
        return new Promise((resolve, reject) => {
  var image = new Image();

  $(image).on("load", () => {
    resolve(image);
  });

  image.src = this.$refs.canvas1.toDataURL("image/jpeg");
});

      },"init":function () {
        let canvas1 = this.$refs.canvas1;

this.width = canvas1.width;
this.height = canvas1.height;

this.context = canvas1.getContext("2d");

      },"mounted":function () {
        this.init();

      },"rgbaToColor":function (c) {
        var r = c.r.toString(16).padStart(2, 0);
var g = c.g.toString(16).padStart(2, 0);
var b = c.b.toString(16).padStart(2, 0);
var a = c.a.toString(16).padStart(2, 0);

return `#${r}${g}${b}${a}`;

      }},"watch":{},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    this.init();

    
    
      },"name":"MG2-Canvas"}
</script>

<style scoped>

</style>