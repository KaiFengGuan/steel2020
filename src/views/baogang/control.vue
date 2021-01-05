<template>
    <div class="control-outer">
        <el-row>
            <el-col :span="8">
                <div style="background: white; margin-bottom: 10px; padding: 20px 20px 0px 30px;"
                    class="predict-div">
                    <el-row class="level1-row">
                        <el-col v-for="key in ['模型训练']" :key="key" :label="key" style="margin: 6px;font-size:13px" :span="4">{{key}}</el-col>
                        <el-col :span="16">
                        <el-date-picker v-model="trainselect" type="datetimerange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width:360px;"></el-date-picker>
                        </el-col>
                        <el-col :span="3">
                            <el-button type="primary" @click="train" class="button">训练</el-button>
                        </el-col>                      
                    </el-row>
                </div>
                <div style="background: white; margin-bottom: 10px; padding: 20px 20px 0px 30px;">
                <el-form label-position="right" label-width="100px" :model="DataBasicInformation">
                    <!-- style="background: white; margin-bottom: 0px; padding: 20px 20px 0px 30px;"> -->
                    <el-row class="level1-row">
                        <el-col v-for="key in ['模型查询']" :key="key" :label="key" style="margin: 6px;" :span="4">{{key}}</el-col>
                        <el-col :span="16">
                        <el-date-picker v-model="modelselect" type="datetimerange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width:360px;"></el-date-picker>
                        </el-col>
                    <el-dialog title="模型训练时间选择" :visible.sync="selectmodel" width="30%" :before-close="handleClose">
                        <span>这是一段信息</span>
                        <span slot="footer" class="dialog-footer">
                            <el-button @click="selectmodel = false">取 消</el-button>
                            <el-button type="primary" @click="selectmodel = false">确 定</el-button>
                        </span>
                    </el-dialog>
                        <el-col :span="3">
                            <el-button type="primary" @click="selectmodeldate" class="button">查询</el-button>
                        </el-col>                      
                    </el-row>   
                    <el-row class="level1-row" style="margin-top: 10px">
                        <el-col v-for="key in ['模型选择']" :key="key" :label="key" style="margin: 6px;" :span="4">{{key}}</el-col>
                        <el-col :span="16">
                        <el-select v-model="newselectdate" clearable placeholder="请选择"   default-first-option  filterable allow-create>
                            <el-option
                            v-for="item in selectoptions"
                            :key="item.value"
                            :label="item.value"
                            :value="item.value">
                            </el-option>
                        </el-select>
                        <!-- <el-input v-model="newselectdate" placeholder="请输入内容"></el-input> -->
                        </el-col>
                        <el-col :span="3">
                            <el-button type="primary" @click="PredictInit" class="button" style="padding:12px 16px;width:75px">初始化</el-button>
                        </el-col>                      
                    </el-row>                 
                    <!-- <el-form-item v-for="key in ['模型选择']"
                        :key="key" :label="key" style="margin: 10px;font-size:18px">
                        <el-date-picker v-model="selectdate" type="datetime" placeholder="选择日期时间" format="yyyy-MM-dd HH-mm-ss"> 
                        </el-date-picker>
                         <el-select v-model="newselectdate" clearable placeholder="请选择">
                            <el-option
                            v-for="item in selectoptions"
                            :key="item.value"
                            :label="item.value"
                            :value="item.value">
                            </el-option>
                        </el-select>
                        <el-button type="primary" @click="PredictInit" class="button" style="padding:12px 16px;width:75px">初始化</el-button>
                    </el-form-item> -->
                </el-form>
                <el-form label-position="right" label-width="100px" :model="DataBasicInformation" style="margin-top:10px">
                    <el-form-item v-for="key in ['母版ID']"
                        :key="key" :label="key">
                        <el-input size="small" v-model="plateId" style="width: 150px;" @blur="changeId"></el-input>
                        <!-- :disabled="inittime" -->
                        <el-button type="primary" @click="startPredict"  style="float:right;margin-right:12px;width:75px;">预报</el-button>
                    </el-form-item>
                    <el-form-item v-for="key in ['钢种', '目标宽度', '目标长度', '目标厚度']"
                        :key="key" :label="key">
                        {{DataBasicInformation[key]}} 
                    </el-form-item>
                    <!-- <el-form-item label="模型选择">
                        <el-select v-model="DataBasicInformation.select" size="small" style="width: 150px;">
                            <el-option v-for="item in ['预报模型1']"
                                :key="item" :label="item" :value="item">
                            </el-option>
                        </el-select>
                    </el-form-item> -->                   
                </el-form>
                
                </div>
                <div style="background: white; margin-bottom: 10px; padding: 20px 50px;"
                    class="predict-div"
                    v-loading="loading1"
                    element-loading-text="拼命计算中"
                    element-loading-spinner="el-icon-loading"
                    element-loading-background="rgba(0, 0, 0, 0.3)">
                    <el-row class="level1-row">
                        <el-col :span="6">结论</el-col>
                        <el-col :span="18">预报详情</el-col>
                    </el-row>
                    <!-- <el-row class="level1-row">
                        <el-col :span="6">板形质量为好</el-col>
                        <el-col :span="18" v-if="isShow">{{convertFloat(modelPredict.model_predict_one[1], 0)}}%</el-col>
                    </el-row>
                    <el-row class="level1-row">
                        <el-col :span="6">板形质量为坏</el-col>
                        <el-col :span="18" v-if="isShow">{{100 - convertFloat(modelPredict.model_predict_one[1], 0)}}%</el-col>
                    </el-row> -->
                    <el-row class="level1-row">
                        <el-col :span="6">头尾翘曲</el-col>
                        <el-col :span="18" v-if="isShow">{{convertFloat(modelDiagnose[0]*100, 2)}}%</el-col>
                    </el-row>
                    <el-row class="level1-row">
                        <el-col :span="6">中部厚度异常</el-col>
                        <el-col :span="18" v-if="isShow">{{convertFloat(modelDiagnose[1]*100, 2)}}%</el-col>
                    </el-row>
                    <el-row class="level1-row">
                        <el-col :span="6">中浪</el-col>
                        <el-col :span="18" v-if="isShow">{{convertFloat(modelDiagnose[2]*100, 2)}}%</el-col>
                    </el-row>
                    <el-row class="level1-row">
                        <el-col :span="6">左边浪</el-col>
                        <el-col :span="18" v-if="isShow">{{convertFloat(modelDiagnose[3]*100, 2)}}%</el-col>
                    </el-row>
                    <el-row class="level1-row">
                        <el-col :span="6">右边浪</el-col>
                        <el-col :span="18" v-if="isShow">{{convertFloat(modelDiagnose[4]*100, 2)}}%</el-col>
                    </el-row>
                </div>
            </el-col>
            <el-col :span="16" style="background: white; border-left: 10px solid #f3f3f3;">
                <el-row style="border-bottom:3px solid #f3f3f3;">
                    <el-col :span="24" style="border-right:3px solid #f3f3f3"
                        v-loading="loading2"
                        element-loading-text="拼命计算中"
                        element-loading-spinner="el-icon-loading"
                        element-loading-background="rgba(0, 0, 0, 0.3)">
                        <heat-chart ref="temperatureHeatmap1" style="height: 300px;"></heat-chart>
                    </el-col>
                    <!-- <el-col :span="12" style="padding-top:20px;"
                        v-loading="loading3"
                        element-loading-text="拼命计算中"
                        element-loading-spinner="el-icon-loading"
                        element-loading-background="rgba(0, 0, 0, 0.3)">
                        <heat ref="temperatureHeatmap2" style="height: 380px;"></heat>
                    </el-col> -->
                </el-row>
                <el-row>
                    <el-col :span="12" style="border-right: 3px solid #f3f3f3;height:500px;overflow:auto"
                        v-loading="loading4"
                        element-loading-text="拼命计算中"
                        element-loading-spinner="el-icon-loading"
                        element-loading-background="rgba(0, 0, 0, 0.3)">
                        <line-chart  ref="lineChart" style="height:200px"></line-chart>
                        <line-chart  ref="lineChart1" style="height:200px"></line-chart>
                        <line-chart  ref="lineChart2" style="height:200px"></line-chart>
                        <line-chart  ref="lineChart3" style="height:200px"></line-chart>
                        <line-chart  ref="lineChart4" style="height:200px"></line-chart>
                        <line-chart  ref="lineChart5" style="height:200px"></line-chart>
                    </el-col>
                    <el-col :span="12"
                        v-loading="loading5"
                        element-loading-text="拼命计算中"
                        element-loading-spinner="el-icon-loading"
                        element-loading-background="rgba(0, 0, 0, 0.3)">
                        <scatter-line style="height:500px" ref="scatterLine"></scatter-line>
                    </el-col>
                </el-row>
            </el-col>
        </el-row>
        <el-dialog title="提示" :visible.sync="dialogVisible" width="30%" :before-close="handleClose">
        <span center>训练成功</span>
        <span slot="footer" class="dialog-footer">
            <el-button @click="dialogVisible = false">取 消</el-button>
            <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
        </span>
        </el-dialog>
    </div>
