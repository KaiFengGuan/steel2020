<template>
	<div :id='menuId' style='height: 100%;width:100%'></div>
</template>

<script>
import * as d3 from 'd3';
import util from 'src/views/baogang/util.js';
import { addElement, updateElement, updateAsyncElement , updateStyles, stringify} from 'utils/element';
import {brushPre} from  'utils/data.js';
import {mapGetters} from 'vuex';
import success from 'assets/images/success.svg';

export default {
	props: {
		diagnosisState: {
			default: false,
			type: Boolean,
			require: true
		}
	},
	data() {
		return {
			menuId: 'brushableParallel',
			svg: undefined,
			width: 355,
			labelColors: util.labelColor, // [bad, good]
			categoryColors: util.categoryColor,
			mouseList: undefined,
			brushdata: undefined,
			svgChart: {},
			plData: undefined,
			tgtThicknessStation: 0,
			lengthStation: 0,
			widthStation: 0,
			newBrushSelection: new Map(),
			// coolingStation: {'cooling':false,'nocooling':false},
			keys: ['tgtthickness', 'tgtplatelength2', 'tgtwidth',
				'slab_thickness', 'tgtdischargetemp', 'tgttmplatetemp' // 'cooling_start_temp','cooling_stop_temp','cooling_rate1'
			],
			brushStep: [10, 1, 0.1, 10, 5, 5],
			maxStep: [500, 30, 2.5, 200, 100, 100],
			//钢板厚度 300 +- 10
			//钢板长度 38 +- 1
			//钢板宽度 3.86 +- 0.1
			//板坯厚度	386 +- 10
			//实际出炉温度 770 +- 10
			//终轧温度 840 +- 10
			diagnosisArr: [20, 10, 1, 10, 5, 5, 0],
			newBrushData: [
							[25, 35],
							[20, 35],
							[2.5, 4.0],
							[250, 300],
							[1120, 1130],
							[600, 800],
							[0, 1]
						],
			brushRange: [],
			diagnosisRange: [],
			lastSelections: new Map(),
			rangeData: []
		};
	},
	// mounted() {},
	computed: {
		...mapGetters([
			'isSwitch',
			'trainGroupStyle',
			'deGroupStyle',
			'brushMouseId',
			'brushSelection',
			'brushSelectColor',
			'startDate',
			'endDate',
			'hightlightGroup',
		]),
		paralleldata: vm => {
			if (vm.brushdata == undefined) return undefined;
			var pathdata = Object.values(vm.brushdata);
			return pathdata.filter(d => {
				var toc = new Date(d.toc);
				return toc < vm.endDate && toc > vm.startDate;
			});
		}
	},
	// 看时间的只要变化就会对应着变化
	watch: {
		isSwitch(val, oldVal) {
			d3.selectAll('.steelLine').attr('stroke', this.deGroupStyle);
		},
		hightlightGroup: function() {
			if (this.hightlightGroup.length === 0) {
				this.init();
				this.svgChart['instance']._removeDiagonis();
			} else {
				this.resetPath();
			}
		},
		diagnosisState(val, oldVal) {
			console.log(val);
			if(!val){
				this.svgChart['instance']._removeDiagonis()
			}else{
				this.svgChart['instance']._initDiagnosis()
			}
		}
	},

	methods: {
		deepCopy(obj) {
			if (typeof obj !== 'object') return obj;
			var newObj = obj instanceof Array ? [] : {};
			for (let key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (obj[key] === null) {
						newObj[key] === null;
					}
					newObj[key] = typeof obj[key] ? this.deepCopy(obj[key]) : obj[key];
				}
			}
			return newObj;
		},
		dataPre(rangeData){
			const data = this.deepCopy(rangeData).filter(d => this.keys.every(e => typeof d[e] === 'number'));
			this.rangeData = data;
			const bardata = d3.map(this.keys, d => d3.map(data, index => index[d])),
				barbin = d3.map(this.keys, (d, i) => d3.bin().thresholds(20)(bardata[i]));
			// for (let item in this.keys) {
			// 	console.log([barbin[item][0].x0, barbin[item].slice(-1)[0].x1])
			// }
			this.domain = d3.map(barbin, d => [d[0].x0, d.slice(-1)[0].x1])
		},
		changeDiagnosis(jsondata){
			const data = brushPre(jsondata);
			this.newBrushData = d3.map([...this.keys, 'status_cooling'], d => d3.extent(data, e => e[d]));
			console.log(data.length);
			console.log(this.newBrushData);
		},
		paintChart(plData) {
			const data = brushPre(plData);
			this.plData = data;
			var brushdata = data;
			var width = 355;
			const keys = this.keys;
			const newkeys = [...keys, 'status_cooling'];
			brushdata = brushdata.filter(d => keys.every(e => typeof d[e] === 'number'));
			var margin = {top: 40, right: 30, bottom: 50, left: 20};	// var margin = {top: 40, right: 20, bottom: 40, left: 20},
			const allArray = [0, 1].map(d => d3.filter(brushdata, (e, f) => e['status_cooling'] == d));	//coolingArray nocoolingArray
			var xCooling = d3
					.scaleBand() //Ordinal scale
					.domain(d3.range(allArray.length))
					.range([margin.left, width - margin.right - margin.left]),
				// .paddingInner(0.5),
				yCooling = d3
					.scaleLinear()
					.domain([0, d3.max(allArray, d => d.length)])
					.nice()
					.range([40, 0]);
				// coolingMargin = (width - margin.right - margin.left) / allArray.length / 2;
			var brushHeight = 10,
				vm = this,
				bardata = d3.map(keys, d => d3.map(brushdata, index => index[d])),
				barbin = d3.map(keys, (d, i) => {
					// var length = 6;
					// var maxlength = bardata[i].length;
					// while (true) {
					// 	if (d !== 'status_cooling') {
					// 		var max = d3.max(d3.bin().thresholds(length)(bardata[i]), d => d.length);
					// 		if (max / maxlength < 0.5 || length >= 10) {
					// 			break;
					// 		} else {
					// 			length++;
					// 		}
					// 	} else {
					// 		length = 1;
					// 		break;
					// 	}
					// }
					return d3.bin().thresholds(10)(bardata[i]);
				});
			var barScale = d3.map(barbin, array => d3.scalePow().domain([0, 1, d3.max(d3.map(array, d => d.length))]).range([0, 5, 35])),
				width = document.getElementById(this.menuId).offsetWidth,
				arc = d3.arc().innerRadius(0).outerRadius(6).startAngle(0)
					.endAngle((d, i) => (i ? 2 * Math.PI : -2 * Math.PI)),
				height = (keys.length + 1) * 80,
				x = new Map(
					Array.from(keys, (key, index) => [key, d3.scaleLinear(this.domain[index],[margin.left, width - margin.right]).clamp(true)])
				),
				y = d3.scalePoint(newkeys, [margin.top, height - margin.bottom]),
				xScale = d3
					.axisBottom(xCooling)
					.tickSizeOuter(0)
					.tickSizeInner(0),
				previousArray = [],
				brushedArray = [];
			x.set('status_cooling', d3.scaleLinear([-1, 2], [margin.left, width - margin.right]));
			var line = d3
					.line()
					.defined(([, value]) => value != null)
					.x(([key, value]) => x.get(key)(value))
					.y(([key]) => y(key)),
				brushHandle = (g, selection) =>
					g
						.selectAll('.handle--custom')
						.data([{type: 'w'}, {type: 'e'}])
						.join(enter =>
							enter
								.append('path')
								.attr('class', 'handle--custom')
								.attr('fill', 'white')
								.attr('fill-opacity', 1)
								.attr('stroke', '#90a4ae')
								.attr('stroke-width', 2)
								.attr('cursor', 'ew-resize')
								.attr('d', arc)
						)
						.attr('display', selection === null ? 'none' : null)
						.attr('transform', selection === null ? null : (d, i) => `translate(${selection[i]},${0})`);

			this.svg !== undefined && this.svg.remove();
			this.svg = d3.select('#' + vm.menuId)
				.append('svg')
				.attr('width', width)
				.attr('height', height);
			for (let item in keys) {
				this.brushSelection.set(keys[item],d3.extent(brushdata,d => d[keys[item]]));
				this.newBrushSelection.set(keys[item], this.newBrushData[item]);
			}
			var selections = this.brushSelection;

			class parallelLines{
				constructor(container, vNode) {
					this.vNode = vNode;
					this._container = container;
					this._mainG = null;
					this._g = null;

					this._width = 640;
					this._height = 640;
					this._x = x;
					this._y = y;
					this._objStatus = {
						tgtthickness: false,
						tgtplatelength2: false,
						tgtwidth: false,
						slab_thickness: false,
						tgtdischargetemp: false,
						tgttmplatetemp: false,
						cooling_start_temp: false,
						cooling_stop_temp: false,
						cooling_rate1: false,
						status_cooling: true
					};

					this._cardG = null;
					this._cardAttrs = null;
					this._buttonG = null;
					this._buttonAttrs = null,
					this._rectRectAttrs = null,
					this._rectTextAttrs = null;
					this._rectBarG = null;
					this._rectBarAttrs = null;
					this._brushG = null;
					this._brushHeight = 10;	//brushHeight

					this._lineG = null;

					this._dataMap = d3.group(brushdata, d => d.upid);
				}
				_initAttrs(){
					this._cardAttrs = {
						// class: (d, i) => 'card' + i,
						transform: d => `translate(${10},${y(d) - 42})`,
						fill: d => this._objStatus[d] ? '#f7f7f7' : 'white',
						'fill-opacity': d => this._objStatus[d] ? 0.7 : 1,
						stroke: '#e0e0e0',
						'stroke-width': 1,
						'stroke-opacity': d => this._objStatus[d] ? 1 : 0,
						width: 307,
						height: 70,
						rx: 10,
						ry: 10
					};
					this._buttonAttrs ={
						transform: d => `translate(${margin.left + 30},${y(d) + 19 + 6})`
					},
					this._rectRectAttrs = {
						class: 'rectButton',
						x:  -30,
						y: -45,
						width: 56,
						height: 16,
						rx: 5,
						ry: 5,
						stroke: util.labelColor[1],
						fill: d => this._objStatus[d] ? '#94a7b7' : '#ffffff'
					},
					this._rectTextAttrs = {
						'class': 'textButton',
						'x': -1,
						'y': -35,
						'text-anchor': 'middle',
						'fill': d => this._objStatus[d] ? '#ffffff' : '#94a7b7',
						'font-family': util.buttonTextAttr.baseTextAttr.fontFamily,
						'font-weight': util.buttonTextAttr.baseTextAttr.fontWeight,
						'font-style': util.buttonTextAttr.baseTextAttr.fontStyle,
						'font-size': '12px',
						'cursor': 'pointer',
						text: d => d
							.replace(/tgtwidth/, 'tgt_wd')
							.replace(/tgtthickness/, 'tgt_th')
							.replace(/tgtplatelength2/, 'tgt_len')
							.replace(/slab_thickness/, 'slab_th')
							.replace(/tgtdischargetemp/, 'tgt_disch')
							.replace(/tgttmplatetemp/, 'tgt_temp')
							.replace(/cooling_start_temp/, 'start_temp')
							.replace(/cooling_stop_temp/, 'stop_temp')
							.replace(/cooling_rate1/, 'cooling_rate')
							.replace(/status_cooling/, 'sta_cool')
					}
				}
				_initCardG(){
					this._cardG = this._mainG.append('g').attr('class', 'cardG');
					this._cardG
						.selectAll('rect')
					.data(newkeys)// .data(keys)
					.join('rect')
					.call(g => updateElement(g, this._cardAttrs));
				}
				_initButtonG(){
					const context = this;
					this._buttonG = this._mainG.append('g').attr('class', 'buttonGroup');
					this._buttonG
						.selectAll('g')
						.data(newkeys)	// .data(keys)
						.join('g')
						.call(g => updateElement(g, this._buttonAttrs))
						.call(g => addElement(g, 'rect', this._rectRectAttrs))
						.call(g => addElement(g, 'text', this._rectTextAttrs))
						.on('click', function(e, d) {
							context._objStatus[d] = !context._objStatus[d];
							const t = d3.transition()
								.duration(300)
								.ease(d3.easeLinear);
							context._buttonG
								.transition(t)
								.call(g => updateElement.call(context, g.selectAll('.rectButton'), context._rectRectAttrs))
								.call(g => updateElement.call(context, g.selectAll('.textButton'), context._rectTextAttrs))
							context._cardG
								.transition(t)
								.call(g => updateElement(g.selectAll('rect'), context._cardAttrs))
						});
				}
				_initRectBar(){
					const goodBarAttrs = (item) => {
						return {
							fill: util.delabelColor[1],
							stroke: '#000',
							class: 'rect' + item,
							'stroke-width': 1,
							x: d => 0.75 * x.get(keys[item])(d.x0) + 0.25 * x.get(keys[item])(d.x0),
							y: d => -barScale[item](d3.filter(brushdata, e => e[keys[item]] <= d.x1 && d.x0 <= e[keys[item]] && +e.label === 1)
								.length) + 1,
							height: d => barScale[item](d3.filter(brushdata, e => e[keys[item]] <= d.x1 && d.x0 <= e[keys[item]] && +e.label === 1)
							.length),
							width: d => 0.5* (x.get(keys[item])(d.x1) - x.get(keys[item])(d.x0))
						}
					},
					badBarAttrs = (item) => {
						return {
							fill: util.delabelColor[0],
							stroke: '#000',
							class: 'rect' + item,
							'stroke-width': 1,
							x: d => 0.75 * x.get(keys[item])(d.x0) + 0.25 * x.get(keys[item])(d.x0),
							y: 10,
							height: d => barScale[item](d3.filter(brushdata, e => e[keys[item]] <= d.x1 && d.x0 <= e[keys[item]] && +e.label === 0)
							.length),
							width: d => 0.5* (x.get(keys[item])(d.x1) - x.get(keys[item])(d.x0))
						}
					}
					this._rectBarG = this._mainG.append('g').attr('class', 'rectBar');
					for (let item in keys) {
						// 柱状图
						this._rectBarG
							.append('g')
							.attr('transform', `translate(0,${y(keys[item])})`)
							.selectAll('.rect' + item)
							.data(barbin[item])
							.join('g')
							.call(g => addElement(g, 'rect', goodBarAttrs(item)))
							.call(g => addElement(g, 'rect', badBarAttrs(item)));
					}
					this._rectBarG.raise();
				}
				_updateRectBar(selection, key){
					if (selection === null) {
						this._rectBarG.selectAll('.rect' + keys.indexOf(key)).attr('opacity', 0.5);
					} else {
						let brushRange = d3.map(selection, x.get(key).invert);
						this._rectBarG.selectAll('.rect' + keys.indexOf(key)).attr('opacity', (d, i) =>
							(d.x0 + d.x1) / 2 >= brushRange[0] && (d.x0 + d.x1) / 2 <= brushRange[1] ? 0.5 : 0.05
							);
					}
				}
				_initCoolBar(){
					// rectcooling是否过冷却
					const goodAttrs = {
						x: (d, i) => x.get('status_cooling')(i) - 9.375,
						y: d => yCooling(d3.filter(d, e => e['label'] == '1').length),
						height: d => yCooling(0) - yCooling(d3.filter(d, e => e['label'] == '1').length),
						width: 20,
						fill: util.delabelColor[1],
						opacity: 0.5,
						stroke: '#000',
						'stroke-width': 1
					},
					badAttrs = {
						x: (d, i) => x.get('status_cooling')(i) - 9.375,
						y: 50,
						height: d => yCooling(0) - yCooling(d3.filter(d, e => e['label'] == '0').length),
						width: 20,
						fill: util.delabelColor[0],
						opacity: 0.5,
						stroke: '#000',
						'stroke-width': 1
					};
					const coolBarG = this._mainG.append('g');
						coolBarG
						.attr('class', 'rectCooling')
						.attr('transform', `translate(0,${height - 95})`)
						.selectAll('rect')
						.data(allArray)
						.join('g')
						.call(g => addElement(g, 'rect', goodAttrs))
						.call(g => addElement(g, 'rect', badAttrs));
				}
				_initBottomButtonG(){
					const groupAttrs = {
						transform: (d, i) => `translate(${[x.get('status_cooling')(i) - 5.5, height - 10]})`,
						class: (d, i) => 'coolingButton' + i
					},
					borderAttrs = {
						fill: 'none',
						stroke: '#ccc',
						'stroke-width': 2,
						width: 10,
						height: 10
					};
					this._mainG
						.append('g')
						.attr('class', 'bottomButton')
						.selectAll('g')
						.data(['cooling', 'nocooling'])
						.join('g')
						.call(g => updateElement(g, groupAttrs))
						.call(g => addElement(g, 'rect', borderAttrs))
				}
				_updateButtomButtonG(selected){
					const iconAttrs ={
						class: 'successIcon',
						width: '10px',
						height: '10px',
						href: success,
						visibility: (d, i) => selected.some(d => d.status_cooling === i) ? 'visible' : 'hidden'
					};
					this._mainG.selectAll('.successIcon').remove();
					this._mainG.select('.bottomButton').selectAll('g')
						.call(g => addElement(g, 'image', iconAttrs))
				}
				_brushFunc(selection, key){
					let selected = [];
					this._updateRectBar(selection, key);
					this._updateLine(selected);
					selected = Array.from(new Set(selected));
					this._container.property('value', selected).dispatch('input');
					this._brushSlider();
					this._updateButtomButtonG(selected);
				}
				_initBrush(){
					const brush = d3
						.brushX()
						.extent([
							[margin.left, -(brushHeight / 2)],
							[width - margin.right, brushHeight / 2]
						])
						.on('start brush end', basebrushed);
					const context = this;
					function basebrushed({selection}, key) {
						if(vm.diagnosisState || vm.svgChart['instance']._objStatus[key])return;
						d3.select(this).call(brushHandle, selection);
						// var tempValue = selections.get(key).map(d => x.get(key)(d));
						// if (!tempValue.every((d, i) => d === selection[i])) {
						// 	d3.select(this).call(brush.move, selections.get(key).map(d => x.get(key)(d)));
						// 	return;
						// }
						if (selection === null) selections.delete(key);
						else selections.set(key, selection.map(x.get(key).invert));

						vm.svgChart['instance']._brushFunc(selection, key);
					}
					const brushAttrs ={
						transform: d => `translate(0,${y(d) + 6})`,
						id: (d, i) => 'parallel' + i
					}
					this._brushG = this._mainG
						.append('g')
						.attr('class', 'baseBrush');
					this._brushG.selectAll('g')
					.data(keys)	// .data(newkeys)
					.join('g')
					.call(g => updateElement(g, brushAttrs))
					.each(function(d, i) {
						d3.select(this).call(
							d3.axisBottom(x.get(d))
								.tickSizeOuter(5)
								.tickSizeInner(5)
								.tickFormat(d3.format('.1f'))	// .tickFormat(d3.format(',.2f'))
								.ticks(5));
					})
					.call(g => g.selectAll('.domain').remove())
					.call(brush)
					.attr('class', (d, i) => 'brushX' + i)
					.call(brush.move, (d, i) => selections.get(d).map(x.get(d)));

					this._brushG
						.append('rect')
							.attr('transform', `translate(${0},${height - margin.bottom - 15})`)
							.attr('x', 20)
							.attr('y', 10)
							.attr('width', 261)
							.attr('height', this._brushHeight)
							.attr('class', 'overlay')
							.raise();
				}
				_brushSlider(){
					const overLayAttrs = {
							fill: '#eeeeee',
							rx: 5,
							ry: 5,
							stroke: '#bbbbbb',
							'stroke-width': 1
						}
					const selectionAttrs = {
						rx: 5,
						ry: 5,
						stroke: '#aaa',
						'stroke-width': 1
					}
					const tickTextAttrs = {
						stroke: 'none',
						'font-family': util.tabularAxisTextAttr.fontFamily,
						color: util.tabularAxisTextAttr.fontColor,
						'font-size': util.tabularAxisTextAttr.fontSize,
						'font-weight': util.tabularAxisTextAttr.fontWeight,
						'font-style': util.tabularAxisTextAttr.fontStyle
					}
					updateElement(this._brushG.selectAll('.overlay'), overLayAttrs).raise();
					updateElement(this._brushG.selectAll('.selection'), selectionAttrs).raise();
					this._brushG.selectAll('.handle--custom').raise();
					updateElement(this._brushG.selectAll('.tick text'), tickTextAttrs);
					this._raise();
				}
				_initLine(){
					const lineAttrs = {
						stroke: vm.deGroupStyle,
						id: d => `paraPath${d.upid}`,
						d: d => line(d3.cross(newkeys, [d], (key, d) => [key, d[key]])),
						// .attr('d', d => line(d3.cross(keys, [d], (key, d) => [key, d[key]])))
						class: 'steelLine',
						fill: 'none',
						'stroke-width': 1,
						'stroke-opacity': 0.6
					}
					this._lineG = this._mainG.append('g').attr('class', 'parallelPath');
					this._lineG.selectAll('path')
						.data(Object.values(brushdata).sort((a, b) => d3.ascending(a['upid'], b['upid'])))
						.join('path')
						.call(g => updateElement(g, lineAttrs))
						.on('mouseover', pathover)
						.on('mouseout', pathout);
				}
				_updateLine(selected){
					this._lineG.selectAll('path').each(function(d){
						const active = Array.from(selections).every(
							([key, [min, max]]) => d[key] >= min && d[key] <= max
						);
						d3.select(this).attr('stroke', active ? vm.deGroupStyle : 'none');
						if(active){
							d3.select(this).raise();
							selected.push(d);
						}
					});
				}
				_raise(){
					['.rectBar', '.cardG'].map(d => this._mainG.selectAll(d).lower());
					this._mainG.select('.bottomButton').raise();
				}
				_initControl(){
					const context = this, vN = context.vNode;
					const minusG = this._mainG.append('g').attr('class', 'minusG');
					const plusG = this._mainG.append('g').attr('class', 'plusG');
					const textG = this._mainG.append('g').attr('class', 'textG');
					const minusAttrs ={
						transform: d => `translate(${width - margin.right / 2 - 7.5},${y(d) + 25 - 7.5})  scale(0.8)`
					},
					minusRect = {
						height: 15,
						width: 20,
						rx: 2,
						ry: 2,
						stroke: util.labelColor[1],
						fill: '#ffffff',
						'cursor': 'pointer'
					},
					minusText = {
						x: 10,
						y: 14,
						text: '-',
						'text-anchor': 'middle',
						'fill': '#94a7b7',
						'font-family': util.buttonTextAttr.baseTextAttr.fontFamily,
						'font-weight': util.buttonTextAttr.baseTextAttr.fontWeight,
						'font-style': util.buttonTextAttr.baseTextAttr.fontStyle,
						'font-size': '22px',
						'cursor': 'pointer'
					},
					plusAttrs ={
						transform: d => `translate(${width - margin.right / 2 - 7.5},${y(d) - 25 + 7.5})  scale(0.8)`
					},
					plusRect = {
						height: 15,
						width: 20,
						rx: 2,
						ry: 2,
						stroke: util.labelColor[1],
						fill: '#ffffff',
						'cursor': 'pointer'
					},
					plusText = {
						x: 10,
						y: 14,
						text: '+',
						'text-anchor': 'middle',
						'fill': '#94a7b7',
						'font-family': util.buttonTextAttr.baseTextAttr.fontFamily,
						'font-weight': util.buttonTextAttr.baseTextAttr.fontWeight,
						'font-style': util.buttonTextAttr.baseTextAttr.fontStyle,
						'font-size': '18px',
						'cursor': 'pointer'
					};
					minusG
						.selectAll('g').data(keys).join('g')
							.call(g => updateElement(g, minusAttrs))
							.call(g => addElement(g, 'rect', minusRect))
							.call(g => addElement(g, 'text', minusText))
							.on('click', function(e, d){
								const i = keys.indexOf(d);
								if(vN.diagnosisRange[i][1] - vN.diagnosisRange[i][0] < 2 * vN.brushStep[i])return;
								vN.diagnosisArr[i] = +(vN.diagnosisArr[i] - vN.brushStep[i]).toFixed(1);
								vN.diagnosisRange = vN.newBrushData.map((d, i) => d.map((e, f) => e  + (-1 + 2 * f) *vN.diagnosisArr[i])).slice(0, -1);
								context._updateDiagnosis()
							});
					plusG
						.selectAll('g').data(keys).join('g')
							.call(g => updateElement(g, plusAttrs))
							.call(g => addElement(g, 'rect', plusRect))
							.call(g => addElement(g, 'text', plusText))
							.on('click', function(e, d){
								const i = keys.indexOf(d);
								if(vN.diagnosisRange[i][0] < vN.brushStep[i] || vN.brushStep[i] + vN.diagnosisArr[i] > vN.maxStep[i])return;
								vN.diagnosisArr[i] = +(vN.diagnosisArr[i] + vN.brushStep[i]).toFixed(1);
								vN.diagnosisRange = vN.newBrushData.map((d, i) => d.map((e, f) => e  + (-1 + 2 * f) *vN.diagnosisArr[i])).slice(0, -1);
								context._updateDiagnosis()
							});
					const valueAttrs ={
						transform: d => `translate(${width - margin.right / 2 - 7.5 - 2},${y(d)})  scale(0.8)`
					},
					valueText = {
						x: 12,
						y: 14,
						text: (d, i) => vN.diagnosisArr[i],
						'fill': '#94a7b7',
					},
					valueStyle = {
						'text-anchor': 'middle',
						'font-family': util.buttonTextAttr.baseTextAttr.fontFamily,
						'font-weight': util.buttonTextAttr.baseTextAttr.fontWeight,
						'font-style': util.buttonTextAttr.baseTextAttr.fontStyle,
						'font-size': '18px',
						'cursor': 'pointer'
					};
					textG.selectAll('g').data(keys).join('g')
							.call(g => updateElement(g, valueAttrs))
							.call(g => addElement(g, 'text', valueText))
					textG.call(g => updateStyles(g.selectAll('text'), valueStyle))
				}
				_initDiagnosis(){
					['.handle--custom', '.selection', '.handle'].map(d => this._brushG.selectAll(d).attr('display', 'none'));
					this._brushG.selectAll('.overlay').attr('cursor', 'auto');
					this.vNode.diagnosisRange = this.vNode.newBrushData.map((d, i) => d.map((e, f) => e  + (-1 + 2 * f) *this.vNode.diagnosisArr[i]));
					this._initArea();
					this._initAreaTooltip(true);

					this._updateDiagnosis();
				}
				_areaAttrs(){
					const context = this;
					return {
						fill: 'none',
						class: 'rangeArea',
						stroke: util.labelColor[0],
						datum: context.vNode.diagnosisRange,
						fill: util.delabelColor[1],
						opacity: 0.5,
						d: d3.area()
						.y((d, i) => y(newkeys[i]) + context._brushHeight/2)
						.x0((d, i) => context._x.get(newkeys[i])(d[0]))
						.x1((d, i) => context._x.get(newkeys[i])(d[1])),
					}
				}
				_initArea(){
					this._lineG.call(g => addElement(g, 'path', this._areaAttrs()));
				}
				_initSteelTooltip(upid){//true init -- false update
					if(this._dataMap.get(upid) === undefined)return;
					const datum = this._dataMap.get(upid)[0];
					this._mainG.selectAll('.datumTooltip').remove();
					const context = this;
					const datumAttrs ={
						transform: (d, i) => `translate(${this._x.get(keys[i])(datum[keys[i]])},${y(d) + 10})`
					},
					datumRect = {
						height: 18,
						width: 20,
						x: -30,
						rx: 4,
						ry: 4,
						stroke: util.labelColor[1],
						fill: '#ffffff',
						'cursor': 'pointer'
					},
					datumText = {
						x: 0,
						y: 14,
						text: (d, i) => datum[keys[i]],
						'text-anchor': 'middle',
						'fill': '#94a7b7',
						'font-family': util.buttonTextAttr.baseTextAttr.fontFamily,
						'font-weight': util.buttonTextAttr.baseTextAttr.fontWeight,
						'font-style': util.buttonTextAttr.baseTextAttr.fontStyle,
						'font-size': '15px',
						'cursor': 'pointer'
					};
					const datumG = this._mainG.append('g').attr('class', 'datumTooltip');
						datumG
							.selectAll('g').data(keys).join('g')
								.call(g => updateElement(g, datumAttrs))
								.call(g => addElement(g, 'rect', datumRect))
								.call(g => addElement(g, 'text', datumText));
						const datumWidth = [...datumG.selectAll('text')._groups[0]].map(d => d.getBBox().width);	//{x: -27.5, y: 0, width: 15, height: 17}
						datumRect.width = (d, i) => datumWidth[i] + 10;
						datumRect.x = (d, i) => -datumWidth[i]/2 - 5 + datumText.x;
						context.vNode.$nextTick(function() {
							console.log('$nextTick success')
							datumG.selectAll('rect').call(g => updateElement(g, datumRect));})
				}
				_initAreaTooltip(status){//true init -- false update
					const context = this;
					const leftAttrs ={
						transform: (d, i) => `translate(${this._x.get(keys[i])(this.vNode.diagnosisRange[i][0])},${y(d) + 10})`
					},
					leftRect = {
						height: 18,
						width: 20,
						x: -30,
						rx: 4,
						ry: 4,
						stroke: util.labelColor[1],
						fill: '#ffffff',
						'cursor': 'pointer'
					},
					leftText = {
						x: 0,
						y: 14,
						text: (d, i) => this.vNode.diagnosisRange[i][0].toFixed(2),
						'text-anchor': 'middle',
						'fill': '#94a7b7',
						'font-family': util.buttonTextAttr.baseTextAttr.fontFamily,
						'font-weight': util.buttonTextAttr.baseTextAttr.fontWeight,
						'font-style': util.buttonTextAttr.baseTextAttr.fontStyle,
						'font-size': '15px',
						'cursor': 'pointer'
					};
					const conflict = (d, i) => this._x.get(keys[i])(this.vNode.diagnosisRange[i][1]) - this._x.get(keys[i])(this.vNode.diagnosisRange[i][0]) < 40 ? 
						this._x.get(keys[i])(this.vNode.diagnosisRange[i][0]) + 40: this._x.get(keys[i])(this.vNode.diagnosisRange[i][1]);
					const rightAttrs ={
						transform: (d, i) => `translate(${conflict(d, i)},${y(d) + 10})`
					},
					rightRect = {
						height: 18,
						width: 20,
						x: -30,
						rx: 4,
						ry: 4,
						stroke: util.labelColor[1],
						fill: '#ffffff',
						'cursor': 'pointer'
					},
					rightText = {
						x: 0,
						y: 14,
						text: (d, i) => this.vNode.diagnosisRange[i][1].toFixed(2),
						'text-anchor': 'middle',
						'fill': '#94a7b7',
						'font-family': util.buttonTextAttr.baseTextAttr.fontFamily,
						'font-weight': util.buttonTextAttr.baseTextAttr.fontWeight,
						'font-style': util.buttonTextAttr.baseTextAttr.fontStyle,
						'font-size': '15px',
						'cursor': 'pointer'
					};
					if(status){
						const leftG = this._mainG.append('g').attr('class', 'leftTooltip');
						const rightG = this._mainG.append('g').attr('class', 'rightTooltip');
						leftG
							.selectAll('g').data(keys).join('g')
								.call(g => updateElement(g, leftAttrs))
								.call(g => addElement(g, 'rect', leftRect))
								.call(g => addElement(g, 'text', leftText));
						const leftWidth = [...leftG.selectAll('text')._groups[0]].map(d => d.getBBox().width);	//{x: -27.5, y: 0, width: 15, height: 17}
						leftRect.width = (d, i) => leftWidth[i] + 10;
						leftRect.x = (d, i) => -leftWidth[i]/2 - 5 + leftText.x;
						context.vNode.$nextTick(function() {leftG.selectAll('rect').call(g => updateElement(g, leftRect));})

						rightG
							.selectAll('g').data(keys).join('g')
								.call(g => updateElement(g, rightAttrs))
								.call(g => addElement(g, 'rect', rightRect))
								.call(g => addElement(g, 'text', rightText));
						const rightWidth = [...rightG.selectAll('text')._groups[0]].map(d => d.getBBox().width);	//{x: -27.5, y: 0, width: 15, height: 17}
						rightRect.width = (d, i) => rightWidth[i] + 10;
						rightRect.x = (d, i) => -rightWidth[i]/2 - 5 + rightText.x;
						context.vNode.$nextTick(function() {rightG.selectAll('rect').call(g => updateElement(g, rightRect));})
					}else{
						const t = d3.transition()
								.duration(300)
								.ease(d3.easeLinear);
						const leftG = this._mainG.select('.leftTooltip');
						const rightG = this._mainG.select('.rightTooltip');
						leftG.selectAll('g').transition(t).call(g => updateElement(g, leftAttrs));
						leftG.selectAll('text').transition(t).call(g => updateElement(g, leftText));
						const leftWidth = [...leftG.selectAll('text')._groups[0]].map(d => d.getBBox().width);	//{x: -27.5, y: 0, width: 15, height: 17}
						leftRect.width = (d, i) => leftWidth[i] + 10;
						leftRect.x = (d, i) => -leftWidth[i]/2 - 5 + leftText.x;
						// leftG.selectAll('rect').transition(t).call(g => updateElement(g, leftRect));
						context.vNode.$nextTick(function() {leftG.selectAll('rect').call(g => updateElement(g, leftRect));})

						rightG.selectAll('g').transition(t).call(g => updateElement(g, rightAttrs));
						rightG.selectAll('text').transition(t).call(g => updateElement(g, rightText));
						const rightWidth = [...rightG.selectAll('text')._groups[0]].map(d => d.getBBox().width);	//{x: -27.5, y: 0, width: 15, height: 17}
						rightRect.width = (d, i) => rightWidth[i] + 10;
						rightRect.x = (d, i) => -rightWidth[i]/2 - 5 + rightText.x;
						// rightG.selectAll('rect').call(g => updateElement(g, rightRect));
						context.vNode.$nextTick(function() {rightG.selectAll('rect').call(g => updateElement(g, rightRect));})
					}
				}
				_updateDiagnosis(){
					this._updateArea();
					this._initAreaTooltip(false);	//_updateAreaTooltip
					this._updateDLine();
					this._mainG.select('.textG').selectAll('text').text((d, i) => this.vNode.diagnosisArr[i])
				}
				_updateDLine(){
					const context = this,
						vn = context.vNode,
						selected = [];
					this._lineG.selectAll('path').each(function(d){
						const active = keys.every((element, index) => d[element] >= vn.diagnosisRange[index][0] && d[element] <= vn.diagnosisRange[index][1]);
						d3.select(this).attr('stroke', active ? vn.deGroupStyle : 'none');
						if(active){
							d3.select(this).raise();
							selected.push(d);
						}
					});
				}
				_updateArea(){
					this._mainG.call(g => updateElement(g.selectAll('.rangeArea'), this._areaAttrs()));
				}
				_removeDiagonis(){
					['.rangeArea', '.leftTooltip', '.rightTooltip'].map(d => this._mainG.select(d).remove());
					['.handle--custom', '.selection', '.handle'].map(d => this._brushG.selectAll(d).attr('display', 'block'));;
					this._brushG.selectAll('.overlay').attr('cursor', 'crosshair');
					this._updateLine([]);
				}
				render(){
					this._mainG = this._container.append('g').attr('class', 'mainG');
					this._initAttrs();
					this._initCardG();
					this._initRectBar();
					this._initCoolBar();
					this._initButtonG();
					this._initBottomButtonG();
					this._initLine();
					this._initBrush();
					this._brushSlider();
					this._initControl();
					//test
					// this._initDiagnosis();
					// this._removeDiagonis();
					return this;
				}
			}
			this.svgChart['instance'] = new parallelLines(this.svg, this);
			this.svgChart['instance'].render();
			
			// 折现和散点图之间的联动以及toptip
			function pathover(event, d) {
				vm.svgChart['instance']._initSteelTooltip(d.upid);
				const tooltip = vm.svg
					.append('g')
					.attr('class', 'tooltip')
					.style('font', '12px DIN');

				const path = tooltip.append('path')
					// .attr('fill', 'rgba(245, 245, 230, 0.97)');
					.attr('stroke', 'rgba(148, 167, 183, 0.4)')
					.attr('fill', 'white');

				const text = tooltip.append('text');

				const line1 = text
					.append('tspan')
					.attr('x', 0)
					.attr('y', 0)
					.style('font-family', util.tabularTooltipAttr.line1.fontFamily)
					.style('font-size', util.tabularTooltipAttr.line1.fontSize)
					.style('font-weight', util.tabularTooltipAttr.line1.fontWeight)
					.style('font-style', util.tabularTooltipAttr.line1.fontStyle);

				const line2 = text
					.append('tspan')
					.attr('x', 0)
					.attr('y', '1.1em')
					.style('font-family', util.tabularTooltipAttr.line2.fontFamily)
					.style('font-size', util.tabularTooltipAttr.line2.fontSize)
					.style('font-weight', util.tabularTooltipAttr.line2.fontWeight)
					.style('font-style', util.tabularTooltipAttr.line2.fontStyle);

				const line3 = text
					.append('tspan')
					.attr('x', 0)
					.attr('y', '2.2em')
					.style('font-family', util.tabularTooltipAttr.line3.fontFamily)
					.style('font-size', util.tabularTooltipAttr.line3.fontSize)
					.style('font-weight', util.tabularTooltipAttr.line3.fontWeight)
					.style('font-style', util.tabularTooltipAttr.line3.fontStyle);
				tooltip.style('display', null).attr('fill', vm.deGroupStyle(d));
				line1.text(`upid:` + d.upid);
				line2.text(`steelspec: ` + d.steelspec);
				line3.text(`time:` + d.toc);
				path.attr('stroke', vm.deGroupStyle(d)).attr('fill', 'white');
				const box = text.node().getBBox();
				let x = event.offsetX,
						y = event.offsetY;				
				path.attr('d', `
					M${box.x - 10},${box.y - 10}
					H${box.width / 2 - 5}l5,15l5,-15
					H${box.width + 10}
					v-${box.height + 20}
					h-${box.width + 20}
					z
				`)
				text.attr('transform', `translate(${[box.x, box.y - box.height - 10]})`);
				tooltip.attr('transform', `translate(${[x - box.width/2, y + 5]})`);
				// vm.svg.selectAll(`.steelLine`)
				//     .attr('stroke-opacity', 0.01)
				//     .attr('stroke-width', 0.25)
				vm.svg
					.selectAll(`.steelLine`)
					.attr('stroke-opacity', 0)
					.attr('stroke-width', 0);
				vm.svg
					.select(`#paraPath${d.upid}`)
					.attr('stroke-opacity', 0.6)
					.attr('stroke-width', 1.75);
				vm.$emit('parallMouse', {upid: [d.upid], mouse: 0});
			}
			function pathout(e, d) {
				// if(!vm.diagnosisState){
				//      vm.svg.selectAll(`.steelLine`)
				//     .attr('stroke-opacity', 0.6)
				//     .attr('stroke-width', 1)
				// }else{
				//      for(let item in previousArray){
				//           vm.svg.select(`#paraPath${previousArray[item]}`)
				//           .attr('stroke-opacity', 0.1)
				//           .attr('stroke-width', 1)
				//     }
				//      for(let item in brushedArray){
				//           vm.svg.select(`#paraPath${brushedArray[item]}`)
				//         //   .attr('stroke-opacity', 0.6)
				//           .attr('stroke-opacity', 1)
				//           .attr('stroke-width', 1)
				//     }

				// }
				vm.svg.selectAll('.datumTooltip').remove();
				vm.svg
					.selectAll(`.steelLine`)
					.attr('stroke-opacity', 0.6)
					.attr('stroke-width', 1);
				vm.svg.selectAll('.tooltip').remove();
				vm.mouseList !== undefined ? vm.mouse(vm.mouseList) : false;
				vm.$emit('parallMouse', {upid: [d.upid], mouse: 1});
			}
		},
		mouse(value) {
			this.mouseList = value;
			this.clear();
			if (value.mouse === 0) {
				this.changePath(value.upid);
				this.changePath(this.hightlightGroup);
				if(value.upid.length === 1)this.svgChart['instance']._initSteelTooltip(value.upid[0]);
			} else {
				this.svg.selectAll('.datumTooltip').remove();
				this.init();
				if (this.hightlightGroup.length !== 0) {
					this.clear();
					this.changePath(this.hightlightGroup);
				}
			}
		},
		resetPath() {
			//reset Style before highlight
			if (this.mouseList !== undefined) {
				this.mouse(this.mouseList);
			} else {
				if (this.hightlightGroup.length !== 0) {
					this.clear();
					this.changePath(this.hightlightGroup);
				}
			}
		},
		clear() {
			//clear Style
			this.svg
				.selectAll(`.steelLine`)
				.attr('stroke-width', 1)
				.style('visibility', 'hidden');
		},
		init() {
			//init Style
			this.svg
				.selectAll(`.steelLine`)
				.style('visibility', 'visible')
				.attr('stroke-width', 1);
		},
		changePath(array) {
			//change Style
			// console.log(array);
			if (array.length === 0) return;
			for (let item in array) {
				this.svg
					.select(`#paraPath${array[item]}`)
					.style('visibility', 'visible')
					.attr('stroke-width', 1.75)
					.raise();
			}
		}
	},
	mounted() {},
	beforeDestroy(){
		
	}
};
</script>
<style scoped>
</style>