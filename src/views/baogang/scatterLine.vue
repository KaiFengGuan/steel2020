<template>
    <div :id="chartId" :style="{height: customHeight}" style="width: 100%; text-align: left"></div>
</template>

<script>
    import echarts from 'echarts'
    import ecStat from 'echarts-stat'
    import { cloneObject } from 'utils/index.js'

    export default {
        props: ['customHeight', 'chartName'],
        data () {
            return {
                chartId: 'scatter-chart' + Math.random().toString(32),
                // myChart: null,
                option: {
                    title: {
                        text: 'Punch Card of Github',
                    },
                    legend: {
                        data: ['Punch Card'],
                        left: 'right'
                    },
                    // tooltip: {
                    //     position: 'top',
                    //     formatter: function (params) {
                    //         return params.value[2] + ' commits in ' + hours[params.value[0]] + ' of ' + days[params.value[1]];
                    //     }
                    // },
                    grid: {
                        left: 2,
                        bottom: 10,
                        right: 10,
                        containLabel: true
                    },
                    xAxis: {
                        type: 'category',
                        data: [],
                        boundaryGap: false,
                        splitLine: {
                            show: true,
                            lineStyle: {
                                color: '#999',
                                type: 'dashed'
                            }
                        },
                        axisLine: {
                            show: false
                        }
                    },
                    yAxis: {
                        type: 'category',
                        data: [],
                        axisLine: {
                            show: false
                        }
                    },
                    series: [{
                        name: 'Punch Card',
                        type: 'scatter',
                        symbolSize: function (val) {
                            return (1-val[2])**2 * 10;
                            // return val[2] * 10;
                        },
                        data: [],
                        animationDelay: function (idx) {
                            return idx * 4;
                        }
                    }]
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

            paint(data, chartAxis, name) {
                var myChart = echarts.init(document.getElementById(this.chartId))
                this.option.series[0]['data'] = data
                let xdata=[]
                for (let i=0;i<50;i++){
                    xdata.push(i)
                }

                this.option.xAxis.data  = xdata
                this.option.yAxis.data  = chartAxis
                this.option.title.text = name
                myChart.setOption(this.option)

            }
        }
    }
</script>
