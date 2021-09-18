<template>
	<div class="custom-marey" style="margin-top : -8px;margin-right:4px">
		<el-row :style="cssVars">
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
						<div class="my-card-title" slot="header" >
								<span style="margin-left:5px">Tabular View  <el-button style="height:25px; float:right;" size="small" plain @click="newdiagnose" icon="el-icon-search"></el-button> </span>

						</div>
						<div class="my-card-body" style="padding-top:5px; overflow:scroll">
							<brushableParallel ref="parallel" style="height:490px;width:100%" @parallMouse="parallMouse"></brushableParallel>
						</div>
						<!-- <el-col :span="4"> -->
							
						<!-- </el-col> -->
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
							<marey-chart style="text-align: center; height: 1028px;width:100%;" ref="mareyChart"  @trainClick="trainClick" @trainMouse="trainMouse"></marey-chart>
						</div>
					</el-card>
				</el-row>
				<!-- <transition name="diagnosis"> -->
				<el-row class="diagnosis_view" style="height:0px;">
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
											<small-wheel :ref="item" style="height:223px" :contract="true"></small-wheel>
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
									<wheeler ref="wheelering" style="height:490px" :contract="false"></wheeler>
								</div>
							</el-card>
						</el-col>
						</div>
					</el-card>		
				</el-row>
				<!-- </transition> -->
				<el-button circle class="diagnosis_button" icon="el-icon-more" @click="clickDiagnosisButton"></el-button>
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
		</el-row>

	</div>
</template>

