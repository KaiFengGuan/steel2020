<template>
  <div :id="chartId" style="width: 100%; height: 100%;"></div>
</template>

<script>
var echarts = require('echarts');
export default {
  data() {
    return {
      chartId: 'line',
      option: {
        tooltip: {
          trigger: 'item',
          axisPointer: {
            type: 'cross',
            snap: true
          }
        },
        // legend: {
        //   x: 'left'
        // },
        // toolbox: {
        //   feature: {
        //     dataZoom: {
        //       yAxisIndex: 'none'
        //     },
        //     restore: {},
        //     saveAsImage: {}
        //   }
        // },
        // dataZoom: {
        //   show: true
        // },
        grid: {
          left: 50,
          right: 20,
          bottom: 20,
          top: 10
          // height: '75%'
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          axisLine: { onZero: true },
          data: []
        },
        yAxis: {
          // name: '温度',
          type: 'value',
        },
        series: []
      }
    }
  },
  methods: {
    paintLine(optionData) {
      var myChart = echarts.init(document.getElementById(this.chartId));
      this.option.xAxis.data = optionData.xData;
      this.option.series = optionData.seriesData;
      myChart.setOption(this.option, true);
    }
  }
}
</script>

<style>
</style>
