<template>
		<div :id="menuId" style="height: 100%;width:100%;"></div>
</template>

<script>
import * as d3 from 'd3';

import { addElement,
	updateElement,
	updateAsyncElement,
	sortedIndex,
	translate,
	stringify
} from 'utils/element';
import clickIcon from 'assets/images/wheel/fixed.svg'
import heat from 'assets/images/heat.svg'
import cool from 'assets/images/wheel/ACCIcon.svg'
import force from 'assets/images/wheel/force.svg'
import temper from 'assets/images/wheel/temper.svg'
import speed from 'assets/images/wheel/speed.svg'
import torque from 'assets/images/wheel/torque.svg'
import displacement from 'assets/images/wheel/displacement.svg'
import screwdown from 'assets/images/wheel/screw.svg'
import time from 'assets/images/wheel/time.svg'
import roll from 'assets/images/roll.svg'
const processIcon = [heat, roll, cool];
const boxIcon = {
	'seg_u': temper,
	'seg_d': temper,
	'plate': temper,
	'time': time,
	'speed': speed,
	'screwdown': screwdown,
	'shiftpos': displacement,
	'torque': torque,
	'torquebot': torque,
	'torquetop': torque,
	'bendingforce': force,
	'bendingforcebot': force,
	'bendingforcetop': force,
	'rollforce': force,
	'rollforceds': force,
	'rollforceos': force,
	'p1': temper,
	'p2': temper,
	'p3': temper,
	'p4': temper,
	'p6': temper
};
import util from 'views/baogang/util.js';
import { 
	divideData,
	arrowData,
	mergeColor,
	diagnosticSort,
	queryIcon,
	getSortIndex,
	sortDomain,
	sortDatum
} from "utils/data.js"
import {
	preRoll,
	boxplot,
	heatplot,
	preHeat,
	createToolTip
} from './boxplot.js';
import {processJson} from './index.js';
import { mapMutations } from 'vuex';
export default {
	props: {
	},
	data() {
			return {
					menuId: 'wheeling' + Math.random().toString(32).slice(-6),
					data:[],
					upid: undefined,
					wheelChart: {},
					height: undefined,
					width: undefined
			}
	},
	methods: {
		...mapMutations([
			'showTooltip',
			'removeTooltip'
		]),
		paintChart(batchData, processData) {
			const vm = this;
			this.wheelChart.svg !== undefined && this.wheelChart.svg.remove()
			this.wheelChart.svg = d3.select('#' + this.menuId)
				.append('svg')
				.attr('viewBox', `${-60} ${-this.height / 2} ${this.width} ${this.height}`)
				.style('width', this.width)
				.style('height', this.height);
			class wheelRound{
				constructor(container, vNode, options) {
					this._container = container;
					this._vNode = vNode;
					this._staticGroup = null;
					this._leftGroup = null;
					this._g = null;

					this._width = options.width;
					this._height = options.height;
					this._margin = {top: 30, bottom: 20, left: 0, right: 0};
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

					this._label=null;

					//staticGroup
					this._zoomStatus = true;
					this._sliderTimer = null;

					this._process=[];
					this._deviceName = ['heat', 'roll', 'cool'];
					this._labelcolor = ['#fcd8a9', '#cce9c7', '#c1c9ee'];
					this._flagColor = ["#e3ad92",   "#b9c6cd"];
					this._sliderValue = 40;
					this._horizonView = true;
					this._indexScale = 0;
					this._mouseDis  = undefined;
					this._barVis = false;
					this._stopPropagation = (e, d) => e.stopPropagation();

					this._lineVis = false;
					this._lineButtonG = null;
					this._selectDevice = 3;

					//mainG
					this._mainG = null;
					this._borderStyle ={
						color: '#b9bbbd',
						rx: 3,
						ry: 3
					}
					this._cardWidth = undefined;
					this._barInstance = null;

					this._boxInstances = null;
					this._horizonPadding = 120;
					this._keys = [
							['seg_u', 'seg_d', 'plate', 'time'],
							['bendingforce', 'bendingforcebot', 'bendingforcetop', 'rollforce', 'rollforceds', 'rollforceos',
							'screwdown', 'shiftpos', 'speed', 'torque', 'torquebot', 'torquetop'],
							['p1', 'p2', 'p3', 'p4', 'p6']
					];
					this._boxkeys = this._keys.flat();
					this._boxChart = {h: 120, w: 75/2 * 15, gap: 20};
					this._boxMap = null;
					this._wheelBox = 0;//wheel 数量
					this._BoxGroup = null;

					this._buttonColor = '#94a7b7'; //  #678fba
					this._buttonStyle = {
						width: 40,
						height: 18 ,
						textX: 20,
						textY:  12
					};
					this._buttonGroup = {
						x: 0,
						gap: 30,
						outset: - this._height / 2 + 25
					},
					this._leftButton = num => (+num) * this._buttonGroup.gap;
					this._staticButton = {
						rect:{
							rx: 5,
							ry: 5,
							'stroke-width': 0.5,
							height: this._buttonStyle.height,
							width: this._buttonStyle.width,
							stroke: this._buttonColor
						},
						text:{
							x: this._buttonStyle.textX,
							y: this._buttonStyle.textY
						}
					}

					// 高亮
					this._mouseList = null;	//mouse highlight

					this._checkUpid = '';
					this._selectIndex = '';
					this._selectProcess = '';
				}
				getIndex(_){
					for (let item in this._process){
						if(this._process[item].indexOf(_)!==-1){
							return +item
						}
					}
				}

				dataInit(batchData, processData) {
					this._batchData = batchData;
					this._processData = processData;
					return this;
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
					this._staticGroup = this._container.append('g').attr('class', 'staticGroup');
					this._leftGroup = this._staticGroup.append('g').attr('class', 'leftGroup');
					
					this._initLeftGroup();

					this._initDefs();
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
					this._staticGroup.raise();
					this._leftGroup.raise();

					const svg = this._g;
					const zoom = d3.zoom().on('zoom', e => {
						if(!this._zoomStatus)return;
						svg.attr('transform', e.transform);
					})

					this._container
						.call(zoom)
						.call(zoom.transform, d3.zoomIdentity);
				}
				_renderData(){
					// this._batchEX = this._divideBacthData(dataInfo, this._batchData);
				}
				_initAttrs(){
					console.log('bacthData: ', this._batchData)
					// const	maxLength = this._batchData.length,  //batch numbers
					// 	rectArray = new Array(maxLength).fill(0).map((d, i) => (this._batchData[i].length + 1) * 4.75),   //batch position
					// 	mergeOffset = Array.from(d3.cumsum(rectArray)),
					// 	RectWidth = mergeOffset[mergeOffset.length - 1];
					this._mainAttrs = {
						'body': {
							class: 'mainG'
						},
						'background': {
							// transform: `translate(${[-10, - this._height / 2]})`,
							width: 0,
							id: 'mainBackground',
							height: 0,
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
					this._renderMainBox();
					this._initLinkG();
					const node = this._mainG.node().getBBox();
					this._mainG.select('#mainBackground')
						.attr('x', -10)
						.attr('width', 20 + this._cardWidth + this._horizonPadding + this._boxChart.w)
						.attr('height', node.height + 10)
						.attr('y', node.y - 5)
						.attr('stroke', '#ccc')
						.attr('stroke-width', 0.5);
					const leftNode = this._leftGroup.node().getBBox(),
						padding = (this._width - this._mainG.node().getBBox().width - leftNode.width)/3;
					// this._xCenter = (this._width)/2;
					// this._leftGroup
					this._mainG
						.attr('transform', translate(leftNode.width + padding * 2 - 60, 0))
						.attr('clip-path','url("#polygon-clip-triangle-equilateral")');
					this._container.select('.defsG')
						.append('defs')
						.call(g => g.append('clipPath')
							.attr('id', 'polygon-clip-triangle-equilateral')
							.attr('clipPathUnits', 'objectBoundingBox')
							.call(g => g.append('polygon')
								.attr('points', '0 0, 0 1, 1 1, 1 0, 0 0')));//"0 0.87, 0.5 0, 0.5 0, 1 0.87"
					this._leftGroup.attr('transform', translate(padding - 60, 0 - leftNode.y - leftNode.height/2))
					// this._initBoxLine()
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
						// rectArray = new Array(maxLength).fill(0).map((d, i) => (this._batchData[i].length + 1) * 6.5),   //batch position
						// mergeOffset = Array.from(d3.cumsum(rectArray)),	// card offset mergeOffset
						// RectWidth = mergeOffset[mergeOffset.length - 1],
						RectWidth = 480,
						minRect = RectWidth / (maxLength + 0.5),
						batchEX = this._divideBacthData(dataInfo, this._batchData);

					let batchNum = new Array(maxLength).fill(0).map((_, i) => (this._batchData[i].length + 1)),
						batchArray = Array.from(d3.cumsum(batchNum)),
						blockWidth = RectWidth/batchArray[batchArray.length - 1],
						rectArray = new Array(maxLength).fill(0).map((_, i) => (this._batchData[i].length + 1) * blockWidth),   //batch position
						mergeOffset = Array.from(d3.cumsum(rectArray));	// card offset mergeOffset
					
					var merge_g = 0,
						chartHeight = this._sliderValue,   //rect max height
						chartPadding = { left: 3, right: 3, top: 2, bottom: 2, horizen: 6, vertical: 4 },
						boxMargin = { bottom: 5, top: 5, left: 5, right: 5, horizen: 12, vertical: 10 },
						chartMargin = 10,
						textWidth = 110,
						textMargin = { bottom: 5, top: 5, margin: 5, left: 5, right: 0, horizen: 5, vertical: 10 },
						cardWidth = boxMargin.horizen + RectWidth + textWidth + textMargin.horizen,
						cardMargin = 20,
						tepaHeight = chartHeight,	//Tepamoral View
						mergeHeight = 1.5 * chartHeight;//mergeChart View

					var rectNum = undefined,
						displayfunc = null,
						barVisObject = Object.assign({}, ...dataInfo.map(d => { return { [d.indexName]: this._barVis } })),
						indexArray = d3.map(dataInfo, (d, i) => i),
						indexSort = d3.map(dataInfo, d => d.indexName),
						indexScale = null,// index  --- sort
						rectHeight = null,
						yScaleCache = null,
						yScale = null,  //指标在y轴上的坐标
						lastY = null;
					var  // init All Attrs
						cardAttrs = null,
						sliderAttrs = null,
						rectAttrs = null,
						dragAttrs = null,
						linearGradientAttrs = null,
						mergeAttrs = null,
						horizenAttrs = null,
						barAttrs = null,
						textAttrs = null,
						clickAttrs = null,	//sliderG点击事件
						clickStatus = false,
						axisAttrs = null,
						arrowAttrs = null,
						timeScale = null,
						arrowAttrs = null;

					this._cardWidth = cardWidth;

					console.log('batchEX', batchEX)
					console.log(batchEX.map(d => getSortIndex(d.flat())));
					let orderData = batchEX.map(d => getSortIndex(d.flat())),
						orderDatum = sortDatum(orderData);
						//['overNum', 'speNum', 'extremum'].map(d => orderData.map(e => e[d]))

					initOrdinal.call(this, this._coefficient);
					renderyScale();
					initAttrs.call(this); //init Element Attrs

					var sliderG = mainG.append('g').attr('class', 'sliderG')
						.attr('transform', sliderAttrs.transform);

					sliderG.append('rect')
						.attr('fill', 'white')
						.attr('transform', `translate(${[0, -this._height / 2 + this._margin.top]})`)
						.attr('height', this._height)
						.attr('width', RectWidth)
						.attr('stroke', 'none')
					sliderG.on('wheel', function (e) {
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

					const defG = this._container.select('.defsG');
					initSymbolDefs();
					var rectG = mainG.append('g').attr('class', 'rectG');

					var dragG = sliderG.append('g').attr('class', 'dragG');
					initDragG();
					//https://observablehq.com/d/d503153fbfd48b03

					var gradientG = sliderG.append('g').attr('class', 'gradientG');
					initLinearGradient();

					const tepaChart = sliderG.append('g').attr('class', 'tepaChart');
					initArrowGroup();

					var mergeG = sliderG.append('g').attr('class', 'mergeG');
					var horizenG = sliderG.append('g').attr('class', 'horizenG');
					renderMergeChart.call(this);
					if (rectArray.some(d => d === chartHeight))initRectG()
					initAxisG(timeScale);

					var barG = mainG.append('g').attr('class', 'barG');
					initBarG.call(this);

					var mouseInfo = this._mouseDis !== undefined ? mouseText(this._mouseDis) : undefined,
						textG = sliderG.append('g').attr('class', 'textG');
					initMouseG.call(this);

					
					const clickG = sliderG.append('g')
						.call(g => updateElement(g, clickAttrs.body));
					clickG
						.call(g => addElement(g, 'line', clickAttrs.line))
						.call(g => addElement(g, 'image', clickAttrs.icon))
						.call(g => addElement(g, 'text', clickAttrs.text))

					renderSort()

					function initAttrs() {
						const chartStart = boxMargin.left + textMargin.horizen + textWidth,
							tepaCard = {
								height: tepaHeight + chartPadding.vertical,
								width: RectWidth
							},
							mergeCard = {
								height: mergeHeight + chartPadding.vertical,
								width: RectWidth
							};
						// tepamoral
						const cardHeight = d => (barVisObject[d.indexName] ? mergeCard.height : 0) + tepaCard.height +
								+ boxMargin.vertical + chartMargin * (barVisObject[d.indexName] ? 1 : 0);

						sliderAttrs = {
							transform: `translate(${[chartStart, 0]})`
						}
						dragAttrs = {
							body: {
								transform: d => `translate(${[mergeOffset[d], 0]})`,
								class: 'dragGroup'
							},
							element:{
								class: 'dragElement',
								display: displayfunc,
								transform: (_, i) => translate(0, yScale(i))
							},
							teqaLine:{
								class: 'teqaLine',
								stroke: '#d4dade',
								'stroke-dasharray': '6 6',
								'stroke-width': 2,
								transform: translate(0, -tepaCard.height),
								y2: tepaCard.height,
								y1: 0
							},
							mergeLine:{
								class: 'mergeLine',
								stroke: '#d4dade',
								'stroke-dasharray': '6 6',
								'stroke-width': 2,
								transform: translate(0, chartMargin),
								y1: 0,
								y2: mergeCard.height,
								display: (d, i) => barVisObject[d.indexName] ? displayfunc(d, i) : 'none'
							},
							dragBlock:{
								width: 3,
								x: -1.5,
								fill: 'white',
								y: -tepaCard.height,
								height: tepaCard.height,
								opacity: 0
							}
						}
						mergeAttrs = {
							body: {
								class: 'batchElement',
								display: (d, i) => barVisObject[d[0][0].indexName] ? displayfunc(d, i) : 'none',
								transform: (_, i) => `translate(${[0, yScale(i) + chartMargin + mergeHeight]})`
							}
						}
						Object.assign(mergeAttrs, areaParameter(mergeHeight))

						horizenAttrs = {
							body: {
								class: 'horizenElement',
								display: (d, i) => barVisObject[d[0].indexName] ? displayfunc(d, i) : 'none',
								transform: (_, i) => `translate(${[0, yScale(i) + chartMargin]})`
							},
							overlap: 3,   //horizen layer
							overlapNum: [-1, -2, -3, 0, 1, 2],
							overHeight: [-3, -2, -1, 1, 2, 3].map(d => d * mergeHeight),
							elementHeight: mergeHeight
						}
						horizenAttrs.horizenArea = horizenParameter();
						horizenAttrs.horizenColor = i => ['#e34649', '#f7a8a9', '#fcdcdc', '#f7f7f7', '#fcdcdc', '#f7a8a9', '#e34649'][i + (i >= 0) + horizenAttrs.overlap];
						barAttrs = {
							body:{
								transform: (d, i) => `translate(${[boxMargin.left, yScale(i) + chartMargin]})`,
								display: (d, i) => barVisObject[d.indexName] ? displayfunc(d, i) : 'none'
							},
							borderHeight: mergeHeight + chartPadding.top,
							borderWidth: textWidth - chartPadding.right 
						}
						Object.assign(barAttrs, initBarData())
						barAttrs.border = {
							class: 'border',
							height: mergeCard.height,
							width: textWidth,
							stroke: d => lc[d.month],
							fill: 'white',
							'stroke-width': 0.25
						};
						barAttrs.goodSteel = {
							class: 'goodSteel',
							fill: this._flagColor[1],
							stroke: this._flagColor[1],
							'stroke-width': 0.1,
							x: d => barAttrs.barXscale[d.index](d.x0),
							height: d => barAttrs.barYscale[d.index](d.length),
							width: d => barAttrs.barXscale[d.index](d.x1) - barAttrs.barXscale[d.index](d.x0),
							y: d => barAttrs.borderHeight - barAttrs.barYscale[d.index](d.length),
							// opacity: 1
						},
						barAttrs.badSteel = {
							class: 'badSteel',
							fill: this._flagColor[0],
							stroke: this._flagColor[0],
							'stroke-width': 0.1,
							x: d => barAttrs.barXscale[d.index](d.x0),
							height: d => barAttrs.barYscale[d.index](d.length),
							width: d => barAttrs.barXscale[d.index](d.x1) - barAttrs.barXscale[d.index](d.x0),
							y: d => barAttrs.borderHeight - barAttrs.barYscale[d.index](d.length),
							// opacity: 1
						};
						textAttrs = {
							line:{
								class: 'mouseG',
								y1: -wm._height/2 + wm._margin.top - 10,
								y2: wm._height/2 - wm._margin.bottom,
								transform: `translate(${[mouseInfo ? wm._mouseDis : 0, 0]})`,
								stroke: mouseInfo !== undefined ? '#bbbcbd' : 'none',
								'stroke-width': 0.25
							},
							text:{
								display: displayfunc,
								fill: 'black',
								text: (_, i) => mouseInfo !== undefined ? stringify(+mouseInfo[i]) : '',
								transform: (d, i) => `translate(${[mouseInfo ? wm._mouseDis + 30 : 0,
									yScale(i) + (barVisObject[d.indexName] ? mergeHeight / 2 : -tepaHeight / 2)]})`
							}
						}
						clickAttrs = {
							body:{
								class: 'clickG',
								display: 'none',//clickStatus ? 'block' : 'none',
								transform: `translate(${[0, 0]})`
							},
							line:{
								y1: -wm._height/2 + wm._margin.top - 15 - 5,
								y2: wm._height/2 - wm._margin.bottom,
								stroke: 'black',
								'stroke-width': 1,
								opacity: 0.3,
								'stroke-linecap': 'round'
							},
							icon:{
								href: clickIcon,
								height: 40,
								width: 40,
								transform: `translate(${-0.5 * 40},${ -wm._height/2 + wm._margin.top + 15 - 45 - 5})`
							},
							text: {
								transform: `translate(${[10, -wm._height/2 + wm._margin.top - 15 ]})`,
								'text-anchor': 'start',
								fill: '#6d7885',
								'font-size': '12px',
								'font-family': "Gill Sans,Gill Sans MT,Calibri,Trebuchet MS,sans-serif;",
								'text': '',
								'font-style': 'normal',
								'font-weight': 500
							}
						}

						rectAttrs = {
							body:{
								class: 'rectG',
								transform: d => `translate(${[d == 0 ? 0 : mergeOffset[+d - 1], 0]})`
							},
							element:{
								'class': 'rectElement',
								display: displayfunc,
								transform: (d, i) => `translate(${[0, yScale(i) - tepaCard.height]})`
							},
							background:{
								height: tepaCard.height,
								width: tepaCard.height,
								fill: 'white'
							},
							card:{
								x: chartPadding.left,
								y: chartPadding.top,
								height: tepaHeight,
								width: tepaHeight,
								'fill': d => wm._horizonColor(d),
								'stroke': function (d) {
									return d3.color(d3.select(this).attr('fill')).darker(0.5)
								}
							},
							leftPolygon:{
								transform: `translate(${[tepaCard.height / 2, tepaCard.height / 2]})`,
								fill: '#c65b24',
								stroke: '#c65b24',
								opacity: 0.6,
								points: d => wm._horizonPoint(d, tepaHeight/ 2, true)
							},
							rightPolygon:{
								transform: `translate(${[tepaCard.height / 2, tepaCard.height / 2]})`,
								fill: '#c65b24',
								stroke: '#c65b24',
								opacity: 0.6,
								points: d => wm._horizonPoint(d, tepaHeight/ 2, false)
							}
						};
						let baseRadius = 2,
							t_scale = d => mergeAttrs.translateX[d.i](d.time),
							arrowScale = d3.scaleLinear().domain([-3, 3]).range([10, -10]);
						arrowAttrs = {
							body:{
								transform: (_, i) => translate(0, yScale(i)),
								class: 'tepaElement',
								display: displayfunc
							},
							singleAttrs: {
								class: 'single',
								transform: d => translate(t_scale(d), - tepaHeight / 2),
								stroke: mergeColor[0],
								fill: 'none',
								'marker-end': 'url(#shape-arrow)',
								d: e => d3.linkVertical().x(d => d.x).y(d => d.y)
									({ source: { x: 0, y: e.ovrage ? (e.range > 0 ? -baseRadius : baseRadius) : 0 },
										target: { x: 0, y: arrowScale(e.range) } })
							},
							interArrow: {
								stroke: mergeColor[0],
								class: 'interArrow',
								fill: 'none',
								d: e => d3.linkVertical().x(d => d.x).y(d => d.y)
									({ source: { x: 0, y: 0 }, target: {x: 0, y: arrowScale(e[0].range)} }), 
								'marker-end': 'url(#shape-arrow)',
								transform: d => `translate(${[(t_scale(d[0]) + t_scale(d[d.length - 1])) / 2, - tepaHeight / 2]})`,
							},
							interLine:{
								class: 'interLine',
								transform: d => translate(t_scale(d[0]), - 0.75 * baseRadius - tepaHeight / 2),
								width: d => t_scale(d[d.length - 1]) - t_scale(d[0]),
								height: 1.25 * baseRadius,
								fill: mergeColor[0],
								stroke: 'none'
							},
							icon:{
								class: 'iconElement',
								transform: `translate(${[RectWidth - tepaHeight, - tepaHeight - 10 - boxMargin.top - chartMargin / 2]})`
							}
						}
						cardAttrs = {
							body:{
								class: 'card',
								transform: `translate(${[- chartStart,  - tepaCard.height - boxMargin.top]})`
							},
							tepaCard:{
								class: 'shapeCard',
								transform: translate(chartStart, boxMargin.top),
								height: tepaCard.height,
								width: tepaCard.width,
								stroke: this._borderStyle.color,
								'stroke-width': 0.25,
								fill: 'none'
							},
							mergeCard:{
								class: 'mergeCard',
								transform: `translate(${[chartStart, tepaCard.height + chartMargin + boxMargin.top]})`,
								height: mergeCard.height,
								width: mergeCard.width,
								stroke: this._borderStyle.color,
								'stroke-width': 0.25,
								fill: 'none',
								display: d => barVisObject[d.indexName] ? 'block' : 'none'
							},
							outerCard:{
								class: 'outer',
								height: cardHeight,
								width: cardWidth,
								stroke: this._borderStyle.color,
								'stroke-width': 0.25,
								fill: 'white',
								rx: this._borderStyle.rx,
								ry: this._borderStyle.ry,
								filter: 'url(#card-shadow)'
							},
							rightLine:{
								stroke: d => d3.color(lc[d.month]).darker(0.5),
								y1: 0,//tepaHeight * 0.4,
								y2: cardHeight,
								x1: cardWidth,
								x2: cardWidth,
								'stroke-width': 2.5,
								class: 'rightLine'
							},
							iconBackGround:{
								transform: translate(boxMargin.left + textMargin.left, 0),
								y: -10,
								height: 20,
								width: 20,
								rx: 3.5,
								ry: 3.5,
								fill: 'white',
								'stroke': d => d3.color(lc[d.month]).darker(0.5),
								'stroke-width': 0.25
							},
							image:{
								href: d => processIcon[d.month],//padding=2.5
								height: 15,
								width: 15,
								transform: translate(boxMargin.left + textMargin.left + 2.5, -7.5)
							},
							maskLayer:{
								class: 'backgroundLayer',
								height: 10,
								width: d => d.indexName.length * 6.3 + 12,
								fill: 'white',
								transform: translate(boxMargin.left + textMargin.left + 22.5, - boxMargin.top/ 2 - 4)
							},
							text:{
								class: 'cardName',
								text: d => d.indexName,
								'text-anchor': 'start',
								fill: d => d3.color(lc[d.month]).darker(1),
								transform: translate(boxMargin.left + textMargin.left + 25, 0)
							}
						}
						const barWidth = textWidth,
							originX = -textMargin.right,
							orderScale = orderDatum.map(d => d3.scaleLinear().domain([0, d3.max(d)]).range([0, barWidth * 2 / 3]));
						arrowAttrs.orderLabel = {
							class: 'orderLabel',
							width: d => orderScale[d[1]](orderDatum[d[1]][d[0]]),
							height: tepaHeight/5,
							stroke: 'none',
							fill: d => d[1] === wm._indexScale ? 'url(#sort_pattern)' : util.delabelColor[0],
							transform: d => translate(originX - orderScale[d[1]](orderDatum[d[1]][d[0]]),
								-tepaHeight + (d[1] === wm._indexScale ? 0 : 
								(d[1] > wm._indexScale ?  tepaHeight/4 * d[1] :  tepaHeight/4 * (d[1] + 1))))
						}
						arrowAttrs.orderText = {
							class: 'orderText',
							'text-anchor': 'end',
							transform: d => translate(originX - orderScale[d[1]](orderDatum[d[1]][d[0]]),
								-tepaHeight + (d[1] === wm._indexScale ? 0 : 
								(d[1] > wm._indexScale ?  tepaHeight/4 * d[1] :  tepaHeight/4 * (d[1] + 1))) + tepaHeight/6),
							text: d => stringify(orderDatum[d[1]][d[0]]),
							fill: 'rgb(142, 154, 164)',
							'font-weight': 'normal',
							'font-style': 'normal',
							'font-size': '9px'
						}
					}
					function initSymbolDefs() {
						defG
						.call(g => g.append('defs')
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
						defG.call(g => g.append('defs')
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
					function initOrdinal(coefficient) {
						indexScale = d3.scaleOrdinal()
							.domain(indexArray)
							.range(sortedIndex(sortDomain(orderData, coefficient), true));
					}
					function renderyScale() {
						tepaHeight = chartHeight,
						mergeHeight = 1.5 * chartHeight;
						// clearAttrs();
						const cardHeight = d => (barVisObject[d] ? mergeHeight + chartPadding.vertical : 0) 
							+ tepaHeight  
							+ chartPadding.vertical + boxMargin.vertical 
							+ chartMargin * (barVisObject[d] ? 1 : 0);
						let invert = d3.scaleOrdinal().domain(indexScale.range()).range(indexScale.domain())
						rectHeight = indexArray.map((d, i) => cardHeight(indexSort[invert(+d)])+ cardMargin)
						
						rectHeight.unshift(0);
						let arr = Array.from(d3.cumsum(rectHeight));
						let translateY = arr.map(d => d - arr[merge_g]);
						translateY.pop();
						rectNum = translateY.filter((d, i) => d >= 0 && d + rectHeight[i + 1] - tepaHeight < 
							wm._height - wm._margin.bottom - wm._margin.bottom).length;
						yScaleCache = translateY.map(d => d - wm._height / 2 + wm._margin.top + tepaHeight);
						yScale = i => yScaleCache[indexScale(i)];
						displayfunc  = (_, i) => merge_g <= indexScale(i) && indexScale(i) < rectNum + merge_g 
							? 'block' : 'none';
						lastY = yScaleCache[rectNum + merge_g - 1] - tepaHeight + rectHeight[rectNum + merge_g] - cardMargin;
						initAttrs.call(wm);
						dataInfo.forEach((d, i) => {
							d.display = displayfunc(d, i);
							d.y = yScale(i) + cardHeight(d.indexName)/2 
							- tepaHeight - chartPadding.vertical - boxMargin.top;
						})
						wm._linkG && wm._renderLinkG();
					}
					function initDragG() {
						dragG.selectAll('dragGroup')
							.data(Object.keys(mergeOffset).slice(0, -1)).join('g')
							.call(g => updateElement(g, dragAttrs.body))
							.call(g => g
								.call(g => g.selectAll('g')
									.data(dataInfo)
									.join('g')
									.call(g => updateElement(g, dragAttrs.element))
									.call(g => addElement(g, 'line', dragAttrs.teqaLine))
									.call(g => addElement(g, 'line', dragAttrs.mergeLine))
									.call(g => addElement(g, 'rect', dragAttrs.dragBlock)))
								.call(d3.drag()
									.on('drag', dragMove)
								))
					}
					function dragMove(e, d) {    //update batch
						const minRange = tepaHeight + chartPadding.vertical;
						mergeOffset[d] = e.x
						mergeOffset = Array.from(mergeOffset);
						mergeOffset.unshift(0);
						var rectlength = d3.pairs(mergeOffset, (a, b) => b - a).filter((d, i) => i + 1 !== Math.ceil(maxLength / 2));
						if (!rectlength.every(d => d > minRange - 5)) {   //RectWidth/ maxLength/2
							minRect = minRange
						} else {
							minRect = (minRect == d3.min(rectlength)) ? d3.max(rectlength) : d3.min(rectlength);
						}
						if (RectWidth - (maxLength - 1) * minRect < RectWidth / maxLength) minRect = (RectWidth - RectWidth / maxLength) / (maxLength - 1)
						rectArray = new Array(maxLength).fill(minRect).map((d, i) => Math.ceil(maxLength / 2) == i + 1 ? RectWidth - (maxLength - 1) * minRect : d);
						mergeOffset = d3.cumsum(rectArray)
						dragG.selectAll('.dragGroup')
							.attr('transform', d => `translate(${[mergeOffset[d], 0]})`)
						initAttrs.call(wm);
						updateArea();
						updateShape();
						renderAxisG(timeScale);
						minRect !== minRange ? rectG.selectAll('g').remove() : initRectG();
					}
					function mouseText(dis) {// calculate abscissa
						let index = d3.leastIndex(mergeOffset, d => dis > d),//定位 position
							//index === 0 ? dis : dis - mergeOffset[index],
							mouseDate = new Date(timeScale[index].invert(dis)),
							allLabel = batchEX.map(d => d3.least(d[index], e => mouseDate > e.time));
						selectBarG(allLabel);
						wm._mouseList = allLabel[0].upid;
						// console.log(dis, mergeOffset, index, mouseDate, allLabel, batchEX)
						return allLabel.map(d => d.value)
					}
					function renderSort() {//render sortG
						const t = d3.transition()
							.duration(300)
							.ease(d3.easeLinear);
						updateCard(t);
						mergeG
							.transition(t)
							.call(g => updateElement(g.selectAll('.batchElement'), mergeAttrs.body))
						horizenG
							.transition(t)
							.call(g => updateElement(g.selectAll('.horizenElement'), horizenAttrs.body))
						dragG.transition(t)
							.call(g => updateElement(g.selectAll('.dragElement'), dragAttrs.element))
							.call(g => updateElement(g.selectAll('.mergeLine'), dragAttrs.mergeLine))
						rectG.selectAll('.rectElement')
							.transition(t)
							.call(g => updateElement(g, rectAttrs.element))
						barG.selectAll('g')
							.transition(t)
							.call(g => updateElement(g, barAttrs.body))
						renderAxisG(timeScale);
						textG
							.transition(t)
							.call(g => g.selectAll('text').call(t => updateElement(t, textAttrs.text)))
						textG.select('.mouseG').raise()
						textG.raise()
						if (wm._mouseDis !== undefined) {
							var mouseInfo = mouseText(wm._mouseDis);
							textG.selectAll('text')
								.transition(t)
								.text((d, i) => stringify(+mouseInfo[i]))
						}
						barG.raise()
						dragG.raise()
						clickG.raise()
					}
					function renderShape() {
						const t = d3.transition()
							.duration(300)
							.ease(d3.easeLinear);
						dragG.selectAll('.dragGroup')
							.transition(t)
							.call(g => updateElement(g.selectAll('.dragElement'), dragAttrs.element))
							.call(g => updateElement(g.selectAll('.mergeLine'), dragAttrs.mergeLine))
							.call(g => updateElement(g.selectAll('.teqaLine'), dragAttrs.teqaLine))
							.call(g => updateElement(g.selectAll('.dragBlock'), dragAttrs.dragBlock))
						if (wm._horizonView) {
							mergeG.selectAll('.batchElement')
								.transition(t)
								.call(g => updateElement(g, mergeAttrs.body))
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
						updateShape();
						updateBarG(t);
						textG
							.transition(t)
							.call(g => updateElement(g.select('line'), textAttrs.line))
					}
					function renderMergeChart() { //init switchG
						if (this._horizonView) {
							horizenG.selectAll('.horizenElement').remove();
							initMergeArea()
						} else {
							mergeG.selectAll('.batchElement').remove();
							initHorizenArea()
						}
					}
					function toggleChart() {
						barVisObject = Object.assign({}, ...dataInfo.map(d => { return { [d.indexName]: wm._barVis } }))
						renderyScale();
						renderSort();
					}
					function initBarG() {  //init BarG
						barG
							.selectAll('g').data(dataInfo).join('g')
							.call(g => updateElement(g, barAttrs.body))
							.call(g => addElement(g, 'rect', barAttrs.border))
							.call(g => g.selectAll('.goodSteel')
								.data((_, i) => barAttrs.barGoodData[i])
								.join('rect')
								.attr('class', 'goodSteel')
								.call(g => updateElement(g, barAttrs.goodSteel)))
							.call(g => g.selectAll('.badSteel')
								.data((_, i) => barAttrs.barBadData[i])
								.join('rect')
								.attr('class', 'badSteel')
								.call(g => updateElement(g, barAttrs.badSteel)))
					}
					function selectBarG(datum){
						datum.forEach(d => {
							barG.selectAll('g').filter(e => e.indexName === d.indexName)
								.call(g => g.selectAll('rect').attr('opacity', 0.5))
								.call(g => g.selectAll(d.flag ? '.badSteel' : '.goodSteel')
								.attr('opacity', e => d.value >= e.x0 && d.value <= e.x1 ?  1 : 0.5))
						})
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
						const barValue = dataInfo.map((_, i) => batchEX[i].flat()),
							barData = barValue.map((d, i) => d3.bin().thresholds(30)(d.map(e => e.value)).map(e => { e.index = i; return e })),
							barYscale = barData.map(d => d3.scaleLinear().domain([0, d3.max(d, f => f.length) * 1.1]).range([chartPadding.top, barAttrs.borderHeight])),
							barXscale = barData.map(d => d3.scaleLinear().domain([d3.min(d, f => f.x0), d3.max(d, f => f.x1)]).range([chartPadding.left, barAttrs.borderWidth])),
							barGoodData = barValue.map((d, i) => 
							d3.bin().thresholds(30)((d.filter(e => e.flag == 1)).map(e => e.value)).map(e => { e.index = i; return e })),
							barBadData = barValue.map((d, i) => d3.bin().thresholds(30)((d.filter(e => e.flag == 0)).map(e => e.value)).map(e => { e.index = i; return e }));
						return {
							barValue, barYscale, barXscale, barGoodData, barBadData, barData
						}
					}
					function initMouseG() {
						textG
							.call(g => addElement(g, 'line', textAttrs.line));
						textG.selectAll('text').data(dataInfo).join('text')
							.call(g => updateElement(g, textAttrs.text));
						let timer = null;
						let func = x => {
							
							textG.select('.mouseG')
								.attr('transform', `translate(${[x + 2, 0]})`)
								.attr('stroke', '#bbbcbd')
							textG.raise();
							let upid = wm._mouseList;
							mouseInfo = mouseText(x);
							if (upid !== wm._mouseList) {
								// mouseCircle(upid);
								// if(upid !== this._checkUpid)
								vm.$emit('wheelMouse', { upid: [upid], mouse: 1 });
								vm.$emit('wheelMouse', { upid: [wm._mouseList], mouse: 0 });
								if(upid !== this._checkUpid){
									vm.$emit('boxMouse', { upid: upid, activate: false });
									vm.$emit('boxMouse', { upid: wm._mouseList, activate: true });
								}
								mergeG.selectAll('circle').attr('r', d => d.upid === this._mouseList || d.upid === this._checkUpid? 2.5 : 1.5)
							}
							wm._mouseDis = x;
							textG.selectAll('text')
								.call(g => updateElement(g, textAttrs.text));
						};
						sliderG.on('mousemove', e => {
							let x = d3.pointer(e)[0];
							if (x <= 0) return;
							if(timer){
								clearTimeout(timer)
							}
							timer = setTimeout(() => {
								func(x)
							}, 20);
						})
						.on('mouseleave', (e, d) => {
							vm.$emit('wheelMouse', { upid: [wm._mouseList], mouse: 1 });
							if(wm._mouseList !== this._checkUpid)vm.$emit('boxMouse', { upid: wm._mouseList, activate: false })
							mergeG.selectAll('circle').attr('r', d => d.upid === this._checkUpid ? 2.5 : 1.5);
						})
						.on('click', e => {
							let x = d3.pointer(e)[0];
							if (x <= 0 || x > mergeOffset[mergeOffset.length - 1])return;

							let index = d3.leastIndex(mergeOffset, d => x > d),//定位 position
								mouseDate = new Date(timeScale[index].invert(x)),
								allLabel = batchEX.map(d => d3.least(d[index], e => mouseDate > e.time)),
								upid = allLabel[0].upid;

							if(upid === this._checkUpid){
								vm.$emit('boxMouse', { upid: this._checkUpid, activate: false })
								this._checkUpid = '';
								this._lineVis = false;
								clickG.attr('display', 'none');
							}else{
								// vm.$emit('boxMouse', { upid: this.upid, activate: true })
								this._checkUpid = upid;
								clickG
									.attr('transform', `translate(${[x, 0]})`)
									.attr('display', 'block');
								this._lineVis = true;
							}
							clickG.select('text').text(this._checkUpid);
							this._updateBoxLine();
						})
					}
					function initRectG() {
						rectG
							.attr('transform', sliderAttrs.transform)
							.selectAll('.rectG').data(Object.keys(mergeOffset).filter((d, i) => i !== Math.ceil(maxLength / 2) - 1))
							.join('g')
							.call(g => updateElement(g, rectAttrs.body))
							.call(g => g.selectAll('g')
								.data(d => horizenEX[+d])
								.join('g')
								.call(g => updateElement(g, rectAttrs.element))
								.call(g => addElement(g, 'rect', rectAttrs.background))
								.call(g => addElement(g, 'rect', rectAttrs.card)
									.on('mousemove', e => {
										e.stopPropagation()
									}))
								.call(g => addElement(g, 'polygon', rectAttrs.leftPolygon))
								.call(g => addElement(g, 'polygon', rectAttrs.rightPolygon)))
						rectG.raise()
					}
					function initAxisG(batchTimeScale) { //init timeTick
						sliderG.selectAll('.axisG').data(mergeOffset)
							.join('g')
							.attr('class', 'axisG')
							.attr('transform', translate(0, lastY))
							.call(g => g
								.style('font', '6px')
								.style('font-weight', 'normal')
								.style('color', 'grey')
								.each(function (_, i) {
									d3.select(this)
										.call(d3.axisBottom(batchTimeScale[i])
											.ticks(Math.floor(rectArray[i]/35))
											.tickFormat((d, i) => i === 0 ? d3.timeFormat('%d %H:%M')(d) : d3.timeFormat('%d %H:%M')(d))
											.tickSize(2)
											.tickPadding(2.5)
										)
								})
							)
					}
					function renderAxisG(batchTimeScale) {// render timeTick
						axisAttrs = {
							'transform': 'translate(0, 10) rotate(25)',
							fill: 'grey',
							'font-weight': 'bold',
							'font-size': '8px',
							'font-family': "Gill Sans,Gill Sans MT,Calibri,Trebuchet MS,sans-serif"
						}
						sliderG.selectAll('.axisG')
							.transition(d3.transition()
								.duration(200)
								.ease(d3.easeLinear))
							.attr('transform', translate(0, lastY))
							.each(function (_, i) {
								d3.select(this)
									.call(d3.axisBottom(batchTimeScale[i])
										.ticks(rectArray[i] < 60 ? 1 : 3)
										.tickFormat((d, i) => i === 0 ? d3.timeFormat('%d %H:%M')(d) : d3.timeFormat('%d %H:%M')(d))
										.tickSize(2)
										.tickPadding(2.5)
									)
							})
							.call(g => updateElement(g.selectAll('text'), axisAttrs));
					}
					function updateArea() {
						const t = d3.transition()
							.duration(100)
							.ease(d3.easeLinear);
						if (wm._horizonView) {
							mergeG.selectAll('.batchElement')
								.transition(t)
								.call(g => updateElement(g, mergeAttrs.body))
								.call(g => g.selectAll('.path4').attr('d', mergeAttrs.mergeArea[4]))
								.call(g => g.selectAll('.path3').attr('d', mergeAttrs.mergeArea[3]))
								.call(g => g.selectAll('.path2').attr('d', mergeAttrs.mergeArea[2]))
								.call(g => g.selectAll('.path1').attr('d', mergeAttrs.mergeArea[1]))
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
						// linearGradientAttrs
					}
					function offsetParameter(arr) {
						return arr.flat().map(d => {
							return {
								offset: mergeAttrs.translateX[d.i](d.time) / mergeOffset[mergeOffset.length - 1], //d.index/arr.length.toString()
								color: d.ovrage ? 'red' : 'blue',//util.labelScale(d.level),
							}
						})
					}
					function areaParameter(mergeHeight) {	//area function
						let range = Array.from(d3.cumsum(rectArray));
						range.unshift(0);
						let rangeArray = d3.pairs(range);
						let xBatch = rangeArray.map((d, i) => d3.scaleLinear().range(d)
						.domain(d3.extent(batchEX[0][i], e => e.time)));
						let yBatch = batchEX.map(d => d3.scaleLinear().range([0, mergeHeight])
							.domain([d3.min(d.flat().map(d => d.min)) * 0.95, d3.max(d.flat().map(d => d.max)) * 1.05]));
						let mergeArea = [
							d3.area()
								.x(d => xBatch[d.i](d.time))
								.y0(d => -yBatch[d.d](d.sxl))
								.y1(d => -yBatch[d.d](d.sxh)),
							d3.area()
								.x(d => xBatch[d.i](d.time))
								.y0(d => -yBatch[d.d](d.l))
								.y1(d => -yBatch[d.d](d.exl)),
							d3.area()
								.x(d => xBatch[d.i](d.time))
								.y0(d => -yBatch[d.d](d.h))
								.y1(d => -yBatch[d.d](d.exh)),
							d3.area()
								.x(d => xBatch[d.i](d.time))
								.y0(d => -yBatch[d.d](d.exl))
								.y1(d => -yBatch[d.d](d.sxl)),
							d3.area()
								.x(d => xBatch[d.i](d.time))
								.y0(d => -yBatch[d.d](d.exh))
								.y1(d => -yBatch[d.d](d.sxh))
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
							.call(g => updateElement(g, mergeAttrs.body))
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
							.call(g => g.selectAll('.line').data(d => divideData(d.flat()))
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
								.attr('fill', 'white')
								.attr('stroke', d => d3.color(util.labelScale(Math.abs(d.range))).darker(1))
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
							.call(g => updateElement(g, horizenAttrs.body))
							.call(g => g.append('clipPath')
								.attr('id', (d, i) => `clipy${i}`)
								.append('rect')
								.attr('width', mergeOffset[mergeOffset.length - 1])
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
					function initArrowGroup() {
						tepaChart.selectAll('.tepaElement')
							.data(dataInfo)
							.join('g')
							.call(g => updateElement(g, arrowAttrs.body))

							.call(
								g => g.append('g')
									.call(g => updateElement(g, cardAttrs.body))
									.call(g => addElement(g, 'rect', cardAttrs.outerCard))
									.call(g => addElement(g, 'rect', cardAttrs.tepaCard))
									.call(g => addElement(g, 'rect', cardAttrs.mergeCard))
									.call(g => addElement(g, 'line', cardAttrs.rightLine))
									.call(g => addElement(g, 'rect', cardAttrs.iconBackGround))
									.call(g => addElement(g, 'image', cardAttrs.image))
									.call(g => addElement(g, 'rect', cardAttrs.maskLayer))
									.call(g => addElement(g, 'text', cardAttrs.text))
							)
							.call(g => g.selectAll('.orderLabel').data(
								(_, i) => new Array(4).fill(0).map((_, f) => [i, f]))
									.join('g')
										.call(g => addElement(g, 'rect', arrowAttrs.orderLabel))
										.call(g => addElement(g, 'text', arrowAttrs.orderText))
								)
							.call(g => g.selectAll('.single')
								.data((d, i) => arrowData(batchEX[i].flat()).single)
								.join('path')
								.call(g => updateElement(g, arrowAttrs.singleAttrs)))
							.call(g => g.selectAll('.intersection')
								.data((d, i) => arrowData(batchEX[i].flat()).intersection)
								.join('g')
									.attr('class', 'intersection')
									.call(g => addElement(g, 'path', arrowAttrs.interArrow))
									.call(g => addElement(g, 'rect', arrowAttrs.interLine)))

							.call(g => g.append('g')
								.call(g => updateElement(g, arrowAttrs.icon))
									.call(g => g.append('circle').attr('transform', 'translate(10, 10)')
									.attr('fill', 'white')
									.attr('stroke', 'black')
									.attr('stroke-width', 0.25)
									.attr('filter', 'url(#card-shadow)')
									.attr('r', 10))
								.call(g => g.append('g').attr('transform', 'scale(0.02)')
									.call(g => g.append('path').attr('d', queryIcon[0]).attr('fill', '#53abe5'))
									.call(g => g.append('path').attr('d', queryIcon[1]).attr('fill', '#53abe5')))
								.on('click', function (e, d) {
									e.stopPropagation();
									e.preventDefault();
									barVisObject[d.indexName] = !barVisObject[d.indexName];
									renderyScale();
									renderSort();
								})
							)

							.on('click', e =>{
								e.stopPropagation();
								e.preventDefault();
							})
							.on('mousemove', (e, d) =>{
								// console.log('mouseenter')
								steelMouse(d.indexName, d.month)
								// e.stopPropagation();
								// e.preventDefault();
							})
							.on('mouseleave', (e, d) => {
								// console.log('mouseleave')
								resetSteel()
							})
					}
					function steelMouse(indexName, process){
						if(indexName === wm._selectIndex)return;
						wm._selectIndex = indexName;
						wm._selectProcess = process;
						wm._mouseLinkG();
						const t = d3.transition().duration(150).ease(d3.easeLinear);
						tepaChart
							.transition(t)
							.selectAll('.tepaElement')
							.attr('opacity', d => d.indexName === indexName ? 1 : 0.4)
						horizenG
							.transition(t)
							.selectAll('.horizenElement')
							.attr('opacity', d => d[0].indexName === indexName ? 1 : 0.4)
						mergeG
							.transition(t)
							.selectAll('.batchElement')
							.attr('opacity', d => d[0][0].indexName === indexName ? 1 : 0.4)
						rectG.transition(t)
							.selectAll('.rectElement')
							.attr('opacity', d => d[0].indexName === indexName ? 1 : 0.4)
						barG
							.transition(t)
							.selectAll('g')
							.attr('opacity', d => d.indexName === indexName ? 1 : 0.4)
					}
					function resetSteel(){
						wm._selectIndex = '';
						wm._resetLinkG();
						const t = d3.transition().duration(150).ease(d3.easeLinear);
						tepaChart
							.transition(t)
							.selectAll('.tepaElement')
							.attr('opacity', 1);
						horizenG
							.transition(t)
							.selectAll('.horizenElement')
							.attr('opacity', 1)
						mergeG
							.transition(t)
							.selectAll('.batchElement')
							.attr('opacity', 1)
						rectG.transition(t)
							.selectAll('.rectElement')
							.attr('opacity', 1)
						barG
							.transition(t)
							.selectAll('g')
							.attr('opacity', 1)
					}
					function updateCard(t){
						tepaChart.selectAll('.tepaElement')
							.transition(t)
							.call(g => updateElement(g, arrowAttrs.body))
						.call(g => updateElement(g.select('.card'), cardAttrs.body))
							.call(g => updateElement(g.select('.outer'), cardAttrs.outerCard))
							.call(g => updateElement(g.select('.mergeCard'), cardAttrs.mergeCard))
							.call(g => updateElement(g.select('.shapeCard'), cardAttrs.tepaCard))
							.call(g => updateElement(g.select('.rightLine'), cardAttrs.rightLine))
						.call(g => updateElement(g.selectAll('.orderText'), arrowAttrs.orderText))
						.call(g => updateElement(g.selectAll('.orderLabel'), arrowAttrs.orderLabel))
					}
					function updateShape() {
						const t = d3.transition().duration(150).ease(d3.easeLinear);
						tepaChart.transition(t)
							.call(g => updateElement(g.selectAll('.single'), arrowAttrs.singleAttrs))
							.call(g => updateElement(g.selectAll('.interArrow'), arrowAttrs.interArrow))
							.call(g => updateElement(g.selectAll('.interLine'), arrowAttrs.interLine))
							.call(g => updateElement(g.selectAll('.iconElement'), arrowAttrs.icon))
					}
					function updateSort(coefficient){
						initOrdinal(coefficient);
						merge_g = 0;
						renderyScale()
						renderSort()
					}
					function updateBar() {
						chartHeight = wm._sliderValue;
						renderyScale();
						renderShape();
						renderSort();
					}
					return {
						updateBar,
						updateSort,
						renderMergeChart,
						toggleChart
					}
				}
				_renderMainBox(){
					const wm = this,
						lc = this._labelcolor,
						mainG = this._mainG,
						plot_offset = this._boxChart,
						allData = this._keys.map((d, i) => d.map(e => {return {'name' : e, process: i}})).flat(),
						coordinate = [this._cardWidth + this._horizonPadding, -wm._height / 2 + wm._margin.top],
						plotG = mainG.append('g').attr('id', 'plotGroup').attr('transform', translate(...coordinate));
					this._boxMap = Object.fromEntries(allData.map(d => [d.name, 0]));
					this._boxData = Object.fromEntries(allData.map(d => [d.name, d]));
					let plotGroup = null,
						boxPlotAttrs = null;
					
					initAttrs.call(this);
					for(let index in allData){
						let item = allData[index];
						item.datum = this._processData[item.name];
					}
					function initAttrs(){
						boxPlotAttrs = {
							background: {
								fill: 'white',
								stroke: 'none',
								width: plot_offset.w,
								height: this._height
							},
							border:	{
								height: plot_offset.h,
								width: plot_offset.w,
								rx: this._borderStyle.rx,
								ry: this._borderStyle.ry,
								'stroke-width': 0.25,
								fill: 'none',
								filter: 'url(#card-shadow)',
								stroke: this._borderStyle.color
							},
							iconBackGround: {
								transform: translate(8, 0),
								y: -10,
								height: 20,
								width: 20,
								rx: 3.5,
								ry: 3.5,
								fill: 'white',
								'stroke': d => d3.color(lc[d.process]).darker(0.5),
								'stroke-width': 0.25
							},
							image:{
								href: d => boxIcon[d.name],//padding=2.5
								height: 15,
								width: 15,
								y: -7.5,
								transform: translate(8 + 2.5, 0)
							},
							text: {
								text: d => d.name,
								transform: translate(36, 2),
								fill: d => d3.color(lc[d.process]).darker(1),
								class: 'cardName',
							},
							textBackGround: {
								transform: translate(32, -5),
								height: 10,
								width: d => {
									const width = plotGroup
										.filter(e => e.name === d.name)
										.select('.cardName')
										.node().getBBox().width;
									return width + 8;
								},
								fill: 'white'
							},
							body: {
								id: d => d.name,
								class: 'plotChart'
							},
							leftLine:{
								stroke: d => lc[d.process],//d3.color(lc[d.process]).darker(0.5),
								y1: 0,
								y2: plot_offset.h,
								'stroke-width': 2.5
							}
						}
					}
					plotG
						.call(g => addElement(g, 'rect', boxPlotAttrs.background));
					plotGroup = plotG.selectAll('g')
						.data(allData)
						.join('g');
					this._BoxGroup = plotGroup;
					
					plotGroup
						.call(g => addElement(g, 'rect', boxPlotAttrs.border))
						.call(g => addElement(g, 'rect', boxPlotAttrs.iconBackGround))
						.call(g => addElement(g, 'image', boxPlotAttrs.image))
						.call(g => addElement(g, 'rect', {}).attr('class', 'textBack'))
						.call(g => addElement(g, 'text', boxPlotAttrs.text))
						.call(g => updateElement(g.selectAll('.textBack'), boxPlotAttrs.textBackGround))
						.call(g => addElement(g, 'line', boxPlotAttrs.leftLine))
						.call(g => addElement(g, 'g', boxPlotAttrs.body))
					this._boxInstances = allData.map(d => {
						if(d.process === 1){
							let res = new boxplot(plotG.select(`#${d.name}`), this._vNode).enter({
								data: d.datum,
								func: preRoll,
								width: plot_offset.w,
								height: plot_offset.h,
								label: d.name
							}).render();
							d.chart = res;
							return res;
						}else{
							let res = new heatplot(plotG.select(`#${d.name}`), this._vNode).enter({
								data: d.datum,
								func: preHeat,
								width: plot_offset.w,
								height: plot_offset.h,
								label: d.name,
								color: lc[d.process]
							}).render()
							d.chart = res;
							return res;
						}
					});
					this._boxSort();
					this._scaleBox(3);
					plotG
						.on('wheel', (e) => {
							let num = this._wheelBox;
							e.stopPropagation();
							e.preventDefault();
							let len = this._selectDevice === 3 ? this._boxkeys.length : this._keys.length;
							if (num < len - 1 && num > 0) {
								this._wheelBox += (e.deltaY > 0 ? 1 : -1);
							} else if (num == 0) {
								this._wheelBox += (e.deltaY > 0 ? 1 : 0);
							} else if (num == len - 1) {
								this._wheelBox += (e.deltaY > 0 ? 0 : -1);
							} else {
								return
							}
							this._scaleBox(this._selectDevice);
						})
						.on('mouseover', function (e) { })
						.on('mouseout', function (e) { })
						.on('zoom', (e)=>{
							e.stopPropagation();
							e.preventDefault();
						});
					
				}

				_scaleBox(flag){
					let keys = null,
						box = this._boxChart;
					if(flag === 3){
						keys = this._boxkeys;
					}else{
						keys = this._keys[flag];
					}
					let order = d3.scaleOrdinal().domain(keys).range(sortedIndex(keys.map(d => this._boxMap[d]), true)),
						rectHeight = new Array(keys.length).fill(box.h + box.gap);
					rectHeight.unshift(0);   //定位第一个元素
					let yCoordinate = Array.from(d3.cumsum(rectHeight)),
					plot_num = yCoordinate.filter(d => d + box.h < this._height - this._margin.top - this._margin.bottom).length;
					let display = d => (keys.indexOf(d) !== -1) 
						&& this._wheelBox <= order(d) 
						&& order(d) < plot_num + this._wheelBox
						? 'block' : 'none';
					let baseHeight = yCoordinate[0] - yCoordinate[this._wheelBox];
					let transform = d => `translate(${[0, yCoordinate[order(d.name)] + baseHeight]})`;
					this._boxYScale = d => yCoordinate[order(d)] + baseHeight - this._height / 2 + this._margin.top + box.h/2;
					this._boxDisplay = display;
					let t = d3.transition().duration(150).ease(d3.easeLinear);
					this._BoxGroup.transition(t)
						.attr('display', d => display(d.name))
						.call(g => g.filter(d => keys.indexOf(d.name) !== -1).attr('transform', transform))
					
					this._linkG && this._renderLinkG();
				}

				_initLinkG(){
					this._linkG = this._mainG.append('g')
						.attr('class', 'indexNameLinkGroup')
						.attr('transform', translate(this._cardWidth + this._horizonPadding, 0));
					this._linkGroupAttrs = {
						'id': d => `link_group_${d.indexName}`,
						'class': 'linkElement',
						display: d => d.display
					},
					this._linkAttrs = {
						'stroke-width': 1.5,
						fill: 'none',
						stroke: d => d3.color(this._labelcolor[d[0].process]).darker(0.5),
						class: d => `link_${d[1]}`,
						display: d => this._boxDisplay(d[1]),
						d: d =>  d3.line().x(e => e[0])
							.y(e => e[1]).curve(d3.curveBumpX)
							([[-this._horizonPadding, d[0].y], [0, this._boxYScale(d[1])]])
					}
					const linkData = d => {
						let res = this._keys[d.process].map(e => [d, e]);
						return res;
					}

					this._linkG.selectAll('.linkElement')
						.data(this._chartData)
						.join('g')
						.call(g => updateElement(g, this._linkGroupAttrs))
						.call(g => g.selectAll('path').data(linkData)
							.join('path')
							.call(g => updateElement(g, this._linkAttrs))
							.on('mouseover', this._stopPropagation)
        			.on('mouseout', this._stopPropagation))
				}

				_renderLinkG(){
					let t = d3.transition().duration(150).ease(d3.easeLinear);
					this._linkG
						.transition(t)
						.selectAll('.linkElement')
						.call(g => updateElement(g, this._linkGroupAttrs))
						.call(g => updateElement(g.selectAll('path'), this._linkAttrs))
				}

				_mouseLinkG(){
					let t = d3.transition().duration(150).ease(d3.easeLinear);
					this._linkG
						.transition(t)
						.selectAll('.linkElement')
						.attr('opacity', d => d.indexName === this._selectIndex ? 1 : 0.4)

					this._BoxGroup.transition(t)
						.attr('opacity', d => d.process === this._selectProcess ? 1 : 0.4)
				}

				_resetLinkG(){
					let t = d3.transition().duration(150).ease(d3.easeLinear);
					this._linkG
						.transition(t)
						.selectAll('.linkElement')
						.attr('opacity', 1)
					this._BoxGroup.transition(t)
						.attr('opacity', 1)
				}

				_initDefs(){
					const defsG = this._container.append('g')
						.attr('class', 'defsG');
					defsG.append('defs')
						.call(g => g.append('filter')
							.attr('id', 'card-shadow')
								.call(g => g.append('feDropShadow')
									.attr('dx',0)
									.attr('dy', 0)
									.attr('stdDeviation', 2.5)
									.attr('flood-color', '#bfbdbd')));//#ededed
				}

				_initLeftGroup(){
					const startX = 0,//this._buttonGroup.x
						lineAttrs = {
						x1: 0,
						x2: 120,
						'stroke': '#6d7885',
						'stroke-width': 0.5,
						'stroke-dasharray': '30 60'
					},
					textAttrs = {
						'class': 'leftTitle',
						transform: translate(60, 0),
						fill: '#6d7885'
					};
					this._leftGroup
						.append('rect')
						.attr('id', 'backGround')
					this._leftGroup
						.append('g')
						.attr('transform', translate(startX, this._leftButton(-0.8)))
						.call(g => addElement(g, 'line', lineAttrs))
						.call(g => addElement(g, 'text', textAttrs).text('interactive'))
					this._initZoom(startX + 10, 0);
					this._initVisG(startX + 70, 0);//10 40 10 10 40 10 === 120
					this._initSwitch(d => 10 + 60 * d + startX, 1);
					this._initSlider(startX + 10, 2);

					this._leftGroup
						.append('g')
						.attr('transform', translate(startX, this._leftButton(3.3)))
						.call(g => addElement(g, 'line', lineAttrs))
						.call(g => addElement(g, 'text', textAttrs).text('sortAttrs'))
					this._initSort(10 + startX, 4.2);
					
					this._leftGroup
						.append('g')
						.attr('transform', translate(startX, this._leftButton(8.5)))
						.call(g => addElement(g, 'line', lineAttrs))
						.call(g => addElement(g, 'text', textAttrs).text('boxState'))

					this._initProcessButton(d => 10 + 60 * d + startX, 9.3);
					this._initBoxSort(d => 10 + 60 * d + startX, 11.3);
					const node = this._leftGroup.node().getBBox();
					this._leftGroup.select('#backGround')
						.attr('height', node.height + 20)
						.attr('width', node.width + 20)
						.attr('y', node.y - 5)
						.attr('x', node.x - 5)
						.attr('stroke', '#ccc')
						.attr('fill', 'white')
						.attr('stroke-width', 0.5);
				}

				_initZoom(abscissa, num){
					const zoomG = this._leftGroup.append('g').attr('class', 'zoomG');
					zoomG
						.attr('transform', translate(abscissa, this._leftButton(num)))
						.call(g => addElement(g, 'rect', this._staticButton.rect)
							.attr('fill', this._zoomStatus ? this._buttonColor : 'white'))
						.call(g => addElement(g, 'text', this._staticButton.text)
							.attr('fill', this._zoomStatus ? 'white' : this._buttonColor)
							.text('zoom'));
					zoomG.on('click', () => {
						this._zoomStatus = !this._zoomStatus;
						let t = d3.transition().duration(150).ease(d3.easeLinear);
						if(!this._zoomStatus){
							this._g.transition(t).attr('transform', 'translate(0,0)');;
						}
						zoomG.transition(t)
							.call(g => g.select('rect').attr('fill', this._zoomStatus ? this._buttonColor : 'white'))
							.call(g => g.select('text').attr('fill', this._zoomStatus ? 'white' : this._buttonColor))
					})
				}

				_initSwitch(abscissa, num){//init switchG
					const switchG = this._leftGroup.append('g').attr('class', 'switchG'),
						switchAttrs = {
							transform: d => translate(abscissa(d), this._leftButton(num)),
							text: ['Horizon', 'River'],
							color: this._buttonColor,
							colorfunc: (v1, v2) => d => this._horizonView == Boolean(d) ? v1 : v2
						};
					switchG.selectAll('g').data([0, 1]).join('g')
						.attr('transform', switchAttrs.transform)//280  - 100
						.call(g => addElement(g, 'rect', this._staticButton.rect)
							.attr('fill', switchAttrs.colorfunc(switchAttrs.color, '#fff')))
						.call(g => addElement(g, 'text', this._staticButton.text)
							.attr('fill', switchAttrs.colorfunc('#fff', switchAttrs.color))
							.text(d => switchAttrs.text[d]))
						.on('click', (e, d) => {
							if (this._horizonView !== Boolean(d)) {
								this._horizonView = Boolean(d);
								let t = d3.transition()
									.duration(300)
									.ease(d3.easeLinear);
								switchG.selectAll('rect')
									.transition(t)
									.attr('fill', switchAttrs.colorfunc(switchAttrs.color, '#fff'));
								switchG.selectAll('text')
									.transition(t)
									.attr('fill', switchAttrs.colorfunc('#fff', switchAttrs.color));
								this._barInstance.renderMergeChart.call(this);
							}
						})
				}

				_initVisG(abscissa, num){
					const visG = this._leftGroup.append('g').attr('class', 'visG');
					visG
						.attr('transform', translate(abscissa, this._leftButton(num)))
						.call(g => addElement(g, 'rect', this._staticButton.rect)
							.attr('fill', this._barVis ? this._buttonColor : 'white'))
						.call(g => addElement(g, 'text', this._staticButton.text)
							.attr('fill', this._barVis ? 'white' : this._buttonColor)
							.text('vis'));
					visG.on('click', (e, d) => {
						this._barVis = !this._barVis;
						visG.select('rect').attr('fill', this._barVis ? this._buttonColor : 'white')
						visG.select('text').attr('fill', this._barVis ? 'white' : this._buttonColor);
						this._barInstance.toggleChart();
					})
				}

				_initSlider(abscissa, num){
					const wm = this,
						width = 50,
						sliderHeight = 6,
						xScale = d3.scaleLinear().domain([-width, width]).range([25, 60]);
					const sliderGroup = this._leftGroup.append('g')
						.attr('class', 'sliderGroup')
						.attr('transform', translate(abscissa + width, this._leftButton(num)));
						// .attr('transform', `translate(${[100, - this._height/2 + 2.5]})`);
					let debounce = (value) => {
						clearTimeout(this._sliderTimer)
						this._sliderTimer = setTimeout(() => {
							this._sliderValue = value;
							this._barInstance.updateBar()
						}, 500)
					},
					offsetX = 0;
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
						.on('mousemove', function(e){
							wm._vNode.removeTooltip();
							let num = xScale(d3.select(this).attr('cx'));
							wm._vNode.$nextTick(()=> wm._vNode.showTooltip({
								x: e.pageX,y: e.pageY - 2,
								background: 'white',
								stroke: '#6d7885',
								tspan: [`cardHeight: ${stringify(num)}`],
								fill: '#6d7885'
							}));
						})
						.on('mouseleave', () => {
							wm._vNode.removeTooltip();
						})
				}

				// _initSort(abscissa, num) {//init sortG
				// 	const text = ['Single', 'Indicators', 'Total'],
				// 		sortAttrs = {
				// 			transform: d => translate(abscissa(d), this._leftButton(num)),
				// 			text: d => text[d],
				// 			sortChange: (value1, value2) => d => d === (this._indexScale !== undefined ? this._indexScale : 0) ? value1 : value2
				// 		},
				// 		sortG = this._leftGroup.append('g').attr('class', 'sortG');
				// 	sortG.selectAll('g')
				// 		.data([0, 1, 2])
				// 		.join('g')
				// 		.attr('transform', sortAttrs.transform)
				// 		.call(g => addElement(g, 'rect', this._staticButton.rect)
				// 			.attr('fill', sortAttrs.sortChange(this._buttonColor, '#fff')))
				// 		.call(g => addElement(g, 'text', this._staticButton.text)
				// 			.attr('fill', sortAttrs.sortChange('#fff', this._buttonColor))
				// 			.text(sortAttrs.text))
				// 		.on('click', (_, d) => {
				// 			let t = d3.transition().duration(50).ease(d3.easeLinear);
				// 			this._indexScale = d;
				// 			sortG
				// 			.transition(t)
				// 			.call(g => g.selectAll('rect').attr('fill', sortAttrs.sortChange(this._buttonColor, '#fff')))
				// 			.call(g => g.selectAll('text').attr('fill', sortAttrs.sortChange('#fff', this._buttonColor)))
				// 			// merge_g = 0; //when sort indexes, save merge_g status or not
				// 			this._barInstance.updateSort(d);
				// 		})
				// }

				_initSort(abscissa, num) {//init sortG
					const wm = this,
						width = 50,
						sliderHeight = 6,
						xScale = d3.scaleLinear().domain([-width, width]).range([0, 1]);
					this._coefficient = [0.1, 0.3, 0.5, 0.1];
					const text = ['firstTime', 'overNum', 'extremum', 'speNum'],
						sortAttrs = {
							transform: d => translate(abscissa + width, this._leftButton(num + d))
						},
						sortG = this._leftGroup.append('g').attr('class', 'sortG');
					sortG.selectAll('g')
						.data([0, 1, 2, 3])
						.join('g')
						.attr('transform', sortAttrs.transform)
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
							.attr('width', d =>  xScale.invert(this._coefficient[d]) + width))
						.call(g => g.append('text')
								.attr('class', 'sortAttrs')
								.attr('transform', translate(-35, 0))
								.attr('fill', '#6d7885')
								.text(d => `${text[d]}:`))
						.call(g => g.append('text')
								.attr('class', 'sortNum')
								.attr('transform', translate(0, 0))
								.attr('fill', '#6d7885')
								.text(d => `${stringify(this._coefficient[d])}`))
						.call(g => g.append('circle')
							.attr('r', 5)
							.attr('cx', d => xScale.invert(this._coefficient[d]))
							.attr('cy', this._buttonStyle.height/2)
							.attr('stroke', this._buttonColor)
							.attr('stroke-width', 1.5)
							.attr('fill', 'white')
							.style('cursor', 'move')
							.call(d3.drag()
								.on('start', dragStart)
								.on('drag', drag)
								.on('end', dragEnd))
							.on('mousemove', function(e, d){
								wm._vNode.removeTooltip();
								let num = xScale(d3.select(this).attr('cx'));
								wm._vNode.$nextTick(()=> wm._vNode.showTooltip({
									x: e.pageX,y: e.pageY - 2,
									background: 'white',
									stroke: '#6d7885',
									tspan: [`${text[d]}: ${stringify(num)}`],
									fill: '#6d7885'
								}));
							})
							.on('mouseleave', () => {
								wm._vNode.removeTooltip();
							}))
					let timer = null,
						debounce = (d, value) => {
						clearTimeout(timer)
						timer = setTimeout(() => {
							this._coefficient[d] = value;
							// console.log(this._coefficient);
							this._barInstance.updateSort(this._coefficient);
						}, 200)
					},
					offsetX = new Array(4).fill(0);
					function dragStart(event, d){
						offsetX[d] = event.x - d3.select(this).attr('cx')
					}
					function drag(event, d){
						if(Math.abs(event.x - offsetX[d]) >= width){
							d3.select(this).attr('cx', event.x - offsetX[d] > width ? width : -width);
						}else{
							d3.select(this).attr('cx', event.x - offsetX[d]);
						}
						sortG.selectAll('.overLayer').filter(e => e === d).attr('width', +d3.select(this).attr('cx') + width);
					}
					function dragEnd(_, d){
						offsetX[d] = d3.select(this).attr('cx');
						sortG.selectAll('.overLayer').filter(e => e === d).attr('width', + offsetX[d] + width);
						sortG.selectAll('.sortNum').filter(e => e === d).text(d => `${stringify(xScale(offsetX[d]))}`);
						debounce.bind(wm)(d, xScale(offsetX[d]))
					}
				}

				_initBoxLine(){
					const lineButtonG = this._rightGroup.append('g').attr('class', 'lineButtonG');
					lineButtonG
						.attr('cursor', 'pointer')
						.attr('transform', this._rightButton(0))
						// .attr('transform', `translate(${[this._cardWidth + this._horizonPadding + 20, - this._height / 2 + 2.5]})`)
					lineButtonG
						.call(g => addElement(g, 'rect', this._staticButton.rect)
							.attr('fill', this._lineVis ? this._buttonColor : 'white'))
						.call(g => addElement(g, 'text', this._staticButton.text)
							.attr('fill', this._lineVis ? 'white' : this._buttonColor)
							.text('line'));
					let temp = 0;
					lineButtonG.on('click', () => {
						this._lineVis = !this._lineVis;
						if(!this._lineVis){
							temp = this._checkUpid;
							this._checkUpid = '1';
						}else{
							this._checkUpid = temp;
						}
						this._updateBoxLine();
					})
					this._lineButtonG = lineButtonG;
				}

				_updateBoxLine(){
					this._boxInstances.forEach(d => d._renderChart(this._checkUpid));//'21311185000'
					if(this._checkUpid !== ''){
						this._wheelBox = 0;
						this._sortDevice = true;
					}
					this._boxSort();
					this._scaleBox(this._selectDevice);
					// console.log(this._boxMap, this._boxData)
					// let t = d3.transition().duration(150).ease(d3.easeLinear);
					// this._lineButtonG.transition(t)
					// 	.call(g => g.select('rect')
					// 	.attr('fill', this._lineVis ? this._buttonColor : 'white'))
					// 	.call(g => g.select('text')
					// 	.attr('fill', this._lineVis ? 'white' : this._buttonColor))
				}

				_initProcessButton(abscissa, num){
					const deviceAttrs = {
						transform: d => translate(abscissa(d % 2), this._leftButton(num + (d >= 2 ? 1 : 0))),
						text: d => ['heat', 'roll', 'cool', 'all'][d],
						deviceChange: (value1, value2) => d => d === this._selectDevice ? value1 : value2
					},
						deviceG = this._leftGroup.append('g').attr('class', 'deviceG');
					deviceG.selectAll('g')
						.data([0, 1, 2, 3])
						.join('g')
						.attr('transform', deviceAttrs.transform)
						.call(g => addElement(g, 'rect', this._staticButton.rect)
							.attr('fill', deviceAttrs.deviceChange(this._buttonColor, '#fff')))
						.call(g => addElement(g, 'text', this._staticButton.text)
							.attr('fill', deviceAttrs.deviceChange('#fff', this._buttonColor))
							.text(deviceAttrs.text))
						.on('click', (_, d) => {
							this._wheelBox = 0;
							if(this._selectDevice !== d){
								this._selectDevice = d;
							}else{
								return;
							}
							this._scaleBox(this._selectDevice)
							let t = d3.transition().duration(150).ease(d3.easeLinear);
							deviceG
							.transition(t)
							.call(g => g.selectAll('rect').attr('fill', deviceAttrs.deviceChange(this._buttonColor, '#fff')))
							.call(g => g.selectAll('text').attr('fill', deviceAttrs.deviceChange('#fff', this._buttonColor)))
						})
				}

				_initBoxSort(abscissa, num){
					this._sortDevice = false;
					this._boxSortAttrs = {
						transform: d => translate(abscissa(d), this._leftButton(num)),
						text: d => d ? 'steel':  'complex',
						boxChange: (value1, value2) => d => d === this._sortDevice ? value1 : value2
					};
					this._boxSortG = this._leftGroup.append('g').attr('class', 'boxSortG');
					this._boxSortG.selectAll('g')
						.data([true, false])
						.join('g')
						.attr('transform', this._boxSortAttrs.transform)
						.call(g => addElement(g, 'rect', this._staticButton.rect)
							.attr('fill', this._boxSortAttrs.boxChange(this._buttonColor, '#fff')))
						.call(g => addElement(g, 'text', this._staticButton.text)
							.attr('fill', this._boxSortAttrs.boxChange('#fff', this._buttonColor))
							.text(this._boxSortAttrs.text))
						.on('click', (_, d) => {
							this._wheelBox = 0;
							this._sortDevice = d;
							this._boxSort();
							this._scaleBox(this._selectDevice)
						})
				}

				_boxSort(){
					if(this._sortDevice){
						for(let item in this._boxData){
							this._boxMap[item] = 0.9 * this._boxData[item].chart._selectNums +  0.1 * this._boxData[item].chart._selectOver
						}
					}else{
						for(let item in this._boxData){
							this._boxMap[item] = this._boxData[item].chart._batchNum
						}
					}
					let t = d3.transition().duration(150).ease(d3.easeLinear);
							this._boxSortG
								.transition(t)
								.call(g => g.selectAll('rect').attr('fill', this._boxSortAttrs.boxChange(this._buttonColor, '#fff')))
								.call(g => g.selectAll('text').attr('fill', this._boxSortAttrs.boxChange('#fff', this._buttonColor)))
				}

				_initdata() {
					const field = this._field;
					this._chartData = this._batchData[0][0]['one_dimens'].map(d => {
						return {
							indexName: d.name,
							month: this.getIndex(d.name),
							process: this.getIndex(d.name)
						}
					}).filter(d => d.month !== undefined);
					console.log('chartData', this._chartData)
					this._label = this._chartData.map(d => d.indexName)
				}

				_sort(data){
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
										let i = this._label.indexOf(name);
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
					// console.log(totalData)
					let result = [];
					for(let i = 0; i < arr.length; i++){
						let index = this._label.indexOf(arr[i].indexName),
							name = arr[i].indexName,
							process = arr[i].month;
						let batchIndex = d3.map(totalData, (d, batch) =>{
							let temp = d3.map(d, e => {
								let s = {
									time: new Date(e.toc),
									flag: e.fqc_label,
									Q: e.CONTQ[index],	//PCASPE
									T2: e.CONTJ[index],	//PCAT2
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
								s.max = Math.max(s.h, s.exh, s.value, s.sxh),
								s.min = Math.min(s.l, s.exl, s.value, s.sxl),
								s.over = s.h >= s.value && s.value >= s.l ? 0 : (s.h >= s.value ? s.l - s.value : s.h - s.value);
								s.over = Math.abs(s.over);
								s.range = this._rangeLevel(s);
								s.ovrage = Math.abs(s.range) > 2 ?  true : false;
								s.tjOrder = e['tjOrder'][index],
								s.tqOrder = e['tqOrder'][index],
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
			this.wheelChart.instance = new wheelRound(this.wheelChart.svg, this, {
				width: this.width,
				height: this.height
			})
				// .size([this.width, this.height])
				.dataInit(batchData, processData)
				.process(processJson)
				.render();
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