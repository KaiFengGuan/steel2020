<template>
    <div ref="barChart" :style="{height: customHeight}" style="width: 100%; text-align: left">
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
                        text: '',
                        subtext: '',
                        textStyle: {
                            color: '#2c3e50',
                            align: 'center'
                        },
                        left: 'center'
                    },
                    legend: {
                        left: 'left',
                        data: [],
                    },
                    tooltip: {
                    },
                    dataZoom: [{
                        type: 'inside',
                        zoomOnMouseWheel: 'ctrl'
                    }],
                    toolbox: {},
                    xAxis: {
                        data: [],
                        silent: false,
                        splitLine: {
                            show: false
                        }
                    },
                    yAxis: {
                    },
                    series: []
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
