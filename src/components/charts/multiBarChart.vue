<template>
    <div ref="multiBarChart" :style="{height: customHeight}" style="width: 100%; text-align: left">
    </div>
</template>

<script>
    import echarts from 'echarts'
    import ecStat from 'echarts-stat'
    import { cloneObject } from 'utils/index.js'

    export default {
        props: ['customHeight'],
        data () {
            return {
                myChart: null,
                option: {
                    title: {
                        text: '柱状图动画延迟'
                    },
                    legend: {
                        data: ['bar', 'bar2']
                    },
                    toolbox: {
                        // y: 'bottom',
                        feature: {
                            magicType: {
                                type: ['stack', 'tiled']
                            },
                            dataView: {},
                            saveAsImage: {
                                pixelRatio: 2
                            }
                        }
                    },
                    tooltip: {},
                    xAxis: {
                        data: xAxisData,
                        splitLine: {
                            show: false
                        }
                    },
                    yAxis: {
                    },
                    series: [],
                    animationEasing: 'elasticOut',
                    animationDelayUpdate: function (idx) {
                        return idx * 5;
                    }
                },

                seriesFactory (obj) {
                    this.name = obj.name
                    this.type = 'bar'
                    this.data = obj.data
                    this.itemStyle = {
                        // color: '#2c3e50'
                    },
                    this.animationDelay = function (idx) {
                        return idx * 10 + 100;
                    }
                }
            }
        },

        mounted () {
            this.myChart = echarts.init(this.$refs.barChart)
        },

        methods: {
            initChart (chartData) {
                this.option.series = []

                for (let item of chartData.seriesDataArray) {
                    this.option.series.push(new this.seriesFactory(item))
                }
                
                this.option.xAxis = Object.assign(this.option.xAxis, chartData.xAxis)
                this.option.title = Object.assign(this.option.title, chartData.title)
                this.option.legend = Object.assign(this.option.legend, chartData.legend)

                this.myChart.setOption(this.option)
            },

            toggleLoading (boolean) {
                if (boolean) {
                    this.myChart.showLoading('default', {
                        text: '加载中......',
                        textColor: '#c23531',
                        maskColor: 'rgba(232, 240, 241, 0.3)'
                    })
                } else (
                    this.myChart.hideLoading()
                )
            }
        }
    }
</script>


var xAxisData = [];
var data1 = [];
var data2 = [];
for (var i = 0; i < 100; i++) {
    xAxisData.push('类目' + i);
    data1.push((Math.sin(i / 5) * (i / 5 -10) + i / 6) * 5);
    data2.push((Math.cos(i / 5) * (i / 5 -10) + i / 6) * 5);
}

option = {
    
};