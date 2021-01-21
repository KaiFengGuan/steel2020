<template>
  <div :id="chartId" :style="{height: customHeight}" style="width: 100%;">
    <!-- <p>hello</p> -->
  </div>
</template>

<script>
var echarts = require('echarts');
import { mapGetters } from 'vuex'
import util from './util.js';
export default {
  props: ['customHeight'],
  data() {
    return {
      chartId: 'timebrush',
      myChart: '',
      option: {
        backgroundColor: 'white',
        brush: {
          toolbox: ['lineX', 'clear'],
          xAxisIndex: 0,
          outOfBrush: {
              colorAlpha: 0.4
          }
        },
        grid: {
          left: 0,
          right: 40,
          top: 0,
          bottom: 0
        },
        tooltip: {
          position: 'right'
        },
        xAxis: {
          data: [],
          silent: false,
          axisLine: { onZero: true },
          splitLine: { show: false },
          splitArea: { show: false }
        },
        yAxis: {
          // inverse: true,
          splitArea: { show: false },
          splitLine: { show: false }
        },
        series: []
      },
      coordRange: []
    }
  },
  // computed: {
  //   ...mapGetters([
  //     'isCollapse'
  //   ])
  // },
  // watch: {
  //   isCollapse () {
  //     this.myChart.resize()
  //   }
  // },
  methods: {
    fangdou(fn, wait) {
        let timeCal = null
        
        return function() {
            // let self = this
            let self = this
            let args = arguments
            if (timeCal) {
                clearTimeout(timeCal)
            }
            timeCal = setTimeout(
                function() {
                   fn.apply(self, args) 
                }
                , wait)
        }
    },
    paint({ paintData, color,starttime}) {
      var vm = this;
      this.myChart = echarts.init(document.getElementById(this.chartId));
      color && (this.option.color = color);
      //// color.reverse()
      // this.option.series = [
      //   {
      //     name: 'good_flag',
      //     type: 'bar',
      //     stack: 'one',
      //     barCategoryGap: "0",
      //     data: paintData.good_flag
      //   },
      //   {
      //     name: 'bad_flag',
      //     type: 'bar',
      //     stack: 'one',
      //     barCategoryGap: "0",
      //     data: paintData.bad_flag
      //   },
      //   {
      //     name: 'good_flag',
      //     type: 'bar',
      //     stack: 'one',
      //     barCategoryGap: "0",
      //     data: paintData.good_flag
      //   },
      //   {
      //     name: 'bad_flag',
      //     type: 'bar',
      //     stack: 'one',
      //     barCategoryGap: "0",
      //     data: paintData.bad_flag
      //   },
      //   {
      //     name: 'good_flag',
      //     type: 'bar',
      //     stack: 'one',
      //     barCategoryGap: "0",
      //     data: paintData.good_flag
      //   }
      // ]
      this.option.series = [
        {
          name: 'good_flag',
          type: 'bar',
          stack: 'one',
          barCategoryGap: "10%",
          data: paintData.good_flag,
        },
        {
          name: 'bad_flag',
          type: 'bar',
          stack: 'one',
          barCategoryGap: "10%",
          data: paintData.bad_flag,
          itemStyle: {
            normal: {
              // opacity: 0.4,
              barBorderRadius: 2,
              // shadowBlur: 3,
              // shadowColor: '#111'
            }
          }
        }
      ]
      this.option.xAxis.data = paintData.endTimeOutput
      if(paintData.endTimeOutput.length===0){
        paintData.endTimeOutput.push(starttime)
        paintData.bad_flag.push(0)
        paintData.good_flag.push(0)
      }
      while(paintData.good_flag.length<30){
          let entry=paintData.endTimeOutput[0]
          entry = entry.replace(/-/g,"/");          
          var datestart = new Date(entry );
          var startTime = new Date(datestart).getTime();
          var diff = 15*86400*1000;
          var endTime = startTime + diff;
          var d = new Date(endTime);
          let datelist=util.getDateList(datestart,d)
          let good_flag=paintData.good_flag
          let bad_flag=paintData.bad_flag
          this.option.xAxis.data=datelist
          while(bad_flag.length<=datelist.length){
            bad_flag.push(0)
          }
          while(good_flag.length<=datelist.length){
            good_flag.push(0)
          }
      }

      this.myChart.setOption(this.option);


      function brushHandller(d) {
        vm.coordRange = d.areas[0].coordRange;
        vm.coordRange[0] && vm.$emit("timeBrushed", [paintData.endTimeOutput[vm.coordRange[0]], vm.coordRange[1] ? paintData.endTimeOutput[vm.coordRange[1]] : paintData.endTimeOutput[vm.coordRange[0]]])
      }
      let task = this.fangdou(brushHandller, 10)
      this.myChart.on("brush", task)

      this.myChart.dispatchAction({
        type: 'brush',
        areas: [
          {
              brushType: 'lineX',
              coordRange: [].concat(this.option.xAxis.data[0], this.option.xAxis.data[0]),
              xAxisIndex: 0
          }
        ]
      })
      this.$emit('timeBrushed', [].concat(this.option.xAxis.data[0], this.option.xAxis.data[0]))
    }
  }
}
</script>

<style>
</style>