</template>

<script>
import lineChart from 'components/charts/lineChart.vue'
import barChart from 'components/charts/barChart.vue'
import heat from "./heat.vue";
import { baogangAxios } from 'services/index.js'
import util from './util.js';
import heatChart from 'components/charts/heatChart.vue'
import scatterLine from './scatterLine.vue'
import { client } from 'src/main.js'
export default {
    components: {
        heat,
        lineChart,
        barChart,
        heatChart, 
        scatterLine
    },
    data () {
        return {
            selectmodel:false,
            dialogVisible:false,
            trainselect:'',
            modelselect:'',
            inittime:true,
            callSubscription:'',
            newselectdate:"",
            selectoptions: [{
                value: '2020-01-01 00:00:00',
                label: '2020-01-01 00:00:00'
                }],
            selectdate:new Date("January 01, 2020 00:00:00"),
            count: 0,
            isShow: false,
            plateId: 19315365000,
            detailArr: ['钢种', '目标宽度', '目标长度', '目标厚度'],
            labelArr: ['bend_flag', 'abnormalThickness_flag', 'horizonWaveflag', 'leftWave_flag', 'rightWave_flag'], 
            linelabelArr:['p1','p2L','p4','p5','p6'],
            DataBasicInformation: {
                select: '预报模型1',
                '钢种': '', 
                '目标宽度': '', 
                '目标长度': '', 
                '目标厚度': ''
            },
            modelDiagnose: [],
            modelPredict: {
                model_predict_one: [0, 100],
                y_test_one: 1
            },
            tableData: [],
            loading1: false,
            loading2: false,
            loading3: false,
            loading4: false,
            loading5: false,
            barObj: {
                ref: 'bar',
                data: [],
                chartData: {
                    title: {
                        text: '',
                        subtext: ''
                    },
                    xAxis: {
                        data: []
                    },
                    legend: {
                        data: []
                    },
                    seriesDataArray: []
                }
            },
            lineObj: {
                ref: 'line',
                data: {},
                chartData: {
                    title: {
                        text: '',
                        subtext: ''
                    },
                    xAxis: {
                        data: []
                    },
                    legend: {
                        data: []
                    },
                    seriesDataArray: []
                }
            },
            otherLineObj: {
                ref: 'otherLine',
                data: {},
                chartData: {
                    title: {
                        text: '',
                        subtext: ''
                    },
                    xAxis: {
                        data: []
                    },
                    legend: {
                        data: []
                    },
                    seriesDataArray: []
                }
            }
        }
    },
    created () {
    },
    mounted () {
        // this.showDetail()
    },
    methods: {
        changeId() {
            this.showDetail()
        },
        showDetail() {
            baogangAxios(`/api/v1.0/ProcessDataByExportData/${this.plateId}/`)
            .then(res => {
                let data = JSON.parse(res.data)
                let dataDetArr = ['platetype', 'tgtwidth', 'tgtlength', 'tgtthickness']
                this.detailArr.forEach((key, index) => {
                    this.DataBasicInformation[key] = data[dataDetArr[index]]
                })
                // let fu_fladc = util.setPoData(data['fu_fladc'])
                // let scanner = util.setPoData(data['Scanner'])
                let heatChart1 = {}
                let max = data['Scanner_max']
                let min = data['Scanner_max']
                // console.log(data['fu_fladc'])
                this.getHeatMapData(data['Scanner'], 'temperatureHeatmap1', min, max)
                let scatterLineDat = []
                this.labelArr.forEach(item => {
                    scatterLineDat.push(data[item])
                })

                let scatterData = util.setPoData(data['fu_fladc'])   
                let scatterCCdata = []
                    for (let i = 0; i < 5; i++) {
                        for (let j = 0; j < 50; j++) {
                            scatterCCdata.push([j, i, data[this.labelArr[i]][j]])
                        }
                    }

                let yaxis = ['头尾翘曲', '中部厚度异常', '中浪', '左边浪', '右边浪']
                this.$refs.scatterLine.paint(scatterCCdata, yaxis, '')

                let lineCCdata = []
                for (let i = 0; i < 5; i++) {
                        lineCCdata.push([i, data[this.linelabelArr[i]][0], data[this.linelabelArr[i]][1]])
                }
                
                this.$refs.lineChart.paint(lineCCdata[0], this.linelabelArr[0], '')
                this.$refs.lineChart1.paint(lineCCdata[1], this.linelabelArr[1], '')
                this.$refs.lineChart2.paint(lineCCdata[2], this.linelabelArr[2], '')
                this.$refs.lineChart3.paint(lineCCdata[3], this.linelabelArr[3], '')
                this.$refs.lineChart4.paint(lineCCdata[4], this.linelabelArr[4], '')
                // this.$refs.scatterLine.paint(scatterData, this.labelArr, '')
                // heatChart1['xAxis'] = fu_fladc
                // heatChart1['yAxis'] = 

                // let heatChart2 = {}
                // heatChart2['xAxis'] = Scanner
                // heatChart2['yAxis'] = 
                // console.log(data)
            })
        },
        selectmodeldate(){
            // this.selectmodel= true
            console.log(this.modelselect)
            let startdate=util.timeFormat(this.modelselect[0])
            let enddate=util.timeFormat(this.modelselect[1])
             baogangAxios(`/api/v1.0/model/selectDeepModelUpdatedTime/${startdate}/${enddate}/`)
                .then(res => {
                    // let data = JSON.parse(res.data)
                    console.log(res.data.result)
                    this.selectoptions=res.data.result.map(item=>({
                        value:item,
                        label:item
                    }))
                    console.log(this.selectoptions)
                })
        },
        callSuccess (result) {
                // this.strategyCallData.custom_output = result
                // this.callLoading = false
                console.log(result)
                this.callSubscription.unsubscribe()
                this.dialogVisible=true
        },
        handleClose(done) {
        this.$confirm('确认关闭？')
          .then(_ => {
            done();
          })
          .catch(_ => {});
      },
        train(){
            console.log(this.trainselect)
            console.log("client test")
            let [startDate,endDate]=this.trainselect
            console.log(util.timeFormat(startDate))
            client.send('/queue/BS2020-startModel', {}, JSON.stringify({
                        startDate: util.timeFormat(startDate),
                        endDate: util.timeFormat(endDate),
                        // custom_params: JSON.stringify(this.strategyCallData.custom_params),
                        // custom_input: JSON.stringify(this.strategyCallData.custom_input)
            }))
            this.callSubscription = client.subscribe('/queue/BS-endModel', message => {
                        let msg = JSON.parse(message.body)
                        console.log(msg)
                        // if (taskId === msg['task_id']) {
                            if (msg.error) {
                                console.log(msg.error)
                                this.$message.error(msg.error)
                            }
                            message.ack()
                            this.callSuccess(msg)
                        // } else {
                        //     message.nack()
                        // }
                    }, { ack: 'client' })
        },
        PredictInit(){
            // console.log(this.selectdate)
            // let date=util.timeFormat(this.selectdate)
            let date=this.newselectdate
            // console.log(date)
            baogangAxios(`/api/v1.0/deepCNNModelInit/${date}/`).then(res=>{
                this.inittime=false;
            })
        },
        startPredict () {
            let date=this.newselectdate
            this.modelDiagnose = []
            baogangAxios(`/api/v1.0/deepCNNModelPredictionByExportData/${this.plateId}/${date}/`)
                    .then(res => {
                        this.isShow = true
                        // console.log(res.data)
                        let data = JSON.parse(res.data)
                        // console.log(data.platetype)
                        Object.keys(data).forEach(key => {
                            this.modelDiagnose.push(data[key][1])
                        })
                        // this.modelDiagnose.push(res)
                    })

            // if (this.count < 1) {
            //     baogangAxios(`/api/v1.0/deepCNNModelInit//${date}`)
            //     .then(() => {
            //         baogangAxios(`/api/v1.0/deepCNNModelPredictionByExportData/${this.plateId}/${date}`)
            //         .then(res => {
            //             this.isShow = true
            //             // console.log(res.data)
            //             let data = JSON.parse(res.data)
            //             // console.log(data.platetype)
            //             Object.keys(data).forEach(key => {
            //                 this.modelDiagnose.push(data[key][1])
            //             })
            //             // this.modelDiagnose.push(res)
            //         })
            //     })
                
            // } else {
            //     baogangAxios(`/api/v1.0/deepCNNModelPredictionByExportData/${this.plateId}`)
            //         .then(res => {
            //             this.isShow = true
            //             // console.log(res.data)
            //             let data = JSON.parse(res.data)
            //             // console.log(data.platetype)
            //             Object.keys(data).forEach(key => {
            //                 this.modelDiagnose.push(data[key][1])
            //             })
            //             // this.modelDiagnose.push(res)
            //         })
            // }
            // this.count++
              
        },
        drawLine () {
            this.lineObj.chartData.xAxis.data = this.lineObj.data.position
            // console.log(this.lineObj.data.position)
            this.lineObj.chartData.yAxis = {
                min: this.lineObj.data.min - 1,
                max: this.lineObj.data.max + 1
            }
            this.lineObj.chartData.legend.data = ['centerthickness', 'leftthickness', 'rightthickness']
            this.lineObj.chartData.seriesDataArray.push(
                {
                    name: 'centerthickness',
                    data: this.lineObj.data.centerthickness
                },
                {
                    name: 'leftthickness',
                    data: this.lineObj.data.leftthickness
                },
                {
                    name: 'rightthickness',
                    data: this.lineObj.data.rightthickness
                },
                {
                    name: 'min',
                    data: this.lineObj.data.position.map(item => this.lineObj.data.min),
                    lineStyle: {
                        normal: {
                            type: 'dashed'
                        }
                    }
                },
                {
                    name: 'max',
                    data: this.lineObj.data.position.map(item => this.lineObj.data.max),
                    lineStyle: {
                        normal: {
                            type: 'dashed'
                        }
                    }
                },
                {
                    name: 'tgt',
                    data: this.lineObj.data.position.map(item => this.lineObj.data.tgt),
                    lineStyle: {
                        normal: {
                            type: 'dashed'
                        }
                    }
                }
            )
            this.$refs[this.lineObj.ref].initChart(this.lineObj.chartData)
            this.loading4 = false
        },
        drawOtherLine () {
            this.otherLineObj.chartData.xAxis.data = this.otherLineObj.data.PostionX
            this.otherLineObj.chartData.legend.data = ['TempP1', 'TempP2L', 'TempP4', 'TempP5', 'TempP6']
            this.otherLineObj.chartData.seriesDataArray.push(
                {
                    name: 'TempP1',
                    data: this.otherLineObj.data.TempP1
                },
                {
                    name: 'TempP2L',
                    data: this.otherLineObj.data.TempP2L
                },
                {
                    name: 'TempP4',
                    data: this.otherLineObj.data.TempP4
                },
                {
                    name: 'TempP5',
                    data: this.otherLineObj.data.TempP5
                },
                {
                    name: 'TempP6',
                    data: this.otherLineObj.data.TempP6
                }
            )
            this.$refs[this.otherLineObj.ref].initChart(this.otherLineObj.chartData)
            this.loading5 = false
        },
        getHeatMapData(temperatureOption, chartRef, min, max) {
            // let fqcOption = (await baogangAxios(`/baogangapi/v1.0/model/FQCdataUpid/${this.plateId}/`)).data;
            // let temperatureOption = (await baogangAxios(`/baogangapi/v1.0/model/Temperature2Ddata/${this.plateId}/`)).data;
            let xaxis = new Array(temperatureOption.length)
            let yaxis = new Array(temperatureOption[0].length)
            let heatOption = {
                seriesDataArray: [{
                    data: transData(temperatureOption)
                }], 
                xAxis: xaxis, 
                yAxis: yaxis,
                min: min,
                max: max
            }
            this.$refs[chartRef].initChart(heatOption);
            // this.$refs[chartRef].initChart(transData(temperatureOption), [], []);

            function transData(temp) {
                var res = [];
                for (let i = 0; i < temp.length; i++) {
                for (let j = 0; j < temp[i].length; j++) {
                    res.push([j, i, temp[i][j]])
                }
                }
                return res;
            }
            this.loading3 = false
        },

        drawBar () {
            this.barObj.chartData.xAxis.data = this.barObj.data.map((item, index) => index + 1)
            this.barObj.chartData.seriesDataArray.push(
                {
                    name: 'bar',
                    data: this.barObj.data
                }
            )
            this.$refs[this.barObj.ref].initChart(this.barObj.chartData)
            this.loading2 = false
        },

        convertFloat (f, n) {
            let p = Math.pow(10, n)
            return Math.round(p-Math.round(f * p) / p)
        }
    }
}
</script>

<style lang="scss">
.button{
    float:right;
    width:75px;
    text-align:center;
}
.control-outer {
    /* border: 1px solid black; */
    background: #f3f3f3;
    margin: -20px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    .predict-div {
        .el-row {
            padding: 10px 0; 
        }
        .level1-row ~ .level1-row {
            border-top: 3px solid #f3f3f3;
            font-size:13px
        }
        .level2-row ~ .level2-row{
            border-top: 3px solid #f3f3f3;
            font-size:13px
        }
    }
}
</style>

