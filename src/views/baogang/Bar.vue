<template>
    <div :id="chartId" style="height: 100%; width: 100%;"></div>
</template>
<script>
var echarts = require('echarts');
export default {
    // props: {
    //     chartName: {
    //         type: String,
    //         default: '起个名啊'
    //     }
    // },
    data() {
        return {
            chartId: 'diagnosis-bar' + Math.random().toString(32),
            options: {
                title: {
                    // text: this.chartName,
                    textStyle: {
                        fontSize: 12
                    },
                    left: 'center'
                },
                color: '',
                xAxis: {
                    type: 'category',
                    data: []
                },
                yAxis: {
                    show: false,
                    type: 'value',
                    splitLine: {
                        show: false
                    }
                },
                series: [{
                    data: [],
                    type: 'bar'
                }],
                grid:{
                    left: '2.6%',
                    right: '5%',
                    bottom: '3%',
                    height: '200%',
                    containLabel: true
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
                }
            }
        }
    },
    methods: {
        paint(data, color) {
            var myChart = echarts.init(document.getElementById(this.chartId))
            this.options.xAxis.data = data['xData']
            this.options.series[0].data = data['sData']
            this.options.color = color
            myChart.setOption(this.options)
        }
    }
}
</script>
<style scoped>

</style>