<template>
  <div :id="chartId" style="width: 100%; height: 100%;"></div>
</template>

<script>
var echarts = require('echarts');
export default {
  data() {
    return {
      chartId: 'similar-gauge',
      option: {
        tooltip: {
          formatter: "{a} <br/>{b} : {c}%"
        },
        grid: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        },
        series: [
          {
            name: '相似度',
            type: 'gauge',
            detail: { formatter: `{value}%` },
            data: [{ value: 0 }]
          }
        ]
      }
    }
  },
  methods: {
    paint(similarity) {
      var vm = this;
      var myChart = echarts.init(document.getElementById(this.chartId));
      this.option.series[0].data[0].value = Math.round(similarity * 10000)/100;
      myChart.setOption(this.option);
    }
  }
}
</script>

<style>
</style>
