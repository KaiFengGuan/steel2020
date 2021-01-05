<template>
  <div :id="chartId" style="width: 100%; height: 100%;"></div>
</template>

<script>
var echarts = require('echarts');
export default {
  data() {
    return {
      chartId: 'radar',
      option: {
        tooltip: {},
        // legend: {
        //   x: 'center',
        // },
        radar: {
            indicator: [],
            center: ['50%', '55%'],
            // radius: 80
          },
        series: {}
      }
    }
  },
  methods: {
    paintRadar(paintData) {
      var myChart = echarts.init(document.getElementById(this.chartId));
      this.option.radar.indicator = paintData.indicator;
      this.option.series = paintData.seriesData;
      myChart.setOption(this.option);
    }
  }
}
</script>

<style>
</style>
