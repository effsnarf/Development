<template>

<div class="meow-comp-25472">
<div class="">
<div class="">
<h2 v-text="`${entityName} per ${Math.round(this.per)} minutes in the last ${Math.round(this.since/60)} hours`" class=""></h2>
<div ref="chart1" style="width: 60em; aspect-ratio: 6 / 3;" class=""></div></div></div></div>
</template>
<script>
export default
{"props":{},"data":function() { return {"_meow":{"comp":{"_id":25472,"name":"MG2.Analytics.Dashboard"},"rateLimit":{}},"since":43200,"isDirty":null,"per":1440,"dbAnalyticsItems":null,"entityName":"Generators"}; },"computed":{},"asyncComputed":{},"methods":{"refresh":async function () {
        this.dbAnalyticsItems = (await this.$dbp.get.analytics());

let values = (await this.$dbp.api.analytics.get.items(this.entityName, this.since, this.per));

var data = google.visualization.arrayToDataTable([
  ['Price', 'Size'],
  ...values.map((v,i) => [i,v])
  ]);

var options = {
  //title: 'Interactions',
  //hAxis: {title: 'Square Meters'},
  vAxis: {title: 'Interactions'},
  chartArea: {'width': '85%', 'height': '80%'},
  legend: 'none'
};

var chart = new google.visualization.LineChart(this.$refs.chart1);
chart.draw(data, options);


      },"mounted":function () {
        google.charts.load('current',{packages:['corechart']});

google.charts.setOnLoadCallback(this.refresh);

      },"valueToStr":function (value) {
        if (typeof(value) == `number`) return Math.round(value);

return value;

      }},"watch":{"since":{"deep":true,"immediate":false,"handler":async function(newSince, oldSince) {
      this.isDirty = true;

    }},"isDirty":{"deep":true,"immediate":false,"handler":async function(newIsDirty, oldIsDirty) {
      if (newIsDirty)
{
  this.isDirty = false;
  this.refresh();
}

    }}},"mounted":function () {
        
    if (this.$getApp) this.$app = this.$getApp();
    
    
    
    google.charts.load('current',{packages:['corechart']});

google.charts.setOnLoadCallback(this.refresh);

    
    
      },"name":"MG2-Analytics.Dashboard"}
</script>

<style scoped>

</style>