<template>
    <div :id="chartId" style="width: 100%; height: 80%;"></div>
</template>

<script>
    import * as echarts from 'echarts';
    import * as d3 from 'd3'
    import ecStat from 'echarts-stat'
    import { cloneObject } from 'utils/index.js'

    export default {
        props: ['customHeight', 'chartName'],
        data () {
            return {
                chartId: 'diagnosis-bar' + Math.random().toString(32),
                // myChart: null,
                options: {
                    // title: {
                    //     text: '',
                    //     textStyle:{
                    //         // fontStyle :'italic',
                    //         // fontSize:4,
                    //         fontWeight:'normal'
                    //     }
                    // },
                    legend: {
                        data: ['lower', 'self', 'upper'],
                        right: '45px',
                        top: '15px'
                    },
                    grid: {
                        left: '0px',
                        bottom: '0px',
                        containLabel: true
                    },
                    // toolbox: {
                    //     // y: 'bottom',
                    //     feature: {
                    //         magicType: {
                    //             type: ['stack', 'tiled']
                    //         },
                    //         dataView: {},
                    //         saveAsImage: {
                    //             pixelRatio: 2
                    //         }
                    //     }
                    // },
                    tooltip: {},
                    xAxis: {
                        data: [],
                        name: '',
                        splitLine: {
                            show: false
                        },
                        nameTextStyle: {
                            fontSize: '6px',
                            verticalAlign:'middle'
                        },
                        axisLabel:{
                            inside:false,
                            rotate:-25
                        }

                    },
                    yAxis: {
                        name: '',
                        min: 0,
                        max: 0

                    },
                    series: [{
                        name: 'lower',
                        type: 'bar',
                        data: null,
                        itemStyle: {
                            color: '#00daff',
                        },
                        animationDelay: function (idx) {
                            return idx * 10;
                        }
                    }, {
                        name: 'self',
                        type: 'bar',
                        data: null,
                        itemStyle: {
                            color: '#ff005a',
                        },
                        animationDelay: function (idx) {
                            return idx * 10 + 100;
                        }
                    }, {
                        name: 'upper',
                        type: 'bar',
                        data: null,
                        itemStyle: {
                            color: d3.interpolateReds(0.50),
                        },
                        animationDelay: function (idx) {
                            return idx * 10;
                        }
                    }],
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
                    }
                }
            }
        },

        mounted () {
            // this.myChart = echarts.init(this.$refs.threeBar)
        },

        methods: {

            paint(data, chartAxis, color) {
                // console.log(data)
                var myChart = echarts.init(document.getElementById(this.chartId))
                var myChart = echarts.init(document.getElementById(this.chartId))
                this.options.series[0]['data'] = data['min']
                this.options.series[1]['data']  = data['sample']
                this.options.series[2]['data']  = data['max']

                let xData = []
                for (let i = 0; i < data['sample'].length; i++) {
                    xData.push(i)
                }
                this.options.xAxis.data  = xData
                this.options.xAxis.name  = chartAxis[0]
                this.options.yAxis.name  = chartAxis[1]
                this.options.yAxis.min = Math.floor(data.range[0])
                this.options.yAxis.max = Math.ceil(data.range[1])

                this.options.series[1].itemStyle.color = color

                myChart.setOption(this.options)
            }
        }
    }
</script>
