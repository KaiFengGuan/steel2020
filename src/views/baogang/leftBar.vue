<template>
    <div :id="chartId" style="width: 100%; height: 500%;"></div>
</template>

<script>
    import echarts from 'echarts'
    import ecStat from 'echarts-stat'
    import { cloneObject } from 'utils/index.js'
    import * as d3 from 'd3';

    export default {
        props: ['customHeight', 'chartName'],
        data () {
            return {
                chartId: 'diagnosis-bar' + Math.random().toString(32),
                // myChart: null,
                options: {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                            type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                        },
                        // position: 'right'
                        textStyle: {
                            fontSize: 10
                        }
                    },
                    legend: {
                        data: ['bend', 'abnormalThickness', 'horizonWave', 'leftWave', 'rightWave'],
                        // padding: '2px'
                    },
                    grid: {
                        left: '-120px',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                    },
                    xAxis: {
                        type: 'value',
                        show: false
                    },
                    yAxis: {
                        type: 'category',
                        // data: [],
                        show: false
                    },
                    series: [
                        {
                            name: 'bend',
                            type: 'bar',
                            stack: '总量',
                            label: {
                                show: false,
                                position: 'insideRight'
                            },
                            data: [],
                            color: '#d92027'
                        },
                        {
                            name: 'abnormalThickness',
                            type: 'bar',
                            stack: '总量',
                            label: {
                                show: false,
                                position: 'insideRight'
                            },
                            data: [],
                            color: '#ea5455'
                        },
                        {
                            name: 'horizonWave',
                            type: 'bar',
                            stack: '总量',
                            label: {
                                show: false,
                                position: 'insideRight'
                            },
                            data: [],
                            color: '#ff9234'
                        },
                        {
                            name: 'leftWave',
                            type: 'bar',
                            stack: '总量',
                            label: {
                                show: false,
                                position: 'insideRight'
                            },
                            data: [],
                            color: '#ffcd3c'
                        },
                        {
                            name: 'rightWave',
                            type: 'bar',
                            stack: '总量',
                            label: {
                                show: false,
                                position: 'insideRight'
                            },
                            data: [],
                            color: '#ebdc87'
                        }
                    ]
                },

                seriesFactory (obj) {
                    this.name = obj.name
                    this.type = 'bar'
                    this.data = obj.data
                    this.itemStyle = {
                        // color: '#2c3e50'
                    }
                }
            }
        },

        mounted () {
            // this.myChart = echarts.init(this.$refs.threeBar)
        },

        methods: {

            paint(chartData) {
                var myChart = echarts.init(document.getElementById(this.chartId))
                var myChart = echarts.init(document.getElementById(this.chartId))
                this.options.series[0]['data'] = chartData['fault0']
                this.options.series[1]['data']  = chartData['fault1']
                this.options.series[2]['data']  = chartData['fault2']
                this.options.series[3]['data']  = chartData['fault3']
                this.options.series[4]['data']  = chartData['fault4']

                let xData = []
                for (let i = 0; i < chartData['fault1'].length; i++) {
                    xData.push(i)
                }
                this.options.xAxis.data  = xData
                // this.options.xAxis.name  = chartAxis[0]
                this.options.yAxis.data  = chartData['label']

                myChart.setOption(this.options)
            }
        }
    }
</script>