<script>
import anime from 'animejs'
import * as d3 from 'd3';
import util from './util.js';
// import mareyChart from './mareyChart_copy.vue';
import mareyChart from './mareyChart2.vue';
import scatterlog from 'components/charts/scatterlog.vue';
import timeBrush from './timeBrush.vue';
import wheeler from './wheel2.vue';
import smallWheel from './wheel2.vue';
import slider from './slider.vue'
import brushableParallel from "components/charts/brushableParallel.vue"
import { baogangAxios, baogangPlotAxios } from 'services/index.js'
import * as steel from 'services/steel.js'
import { mapGetters, mapMutations} from 'vuex'
import Vue from 'vue';
export default {
	components: { mareyChart, timeBrush, brushableParallel, scatterlog, wheeler , smallWheel, slider},
	data() {
		return {
			diagnosisVisible: false,
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
			startmonth: new Date(2019, 2, 1, 0, 0),
			time: undefined,
			selectedTrainData: [],
			corrdata:[],
			selectedTrainColor: 'green',
			interval: 2,
			selectedUpid: "UPID",
			intervalOptions: [6, 12, 24, 48],
			algorithmOptions: [
				"T-SNE", "UMAP", "ISOMAP", "PCA"
			],
			alldiagnosisData: [],
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
			processTurn: null, 
			upidSelect: ["", "  "],
			corrsize: 0.5,
			multisize: 20,
			curvesize: 0.5,
			sampleCss:{},
			usDiagnosis: {},
      batchDateStart: undefined,
      batchDateEnd: undefined,
      req_count: 0
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
			"trainBorder",
			"startDate",
			"endDate",
			"diagnosisState"
		]),
		dateselect : function(){
      var endmonth = new Date(this.startmonth.valueOf())
      
			// if(endmonth.getMonth() < 12){
			// 	endmonth.setMonth(endmonth.getMonth() + 1)
			// }else{
			// 	endmonth.setFullYear(endmonth.getFullYear() + 1)
			// 	endmonth.setMonth(1)
      // }
      endmonth.setDate(endmonth.getDate() + 5)

			return [this.startmonth, endmonth]
		},
		// monthdata : vm => sampledata[+vm.startmonth.getMonth()+1],
		// allupid : vm => d3.map(vm.monthdata, d => d.upid),
		// upidData : vm => d3.group(vm.monthdata, d => d.upid),
		startDateString: vm => util.timeFormat(vm.startDate),
		endDateString: vm => util.timeFormat(vm.endDate),
		selectDateStart: vm => util.timeFormat(vm.dateselect[0]),
		selectDateEnd: vm => util.timeFormat(vm.dateselect[1]),
		brushData : function(){
			var start = new Date('2018-01-04 00:00:00'),
          end = new Date('2018-01-06 04:00:00');
      return []
      		// console.log(this.monthdata);
			// return this.monthdata.filter(d =>{
			// 	var toc = new Date(d.toc);
				
			// 	// return toc < end && toc > start
			// 	return toc > this.startDate && toc < this.endDate
			// })
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
		async changeUpid(upid){
			this.paintUnderCharts(upid)
		},
		async changeTime() {
      this.req_count = 0;
			await this.getTimeBrushData();
			await this.getAlgorithmData()
			this.getHttpData()
		},
		async getHttpData() {
			// this.jsonData = myJsonData
			// this.mergeflag()
			// this.jsonData = this.jsonData.filter(d => {
			// 	return this.brushUpid.includes(d.upid)
			// })
			// this.$refs.mareyChart.paintPre(this.jsonData,myStationData, this.isSwitch, this.brushData)
			// return
			this.plateTempPropvalue=['All']
			this.loadingDataLoading = true
			// request
			// let stationsResponse = this.getStationsData(startDate, endDate);
			// let jsonResponse = this.getJsonData(startDate, endDate);
			// let conditionResponse = this.getConditionData(startDate, endDate);

			// response
			this.stationsData = (await this.getStationsData(this.startDateString, this.endDateString)).data;
			this.jsonData = (await this.getJsonData(this.startDateString, this.endDateString)).data;
			// this.jsonData = this.jsonData.filter(d => {
			// 	return this.brushUpid.includes(d.upid)
			// })

			let flagData = (await baogangAxios(`/newbaogangapi/v1.0/getFlag/${this.startDateString}/${this.endDateString}/`)).data;
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
			// this.jsonData = this.jsonData.filter(d => {
			// 	return this.brushUpid.includes(d.upid)
			// })
      if(this.scatterData.length!==0) {
				this.mergeflag()
			}
      // console.log("jsonData: ", this.jsonData);
			this.$refs.mareyChart.paintPre(this.jsonData, this.stationsData, this.isSwitch, [], this.isMerge);

			// clear
			this.selectedTrainData = [];
		},
		async newdiagnose() {
			this.changeDiagnosisState()
			this.$refs.parallel.paintChart(Object.values(this.scatterData), this.startDate, this.endDate)

	// 		// response
	// 		// this.stationsData = (await this.getStationsData(startDate, endDate)).data;
	// 		await this.getStationsData(this.startDate, this.endDate).then(Response => {
	// 			this.stationsData=Response.data
    //   })

	// 		this.jsonData = (await this.getJsonData(startDate, endDate)).data;
	// 		// this.jsonData = this.jsonData.filter(d => {
	// 		// 	return this.brushUpid.includes(d.upid)
	// 		// })

	// 		let flagData = (await baogangAxios(`/newbaogangapi/v1.0/getFlag/${startDate}/${endDate}/`)).data
	// 		// this.getplatetype();
	// 		let allDataArr = []
	// 		for (let item of this.jsonData) {
	// 				let upid = item['upid']
	// 				allDataArr.push(flagData[upid])
	// 		}
	// 		for (let i = 0; i < this.jsonData.length; i++) {
	// 			this.jsonData[i]['flag'] = allDataArr[i]
	// 		}

	// 		// paint
	// 		this.loadingDataLoading = false
	// 		this.jsonData.length===0 ? this.getNotification('时间线图选择错误，请重新选择') : undefined
	// 		// this.jsonData = this.jsonData.filter(d => {
	// 		// 	return this.brushUpid.includes(d.upid)
	// 		// })
    //   if(this.scatterData.length!==0)this.mergeflag()
    //   // console.log("jsonData: ", this.jsonData);
	// 		this.$refs.mareyChart.paintPre(this.jsonData, this.stationsData, this.isSwitch, this.brushData, this.isMerge);

	// // 		// clear
	// // 		this.selectedTrainData = [];
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

		paintProcess(value) {
			this.processTurn = value
			this.paintDetailPro(value)
		},

		switchSort() {
			this.paintDetailPro(this.radio)
		},

		getJsonData(startDate, endDate) {
			// return baogangAxios(`/myf/RollingTimeVisualizationMaretoController/selectRollingTimeVisualizationMaretoDataDto/${startDate}/${endDate}/0/5/all/all/40/40/40/40/all/50/`)
      //   .catch(error => {
      //       this.getNotification("getJsonData:"+error)
      //     })
      return baogangPlotAxios(`/newbaogangapi/v1.0/newGetMareyTimesDataApi/all/${startDate}/${endDate}/60`,
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
    animeTransition(){
                if(this.diagnosisVisible){
                anime({
                        targets: ['.diagnosis_view'],
                        // translateY: '-300px',
                        height:'540px',
                        easing: 'easeInOutQuad',
                        // direction: 'alternate',
                        // loop: true
                });
            }else{
                anime({
                        targets: ['.diagnosis_view'],
                        // translateY: '-300px',
                        height:'0px',
                easing: 'easeInOutQuad',
                // direction: 'alternate',
                // loop: true
                });
            }
        },
		async trainClick(value) {
			this.diagnosisVisible = true;
			this.upidSelect = []
      this.chooseList = value.batch;
      this.batchDateStart = value.date_s;
      this.batchDateEnd = value.date_e;
      
      

			if(value.type !== "group"){
				value.upidSelect.unshift(value.list[value.list.length - 1])
			}
      this.upidSelect = [...new Set(value.upidSelect)]//.filter(d => this.upidData.get(d) !== undefined)
      
      this.alldiagnosisData = (await this.getDiagnosisData(
        [this.batchDateStart[0], this.batchDateEnd[this.batchDateEnd.length - 1]],   // time_select
        JSON.stringify([]),   // slabthickness
        JSON.stringify([]),   // tgtdischargetemp
        JSON.stringify([]),   // tgtplatethickness
        JSON.stringify([]),   // tgtwidth
        JSON.stringify([]),   // tgtplatelength2
        JSON.stringify([]),   // tgttmplatetemp
        JSON.stringify([]),   // cooling_start_temp
        JSON.stringify([]),   // cooling_stop_temp
        JSON.stringify([]),   // cooling_rate1
        JSON.stringify([]),   // productcategory
        JSON.stringify([]),   // steelspec
        0,   // status_cooling
        0,   // fqcflag
      )).data;
      this.alldiagnosisData.forEach(d => {
				d.toc = new Date(d.toc)
      })
      this.alldiagnosisData.sort((a, b) => a.toc - b.toc);
      let alldiagnosisUpid = this.alldiagnosisData.map(d => d.upid);

      this.upidSelect = this.upidSelect.filter(d => alldiagnosisUpid.indexOf(d) !== -1)//online
      // console.log(this.upidSelect);
      // console.log(value.upidSelect);

			for(let item of this.upidSelect){
				this.usDiagnosis[item] = this.alldiagnosisData[alldiagnosisUpid.indexOf(item)];
      }
      
      

      this.corrdata = [];
      for(let item of this.upidSelect){
				try{
					await this.paintScatterList(item)
				}catch(e){
					console.log(e)
				}
			}
      await this.paintUnderCharts(this.upidSelect[0]);
      
      this.animeTransition();
      
		},
		async paintScatterList(upid){
      // var diagnosisData = this.upidData.get(upid)[0]   //json
      var diagnosisData = this.usDiagnosis[upid];   //online
      if(this.corrdata['label']) {
				this.$nextTick(function() {this.$refs[upid][0].paintChart(diagnosisData, this.corrdata)})
				return false
			}
      
      await this.getVisCorrelation({
          startDate: this.selectDateStart,
          endDate: this.selectDateEnd,
          nums: 1000
        },   // time_select
				JSON.stringify([]),   // slabthickness
				JSON.stringify([]),   // tgtdischargetemp
				JSON.stringify([]),   // tgtplatethickness
				JSON.stringify([]),   // tgtwidth
				JSON.stringify([]),   // tgtplatelength2
				JSON.stringify([]),   // tgttmplatetemp
				JSON.stringify([]),   // cooling_start_temp
				JSON.stringify([]),   // cooling_stop_temp
				JSON.stringify([]),   // cooling_rate1
				JSON.stringify([]),   // productcategory
				JSON.stringify([]),   // steelspec
				0   // status_cooling
				).then(Response => {
				this.$nextTick(function() {
					this.$refs[upid][0].paintChart(diagnosisData, Response.data)
					this.corrdata = Response.data
				})
			})
    },
    
		async paintRiverLike(upid) {
			this.selectedUpid =  "UPID " + upid
      // var diagnosisData = this.upidData.get(upid)[0]//json
			var diagnosisData = this.usDiagnosis[upid]//online
			this.sampleCss = {}
			Vue.set(this.sampleCss, upid, "solid 0.45px " + this.trainBorder(diagnosisData))

      // console.log(this.alldiagnosisData.map(d => d.toc))
      // console.log(this.batchDateStart)
      // console.log(this.batchDateEnd)

      var processData = this.batchDateStart.map((d, i) => this.alldiagnosisData.filter(e => e.toc >= new Date(d) && new Date(this.batchDateEnd[i]) >= e.toc))
      processData = processData.filter(e => e.length != 0)

      // console.log(processData)

      if(this.corrdata['label']) this.$refs.wheelering.paintChart(diagnosisData, this.corrdata, processData)
			// this.paintDetailPro(this.processTurn)
    },
    
		mareyUpdate(){
      // this.$refs.mareyChart.renderChart(this.isMerge, this.minrange, this.minconflict)
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
    changeDiagnosisVisible() {
			this.diagnosisVisible = !this.diagnosisVisible;
    },
		paintUnderCharts(upid) {
			// diagnosisData
			this.paintRiverLike(upid);
			// this.platetype(upid);
    },
    clickDiagnosisButton() {
      this.diagnosisVisible = ! this.diagnosisVisible
       this.animeTransition()
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

			await baogangPlotAxios(this.algorithmUrls[this.algorithmSelected]+ `${this.selectDateStart}/${this.selectDateEnd}/`, this.req_body).then(Response => {
        this.scatterData=Response.data

				this.$refs.scatterCate.paintChart(this.scatterData, this.req_count)
				this.$refs.scatterCate.paintArc([this.startDate, this.endDate])
        this.$refs.parallel.paintChart(Object.values(this.scatterData), this.startDate, this.endDate)
			})
		},
	},
	mounted() {
		this.getplatetype()
		this.changeTime()
	},
	watch: {
		startDate:function(){
			if(this.scatterData.length == 0)return
			this.$refs.scatterCate.paintArc([this.startDate, this.endDate])
			this.$refs.parallel.paintChart(Object.values(this.scatterData), this.startDate, this.endDate)
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
	margin: -18px;
	padding: 8px;
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
	.myel-tab{
		.el-card__header {
			height: 25px;
			background-color: #fcfcfc;
		}

		.upidtext{
      font-family: var(--dt_family);
			font-size: var(--dt_size);
      font-weight: var(--dt_weight);
      font-style: var(--dt_style);
      color: var(--dt_color);
			position: relative;
      top: -3px
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

