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
    title: {
        text: '',
        left: 'center',
        textStyle:{
            fontSize:12
        }
    },
    tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c}'
    },
    legend: {
        left: 'left',
        data: ['2的指数', '3的指数']
    },
    xAxis: {
        type: 'category',
        name: 'x',
        splitLine: {show: false},
        data: ['一', '二', '三', '四', '五', '六', '七', '八', '九']
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    yAxis: {
        type: 'value',
        name: 'y',
        min:0,
        max:0,
        // axisLabel:{
        //     show:false
        // }
        // minorTick: {
        //     show: true
        // },
        // minorSplitLine: {
        //     show: true
        // }
    },
    series: [
        {
            name: '',
            type: 'line',
            data: []
        },
        {
            name: '',
            type: 'line',
            data: []
        },
        {
            name: '',
            type: 'line',
            data: []
        },{
            name: '',
            type: 'line',
            data: []
        },
        {
            name: '',
            type: 'line',
            data: []
        }
    ]
}
    }
  },
  methods: {
    paint(data, chartAxis, name) {
      var myChart = echarts.init(document.getElementById(this.chartId));
          this.option.series[0].data=data[1]
          this.option.series[0].name=chartAxis
        this.option.title.text=chartAxis
       this.option.xAxis.data=data[0]
        this.option.yAxis.min=Math.min(...data[1])-50
        this.option.yAxis.max=Math.max(...data[1])+50
      myChart.setOption(this.option);
    }
  }

}
</script>

<style>
</style>
