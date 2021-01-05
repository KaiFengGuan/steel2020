<template>
    <div :id="chartId" style="height: 100%; width: 100%;"></div>
</template>
<script>
var echarts = require('echarts');
export default {
    props: {
        chartName: {
            type: String,
            default: '起个名啊'
        }
    },
    data() {
        return {
            chartId: 'diagnosis-scatter' + Math.random().toString(32),
            options: {
                // title: [
                //     {
                //     text: 'PCA诊断T2统计量',
                //     x: '50%',
                //     textAlign: 'center'
                // }, 
                // {
                //     text: 'PCA诊断SPE统计量',
                //     x: '50%',
                //     y:'50%',
                //     textAlign: 'center'
                // }
                // ],
                color: '',
                singleAxis: [{
                    type: 'category',
                    bottom:'60%',
                    height:'50%',
                    boundaryGap: false,
                    data:[],
                    axisLabel: {
                            interval: 40
                            }
                },
                {
                    type: 'category',
                    boundaryGap: false,
                    bottom:'12%',
                    height:'50%',
                    data: [],
                    singleAxisIndex:1,
                    axisLabel: {
                            interval: 40
                            }
                }],
                grid:[
                    {
                        left: '0%',
                        right: '0%',
                        bottom: '55%',
                    },
                    {
                        left: '0%',
                        right: '5%',
                        top:'55%',
                    }
                ],
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
                },
                series:[{
                    type: 'scatter',
                    coordinateSystem: 'singleAxis',
                    stack: 'SPE',
                    z: 2,
                    data: [],
                    symbol :"circle",
                    symbolSize: function (data) {
                        return data*10;
                },},
                {
                    singleAxisIndex:1,
                    type: 'scatter',
                    coordinateSystem: 'singleAxis',
                    stack: 'T2',
                    z: 3,
                    data: [],
                    symbol :"circle",
                    symbolSize: function (data) {
                        return data*10;
                        },
                }]
            }
        }
    },
    methods: {
        paint(data,anotherdata,color) {
            var myChart = echarts.init(document.getElementById(this.chartId))
            this.options.singleAxis[0].data = data['xData']
            this.options.singleAxis[1].data =anotherdata['xData']
            this.options.series[0].data = data['sData']
            this.options.series[1].data = anotherdata['sData']
            this.options.color = color
            myChart.setOption(this.options)
        }
    }
}
</script>
<style scoped>
</style>
