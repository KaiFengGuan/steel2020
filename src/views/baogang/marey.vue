<template>
	<div class="custom-marey" style="margin-top : -8px;margin-right:4px">
		<el-row>
			<el-col :span="4" style="margin-top:8px">
				<el-row>
					<div class="title-background"> <span id="title-first">iPWIMVis</span></div>
					<el-row>
						<!-- id="month-data" -->
						<el-col :span="10" id="month-data"><span>Month Picker</span></el-col>
						<el-col :span="10">
							<el-date-picker v-model="startmonth" type="month" placeholder="选择月" @change="changeTime"
								style="width:110px;margin:10px 0px 10px 20px" size="mini"></el-date-picker>
							<!-- <el-date-picker v-model="dateselect" type="datetimerange" range-separator=" " 
								@change="changeTime" start-placeholder="开始日期" end-placeholder="结束日期" style="width:160px;margin:10px 0px 10px 20px" size="mini">                 
							</el-date-picker>  -->
						</el-col>
						<!-- <el-col :span="14">
							<el-card class="myel-card" style="margin:5px 5px">
								<div class="my-card-body" style="height:32px; width:100%; display:flex;">
									<time-brush ref="timeBrush" style="flex: 1 0 152px;" 
										@timeBrushed="setStartEndDate"
										:custom-height="'32px'">
									</time-brush>
									<el-button round style="flex: 0 0 auto;width:30px;height:30px;margin-top:0px" type="info" size="mini" plain @click="getHttpData" icon="el-icon-search" :disabled="isSearch"></el-button>
								</div>	
							</el-card>
						</el-col> -->
						<el-col :span="4">
							<el-button style="margin-top:10px" size="small" plain @click="getHttpData" icon="el-icon-search" :disabled="isSearch" ></el-button>
						</el-col>
					</el-row>
					<el-row>
						<el-col :span="24" 
							v-loading="scatterLoading"
							element-loading-text="拼命计算中"
							element-loading-spinner="el-icon-loading"
							element-loading-background="rgba(0, 0, 0, 0.3)">
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
										<scatterlog ref="scatterloging" style="height:305px;" @scatterMouse="scatterMouse"></scatterlog>
									</el-row>
									
								</div>
							</el-card>
						</el-col>
					</el-row>
				</el-row>
				<el-row>
					<el-card >		 
						<!-- <div class="my-card-title" slot="header">
							<span style="margin-left:5px">Tabular View</span>
						</div> -->
						<div class="my-card-body" style="padding-top:5px">
							<brushableParallel ref="parallel" style="height:506px;width:100%" @parallMouse="parallMouse"></brushableParallel>
						</div>
					</el-card>
				</el-row>


			</el-col>
			<el-col :span="20" style="margin-top:5px"
				v-loading="loadingDataLoading"
				element-loading-text="loading..."
				element-loading-spinner="el-icon-loading"
				element-loading-background="rgba(0, 0, 0, 0.3)">
				<el-row></el-row>
				<el-row>
					<el-card class="myel-card">
						<div class="my-card-title" slot="header">
							<el-col :span="14"><span>Condition View</span></el-col>
							<el-col :span="2" style="font-size: 12px;margin:2px 0px;padding-left:40px">MinRange</el-col>
							<el-col :span="1">
								<el-slider v-model="minrange" :step="1" :min="5" :max="40" class="my-slider"
									style="margin:0px 0;color:#999a9d;width: 75px;margin-top:-8px;" input-size="mini" @change="mareyUpdate"></el-slider>
							</el-col>
							<el-col :span="2" style="font-size: 12px;margin:2px 0px;padding-left:40px">MinMerge</el-col>
							<el-col :span="2">
								<el-slider v-model="minconflict" :step="1" :min="1" :max="10" class="my-slider"
									style="margin:0px 0;color:#999a9d;width: 75px;margin-top:-8px;" input-size="mini" @change="mareyUpdate"></el-slider>
							</el-col>
							<el-col :span="2">
								<el-button size="mini" round style="height:25px;width: 60px;margin:-2px;padding:0px" type="info" plain @click="changeColor">
									<img src="../../assets/images/color.svg" style="height:16px;width:16px;transform: translate(0px, -2px)"></el-button>
							</el-col>
							<el-col :span="1">
								<el-button size="mini" round style="height:25px;width: 60px;margin:-2px;padding:-2px" type="info" plain @click="mergeUpdate">
									<img src="../../assets/images/diagnosis.svg" style="height:16px;width:16px;"></el-button>
							</el-col>
						</div>
						<div class="my-card-body">
							<marey-chart style="text-align: center; height: 495px;width:100%;" ref="mareyChart"  @trainClick="trainClick" @trainMouse="trainMouse"></marey-chart>
						</div>
					</el-card>
				</el-row>
				<el-row>
					<el-row style="margin-top: 3px;">
							<el-row>
								<div>
									<el-card class="myel-card">
										<div class="my-card-title" slot="header">
											<el-col :span="14"><span>Diagnosis View</span></el-col>
											<el-col :span="2" style="font-size: 12px;margin:2px 0px;padding-left:40px">CurveSize</el-col>
											<el-col :span="1">
												<el-slider v-model="curvesize" :step="0.01" :min="0" :max="1" class="my-slider"
													style="margin:0px 0;color:#999a9d;width: 75px;margin-top:-8px;" input-size="mini" @change="curveUpdate"></el-slider>
											</el-col>
											<el-col :span="2" style="font-size: 12px;margin:2px 0px;padding-left:40px">MultiPara</el-col>
											<el-col :span="1">
												<el-slider v-model="multisize" :step="1" :min="10" :max="40" class="my-slider"
													style="margin:0px 0;color:#999a9d;width: 75px;margin-top:-8px;" input-size="mini" @change="multiUpdate"></el-slider>
											</el-col>
											<el-col :span="2" style="font-size: 12px;margin:2px 0px;padding-left:40px">CorrConfig</el-col>
											<el-col :span="1">
												<el-slider v-model="corrsize" :step="0.1" :min="0" :max="1" class="my-slider"
													style="margin:0px 0;color:#999a9d;width: 75px;margin-top:-8px;" input-size="mini" @change="corrUpdate"></el-slider>
											</el-col>
											<el-col :span="1">
												<el-popover placement="bottom" width="350" trigger="hover" style="margin-right:11px;float:right">
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
										<el-col :span="4">
											<!-- <div style="float:left;margin-top: 30px;position:relative;left: 25px;width: 1px;height: 450px; background: #c9c9c9;"></div> -->
											<el-row>
												<div style="overflow-y:scroll;height:510px">
												<el-row v-for="item of upidSelect" :key = item>
													<el-card class="myel-card myel-tab" :style="{border: sampleCss[item]}">
														<div slot="header">
																<el-row style="height:25px"> 
																	<el-col :span="16"><img src="../../assets/images/UPID.svg" class="upidicon">
																	<span class="upidtext">UPID {{item}}</span></el-col>
																	<el-col :span="8"></el-col>
																</el-row>
															</div>
														<div class="my-card-body" @click="changeUpid(item)">
															<small-wheel :ref="item" style="height:223px"></small-wheel>
														</div>
													</el-card>
												</el-row>
												</div>
											</el-row>
										</el-col>
											<el-col :span="20">
												<el-card class="myel-card myelTab myel-upid">
													<div slot="header">
														<el-row>
															<el-col :span="8"><img src="../../assets/images/UPID.svg" class="upidicon">
															<span class="upidtext">{{selectedUpid}}</span></el-col>
															<el-col :span="16" style="background-color:white"></el-col>
														</el-row>
													</div>
													<div class="my-card-body" >
														<wheeler ref="wheelering" style="height:476px"></wheeler>
													</div>
												</el-card>
											</el-col>
										</div>
									</el-card>							
								</div>
							</el-row>
					</el-row>

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
				</el-row>
			</el-col>
		</el-row>

	</div>
