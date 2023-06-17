<template>

<div class="meow-comp-25511">
<div ref="chart1" class="chart"></div></div>
</template>
<script>
export default
{"props":{"values":null},"data":function() { return {"_meow":{"comp":{"_id":25511,"name":"MG2.Chart"},"rateLimit":{}}}; },"computed":{},"asyncComputed":{},"methods":{"mounted":function () {
        google.charts.load('current',{packages:['corechart']});

google.charts.setOnLoadCallback(this.refresh);

      },"refresh":function () {
        if (!this.values) return;

var data = google.visualization.arrayToDataTable([
  ['Price', 'Size'],
  ...this.values.map((v,i) => [i,v])
  ]);

var options = {
  vAxis: {title: 'Interactions'},
  chartArea: {'width': '85%', 'height': '80%'},
  legend: 'none'
};

var chart = new google.visualization.LineChart(this.$refs.chart1);
chart.draw(data, options);


      }},"watch":{"values":{"deep":true,"immediate":false,"handler":async function(newValues, oldValues) {
      this.refresh();

    }}},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    google.charts.load('current',{packages:['corechart']});

google.charts.setOnLoadCallback(this.refresh);

    
    
      },"name":"MG2-Chart"}
</script>

<style scoped>
.chart
{
  width: 60em;
  aspect-ratio: 6 / 3;
  border: 3px solid white;
}

</style>