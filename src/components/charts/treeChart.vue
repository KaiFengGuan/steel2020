<template>
    <div :style="{height: customHeight}">
        <div style="width: 10rem; float: right;">
            <Select v-model="selection" @on-change="selectChange">
                <Option v-for="item in options" :value="item.name" :key="item.name">{{ item.name }}</Option>
            </Select>
        </div>
        <div ref="treeChart" style="height: 100%;"></div>
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
                    title: '',
                    series: []
                },
                seriesTemplate: {
                    type: 'tree',
                    data: [],
                    symbolSize: 10,
                    top: '0%',
                    left: '15%',
                    bottom: '5%',
                    right: '15%',
                    label: {
                        normal: {
                            position: 'left',
                            verticalAlign: 'middle',
                            align: 'right',
                            fontSize: 15,
                            color: '#fff'
                        }
                    },
                    leaves: {
                        label: {
                            normal: {
                                position: 'right',
                                verticalAlign: 'middle',
                                align: 'left',
                                color: '#fff'
                            }
                        }
                    },
                    expandAndCollapse: true,
                    animationDuration: 550,
                    animationDurationUpdate: 750
                },
                seriesObj: {},

                selection: '',
                options: []
            }
        },

        methods: {
            initChart (chartData) {

                this.myChart = echarts.init(this.$refs.treeChart)

                this.options = chartData.seriesData
                this.selection = chartData.seriesData[0].name

                for (let item of chartData.seriesData) {
                    let template = cloneObject(this.seriesTemplate)
                    template.data = [item]
                    this.seriesObj[item.name] = template
                }

                this.option.series = [this.seriesObj[chartData.seriesData[0].name]]

                this.myChart.setOption(this.option)
            },

            selectChange (value) {
                this.option.series = [this.seriesObj[value]]
                this.myChart.setOption(this.option)
            }
        }
    }
</script>