</template>

<script>




import * as d3 from 'd3';
import util from './util.js';
import scatter from './scatter.vue';
import mareyChart from './mareyChart.vue';
import scatterlog from './scatterlog.vue';
import timeBrush from './timeBrush.vue';
import threeBar from './threeBar.vue';
import wheeler from './wheeler.vue';
import smallWheel from './smallWheel.vue';
import riverLike from "./riverLike.vue";
import slider from './slider.vue'
import scatterAxis from "./scatterAxis.vue"
import brushableParallel from "components/charts/brushableParallel.vue"
import { baogangAxios, baogangPlotAxios } from 'services/index.js'
import myJsonData from "./sampledata/jsondata.json"
import myStationData from "./sampledata/stationdata.js"
import scatterlogerdata from "./sampledata/scatterlog.json"
import * as steel from 'services/steel.js'
import sampledata from "./sampledata/index.js"
import { mapGetters, mapMutations} from 'vuex'
import Vue from 'vue';
export default {
	components: { mareyChart, scatter, timeBrush,
		brushableParallel, riverLike, scatterAxis, threeBar,scatterlog , wheeler , smallWheel, slider},
	data() {
		return {
			isMerge: true,
			minrange: 10,
			minconflict: 4,
			symbolvalue:0.05,
			linesize:0.25,
			heatindex:false,
			rollindex:false,
			coolindex:false,
			diagnosisData:[],
			scatterLoading: false,
			isSearch: true,
			processName:'',
			myScatterChart: {},
			plateoptions:[{
					value: 'All',
					label: 'All'
				}],
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
			errorflag:false,
			plateTempPropvalue:['All'],
			isSwitch: true,
			startmonth: new Date(2018, 10, 1, 0, 0),
			display: false,
			time: undefined,
			radarIndicatorOptions: [],
			indicators: [],
			temperatureData: {},
			selectedTrainData: [],
			corrdata:[],
			selectedTrainColor: 'green',
			tempStations: [],
			interval: 12,
			selectedUpid: "UPID",
			intervalOptions: [6, 12, 24, 48],
			algorithmOptions: [
				"T-SNE", "ISOMAP", "UMAP"
			],
			algorithmUrls: {
				"T-SNE": "/baogangapi/v1.0/model/VisualizationTsne/",
				"ISOMAP": "/baogangapi/v1.0/model/VisualizationMDS/",
				"UMAP": "/baogangapi/v1.0/model/VisualizationPCA/"
			},
			algorithmSelected: "T-SNE",
			plateTempProp: {
				slabid: "44191730513",
				width: 30,
				length: 10,
				thickness: 5,
				deviation:25
			},
			test: 15,
			detailProcess: [],
			processInTurn: [null, null ,null, null ,null, null],
			processData: {},
			scatterlogdata:[],
			processArray: ['heat', 'roll', 'cool'],
			loadingDataLoading: false,
			radio: 0,
			chooseList: [],
			processTurn: null, 
			kindRef: {
				length: 0.5,
				width: 0.5,
				thickness: 0.5
			},
			scatterResponse: null,
			upidSelect: ["", "  "],
			corrsize: 0.5,
			multisize: 15,
			curvesize: 0.5,
			sampleCss:{}
		}
	},
	computed: {
		...mapGetters([
			// "isSwitch",
			"trainBorder",
			"startDate",
			"endDate",
			// "corrSize",
			// "multiPara"
		]),
		dateselect : function(){
			var endmonth = new Date(this.startmonth.valueOf())
			if(endmonth.getMonth() < 12){
				endmonth.setMonth(endmonth.getMonth() + 1)
			}else{
				endmonth.setFullYear(endmonth.getFullYear() + 1)
				endmonth.setMonth(1)
			}
			return [this.startmonth, endmonth]
		},
		monthdata : vm => sampledata[+vm.startmonth.getMonth()+1],
		allupid : vm => d3.map(vm.monthdata, d => d.upid),
		upidData : vm => d3.group(vm.monthdata, d => d.upid),
		startDateString: vm => util.timeFormat(vm.startDate),
		endDateString: vm => util.timeFormat(vm.endDate),
		selectDateStart: vm => util.timeFormat(vm.dateselect[0]),
		selectDateEnd: vm => util.timeFormat(vm.dateselect[1]),
		brushData : function(){
			var start = new Date('2018-11-04 00:00:00'),
				end = new Date('2018-11-06 04:00:00');
			return this.monthdata.filter(d =>{
				var toc = new Date(d.toc);
				
				return toc < end && toc > start
				// return toc < this.endDate && toc > this.startDate
			})
		},
		brushUpid : vm => d3.map(vm.brushData, d => d.upid),
		paralleldata: vm => {
			console.log(scatterlogerdata)
			var scatterdata = Object.values(scatterlogerdata)
			return  scatterdata.filter(d =>{
				var toc = new Date(d.toc);
				return toc < vm.endDate && toc > vm.startDate
			})
		}
	},
	created() {
		// this.day()
	},
	methods: {
		...mapMutations([
			"changeLabelColor",
			"setCorrSize",
			"setmultiPara",
			"setCurveSize"
		]),
		getNotification(notice){
			const h = this.$createElement;

			this.$notify({
				title: '消息通知',
				message: h('i', { style: 'color: teal'}, notice)
			});
			this.loadingDataLoading = false
			this.scatterLoading = false
			this.isSearch = false
		},
		changeTimeBrush() {
			this.getTimeBrushData();
		},
		async changeUpid(upid){
			// let query=[]
			// for (let item of this.plateTempPropvalue){
			// 	if(item==='All'){
			// 		query.push(item)
			// 	}
			// }		
			// if(query.length===0)query=this.plateTempPropvalue
			// this.selectedUpid = upid!==undefined ? "UPID " + upid : "UPID"
			// let diagnosisData = (await this.getDiagnosisData(upid, this.plateTempProp.width/1000, this.plateTempProp.length, this.plateTempProp.thickness/1000,query)).data
			// this.diagnosisData=diagnosisData
			// await baogangAxios("baogangapi/v1.0/model/VisualizationCorrelation/"+`${this.selectDateStart}/${this.selectDateEnd}/`).then(Response => {
			// 	this.$refs.wheelering.paintChart(diagnosisData,Response.data)
			// })
		},
		async changeTime() {
			// // this.$message('这是一条消息提示');
			await this.changeTimeBrush()
			await this.scattlog()
		},
		cellStyle (rowData) {
			if (rowData.columnIndex === 2) {
				return {
					backgroundImage: 'url(./background.png)',
					backgroundSize: `${rowData.row.value.score * 100}% 100%`,
					backgroundRepeat: 'no-repeat'
				}
			}
		},
		toggleSelection(rows) {
			if (rows) {
				rows.forEach((item, index) => {
					if (index < 6) {
						this.$refs.multipleTable.toggleRowSelection(item, true);
					}
				});
			} else {
				this.$refs.multipleTable.clearSelection();
			}
		},
		setStartEndDate([start, end]) {
			if(start)this.startDate = new Date(+new Date(start) - 1000 * 60 * 60 * this.interval)
			if(end)this.endDate = new Date(end)
		},
		async getHttpData() {
			console.log(this.brushData)
			this.jsonData = myJsonData
			this.mergeflag()
			this.jsonData = this.jsonData.filter(d => {
				return this.brushUpid.includes(d.upid)
			})
			this.$refs.mareyChart.paintPre(this.jsonData,myStationData, this.isSwitch, this.brushData)
			return

			// this.clearAllChart()
			this.plateTempPropvalue=['All']
			this.isSearch = true
			this.loadingDataLoading = true
			let startDate = this.startDateString;
			let endDate = this.endDateString;
			// let startDate="2018-11-01 00:00:00";
			// let endDate = "2018-11-01 12:00:00";
			// request
			// let stationsResponse = this.getStationsData(startDate, endDate);
			// let jsonResponse = this.getJsonData(startDate, endDate);
			// let conditionResponse = this.getConditionData(startDate, endDate);
			// let temperatureResponse = this.getTemperatureData();

			// response
			// this.stationsData = (await this.getStationsData(startDate, endDate)).data;
			await this.getStationsData(startDate, endDate).then(Response => {
				this.stationsData=Response.data
			})
			this.jsonData = (await this.getJsonData(startDate, endDate)).data;
			console.log(this.jsonData.length)
			this.jsonData = this.jsonData.filter(d => {
				return this.brushUpid.includes(d.upid)
			})
			console.log(this.jsonData.length)
			console.log(this.brushUpid.length)
			console.log(d3.groups(this.jsonData , d => d.flag))
			

			let flagData = (await baogangAxios(`/baogangapi/v1.0/getFlag/${startDate}/${endDate}/`)).data
			// this.getplatetype();
			let allDataArr = []
			for (let item of this.jsonData) {
					let upid = item['upid']
					allDataArr.push(flagData[upid])
			}

			for (let i = 0; i < this.jsonData.length; i++) {
				this.jsonData[i]['flag'] = allDataArr[i]
			}

			// paint
			this.loadingDataLoading = false
			this.scatterLoading = false
			this.isSearch = false
			this.jsonData.length===0 ? this.getNotification('时间线图选择错误，请重新选择') : undefined
			this.jsonData = this.jsonData.filter(d => {
				return this.brushUpid.includes(d.upid)
			})
			if(this.scatterlogdata.length!==0)this.mergeflag()
			this.$refs.mareyChart.paintPre(this.jsonData, this.stationsData, this.isSwitch, this.brushData);

			// clear
			this.selectedTrainData = [];
			this.scatterLoading = false
			this.isSearch = false
		},
		deepCopy(obj){
			if(typeof obj!=='object') return obj;
			var newObj=obj instanceof Array ? [] :{};
			for (let key in obj){
				if(obj.hasOwnProperty(key)){
					if(obj[key]===null){
						newObj[key]===null;
					}
					newObj[key]=typeof obj[key] ? this.deepCopy(obj[key]) : obj[key];
				}
			}
			return newObj
		},
		mergeflag(){
			// let mergedata=this.scatterlogdata
			let mergedata=[]
			for (let item in this.scatterlogdata){
				let toc=new Date(this.scatterlogdata[item].toc)
				if(toc<this.endDate&&toc>this.startDate)
					mergedata.push(this.scatterlogdata[item])
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
		// clearAllChart() {
		//   this.$refs.mareyChart.paintMareyChart([], {}, "conditionData")
		//   this.$refs.scatterChart.paintScatter({})
		//   this.$refs.myRiverLikeChart.paint([], '')
		//   this.$refs.outOfGau.paint({}, '')
		//   this.$refs.PCA.paint({}, {}, '')
		//   for (let item of Object.keys(this.processData)) {
		//     this.$refs[item][0].paint([], '')
		//   }

		// },

		// 获取诊断视图数据
		getDiagnosisData(choseUpid, widthGap, lengthGap, thicknessGap,platetype) {
			return steel.getDiagnosis({
				'upid': choseUpid,
				'width': widthGap,
				'length': lengthGap, 
				'thickness': thicknessGap,
				'platetype':JSON.stringify(platetype),
			})
		},

		getDetailProcess(upid, process, width, length, thickness,platetype,deviation) {
					return baogangPlotAxios('/baogangapi/v1.0/model/Visualization', {
					'upid': upid,
					'process':process,
					'width': width,
					'length': length, 
					'thickness': thickness,
					'platetype':JSON.stringify(platetype),
					'deviation':deviation
				}).catch(error=>{
					if(!this.errorflag){
						// this.getNotification("缺乏工序数据，请重新选择钢板或工序\n或钢板量少，请修改Tabular Parameters参数")
					}this.errorflag=false
		})
		},
		async getplatetype() {
			return baogangAxios(`/baogangapi/v1.0/model/VisualizationPlatetypes/`).
			then(res=>{
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

		paintProcess(value) {
			this.processTurn = value
			this.paintDetailPro(value)
		},
		paintPlate(){
			this.paintDetailPro(this.radio)
		},

		switchSort() {
			this.paintDetailPro(this.radio)
		},

		getJsonData(startDate, endDate) {
			return baogangAxios(`/myf/RollingTimeVisualizationMaretoController/selectRollingTimeVisualizationMaretoDataDto/${startDate}/${endDate}/0/5/all/all/40/40/40/40/all/50/`)
		.catch(error => {
				this.getNotification("getJsonData:"+error)
			})
		},

		getStationsData(startDate, endDate) {
			return baogangAxios(`/myf/RollingTimeVisualizationMaretoController/selectRollingTimeVisualizationMaretoStationDto/${startDate}/${endDate}/0/5/all/all/40/40/40/40/all/`)
				.catch(function(error){
					this.getNotification("getStationsData:"+error)
				})
		},
		changeColor(){
			this.changeLabelColor()
			// this.isSwitch = !this.isSwitch
			this.switchChange(this.isSwitch)
		},
		switchChange(bool) {
			let selectcolor=this.$refs.mareyChart.changeTrainColor(bool)
			console.log(selectcolor)
			if(selectcolor)(this.selectedTrainColor=selectcolor)
			this.$refs.scatterloging.setTrainColor();
			// // this.selectedTrainColor
			// let seletcolor=this.$refs.mareyChart.setTrainColor(bool) 
			// // this.changeScatterColor();
			// // this.selectedTrainData !== undefined && this.paintUnderCharts(this.selectedTrainData); 
			
			// this.selectedTrainData !== undefined && this.paintSwitchUnderCharts(this.selectedTrainData); 
		},
		async getAlgorithmData() {
			await this.scattlog();
			this.scatterLoading = false
			this.isSearch = false
		},

		async trainClick(value) {
			if(value.list.length == 0)value.list.push(...value.upidSelect)
			this.selectedTrainData = value.list;
			this.selectedTrainColor = value.color;
			console.log(value)
			this.chooseList = value.list
			await this.paintUnderCharts(this.chooseList[0]);
			while(true){
				if(value.upidSelect.length !==0)break
				await this.paintUnderCharts(value.upidSelect.shift());
				if(this.diagnosisData["result"].length === 0) continue
				break
			}
			this.upidSelect = []
			value.upidSelect = [...new Set(value.upidSelect)]
			this.upidSelect = value.upidSelect
			console.log(this.upidSelect)

			for(let item of value.upidSelect){
				await this.paintScatterList(item)
			}
			this.corrdata = []
		},
		async paintScatterList(upid){
			this.$nextTick(function() {this.$refs[upid][0].init()})
			// let query=[]
			// for (let item of this.plateTempPropvalue){
			// 	if(item==='All'){
			// 		query.push(item)
			// 	}
			// }		
			// if(query.length===0)query=this.plateTempPropvalue
			// let diagnosisData = (await this.getDiagnosisData(upid, this.plateTempProp.width/1000, this.plateTempProp.length, this.plateTempProp.thickness/1000,query)).data
			// console.log(diagnosisData["result"].length === 0)
			// if(diagnosisData["result"].length === 0){
			// 	return false
			// }
			console.log(upid)
			var diagnosisData = this.upidData.get(upid)[0]
			console.log(diagnosisData)
			Vue.set(this.sampleCss, upid, "solid 0.25px " + this.trainBorder(diagnosisData))
			if(this.corrdata.length !== 0) {
				console.log(this.sampleCss)
				this.$nextTick(function() {this.$refs[upid][0].paintChart(diagnosisData,this.corrdata)})
				return false
			}
			await baogangAxios("baogangapi/v1.0/model/VisualizationCorrelation/"+`${this.selectDateStart}/${this.selectDateEnd}/`).then(Response => {
				this.$nextTick(function() {
					this.$refs[upid][0].paintChart(diagnosisData,Response.data)
					this.corrdata = Response.data
				})	
			})
		},
		mareyUpdate(){
			this.$refs.mareyChart.renderChart(this.isMerge, this.minrange, this.minconflict)
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
			this.$refs.scatterloging.mouse(value)
			this.$refs.parallel.mouse(value)
		},
		scatterMouse(value){
			this.$refs.mareyChart.mouse(value)
			this.$refs.parallel.mouse(value)
		},
		parallMouse(value){
			this.$refs.scatterloging.mouse(value)
			this.$refs.mareyChart.mouse(value)
		},
		paintUnderCharts(upid) {
			// diagnosisData
			this.paintRiverLike();
			this.platetype(this.selectedTrainData[this.selectedTrainData.length-1]);

		},
		paintSwitchUnderCharts(upid){
			this.platetype(this.selectedTrainData[this.selectedTrainData.length-1]);
			let diagnosisData=this.diagnosisData
			let diagnosisSinData = diagnosisData.result
			let diagnosisGauData = diagnosisData.outOfGau
			let diagnosisT2Data = diagnosisData.PCAT2
			let diagnosisSPEData = diagnosisData.PCASPE
			this.$refs.myRiverLikeChart.paint(diagnosisSinData, this.selectedTrainColor, false)
			this.$refs.outOfGau.paint(diagnosisGauData, this.selectedTrainColor, false)
			this.$refs.PCA.paint(diagnosisT2Data, diagnosisSPEData, this.selectedTrainColor)
			this.orderchange()
		},

		async paintSimilarity() {
			let similar = (await baogangAxios(`/baogangapi/v1.0/model/Temperature2DAndFQCpictureSimilarity/${this.selectedTrainData.slice(-1)[0]}/`)).data.Similarity;
			this.$refs.similarGauge.paint(similar);
		},

		async paintRiverLike() {
			// let query=[]
			// for (let item of this.plateTempPropvalue){
			// 	if(item==='All'){
			// 		query.push(item)
			// 	}
			// }		
			// if(query.length===0)query=this.plateTempPropvalue
			this.selectedUpid = this.selectedTrainData[this.selectedTrainData.length-1]!==undefined ? "UPID " + this.selectedTrainData[this.selectedTrainData.length-1] : "UPID"
			// let diagnosisData = (await this.getDiagnosisData(this.selectedTrainData[this.selectedTrainData.length-1], this.plateTempProp.width/1000, this.plateTempProp.length, this.plateTempProp.thickness/1000,query)).data
			var diagnosisData = this.upidData.get(this.selectedTrainData[this.selectedTrainData.length-1])[0]
			var processData = []
			this.chooseList.map(d => processData.push(this.upidData.get(d)[0]))
			this.diagnosisData = diagnosisData
			// let processDetail = []
			// for(let item of this.processArray){
			// 	console.log(item)
			// 	let detailProData = (await this.getDetailProcess(this.selectedTrainData[this.selectedTrainData.length-1], item, this.plateTempProp.width/1000, 
			// 		this.plateTempProp.length, this.plateTempProp.thickness/1000,query,this.plateTempProp.deviation)).data
			// 	processDetail.push(detailProData)
			// 	// Object.assign(processDetail, detailProData)
			// }
			// console.log(processDetail)
			await baogangAxios("baogangapi/v1.0/model/VisualizationCorrelation/"+`${this.selectDateStart}/${this.selectDateEnd}/`).then(Response => {
				this.$refs.wheelering.paintChart(diagnosisData,Response.data, processData)
			})
			// this.paintDetailPro(this.processTurn)
		},

		async paintDetailPro(processNumber) {
			this.processInTurn = [null, null]
			let processName = this.processArray[processNumber]||'heat'

			
			if(this.selectedTrainData.length===0){
				this.getNotification("未选择具体钢板进行分析，请在马雷图选择钢板")
				return
			}
			if(this.plateTempPropvalue.length===0){
				// this.getNotification("未选择合适的钢板类型进行分析，将默认为你选取所有钢板") 
				this.plateTempPropvalue=['All'];
				this.paintPlate()}
			let query=[]
			for (let item of this.plateTempPropvalue){
				if(item==='All'){
					query.push(item)
				}
			}
			if(query.length===0)query=this.plateTempPropvalue
			let processDetail = (await this.getDetailProcess(this.selectedTrainData[this.selectedTrainData.length-1], processName, this.plateTempProp.width/1000, this.plateTempProp.length, this.plateTempProp.thickness/1000,query,this.plateTempProp.deviation)).data
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
		indicatorChange(value) {
			this.indicators = value;
		},
		async getTimeBrushData() {
			// var s1 = this.dateselect[0].getTime(),s2 = this.dateselect[1].getTime();
			// var total = (s2 - s1)/1000;
			// var day = parseInt(total / (24*60*60));//计算整数天数
			// end.setMonth(end.getMonth() + 1)
			// let endDate = util.timeFormat(end);
			// .then(Response => {
			//       }).catch(function(error) {
			//     // 处理 getJSON 和 前一个回调函数运行时发生的错误
			//     console.log('发生错误！', error);
			//       })
			// this.timeBrushData = (await baogangAxios(`/baogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${startDate}/${endDate}/`)).data;
			await baogangAxios(`/baogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${this.selectDateStart}/${this.selectDateEnd}/`)
			.then(Response => {
				this.timeBrushData=Response.data
					}).catch(function(error) {
				// 处理 getJSON 和 前一个回调函数运行时发生的错误
				console.log('发生错误！', error);
				this.getNotification('时间线渲染错误，请选择合适的时间区间')
					})
			// 时间改为灵活
			// this.timeBrushData = (await baogangAxios(`/baogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${startDate}/${endDate}/`)).data;

			this.isSearch = false 
			let keys = ["endTimeOutput", "good_flag", "bad_flag"]
			// this.$refs.timeBrush.paint({
			// 	paintData: this.timeBrushData,
			// 	color: util.labelColor,
			// 	starttime:this.startDateString
			// });
			this.$refs.brushSlider.paintChart(this.timeBrushData)
			// this.$refs.scatterloging.paintChart(this.scatterlogdata,[this.startDate, this.endDate])
		},
		day(){
			var now = new Date();
			var year = now.getFullYear(); //得到年份
			var month = now.getMonth();//得到月份
			var date = now.getDate();//得到日期

			let entry=this.selectDateStart
			entry = entry.replace(/-/g,"/");
			
			let dateend = new Date(entry.valueOf());
			dateend.setMonth(month)
			dateend.setDate(1)
			dateend.setYear(year)
			this.dateselect[1].setYear(year)
			this.dateselect[0]=dateend
			var startTime = new Date(this.dateselect[0]).getTime();
			var diff = 45*86400*1000;
			var endTime = startTime + diff;
			var d = new Date(endTime);
			this.dateselect[1]=d
			this.startDate=this.dateselect[0]
			this.endDate=this.dateselect[1]
		},
		processclick(value){
			this.processTurn=value
			let dom=document.getElementsByClassName("heatclass")
			for (let item of dom){
				item.style.border='none'
			}
			let heat=dom[value]
			heat.style.border='solid 1.5px #606266'
			// this.paintProcess(value)
			this.paintRiverLike()
		},
		async scattlog() {
			await baogangAxios(this.algorithmUrls[this.algorithmSelected]+ `${this.selectDateStart}/${this.selectDateEnd}/`).then(Response => {
				this.scatterlogdata=Response.data
				this.$refs.scatterloging.paintChart(this.scatterlogdata)
				this.$refs.scatterloging.paintArc([this.startDate, this.endDate])
				this.$refs.parallel.paintChart(Object.values(this.scatterlogdata), this.startDate, this.endDate)
			})
		},
	},
	mounted() {
		// console.log(this.startmonth.getMonth())
		// this.paintDetailPro(2)
		// this.platetype('18B09019000')
		// this.paintScatterList("")
		this.getplatetype()
		// this.isSearch = false
		// this.getHttpData()
		this.changeTime()
	},
	watch: {
		minconflict:  {
			handler(val){
				// console.log(val)
				// console.log(this.isSwitch)
			},
			deep: true,
			immediate: false,
		},
		minrange:  function(val, oldVal){
			// console.log(val)
		},
		startDate:function(){
			this.$refs.scatterloging.paintArc([this.startDate, this.endDate])
			this.getHttpData()
		}
	}
	
}
</script>

<style>

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
	margin: -18px;
	padding: 8px;
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
			font-family: futura !important;
			// font-family: Calibri;
			background-color: #f7f7f7;
			font-weight: 500;
			text-align: left;
			font-size: 14px;
			color: #6d7885;
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
	.myel-tab{
		.el-card__header {
			height: 25px;
			background-color: #fcfcfc;
		}

		.upidtext{
			font-size: 10px;
			position:relative;top:-3px
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
.el-button--info.is-plain:focus, .el-button--info.is-plain:hover {
    background: #dddedf !important;
    border-color: #909399;
    color: #FFF;
}
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
.el-tabs__item {
	// height: 30px !important;
	
}
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
		font-family: Calibri;
		background-color: #f7f7f7;
		font-weight: bold;
		text-align: left;
		font-size: 14px;
		color: #6d7885;
		height: 30px;
		padding: 4px 2px 2px 20px;
		border-bottom: solid 0.25px #e0e0e0;
	}
}
#month-data {
	// text-indent:20px;
	font-family: Calibri;
	// background-color: #f7f7f7;
	font-weight: bold;
	text-align: center;
	font-size: 14px;
	color: #6d7885;
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
	font-size: 19px;
	font-weight: bolder;
	font-family: futura !important;
	color: #2c3e50;
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translateX(-50%) translateY(-50%);
}
.el-icon-search{
	transform: translate(-5px, 0px);
}
</style>

