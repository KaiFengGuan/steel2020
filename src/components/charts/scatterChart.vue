<template>
    <div ref="scatterChart" :style="{height: customHeight}" style="width: 100%; text-align: left">
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
                        // name: ['scatter', 'regressionLine'],
                        data: ['实际值预测值', '拟合曲线'],
                    },
                    tooltip: {
                        trigger: 'axis',
                        formatter (params) {
                            return `实际值：${params[0].value[0]}<br />
                            预报值：${params[0].value[1]}<br />`
                        }
                    },
                    dataZoom: [{
                        type: 'inside',
                        zoomOnMouseWheel: 'ctrl'
                    }],
                    toolbox: {
                        feature: {
                            dataZoom: {
                                show: true,
                            }
                        }
                    },
                    xAxis: {
                        type: 'value',
                        scale: true,
                        min: 'dataMin',
                        max: 'dataMax',
                        boundaryGap: false
                    },
                    yAxis: {
                        type: 'value',
                        scale: true,
                        min: 'dataMin',
                        max: 'dataMax'
                    },
                    series: [
                        {
                            name: '实际值预测值',
                            type: 'scatter',
                            // [x, y]坐标形式的数据
                            data: [],
                            smooth: true,
                            itemStyle: {
                                color: '#c23531'
                            }
                        },
                        {
                            name: '拟合曲线',
                            type: 'line',
                            data: [],
                            showSymbol: false,
                            itemStyle: {
                                color: '#2c3e50'
                            },
                            markPoint: {
                                itemStyle: {
                                    normal: {
                                        color: 'transparent'
                                    }
                                },
                                label: {
                                    normal: {
                                        show: true,
                                        position: 'left',
                                        formatter: '',
                                        textStyle: {
                                            color: '#2c3e50',
                                            // color: 'blue',
                                            fontSize: 15
                                        }
                                    }
                                },
                            }
                        }
                    ]
                }
            }
        },

        mounted () {
            this.myChart = echarts.init(this.$refs.scatterChart)
        },

        methods: {
            initChart (chartData, showLine) {
                if (showLine) {
                    let localSeriesData = chartData.seriesData.map(item => {
                        return [ parseFloat(item[0]), parseFloat(item[1]) ]
                    }).sort((a, b) => a[0] - b[0])

                    let myRegression = ecStat.regression('linear', localSeriesData)
                    this.option.series[1].data = myRegression.points
                    this.option.series[1].markPoint.label.normal.formatter = myRegression.expression
                    this.option.series[1].markPoint.data = [{
                        coord: myRegression.points[myRegression.points.length - 1]
                    }]
                } else {
                    this.option.length = 1
                }

                this.option.series[0].data = chartData.seriesData
                this.option.title = Object.assign(this.option.title, chartData.title)

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
