<template>
  <div :id="chartId" style="height: 100%; width: 100%;"></div>
</template>

<script>
var echarts = require('echarts');
import * as d3 from 'd3';
export default {
  data() {
    return {
      // backgroundColor: "white",
      chartId: 'heat-' + Math.random().toString(32),
      option: {
        tooltip: {
          position: 'top'
        },
        animation: false,
        grid: {
          height: '70%',
          y: '10%'
        },
        xAxis: {
          type: 'category',
          // data: [],
          splitArea: {
            show: false
          },
          axisTick:{
            show: false
          },
          axisLabel: {
            show: false
          }
        },
        yAxis: {
          type: 'category',
          // data: [],
          splitArea: {
            show: false
          },
          axisTick:{
            show: false
          },
          axisLabel: {
            show: false
          }
        },
        visualMap: {
          // min: 0,
          // max: 10,
          calculable: true,
          orient: 'horizontal',
          // left: 'center',
          // bottom: '5%',
          show: false,
          color: [d3.schemePaired[1], d3.schemeSet1[0]]
        },
        series: [{
          // name: 'Punch Card',
          type: 'heatmap',
          data: [],
          label: {
            normal: {
              show: false
            }
          },
          itemStyle: {
            emphasis: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }
    }
  },
  methods: {
    paint(data, min, max) {
      var myChart = echarts.init(document.getElementById(this.chartId));
      //   this.option.series = scatterOption.seriesData;
      //   this.option.tooltip = scatterOption.tooltip;

      // var hours = ['12a', '1a', '2a', '3a', '4a', '5a', '6a',
      //   '7a', '8a', '9a', '10a', '11a',
      //   '12p', '1p', '2p', '3p', '4p', '5p',
      //   '6p', '7p', '8p', '9p', '10p', '11p'];
      // var days = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

      // var data = [];
      // for (let i = 0; i < days.length; i++) {
      //   for (let j = 0; j < hours.length; j++) {
      //     data.push([i, j, Math.random() * 10])
      //   }
      // }

      // data = data.map(function (item) {
      //   return [item[1], item[0], item[2] || '-'];
      // });

      // this.option.xAxis.data = hours;
      // this.option.yAxis.data = days;
      min && (this.option.visualMap.min = min)
      max && (this.option.visualMap.max = max)
      this.option.series[0].data = data;

      myChart.setOption(this.option);
    }
  }

}
</script>

<style>
</style>
