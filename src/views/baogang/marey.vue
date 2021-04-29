<template>
	<div class="custom-marey" style="margin-top : -8px;margin-right:4px">
		<el-row>
			<el-col :span="4" style="margin-top:8px">
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
								<!-- v-loading="scatterLoading" element-loading-text="拼命计算中" element-loading-spinner="el-icon-loading" element-loading-background="rgba(0, 0, 0, 0.3)" -->
									<scatterlog ref="scatterCate" style="height:305px;" @scatterMouse="scatterMouse"></scatterlog>
								</el-row>
							</div>
						</el-card>
					</el-row>
				</el-row>
				<el-row>
					<el-card class="myel-card">		 
						<div class="my-card-title" slot="header">
							<span style="margin-left:5px">Tabular View</span>
						</div>
						<div class="my-card-body" style="padding-top:5px">
							<brushableParallel ref="parallel" style="height:500px;width:100%" @parallMouse="parallMouse"></brushableParallel>
						</div>
					</el-card>
				</el-row>
			</el-col>
			<el-col :span="20" style="margin-top:6px"
				v-loading="loadingDataLoading"
				element-loading-text="loading..."
				element-loading-spinner="el-icon-loading"
				element-loading-background="rgba(0, 0, 0, 0.3)">
				<el-row>
					<el-card class="myel-card">
						<div class="my-card-title" slot="header">
							<el-col :span="16"><span>Condition View</span></el-col>
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
						</div>
						<div class="my-card-body">
							<marey-chart style="text-align: center; height: 495px;width:100%;" ref="mareyChart"  @trainClick="trainClick" @trainMouse="trainMouse"></marey-chart>
						</div>
					</el-card>
				</el-row>
				<el-row>
					<el-row>
						<div>
							<el-card class="myel-card">
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
								<el-col :span="4">
									<!-- <div style="float:left;margin-top: 30px;position:relative;left: 25px;width: 1px;height: 450px; background: #c9c9c9;"></div> -->
									<el-row>
										<div style="overflow-y:scroll;height:500px">
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
											<!-- <div slot="header">
												<el-row>
													<el-col :span="8"><img src="../../assets/images/UPID.svg" class="upidicon">
													<span class="upidtext">{{selectedUpid}}</span></el-col>
													<el-col :span="16" style="background-color:white"></el-col>
												</el-row>
											</div> -->
											<div class="my-card-body" >
												<wheeler ref="wheelering" style="height:490px"></wheeler>
											</div>
										</el-card>
									</el-col>
								</div>
							</el-card>		
						</div>
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
import mareyChart from './mareyChart.vue';
import scatterlog from 'components/charts/scatterlog.vue';
import timeBrush from './timeBrush.vue';
import wheeler from './wheeler.vue';
import smallWheel from './smallWheel.vue';
import slider from './slider.vue'
import brushableParallel from "components/charts/brushableParallel.vue"
import { baogangAxios, baogangPlotAxios } from 'services/index.js'
import myJsonData from "./sampledata/jsondata.json"
import myStationData from "./sampledata/stationdata.js"
import * as steel from 'services/steel.js'
import sampledata from "./sampledata/index.js"
import { mapGetters, mapMutations} from 'vuex'
import Vue from 'vue';
export default {
	components: { mareyChart, timeBrush, brushableParallel, scatterlog, wheeler , smallWheel, slider},
	data() {
		return {
			isMerge: true,
			minrange: 10,
			minconflict: 4,
			symbolvalue:0.05,
			linesize:0.25,
			diagnosisData:[],
			processName:'',
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
			plateTempPropvalue:['All'],
			startmonth: new Date(2018, 10, 1, 0, 0),
			time: undefined,
			selectedTrainData: [],
			corrdata:[],
			selectedTrainColor: 'green',
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
			detailProcess: [],
			processInTurn: [null, null ,null, null ,null, null],
			processData: {},
			scatterData:[],
			processArray: ['heat', 'roll', 'cool'],
			loadingDataLoading: false,
			radio: 0,
			chooseList: [],
			processTurn: null, 
			upidSelect: ["", "  "],
			corrsize: 0.5,
			multisize: 20,
			curvesize: 0.5,
			sampleCss:{}
		}
	},
	computed: {
		...mapGetters([
			"isSwitch",
			"trainBorder",
			"startDate",
			"endDate",
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
		isSwitchActive: vm => !vm.isSwitch
	},
	created() {
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
		},
		async changeUpid(upid){
			this.paintUnderCharts(upid)
		},
		async changeTime() {
			await this.getTimeBrushData();
			await this.getAlgorithmData()
			this.getHttpData()
		},
		async getHttpData() {
			this.jsonData = myJsonData
			this.mergeflag()
			this.jsonData = this.jsonData.filter(d => {
				return this.brushUpid.includes(d.upid)
			})
			this.$refs.mareyChart.paintPre(this.jsonData,myStationData, this.isSwitch, this.brushData)
			return
			this.plateTempPropvalue=['All']
			this.loadingDataLoading = true
			let startDate = this.startDateString;
			let endDate = this.endDateString;
			// let startDate="2018-11-01 00:00:00";
			// let endDate = "2018-11-01 12:00:00";
			// request
			// let stationsResponse = this.getStationsData(startDate, endDate);
			// let jsonResponse = this.getJsonData(startDate, endDate);
			// let conditionResponse = this.getConditionData(startDate, endDate);

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
			this.jsonData.length===0 ? this.getNotification('时间线图选择错误，请重新选择') : undefined
			this.jsonData = this.jsonData.filter(d => {
				return this.brushUpid.includes(d.upid)
			})
			if(this.scatterData.length!==0)this.mergeflag()
			this.$refs.mareyChart.paintPre(this.jsonData, this.stationsData, this.isSwitch, this.brushData);

			// clear
			this.selectedTrainData = [];
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
		getDiagnosisData(upid, widthGap, lengthGap, thicknessGap,platetype) {
			return steel.getDiagnosis({
				'upid': upid,
				'width': widthGap,
				'length': lengthGap, 
				'thickness': thicknessGap,
				'platetype':JSON.stringify(platetype),
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
			// // this.selectedTrainData !== undefined && this.paintUnderCharts(this.selectedTrainData); 
		},

		async trainClick(value) {
			this.upidSelect = []
			this.chooseList = value.batch;
			if(value.type !== "group"){
				value.upidSelect.unshift(value.list[value.list.length - 1])
			}
			this.upidSelect = [...new Set(value.upidSelect)]

			for(let item of value.upidSelect){
				await this.paintScatterList(item)
			}
			this.corrdata = []
			await this.paintUnderCharts(this.upidSelect[0]);
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
			var diagnosisData = this.upidData.get(upid)[0]
			console.log(diagnosisData)
			// Vue.set(this.sampleCss, upid, "solid 0.05px " + this.trainBorder(diagnosisData))
			if(this.corrdata.length !== 0) {
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
			this.$refs.scatterCate.mouse(value)
			this.$refs.parallel.mouse(value)
		},
		scatterMouse(value){
			this.$refs.mareyChart.mouse(value)
			this.$refs.parallel.mouse(value)
		},
		parallMouse(value){
			this.$refs.scatterCate.mouse(value)
			this.$refs.mareyChart.mouse(value)
		},
		paintUnderCharts(upid) {
			// diagnosisData
			this.paintRiverLike(upid);
			this.platetype(upid);
		},

		async paintRiverLike(upid) {
			let query=[]
			for (let item of this.plateTempPropvalue){
				if(item==='All'){
					query.push(item)
				}
			}		
			if(query.length===0)query=this.plateTempPropvalue

			this.selectedUpid =  "UPID " + upid
			// let diagnosisData = (await this.getDiagnosisData(this.selectedTrainData[this.selectedTrainData.length-1], this.plateTempProp.width/1000, this.plateTempProp.length, this.plateTempProp.thickness/1000,query)).data
			var diagnosisData = this.upidData.get(upid)[0]
			this.sampleCss = {}
			Vue.set(this.sampleCss, upid, "solid 0.45px " + this.trainBorder(diagnosisData))
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
				}
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
		async getTimeBrushData() {
			await baogangAxios(`/baogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${this.selectDateStart}/${this.selectDateEnd}/`)
			.then(Response => {
				this.timeBrushData=Response.data
			}).catch(function(error) {
				this.getNotification('时间线渲染错误，请选择合适的时间区间')
			})
			// this.timeBrushData = (await baogangAxios(`/baogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${startDate}/${endDate}/`)).data;

			this.$refs.brushSlider.paintChart(this.timeBrushData)
		},
		async getAlgorithmData() {
			await baogangAxios(this.algorithmUrls[this.algorithmSelected]+ `${this.selectDateStart}/${this.selectDateEnd}/`).then(Response => {
				this.scatterData=Response.data
				this.$refs.scatterCate.paintChart(this.scatterData)
				this.$refs.scatterCate.paintArc([this.startDate, this.endDate])
				this.$refs.parallel.paintChart(Object.values(this.scatterData), this.startDate, this.endDate)
			})
		},
	},
	mounted() {
		// console.log(this.startmonth.getMonth())
		// this.paintDetailPro(2)
		// this.platetype('18B09019000')
		this.getplatetype()
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

