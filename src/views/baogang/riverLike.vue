<template>
    <div :id="chartId" style="width: 100%; height: 100%;"></div>
</template>
<script>
var echarts = require('echarts');
import myJsonData from "./myData.js"
export default {
    props: {
        chartName: {
            type: String,
            default: '起个名啊'
        }
    },
    data() {
        return {
            chartId: 'processDetail' + Math.random().toString(32),
            option: {
                title: {
                    // text: this.chartName,
                    textStyle: {
                        fontSize: 12
                    },
                    // subtext: 'Example in MetricsGraphics.js',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross',
                        animation: false,
                        label: {
                            backgroundColor: '#ccc',
                            borderColor: '#aaa',
                            borderWidth: 1,
                            shadowBlur: 0,
                            shadowOffsetX: 0,
                            shadowOffsetY: 0,
                            textStyle: {
                                color: '#222'
                            }
                        }
                    },
                    formatter: function (params) {
                        return params[2].name + '<br />' + params[2].value;
                    }
                },
                grid: {
                    top: 0,
                    left: '3.7%',
                    right: '5%',
                    bottom: '10%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    splitLine: {
                        show: false
                    },
                    boundaryGap: false
                },
                yAxis: {
                    show: false,
                    axisLabel: {
                    },
                    axisPointer: {
                    },
                    splitNumber: 3,
                    splitLine: {
                        show: false
                    }
                },
                series: [{
                    name: 'L',
                    type: 'line',
                    data: [],
                    lineStyle: {
                        normal: {
                            opacity: 0
                        }
                    },
                    stack: 'confidence-band',
                    symbol: 'none'
                }, {
                    name: 'U',
                    type: 'line',
                    data: [],
                    lineStyle: {
                        normal: {
                            opacity: 0
                        }
                    },
                    areaStyle: {
                        normal: {
                            // color: '#3888fa'
                            color:'#86b6fc'
                        }
                    },
                    stack: 'confidence-band',
                    symbol: 'none'
                }, {
                    type: 'line',
                    data: [],
                    hoverAnimation: false,
                    symbolSize: 6,
                    itemStyle: {
                        normal: {
                            // color: '#c23531'
                            color: ''
                        }
                    },
                    showSymbol: false
                }]
            }
        }
    },
    methods: {
        paint (data, color) {
            var myChart = echarts.init(document.getElementById(this.chartId))
            myChart.showLoading();
            myChart.hideLoading();
            var base = -data.reduce(function (min, val) {
                return Math.floor(Math.min(min, val.l));
            }, Infinity);
            let data1 = data.map(function (item) {
                        return item.l + base
                    })
            let data2 = data.map(function (item) {
                        return item.u - item.l
                    })
            let data3 = data.map(function (item) {
                        return item.value + base
                    })
            this.option.series[0].data = data1
            this.option.series[1].data = data2
            this.option.series[2].data = data3
            this.option.yAxis.axisLabel = {
                formatter: function (val) {
                    // return (val - base) * 100 + '%';
                    return val
                }
            },
            this.option.yAxis.axisPointer = {
                label: {
                    formatter: function (params) {
                        // return ((params.value - base) * 100).toFixed(1) + '%'
                        return params.valu
                    }
                }
            },
            this.option.xAxis.data = data.map(function (item) {
                        return item.name
                    }),
            this.option.xAxis.axisLabel = {
                // formatter: function (value, idx) {
                //     // var name = new Date(value)
                //     // return idx === 0 ? value : [name.getMonth() + 1, name.getDate()].join('-')
                //     return idx === 0 ? value : [name.getMonth() + 1, name.getDate()].join('-')
                // }
            },
            this.option.series[2].itemStyle.normal.color = color

            myChart.setOption(this.option)
        }
    }
}
</script>