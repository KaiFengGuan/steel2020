<template>
	<div class="custom-marey">
		<el-row style="margin: 2px 0;background: white">
			<!-- <el-col :span="7">
				<wheeler ref="wheelering" style="height:530px;width:530px"></wheeler>
            </el-col> -->
			<!-- <el-col :span="7">
				<wheel ref="wheeling" style="height:475px;width:475px"></wheel>
            </el-col> -->
			<!-- <el-col :span="1">
				<el-button @click="paintView" style="float:left;margin:10px">刷新视图</el-button>	
			</el-col>	
			<el-col :span="12">
				<bundle ref="bundler" style="height:600px;width:600px"></bundle>
            </el-col> -->
			<!-- <el-col :span="7">
				<chord ref="chording" style="height:475px;width:475px"></chord>
            </el-col>	 -->
			<slider style="height:700px,width:400px"></slider>
		</el-row>
	</div>
</template>

<script>




import * as d3 from 'd3';
import util from './util.js';
import scatter from './scatter.vue';
import scatterlog from './scatterlog.vue';
import wheel from './wheel.vue';
import bundle from './bundle.vue';
import chord from './chord.vue';
import wheeler from './wheeler.vue';
import mareyChart from './mareyChart.vue';
import slider from './slider.vue'
import polyLineChart from './polyLine.vue';
import plateTemperature from './plateTemperature.vue';
import timeBrush from './timeBrush.vue';
import gauge from './gauge.vue';
import threeBar from './threeBar.vue';
import force from './force.vue';
import heat from "./heat.vue";
import riverLike from "./riverLike.vue";
import bar from "./Bar.vue";
import scatterAxis from "./scatterAxis.vue"
import { baogangAxios, baogangPlotAxios } from 'services/index.js'
var echarts = require('echarts');
export default {
	components: { mareyChart, scatter, polyLineChart, plateTemperature, timeBrush, gauge, heat, riverLike, bar, scatterAxis, threeBar, force,scatterlog,wheel,wheeler,bundle,chord ,slider},
	data() {
		return {
			bundling:false,
			symbolvalue:0.05,
			linesize:0.25,
			heatindex:false,
			rollindex:false,
			coolindex:false,
			diagnosisData:[],
			// monthToShow: new Date('2018-09-15 00:00:00'),
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
			isSwitch: false,
			startDate: new Date('2018-09-15 00:00:00'),
			endDate: new Date('2018-09-15 04:00:00'),
			dateselect:[new Date(2018, 10, 1, 0, 0), new Date(2018, 10, 30, 0, 0)],
			display: false,
			time: undefined,
			radarIndicatorOptions: [],
			indicators: [],
			temperatureData: {},
			selectedTrainData: [],
			selectedTrainColor: 'green',
			tempStations: [],
			interval: 12,
			intervalOptions: [6, 12, 24, 48],
			algorithmOptions: [
				"T-SNE", "MDS", "PCA"
			],
			algorithmUrls: {
				"T-SNE": "/baogangapi/v1.0/model/VisualizationTsne/",
				"MDS": "/baogangapi/v1.0/model/VisualizationMDS/",
				"PCA": "/baogangapi/v1.0/model/VisualizationPCA/"
			},
			algorithmSelected: "T-SNE",
			plateTempProp: {
				slabid: "44191730513",
				width: 10,
				length: 5,
				thickness: 1,
				deviation:25
			},
			test: 15,
			detailProcess: [],
			processInTurn: [null, null],
			processData: {},
			// processArray: {
			//   1: ['FuFladc_data'],
			//   2: ['meas_data-0','meas_data-1','meas_data-2','meas_data-3','meas_data-4','meas_data-5',
			//                   'meas_data-6','meas_data-7','meas_data-8','meas_data-9','meas_data-10','meas_data-11',
			//                   'post_data-0','post_data-1','post_data-2','post_data-3','post_data-4','post_data-5',
			//                   'post_data-6','post_data-7','post_data-8'],
			//   3: ['Scanner_data','p1Temp', 'p2LTemp', 'p4Temp', 'p5Temp', 'p6Temp']
			// },
			processArray: ['heat', 'roll', 'cool'],
			forcedata:{},
			// biasData: [],
			// biasCalcuMeth: false,
			loadingDataLoading: false,
			radio: 0,
			chooseList: [],
			processTurn: null, 
			kindRef: {
				length: 0.5,
				width: 0.5,
				thickness: 0.5
			},
			scatterResponse: null
		}
	},
	computed: {},
	created() {
		// this.day()
	},
	methods: {
		forceswtich(){
			this.$refs.force.sizechange()
		},
		changeTimeBrush() {
			this.getTimeBrushData();
		},
		changeTime() {
			// // this.$message('这是一条消息提示');
			// this.$message(this.monthToShow.toString())
			// let timeArr = this.monthToShow.toString().split(' ')
			// let month = timeArr[2]
			// let year = timeYear[3]
			// baogangAxios()
			this.changeTimeBrush()
			this.getRadarIndicatorOptions()
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
			console.log('fjdksljdajlk')
			console.log(this.startDate)
		},
		async getHttpData() {
			// this.clearAllChart()
			this.plateTempPropvalue=['All']
			this.isSearch = true
			this.loadingDataLoading = true
			let startDate = util.timeFormat(this.startDate);
			let endDate = util.timeFormat(this.endDate);

			// request
			// let stationsResponse = this.getStationsData(startDate, endDate);
			// let jsonResponse = this.getJsonData(startDate, endDate);
			// let conditionResponse = this.getConditionData(startDate, endDate);
			// let temperatureResponse = this.getTemperatureData();

			// response
			// this.stationsData = (await this.getStationsData(startDate, endDate)).data;
			await this.getStationsData(startDate, endDate).then(Response => {
				this.stationsData=Response.data
					}).catch(function(error) {
				// 处理 getJSON 和 前一个回调函数运行时发生的错误
				console.log('发生错误！', error);
				// this.$alert('请求时间刷图异常，请检查连接或者刷新', '警告', {
				//   confirmButtonText: '确定',
				//   callback: action => {
				//     this.$message({
				//       type: 'info',
				//       message: `action: ${ action }`
				//     });
				//   }
				// });
					})
			this.jsonData = (await this.getJsonData(startDate, endDate)).data;

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
			// if(this.jsonData.length===0){
			//           this.$alert('时间线图选择错误，请重新选择', '警告', {
			//     confirmButtonText: '确定',
			//   });
			// }
			if(this.jsonData.length===0){
			this.erroralert('时间线图选择错误，请重新选择')
			}
			this.$refs.mareyChart.paintMareyChart(this.jsonData, this.stationsData, "conditionData");
			this.getAlgorithmData();

			// clear
			this.selectedTrainData = [];
			// this.loadingDataLoading = false
			
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
		getDiagnosisData() {
			return baogangPlotAxios('/baogangapi/v1.0/baogangPlot/diagnosesdata', {
				'upid': "18B01060000",
				'width': 0.1,
				'length': 5, 
				'thickness': 0.001,
				'platetype':JSON.stringify(["All"]),
			})
		},

		// 获取诊断试图数据 灵活后台
		// getDiagnosisData(choseUpid) {
		//   return baogangPlotAxios('/baogangapi/v1.0/baogangPlot/diagnosesdata', {
		//     'upid': choseUpid,
		//     'lengthFloat': this.kindRef.length,
		//     'widthFloat': this.kindRef.width,
		//     'thinknessFloat': this.kindRef.thickness
		//   })
		// },
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
						if(!this.errorflag)
				{this.erroralert("缺乏工序数据，请重新选择钢板或工序\n或钢板量少，请修改Tabular Parameters参数")
					
				}this.errorflag=false
			})
		},
		// getDetailProcess(upid, process, width, length, thickness,platetype) {
		//     return baogangAxios(`/baogangapi/v1.0/model/Visualization/${upid}/${process}/${width}/${length}/${thickness}/${platetype}/`).
		//     catch(error=>{
		//       this.erroralert("缺乏工序数据，请重新选择钢板或工序\n或钢板量少，请修改Tabular Parameters参数")
		//     })
		// },
		getplatetype() {
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
				// console.log(data)
				console.log(this.plateoptions)
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
				this.erroralert("getJsonData:"+error)
			})
		},

		getStationsData(startDate, endDate) {
			return baogangAxios(`/myf/RollingTimeVisualizationMaretoController/selectRollingTimeVisualizationMaretoStationDto/${startDate}/${endDate}/0/5/all/all/40/40/40/40/all/`)
					.catch(function(error){
						this.erroralert("getStationsData:"+error)
					})
		},
		erroralert(error){
			this.isSearch = false
			this.loadingDataLoading = false
			this.scatterLoading = false
				this.$alert(error, '警告', {
					confirmButtonText: '确定',
					callback: action => {
					}
				});
		},
		switchChange(bool) {
			let selectcolor=this.$refs.mareyChart.setTrainColor(bool) 
			if(selectcolor)(this.selectedTrainColor=selectcolor)
			this.changeScatterColor();
			// // this.selectedTrainColor
			// let seletcolor=this.$refs.mareyChart.setTrainColor(bool) 
			// // this.changeScatterColor();
			// // this.selectedTrainData !== undefined && this.paintUnderCharts(this.selectedTrainData); 
			this.selectedTrainData !== undefined && this.paintSwitchUnderCharts(this.selectedTrainData); 
		},
		getAlgorithmData() {
			var symbolSizeScaler = d3.scaleLinear()
				.domain([0.006, 0.16])
				.range([6, 12])
			this.scatterLoading = true
			baogangAxios(this.algorithmUrls[this.algorithmSelected] + `${util.timeFormat(this.startDate)}/${util.timeFormat(this.endDate)}/`).then(Response => {
				this.scatterResponse = Response
				let tempArray = []
				for (let key in Response.data) {
					tempArray.push(Response.data[key]);
				}
				let nestedArrayByCategory = d3.nest()
					.key(d => d.productcategory)
					.entries(tempArray);
				let seriesDataForLabel = [
					{
						name: '0',
						type: 'scatter',
						data: tempArray.filter(d => d.label === '0').map(v => {
							return {
								value: [v.x, v.y],
								name: v.upid.toString()
							}
						}),
						symbolSize: (data, params) => {
							return symbolSizeScaler(tempArray[params.dataIndex].tgtplatethickness2)
						},
						itemStyle: {
							color: util.labelColor[0],
						}
					},
					{
						name: '1',
						type: 'scatter',
						data: tempArray.filter(d => d.label === '1').map(v => {
							return {
								value: [v.x, v.y],
								name: v.upid.toString()
							}
						}),
						symbolSize: (data, params) => {
							return symbolSizeScaler(tempArray[params.dataIndex].tgtplatethickness2)
						},
						itemStyle: {
							color: util.labelColor[1]
						}
					}
				]
				// 多个颜色
				// let seriesDataForLabel = [0, 1, 2, 3, 4].map(item => {
				//   return {
				//     name: String(item),
				//     type: 'scatter',
				//     data: tempArray.filter(d => d.label === '0').map(v => {
				//       return {
				//         value: [v.x, v.y],
				//         name: v.upid.toString()
				//       }
				//     }),
				//     symbolSize: (data, params) => {
				//       return symbolSizeScaler(tempArray[params.dataIndex].tgtplatethickness2)
				//     },
				//     itemStyle: {
				//       color: util.labelColor[item],
				//       shadowBlur: 10,
				//       // shadowColor: 'rgba(25, 100, 150, 0.5)',
				//       shadowOffsetY: 5,
				//       opacity: 0.7
				//     }
				//   }
				// })
				let scatterOption =
				{
					seriesData: this.isSwitch ? seriesDataForLabel : nestedArrayByCategory.map(n => {
						return {
							name: n.key,
							type: 'scatter',
							data: n.values.map(v => {
								return {
									value: [v.x, v.y],
									name: v.upid.toString()
								}
							}),
							symbolSize: (data, params) => {
								return symbolSizeScaler(tempArray[params.dataIndex].tgtplatethickness2)
							},
							itemStyle: {
								color: util.categoryColor(n.key)
							}
						}
					}),
					tooltip: {
						formatter: function (params) {
							return "upid:" + tempArray[params.dataIndex].upid + "<br/>"
								+ "category:" + tempArray[params.dataIndex].productcategory + "<br/>"
								+ "time:" + tempArray[params.dataIndex].toc + "<br/>"
								// + "tgtwidth:" + tempArray[params.dataIndex].tgtwidth + "<br/>"
								// + "crowntotal:" + tempArray[params.dataIndex].crowntotal + "<br/>"
								// + "wedgetotal:" + tempArray[params.dataIndex].wedgetotal + "<br/>"
								// + "tgtplatethickness2:" + tempArray[params.dataIndex].tgtplatethickness2 + "<br/>"
								// + "ave_temp_dis:" + tempArray[params.dataIndex].ave_temp_dis + "<br/>"
						}
					},
					
					
				}
				this.myScatterChart = echarts.init(document.getElementById('scatter'))
				this.scatterChange = scatterOption
				var OptionFScatter = {}
				OptionFScatter.series = scatterOption.seriesData;
				OptionFScatter.tooltip = scatterOption.tooltip;
				OptionFScatter.xAxis =  [{
					show: false,
					type: 'value',
					scale: true,
					splitLine: {
						show: true
					},
					axisLabel: {
							show: false
					}
				}]
				OptionFScatter.yAxis = [{
					show: false,
					type: 'value',
					scale: true,
					splitLine: {
						show: true
					},
					axisLabel: {
							show: false
					}
				}]

				this.myScatterChart.setOption(OptionFScatter, true);
				this.scatterLoading = false
				this.isSearch = false
			}).catch(()=>{this.erroralert(this.algorithmSelected+'请求错误')})
		},

		changeScatterColor() {
				var symbolSizeScaler = d3.scaleLinear()
					.domain([0.006, 0.16])
					.range([6, 12])
				// this.scatterLoading = true
				let tempArray = []
				for (let key in this.scatterResponse.data) {
					tempArray.push(this.scatterResponse.data[key]);
				}

				let nestedArrayByCategory = d3.nest()
					.key(d => d.productcategory)
					.entries(tempArray);
				let seriesDataForLabel = [
					{
						name: '0',
						type: 'scatter',
						data: tempArray.filter(d => d.label === '0').map(v => {
							return {
								value: [v.x, v.y],
								name: v.upid.toString()
							}
						}),
						symbolSize: (data, params) => {
							return symbolSizeScaler(tempArray[params.dataIndex].tgtplatethickness2)
						},
						itemStyle: {
							color: util.labelColor[0],
						}
					},
					{
						name: '1',
						type: 'scatter',
						data: tempArray.filter(d => d.label === '1').map(v => {
							return {
								value: [v.x, v.y],
								name: v.upid.toString()
							}
						}),
						symbolSize: (data, params) => {
							return symbolSizeScaler(tempArray[params.dataIndex].tgtplatethickness2)
						},
						itemStyle: {
							color: util.labelColor[1]
						}
					}
				]
				let scatterOption =
				{
					seriesData: this.isSwitch ? seriesDataForLabel : nestedArrayByCategory.map(n => {
						return {
							name: n.key,
							type: 'scatter',
							data: n.values.map(v => {
								return {
									value: [v.x, v.y],
									name: v.upid.toString()
								}
							}),
							symbolSize: (data, params) => {
								return symbolSizeScaler(tempArray[params.dataIndex].tgtplatethickness2)
							},
							itemStyle: {
								color: util.categoryColor(n.key)
							}
						}
					}),
					tooltip: {
						formatter: function (params) {
							return "upid:" + tempArray[params.dataIndex].upid + "<br/>"
								+ "category:" + tempArray[params.dataIndex].productcategory + "<br/>"
								+ "time:" + tempArray[params.dataIndex].toc + "<br/>"
								// + "tgtwidth:" + tempArray[params.dataIndex].tgtwidth + "<br/>"
								// + "crowntotal:" + tempArray[params.dataIndex].crowntotal + "<br/>"
								// + "wedgetotal:" + tempArray[params.dataIndex].wedgetotal + "<br/>"
								// + "tgtplatethickness2:" + tempArray[params.dataIndex].tgtplatethickness2 + "<br/>"
								// + "ave_temp_dis:" + tempArray[params.dataIndex].ave_temp_dis + "<br/>"
						}
					},
					
					
				}
				this.myScatterChart = echarts.init(document.getElementById('scatter'))
				this.scatterChange = scatterOption
				var OptionFScatter = {}
				OptionFScatter.series = scatterOption.seriesData;
				OptionFScatter.tooltip = scatterOption.tooltip;
				OptionFScatter.xAxis =  [{
					show: false,
					type: 'value',
					scale: true,
					splitLine: {
						show: true
					},
					axisLabel: {
							show: false
					}
				}]
				OptionFScatter.yAxis = [{
					show: false,
					type: 'value',
					scale: true,
					splitLine: {
						show: true
					},
					axisLabel: {
							show: false
					}
				}]
				this.myScatterChart.setOption(OptionFScatter, true);
				this.scatterLoading = false
				this.isSearch = false
		}, 

		trainClick(value) {

			this.selectedTrainData = value.list;
			this.selectedTrainColor = value.color;
			if (this.chooseList.length === 0) {
				// 高亮当前图形
				this.myScatterChart.dispatchAction({
						type: 'highlight',
						name: value.list[value.list.length-1]
				});
				// 显示 tooltip
				this.myScatterChart.dispatchAction({
						type: 'showTip',
						name: value.list[value.list.length-1]
				});
			}
			else if (value.list.length < this.chooseList.length) {
				this.myScatterChart.dispatchAction({
						type: 'downplay',
						name: this.chooseList[this.chooseList.length-1]
						
				})
			} else {
				// 高亮当前图形
				this.myScatterChart.dispatchAction({
						type: 'highlight',
						// seriesIndex: 1,
						name: value.list[value.list.length-1]
				});
				// 显示 tooltip
				this.myScatterChart.dispatchAction({
						type: 'showTip',
						// seriesIndex: 0,
						name: value.list[value.list.length-1]
						
				});
			}
			this.chooseList = value.list
			this.paintUnderCharts(this.chooseList[0]);
			// plate heat
			// this.selectedTrainData.length > 0 && this.getPlate(this.selectedTrainData.slice(-1)[0]);

			
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
			let query=[]
			for (let item of this.plateTempPropvalue){
				if(item==='All'){
					query.push(item)
				}
			}
			if(query.length===0)query=this.plateTempPropvalue
			let diagnosisData = (await this.getDiagnosisData()).data
			// this.$refs.wheelering.paintChart(diagnosisData)
			// this.$refs.chording.paintChart()
		},
		async paintView() {
			let query=[]
			for (let item of this.plateTempPropvalue){
				if(item==='All'){
					query.push(item)
				}
			}
			if(query.length===0)query=this.plateTempPropvalue
			let diagnosisData = (await this.getDiagnosisData()).data
			// this.$refs.wheeling.paintChart(diagnosisData)
			await baogangAxios("baogangapi/v1.0/model/VisualizationCorrelation/"+`${util.timeFormat(this.dateselect[0])}/${util.timeFormat(this.dateselect[1])}/`).then(Response => {
				this.forcedata=Response.data
				this.$refs.wheelering.paintChart(diagnosisData,Response.data)
				// this.$refs.bundler.paintChart(diagnosisData,Response.data)
			})
			// this.$refs.chording.paintChart()	
		},
		async paintDetailPro(processNumber) {
			this.processInTurn = [null, null]
			// let proDetail = this.getDetailProcess(this.selectedTrainData[this.selectedTrainData.length-1], 1)
			let processName = this.processArray[processNumber]||'heat'

			
			let biasData = []
			if(this.selectedTrainData.length===0){
				this.erroralert("未选择具体钢板进行分析，请在马雷图选择钢板")
				 return}
			if(this.plateTempPropvalue.length===0){
				// this.erroralert("未选择合适的钢板类型进行分析，将默认为你选取所有钢板") 
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
			this.orderchange()
		},
		orderchange(){
			this.processInTurn = Object.keys(this.processData)
			if(this.orderselect==='Number'){
				console.log('22222')
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
			// this.paintRadar();
		},
		async getTimeBrushData() {
			var s1 = this.dateselect[0].getTime(),s2 = this.dateselect[1].getTime();
			var total = (s2 - s1)/1000;
			var day = parseInt(total / (24*60*60));//计算整数天数
			if(day>=62){
				this.$alert('选择超过期限，请重新选择', '警告', {
					confirmButtonText: '确定',
					callback: action => {
						// this.$message({
						//   type: 'info',
						//   message: `action: ${ action }`
						// });
					}
				});
				return 
			}
			let startDate=util.timeFormat(this.dateselect[0])
			let endDate=util.timeFormat(this.dateselect[1])
			// let startDate = util.timeFormat(this.monthToShow);
			
			// let end = new Date(this.monthToShow.valueOf());
			// end.setMonth(end.getMonth() + 1)
			// let endDate = util.timeFormat(end);
// .then(Response => {
//       }).catch(function(error) {
//     // 处理 getJSON 和 前一个回调函数运行时发生的错误
//     console.log('发生错误！', error);
//       })
			// this.timeBrushData = (await baogangAxios(`/baogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${startDate}/${endDate}/`)).data;
			await baogangAxios(`/baogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${startDate}/${endDate}/`)
			.then(Response => {
				this.timeBrushData=Response.data
					}).catch(function(error) {
				// 处理 getJSON 和 前一个回调函数运行时发生的错误
				console.log('发生错误！', error);
				this.erroralert('时间线渲染错误，请选择合适的时间区间')
					})
			// 时间改为灵活
			// this.timeBrushData = (await baogangAxios(`/baogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${startDate}/${endDate}/`)).data;

			this.isSearch = false 
			let keys = ["endTimeOutput", "good_flag", "bad_flag"]
			this.$refs.timeBrush.paint({
				paintData: this.timeBrushData,
				color: util.labelColor,
				starttime:util.timeFormat(this.startDate)
			});
		},
		async getRadarIndicatorOptions() {
			let startDate = util.timeFormat(this.dateselect[0]);
			let endDate = util.timeFormat(this.dateselect[1])
			await	baogangAxios("/baogangapi/v1.0/model/VisualizationTsne/"+ `${util.timeFormat(this.dateselect[0])}/${util.timeFormat(this.dateselect[1])}/`).then(Response => {
				this.scatterResponse = Response.data
				this.$refs.scatterlog.paintChart(this.scatterResponse)
				this.$refs.scatterlog.paintArc([new Date(2018, 10, 1, 0, 0), new Date(2018, 10, 2, 0, 0)])
			})
		},
	},
	mounted() {
		// this.getRadarIndicatorOptions();
		this.paintRiverLike();
	}
	
}
</script>

<style>
.panel-title {
	margin: 14px;
	font-size: 14px;
	font-weight: bold;
}
</style>
<style lang="scss">
</style>