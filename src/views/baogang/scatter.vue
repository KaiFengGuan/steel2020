<template>
  <div :id="chartId"></div>
</template>

<script>
var echarts = require('echarts');
export default {
  data() {
    return {
      chartId: 'scatter',
      option: {
        // grid: {
        //   left: '3%',
        //   right: '7%',
        //   bottom: '3%',
        //   containLabel: true
        // },
        tooltip: {},
        // toolbox: {
        //   feature: {
        //     dataZoom: {},
        //     brush: {
        //       type: ['rect', 'polygon', 'clear']
        //     }
        //   }
        // },
        // brush: {},
        // legend: {
        //   right: 'center'
        // },
        xAxis: [
          {
            show: false,
            type: 'value',
            scale: true,
            splitLine: {
              show: true
            },
            axisLabel: {
                show: false
            }
          }
        ],
        yAxis: [
          {
            show: false,
            type: 'value',
            scale: true,
            splitLine: {
              show: true
            },
            axisLabel: {
                show: false
            }
          }
        ],
        series: []
      }
    }
  },
  methods: {
    paintScatter(scatterOption, highLightFlag, upid) {
    var myChart = echarts.init(document.getElementById(this.chartId));
    this.option.series = scatterOption.seriesData;
    this.option.tooltip = scatterOption.tooltip;
    myChart.dispatchAction({
        type: 'highlight',
        // seriesIndex: [...Array(scatterOption.seriesData.length).keys()],
        name: upid
    });
    // 显示 tooltip
    myChart.dispatchAction({
        type: 'showTip',
        // seriesIndex: [...Array(scatterOption.seriesData.length).keys()],
        name: upid
    });
    if ( highLightFlag === 1 ) {
        myChart.dispatchAction({
            type: 'downplay',
            // seriesIndex: [...Array(scatterOption.seriesData.length).keys()],
            name: upid
        })
    } else if ( highLightFlag === 2 ) {
        // 高亮当前图形
        myChart.dispatchAction({
            type: 'highlight',
            // seriesIndex: [...Array(scatterOption.seriesData.length).keys()],
            name: upid
        });
        // 显示 tooltip
        myChart.dispatchAction({
            type: 'showTip',
            // seriesIndex: [...Array(scatterOption.seriesData.length).keys()],
            name: upid
        });
    }
    myChart.setOption(this.option, true);
    
}
}

}
</script>

<style>
</style>
