<template>
	<div class="custom-marey">
		<el-col :span="24">
		<el-row :style="cssVars">
			<el-col :span="5">
				<el-row>
					<div class="title-background"> <span id="title-first">iPWIMVis</span></div>
					<el-row>
						<el-col :span="10" id="month-data"><span>Month Picker</span></el-col>
						<el-col :span="10">
							<el-date-picker v-model="startmonth" type="month" placeholder="选择月" @change="changeTime"
								style="width:110px;margin:10px 0px 10px 20px" size="mini"></el-date-picker>
						</el-col>
						<el-col :span="4">
							<el-button style="margin-top:10px" size="small" plain @click="getHttpData" icon="el-icon-search"></el-button>
						</el-col>
					</el-row>
					<el-row>
						<el-card class="myel-card">
							<div class="my-card-title" slot="header">
								<span>Embedding View</span>
								<el-select size="mini" v-model="algorithmSelected" @change="getAlgorithmData" class="card-select">
									<el-option v-for="option in algorithmOptions" :key="option" :label="option" :value="option"></el-option>
								</el-select>
							</div>
							<div class="my-card-body">
								<el-row>
									<slider style="height:80px;width:100%" ref="brushSlider"></slider>
								</el-row>
								<el-row>
								<scatterlog ref="scatterCate" style="height:305px;" @scatterMouse="scatterMouse"></scatterlog>
								</el-row>
							</div>
						</el-card>
					</el-row>
				</el-row>
				<el-row>
					<el-card class="myel-card">		 
						<div class="my-card-title" slot="header" >
								<span style="margin-left:5px">Tabular View</span>
								<el-button style="height:25px; float:right;" size="small" plain @click="newdiagnose" icon="el-icon-search" :disabled='!diagnosisState'></el-button>
						</div>
						<div class="my-card-body" style="padding-top:5px; overflow:scroll">
							<brush-slider ref="parallel" style="height:490px;width:100%" @parallMouse="parallMouse" :diagnosisState='diagnosisState'></brush-slider>
						</div>
						<!-- <el-col :span="4"> -->
					</el-card>
				</el-row>
			</el-col>
			<el-col :span="19" style="margin-top:-2px"
				v-loading="loadingDataLoading"
				element-loading-text="loading..."
				element-loading-spinner="el-icon-loading"
				element-loading-background="rgba(0, 0, 0, 0.3)" id="condition_view">
				<el-row>
					<el-card class="myel-card">
						<div class="my-card-title" slot="header">
							<el-col :span="15"><span>Condition View</span></el-col>
							<el-col :span="1" style="font-size: 12px;margin:2px 0px;padding-left:0px">MinRange</el-col>
							<el-col :span="2">
								<el-slider v-model="minrange" :step="1" :min="5" :max="40" class="my-slider"
									style="margin:0px 0;color:#999a9d;width: 80%;margin-top:-8px;padding-left:20px" input-size="mini" @change="mareyUpdate"></el-slider>
							</el-col>
							<el-col :span="1" style="font-size: 12px;margin:2px 0px;">MinMerge</el-col>
							<el-col :span="2">
								<el-slider v-model="minconflict" :step="1" :min="1" :max="10" class="my-slider"
									style="margin:0px 0;color:#999a9d;width: 80%;margin-top:-8px;padding-left:20px" input-size="mini" @change="mareyUpdate"></el-slider>
							</el-col>
							<el-col :span="1" :class="{activeStyle: isSwitch, deActiveStyle : !isSwitch}">
								<el-button size="mini" round style="height:25px;width: 45px;margin:-2px;padding:0px;"  type="info" plain @click="changeColor">
									<img src="../../assets/images/color.svg" style="height:16px;width:16px;transform: translate(0px, -2px)"></el-button>
							</el-col>
							<el-col :span="1" :class="{activeStyle: isMerge, deActiveStyle : !isMerge}">
								<el-button size="mini" round style="height:25px;width: 45px;margin:-2px;padding:-2px" type="info" plain @click="mergeUpdate">
									<img src="../../assets/images/diagnosis.svg" style="height:16px;width:16px;"></el-button>
							</el-col>
              <el-col :span="1">
								<el-popover placement="bottom" width="350" trigger="hover" style="margin-right:11px;padding:25px">
                  <el-row class="toltip">
                    <el-row :gutter="8">
                      <el-col :span="8" style="font-size: 13px;">
                        <div style="height: 24px;padding-right:5px;margin:9px 0px 15px 0px" class="fontcolor">ThicknessGap </div>
                        <div style="height: 24px;padding-left:16px;margin:15px 0" class="fontcolor">WidthGap </div>
                        <div style="height: 24px;padding-left:12px;margin:15px 0" class="fontcolor">LengthGap </div>
                      </el-col>
                      <el-col :span="10" id="imput-line">
                        <el-slider v-model="plateTempProp.thickness" :step="1" :min="1" :max="20" style="margin:0px 0;color:#999a9d" input-size="mini" ></el-slider>
                        <el-slider v-model="plateTempProp.width" :step="1" :min="10" :max="2500" style="margin:3px 0;color:#999a9d" input-size="mini" ></el-slider>
                        <el-slider v-model="plateTempProp.length" :step="1" :min="1" :max="25" style="margin:3px 0;color:#999a9d" input-size="mini" ></el-slider>
                      </el-col>
                      <el-col :span="4">
                        <div style="margin:5px 0px 21.5px 0px" class="fontcolor">{{plateTempProp.thickness}}mm</div>
                        <div style="margin:21.5px 0px" class="fontcolor">{{plateTempProp.width}}mm</div>
                        <div style="margin:21.5px 0px" class="fontcolor"> {{plateTempProp.length}}m</div>
                      </el-col>
                    </el-row>
                    <el-form size="mini" label-width="100px" >
                      <el-form-item label="Category" style="padding-right: 10px;font-size:13px;padding-left:2px" class="abel">
                          <el-select v-model="plateTempPropvalue"   placeholder="请选择钢板型号" size="mini" multiple style="margin:6px">
                          <el-option v-for="item in plateoptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
                        </el-select>
                      </el-form-item>
                    </el-form>
                  </el-row>
                  <el-row :gutter="8">
                    <el-col :span="8" style="font-size: 13px;">
                      <div style="height: 24px;padding-left:40px;margin:8px 0px" class="fontcolor">Range </div>                
                    </el-col>
                    <el-col :span="10" id="imput-line">
                      <el-slider v-model="plateTempProp.deviation" :step="1" :min="0" :max="50" style="margin:2.5px;color:#999a9d" ></el-slider>
                    </el-col>
                    <el-col :span="4">
                      <div style="margin:2px">{{plateTempProp.deviation}}%</div>
                    </el-col>
                  </el-row>
                  <img src="../../assets/images/config.svg" style="height:16px;width:16px;vertical-align: middle;line-height:1.5" slot="reference">
								</el-popover>
							</el-col>
						</div>
						<div class="my-card-body">
							<marey-chart style="text-align: center; height: 1028px;width:100%;" ref="mareyChart"  @trainClick="trainClick" @trainMouse="trainMouse" @clickDiagnosisButton="clickDiagnosisButton"></marey-chart>
						</div>
					</el-card>
				</el-row>
				<!-- <transition name="diagnosis"> -->
				<el-row>
					<el-card class="myel-card diagnosis_view" id="diagnosis_view_id" style="height: 540px; transform: translateY(540px);">
						<div class="my-card-title" slot="header">
							<el-col :span="14"><span>Diagnosis View</span></el-col>
							<el-col :span="1" style="font-size: 12px;margin:2px 0px">CurveSize</el-col>
							<el-col :span="2">
								<el-slider v-model="curvesize" :step="0.01" :min="0" :max="1" class="my-slider"
									style="margin:0px 0;color:#999a9d;width: 80%;margin-top:-8px;padding-left:20px" input-size="mini" @change="curveUpdate"></el-slider>
							</el-col>
							<el-col :span="1" style="font-size: 12px;margin:2px 0px">MultiPara</el-col>
							<el-col :span="2">
								<el-slider v-model="multisize" :step="1" :min="10" :max="40" class="my-slider"
									style="margin:0px 0;color:#999a9d;width: 80%;margin-top:-8px;padding-left:20px" input-size="mini" @change="multiUpdate"></el-slider>
							</el-col>
							<el-col :span="1" style="font-size: 12px;margin:2px 0px;">CorrConfig</el-col>
							<el-col :span="2">
								<el-slider v-model="corrsize" :step="0.1" :min="0" :max="1" class="my-slider"
									style="margin:0px 0;color:#999a9d;width: 80%;margin-top:-8px;padding-left:20px" input-size="mini" @change="corrUpdate"></el-slider>
							</el-col>
							<el-col :span="1">
								<el-popover placement="bottom" width="350" trigger="hover" style="margin-right:11px;padding:25px">
								<el-row class="toltip">
									<el-row :gutter="8">
										<el-col :span="8" style="font-size: 13px;">
											<div style="height: 24px;padding-right:5px;margin:9px 0px 15px 0px" class="fontcolor">ThicknessGap </div>
											<div style="height: 24px;padding-left:16px;margin:15px 0" class="fontcolor">WidthGap </div>
											<div style="height: 24px;padding-left:12px;margin:15px 0" class="fontcolor">LengthGap </div>
										</el-col>
										<el-col :span="10" id="imput-line">
											<el-slider v-model="plateTempProp.thickness" :step="1" :min="1" :max="20" style="margin:0px 0;color:#999a9d" input-size="mini" ></el-slider>
											<el-slider v-model="plateTempProp.width" :step="1" :min="10" :max="2500" style="margin:3px 0;color:#999a9d" input-size="mini" ></el-slider>
											<el-slider v-model="plateTempProp.length" :step="1" :min="1" :max="25" style="margin:3px 0;color:#999a9d" input-size="mini" ></el-slider>
										</el-col>
										<el-col :span="4">
											<div style="margin:5px 0px 21.5px 0px" class="fontcolor">{{plateTempProp.thickness}}mm</div>
											<div style="margin:21.5px 0px" class="fontcolor">{{plateTempProp.width}}mm</div>
											<div style="margin:21.5px 0px" class="fontcolor"> {{plateTempProp.length}}m</div>
										</el-col>
									</el-row>
									<el-form size="mini" label-width="100px" >
										<el-form-item label="Category" style="padding-right: 10px;font-size:13px;padding-left:2px" class="abel">
												<el-select v-model="plateTempPropvalue"   placeholder="请选择钢板型号" size="mini" multiple style="margin:6px">
												<el-option v-for="item in plateoptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
											</el-select>
										</el-form-item>
									</el-form>
								</el-row>
								<el-row :gutter="8">
									<el-col :span="8" style="font-size: 13px;">
										<div style="height: 24px;padding-left:40px;margin:8px 0px" class="fontcolor">Range </div>                
									</el-col>
									<el-col :span="10" id="imput-line">
										<el-slider v-model="plateTempProp.deviation" :step="1" :min="0" :max="50" style="margin:2.5px;color:#999a9d" ></el-slider>
									</el-col>
									<el-col :span="4">
										<div style="margin:2px">{{plateTempProp.deviation}}%</div>
									</el-col>
								</el-row>
									<img src="../../assets/images/config.svg" style="height:16px;width:16px;vertical-align: middle;line-height:1.5" slot="reference">
								</el-popover>
							</el-col>
						</div>
						<div style="padding-right:5px; padding-bottom : 5px">
						<el-col :span="24">
							<el-card class="myel-card myelTab myel-upid">
								<div class="my-card-body">
									<wheeler ref="wheelering" style="height:490px" @wheelMouse="wheelMouse"></wheeler>
								</div>
							</el-card>
						</el-col>
						</div>
					</el-card>		
				</el-row>
				<!-- </transition> -->
				
			<!-- <el-row style="margin: 2px 0; overflow:auto; display:flex;flex-wrap: nowrap;">
				<el-col :span="8" style="flex-shrink: 0;flex-grow: 0;" class="my-card" v-for="item of processInTurn" :key = item>
					<el-card class="my-card-body-detail">
						<div class="my-card-title" style="height: 3px;font-size:10px;font-weight:150">{{item}}</div>
						<div class="my-card-body-detail-some">
							<three-bar :ref="item" style="height: 190px;" ></three-bar>
						</div>
					</el-card>
				</el-col>
			</el-row> -->
			</el-col>
			<el-button circle  icon="el-icon-more" @click="changeDiagnosisVisible" id="diagnosis_button"></el-button>
		</el-row>			
		</el-col>
		<tooltip></tooltip>
	</div>
