<template>
		<div :id="menuId" style="height: 100%;width:100%;"></div>
</template>

<script>
import * as d3 from 'd3';

import { addElement, updateElement, updateAsyncElement , updateStyles, sortedIndex} from 'utils/element';
import clickIcon from 'assets/images/wheel/fixed.svg'
import util from 'views/baogang/util.js';
import processJson from "assets/json/processJson.json"
import { divideData, arrowData, mergeColor, diagnosticSort, queryIcon} from "utils/data.js"
import {preRoll, boxplot} from './boxplot.js';
import {mergeBar} from './index.js';
import rollData from 'views/data/rollData.json';
export default {
	props: {
		// contract: {
		// 	default: false,
		// 	type: Boolean,
		// 	require: true
		// }
	},
	data() {
			return {
					menuId: 'wheeling' + Math.random().toString(32).slice(-6),
					svg: undefined,
					data:[],
					jsondata: undefined,
					batchData: undefined,
					upid: undefined,
					steeltoc: undefined,
					wheelChart: {},
					height: undefined,
					width: undefined
			}
	},
	methods: {
		paintChart(jsondata, batchData) {
			this.jsondata = jsondata, this.batchData = batchData;
			var wheeldata = [] , labels = [], searchLabels = [];
			this.upid = jsondata.upid
			this.steeltoc = jsondata.toc
			for(let item in jsondata['CONTJ']){ //online
				searchLabels.push(jsondata['one_dimens'][item]['name'])
				if(processJson.flat().indexOf(jsondata['one_dimens'][item]['name']) == -1)continue
				labels.push(jsondata['one_dimens'][item]['name'])
				wheeldata.push({
					name: jsondata['one_dimens'][item]['name'],
					PCASPE: jsondata['CONTQ'][item],
					PCAT2: jsondata['CONTJ'][item],
					result_value: jsondata['one_dimens'][item]['value'],
					result_low: jsondata['one_dimens'][item]['l'],
					result_high: jsondata['one_dimens'][item]['u'],
					result_extre_high: jsondata['one_dimens'][item]['extremum_u'],
					result_extre_low: jsondata['one_dimens'][item]['extremum_l'],
					result_extre_shigh: jsondata['one_dimens'][item]['s_extremum_u'],
					result_extre_slow: jsondata['one_dimens'][item]['s_extremum_l'],
				})
			}
			const vm = this		
			this.svg !== undefined && this.svg.remove()
			this.svg=d3.select('#' + this.menuId)
				.append('svg')
				.attr('viewBox', `${-50} ${-this.height / 2} ${this.width} ${this.height}`)
				.style('width', this.width)
				.style('height', this.height);
			class wheelRound{
				constructor(container, vNode) {
					this._container = container;
					this._vN = vNode;
					this._staticGroup = null;
					this._g = null;

					this._width = 640;
					this._height = 640;
					this._fontSize = {
						info: 10,
						center: 24,
						month: 9,
						mark: 8,
						tick: 8
					};

					this._data = null;
					this._chartData = null;
					this._field = {
						name: 'name',
						low: 'result_low',
						high: 'result_high',
						elow: 'result_extre_low',
						ehigh: 'result_extre_high',
						avg: 'result_value',
						spe: 'PCASPE',
						t2: 'PCAT2',
					}

					this._y = null; // temperature scale

					this._labels=null;

					//staticGroup
					this._sliderTimer = null;

					this._process=[];
					this._processindex = ['heat', 'roll', 'cool'];
					this._labelcolor = ['#fcd8a9', '#cce9c7', '#c1c9ee'];
					this._flagColor = ["#e3ad92",   "#b9c6cd"];
					this._sliderValue = 40;
					this._horizonView = true;
					this._indexScale = 0;
					this._mouseDis  = undefined;
					this._barVis = false;
					this._stopPropagation = (e, d) => e.stopPropagation();

					//mainG
					this._mainG = null;
					this._borderStyle ={
						color: '#b9bbbd',
						rx: 3,
						ry: 3
					}

					//contentG
					this._contentG = null;

					this._barInstance = null;

					this._buttonColor = '#94a7b7'; //  #678fba
					this._buttonStyle = {
						width: 40,
						height: 18 ,
						textX: 20,
						textY:  12
					};

					// 高亮
					this._upid = null;
				}
				getIndex(_){
					for (let item in this._process){
						if(this._process[item].indexOf(_)!==-1){
							return +item
						}
					}
				}

				dataInit(wheeldata, batchData) {
					this._data = wheeldata;
					this._batchData = batchData;
					return this;
				}

				labels(_){
					return arguments.length ? (this._labels = _, this) : this._labels;
				}

				process(_){
					return arguments.length ? (this._process = _, this) : this._process;
				}

				field(_) {
					return arguments.length ? (this._field = _, this) : this._field;
				}

				size(_) {
					return arguments.length ? (this._width = _[0], this._height = _[1], this) : [this._width, this._height];
				}

				render() {
					this._staticGroup = this._container
						.append('g')
						.attr('class', 'staticGroup');
					this._initDefs()
					this._renderMerge()
					return this;
				}


				_renderMerge(){
					this._g == null ? undefined : this._g.remove();
					this._g = this._container.append('g')
					
					this._initdata();
					this._renderData();
					this._initAttrs();
					this._initMainG();
					// _renderMainBar()
					this._staticGroup.raise();

					const svg = this._g;
					const zoom = d3.zoom().on('zoom', e => {
						svg.attr('transform', e.transform);
					})

					this._container
						.call(zoom)
						.call(zoom.transform, d3.zoomIdentity);
				}
				renderData(){
					this._batchEX = this._divideBacthData(dataInfo, this._batchData);
				}
				_initAttrs(){
					const	maxLength = this._batchData.length,  //batch numbers
						rectArray = new Array(maxLength).fill(0).map((d, i) => (this._batchData[i].length + 1) * 4.75),   //batch position
						rectPosition = Array.from(d3.cumsum(rectArray)),
						RectWidth = rectPosition[rectPosition.length - 1];
					this._margin = {top: 40, bottom: 25, left: 0, right: 0};
					this._mainAttrs = {
						'body': {
							class: 'mainG'
						},
						'background': {
							transform: `translate(${[0, - this._height / 2]})`,
							width: this._width,
							height: this._height,
							fill: 'white',
							stroke: 'none'
						}
					}
				}
				_initMainG(){
					this._mainG = this._g.append('g')
						.call(g => updateElement(g, this._mainAttrs.body))
						.call(g => addElement(g, 'rect', this._mainAttrs.background));

					this._barInstance = this._renderMainBar.bind(this)();
				}
				_renderMainBar() {
					const wm = this,
						lc = this._labelcolor,
						mainG = this._mainG,
						dataInfo = this._chartData;
					diagnosticSort(this._batchData);
					var horizenEX = this._batchData.map(d => this._sliderArray(dataInfo, d))
							.map((d, i) => d.map((e, f) => {
								var temp = e.map(g => {
									g.i = i;
									return g
								})
								temp.i = i;
								temp.d = f;
								return temp
							}
							)),
						maxLength = this._batchData.length,  //batch numbers
						rectArray = new Array(maxLength).fill(0).map((d, i) => (this._batchData[i].length + 1) * 4.75),   //batch position
						rectPosition = Array.from(d3.cumsum(rectArray)),
						RectWidth = rectPosition[rectPosition.length - 1],
						minRect = RectWidth / (maxLength + 0.5),
						batchEX = this._batchEX;

					// for(let item in batchEX){

					// 	console.log('----------------------')
					// 	console.log(dataInfo[item].indexName, 'extremum_original_l', batchEX[item].flat().map(d => d.extremum_original_l))
					// 	console.log(dataInfo[item].indexName, 'original_value', batchEX[item].flat().map(d => d.original_value))
					// 	console.log(dataInfo[item].indexName, 'extremum_original_u', batchEX[item].flat().map(d => d.extremum_original_u))
					// 	console.log('----------------------')
					// }
					// console.log(this._batchData, horizenEX)
					// console.log(this._batchData, horizenEX, this._batchData.map(d => this._sliderArray(dataInfo, d)))
					// console.log(this._divideBacthData(dataInfo, this._batchData))
					var merge_g = 0,
						plot_g = 0,
						chartHeight = this._sliderValue,   //rect max height
						chartPadding = { left: 1.5, right: 1.5, top: 2, bottom: 2, horizen: 3, vertical: 4 },
						boxMargin = { bottom: 5, top: 5, left: 5, right: 5, horizen: 10, vertical: 10 },
						chartMargin = 5,
						textWidth = 75,
						textMargin = { bottom: 5, top: 5, margin: 5, left: 5, right: 0, horizen: 5, vertical: 10 },
						cardWidth = boxMargin.horizen + RectWidth + textWidth + textMargin.horizen,
						cardMargin = 20;

					var rectNum = null,
						opacityCache = null,
						barVisObject = Object.assign({}, ...dataInfo.map(d => { return { [d.indexName]: this._barVis } })),
						indexArray = d3.map(dataInfo, (d, i) => i),
						indexSort = d3.map(dataInfo, d => d.indexName),
						indexScale = null,// index  --- sort
						rectHeight = null,
						yScaleCache = null,
						yScale = null,  //指标在y轴上的坐标
						lastY = null,
						scaleArray = null;
					var  // init All Attrs
						cardAttrs = null,
						sliderAttrs = null,
						rectAttrs = null,
						dragAttrs = null,
						iconAttrs = null,
						sortAttrs = null,
						switchAttrs = null,
						linearGradientAttrs = null,
						mergeAttrs = null,
						horizenAttrs = null,
						barAttrs = null,
						textAttrs = null,
						heatMapAttrs = null,
						shapeAttrs = null,
						symbolAttrs = null;

					this._initSlider()

					initOrdinal.call(this);
					renderyScale();
					initAttrs.call(this); //init Element Attrs

					initBackG();	//init defs and background

					var cardG = mainG.append('g').attr('class', 'cardG');
					initCardG.call(this);

					var sliderG = mainG.append('g').attr('class', 'sliderG').attr('transform', sliderAttrs.transform);

					sliderG.append('rect')
						.attr('fill', 'white')
						.attr('transform', `translate(${[0, -wm._height / 2]})`)
						.attr('height', wm._height)
						.attr('width', RectWidth)
						.attr('stroke', 'none')
						.attr('class', 'backRect')

					var rectG = mainG.append('g').attr('class', 'rectG');

					var dragG = sliderG.append('g').attr('class', 'dragG');
					initDragG();
					var timeScale;
					//https://observablehq.com/d/d503153fbfd48b03

					var gradientG = sliderG.append('g').attr('class', 'gradientG');
					initLinearGradient();

					var mergeG = sliderG.append('g').attr('class', 'mergeG');
					var horizenG = sliderG.append('g').attr('class', 'horizenG');
					wm._horizonView ? initMergeArea() : initHorizenArea();
					if (rectArray.some(d => d === chartHeight)) initRectG()
					// initAxisG(timeScale);

					var triangleG = mainG.append('g').attr('class', 'triangleG');
					initTriangleG();

					var barG = mainG.append('g').attr('class', 'barG');
					initBarG.call(this);

					var symbolG = mainG.append('g').attr('class', 'symbolG');
					initSymbol.call(this);

					var mouseInfo = this._mouseDis !== undefined ? mouseText(this._mouseDis) : undefined,
						textG = sliderG.append('g').attr('class', 'textG');
					initMouseG();

					let sortG = this._staticGroup.append('g').attr('class', 'sortG');
					initSort.call(this);

					const switchG = this._staticGroup.append('g').attr('class', 'switchG');
					initSwitch.call(this);

					const visG = this._staticGroup.append('g').attr('class', 'visG');
					initVisG.call(this);

					const shapeGroup = sliderG.append('g').attr('class', 'shapeGroup');
					initShape();
					// const 
					// const heatMapG = mainG.append('g').attr('class', 'heatMapGroup');
					// initMapArea()
					// heatMapG.raise();

					renderSort()
					
					const plot_offset = { h: chartHeight * 1.5, w: chartHeight * 1.5/ 200 * 1000, gap: 20},
						plot_coordinate = [RectWidth + boxMargin.left + textMargin.horizen + textWidth + 50,-wm._height / 2],
						plotG = mainG.append('g').attr('class', 'plotGroup').attr('transform', `translate(${plot_coordinate})`),
						rollKeys = ['bendingforce', 'bendingforcebot', 'bendingforcetop','rollforce', 'rollforceds', 'rollforceos',
							'screwdown','shiftpos', 'speed', 'torque', 'torquebot', 'torquetop'],
						rollValues = new Array(rollKeys.length).fill(0).map(() => Math.random()),
						boxPlotBroderAttrs = {
							height: plot_offset.h,
							width: plot_offset.w,
							rx: this._borderStyle.rx,
							ry: this._borderStyle.ry,
							'stroke-width': 0.25,
							fill: 'none',
							filter: 'url(#card-shadow)',
							stroke: this._borderStyle.color
						},
						boxPlotAttrs = {
							id: d => d,
							class: 'plotChart'
							// class: 
						},
						plotGroupAttrs = {};
					let plotGroup = null;

					function scalePlotY() {
						let order = d3.scaleOrdinal().domain(rollKeys).range(sortedIndex(rollValues)),
							rectHeight = new Array(rollValues.length).fill(plot_offset.h + plot_offset.gap);
						rectHeight.unshift(0)   //定位第一个元素
						let yCoordinate = Array.from(d3.cumsum(rectHeight)),
						plot_num = Math.floor((this._height + plot_offset.gap)/(plot_offset.gap + plot_offset.h));
						plotGroupAttrs.display = d => plot_g <= order(d) && order(d) < plot_num + plot_g ? 'block' : 'none';
						let baseHeight = yCoordinate[0] - yCoordinate[plot_g];
						plotGroupAttrs.transform = d => `translate(${[0, yCoordinate[order(d)] + baseHeight]})`;
					}
					scalePlotY.call(this);
					initPlotG.call(this);

					// const iconG = mainG.append('g')
					//   // .attr('transform', textAttrs.position)
					//   .attr('transform', (d, i) => `translate(${[mouseInfo ? wm._mouseDis : 0, 0]})`)
					//   .attr('class', 'iconClass');
					// iconG
					//   .call(g => g.append('line')
					//   .attr('y1', textAttrs.line0)
					//   .attr('y2', textAttrs.line1)
					//   .attr('stroke', '#bbbcbd')
					//   .attr('stroke-width', 0.25))
					//   .call(g => g.append('image')
					//   .attr('width', '25px')
					//   .attr('height','25px')
					//   // .attr('transform', `translate(${[-45, -12.5]})`)
					//   .attr('href', clickIcon))
					// clickIcon
					function initPlotG(){
						plotG
						.append('rect')
						.attr('fill', 'white')
						.attr('stroke', 'none')
						.attr('width', boxPlotBroderAttrs.width)
						.attr('height', this._height);
						plotGroup = plotG.selectAll('g')
						.data(rollKeys)
						.join('g')
						.call(g => updateElement(g, plotGroupAttrs))
						plotGroup
							.call(g => addElement(g, 'rect', boxPlotBroderAttrs))
							.call(g => addElement(g, 'g', boxPlotAttrs));
						var plotCharts = rollKeys.map(d => {
							let res = new boxplot(plotG.select(`#${d}`)).enter({
								data: rollData[d],
								func: preRoll,
								width: plot_offset.w,
								height: plot_offset.h,
								label: d
							}).render()
							return res;
						})
							plotG
							.on('wheel', function (e) {
								e.stopPropagation();
								e.preventDefault();
								if (plot_g < rollKeys.length - 1 && plot_g > 0) {
									plot_g += (e.deltaY > 0 ? 1 : -1);
								} else if (plot_g == 0) {
									plot_g += (e.deltaY > 0 ? 1 : 0);
								} else if (plot_g == rollKeys.length - 1) {
									plot_g += (e.deltaY > 0 ? 0 : -1);
								} else {
									return
								}
								const t = d3.transition()
									.duration(300)
									.ease(d3.easeLinear);
								scalePlotY.call(wm);
								plotGroup.transition(t)
									.call(g => updateElement(g, plotGroupAttrs))
							})
							.on('mouseover', function (e) { })
							.on('mouseout', function (e) { });
					}
					function initAttrs() {
						// clearAttrs();
						const textX = boxMargin.left + textMargin.left,
							chartStart = boxMargin.left + textMargin.horizen + textWidth;
						cardAttrs = {
							position: `translate(${[0, 0]})`,
							opacity: opacityCache,
							transform: (d, i) => `translate(${[0, yScale(i) - chartHeight - boxMargin.top - chartMargin / 2]})`,
							rectHeight: d => (barVisObject[d.indexName] ? 2 : 1) * chartHeight + boxMargin.top + boxMargin.bottom + chartMargin * (barVisObject[d.indexName] ? 1 : 0),
							rectWidth: cardWidth,
							lineOpacity: d => barVisObject[d.indexName] ? 'visible' : 'hidden',
							lineStroke: d => d3.color(lc[d.month]).darker(0.5),
							lineY1: chartHeight * 0.3,
							lineStrokeWidth: 1.5,
							indexNameTransform: (d, i) => `translate(${[boxMargin.left + textMargin.left, boxMargin.top / 2]})`,
							indexShadowTransform: `translate(${[boxMargin.left + textMargin.left - 4, boxMargin.top / 2 - 5]})`,
							mergeTransform: `translate(${[chartStart, chartHeight + boxMargin.top + chartMargin + chartPadding.top]})`,
							shapeTransform: `translate(${[chartStart, boxMargin.top]})`,
							mergeWidth: RectWidth,
							mergeHeight: chartHeight - chartPadding.vertical,
							shapeHeight: chartHeight - chartPadding.vertical,
							shapeWidth: RectWidth,
							merge_visible: d => barVisObject[d.indexName] ? 1 : 0
						}
						cardAttrs.lineY2 = cardAttrs.rectHeight;
						sliderAttrs = {
							transform: `translate(${[0 + chartStart, 0]})`
						}
						dragAttrs = {
							transform: d => `translate(${[rectPosition[d], 0]})`,
							dragelementTrans: (d, i) => `translate(${[0, yScale(i)]})`,
							opacity: opacityCache,
							dragHeight: chartHeight,
							dragYlevel: -chartHeight
						}
						iconAttrs = {
							position: `translate(${[0 + chartStart + RectWidth - chartHeight, 0]})`,
							transform: (d, i) => `translate(${[0, yScale(i) - chartHeight - 10 - boxMargin.top - chartMargin / 2]})`,
							opacity: opacityCache,
							elementOpacity: d => barVisObject[d.indexName] ? 'visible' : 'hidden',
							rectTransform: `translate(${[chartHeight / 2, chartHeight / 2]})`,
							rectFill: d => lc[d.month],
							icon: d => barVisObject[d.indexName] ? 'M-5,-2.5l10,0l-5,5l-5,-5zM-5,-2.5z' : 'M-2.5,0l0,-5l5,5l-5,5zM-2.5,0z'
						}
						sortAttrs = {
							transform: d => `translate(${[340 + d * 60, -this._height / 2 + 2.5]})`,
							text: ['Single', 'Indicators', 'Total'],
							sortColor: this._buttonColor,
							sortChange: (value1, value2) => d => d === (this._indexScale !== undefined ? this._indexScale : 0) ? value1 : value2
						},
							switchAttrs = {
								transform: d => `translate(${[160 + 60 * (1 - d), - this._height / 2 + 2.5]})`,
								text: ['Horizon', 'River'],
								color: this._buttonColor,
								colorfunc: (v1, v2) => d => this._horizonView == Boolean(d) ? v1 : v2
							}
						mergeAttrs = {
							transform: (d, i) => `translate(${[(i == 0 ? 0 : rectPosition[i - 1]), 0]})`,
							elementOpacity: (d, i) => barVisObject[d[0][0].indexName] ? opacityCache(d, i) : 0,
							elementTrans: (d, i) => `translate(${[0, yScale(i) + chartHeight]})`,
						}
						Object.assign(mergeAttrs, areaParameter(rectArray, horizenEX))

						horizenAttrs = {
							// transform: (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ] + chartStart, 0]})`,
							elementOpacity: (d, i) => barVisObject[d[0].indexName] ? opacityCache(d, i) : 0,
							elementTrans: (d, i) => `translate(${[0, yScale(i) + chartPadding.top + chartMargin / 2]})`,
							overlap: 3,   //horizen layer
							overlapNum: [-1, -2, -3, 0, 1, 2],
							overHeight: [-3, -2, -1, 1, 2, 3].map(d => d * cardAttrs.mergeHeight),
							elementHeight: cardAttrs.mergeHeight
						}
						horizenAttrs.horizenArea = horizenParameter();
						horizenAttrs.horizenColor = i => ['#e34649', '#f7a8a9', '#fcdcdc', '#f7f7f7', '#fcdcdc', '#f7a8a9', '#e34649'][i + (i >= 0) + horizenAttrs.overlap];
						barAttrs = {
							position: `translate(${[0 + boxMargin.left, chartMargin / 2]})`,
							transform: (d, i) => `translate(${[chartPadding.left, yScale(i) + chartPadding.top]})`,
							opacity: (d, i) => barVisObject[d.indexName] ? opacityCache(d, i) : 0,
							borderHeight: chartHeight - chartPadding.vertical,
							borderWidth: textWidth - chartPadding.horizen
						}
						Object.assign(barAttrs, initBarData())
						barAttrs.border = {
							class: 'border',
							height: barAttrs.borderHeight,
							width: barAttrs.borderWidth,
							stroke: d => lc[d.month],
							fill: 'white',
							'stroke-width': 0.25
						};
						barAttrs.goodSteel = {
							fill: this._flagColor[1],
							x: d => barAttrs.barXscale[d.index](d.x0),
							height: d => barAttrs.barYscale[d.index](d.length),
							width: d => barAttrs.barXscale[d.index](d.x1) - barAttrs.barXscale[d.index](d.x0),
							y: d => barAttrs.borderHeight - barAttrs.barYscale[d.index](d.length),
							opacity: 1
						},
						barAttrs.badSteel = {
							fill: this._flagColor[0],
							x: d => barAttrs.barXscale[d.index](d.x0),
							height: d => barAttrs.barYscale[d.index](d.length),
							width: d => barAttrs.barXscale[d.index](d.x1) - barAttrs.barXscale[d.index](d.x0),
							y: d => barAttrs.borderHeight - barAttrs.barYscale[d.index](d.length),
							opacity: 1
						};
						textAttrs = {
							position: `translate(${[0, 0]})`,
							line0: yScale(0) - chartHeight,
							line1: lastY,
							opacity: (d, i) => opacityCache(d, i),
							transform: (d, i) => `translate(${[mouseInfo ? wm._mouseDis + 30 : 0, yScale(i) + (barVisObject[d.indexName] ? chartHeight / 2 : -chartHeight / 2)]})`,
							text: (d, i) => mouseInfo !== undefined ? (+mouseInfo[i]).toFixed(2) : ''
						}
						heatMapAttrs = {
							position: `translate(${[0 + chartStart, 0]})`,
							transform: (d, i) => `translate(${[i == 0 ? 0 : rectPosition[i - 1], 0]})`,
							opacity: opacityCache,
							elementTrans: (d, i) => `translate(${[0, yScale(i)]})`,
							rectHeight: chartHeight / 2,
							qY: -chartHeight / 2,
							t2Y: -chartHeight
						};
						Object.assign(heatMapAttrs, heatMapParameter(rectArray, horizenEX))

						rectAttrs = {
							transform: (d, i) => `translate(${[0, yScale(i) - chartHeight]})`,
							rectHeight: chartHeight,
							rectWidth: chartHeight,
							opacity: opacityCache
						};
						let baseRadius = 2;
						shapeAttrs = {
							transform: (d, i) => `translate(${[0, yScale(i) - chartHeight / 2]})`,
							batch: batchEX.map(d => arrowData(d.flat())),
							elementOpacity: opacityCache,
							elementTrans: d => `translate(${[mergeAttrs.translateX[d.i](d.time) - 0.75 * baseRadius, 0 - 0.75 * baseRadius]})`,
							arrowTrans: d => `translate(${[mergeAttrs.translateX[d.i](d.time), 0]})`,
							interArrow: d => `translate(${[(mergeAttrs.translateX[d[0].i](d[0].time) + mergeAttrs.translateX[d[d.length - 1].i](d[d.length - 1].time)) / 2, 0]})`,
							startRibbon: d => `translate(${[mergeAttrs.translateX[d[0].i](d[0].time), 0]})`,
							endRibbon: d => `translate(${[mergeAttrs.translateX[d[d.length - 1].i](d[d.length - 1].time), 0]})`,
							interLineTrans: d => `translate(${[mergeAttrs.translateX[d[0].i](d[0].time), 0 - 0.75 * baseRadius]})`,
							interLen: d => mergeAttrs.translateX[d[d.length - 1].i](d[d.length - 1].time) - mergeAttrs.translateX[d[0].i](d[0].time)
						}
						console.log(batchEX)
						console.log(shapeAttrs.batch)
						const arrowScale = d3.scaleLinear().domain([-3, 3]).range([10, -10]);
						shapeAttrs.multiAttrs = {	//multivariate
							fill: 'green',//util.delabelColor[0],//mergeColor[0],
							stroke: 'none',
							height: baseRadius * 1.25,
							transform: shapeAttrs.elementTrans,
							width: baseRadius * 1.25
						},
							shapeAttrs.singleAttrs = {
								transform: shapeAttrs.arrowTrans,
								stroke: mergeColor[0],
								fill: 'none',
								'marker-end': 'url(#shape-arrow)',
								d: e => d3.linkVertical().x(d => d.x).y(d => d.y)({ source: { x: 0, y: e.ovrage ? (e.range > 0 ? -baseRadius : baseRadius) : 0 }, target: { x: 0, y: arrowScale(e.range) } })
							}

						symbolAttrs = {
							position: `translate(${[0 + boxMargin.left, - chartHeight - chartMargin / 2]})`,
							transform: (d, i) => `translate(${[chartPadding.left + textWidth, yScale(i)]})`,
							opacity: opacityCache,
							borderHeight: chartHeight - chartPadding.vertical,
							borderWidth: textWidth - chartPadding.horizen,
							borderStroke: (d, i) => lc[dataInfo[i].month],
							rectHeight: chartHeight / 4,
							singleNum: d3.map(batchEX, d => d.flat().filter(e => e.dia_Status).length),
							multiNum: d3.map(batchEX, d => d.flat().filter(e => e.ovrage).length)
						}
						let position = [5, (chartHeight - chartPadding.vertical) / 2 + 5],
							singleScale = d3.scaleLinear().domain([0, d3.max(symbolAttrs.singleNum)]).range([0, symbolAttrs.borderWidth / 2]),
							multiScale = d3.scaleLinear().domain([0, d3.max(symbolAttrs.multiNum)]).range([0, symbolAttrs.borderWidth / 2]),
							siTransform = (d, i) => `translate(${[-singleScale(symbolAttrs.singleNum[i]), position[1 - wm._indexScale]]})`,
							muTransform = (d, i) => `translate(${[- multiScale(symbolAttrs.multiNum[i]), position[wm._indexScale]]})`,
							rectColor = wm._indexScale === 0 ? [util.delabelColor[0], 'url(#sort_pattern)'] : ['url(#sort_pattern)', util.delabelColor[0]];
						if (wm._indexScale === 2) {
							siTransform = (d, i) => `translate(${[-symbolAttrs.borderWidth / 2 - singleScale(symbolAttrs.singleNum[i]), d3.mean(position)]})`;
							muTransform = (d, i) => `translate(${[-symbolAttrs.borderWidth / 2, d3.mean(position)]})`;
							rectColor = ['url(#sort_pattern)', 'url(#sort_pattern)'];
						}
						symbolAttrs.sIndice = {	//singleIndice
							transform: siTransform,
							class: 'single',
							width: (d, i) => singleScale(symbolAttrs.singleNum[i]),
							height: symbolAttrs.rectHeight,
							fill: rectColor[0],	//util.delabelColor[0]
							stroke: 'none'
						},
						symbolAttrs.sText = {	//singleIndice
							x: -10,
							class: 'singleText',
							y: position[1 - wm._indexScale] + 9,
							text: (d, i) => symbolAttrs.singleNum[i],
							fill: 'rgb(142, 154, 164)',
							'font-weight': 'normal',
							'font-style': 'normal',
							'font-size': 11,
							'text-anchor': 'middle'
						},
						symbolAttrs.mIndice = {	//multivariateAttrs
							transform: muTransform,
							class: 'multivariate',
							width: (d, i) => multiScale(symbolAttrs.multiNum[i]),
							height: symbolAttrs.rectHeight,
							fill: rectColor[1],
							stroke: 'none'
						},
						symbolAttrs.mText = {	//multivariateAttrs
							// transform: muTransform,
							x: -10,
							class: 'multiText',
							y: position[wm._indexScale] + 9,
							text: (d, i) => symbolAttrs.multiNum[i],
							fill: 'rgb(142, 154, 164)',
							'font-weight': 'normal',
							'font-style': 'normal',
							'font-size': 11,
							'text-anchor': 'middle'
						};
						// const 
						// symbolAttrs.scale = {

						// }
						// const yScale = d3.scaleBand()
						//         .domain(target.map(d => targetMap[d].name))
						//         .range([0, width - headHeight])
						//         .padding(0.35);
						//       const yAxis = d3.axisLeft(yScale)
						//         .tickSizeOuter(0);
					}

					function initBackG() {
						mainG.on('wheel', function (e) {
							e.stopPropagation();
							e.preventDefault();
							if (merge_g < dataInfo.length - 1 && merge_g > 0) {
								merge_g += (e.deltaY > 0 ? 1 : -1);
							} else if (merge_g == 0) {
								merge_g += (e.deltaY > 0 ? 1 : 0);
							} else if (merge_g == dataInfo.length - 1) {
								merge_g += (e.deltaY > 0 ? 0 : -1);
							} else {
								return
							}
							renderyScale();
							renderSort();
							wm._filter_status ? wm._renderWheelFilter() : undefined
						})
							.on('mouseover', function (e) { })
							.on('mouseout', function (e) { });

						initSymbolDefs();
						initArrow();
					}
					function initSymbolDefs() {
						mainG.call(g => g.append('defs')
							.append('pattern')
							.attr('id', 'sort_pattern')
							.attr('patternUnits', 'userSpaceOnUse')
							.attr('patternTransform', 'rotate(45)')
							.attr('width', 5)
							.attr('height', 5)
							.call(g => g.append('rect')
								.attr('width', 5)
								.attr('height', 5)
								.attr('fill', util.delabelColor[0]))
							.call(g => g.append('line')
								.attr('x1', 0)
								.attr('x2', 0)
								.attr('y1', 0)
								.attr('y2', 5)
								.attr('stroke', 'white')
								.attr('stroke-width', 4)
								.attr('stroke-opacity', 1)
								.attr('fill', util.delabelColor[0])))
					}
					function initArrow() {
						const markerBoxWidth = 5;
						const markerBoxHeight = 5;
						const refX = markerBoxWidth / 2;
						const refY = markerBoxHeight / 2;
						const markerWidth = markerBoxWidth / 2;
						const markerHeight = markerBoxHeight / 2;
						const arrowPoints = [[0, 0], [0, 5], [5, 2.5]];
						// const markerBoxWidth = 4,
						//   markerBoxHeight = 4,
						//   refX = markerBoxWidth / 2,
						//   refY = markerBoxHeight / 2,
						//   arrowPoints = [[0, 0], [0, markerBoxHeight], [markerBoxWidth, refY]];
						mainG.call(g => g.append('defs')
							.append('marker')
							.attr('id', 'shape-arrow')
							.attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
							.attr('refX', refX)
							.attr('refY', refY)
							.attr('markerWidth', markerBoxWidth)
							.attr('markerHeight', markerBoxHeight)
							.attr('orient', 'auto-start-reverse')
							.append('path')
							.attr('d', d3.line()(arrowPoints))
							.attr('fill', util.labelColor[0])
							.attr('stroke', mergeColor[0]))
					}
					function initOrdinal() {
						//     totalSort = d3.map(d3.sort(dataInfo, d => -d.precipitation), d => d.indexName),
						//     totalArray = d3.map(indexSort, d => totalSort.indexOf(d));
						// var scaleArray = [d3.scaleOrdinal().domain(indexArray).range(sortArray), d3.scaleOrdinal().domain(indexArray).range(sortArray), d3.scaleOrdinal().domain(indexArray).range(totalArray)];
						var timeArray = this._batchData.map(d => d[0].toc),
							batchIndex;
						for (let item in timeArray) {
							if (timeArray[item] >= vm.steeltoc) {
								batchIndex = item
								break
							}
						}
						var singleNum = d3.map(batchEX, (d, i) => [d.flat().filter(e => e.ovrage).length, i]);
						singleNum.sort((a, b) => b[0] - a[0]);
						singleNum.forEach((d, i) => {
							d[0] = i;
						});
						singleNum.sort((a, b) => a[1] - b[1]);
						var multiNum = d3.map(batchEX, (d, i) => [d.flat().filter(e => e.dia_Status).length, i]);
						multiNum.sort((a, b) => b[0] - a[0]);
						multiNum.forEach((d, i) => {
							d[0] = i;
						});
						multiNum.sort((a, b) => a[1] - b[1]);
						var selfBatch = horizenEX[batchIndex];
						// var oversort = d3.map(d3.sort(selfBatch, d => -d3.mean(d, e => e.over)), d => d[0].indexName),
						// 		overArray = d3.map(indexSort, d => oversort.indexOf(d)),
						// 		Qsort = d3.map(d3.sort(selfBatch, d => -d3.mean(d, e => e.Q)), d => d[0].indexName),
						// 		QArray = d3.map(indexSort, d => Qsort.indexOf(d));
						var T2sort = d3.map(d3.sort(selfBatch, d => -d3.mean(d, e => e.T2)), d => d[0].indexName),
							T2Array = d3.map(indexSort, d => T2sort.indexOf(d));

						scaleArray = [
							d3.scaleOrdinal().domain(indexArray).range(singleNum.map(d => d[0])),
							d3.scaleOrdinal().domain(indexArray).range(multiNum.map(d => d[0])),
							d3.scaleOrdinal().domain(indexArray).range(T2Array)
						];
						indexScale = this._indexScale !== undefined ? scaleArray[this._indexScale] : scaleArray[0];
					}
					function renderyScale() {
						let invert = d3.scaleOrdinal().domain(indexScale.range()).range(indexScale.domain())
						rectHeight = indexArray.map((d, i) => (barVisObject[indexSort[invert(+d)]] ? 2 : 1) * chartHeight + boxMargin.vertical + cardMargin)
						// console.log(rectHeight)
						rectHeight.unshift(0)   //定位第一个元素
						yScaleCache = Array.from(d3.cumsum(rectHeight)).map(d => -wm._height / 2 + wm._margin.top + chartHeight + d);
						rectNum = yScaleCache.filter(d => d < wm._height / 2 - wm._margin.bottom).length;
						opacityCache = (d, i) => merge_g <= indexScale(i) && indexScale(i) < rectNum + merge_g ? 1 : 0;
						var baseHeight = yScaleCache[0] - yScaleCache[merge_g];
						yScale = i => yScaleCache[indexScale(i)] + baseHeight;
						lastY = wm._height / 2 - chartHeight;
						initAttrs.call(wm);
					}
					function initTriangleG() {// init triangleG
						triangleG.attr('transform', iconAttrs.position)
							.selectAll('g')
							.data(dataInfo)
							.join('g')
							.attr('class', 'iconElement')
							.attr('opacity', iconAttrs.opacity)
							.attr('transform', iconAttrs.transform)
							.call(g => g.append('circle').attr('transform', 'translate(10, 10)')
								.attr('fill', 'white')
								.attr('stroke', 'black')
								.attr('stroke-width', 0.25)
								.attr('filter', 'url(#card-shadow)')
								.attr('r', 10))
							.call(g => g.append('g').attr('transform', 'scale(0.02)')
								.call(g => g.append('path').attr('d', queryIcon[0]).attr('fill', '#0B72B6'))
								.call(g => g.append('path').attr('d', queryIcon[1]).attr('fill', '#0B72B6')))
							.on('click', function (e, d) {
								const t = d3.transition()
									.duration(300)
									.ease(d3.easeLinear);
								barVisObject[d.indexName] = !barVisObject[d.indexName];
								renderyScale();
								renderSort();
							})
					}
					function initCardG() {
						cardG
							.attr('transform', cardAttrs.position)
							.selectAll('g').data(dataInfo).join('g')
							.attr('opacity', cardAttrs.opacity)
							.attr('transform', cardAttrs.transform)
							.call(g => g.append('rect')
								.attr('class', 'outer')
								.attr('height', cardAttrs.rectHeight)
								.attr('width', cardAttrs.rectWidth)
								.attr('stroke', this._borderStyle.color)
								.attr('filter', 'url(#card-shadow)')
								.attr('stroke-width', 0.25)
								.attr('rx', this._borderStyle.rx)
								.attr('ry', this._borderStyle.ry)
								.attr('fill', 'none'))
							.call(g => g.append('line')	//粗线
								.attr('visibility', cardAttrs.lineOpacity)
								.attr('y1', cardAttrs.lineY1)
								.attr('y2', cardAttrs.lineY2)
								.attr('stroke', cardAttrs.lineStroke)
								.attr('stroke-width', cardAttrs.lineStrokeWidth))
							// .call(g => g.append('line')
							// 	.attr('x1', 0.25)
							// 	.attr('y1', chartHeight + boxMargin.top + chartMargin/2)
							// 	.attr('y2', chartHeight + boxMargin.top + chartMargin/2)
							// 	.attr('x2', cardAttrs.rectWidth - 0.25)
							// 	.attr('stroke-width', 0.25)
							// 	.attr('stroke', this._borderStyle.color))
							.call(g => g.append('rect')
								.attr('class', 'shapeCard')
								.attr('transform', cardAttrs.shapeTransform)
								.attr('height', cardAttrs.shapeHeight)
								.attr('width', cardAttrs.shapeWidth)
								.attr('stroke', this._borderStyle.color)
								.attr('stroke-width', 0.25)
								.attr('fill', 'none'))
							.call(g => g.append('rect')
								.attr('class', 'mergeCard')
								.attr('opacity', cardAttrs.merge_visible)
								.attr('transform', cardAttrs.mergeTransform)
								.attr('height', cardAttrs.mergeHeight)
								.attr('width', cardAttrs.mergeWidth)
								.attr('stroke', this._borderStyle.color)
								.attr('stroke-width', 0.25)
								.attr('fill', 'none'))
							.call(g => g.append('rect')
								.attr('height', 5)
								.attr('width', d => d.indexName.length * 6.3 + 12)
								.attr('transform', cardAttrs.indexShadowTransform)
								.attr('fill', 'white')
							)
							.call(g => g.append('text')
								.attr('class', 'cardName')
								.attr('transform', cardAttrs.indexNameTransform)
								.text(d => d.indexName)
								.attr('text-anchor', 'start')
								.attr('fill', d => d3.color(lc[d.month]).darker(1)))
						// .on('mouseover', (e, d) => {
						//   this._overed(e, d.indexName, d.month)
						// })
						// .on('mouseout', (e, d) => {
						//   this._outed(e, d.indexName, d.month)
						// })
					}
					function updateCardG(t) {
						cardG
							.transition(t)
							.call(g => g.selectAll('g').attr('opacity', cardAttrs.opacity).attr('transform', cardAttrs.transform))
							.call(g => g.selectAll('.outer').attr('height', cardAttrs.rectHeight))
							.call(g => g.selectAll('line').attr('y2', cardAttrs.lineY2))
						// console.log('mergeCard', cardG.selectAll('.mergeCard'))
						// console.log('mergeCard', cardG)
						mainG.transition(t).selectAll('.mergeCard').attr('opacity', cardAttrs.merge_visible).attr('transform', cardAttrs.mergeTransform)
					}
					function initDragG() {
						dragG.selectAll('dragGroup')
							.data(Object.keys(rectPosition).slice(0, -1)).join('g')
							.attr('class', 'dragGroup')
							.attr('transform', dragAttrs.transform)
							.call(g => g
								.call(g => g.selectAll('g')
									.data(dataInfo)
									.join('g')
									.attr('class', 'dragElement')
									.attr('opacity', dragAttrs.opacity)
									.attr('transform', dragAttrs.dragelementTrans)
									.call(g => g.append('line')
										.attr('y1', chartMargin / 2 + chartPadding.top)
										.attr('stroke', '#d4dade')
										.attr('class', 'mergeDrag')
										.attr('opacity', cardAttrs.merge_visible)
										.attr('stroke-width', 2)
										.attr('y2', dragAttrs.dragHeight - chartPadding.bottom)
										.attr('stroke-dasharray', '6 6'))
									.call(g => g.append('line')
										.attr('y1', -dragAttrs.dragHeight)
										.attr('stroke', '#d4dade')
										.attr('stroke-width', 2)
										.attr('y2', -chartMargin / 2)
										.attr('stroke-dasharray', '6 6'))
									.call(g => g.append('rect')
										.attr('width', 3)
										.attr('x', -1.5)
										.attr('fill', 'white')
										.attr('y', dragAttrs.dragYlevel)
										.attr('height', dragAttrs.dragHeight)
										.attr('opacity', 0)))
								.call(d3.drag()
									.on('drag', dragMove)
								))
					}
					function dragMove(e, d) {    //update batch
						rectPosition[d] = e.x
						rectPosition = Array.from(rectPosition);
						rectPosition.unshift(0);
						var rectlength = d3.pairs(rectPosition, (a, b) => b - a).filter((d, i) => i + 1 !== Math.ceil(maxLength / 2));
						if (!rectlength.every(d => d > chartHeight - 5)) {   //RectWidth/ maxLength/2
							minRect = chartHeight
						} else {
							minRect = (minRect == d3.min(rectlength)) ? d3.max(rectlength) : d3.min(rectlength);
						}
						if (RectWidth - (maxLength - 1) * minRect < RectWidth / maxLength) minRect = (RectWidth - RectWidth / maxLength) / (maxLength - 1)
						rectArray = new Array(maxLength).fill(minRect).map((d, i) => Math.ceil(maxLength / 2) == i + 1 ? RectWidth - (maxLength - 1) * minRect : d);
						rectPosition = d3.cumsum(rectArray)
						dragG.selectAll('.dragGroup')
							// .transition(d3.transition()
							//     .duration(200)
							//     .ease(d3.easeLinear))
							.attr('transform', d => `translate(${[rectPosition[d], 0]})`)
						initAttrs.call(wm);
						updateArea();
						updateShape();
						renderAxisG(timeScale);
						minRect !== chartHeight ? rectG.selectAll('g').remove() : initRectG();
					}
					function initSort() {//init sortG
						sortG.selectAll('g')
							.data([0, 1, 2])
							.join('g')
							.attr('transform', sortAttrs.transform)
							.call(g => g.append('rect')
								.attr('fill', sortAttrs.sortChange(sortAttrs.sortColor, '#fff'))
								.attr('rx', 5)
								.attr('ry', 5)
								.attr('stroke', sortAttrs.sortColor)
								.attr('stroke-width', 0.5)
								.attr('height', this._buttonStyle.height)
								.attr('width', this._buttonStyle.width))
							.call(g => g.append('text')
								.attr('fill', sortAttrs.sortChange('#fff', sortAttrs.sortColor))
								.attr('x', this._buttonStyle.textX)
								.attr('y', this._buttonStyle.textY)
								.text(d => sortAttrs.text[d]))
							.on('click', (e, d) => {
								// merge_g = 0; //when sort indexes, save merge_g status or not
								indexScale = scaleArray[d];
								this._indexScale = d;
								renderyScale()
								renderSort()
							})
					}
					function mouseText(dis) {// calculate abscissa
						let sumsearch = d3.leastIndex(rectPosition, d => dis > d),
							indexsearch = sumsearch === 0 ? dis : dis - rectPosition[sumsearch],
							mouseDate = new Date(timeScale[sumsearch].invert(indexsearch)),
							selectDate = horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time).time),
							mouseInfo = horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time)[wm._horizonView ? 'ovalue' : 'ovalue']);
						// sumsearch, upid, indexName
						// console.log(horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time)['value']))
						wm._upid = horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time))[0].upid;
						// if(wm._horizonView){
						//     sliderG.selectAll('circle').attr('r', 2)
						//     sliderG.selectAll('circle').attr('r', d => d.time.toString() !== selectDate[0].toString() ? 2 : 3.5)
						// }
						return mouseInfo
					}
					function renderSort() {//render sortG
						const t = d3.transition()
							.duration(300)
							.ease(d3.easeLinear);
						shapeGroup.selectAll('.shapeElement')
							.transition(t)
							.attr('transform', shapeAttrs.transform)
							.attr('opacity', shapeAttrs.elementOpacity)
						updateCardG(t);
						updateSymbol(t);
						mergeG
							.transition(t)
							.call(g => g.selectAll('.batchElement')
								.attr('opacity', mergeAttrs.elementOpacity)
								.attr('transform', mergeAttrs.elementTrans))
						horizenG
							.transition(t)
							.call(g => g.selectAll('.horizenElement')
								.attr('opacity', horizenAttrs.elementOpacity)
								.attr('transform', horizenAttrs.elementTrans))
						dragG.transition(t)
							.call(g => g.selectAll('.dragElement')
								.attr('opacity', dragAttrs.opacity)
								.attr('transform', dragAttrs.dragelementTrans))
							.call(g => g.selectAll('.mergeDrag')
								.attr('opacity', cardAttrs.merge_visible))
						rectG.selectAll('.rectElement')
							.transition(t)
							.attr('transform', rectAttrs.transform)
							.attr('opacity', rectAttrs.opacity)
						barG.selectAll('g')
							.transition(t)
							.attr('opacity', barAttrs.opacity)
							.attr('transform', barAttrs.transform)
						sortG
							.transition(t)
							.call(g => g.selectAll('rect').attr('fill', sortAttrs.sortChange(sortAttrs.sortColor, '#fff')))
							.call(g => g.selectAll('text').attr('fill', sortAttrs.sortChange('#fff', sortAttrs.sortColor)))
						triangleG
							.transition(t)
							.call(g => g.selectAll('.iconElement').attr('transform', iconAttrs.transform).attr('opacity', iconAttrs.opacity))
						textG
							.transition(t)
							.call(g => g.selectAll('text').attr('opacity', textAttrs.opacity).attr('transform', textAttrs.transform))
						textG.select('.mouseG').raise()
						textG.raise()
						if (wm._mouseDis !== undefined) {
							var mouseInfo = mouseText(wm._mouseDis);
							textG.selectAll('text')
								.transition(t)
								.text((d, i) => (+mouseInfo[i]).toFixed(2))
						}
						// heatMapG.selectAll('.heatMapElement')
						//   .transition(t)
						//   .attr('opacity', heatMapAttrs.opacity)
						//   .attr('class', 'heatMapElement')
						//   .attr('transform', heatMapAttrs.elementTrans)
						barG.raise()
						dragG.raise()
						cardG.raise()
						triangleG.raise()
					}
					function renderShape() {
						const t = d3.transition()
							.duration(300)
							.ease(d3.easeLinear);
						dragG.selectAll('.dragGroup')
							.transition(t)
							.call(g => g.selectAll('rect').attr('y', dragAttrs.dragYlevel).attr('height', dragAttrs.dragHeight))
							.call(g => g.selectAll('.dragElement')
								.attr('opacity', dragAttrs.opacity)
								.attr('transform', dragAttrs.dragelementTrans))
						if (wm._horizonView) {
							mergeG.selectAll('.batchElement')
								.transition(t)
								.attr('opacity', mergeAttrs.elementOpacity)
								.attr('transform', mergeAttrs.elementTrans)
								.call(g => g.selectAll('.path4').attr('d', mergeAttrs.mergeArea[4]))
								.call(g => g.selectAll('.path3').attr('d', mergeAttrs.mergeArea[3]))
								.call(g => g.selectAll('.path2').attr('d', mergeAttrs.mergeArea[2]))
								.call(g => g.selectAll('.path1').attr('d', mergeAttrs.mergeArea[1]))
								.call(g => g.selectAll('.path0').attr('d', mergeAttrs.mergeArea[0]))
								.call(g => g.selectAll('.line').attr('d', mergeAttrs.mergeLine))
								.call(g => g.selectAll('circle').attr('transform', mergeAttrs.mergeLocation))
						} else {
							horizenG.selectAll('.horizenElement')
								.transition(t)
								.call(g => g.selectAll('path').attr('d', horizenAttrs.horizenArea))
								.call(g => g.selectAll('.clipRect').attr('height', horizenAttrs.elementHeight))
								.call(g => g.selectAll('use').attr('transform', (d, i) => `translate(0,${(horizenAttrs.overlapNum[i] + 1) * (horizenAttrs.elementHeight)})`))
						}
						updateBarG(t)
						textG
							.transition(t)
							.call(g => g.select('line').attr('y1', textAttrs.line0).attr('y2', textAttrs.line1)
								.attr('transform', (d, i) => `translate(${[mouseInfo ? wm._mouseDis : 0, 0]})`))
						// initMapArea()
					}
					function initSwitch() { //init switchG
						switchG.selectAll('g').data([1, 0]).join('g')
							.attr('transform', switchAttrs.transform)//280  - 100
							.call(g => g.append('rect')
								.attr('fill', switchAttrs.colorfunc(switchAttrs.color, '#fff'))
								.attr('rx', 5)
								.attr('ry', 5)
								.attr('stroke', switchAttrs.color)
								.attr('stroke-width', 0.5)
								.attr('height', this._buttonStyle.height)
								.attr('width', this._buttonStyle.width))
							.call(g => g.append('text')
								.attr('fill', switchAttrs.colorfunc('#fff', switchAttrs.color))
								.attr('x', this._buttonStyle.textX)
								.attr('y', this._buttonStyle.textY)
								.text(d => switchAttrs.text[d]))
							.on('click', (e, d) => {
								if (wm._horizonView !== Boolean(d)) {
									wm._horizonView = Boolean(d);
									let t = d3.transition()
										.duration(300)
										.ease(d3.easeLinear);
									switchG.selectAll('rect')
										.transition(t)
										.attr('fill', switchAttrs.colorfunc(switchAttrs.color, '#fff'));
									switchG.selectAll('text')
										.transition(t)
										.attr('fill', switchAttrs.colorfunc('#fff', switchAttrs.color));
									if (wm._horizonView) {
										horizenG.selectAll('.horizenElement').remove();
										initMergeArea()
									} else {
										mergeG.selectAll('.batchElement').remove();
										initHorizenArea()
									}
								}
							})
					}
					function initVisG() {
						visG
							.attr('transform', `translate(${[280, - this._height / 2 + 2.5]})`)
						visG.append('rect')
							.attr('fill', this._barVis ? switchAttrs.color : 'white')
							.attr('rx', 5)
							.attr('ry', 5)
							.attr('stroke', switchAttrs.color)
							.attr('stroke-width', 0.5)
							.attr('height', this._buttonStyle.height)
							.attr('width', this._buttonStyle.width)
						visG.append('text')
							.attr('fill', this._barVis ? 'white' : switchAttrs.color)
							.attr('x', this._buttonStyle.textX)
							.attr('y', this._buttonStyle.textY)
							.text('vis')
						visG.on('click', function (e, d) {
							wm._barVis = !wm._barVis;
							d3.select(this).select('rect').attr('fill', wm._barVis ? switchAttrs.color : 'white')
							d3.select(this).select('text').attr('fill', wm._barVis ? 'white' : switchAttrs.color)
							barVisObject = Object.assign({}, ...dataInfo.map(d => { return { [d.indexName]: wm._barVis } }))
							renderyScale();
							renderSort();
						})
					}
					function initAxisG(batchTimeScale) { //init timeTick
						sliderG.selectAll('.axisG').data(rectPosition)
							.join('g')
							.attr('class', 'axisG')
							.attr('transform', (d, i) => `translate(${[i == 0 ? 0 : rectPosition[i - 1], lastY]})`)
							.call(g => g
								.style('font', '6px')
								.style('font-weight', 'normal')
								.style('color', 'grey')
								.each(function (d, i) {
									d3.select(this)
										.call(d3.axisBottom(batchTimeScale[i])
											.ticks(rectArray[i] < 60 ? 1 : 3)
											.tickFormat((d, i) => i === 0 ? d3.timeFormat('%d %H:%M')(d) : d3.timeFormat('%d %H:%M')(d))
											.tickSize(2)
											.tickPadding(2.5)
										)
								})
							)
							// .call(g => g.select('.domain').remove()))
							.call(g => g.selectAll('text')
								.attr('transform', 'translate(0, 12)rotate(45)'))
					}
					function initBarG() {  //init BarG
						barG
							.attr('transform', barAttrs.position)
							.selectAll('g').data(dataInfo).join('g')
							.attr('opacity', barAttrs.opacity)
							.attr('transform', barAttrs.transform)
							.call(g => addElement(g, 'rect', barAttrs.border))
							.call(g => g.selectAll('.goodSteel')
								.data((d, i) => barAttrs.barGoodData[i])
								.join('rect')
								.attr('class', 'goodSteel')
								.call(g => updateElement(g, barAttrs.goodSteel)))
							.call(g => g.selectAll('.badSteel')
								.data((d, i) => barAttrs.barBadData[i])
								.join('rect')
								.attr('class', 'badSteel')
								.call(g => updateElement(g, barAttrs.badSteel)))
							.on('click', clickScale)
					}
					function updateBarG(t) {
						barG
							.transition(t)
							.attr('transform', barAttrs.position)
							.call(g => updateElement(g.selectAll('.border'), barAttrs.border))
							.call(g => updateElement(g.selectAll('.goodSteel'), barAttrs.goodSteel))
							.call(g => updateElement(g.selectAll('.badSteel'), barAttrs.badSteel))
					}
					function initBarData() {
						const barValue = dataInfo.map((d, i) => horizenEX.map(e => e[i]).flat()),
							barData = barValue.map((d, i) => d3.bin().thresholds(30)(d.map(e => e.value)).map(e => { e.index = i; return e })),
							barYscale = barData.map(d => d3.scaleLinear().domain([0, d3.max(d, f => f.length) * 1.1]).range([0, barAttrs.borderHeight])),
							barXscale = barData.map(d => d3.scaleLinear().domain([d3.min(d, f => f.x0), d3.max(d, f => f.x1)]).range([0, barAttrs.borderWidth])),
							barGoodData = barValue.map((d, i) => d3.bin().thresholds(30)((d.filter(e => e.flag == 1)).map(e => e.value)).map(e => { e.index = i; return e })),
							barBadData = barValue.map((d, i) => d3.bin().thresholds(30)((d.filter(e => e.flag == 0)).map(e => e.value)).map(e => { e.index = i; return e }));
						return {
							barValue, barYscale, barXscale, barGoodData, barBadData, barData
						}
					}
					function initMouseG() {
						textG
							.attr('transform', textAttrs.position)
							.append('line')
							.attr('class', 'mouseG')
							.attr('y1', textAttrs.line0)
							.attr('y2', textAttrs.line1)
							.attr('transform', (d, i) => `translate(${[mouseInfo ? wm._mouseDis : 0, 0]})`)
							.attr('stroke', mouseInfo !== undefined ? '#bbbcbd' : 'none')
							.attr('stroke-width', 0.25)
						textG.selectAll('text').data(dataInfo).join('text')
							.attr('opacity', textAttrs.opacity)
							.attr('transform', textAttrs.transform)
							.text(textAttrs.text)
							.attr('fill', 'black')
						sliderG.on('mousemove', (e, d) => {
							let x = d3.pointer(e)[0];//mouse distance
							if (x <= 0) return
							textG.select('.mouseG').attr('transform', (d, i) => `translate(${[x, 0]})`).attr('stroke', '#bbbcbd')
							let upid = wm._upid;
							mouseInfo = mouseText(x);
							if (upid !== wm._upid) {
								vm.$emit('wheelMouse', { upid: [upid], mouse: 1 });
								vm.$emit('wheelMouse', { upid: [wm._upid], mouse: 0 });
							}
							wm._mouseDis = x;
							textG.selectAll('text').attr('transform', textAttrs.transform).text(textAttrs.text)
						})
						.on('mouseleave', (e, d) => {
							vm.$emit('wheelMouse', { upid: [wm._upid], mouse: 1 });
						})
						.on('click', (e, d) => {
							let x = d3.pointer(e)[0];
							if (x <= 0) return;
							iconG
								.attr('transform', `translate(${[x, 0]})`)
								.attr('display', 'block');
							// let upid = wm._upid;
							// mouseInfo = mouseText(x);
							// if (upid !== wm._upid) {
							//   vm.$emit('wheelMouse', { upid: [upid], mouse: 1 });
							//   vm.$emit('wheelMouse', { upid: [wm._upid], mouse: 0 });
							// }
							// wm._mouseDis = x;
							// textG.selectAll('text').attr('transform', textAttrs.transform).text(textAttrs.text)
						})
						console.log(textG.selectAll('text'))
					}
					function initRectG() {
						rectG
							.attr('transform', sliderAttrs.transform)
							.selectAll('.rectG').data(Object.keys(rectPosition).filter((d, i) => i !== Math.ceil(maxLength / 2) - 1))
							.join('g')
							.attr('transform', d => `translate(${[d == 0 ? 0 : rectPosition[+d - 1], 0]})`)
							.attr('class', 'rectG')
							.call(g => g.selectAll('g')
								.data(d => horizenEX[+d])
								.join('g')
								.attr('class', 'rectElement')
								.attr('opacity', rectAttrs.opacity)
								.attr('transform', rectAttrs.transform)
								.call(g => g.append('rect')
									.attr('height', rectAttrs.rectHeight)
									.attr('width', rectAttrs.rectWidth)
									.attr('fill', 'white'))
								.call(g => g.append('rect')
									.attr('x', 2)
									.attr('y', 2)
									.attr('height', rectAttrs.rectHeight - 4)
									.attr('width', rectAttrs.rectWidth - 4)
									.attr('fill', d => wm._horizonColor(d))
									.attr('stroke', function (d) {
										return d3.color(d3.select(this).attr('fill')).darker(0.5)
									})
									.on('mousemove', (e, d) => {
										e.stopPropagation()
									}))
								.call(g => g.append('polygon')
									.attr('transform', `translate(${[rectAttrs.rectWidth / 2, rectAttrs.rectHeight / 2]})`)
									.attr('points', d => wm._horizonPoint(d, rectAttrs.rectWidth / 2, true))
									.attr('fill', '#c65b24')
									.attr('opacity', 0.6)
									.attr('stroke', '#c65b24'))
								.call(g => g.append('polygon')
									.attr('transform', `translate(${[rectAttrs.rectWidth / 2, rectAttrs.rectHeight / 2]})`)
									.attr('points', d => wm._horizonPoint(d, rectAttrs.rectWidth / 2, false))
									.attr('fill', '#c65b24')
									.attr('opacity', 0.6)
									.attr('stroke', '#c65b24')))
						rectG.raise()
					}
					function infoArea(arr, index, flag) {// barG bin distribute
						let data = horizenEX.map(d => d[index]).flat().map(d => d.value),
							bin = d3.bin().thresholds(15)(data),
							y = d3.scaleLinear().domain([bin[0].x0, bin[bin.length - 1].x1]).range([2, chartHeight - 2]),
							bin2 = d3.bin().thresholds(15)(horizenEX.slice(Math.ceil(maxLength / 2) - 1, Math.ceil(maxLength / 2)).map(d => d[index]).flat().map(d => d.value)),
							x = d3.scaleLinear().domain([0, d3.max(bin, d => d.length)]).range([0, chartHeight - 2]),
							area = d3.area()
								.x0(d => chartHeight - 2 - x(d.length))
								.x1(chartHeight)
								.y(d => y((d.x0 + d.x1) / 2));
						return flag ? area(bin) : area(bin2)
					}
					function renderAxisG(batchTimeScale) {// render timeTick
						sliderG.selectAll('.axisG')
							.transition(d3.transition()
								.duration(200)
								.ease(d3.easeLinear))
							.attr('transform', (d, i) => `translate(${[i == 0 ? 0 : rectPosition[i - 1], lastY]})`)
							.each(function (d, i) {
								d3.select(this)
									.call(d3.axisBottom(batchTimeScale[i])
										.ticks(rectArray[i] < 60 ? 1 : 3)
										.tickFormat((d, i) => i === 0 ? d3.timeFormat('%d %H:%M')(d) : d3.timeFormat('%d %H:%M')(d))
										.tickSize(2)
										.tickPadding(2.5)
									)
							})
							.call(g => g.selectAll('text')
								.attr('transform', 'translate(0, 12)rotate(45)'))
					}
					function updateArea() {
						if (wm._horizonView) {
							mergeG.selectAll('.batchElement')
								.transition(d3.transition().duration(200).ease(d3.easeLinear))
								.attr('transform', mergeAttrs.elementTrans)
								.call(g => g.selectAll('.path0').attr('d', mergeAttrs.mergeArea[0]))
								.call(g => g.selectAll('.line').attr('d', mergeAttrs.mergeLine))
								.call(g => g.selectAll('circle').attr('transform', mergeAttrs.mergeLocation));
						} else {
							horizenG.selectAll('.horizenElement')
								.transition(d3.transition()
									.duration(150)
									.ease(d3.easeLinear))
								.call(g => g.selectAll('path').attr('d', horizenAttrs.horizenArea))
						}
					}
					function initLinearGradient() {
						gradientG.selectAll('g')
							.data(batchEX)
							.join('g')
							.call(g => g.append('linearGradient')
								.attr('id', (d, i) => `price-gradient${i}`)
								.attr('gradientUnits', 'userSpaceOnUse')
								.attr('x1', '0%')
								.attr('x2', '100%')
								.selectAll('stop').data(d => { return offsetParameter(d); }).enter()
								.append('stop')
								.attr('offset', d => d.offset)
								.attr('stop-color', d => d.color))
						linearGradientAttrs
					}
					function offsetParameter(arr) {
						return arr.flat().map(d => {
							// console.log(mergeAttrs.mergeOffsets[arr.i](d.time))
							return {
								offset: mergeAttrs.translateX[d.i](d.time) / rectPosition[rectPosition.length - 1], //d.index/arr.length.toString()
								color: d.ovrage ? 'red' : 'blue',//util.labelScale(d.level),
							}
						})
					}
					function areaParameter() {	//area function
						let range = Array.from(d3.cumsum(rectArray));
						range.unshift(0);
						let rangeArray = d3.pairs(range);
						let xBatch = rangeArray.map((d, i) => d3.scaleLinear().range(d).domain(d3.extent(batchEX[0][i], e => e.time)));
						let yBatch = batchEX.map(d => d3.scaleLinear().range([chartPadding.bottom, chartHeight - chartPadding.top])
							.domain([d3.min(d.flat().map(d => d.min)) * 0.95, d3.max(d.flat().map(d => d.max)) * 1.05]));
						let mergeArea = [
							d3.area()
								.x(d => xBatch[d.i](d.time))
								.y0(d => -yBatch[d.d](d.sxl))
								.y1(d => -yBatch[d.d](d.sxh)),
							d3.area()
								.x(d => xBatch[d.i](d.time))
								.y0((d, i) => -yBatch[d.d](d.l))
								.y1((d, i) => -yBatch[d.d](d.exl)),
							d3.area()
								.x(d => xBatch[d.i](d.time))
								.y0((d, i) => -yBatch[d.d](d.h))
								.y1((d, i) => -yBatch[d.d](d.exh)),
							d3.area()
								.x(d => xBatch[d.i](d.time))
								.y0((d, i) => -yBatch[d.d](d.exl))
								.y1((d, i) => -yBatch[d.d](d.sxl)),
							d3.area()
								.x(d => xBatch[d.i](d.time))
								.y0((d, i) => -yBatch[d.d](d.exh))
								.y1((d, i) => -yBatch[d.d](d.sxh))
						],
							mergeLine = d3.line().x(d => xBatch[d.i](d.time)).y((d, i) => -yBatch[d.d](d.value)).curve(d3.curveLinear),
							mergeLocation = d => `translate(${[xBatch[d.i](d.time), -yBatch[d.d](d.value)]})`;
						timeScale = xBatch;
						let translateX = xBatch;
						return { mergeArea, mergeLine, mergeLocation, translateX }
					}
					function initMergeArea() {
						mergeG.selectAll('.batchElement')
							.data(batchEX)
							.join('g')
							.attr('class', 'batchElement')
							.attr('transform', mergeAttrs.elementTrans)
							.attr('opacity', mergeAttrs.elementOpacity)
							.call(g => g.append('path')
								.attr('fill', util.labelScale(0))
								.attr('class', 'path0')
								.datum(d => d.flat())
								.attr('opacity', 0.5)
								.attr('d', mergeAttrs.mergeArea[0]))
							// .call(g => g.append('path')
							// 		.attr('stroke-width', 2)
							// 		.attr('class', 'line')
							// 		.attr('stroke', (d, i) => `url(#price-gradient${i})`)
							// 		// .attr('stroke', d3.color(util.labelScale(0)).darker(0.6))
							// 		.attr('fill', 'none')
							// 		.datum(d => d.flat())
							// 		.attr('d', mergeAttrs.mergeLine))
							.call(g => g.selectAll('.line').data(d => divideData(d.flat()))	// batchEX.map(d => console.log('data', divideData(d.flat())))
								.join('path')
								.attr('class', 'line')
								.datum(d => d)
								.attr('fill', 'none')
								.attr('d', mergeAttrs.mergeLine)
								.attr('stroke', d => d.status ? mergeColor[0] : mergeColor[1])
							)
							.call(g => g.selectAll('circle')
								.data(d => d.flat()).join('circle')
								.attr('transform', mergeAttrs.mergeLocation)
								.attr('visibility', d => d.ovrage ? 'visible' : 'hidden')
								// .attr('fill', d => util.labelScale(wm._rangeInsert(d)))
								.attr('fill', 'white')
								.attr('stroke', d => d3.color(util.labelScale(Math.abs(d.range))).darker(1))
								// .attr('fill', (d, i) => lc[dataInfo[d.d].month])
								// .attr('stroke', (d, i) => d3.color(lc[dataInfo[d.d].month]).darker(1))
								.attr('stroke-width', 1)
								.attr('r', 1.5))
					}
					function horizenParameter() {	//horizen function
						let range = Array.from(d3.cumsum(rectArray));
						range.unshift(0);
						let rangeArray = d3.pairs(range);
						let xBatch = rangeArray.map((d, i) => d3.scaleLinear().range(d).domain(d3.extent(batchEX[0][i], e => e.time)));
						let yBatch = batchEX.map(d => d.flat()).map((e, f) => {
							return d3.scaleLinear().range(horizenAttrs.overHeight)
								.domain([d3.mean(e, e => e.exl), d3.mean(e, e => e.exl), d3.mean(e, e => e.l),
								d3.mean(e, e => e.h), d3.mean(e, e => e.exh), d3.mean(e, e => e.exh)]);
						});
						let horizenArea = d3.area().curve(d3.curveBasis).x(d => xBatch[d.i](d.time)).y0(0).y1((d, i) => -yBatch[d.d](d.value));
						timeScale = xBatch;
						return horizenArea
					}
					function initHorizenArea() {
						horizenG.selectAll('.horizenElement')
							.data(batchEX.map(d => d.flat()))
							.join('g')
							.attr('class', 'horizenElement')
							.attr('opacity', horizenAttrs.elementOpacity)
							.attr('transform', horizenAttrs.elementTrans)
							.call(g => g.append('clipPath')
								.attr('id', (d, i) => `clipy${i}`)
								.append('rect')
								.attr('width', rectPosition[rectPosition.length - 1])
								.attr('class', 'clipRect')
								.attr('height', horizenAttrs.elementHeight))
							.call(g => g.append('defs').append('path')
								.attr('opacity', 0.8)
								.attr('class', 'allpath')
								.attr('id', (d, i) => `path-def${i}`)
								.datum(d => d)
								.attr('d', horizenAttrs.horizenArea))
							.call(g => g.append('g')
								.attr('clip-path', (d, i) => `url(#clipy${i})`)
								.selectAll('use')
								.data(d => new Array(horizenAttrs.overlap).fill(d))
								.enter()
								.append('use')
								.attr('fill', (d, i) => horizenAttrs.horizenColor(horizenAttrs.overlapNum[i]))
								.attr('transform', (d, i) => `translate(0,${(horizenAttrs.overlapNum[i] + 1) * (horizenAttrs.elementHeight)})`)
								.attr('href', d => `#path-def${d[0].d}`))
					}
					function heatMapParameter(array, data) {
						let xBatch = array.map((d, i) => {
							let l = array[i],
								// scale = d3.scaleLinear()
								//     .range([chartPadding.left, l - chartPadding.right])
								//     .domain(d3.extent(data[i][0], (e, f)=> e.time));
								scale = d3.scaleBand()
									.domain(d3.map(data[i][0], e => e.time.toString()))
									.range([chartPadding.left, l - chartPadding.right]);
							return scale
						});
						// let xLabelData = array.map((d,i) =>{
						//     let temp = data[i][0].map(d => xBatch[i](d.time));
						//     temp.unshift(chartPadding.left)
						//     let subtemp = d3.pairs(temp, (a, b) => b -a);
						//     let key = 2.2;
						//     let padding = subtemp.map((d, i) => {
						//         if(i !== temp.length - 1){
						//             return subtemp[i] > subtemp[i + 1] ? subtemp[i+1]/key : subtemp[i]/key;
						//         }
						//         return subtemp[i]/key
						//     })
						//     return padding
						// })
						let yBatch1 = d3.scaleLinear()
							.range([0, heatMapAttrs.rectHeight - chartPadding.top / 2])
							.domain(d3.extent(d3.map(data, d => d3.map(d, e => d3.map(e, f => f.Q))).flat(2)));
						let yBatch2 = d3.scaleLinear()
							.range([0, heatMapAttrs.rectHeight - chartPadding.top / 2])
							.domain(d3.extent(d3.map(data, d => d3.map(d, e => d3.map(e, f => f.T2))).flat(2)));
						let yColor = d3.scaleLinear()
							.domain([0, 0.25, 0.5, 0.75, 1])
							.range(util.levelColor);
						return { xBatch, yBatch1, yBatch2, yColor }
					}
					function initMapArea() {
						heatMapG
							.attr('transform', heatMapAttrs.position)
							.selectAll('.heatMapG').data(rectPosition)
							.join('g')
							.attr('class', 'heatMapG')
							.attr('transform', heatMapAttrs.elementTrans)
							.call(g => g.selectAll('g')
								.data((d, i) => horizenEX[i])
								.join('g')
								.attr('opacity', heatMapAttrs.opacity)
								.attr('class', 'heatMapElement')
								.attr('transform', heatMapAttrs.elementTrans)
								.call(g => g.selectAll('.mapQ')
									.data(d => d).join('rect')
									.attr('fill', d => heatMapAttrs.yColor(d.Q))
									.attr('stroke', '#e0e4e7')
									.attr('class', 'mapQ')
									.attr('y', heatMapAttrs.qY)
									// .attr('y', d => -qBatch(d.Q))
									// .attr('height', d => qBatch(d.Q))
									.attr('height', heatMapAttrs.rectHeight)
									.attr('width', (d, i) => heatMapAttrs.xBatch[d.i].bandwidth())
									.attr('x', (d, i) => heatMapAttrs.xBatch[d.i](d.time.toString())))
								.call(g => g.selectAll('.mapT2')
									.data(d => d).join('rect')
									.attr('fill', d => heatMapAttrs.yColor(d.T2))
									.attr('stroke', '#e0e4e7')
									.attr('class', 'mapT2')
									.attr('y', heatMapAttrs.t2Y)
									// .attr('y', d => -t2Batch(d.T2) - chartHeight/2)
									// .attr('height', d => t2Batch(d.T2))
									.attr('height', heatMapAttrs.rectHeight)
									.attr('width', (d, i) => heatMapAttrs.xBatch[d.i].bandwidth())
									.attr('x', (d, i) => heatMapAttrs.xBatch[d.i](d.time.toString()))))
					}
					function initShape() {
						const arrowScale = d3.scaleLinear().domain([-3, 3]).range([10, -10]),
							baseRadius = 2;
						shapeGroup.selectAll('shapeElement')
							.data(batchEX)
							.join('g')
							.attr('class', 'shapeElement')
							.attr('transform', shapeAttrs.transform)
							.attr('opacity', shapeAttrs.elementOpacity)
							// .call(g => g.selectAll('.multivariate').data((d, i) => shapeAttrs.batch[i].multivariate)
							//   .join('rect').attr('class', 'multivariate')
							//   .call(g => updateElement(g, shapeAttrs.multiAttrs)))
							.call(g => g.selectAll('.single').data((d, i) => shapeAttrs.batch[i].single)
								.join('path')
								.attr('class', 'single')
								.call(g => updateElement(g, shapeAttrs.singleAttrs)))
							.call(g => g.selectAll('.intersection').data((d, i) => shapeAttrs.batch[i].intersection)
								.join('g')
								.attr('class', 'intersection')
								.call(g => g.append('path')
									.attr('class', 'interArrow')
									.attr('d', e => d3.linkVertical().x(d => d.x).y(d => d.y)({ source: { x: 0, y: 0 }, target: { x: 0, y: arrowScale(e[0].range) } }))
									.attr('marker-end', 'url(#shape-arrow)')
									.attr('transform', shapeAttrs.interArrow)
									.attr('stroke', mergeColor[0])
									.attr('fill', 'none'))
								// .call(g => g.append('circle')
								// 	.attr('transform', shapeAttrs.startRibbon)
								// 	.attr('class', 'startRibbon')
								// 	.attr('stroke', mergeColor[0])
								// 	.attr('fill', 'none')
								// 	.attr('r', baseRadius))
								// .call(g => g.append('circle')
								// 	.attr('transform', shapeAttrs.endRibbon)
								// 	.attr('class', 'endRibbon')
								// 	.attr('stroke', mergeColor[0])
								// 	.attr('fill', 'none')
								// 	.attr('r', baseRadius))
								.call(g => g.append('rect')
									.attr('transform', shapeAttrs.interLineTrans)
									.attr('width', shapeAttrs.interLen)
									.attr('height', 1.25 * baseRadius)
									.attr('fill', mergeColor[0])
									.attr('stroke', 'none'))
							)
					}
					function updateShape() {
						const t = d3.transition().duration(150).ease(d3.easeLinear);
						shapeGroup.transition(t)
							.call(g => updateElement(g.selectAll('.single'), shapeAttrs.singleAttrs))
							.call(g => updateElement(g.selectAll('.multivariate'), shapeAttrs.multiAttrs))
							.call(g => g.selectAll('.intersection').selectAll('path').attr('transform', shapeAttrs.interArrow))
							.call(g => g.selectAll('.intersection').selectAll('line').attr('transform', shapeAttrs.interLineTrans).attr('x2', shapeAttrs.interLen))
							.call(g => g.selectAll('.startRibbon').attr('transform', shapeAttrs.startRibbon))
							.call(g => g.selectAll('.endRibbon').attr('transform', shapeAttrs.endRibbon))
					}
					function initSymbol() {
						symbolG.attr('transform', symbolAttrs.position)
							.call(g => g.selectAll('g')
								.data(dataInfo).join('g').attr('transform', symbolAttrs.transform).attr('opacity', symbolAttrs.opacity)
								.call(g => addElement(g, 'rect', symbolAttrs.sIndice))
								.call(g => addElement(g, 'text', symbolAttrs.sText))
								.call(g => addElement(g, 'rect', symbolAttrs.mIndice))
								.call(g => addElement(g, 'text', symbolAttrs.mText)))
					}
					function updateSymbol(t) {
						symbolG.transition(t)
							.attr('transform', symbolAttrs.position)
							.selectAll('g')
							.call(g => g.attr('transform', symbolAttrs.transform).attr('opacity', symbolAttrs.opacity))
						symbolG.transition(t)
							.call(g => updateElement(g.selectAll('.single'), symbolAttrs.sIndice))
							.call(g => updateElement(g.selectAll('.multivariate'), symbolAttrs.mIndice))
							.call(g => updateElement(g.selectAll('.singleText'), symbolAttrs.sText))
							.call(g => updateElement(g.selectAll('.multiText'), symbolAttrs.mText))
					}
					function clickScale(e, d) {
						console.log(d3.pointer(e))
						console.log(e)
						console.log(d3.select(this).node().getBBox())
						let el = vm.svg.node().appendChild(this.cloneNode(this))
						el.setAttribute('calss', `${vm.menuId}tooltip`);
						console.log(e, el.parentNode);

						//document.querySelector(`#${vm.menuId} svg`).appendChild(this.cloneNode(this)).setAttribute('calss', `${vm.menuId}tooltip`)
						// console.log(d3.select(this).attr('transform'), d3.select(this))
						// d3.select(this).select(function() {
						//     return this.parentNode.insertBefore(this.cloneNode(this), this.nextSibling);
						//   }).attr('transform', d3.select(this).attr('transform') + ' scale(2)').attr('calss', 'dfudguieruu')
					}
					// function mouseOver(args) {
					// 	opacityCache = (d, i) => {
					// 		if (merge_g <= indexScale(i) && indexScale(i) < rectNum + merge_g) {
					// 			if (d.indexName) {
					// 				return args.indexOf(d.indexName) !== -1 ? 1 : 0.4
					// 			} else if (d[0].indexName) {
					// 				return args.indexOf(d[0].indexName) !== -1 ? 1 : 0.4
					// 			} else if (d[0][0].indexName) {
					// 				return args.indexOf(d[0][0].indexName) !== -1 ? 1 : 0.4
					// 			}
					// 		} else {
					// 			return 0
					// 		}
					// 	}
					// 	initAttrs.call(wm)
					// 	renderSort()
					// }
					// function mouseOut() {
					// 	opacityCache = (d, i) => merge_g <= indexScale(i) && indexScale(i) < rectNum + merge_g ? 1 : 0;
					// 	initAttrs.call(wm)
					// 	renderSort()
					// }
					// function searchIndexName() {
					// 	return dataInfo.filter((d, i) => merge_g <= indexScale(i) && indexScale(i) < rectNum + merge_g).map(d => d.indexName)
					// }
					function updateBar() {
						chartHeight = wm._sliderValue;
						renderyScale();
						// renderSort();
						renderShape();
						renderSort();
					}
					return {
						// mouseOver,
						// mouseOut,
						// searchIndexName,
						updateBar
					}
				}
				_initDefs(){
					const defsG = this._container.append('g')
						.attr('class', 'defsG');
					const defs = defsG.append('defs')
						.call(g => g.append('filter')
							.attr('id', 'card-shadow')
								.call(g => g.append('feDropShadow')
									.attr('dx',0)
									.attr('dy', 0)
									.attr('stdDeviation', 2.5)
									.attr('flood-color', '#bfbdbd')));//#ededed
				}

				_initSlider(){
					const sliderGroup = this._staticGroup.append('g')
						.attr('class', 'sliderGroup')
						.attr('transform', `translate(${[575, - this._height/2 + 2.5]})`);
					const wm = this;
					let offsetX = 0,
							width = 40,
							sliderHeight = 6,
							xScale = d3.scaleLinear().domain([-width, width]).range([25, 60]);
					let debounce = (value) => {
						clearTimeout(this._sliderTimer)
						this._sliderTimer = setTimeout(() => {
							this._sliderValue = value;
							this._barInstance.updateBar()
						}, 500)
					}
					function dragStart(event){
						offsetX = event.x - d3.select(this).attr('cx')
					}
					function drag(event){
						if(Math.abs(event.x - offsetX) >= width){
							d3.select(this).attr('cx', event.x - offsetX > width ? width : -width);
						}else{
							d3.select(this).attr('cx', event.x - offsetX);
						}
						sliderGroup.select('.overLayer').attr('width', +d3.select(this).attr('cx') + width);
					}
					function dragEnd(){
						offsetX = d3.select(this).attr('cx');
						//console.log(offsetX)
						sliderGroup.select('.overLayer').attr('width', + offsetX + width);
						debounce.bind(wm)(xScale(offsetX))
					}
					sliderGroup
						.call(g => g.append('rect')
							.attr('x', -width)
							.attr('y', this._buttonStyle.height/2 - sliderHeight/2)
							.attr('fill', 'none')
							.attr('stroke', this._buttonColor)
							.attr('height', sliderHeight)
							.attr('rx', sliderHeight/2)
							.attr('ry', sliderHeight/2)
							.attr('width', 2 * width))
						.call(g => g.append('rect')
							.attr('class', 'overLayer')
							.attr('transform', `translate(${-width},0)`)
							.attr('y', this._buttonStyle.height/2 - sliderHeight/2)
							.attr('stroke', 'none')
							.attr('fill', this._buttonColor)
							.attr('height', sliderHeight)
							.attr('rx', sliderHeight/2)
							.attr('ry', sliderHeight/2)
							.attr('width', xScale.invert(this._sliderValue) + width))
					sliderGroup.append('circle')
						.attr('r', 5)
						.attr('cx', xScale.invert(this._sliderValue))
						.attr('cy', this._buttonStyle.height/2)
						.attr('stroke', this._buttonColor)
						.attr('stroke-width', 1.5)
						.attr('fill', 'white')
						.style('cursor', 'move')
						.call(d3.drag()
							.on('start', dragStart)
							.on('drag', drag)
							.on('end', dragEnd))
				}

				_initdata() {
					const field = this._field;
					this._chartData = this._data.map(d => {
						const datum = {
							indexName: d[field.name],
							date: d[field.name],
							month: this.getIndex(d[field.name]),
							low: d[field.low],
							high: d[field.high],
							elow: d[field.elow],
							ehigh: d[field.ehigh],
							avg: d[field.avg],
							spe: d[field.spe],
							t2: d[field.t2]
						};
						const e=datum;
						let deviation=e.avg>e.low&e.high>e.avg? 0 : (e.avg<e.low ? (e.low-e.avg)/e.low : (e.avg-e.high)/e.high);
						datum.deviation=deviation;
						datum.over = e.avg>e.low&e.high>e.avg? 0 : (e.avg<e.low ? (e.low-e.avg) : (e.avg-e.high));
						return datum;
					});
					// this._chartData = this._sort(this._chartData);
					// this._chartData = this._chartData.length > 25 ? this._chartData.slice(0,25) : this._chartData;
					this._label = this._chartData.map(d => d.indexName)
				}

				_sort(data){
						let speSort = d3.sort(data,d=> d.spe),
								T2Sort = d3.sort(data,d=> d.t2);
						var sortdata = data.filter(d =>{
								return d.deviation !==0
								// (d3.map(speSort, e=> e.indexName).indexOf(d.indexName)<= vm.multiPara || d3.map(T2Sort, e=> e.indexName).indexOf(d.indexName)<= vm.multiPara) && d.deviation !==0
						})
						var SPE=d3.sort(sortdata,d=> -d.spe),
								T2=d3.sort(sortdata,d=> -d.t2),
								res=d3.sort(sortdata,d=> -d.deviation);
						for (let item in SPE){
								let query=SPE[item].indexName                     
								SPE[item].order=+item+1+(+T2.findIndex((value)=> value.indexName===query))+1+(+res.findIndex((value)=> value.indexName===query))+1
						}
						return d3.sort(SPE,d=> d.order);
				}

				_horizonColor(arr){
						let len = arr.filter(d => d.value > d.high || d.l > d.value).length;
						return d3.scaleLinear()
								.domain([0, arr.length])
								.range(['#b9c6cd', '#e3ad92'])
								.interpolate(d3.interpolateRgb.gamma(2.2))(len)
				}
				
				_horizonPoint(arr, len, flag){
						let scale = d3.scaleLinear()
								.domain([0, arr.length])
								.range([len/2, len]),
								L = scale(arr.filter(d => flag ? d.Q > vm.corrSize : d.T2 > vm.corrSize).length);
								return flag ? `${-L/2}, -${L/2} ${L/2}, ${-L/2} ${-L/2}, ${L/2}` : `${L/2}, ${L/2} ${-L/2}, ${L/2} ${L/2}, ${-L/2}`
				}

				_sliderArray(arr, totalData){
						return d3.map(arr, (d, f) => {
								d.index = f;
								var name = d.indexName,
								batch = totalData.map(e => {
										let i = searchLabels.indexOf(name);
										let s = {
												time: new Date(e.toc),
												flag: e.fqc_label,
												Q: e.CONTQ[i],
												T2: e.CONTJ[i],
												h: e['one_dimens'][i].u,
												l: e['one_dimens'][i].l,
												exh: e['one_dimens'][i].extremum_u,
												exl: e['one_dimens'][i].extremum_l,
												sxh: e['one_dimens'][i].s_extremum_u,
												sxl: e['one_dimens'][i].s_extremum_l,
												upid: e.upid,
												value: e['one_dimens'][i].value,
												indexName: name,
												process: d.month,
												d: f,
												ovalue: e['one_dimens'][i].original_value,
										};
										s.self = e.upid == vm.upid ? true : false ,
										s.max = Math.max(s.h, s.exh, s.value, s.sxh),
										s.min = Math.min(s.l, s.exl, s.value, s.sxl),
										s.over = s.h >= s.value && s.value >= s.l ? 0 : (s.h >= s.value ? s.value - s.l : s.h - s.value);
										return s
								})
								batch.d = f;
								return batch
						})
				}

				_divideBacthData(arr, totalData){
					let result = [];
					for(let i = 0; i < arr.length; i++){
						let index = searchLabels.indexOf(arr[i].indexName),
							name = arr[i].indexName,
							process = arr[i].month;
						let batchIndex = d3.map(totalData, (d, batch) =>{
							let temp = d3.map(d, e => {
								let s = {
									time: new Date(e.toc),
									flag: e.fqc_label,
									Q: e.CONTQ[index],
									T2: e.CONTJ[index],
									h: e['one_dimens'][index].u,
									l: e['one_dimens'][index].l,
									exh: e['one_dimens'][index].extremum_u,
									exl: e['one_dimens'][index].extremum_l,
									sxh: e['one_dimens'][index].s_extremum_u,
									sxl: e['one_dimens'][index].s_extremum_l,
									original_value: e['one_dimens'][index].original_value,
									s_extremum_original_l: e['one_dimens'][index].s_extremum_original_l,
									s_extremum_original_u: e['one_dimens'][index].s_extremum_original_u,
									extremum_original_l: e['one_dimens'][index].extremum_original_l,
									extremum_original_u: e['one_dimens'][index].extremum_original_u,
									original_u: e['one_dimens'][index].original_u,
									original_l: e['one_dimens'][index].original_l,
									upid: e.upid,
									value: e['one_dimens'][index].value,
									indexName: name,
									process: process,
									d: i,
									i: batch,
									ovalue: e['one_dimens'][index].original_value,
								};
								s.self = e.upid == vm.upid ? true : false ,
								s.max = Math.max(s.h, s.exh, s.value, s.sxh),
								s.min = Math.min(s.l, s.exl, s.value, s.sxl),
								s.over = s.h >= s.value && s.value >= s.l ? 0 : (s.h >= s.value ? s.value - s.l : s.h - s.value);
								s.range = this._rangeLevel(s);
								s.ovrage = Math.abs(s.range) > 2 ?  true : false;
								s.dia_Status = e['tjOrder'][index] < 10 && e['tqOrder'][index] < 10 ? true : false;
								return s
							});
							temp.i = batch;
							temp.d = i;
							return temp;
						})
						result.push(batchIndex)
					}
					// console.log('result', result.map(d => d.flat().map(e => e.range)))
					return result;
				}
				
				_rangeInsert(s){
					if(s.h >= s.value && s.value >= s.l)return 0;
					else if(s.exh >= s.value && s.h <= s.value || s.value <= s.l && s.value >= s.exl)return 1;
					else if(s.sxh >= s.value && s.exh <= s.value || s.value <= s.exl && s.value >= s.sxl)return 2;
					else return 3;
				}
				_rangeLevel(s){
					if(s.h >= s.value && s.value >= s.l)return 0;
					else if(s.exh >= s.value && s.h <= s.value)return 1;
					else if(s.value <= s.l && s.value >= s.exl)return -1;
					else if(s.sxh >= s.value && s.exh <= s.value)return 2;
					else if(s.value <= s.exl && s.value >= s.sxl)return -2;
					else if(s.value > s.sxh)return 3;
					else if(s.value < s.sxl)return -3;
				}
			}
			this.wheelChart.instance = new wheelRound(this.svg, this)
				.size([this.width, this.height])
				.dataInit(wheeldata, this.batchData)
				.process(processJson)
				.labels(labels)
				.render();
			console.log(this.wheelChart)
		}
	},
	mounted() {
		this.height = document.getElementById(this.menuId).offsetHeight;	
		this.width = document.getElementById(this.menuId).offsetWidth;	
	},
	computed:{
	},
	watch:{
	}
}
</script>

<style lang="scss" scoped>
@import url("../../assets/marey/wheel.scss");
</style>