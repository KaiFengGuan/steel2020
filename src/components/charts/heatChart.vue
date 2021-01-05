<template>
    <div ref="heatChart" :style="{height: customHeight}" style="width: 100%;">
    </div>
</template>

<script>
    import echarts from 'echarts'
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
                    tooltip: {
                        position: 'top'
                    },
                    xAxis: {
                        type: 'category',
                        // data: [0,1]
                    },
                    yAxis: {
                        type: 'category',
                        // data: [0,1]
                    },
                    visualMap: {
                        min: 500,
                        max: 700,
                        show: true,
                        calculable: true,
                        realtime: false,
                        // inRange: {
                        //     color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
                        // }
                    },
                    series: [{
                        name: 'Gaussian',
                        type: 'heatmap',
                        data: [],
                        label: {
                            show: false
                        },
                        progressive: 1000,
                        animation: false
                    }]
                },

                seriesFactory (obj) {
                    this.name = obj.name
                    this.type = 'heatmap'
                    this.data = obj.data,
                    this.progressive = 1000
                    this.animation = false
                    this.label = {
                        show: true,
                        position: 'inside'
                    }
                }
            }
        },

        mounted () {
            this.myChart = echarts.init(this.$refs.heatChart)
        },

        methods: {
            initChart (chartData) {
                // this.option.series = []

                // for (let item of chartData.seriesDataArray) {
                //     this.option.series.push(new this.seriesFactory(item))
                // }

                this.option.series[0].data = chartData.seriesDataArray[0].data
                
                this.option.title = Object.assign(this.option.title, chartData.title)
                // this.option.xAxis.data = chartData.xAxis
                // this.option.yAxis.data = chartData.yAxis
                this.option.visualMap = Object.assign(this.option.visualMap, chartData.visualMap)

                this.option.visualMap.min = chartData.min - 100
                this.option.visualMap.max = chartData.max + 100


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