</template>

<script>
import anime from 'animejs'
import * as d3 from 'd3';
import util from './util.js';
// import mareyChart from './mareyChart_copy.vue';
import mareyChart from './mareyChart2.vue';
import scatterlog from 'components/charts/scatterlog.vue';
import tooltip from 'components/tooltip.vue';
import timeBrush from './timeBrush.vue';
import wheeler from 'components/composition/index.vue';
import slider from './slider.vue'
import brushSlider from "components/charts/brushableParallel.vue"
import { baogangAxios, baogangPlotAxios } from 'services/index.js'
import mergeTimesData from '../../data/layout/mergeTimesData.js'
import {mareyChartBatchSpec} from '../../data/layout/monitor.js'
import {filterMareyChartEventIcon} from '../../data/layout/mareyChartEventIcon.js'
import {getBatchHeader, updateRange} from '../../utils/marey.js'
import * as steel from 'services/steel.js'
import { mapGetters, mapMutations} from 'vuex'

import jsonData from '../data/jsonData.json'
import monitorData from '../data/monitorData.json'
import scatterData from '../data/scatterData.json'
// import processData from './processData.json'
// import batchData from './batchData.json'

export default {
	components: { mareyChart, timeBrush, brushSlider, scatterlog, wheeler, slider, tooltip},
	data() {
		return {
			diagnosisVisible: false,
			isMerge: true,
			minrange: 10,
			minconflict: 4,
			symbolvalue:0.05,
			linesize:0.25,
      diagnosisData:[],
      mergeresult: undefined,
			processName:'',
			plateoptions:[{
					value: 'All',
					label: 'All'
        }],
      req_body: {
        "slabthickness": "[]",
        "tgtdischargetemp": "[]",
        "tgtplatethickness": "[]",
        "tgtwidth": "[]",
        "tgtplatelength2": "[]",
        "tgttmplatetemp": "[]",
        "cooling_start_temp": "[]",
        "cooling_stop_temp": "[]",
        "cooling_rate1": "[]",
        "productcategory": "[]",
        "steelspec": "[]",
        "status_cooling": "0"
      },
			diagnosisState: false,
			orderoptions:[{
					value: 'Number',
					label: 'Number'
				},{
					value: 'Deviation',
					label: 'Deviation'
				},{
					value: 'Original',
					label: 'Original'
				}],
			orderselect:'Deviation',
			plateTempPropvalue:['All'],
			startmonth: new Date(2021, 2, 10, 0, 0),
			time: undefined,
			corrdata:[],
			selectedTrainColor: 'green',
			interval: 4,
			intervalOptions: [6, 12, 24, 48],
			algorithmOptions: [
				"T-SNE", "UMAP", "ISOMAP", "PCA"
			],
			batchData: [],
			algorithmUrls: {
				"T-SNE": "/newbaogangapi/v1.0/model/VisualizationTsne/",
				"UMAP": "/newbaogangapi/v1.0/model/VisualizationUMAP/",
				"ISOMAP": "/newbaogangapi/v1.0/model/VisualizationISOMAP/",
				"PCA": "/newbaogangapi/v1.0/model/VisualizationPCA/"
			},
			algorithmSelected: "T-SNE",
			plateTempProp: {
				slabid: "44191730513",
				width: 30,
				length: 10,
				thickness: 5,
				deviation:25
			},
			detailProcess: [],
			processInTurn: [null, null ,null, null ,null, null],
			processData: {},
			scatterData:[],
			processArray: ['heat', 'roll', 'cool'],
			loadingDataLoading: false,
			radio: 0,
			chooseList: [],
			upidSelect: ["", "  "],
			requestHeader: [],
			corrsize: 0.5,
			multisize: 20,
			curvesize: 0.5,
      batchDateStart: undefined,
      batchDateEnd: undefined,
      req_count: 0,
      monitorData: {}
		}
	},
	computed: {
    cssVars() {
      return {
        // month picker attr
        "--mp_family": util.monthPickerAttr.fontFamily,
        "--mp_color":  util.monthPickerAttr.fontColor,
        "--mp_size":   util.monthPickerAttr.fontSize,
        "--mp_weight": util.monthPickerAttr.fontWeight,
        "--mp_style":  util.monthPickerAttr.fontStyle,

        // title first attr
        "--tf_family": util.titleFirstAttr.fontFamily,
        "--tf_color":  util.titleFirstAttr.fontColor,
        "--tf_size":   util.titleFirstAttr.fontSize,
        "--tf_weight": util.titleFirstAttr.fontWeight,
        "--tf_style":  util.titleFirstAttr.fontStyle,

        // card title attr
        "--ct_family": util.cardTitletAttr.fontFamily,
        "--ct_color":  util.cardTitletAttr.fontColor,
        "--ct_size":   util.cardTitletAttr.fontSize,
        "--ct_weight": util.cardTitletAttr.fontWeight,
        "--ct_style":  util.cardTitletAttr.fontStyle,

        // diagnosis title attr
        "--dt_family": util.diagCardTitleTextAttr.fontFamily,
        "--dt_color":  util.diagCardTitleTextAttr.fontColor,
        "--dt_size":   util.diagCardTitleTextAttr.fontSize,
        "--dt_weight": util.diagCardTitleTextAttr.fontWeight,
        "--dt_style":  util.diagCardTitleTextAttr.fontStyle,
      }
    },
		...mapGetters([
			"isSwitch",
			// "trainBorder",
			"startDate",
			"endDate",
			// "diagnosisState"
		]),
		dateselect : function(){
      var endmonth = new Date(this.startmonth.valueOf())
      
			// if(endmonth.getMonth() < 12){
			// 	endmonth.setMonth(endmonth.getMonth() + 1)
			// }else{
			// 	endmonth.setFullYear(endmonth.getFullYear() + 1)
			// 	endmonth.setMonth(1)
      // }
      endmonth.setDate(endmonth.getDate() + 10)

			return [this.startmonth, endmonth]
		},
		startDateString: vm => util.timeFormat(vm.startDate),
		endDateString: vm => util.timeFormat(vm.endDate),
		selectDateStart: vm => util.timeFormat(vm.dateselect[0]),
		selectDateEnd: vm => util.timeFormat(vm.dateselect[1]),
    isSwitchActive: vm => !vm.isSwitch
	},
	created() {
	},
	methods: {
		...mapMutations([
			"changeLabelColor",
			"setCorrSize",
			"setmultiPara",
			"setCurveSize",
			"changeDiagnosisState"
		]),
		getNotification(notice){
			const h = this.$createElement;
			this.$notify({
				title: '消息通知',
				message: h('i', { style: 'color: teal'}, notice)
			});
			this.loadingDataLoading = false
		},
		async changeTime() {
      this.req_count = 0;
			await this.getTimeBrushData();
			await this.getAlgorithmData()
			this.getHttpData();
		},
		async getHttpData() {
			this.plateTempPropvalue=['All']
      this.loadingDataLoading = true
			// response
			this.stationsData = (await this.getStationsData(this.startDateString, this.endDateString)).data;
      // this.jsonData = (await this.getJsonData(this.startDateString, this.endDateString)).data;
      this.jsonData = jsonData
      // console.log('原始：', this.jsonData);
			await this.$refs.parallel.paintChart(this.jsonData);
      this.mergeresult = mergeTimesData(this.jsonData, this.stationsData, this.minrange, this.minconflict);
      let eventIconData = filterMareyChartEventIcon(this.jsonData);
      // this.monitorData = (await this.getAllBatchMonitorData(this.mergeresult, this.startDateString, this.endDateString)).data;
      this.monitorData = monitorData
			// console.log('过滤：', this.jsonData.filter(d => d.stops.length === 17))
      // console.log('监控：', this.monitorData)
      // console.log(eventIconData)

			// let flagData = (await baogangAxios(`/newbaogangapi/v1.0/getFlag/${this.startDateString}/${this.endDateString}/`)).data;
			// let allDataArr = []
			// for (let item of this.jsonData) {
			// 		let upid = item['upid']
			// 		allDataArr.push(flagData[upid])
			// }
			// for (let i = 0; i < this.jsonData.length; i++) {
			// 	this.jsonData[i]['flag'] = allDataArr[i]
			// }

			// paint
			this.loadingDataLoading = false
			this.jsonData.length===0 ? this.getNotification('时间线图选择错误，请重新选择') : undefined
      if(this.scatterData.length!==0) {
				this.mergeflag()
			}
			this.$refs.mareyChart.paintPre({
        timesData: this.jsonData, 
        stationsData: this.stationsData, 
        mergeResult: this.mergeresult,
        monitorData: this.monitorData,
        eventIconData: eventIconData
        }, this.isSwitch, this.isMerge);

		},
		async newdiagnose() {
			// this.diagnosisState = !this.diagnosisState;
			this.animeTransition();
			this.requestHeader = updateRange(this.$refs.parallel.diagnosisRange, this.$refs.parallel.svgChart['instance']._objStatus)
			// console.log(this.requestHeader)
      this.batchData = await this.requestBatchData();
			// this.batchData = batchData;

			// this.corrdata = [];
			const request = {
				startDate: this.batchDateStart[0],
				endDate: this.batchDateEnd[this.batchDateEnd.length - 1],
				limit: 1000,
				devation: 0.25
			};
			let roll = (await steel.getRollData(request, this.requestHeader)).data;
			let heat = (await steel.getHeatData(Object.assign({number: 4}, request), this.requestHeader)).data;
			let cool = (await steel.getCoolData(Object.assign({number: 4, header: 5}, request), this.requestHeader)).data;
			this.processData.main = {...roll, ...cool, ...heat};
			// this.processData.main = processData;

			// await this.getVisCorrelation({
      //     startDate: this.selectDateStart,
      //     endDate: this.selectDateEnd,
      //     nums: 1000
      //   },   // time_select
			// 	JSON.stringify([]),   // slabthickness
			// 	JSON.stringify([]),   // tgtdischargetemp
			// 	JSON.stringify([]),   // tgtplatethickness
			// 	JSON.stringify([]),   // tgtwidth
			// 	JSON.stringify([]),   // tgtplatelength2
			// 	JSON.stringify([]),   // tgttmplatetemp
			// 	JSON.stringify([]),   // cooling_start_temp
			// 	JSON.stringify([]),   // cooling_stop_temp
			// 	JSON.stringify([]),   // cooling_rate1
			// 	JSON.stringify([]),   // productcategory
			// 	JSON.stringify([]),   // steelspec
			// 	0   // status_cooling
			// 	).then(Response => {
				// this.corrdata = Response.data
			// })

      await this.paintRiverLike();
		},
		mergeflag(){
			let mergedata=[]
			for (let item in this.scatterData){
				let toc=new Date(this.scatterData[item].toc)
				if(toc<this.endDate&&toc>this.startDate)
					mergedata.push(this.scatterData[item])
			}
			mergedata.map(item=>{				
				this.jsonData.map(json=>{
					if(json.upid===item.upid){
						json.flag=+item.label
					}
					return json
				})
			})
		},

		// 获取诊断视图数据
    getDiagnosisData(time_select, slabthickness, tgtdischargetemp, tgtplatethickness, tgtwidth, tgtplatelength2, 
                     tgttmplatetemp, cooling_start_temp, cooling_stop_temp, cooling_rate1,
                     productcategory, steelspec, status_cooling, fqcflag) {
			return steel.getDiagnosis(
        `/newbaogangapi/v1.0/baogangPlot/diagnosesdatabytime/${time_select[0]}/${time_select[1]}/default/1000`,
        {
          'slabthickness': slabthickness,
          'tgtdischargetemp': tgtdischargetemp,
          'tgtplatethickness': tgtplatethickness,
          'tgtwidth': tgtwidth, 
          'tgtplatelength2': tgtplatelength2,
          'tgttmplatetemp': tgttmplatetemp,
          'cooling_start_temp': cooling_start_temp,
          'cooling_stop_temp': cooling_stop_temp,
          'cooling_rate1': cooling_rate1,
          'productcategory': productcategory,
          'steelspec': steelspec,
          'status_cooling': status_cooling,
          'fqcflag': fqcflag
        }
      )
    },
    
    getVisCorrelation(url, slabthickness, tgtdischargetemp, tgtplatethickness, tgtwidth,
          tgtplatelength2, tgttmplatetemp, cooling_start_temp, cooling_stop_temp,
          cooling_rate1, productcategory, steelspec, status_cooling){
      return steel.getVisCorrelation(url,{
        slabthickness,
        tgtdischargetemp,
        tgtplatethickness,
        tgtwidth,
        tgtplatelength2,
        tgttmplatetemp,
        cooling_start_temp,
        cooling_stop_temp,
        cooling_rate1,
        productcategory,
        steelspec,
        status_cooling
      })
    },

		getDetailProcess(upid, process, width, length, thickness,platetype,deviation) {
			return steel.getVisualization({
				'upid': upid,
				'process':process,
				'width': width,
				'length': length, 
				'thickness': thickness,
				'platetype':JSON.stringify(platetype),
				'deviation':deviation
				}).catch(error=>{
					this.getNotification("缺乏工序数据，请重新选择钢板或工序\n或钢板量少，请修改Tabular Parameters参数")
				})
		},
		async getplatetype() {
			return baogangAxios(`/newbaogangapi/v1.0/model/VisualizationPlatetypes/`)
			.then(res=>{
				let data=res.data.flat()
				data.sort()
				this.plateoptions=[]
				this.plateoptions.push({
					value: 'All',
					label: 'All'
				})
				for(let item of data){
							this.plateoptions.push({
							value: item,
							label: item
						})
				}
			})
    },

		async platetype(upid) {
			await this.getplatetype()
			baogangAxios(`/baogangapi/v1.0/model/Platetypes/${upid}/`).
			then(res=>{
				let data=res.data
				// console.log(this.plateoptions)
				for(let i=0;i<this.plateoptions.length;i++){
					if(this.plateoptions[i].value===data){
						this.plateoptions.splice(i, 1);
					}
				}
				this.plateoptions.unshift({
					value: data,
					label: data
				})
			})
		},

		getJsonData(startDate, endDate) {
			// return baogangAxios(`/myf/RollingTimeVisualizationMaretoController/selectRollingTimeVisualizationMaretoDataDto/${startDate}/${endDate}/0/5/all/all/40/40/40/40/all/50/`)
      //   .catch(error => {
      //       this.getNotification("getJsonData:"+error)
      //     })
      return baogangPlotAxios(`/newbaogangapi/v1.0/newGetMareyTimesDataApi/all/${startDate}/${endDate}/30`,
        {"steelspec": "all", "tgtplatethickness": '["all"]'})
        .catch(error => {
          this.getNotification("getJsonData:"+error)
        })
		},
		getStationsData(startDate, endDate) {
			// return baogangAxios(`/myf/RollingTimeVisualizationMaretoController/selectRollingTimeVisualizationMaretoStationDto/${startDate}/${endDate}/0/5/all/all/40/40/40/40/all/`)
			// 	.catch(function(error){
			// 		this.getNotification("getStationsData:"+error)
      // 	})
      return baogangPlotAxios(`/newbaogangapi/v1.0/newGetMareyStationsDataApi/all/${startDate}/${endDate}/`,
        {"steelspec": "all", "tgtplatethickness": '["all"]'})
				.catch(function(error){
					this.getNotification("getStationsData:"+error)
				})
    },
    getAllBatchMonitorData(mergeresult, startDate, endDate) {
      let batchSpec = mareyChartBatchSpec(mergeresult);
      return steel.getMonitorData(
        {startDate: startDate, endDate: endDate, type: 'default', limit: 1000},
        batchSpec)
        .catch(error => {
          this.getNotification("getBatchMonitorData: " + error);
        })
    },

		changeColor(){
			this.changeLabelColor()
			this.switchChange(this.isSwitch)
		},
		switchChange(bool) {
			let selectcolor=this.$refs.mareyChart.changeTrainColor(bool)
			console.log(selectcolor)
			if(selectcolor)(this.selectedTrainColor=selectcolor)
			this.$refs.scatterCate.setTrainColor();
			// // this.selectedTrainColor
			// let seletcolor=this.$refs.mareyChart.setTrainColor(bool) 
			// // this.changeScatterColor();
		},
    animeTransition(){
			// this.diagnosisVisible = !this.diagnosisVisible;
			anime({
				targets: ['.diagnosis_view'],
				translateY: this.diagnosisVisible ? '0px' : '1100px',
				easing: 'easeInOutQuad'
			})
    },

		async trainClick(value) {
			console.log(value)
			this.diagnosisVisible = true;
			this.upidSelect = []
      this.chooseList = value.batch;
      this.batchDateStart = value.date_s;
      this.batchDateEnd = value.date_e;

			if(value.type !== "group"){
				value.upidSelect.unshift(value.list[value.list.length - 1])
			}
      this.upidSelect = [...new Set(value.upidSelect)]//.filter(d => this.upidData.get(d) !== undefined)
      
			this.diagnosisState = false;
			this.$nextTick(function() {
				this.diagnosisState = true;
				const data = this.jsonData.filter(d => new Date(d.toc) <= value.relevantDate[1] && new Date(d.toc) >= value.relevantDate[0]);
				this.$refs.parallel.changeDiagnosis(data)
			});
			// newdiagnose
		},

		async requestBatchData(){
			let batchData = [];
			for(let item in this.batchDateStart){
				await this.selectDataByTime(this.batchDateStart[item], this.batchDateEnd[item]).then(response => {
					console.log(this.batchDateStart[item], this.batchDateEnd[item], response.data)
					let batch = response.data;
					batch.forEach(d => {
						d.toc = new Date(d.toc);
					})
					batch.sort((a, b) => a.toc - b.toc);
					batchData.push(batch)
				})
			}
			return batchData;
		},
    
		async selectDataByTime(...args){
			const [start, end] = args.map(d => new Date(d));
			const selectData = this.jsonData.filter(d => new Date(d.toc) <= end && new Date(d.toc) >= start)
			let request = await this.getDiagnosisData(...getBatchHeader(selectData, args));
			return request;
		},

		async paintRiverLike() {
			this.$refs.wheelering.paintChart(this.batchData, this.processData.main)
    },
		// let data =  (await steel.getProcessData({upid, process: 'roll',limit: 1000, devation: 0.25}, updateRange({}, this.$refs.parallel.diagnosisRange))).data;
		// console.log('steel.getProcessData', data);
		mareyUpdate(){
      this.$refs.mareyChart.reRender(this.isMerge, this.minrange, this.minconflict);
		},
		mergeUpdate(){
			this.isMerge = !this.isMerge
			this.mareyUpdate()
		},
		corrUpdate(){
			this.setCorrSize(this.corrsize)
		},
		multiUpdate(){
			this.setmultiPara(this.multisize)
		},
		curveUpdate(){
			this.setCurveSize(this.curvesize)
		},
		trainMouse(value){
			this.$refs.scatterCate && this.$refs.scatterCate.mouse(value);
			this.$refs.parallel && this.$refs.parallel.mouse(value);
		},
		scatterMouse(value){
			this.$refs.mareyChart && this.$refs.mareyChart.mouse(value);
			this.$refs.parallel && this.$refs.parallel.mouse(value);
		},
		parallMouse(value){
			// this.$refs.scatterCate.mouse(value)
			// this.$refs.mareyChart.mouse(value)
    },
		wheelMouse(value){
			this.$refs.scatterCate.mouse(value)
			this.$refs.mareyChart.mouse(value)
			this.$refs.parallel.mouse(value)
		},
    changeDiagnosisVisible() {
			this.diagnosisVisible = !this.diagnosisVisible;
			this.animeTransition()
    },
    clickDiagnosisButton() {
      if (this.diagnosisVisible) {  // 如果还没收起诊断面板
        this.diagnosisVisible = false;
        this.animeTransition();
      }
    },

		async paintDetailPro(processNumber) {
			this.processInTurn = [null, null]
			let processName = this.processArray[processNumber]||'heat'

			if(this.plateTempPropvalue.length===0){
				// this.getNotification("未选择合适的钢板类型进行分析，将默认为你选取所有钢板") 
				this.plateTempPropvalue=['All'];
				}
			let query=[]
			for (let item of this.plateTempPropvalue){
				if(item==='All'){
					query.push(item)
				}
			}
			if(query.length===0)query=this.plateTempPropvalue
			let processDetail = (await this.getDetailProcess('upid', 
				processName,
				this.plateTempProp.width/1000,
				this.plateTempProp.length,
				this.plateTempProp.thickness/1000,
				query,
				this.plateTempProp.deviation)).data
			//
			// let processDetail = (await this.getDetailProcess('18A15070000', processName, this.plateTempProp.width, this.plateTempProp.length, this.plateTempProp.thickness)).data
			this.processData = processDetail
			this.processName=processName
			// this.processInTurn = Object.keys(processDetail)
			console.log(processDetail)
			// this.orderchange()
		},
		orderchange(){
			this.processInTurn = Object.keys(this.processData)
			if(this.orderselect==='Number'){
				let sortarray=[]
				let sortresult={}
				for(let item in this.processData){
					let length=this.processData[item].min.length
					let errornumber=0
					for (let i=0;i<length;i++){
						if(this.processData[item].min[i]<=this.processData[item].sample[i]&&this.processData[item].sample[i]<=this.processData[item].max[i]){              
						}else{
							errornumber++;
						}
					}
					sortarray.push({'id':errornumber,'name':item})
				}
				sortarray.sort((a,b)=>{
					return b.id-a.id;
				})
				for(let item of sortarray){
					sortresult[item.name]=this.processData[item.name]
				}
				this.processInTurn = Object.keys(sortresult)
			}
			if(this.orderselect==='Deviation'){
				let sortarray=[]
				let sortresult={}
				for(let item in this.processData){
					let length=this.processData[item].min.length
					let errornumber=0
					for (let i=0;i<length;i++){
						if(this.processData[item].min[i]<=this.processData[item].sample[i]&&this.processData[item].sample[i]<=this.processData[item].max[i]){
							
						}else{
							let min=(this.processData[item].min[i]-this.processData[item].sample[i])/Math.abs(this.processData[item].min[i])
							let max=(this.processData[item].sample[i]-this.processData[item].max[i])/Math.abs(this.processData[item].max[i])
							errornumber=Math.max(min,max,errornumber)
						}
					}
					sortarray.push({'id':errornumber,'name':item})
				}
				sortarray.sort((a,b)=>{
					return b.id-a.id;
				})
				for(let item of sortarray){
					sortresult[item.name]=this.processData[item.name]
				}
				this.processInTurn = Object.keys(sortresult)
			}
			this.$nextTick(function() {
				for (let item of this.processInTurn) {
					if (['roll', 'cool'].indexOf(this.processName)) {
							this.$refs[item][0].paint(this.processData[item], ['length', ''], this.selectedTrainColor)
					} else {
							this.$refs[item][0].paint(this.processData[item], ['pass', ''], this.selectedTrainColor)
					}
					
				}
			})
		},
		async getTimeBrushData() {
			await baogangAxios(`/newbaogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${this.selectDateStart}/${this.selectDateEnd}/`)
			.then(Response => {
				this.timeBrushData=Response.data
			}).catch(function(error) {
				this.getNotification('时间线渲染错误，请选择合适的时间区间')
			})
			// this.timeBrushData = (await baogangAxios(`/baogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${startDate}/${endDate}/`)).data;

			this.$refs.brushSlider.paintChart(this.timeBrushData)
		},
		async getAlgorithmData() {
      this.req_count += 1;

			// await baogangPlotAxios(this.algorithmUrls[this.algorithmSelected]+ `${this.selectDateStart}/${this.selectDateEnd}/`, this.req_body).then(Response => {
      //   this.scatterData = Response.data
				this.scatterData = scatterData

				this.$refs.scatterCate.paintChart(this.scatterData, this.req_count)
				this.$refs.scatterCate.paintArc([this.startDate, this.endDate])
        this.$refs.parallel.dataPre(Object.values(this.scatterData))
			// })
		},
	},
	mounted() {
		// console.log(this.startmonth.getMonth())
		// this.trainClick(diagnosis_value)
		this.changeTime()
	},
	watch: {
		startDate:function(){
			if(this.scatterData.length == 0)return
			this.$refs.scatterCate.paintArc([this.startDate, this.endDate])
			this.getHttpData()
		}
	}
	
}
</script>

<style lang="scss" scoped>
@import url("../../assets/marey/index.scss");
</style>
<style lang="scss">
.panel-title {
	margin: 6px;
	font-size: 18px;
	// font-weight: normal !important;
	font-family: DIN !important;
	color: #6d7885;
}

.control-logo {
	height: 36px;
	background: white no-repeat;
	background-image: url('../../assets/images/controls2.png');
	background-size: 9% 56%;
	background-position: left 7% center;
	display: flex;
	align-items: center;
	span {
		margin-left: 20%;
		font-weight: bold;
	}
}
.custom-marey {
	background: white;
	// padding: 8px;
	overflow: hidden;
	.el-button--danger {
		color: #FFF;
		background-color: #337ab7;
		border-color: #337ab7;
	}
	.el-button--danger:hover {
		color: #FFF;
		background-color: #286090;
		border-color: #286090;
	}
	.el-form-item__label {
			text-align: right;
			float: left;
			font-size: 13px;
			color: #606266;
			line-height: 40px;
			padding: 0 12px 0 0;
			-webkit-box-sizing: border-box;
			box-sizing: border-box;
		.el-switch__label * {
			line-height: 1;
			font-size: 12px;
			display: inline-block;
		}
	}
	.abel .el-form-item__label {
			text-align: right;
			float: left;
			font-size: 13px;
			color: #606266;
			line-height: 40px;
			padding: 0 15px 0 0;
			-webkit-box-sizing: border-box;
			box-sizing: border-box;
		.el-switch__label * {
			line-height: 1;
			font-size: 12px;
			display: inline-block;
		}
	}

	.el-switch__label * {
		font-size: 12px;
		color:#303133;
	}
	.el-table thead {
			display: none;
	}
	.myel-card{
		margin: 2px 5px;
		// padding-top: 2px;
		// border: solid 0.25px #ededed;
		border: solid 0.25px #e0e0e0;
		border-radius: 4px;
		transform: translate(5px, 0px);
		// box-shadow: rgb(148, 148, 148) 2px 2px 2.5px !important;
		// box-shadow: 0 0 5px rgba(0, 0, 0, 0.1) !important;
		box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04) !important;
		.el-card__header {
			// font-family: futura !important;
      font-family: var(--ct_family) !important;
			// font-family: Calibri;
			background-color: #f7f7f7;
			// font-weight: 500;
      font-weight: var(--ct_weight);
			text-align: left;
			// font-size: 14px;
      font-size: var(--ct_size);
      font-style: var(--ct_style);
			color: var(--ct_color);
			height: 30px;
			padding: 4px 2px 2px 20px;
			border-bottom: solid 0.25px #e0e0e0;
		}
		.el-card__body {
			padding: 1px;
		}
		.upidicon{
			height:20px;
			width:20px;
			vertical-align: middle;
			margin-top:-7px;
			line-height:1.5;
			margin-right:5px;
			margin-left:-5px
		}
	}
	.myelTab{
		.el-card__header {
			height: 28px;
		}
		.upidicon{
			margin-top:0px;
		}
		.upidtext{
			font-size: 10px;
		}
	}
	.myel-upid{
		.el-card__header {
			background-color: #fcfcfc;
		}
	}
	.myel-swtich{
		// float:right;
		margin-top: -2px;
		padding:0px 10px 0px 0px;
		font-family : DIN;
		.el-switch__label{
			span{
				font-family: futura !important;
				background-color: #f7f7f7;
				font-weight: normal;
				text-align: left;
				font-size: 12px;
				color: #6d7885;
				color: #6d7885;
			}
		}
	}
	.card-select{
		float: right;
		width: 100px;
		margin: -3.5px;
		margin-right: 5%;
		.el-input .el-input__inner{
			font-family : DIN;
			color: #6d7885;
		}
	}

	.el-form-item__label{
		font-family : DIN !important;
		color: #6d7885;
	}
	.fontcolor{
		font-family : DIN !important;
		color: #6d7885;
	}
}

.el-select-dropdown__item span{
		font-family : DIN !important;
		color: #6d7885;
    // color: red;
}

.el-slider__button{
	border: 2px solid 	#999a9d!important
}
.el-slider__bar{
	background-color :#999a9d !important;
}
.my-slider >>> .el-slider__runway {
		margin: 10px 0;
}
// .el-button--info.is-plain:focus, .el-button--info.is-plain:hover {
//     background: #dddedf !important;
//     border-color: #909399;
//     color: #FFF;
// }
.el-button--mini, .el-button--mini.is-round {
    padding: 5px 15px !important;
}
.el-tabs--border-card>.el-tabs__header .el-tabs__item.is-active {
    color: rgb(122, 126, 129) !important;
	font-family: DIN !important;
	font-weight: normal !important;
    background-color: #FFF;
	font-size: 10px !important;
    border-right-color: #DCDFE6;
    border-left-color: #DCDFE6;
}
// .el-tabs__item {
// 	height: 30px !important;
	
// }
.el-tabs--border-card>.el-tabs__content {
    padding: 0px !important;
}
.my-card {
	margin: 3px 5px;
	// padding-top: 2px;
	// border: solid 0.25px #ededed;
	border: solid 0.25px #e0e0e0;
	border-radius: 4px;
	transform: translate(5px, 0px);
	box-shadow: rgb(148, 148, 148) 2px 2px 2.5px;
	// .my-card-body{
	// }
	.my-card-title {
		// text-indent:20px;
		font-family: var(--ct_family);
		background-color: #f7f7f7;
		font-weight: var(--ct_weight);
		text-align: left;
		font-size: var(--ct_size);
    font-style: var(--ct_style);
		color: var(--ct_color);
		height: 30px;
		padding: 4px 2px 2px 20px;
		border-bottom: solid 0.25px #e0e0e0;
	}
}
#month-data {
	// text-indent:20px;
  font-family: var(--mp_family);
	// background-color: #f7f7f7;
	font-weight: var(--mp_weight);
	text-align: center;
	font-size: var(--mp_size);
  font-style: var(--mp_style);
	// color: #6d7885;
  color: var(--mp_color);
	// height: 30px;
	padding: 15px 2px 2px 20px;
	// position: absolute;
	// left: 50%;
	// top: 50%;
	// transform: translate(-50%, -50%);
	// border-bottom: solid 0.25px #e0e0e0;
}
// .el-card.my-card-body-detail{
//   border: solid #f13615
// }
#imput-line {
	position: relative;
	top: -4px;
}
.el-card__body {
    padding: 8px;
}
.el-switch__core{
    border-color: #dcdfe6!important;
    background-color:rgb(153, 154, 157)!important;
}
.el-select-dropdown__item.selected {
    color: #000000!important;
    font-weight: 700;
}
.el-select .el-input.is-focus .el-input__inner {
    border-color: #000000!important;
}
.el-select .el-input__inner:focus {
    border-color:  #000000!important;
}
.title-background{
	height: 60px;
	// color: #f3f3f3;
	background-color: #f3f3f3;
	border: solid 0.25px #e0e0e0;
	box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
	position: relative;
}
#title-first{
	// margin: 6px;
	// text-align: center;
	// display: block;
	font-size: var(--tf_size);
	font-style: var(--tf_style);
	font-weight: var(--tf_weight);
	font-family: var(--tf_family) !important;
	color: var(--tf_color);
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translateX(-50%) translateY(-50%);
}
.el-icon-search{
	transform: translate(-5px, 0px);
}
.activeStyle{
	.el-button--info.is-plain{
		background: #e5e5e5;
		border-color: #909399;
		color: #FFF;
	}
	.el-button--info.is-plain:focus, .el-button--info.is-plain:hover {
		background: #e5e5e5;
		border-color: #909399;
		color: #FFF;
	}
}
.deActiveStyle{
	.el-button--info.is-plain{
		background: #FFF;
		border-color: #909399;
		color: #FFF;
	}
	.el-button--info.is-plain:focus, .el-button--info.is-plain:hover {
		background: #FFF;
		border-color: #909399;
		color: #FFF;
	}
}
</style>

