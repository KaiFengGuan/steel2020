<template>
	<div :id="menuId" style="height: 100%;width:100%;"></div>
</template>

<script>
import * as d3 from 'd3';

import heaticon from "assets/images/heatwheel.svg";
import heatwhite from "assets/images/heatwhite.svg";
import coolicon from "assets/images/coolwheel.svg";
import coolwhite from "assets/images/coolwhite.svg";
import rollicon from "assets/images/rollwheel.svg";
import rollwhite from "assets/images/rollwhite.svg";
import mergeLabel from "assets/images/mergeLabel.svg";
import deMergeLabel from "assets/images/deMergeLabel.svg";
import util from './util.js';
import processJson from "@/assets/json/processJson.json"
import {mapGetters, mapMutations} from "vuex"
const processIcon = [heaticon , rollicon , coolicon],
  iconwhite = [heatwhite , rollwhite , coolwhite];
export default {
  props: {
    contract: {
      default: false,
      type: Boolean,
      require: true
    }
  },
	data() {
		return {
			menuId: 'wheeling' + Math.random().toString(32).slice(-6),
			svg: undefined,
			data:[],
            jsondata: undefined,
            chorddata: undefined,
            batchData: undefined,
            upid: undefined,
            steeltoc: undefined,
            wheelChart: undefined
		}
	},
	methods: {
    ...mapMutations([
      "changeStatus",
      "riverStatus"
    ]),
    paintChart(jsondata, chorddata, batchData) {
      this.jsondata = jsondata, this.chorddata = chorddata, this.batchData = batchData;
      var wheeldata = [] , labels = [], searchLabels = [];
      this.upid = jsondata.upid
      this.steeltoc = jsondata.toc
      // for(let item in jsondata['INDEX']){  //json
      //     labels.push(jsondata['INDEX'][item])
      //     wheeldata.push({
      //         name: jsondata['INDEX'][item],
      //         PCASPE: jsondata['CONTQ'][item],
      //         PCAT2: jsondata['CONTJ'][item],
      //         result_value: jsondata['value'][item],
      //         result_low: jsondata['l'][item],
      //         result_high: jsondata['u'][item],
      //         result_extre_high: jsondata['extremum_u'][item],
      //         result_extre_low: jsondata['extremum_l'][item]
      //     })
      // }
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
      // for(let item in jsondata['PCASPE']['xData']){
      //     labels.push(jsondata['PCASPE']['xData'][item])
      //     wheeldata.push({
      //         name:jsondata['PCASPE']['xData'][item],
      //         PCASPE:jsondata['PCASPE']['sData'][item]?jsondata['PCASPE']['sData'][item]:0,
      //         PCAT2:jsondata['PCAT2']['sData'][item]?jsondata['PCAT2']['sData'][item]:0,
      //         // outOfGau:jsondata['outOfGau']['sData'][item],
      //         result_value:jsondata['result'][item]['value'],
      //         result_low:jsondata['result'][item]['l'],
      //         result_high:jsondata['result'][item]['u'],
      //         result_original_l:jsondata['result'][item]['original_l'],
      //     })
      // }
      const vm=this		
      const diameter = document.getElementById(this.menuId).offsetHeight;	
      const width = document.getElementById(this.menuId).offsetWidth;	
      this.svg !== undefined && this.svg.remove()
      this.svg=d3.select('#' + this.menuId)
        .append('svg')
        .attr('viewBox', `${-50} ${-diameter / 2} ${width} ${diameter}`)
        .style('width', width)
        .style('height', diameter);
      class wheelRound{
        constructor(container) {
          this._container = container;
          this._staticGroup = null;
          this._g = null;

          this._width = 640;
          this._height = 640;
          this._radius = {
            inner: 125,
            outer: 0,
            max: 0,
            bubble: 30,
            arc: 5,
            label: 15
          };
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
            precipitation: 'PCASPE',
            humidity: 'PCAT2',
          }

          this._x = null; // date scale
          this._xpad = null; //pad scale
          this._y = null; // temperature scale
          this._h = null; // humidity scale
          this._hb = null;// humidity border scale
          this._barAngle = 0; // one-bar radian

          this._labels=null;
          this._dailyInfo = null;
          this._texts = {
            name: null,
            avg: null,
            deviation:null,
            high: null,
            low: null,
            prec: null,
            humidity: null,
          };

          //staticGroup
          this._sliderTimer = null;

          this._process=[];
          this._padprocess = [[],[],[]];
          this._processindex = ['heat', 'roll', 'cool'];
          this._labelcolor = ['#fcd8a9', '#cce9c7', '#c1c9ee'];
          this._flagColor = ["#e3ad92",   "#b9c6cd"];
          this._padAngle=[];
          this._linespace=6;
          this._merge = true;
          this._sliderInput = 40;
          this._horizonView = true;
          this._indexdata = [];
          this._allIndex = undefined;    //index name
          this._indexScale = undefined;
          this._mouseDis  = undefined;
          this._barVis = true;
          this._labelLimit = {
            precs: 0.5,
            humis: 0.5,
            result: 0.5
          };
          this._stopPropagation = (e, d) => e.stopPropagation();

          this._processClass = e => d => e + d.month,
          this._indexId = e => d => e + d.indexName,

          //mainG
          this._borderStyle ={
            color: '#b9bbbd',
            rx: 3,
            ry: 3
          }

          //contentG
          this._fliterStatus = false;
          this._contentG = null;
          this._heatOrRiver = false;
          this._padindex = null;
          this._processData = null;

          //Style 
          this._cleadStyle = {
            'opacity': 0.4,
            'stroke-width': 0.75
          }
          this._leadlineStyle = {
            'opacity': 0.4,
            'original_strwidth': 0.25,
            'highlight_strwidth': 0.75
          }
          this._circleStyle ={
            'original_r': 1.5,
            'highlight_r': 2
          }

          //chord
          this._graph = null;
          this._leavesData = null;
          this._lineData = null;

          this._barInstance = null;

          this._buttonColor = '#94a7b7'; //  #678fba
          this._buttonStyle = {
            width: 40,
            height: 18 ,
            textX: 20,
            textY:  12
          }
        }
        getIndex(_){
          for (let item in this._process){
            if(this._process[item].indexOf(_)!==-1){
              return +item
            }
          }
        }

        data(_) {
          return arguments.length ? (this._data = _, this) : this._data;
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
          this._initRadius();
          this._staticGroup = this._container
            .append('g')
            .attr('class', 'staticGroup');
          if(!vm.contract){
            this._renderComponents()
						this._initDefs()
          }else{
            this._merge = false
          }
          this._renderMerge()
          return this;
        }

        _renderBar(){
          this._fliterScaleData();
          this._barInstance = this._renderMainBar();
          this._renderMainWheel();
        }

        _renderWheel(){
          ['switchG', 'sortG', 'visG', 'sliderGroup'].map(d => this._staticGroup.selectAll(`.${d}`).remove())
          this._initScaleData();
          this._renderMainWheel();
          this._g.attr('transform', `translate(${vm.contract ? this._width/3 : this._width/2},0)`)
        }

        _renderMerge(){
          this._g == null ? undefined : this._g.remove();
          this._g = this._container.append('g')
          
          this._initdata();
          this._merge ? this._renderBar() : this._renderWheel();
          this._staticGroup.raise();

          const svg = this._g;
          if(vm.contract)return;
          const zoom = d3.zoom().on('zoom', e => {
            svg.attr('transform', e.transform);
          })

          this._container
            .call(zoom)
            .call(zoom.transform, d3.zoomIdentity);
        }

        _renderComponents(){
          this._initMainIcon()  //merge Icon
          this._initHeatOrRiver() // heat Map or River Chart
          this._initFilterButton()  // filter some low influence
          // this._initSlider()  //change Index height
        }

        _initMainIcon(){
          this._staticGroup
            .append('g')
            .call(g => g.append('image')
              .attr('class', 'mergeIcon')
              .attr('width', '25px')
              .attr('height','25px')
              .attr('transform', `translate(${[-45, -12.5]})`)
              .attr('href', mergeLabel))
            .on('click', (e,d) => {
              this._merge = !this._merge
              this._renderMerge()
              d3.select('.mergeIcon').attr('href', this._merge ? mergeLabel: deMergeLabel);
            })
        }

        _initHeatOrRiver(){
          const tabColor = this._buttonColor;
          const semiButton = this._staticGroup.append('g').attr('class', 'semiButton')
            .attr('transform', `translate(${[40, - this._height/2 + 2.5]})`);
          semiButton.call(g => g.append('rect')
              .attr('fill', this._heatOrRiver ? tabColor : 'white')
              .attr('rx', 5)
              .attr('ry', 5)
              .attr('stroke', tabColor)
              .attr('stroke-width', 0.5)
              .attr('height', this._buttonStyle.height)
              .attr('width', this._buttonStyle.width))
            .call(g => g.append('text')
              .attr('fill', this._heatOrRiver ? 'white' : tabColor)
              .attr('x', this._buttonStyle.textX)
              .attr('y', this._buttonStyle.textY)
              .text('heat'))
              .on('click', (e, d) => {
                if(!vm.contract){
                  this._heatOrRiver = !this._heatOrRiver
                  vm.riverStatus(this._heatOrRiver)
                }
                semiButton.select('rect').attr('fill', this._heatOrRiver ? tabColor : 'white')
                semiButton.select('text').attr('fill', this._heatOrRiver ? 'white' : tabColor)
              })
        }

        _initFilterButton(){
          const tabColor = this._buttonColor;
          const filterButton = this._staticGroup.append('g').attr('class', 'filterButton')
            .attr('transform', `translate(${[100, - this._height/2 + 2.5]})`);
          filterButton
            .call(g => g.append('rect')
              .attr('fill', this._fliterStatus ? tabColor : 'white')
              .attr('rx', 5)
              .attr('ry', 5)
              .attr('stroke', tabColor)
              .attr('stroke-width', 0.5)
              .attr('height', this._buttonStyle.height)
              .attr('width', this._buttonStyle.width))
            .call(g => g.append('text')
                .attr('fill', this._fliterStatus ? 'white' : tabColor)
                .attr('x', this._buttonStyle.textX)
                .attr('y', this._buttonStyle.textY)
                .text('filter'))
            .on('click', (e, d) => {
                if(!vm.contract){
                    this._fliterStatus = !this._fliterStatus
                    vm.changeStatus(this._fliterStatus)
                }
                // this._renderWheelFilter()
                filterButton.select('rect').attr('fill', this._fliterStatus ? tabColor : 'white')
                filterButton.select('text').attr('fill', this._fliterStatus ? 'white' : tabColor)
            })
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
              this._sliderInput = value;
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
            console.log(offsetX)
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
              .attr('width', width))
          sliderGroup.append('circle')
            .attr('r', 5)
            .attr('cx', 0)
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

        _initRadius(){
          const r = this._radius;
          
          r.max = Math.min(this._width, this._height) / (vm.contract ? 2 :2.5);
          r.inner = r.max * 0.30;
          r.bubble = r.max * 0.3;
          r.arc = r.max * 0.032;
          r.isize = r.max * 0.064;
          r.outer = r.max - r.bubble *1.1 - r.label;       
        }

        _initdata() {
          const field = this._field;
          this._padprocess=[[],[],[]];
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
              precipitation: d[field.precipitation],
              humidity: d[field.humidity],
              property:[
                {'label': 'PCAT2', 'value': d[field.humidity], 'angle': 0.1 , limit: 'humis'},
                {'label': 'PCASPE', 'value': d[field.precipitation], 'angle': 0.1, limit: 'precs'},
                {'label': 'result', 'value': d[field.precipitation], 'angle': 0.2, limit: 'result'}
              ]
            };
            const e=datum;
            datum.property.map(m => {
                m.process = +datum.month
            });
            datum.property[2].value=e.avg>e.low&e.high>e.avg? 0 : 1.6;
            let deviation=e.avg>e.low&e.high>e.avg? 0 : (e.avg<e.low ? (e.low-e.avg)/e.low : (e.avg-e.high)/e.high);
            datum.deviation=deviation;
            datum.over = e.avg>e.low&e.high>e.avg? 0 : (e.avg<e.low ? (e.low-e.avg) : (e.avg-e.high));
            return datum;
          });
        }

        _fliterScaleData(){
          this._chartData = this._sort(this._chartData);
          this._chartData = this._chartData.length > 25 ? this._chartData.slice(0,25) : this._chartData;
          const labels = this._chartData.map(d => d.indexName),
            lows = this._chartData.map(d => d.elow),
            highs = this._chartData.map(d => d.ehigh),
            precs = this._chartData.map(d => d.precipitation),
            humis = this._chartData.map(d => d.humidity);
          this._chartData.map(d => {
            this._padprocess[d.month].push(d.indexName)
            return d;
          });
          this._indexdata = this._chartData.slice(0);
          const mergeLength = this._indexdata.length < 25 ? this._indexdata.length :25,
              pad = 0,
              startAngle = Math.PI/6,
              angle = (Math.PI - 2 * startAngle - 3 * pad )/mergeLength;
          this._barAngle = (Math.PI - 2 * startAngle - 3 * pad) / mergeLength;
          const diverangle = (mergeLength - this._indexdata.length) * angle / 2
          const a = angle * this._padprocess[0].length + diverangle + Math.PI/6, b = angle * this._padprocess[1].length , c = angle * this._padprocess[2].length;
          this._padAngle=[
            [diverangle + Math.PI/6, a ],
            [a + pad, a + b + pad ],
            [a + b + 2 * pad, a + b + c + 2 * pad],
          ]
          this._label=labels
          this._initScales(labels, lows, highs, precs, humis);
        }

        _initScaleData(){
          const labels = this._chartData.map(d => d.indexName),
            lows = this._chartData.map(d => d.elow),
            highs = this._chartData.map(d => d.ehigh),
            precs = this._chartData.map(d => d.precipitation),
            humis = this._chartData.map(d => d.humidity);
          this._chartData.map(d => {
            this._padprocess[d.month].push(d.indexName)
            return d;
          });
          const pad = 0;
          const angle = (Math.PI * 2 - 3 * pad )/this._data.length
          this._barAngle = (Math.PI * 2- 3 * pad) / this._data.length;
          const a = angle * this._padprocess[0].length, b = angle * this._padprocess[1].length , c = angle * this._padprocess[2].length;
          this._padAngle=[
            [-a/2, a/2 ],
            [a/2 +pad, a/2 + b + pad ],
            [a/2 + b + 2 * pad, a/2 + b + c + 2 * pad],
          ]
          this._label=labels
          this._initScales(labels, lows, highs, precs, humis);
        }

        _initScales(labels, lows, highs, precs, humis) {
          const r = this._radius;

          this._x = d3.scaleBand()
            .domain(labels)
            .range([-0.3 * Math.PI, 1.66 * Math.PI ]);
          
          this._xpad = new Array(3).fill(3).map((d, i) => 
            d3.scaleBand()
            .domain(this._padprocess[i])
            .range(this._padAngle[i]))

          this._y = d3.scaleRadial()
            .domain([d3.min(lows), d3.max(highs)]).nice()
            .range([r.inner+0.1*r.bubble, r.outer-0.15*r.bubble]);

          const bext = d3.extent(precs);
          this._labelLimit.precs = d3.quantile(precs, 0.5);
          this._hb = d3.scaleLinear()
            .domain(bext)
            .range([0 , r.bubble*0.6]);

          this._labelLimit.humis = d3.quantile(humis, 0.5);
          const hext = d3.extent(humis);
          this._h = d3.scaleLinear()
            .domain(hext)
            .range([r.outer , r.outer + r.bubble * 0.6]);
        }

        _renderMainWheel() {
          this._contentG = this._g.append('g').attr('class', 'contentG').attr('transform', `translate(${this._merge || vm.contract ? 0 : this._width/2},0)`);
          this._renderWheelContent();
          this._initInnerOverlay();   //tooptip layer
          this._initChordData();      //init chord line data
          this._renderWheelChord();   //chord node and line
        }

        _renderMainBar(){
            const r = this._radius,
                R = r.outer+r.bubble*1.05,
                wm = this,
                lc =this._labelcolor,
                xpad = this._xpad,
                v = this._barAngle/2,
                mainG = this._g.append('g').attr('class', 'mainG'),
                line = d3.line()
                        .x(e => e[0])
                        .y(e => e[1])
                        .curve(d3.curveLinear),
                curve = d3.line().x(e => e[0]).y(e => e[1]).curve(d3.curveBumpX),
                pieAngle = d3.pie()
                        .value(d => d.angle)
                        .startAngle(0.5* Math.PI)
                        .endAngle(2.5 * Math.PI),
                piearc = d3.arc()
                        .innerRadius(0)
                        .outerRadius(r.arc);
            var limit = this._labelLimit,
                RectWidth = 650,
                arcX = 200,
                wheel_y = 0,
                rectX = r.outer + 280,  //rect_doct x
                chartHeight = this._sliderInput,   //rect max height
                chartPadding = {left: 1.5, right: 1.5, top: 2, bottom: 2, horizen: 3, vertical: 4},
								boxMargin = {bottom: 5, top: 5, left : 5, right: 5, horizen: 10, vertical:  10},
                chartMargin = 5,
								textWidth = 125,
								textMargin = {bottom: 5, top: 5, margin: 5, left : 5, right: 5, horizen: 10, vertical:  10},
								cardWidth = boxMargin.horizen + RectWidth + textWidth + textMargin.horizen,
                cardMargin = 20,
                rectNum =  null,
                opacityCache = null,
                selectInfo = this._indexdata,
                barVisObject = Object.assign({}, ...selectInfo.map(d => {return {[d.indexName] : this._barVis}})),
                indexArray = d3.map(selectInfo, (d, i) => i),
                indexSort = d3.map(selectInfo, d => d.indexName),
                horizenEX = batchData.map(d => this._sliderArray(selectInfo, d))
                    .map((d, i) => d.map((e, f) =>{ 
                            var temp = e.map(g => {
                                g.i = i;
                                return g
                            })
                            temp.i = i;
                            temp.d = f;
                            return temp
                        }
                    )),
                indexScale = null,// index  --- sort
                rectHeight = null,
                yScaleCache = null,
                yScale = null,  //指标在y轴上的坐标
                startXY = null,
                centerScaleY = null,
                lineToCircle = null,
                lineToRect = null,
                lastY = null,
                scaleArray = null,
                maxLength = batchData.length,  //batch numbers
                minRect = RectWidth/ (maxLength + 0.5),
                rectArray = new Array(maxLength).fill(0).map((d, i) => (batchData[i].length + 1) * 4.75),   //batch position
                // rectArray = new Array(maxLength).fill(minRect).map((d, i) => Math.ceil(maxLength/2) == i + 1 ? 1.5 * d : d),   //batch position
                rectPosition = Array.from(d3.cumsum(rectArray));
                RectWidth = rectPosition[rectPosition.length - 1];

                var mainAttrs = null, // init All Attrs
                  lineAttrs = null,
                  arcAttrs = null,
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
                  heatMapAttrs = null;

                this._initSlider()

                initOrdinal.call(this);
                renderyAxis();
                initAttrs.call(this); //init Element Attrs

                mainG.append('rect')
                    .attr('transform', `translate(${mainAttrs.transfrom})`)
                    .attr('width', mainAttrs.width)
                    .attr('height', mainAttrs.height)
                    .attr('fill', 'white')
                    .attr('stroke', 'null');
                mainG.on('wheel', function(e){
                  e.stopPropagation();
                  e.preventDefault();
                  if(wheel_y < selectInfo.length - 1 && wheel_y > 0){
                      wheel_y += (e.deltaY > 0 ? 1 : -1);
                  }else if(wheel_y == 0){
                      wheel_y += (e.deltaY > 0 ? 1 : 0);
                  }else if(wheel_y == selectInfo.length - 1){
                      wheel_y += (e.deltaY > 0 ? 0 : -1);
                  }else{
                      return 
                  }
                  renderyAxis();
                  renderSort();
                  wm._fliterStatus ? wm._renderWheelFilter() : undefined
                })
								.on('mouseover', function(e){})
								.on('mouseout', function(e){})

                
                var lineG = mainG.append('g').attr('class', 'lineG'),
                    arcG = mainG.append('g').attr('class', 'arcG');
                initLineG.call(this);
                initArcG.call(this);

								var cardG = mainG.append('g').attr('class', 'cardG');
								initCardG.call(this);

                var sliderG = mainG.append('g').attr('class', 'sliderG').attr('transform', sliderAttrs.transform),
                    rectG = mainG.append('g').attr('class', 'rectG');
                initDragG();
                

                var timeScale;
                //     //https://observablehq.com/d/d503153fbfd48b03

                var gradientG = mainG.append('g').attr('class', 'gradientG');
                initLinearGradient();

                var mergeG = mainG.append('g').attr('class', 'mergeG').attr('transform', sliderAttrs.transform);
                wm._horizonView ? initMergeArea() : initHorizenArea();
                if(rectArray.some(d => d === chartHeight))initRectG()
                // initAxisG(timeScale);

                var triangleG = mainG.append('g').attr('class', 'triangleG');
                initTriangleG();

                var barG = mainG.append('g').attr('class', 'barG');
                initBarG.call(this);

                var mouseInfo = this._mouseDis !== undefined ? mouseText(this._mouseDis) : undefined,
                  textG = mainG.append('g').attr('class', 'textG');
                initMouseG();

                let sortG = this._staticGroup.append('g').attr('class', 'sortG');
                initSort.call(this);

                const switchG = this._staticGroup.append('g').attr('class', 'switchG');
                initSwitch.call(this);

                const visG = this._staticGroup.append('g').attr('class', 'visG');
                initVisG.call(this);

                // const 
                // const heatMapG = mainG.append('g').attr('class', 'heatMapGroup');
                // initMapArea()
                // heatMapG.raise();

                renderSort()

                function initAttrs(){
									const textX = rectX + boxMargin.left + textMargin.left,
										chartStart = boxMargin.left + textMargin.horizen + textWidth;
                  mainAttrs = {
                    transfrom: [rectX, -this._height/2],
                    width: RectWidth,
                    height: this._height
                  }
                  lineAttrs = {
                    lineStroke: d => d3.color(lc[d.month]).darker(0.5),
                    lineStrokeWidth: 1,
                    numberTransform: d => `translate(${[rectX - arcX, centerScaleY(d) + 2.5]})`,
                    numberText: (d, i) => +indexScale(i) + 1,
                    circleTransform: d =>  `translate(${[rectX - arcX, centerScaleY(d)]})`,
                    circleStroke: d => d3.color(lc[d.month]).darker(0.5),
                    circleFill: d => lc[d.month],
                    indexTransform: d => `translate(${[rectX - arcX + 55, centerScaleY(d) + 2]})`,
                    indexFill: d => d3.color(lc[d.month]).darker(0.5)
                  }
									cardAttrs ={
										position: `translate(${[rectX, 0]})`,
                    opacity: opacityCache,
                    transform: (d, i) => `translate(${[0, yScale(i) - chartHeight - boxMargin.top - chartMargin/2]})`,
                    rectHeight: chartHeight * 2 + boxMargin.top + boxMargin.bottom + chartMargin,
                    rectWidth: cardWidth,
										indexNameTransform: (d, i) =>`translate(${[boxMargin.left + textMargin.left,  boxMargin.top/2]})`,
                    mergeTransform: `translate(${[chartStart, chartHeight + boxMargin.top + chartMargin + chartPadding.top]})`,
                    mergeWidth: RectWidth,
                    mergeHeight: chartHeight - chartPadding.vertical
									}
                  arcAttrs = {
                    transform: d => `translate(${[rectX - arcX + 20, centerScaleY(d)]})`,
                    stroke: d => d3.color(lc[+d.data.process]).darker(2),
                    fill: d => ((+d.data.value)> limit[d.data.limit]? lc[+d.data.process] : 'white'),
                    stroke_width: 0.25,
                  }
                  sliderAttrs = {
                    transform: `translate(${[rectX + chartStart, 0]})`
                  }                  
                  dragAttrs = {
                    transform: d => `translate(${[rectPosition[d], 0]})`,
                    dragElementTransform: (d, i) => `translate(${[0 , yScale(i)]})`,
                    opacity: opacityCache,
                    dragHeight: chartHeight,
                    dragYlevel: -chartHeight,
                  }
                  iconAttrs = {
                    position: `translate(${[rectX - chartHeight, 0]})`,
                    transform: (d, i) =>`translate(${[0, yScale(i) - chartHeight ]})`,
                    opacity: opacityCache,
                    elementOpacity: d => barVisObject[d.indexName] ? 'visible' : 'hidden',
                    lineStroke: d => d3.color(lc[d.month]).darker(0.5),
                    lineY1: chartHeight /2 + 10,
                    lineTransform: `translate(${[chartHeight/2, 0]})`,
                    lineY2: (d, i) => rectHeight[i+1],
                    lineStrokeWidth: 0.5,
                    rectTransform: `translate(${[chartHeight/2, chartHeight/2]})`,
                    rectFill: d => lc[d.month],
                    icon: d => barVisObject[d.indexName] ? 'M-5,-2.5l10,0l-5,5l-5,-5zM-5,-2.5z' : 'M-2.5,0l0,-5l5,5l-5,5zM-2.5,0z'
                  }
                  sortAttrs = {
                    transform: d => `translate(${[340 + d * 60, -this._height/2 + 2.5]})`,
                    text: ['Single' ,'Limit', 'Total'],
                    sortColor: this._buttonColor,
                    sortChange: (value1, value2) => d => d === (this._indexScale !== undefined ? this._indexScale : 0) ? value1: value2
                  },
                  switchAttrs ={
                    transform: d => `translate(${[160 +  60 * (1 - d), - this._height/2 + 2.5]})`,
                    text: ['Horizon', 'River'],
                    color: this._buttonColor,
                    colorfunc: (v1, v2) => d => this._horizonView == Boolean(d) ? v1 : v2
                  }
                  mergeAttrs = {
                    transform: (d, i) =>`translate(${[(i== 0 ? 0 : rectPosition[i -1 ]) , 0]})`,
                    elementOpacity: (d, i) => barVisObject[d[0].indexName] ? opacityCache(d, i) : 0,
                    elementTransform: (d, i) =>`translate(${[0, yScale(i) + chartHeight]})`,
                  }
                  Object.assign(mergeAttrs, areaParameter(rectArray, horizenEX))

                  horizenAttrs = {
                    transform: (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ] + chartStart, 0]})`,
                    elementOpacity: (d, i) => barVisObject[d[0].indexName] ? opacityCache(d, i) : 0,
                    elementTransform: (d, i) =>`translate(${[0, yScale(i)  +  chartPadding.top]})`,
                    overlap: 3,   //horizen layer
                    overlapNum: [-1, -2, -3, 0, 1, 2],
                    overHeight: [-3 , -2 , -1, 1, 2 , 3].map(d => d * (chartHeight - chartPadding.top - chartPadding.bottom)),
                    elementHeight: chartHeight - chartPadding.top - chartPadding.bottom
                  }
                  horizenAttrs.horizenArea = horizenParameter(rectArray, horizenEX)
                  horizenAttrs.horizenColor = i => ['#e34649', '#f7a8a9', '#fcdcdc', '#f7f7f7', '#fcdcdc','#f7a8a9', '#e34649'][i + (i >= 0) + horizenAttrs.overlap];
                  barAttrs = {
                    position: `translate(${[rectX  + boxMargin.left, chartMargin/2]})`,
                    transform: (d, i) =>`translate(${[chartPadding.left, yScale(i) + chartPadding.top]})`,
                    opacity: (d, i) => barVisObject[d.indexName] ? opacityCache(d, i) : 0,
                    borderHeight: chartHeight - chartPadding.vertical,
                    borderWidth: textWidth - chartPadding.horizen,
                    borderStroke: (d, i) => lc[selectInfo[i].month]
                  }
                  Object.assign(barAttrs, initBarData())
                  textAttrs = {
                    position: `translate(${[rectX, 0]})`,
                    line0: yScale(0) - chartHeight,
                    line1: lastY,
                    opacity: (d, i) => barVisObject[d.indexName] ? opacityCache(d, i) : 0,
                    transform: (d, i) =>`translate(${[mouseInfo ?  wm._mouseDis - 10 : 0 , yScale(i) + chartHeight/2]})`,
                    text: (d, i) => mouseInfo !==undefined ? (+mouseInfo[i]).toFixed(2) : ''
                  }
                  heatMapAttrs = {
                    position: `translate(${[rectX + chartStart, 0]})`,
                    transform: (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`,
                    opacity: opacityCache,
                    elementTransform: (d, i) =>`translate(${[0, yScale(i)]})`,
                    rectHeight: chartHeight/2,
                    qY: -chartHeight/2,
                    t2Y: -chartHeight
                  };
                  Object.assign(heatMapAttrs, heatMapParameter(rectArray, horizenEX))

                  rectAttrs = {
                    transform: (d, i) =>`translate(${[0, yScale(i) - chartHeight]})`,
                    rectHeight: chartHeight,
                    rectWidth: chartHeight,
                    opacity: opacityCache
                  };
                }

                function initOrdinal(){
                    // tempsort = d3.map(d3.sort(selectInfo, d => -d.over), d => d.indexName),
                    // sortArray = d3.map(indexSort, d => tempsort.indexOf(d)),
                    // var tempsort = d3.map(d3.sort(selectInfo, d => -d.humidity), d => d.indexName),
                    //     sortArray = d3.map(indexSort, d => tempsort.indexOf(d)),
                    //     totalSort = d3.map(d3.sort(selectInfo, d => -d.precipitation), d => d.indexName),
                    //     totalArray = d3.map(indexSort, d => totalSort.indexOf(d));
                    // var scaleArray = [d3.scaleOrdinal().domain(indexArray).range(sortArray), d3.scaleOrdinal().domain(indexArray).range(sortArray), d3.scaleOrdinal().domain(indexArray).range(totalArray)];
                    var timeArray = batchData.map(d => d[0].toc),
                        batchIndex;
                    for(let item in timeArray){
                        if(timeArray[item] >= vm.steeltoc){
                            batchIndex = item
                            break
                        }
                    }
                    var selfBatch = horizenEX[batchIndex];
                    var oversort = d3.map(d3.sort(selfBatch, d => -d3.mean(d, e => e.over)), d => d[0].indexName),
                        overArray = d3.map(indexSort, d => oversort.indexOf(d)),
                        Qsort = d3.map(d3.sort(selfBatch, d => -d3.mean(d, e => e.Q)), d => d[0].indexName),
                        QArray = d3.map(indexSort, d => Qsort.indexOf(d)),
                        T2sort = d3.map(d3.sort(selfBatch, d => -d3.mean(d, e => e.T2)), d => d[0].indexName),
                        T2Array = d3.map(indexSort, d => T2sort.indexOf(d));

                    scaleArray = [d3.scaleOrdinal().domain(indexArray).range(overArray) , d3.scaleOrdinal().domain(indexArray).range(QArray), d3.scaleOrdinal().domain(indexArray).range(T2Array)];
                    indexScale = this._indexScale !== undefined ? scaleArray[this._indexScale] : scaleArray[0];
                }
                function renderyAxis(){
                    let invert = d3.scaleOrdinal().domain(indexScale.range()).range(indexScale.domain())
                    rectHeight = indexArray.map((d, i) => (barVisObject[indexSort[invert(+d)]] ? 2 : 1 )* chartHeight + boxMargin.vertical + cardMargin)
                    // console.log(rectHeight)
                    rectHeight.unshift(0)   //定位第一个元素
                    yScaleCache = Array.from(d3.cumsum(rectHeight)).map(d => -wm._height/2 + 2 * chartHeight + d);
                    rectNum = yScaleCache.filter(d => d < wm._height/2 - chartHeight ).length;
                    opacityCache = (d, i) => wheel_y <= indexScale(i) && indexScale(i) < rectNum + wheel_y ? 1 : 0;
                    var baseHeight = yScaleCache[0] - yScaleCache[wheel_y];
                    yScale = i => yScaleCache[indexScale(i)] + baseHeight;
                    startXY = d => [R * (Math.sin(xpad[d.month](d.date)+ v)), -R * Math.cos(Math.abs(xpad[d.month](d.date)+ v))];
                    centerScaleY = d => startXY(d)[1] + 25/startXY(d)[0] * startXY(d)[1];
                    lastY = wm._height/2 - chartHeight;
                    lineToRect = (d, i) =>{
                        let centerY = centerScaleY(d),
                            endY = yScale(+i) - chartHeight * 0.4;
                        return [[rectX - arcX + 75, centerY],[rectX - arcX + 85, centerY], [rectX - 0.5 * chartHeight , endY]]
                    };
                    lineToCircle = d =>{
                        let [startX, startY] = startXY(d),
                        centerY = centerScaleY(d);
                        return [[startX, startY], [startX + 25, centerY], [rectX - arcX + 30, centerY]]
                    };
                    initAttrs.call(wm);
                }
                function initTriangleG(){// init triangleG
                  triangleG.attr('transform', iconAttrs.position)
                    .selectAll('g')
                      .data(selectInfo)
                      .join('g')
                      .attr('opacity', iconAttrs.opacity)
                      .attr('transform', iconAttrs.transform)
                      .call(g => g.append('line')
                        .attr('visibility', iconAttrs.elementOpacity)
                        .attr('y1', iconAttrs.lineY1)
                        .attr('transform', iconAttrs.lineTransform)
                        .attr('y2', iconAttrs.lineY2)
                        .attr('stroke', iconAttrs.lineStroke)
                        .attr('stroke-width', iconAttrs.lineStrokeWidth))
                      .call(g => g.append('path')
                          .attr('transform', iconAttrs.rectTransform)
                          .attr('d', iconAttrs.icon)
                          .attr('fill', iconAttrs.rectFill))
                      .on('click', function(e, d){
                          const t = d3.transition()
                              .duration(300)
                              .ease(d3.easeLinear);
                          barVisObject[d.indexName] = !barVisObject[d.indexName]; 
                          d3.select(this).select('line').attr('visibility', iconAttrs.elementOpacity).transition(t)
                          d3.select(this).select('path').attr('d', iconAttrs.icon).transition(t);
                          renderyAxis();
                          renderSort();
                      })
                }
                function initLineG(){
                    lineG.selectAll('g').data(selectInfo).join('g')
                        .attr('opacity', opacityCache)
                        .call(g => g.append('path')
                          .attr('stroke', lineAttrs.lineStroke)
                          .datum(lineToCircle)
                          .attr('d', d => line(d))
                          .attr('stroke-width', lineAttrs.lineStrokeWidth)
                          .attr('fill', 'none'))
                        .call(g => g.append('circle')
                          .attr('fill', lineAttrs.circleFill)
                          .attr('r', r.arc)
                          .attr('stroke', lineAttrs.cIrcleStroke)
                          .attr('transform', lineAttrs.circleTransform))
                        .call(g => g.append('text')
                          .attr('class', 'sortIndex')
                          .text(lineAttrs.numberText)
                          .attr('transform', lineAttrs.numberTransform))
                        .call(g => g.append('text')
                          .attr('font-size', '8px')
                          .attr('class', d => `indexName arctext${d.month}`)
                          .attr('id', d => `arctext${d.indexName}`)
                          .attr('fill', lineAttrs.indexFill)
                          .text(d => d.indexName.replace(/thickness/, '').replace(/temp_uniformity_/, '').replace(/wedge/, '').slice(0, 8))
                          .attr('transform', lineAttrs.indexTransform))
                        .call(g => g.append('path')
                            .attr('class', 'lineToRect')
                            .attr('stroke', lineAttrs.lineStroke)
                            .attr('d', (d, i) => curve(lineToRect(d, i)))
                            .attr('stroke-width', lineAttrs.lineStrokeWidth)
                            .attr('fill', 'none')
                            .on('mouseover', this._stopPropagation)
                            .on('mouseout', this._stopPropagation))
                        .on('mouseover', (e, d) => {
                          this._overed(e, d.indexName, d.month)
                        })
                        .on('mouseout', (e, d) => {
                          this._outed(e, d.indexName, d.month)
                        })
                }
                function initArcG(){
                  arcG.selectAll('g').data(selectInfo)
                    .join('g')
                    .attr('transform', arcAttrs.transform)
                    .attr('opacity', opacityCache)
                    .call(g => g.selectAll('path').data(d => pieAngle(d.property))
                      .join('path')
                      .attr('d', piearc)
                      .attr('fill', arcAttrs.fill)
                      .style('stroke', arcAttrs.stroke)
                      .attr('opacity', 1)
                      .style('stroke-width', arcAttrs.stroke_width)
                    )
                }
								function initCardG(){
									cardG
										.attr('transform', cardAttrs.position)
										.selectAll('g').data(selectInfo).join('g')
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
                        .call(g => g.append('line')
                          .attr('x1', 0.25)
                          .attr('y1', chartHeight + boxMargin.top + chartMargin/2)
                          .attr('y2', chartHeight + boxMargin.top + chartMargin/2)
                          .attr('x2', cardAttrs.rectWidth - 0.25)
                          .attr('stroke-width', 0.25)
                          .attr('stroke', this._borderStyle.color))
                        .call(g => g.append('rect')
                          .attr('class', 'mergeCard')
                          .attr('transform', cardAttrs.mergeTransform)
                          .attr('height', cardAttrs.mergeHeight)
                          .attr('width', cardAttrs.mergeWidth)
                          .attr('stroke', this._borderStyle.color)
                          .attr('filter', 'url(#card-shadow)')
                          .attr('stroke-width', 0.25)
                          .attr('rx', this._borderStyle.rx)
                          .attr('ry', this._borderStyle.ry)
                          .attr('fill', 'none'))
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
                function updateCardG(t){
                  cardG
                    .transition(t)
                    .selectAll('g').attr('opacity', cardAttrs.opacity).attr('transform', cardAttrs.transform)
                }
                function initDragG(){
                    sliderG.selectAll('dragG')  //area drag
                    .data(Object.keys(rectPosition).map(d => +d).slice(0, -1)).join('g')
                    .attr('class', 'dragG')
                    .attr('transform', dragAttrs.transform)
                    .call(g => g
                      .call(g => g.selectAll('g')
                        .data(selectInfo)
                        .join('g')
                        .attr('class', 'dragElement')
                        .attr('opacity', dragAttrs.opacity)
                        .attr('transform', dragAttrs.dragElementTransform)
                        .call(g => g.append('rect')
                          .attr('width', 0.5)
                          .attr('y', dragAttrs.dragYlevel)
                          .attr('height', dragAttrs.dragHeight))
                        .call(g => g.append('rect')
                          .attr('width', 5)
                          .attr('x', -2.5)
                          .attr('y', dragAttrs.dragYlevel)
                          .attr('height', dragAttrs.dragHeight)
                          .attr('opacity', 0)))
                      .call(d3.drag()
                        .on('drag', dragMove)
                      ))
                }
                function dragMove(e, d){    //update batch
                    rectPosition[d] = e.x
                    rectPosition = Array.from(rectPosition);
                    rectPosition.unshift(0);
                    var rectlength = d3.pairs(rectPosition, (a, b) => b -a).filter((d, i) => i + 1 !== Math.ceil(maxLength/2));
                    if(!rectlength.every(d => d > chartHeight - 5)){   //RectWidth/ maxLength/2
                        minRect = chartHeight
                    }else{
                        minRect = (minRect ==  d3.min(rectlength)) ? d3.max(rectlength) : d3.min(rectlength);
                    }
                    if( RectWidth - (maxLength - 1) * minRect < RectWidth /maxLength)minRect = (RectWidth - RectWidth /maxLength)/(maxLength - 1)
                    rectArray = new Array(maxLength).fill(minRect).map((d, i) => Math.ceil(maxLength/2) == i + 1 ? RectWidth - (maxLength - 1) * minRect : d);   
                    rectPosition = d3.cumsum(rectArray)
                    d3.selectAll('.dragG')
                        // .transition(d3.transition()
                        //     .duration(200)
                        //     .ease(d3.easeLinear))
                        .attr('transform', d => `translate(${[rectPosition[d], 0]})`)
                    initAttrs.call(wm);
                    updateArea();
                    renderAxisG(timeScale);
                    minRect !== chartHeight ? rectG.selectAll('g').remove() : initRectG();
                }
                function initSort(){//init sortG
                    sortG.selectAll('g')
                        .data([0, 1, 2])
                        .join('g')
                        .attr('transform', sortAttrs.transform)
                        .call(g => g.append('rect')
                            .attr('fill',  sortAttrs.sortChange(sortAttrs.sortColor, '#fff'))
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
                        .on('click', (e, d) =>{
                            // wheel_y = 0; //when sort indexes, save wheel_y status or not
                            indexScale = scaleArray[d];
                            this._indexScale = d;
                            renderyAxis()
                            renderSort()
                        })
                }
                function mouseText(dis){// calculate abscissa
                    let sumsearch = d3.leastIndex(rectPosition, d => dis > d),
                        indexsearch = sumsearch === 0 ? dis : dis - rectPosition[sumsearch],
                        mouseDate = new Date(timeScale[sumsearch].invert(indexsearch)),
                        selectDate = horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time).time),
                        mouseInfo = horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time)[wm._horizonView ? 'ovalue' : 'ovalue']);
                    // if(wm._horizonView){
                    //     sliderG.selectAll('circle').attr('r', 2)
                    //     sliderG.selectAll('circle').attr('r', d => d.time.toString() !== selectDate[0].toString() ? 2 : 3.5)
                    // }
                    return mouseInfo
                }
                function renderSort(){//render sortG
                  const t = d3.transition()
                    .duration(300)
                    .ease(d3.easeLinear);
                  lineG
                    .transition(t)
                    .call(g => g.selectAll('g').attr('opacity', opacityCache))
                    .call(g => g.selectAll('.sortIndex').text(lineAttrs.numberText))
                    .call(g => g.selectAll('.lineToRect').attr('d', (d, i) => curve(lineToRect(d, i))));
                  updateCardG(t);
                  mergeG
                    .transition(t)
                    .call(g => g.selectAll('.batchElement')
                        .attr('opacity', mergeAttrs.elementOpacity)
                        .attr('transform', mergeAttrs.elementTransform))
                  sliderG
                    .transition(t)
                    .call(g => g.selectAll('.horizenElement')
                        .attr('opacity', horizenAttrs.elementOpacity)
                        .attr('transform', horizenAttrs.elementTransform))
                    .call(g => g.selectAll('.dragElement')
                        .attr('opacity', dragAttrs.opacity)
                        .attr('transform', dragAttrs.dragElementTransform))
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
                    .call(g => g.selectAll('rect').attr('fill',  sortAttrs.sortChange(sortAttrs.sortColor, '#fff')))
                    .call(g => g.selectAll('text').attr('fill', sortAttrs.sortChange('#fff', sortAttrs.sortColor)))
                    triangleG
                      .transition(t)
                      .call(g => g.selectAll('g').attr('transform', iconAttrs.transform).attr('opacity', iconAttrs.opacity))
                      .call(g => g.selectAll('path').attr('d', iconAttrs.icon))
                    textG
                      .transition(t)
                      .call(g => g.selectAll('text').attr('opacity', textAttrs.opacity).attr('transform', textAttrs.transform))
                    textG.select('.mouseG').raise()
                    textG.raise()
                    if(wm._mouseDis !== undefined){
                        var mouseInfo = mouseText(wm._mouseDis);
                        textG.selectAll('text')
                            .transition(t)
                            .text((d, i) => (+mouseInfo[i]).toFixed(2))
                    }
                    // heatMapG.selectAll('.heatMapElement')
                    //   .transition(t)
                    //   .attr('opacity', heatMapAttrs.opacity)
                    //   .attr('class', 'heatMapElement')
                    //   .attr('transform', heatMapAttrs.elementTransform)
                    arcG
                      .transition(t)
                      .call(g => g.selectAll('g').attr('transform', arcAttrs.transform).attr('opacity', opacityCache))
                    arcG.raise()
                    barG.raise()
                    lineG.raise()
                }
                function renderShape(){
                  const t = d3.transition()
                    .duration(300)
                    .ease(d3.easeLinear);
                  lineG.transition(t)
                    .call(g => g.selectAll('rect').attr('height', lineAttrs.rectHeight).attr('transform', lineAttrs.rectTransform))
                    .call(g => g.selectAll('.sortIndex').attr('transform', lineAttrs.numberTransform))
                    .call(g => g.selectAll('circle').attr('transform', lineAttrs.circleTransform))
                    .call(g => g.selectAll('.indexName').attr('transform', lineAttrs.indexTransform));
                  sliderG.selectAll('.dragG')
                    .transition(t)
                    .call(g => g.selectAll('rect').attr('y', dragAttrs.dragYlevel).attr('height', dragAttrs.dragHeight))
                    .call(g => g.selectAll('.dragElement')
                        .attr('opacity', dragAttrs.opacity)
                        .attr('transform', dragAttrs.dragElementTransform))
                  triangleG
                    .attr('transform', iconAttrs.position)
                    .transition(t)
                    .call(g => g.selectAll('line').attr('y1', iconAttrs.lineY1).attr('transform', iconAttrs.lineTransform).attr('y2', iconAttrs.lineY2))
                    .call(g => g.selectAll('path').attr('transform', iconAttrs.rectTransform))
                  if(wm._horizonView){
                    mergeG.selectAll('.batchElement')
                      .transition(t)
                      .attr('opacity', mergeAttrs.elementOpacity)
                      .attr('transform', mergeAttrs.elementTransform)
                      .call(g => g.selectAll('.path4').attr('d', mergeAttrs.mergeArea[4]))
                      .call(g => g.selectAll('.path3').attr('d', mergeAttrs.mergeArea[3]))
                      .call(g => g.selectAll('.path2').attr('d', mergeAttrs.mergeArea[2]))
                      .call(g => g.selectAll('.path1').attr('d', mergeAttrs.mergeArea[1]))
                      .call(g => g.selectAll('.path0').attr('d', mergeAttrs.mergeArea[0]))
                      .call(g => g.selectAll('.line').attr('d', mergeAttrs.mergeLine))
                      .call(g => g.selectAll('circle').attr('transform', mergeAttrs.mergeLocation))
                  }else{
                    sliderG.selectAll('.horizenG')
                      .transition(t)
                      .call(g => g.selectAll('path').attr('d', horizenAttrs.horizenArea))
                      .call(g => g.selectAll('.clipRect').attr('height', horizenAttrs.elementHeight))
                      .call(g => g.selectAll('use').attr('transform', (d, i) => `translate(0,${(horizenAttrs.overlapNum[i] + 1) * (horizenAttrs.elementHeight)})`))
                  }
                  updateBarG(t)
                  textG
                    .transition(t)
                    .call(g => g.select('line').attr('y1', textAttrs.line0).attr('y2', textAttrs.line1)
                      .attr('transform', (d, i) =>`translate(${[mouseInfo ? wm._mouseDis : 0, 0]})`))
                  initMapArea()
                }
                function initSwitch(){ //init switchG
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
                        .on('click', (e, d) =>{
                            if(wm._horizonView !== Boolean(d)){
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
                                if(wm._horizonView){
                                    sliderG.selectAll('.horizenG')
                                    .remove();
                                    initMergeArea()
                                }else{
                                    mergeG.selectAll('.batchG')
                                    .remove();
                                    initHorizenArea()
                                }
                            }
                        })
                }
                function initVisG(){
                    visG
                        .attr('transform', `translate(${[280, - this._height/2 + 2.5]})`)
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
                    visG.on('click', function(e, d){
                            wm._barVis = !wm._barVis;
                            d3.select(this).select('rect').attr('fill', wm._barVis ? switchAttrs.color : 'white')
                            d3.select(this).select('text').attr('fill', wm._barVis ? 'white' : switchAttrs.color)
                            barVisObject = Object.assign({}, ...selectInfo.map(d => {return {[d.indexName] : wm._barVis}}))
                            renderyAxis();
                            renderSort();
                        })
                }
                function initAxisG(batchTimeScale){ //init timeTick
                    sliderG.selectAll('.axisG').data(rectPosition)
                        .join('g')
                        .attr('class', 'axisG')
                        .attr('transform', (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], lastY]})`)
                        .call(g =>g
                            .style('font', '6px')
                            .style('font-weight', 'normal')
                            .style('color', 'grey')
                            .each(function(d,i) {
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
                function initBarG(){  //init BarG
                    barG
                      .attr('transform', barAttrs.position)
                        .selectAll('g').data(selectInfo).join('g')
                        .attr('opacity', barAttrs.opacity)
                        .attr('transform', barAttrs.transform)
                        .call(g => g.append('rect')
                            .attr('class', 'border')
                            .attr('height', barAttrs.borderHeight)
                            .attr('width', barAttrs.borderWidth)
                            .attr('stroke', barAttrs.borderStroke)
                            .attr('fill', 'white')
                            .attr('stroke-width', 0.25))
                        .call(g => g.selectAll('.goodSteel')
                            .data((d, i) => barAttrs.barGoodData[i])
                            .join('rect')
                            .attr('class', 'goodSteel')
                            .attr('fill', this._flagColor[1])
                            .attr('x', d => barAttrs.barXscale[d.index](d.x0))
                            .attr('height', d => barAttrs.barYscale[d.index](d.length))
                            .attr('width', d => barAttrs.barXscale[d.index](d.x1) - barAttrs.barXscale[d.index](d.x0))
                            .attr('y', d => barAttrs.borderHeight - barAttrs.barYscale[d.index](d.length)))
                        .call(g => g.selectAll('.badSteel')
                            .data((d, i) => barAttrs.barBadData[i])
                            .join('rect')
                            .attr('class', 'badSteel')
                            .attr('fill', this._flagColor[0])
                            .attr('x', d => barAttrs.barXscale[d.index](d.x0))
                            .attr('height', d => barAttrs.barYscale[d.index](d.length))
                            .attr('width', d => barAttrs.barXscale[d.index](d.x1) - barAttrs.barXscale[d.index](d.x0))
                            .attr('y', d => barAttrs.borderHeight - barAttrs.barYscale[d.index](d.length)))
                        .on('click', clickScale)
                }
                function updateBarG(t){
                  barG
                    .transition(t)
                    .attr('transform', barAttrs.position)
                    .call(g => g.selectAll('.border').attr('height', barAttrs.borderHeight).attr('width', barAttrs.borderWidth))
                    .call(g => g.selectAll('.goodSteel')
                      .attr('x', d => barAttrs.barXscale[d.index](d.x0))
                      .attr('height', d => barAttrs.barYscale[d.index](d.length))
                      .attr('width', d => barAttrs.barXscale[d.index](d.x1) - barAttrs.barXscale[d.index](d.x0))
                      .attr('y', d => barAttrs.borderHeight - barAttrs.barYscale[d.index](d.length)))
                    .call(g => g.selectAll('.badSteel')
                      .attr('x', d => barAttrs.barXscale[d.index](d.x0))
                      .attr('height', d => barAttrs.barYscale[d.index](d.length))
                      .attr('width', d => barAttrs.barXscale[d.index](d.x1) - barAttrs.barXscale[d.index](d.x0))
                      .attr('y', d => barAttrs.borderHeight - barAttrs.barYscale[d.index](d.length)))
                }
                function initBarData(){
                    const barValue = selectInfo.map((d, i) => horizenEX.map(e => e[i]).flat()),
                        barData = barValue.map((d, i) => d3.bin().thresholds(30)(d.map(e => e.value)).map(e => {e.index = i;return e})),
                        barYscale = barData.map(d => d3.scaleLinear().domain([0, d3.max(d, f => f.length) * 1.1]).range([0, barAttrs.borderHeight])),
                        barXscale = barData.map(d => d3.scaleLinear().domain([d3.min(d, f => f.x0), d3.max(d, f => f.x1)]).range([0, barAttrs.borderWidth])),
                        barGoodData = barValue.map((d, i) => d3.bin().thresholds(30)((d.filter(e => e.flag == 1)).map(e => e.value)).map(e => {e.index = i;return e})),
                        barBadData = barValue.map((d, i) => d3.bin().thresholds(30)((d.filter(e => e.flag == 0)).map(e => e.value)).map(e => {e.index = i;return e}));
                    return {
                        barValue,barYscale,barXscale,barGoodData,barBadData,barData
                    }
                }
                function initMouseG(){
                    textG
                    .attr('transform', textAttrs.position)
                    .append('line')
                        .attr('class', 'mouseG')
                        .attr('y1', textAttrs.line0)
                        .attr('y2', textAttrs.line1)
                        .attr('transform', (d, i) =>`translate(${[mouseInfo ? wm._mouseDis : 0, 0]})`)
                        .attr('stroke', mouseInfo !== undefined ? '#bbbcbd' : 'none')
                        .attr('stroke-width', 0.25)
                    textG.selectAll('text').data(selectInfo).join('text')
                        .attr('opacity', textAttrs.opacity)
                        .attr('transform', textAttrs.transform)
                            .text(textAttrs.text)
                            .attr('fill', 'black')
                    sliderG.on('mousemove', (e, d) => {
                        let mouseDis = e.offsetX - rectX;//mouse distance
                        if(mouseDis <= 0)return
                        textG.select('.mouseG')
                            .attr('transform', (d, i) =>`translate(${[mouseDis, 0]})`)
                            .attr('stroke', '#bbbcbd')
                        mouseInfo = mouseText(mouseDis);
                        wm._mouseDis = mouseDis;
                        textG.selectAll('text')
                            .attr('transform', textAttrs.transform)
                            .text(textAttrs.text)
                    })
                }
                function initRectG(){
                    rectG
                      .attr('transform', sliderAttrs.transform)
                        .selectAll('.rectG').data(Object.keys(rectPosition).filter((d, i) => i !== Math.ceil(maxLength/2) - 1))
                        .join('g')
                        .attr('transform', d =>`translate(${[d == 0 ? 0 : rectPosition[+d -1 ], 0]})`)
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
                                .attr('stroke',function(d){
                                    return d3.color(d3.select(this).attr('fill')).darker(0.5)
                                })
                                .on('mousemove', (e, d) => {
                                    e.stopPropagation()
                                }))
                            .call(g => g.append('polygon')
                                .attr('transform', `translate(${[rectAttrs.rectWidth/2, rectAttrs.rectHeight/2]})`)
                                .attr('points', d => wm._horizonPoint(d, rectAttrs.rectWidth/2, true))
                                .attr('fill', '#c65b24')
                                .attr('opacity', 0.6)
                                .attr('stroke', '#c65b24'))
                            .call(g => g.append('polygon')
                                .attr('transform', `translate(${[rectAttrs.rectWidth/2, rectAttrs.rectHeight/2]})`)
                                .attr('points', d => wm._horizonPoint(d, rectAttrs.rectWidth/2, false))
                                .attr('fill', '#c65b24')
                                .attr('opacity', 0.6)
                                .attr('stroke', '#c65b24')))
                  rectG.raise()
                }
                function infoArea(arr, index, flag){// barG bin distribute
                    let data = horizenEX.map(d => d[index]).flat().map(d => d.value),
                        bin = d3.bin().thresholds(15)(data),
                        y = d3.scaleLinear().domain([bin[0].x0, bin[bin.length - 1].x1]).range([2, chartHeight - 2]),
                        bin2 = d3.bin().thresholds(15)(horizenEX.slice(Math.ceil(maxLength / 2)- 1, Math.ceil(maxLength / 2)).map(d => d[index]).flat().map(d => d.value)),
                        x = d3.scaleLinear().domain([0, d3.max(bin, d => d.length)]).range([0, chartHeight - 2]),
                        area = d3.area()
                            .x0(d => chartHeight - 2 -x(d.length))
                            .x1(chartHeight)
                            .y(d => y((d.x0 + d.x1)/2));
                    return flag ? area(bin) : area(bin2) 
                }
                function renderAxisG(batchTimeScale){// render timeTick
                    sliderG.selectAll('.axisG')
                        .transition(d3.transition()
                            .duration(200)
                            .ease(d3.easeLinear))
                        .attr('transform', (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], lastY]})`)
                        .each(function(d,i) {
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
                function areaParameter(array, data){	//area function
                    let xBatch = array.map((d, i) => {
                        let l = array[i],
                            scale = d3.scaleLinear()
                                // .range([0, l])
                                .range([chartPadding.left, l - chartPadding.right])
                                .domain(d3.extent(data[i][0], (e, f)=> e.time));
                        return scale
                    });
                    let mergeOffsets = array.map((d, i) => {
                        let scale = d3.scaleLinear()
                                // .range([0, l])
                                .range([0, 1])
                                .domain(d3.extent(data[i][0], (e, f)=> e.time));
                        return scale;
                    });
                    let yBatch = selectInfo.map((d, i) => {
                        let scale = d3.scaleLinear()
                                .range([0, chartHeight - chartPadding.top])
                                //有个BUG ，无法改成下面一行
                                // .range([chartPadding.bootom, maxBarHeight -chartPadding.top])
                                .domain([d3.min(d3.map(data, d => d[i]).flat().map(d => d.min)),
                                    d3.max(d3.map(data, d => d[i]).flat().map(d => d.max))]);
                        return scale
                    });
                    let mergeArea = [
                        d3.area()
                            .x(d => xBatch[d.i](d.time))
                            .y0((d, i) => -yBatch[d.d](d.l))
                            .y1((d, i) => -yBatch[d.d](d.h)),
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
                            .y1((d, i) => -yBatch[d.d](d.sxh)),
                    ],
                        mergeLine = d3.line()
                            .x(d => xBatch[d.i](d.time))
                            .y((d, i) => -yBatch[d.d](d.value))
                            .curve(d3.curveLinear),
                        mergeLocation = d => `translate(${[xBatch[d.i](d.time), -yBatch[d.d](d.value)]})`;
                    timeScale = xBatch;
                    return {mergeArea, mergeLine, mergeLocation, mergeOffsets}
                }
                function updateArea(){
                    if(wm._horizonView){
                        mergeG.selectAll('.batchG')
                            .transition(d3.transition()
                                .duration(200)
                                .ease(d3.easeLinear))
                            .attr('transform', (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`)
                            .call(g => g.selectAll('.path4')
                                .attr('d', mergeAttrs.mergeArea[4]))
                            .call(g => g.selectAll('.path3')
                                .attr('d', mergeAttrs.mergeArea[3]))
                            .call(g => g.selectAll('.path2')
                                .attr('d', mergeAttrs.mergeArea[2]))
                            .call(g => g.selectAll('.path1')
                                .attr('d', mergeAttrs.mergeArea[1]))
                            .call(g => g.selectAll('.path0')
                                .attr('d', mergeAttrs.mergeArea[0]))
                            .call(g => g.selectAll('.line')
                                .attr('d', mergeAttrs.mergeLine))
                            .call(g => g.selectAll('circle')
                                .attr('transform', d =>`translate(${mergeAttrs.mergeLocation(d)})`))
                            ;                           
                    }else{
                        var horizenArea = horizenParameter(rectArray, horizenEX)
                        sliderG.selectAll('.horizenG')
                            .transition(d3.transition()
                                .duration(150)
                                .ease(d3.easeLinear))
                            .attr('transform', (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`)
                            .selectAll('path')
                            .attr('d', horizenArea)
                        sliderG.selectAll('.clipRect')
                            .transition(d3.transition()
                            .duration(50)
                            .ease(d3.easeLinear))
                            .attr('width', d => rectArray[d.i])
                    }
                    // Object.assign(heatMapAttrs, heatMapParameter(rectArray, horizenEX))
                    // initMapArea()
                }
                function initLinearGradient(){
                  gradientG.selectAll('g').data(rectPosition)
                    .join('g').attr('class', 'gradient')
                    .call(g => g.selectAll('g')
                      .data((d, i) => horizenEX[i])
                      .join('g')
                      .call(g => g.append('linearGradient')
                        .attr('id', d => `${d.i}price-gradient${d.d}`)
                        .attr('gradientUnits', 'userSpaceOnUse')
                        .attr('x1', '0%')
                        .attr('x2', '100%').selectAll('stop')
                                  .data(offsetParameter).enter().append('stop')
                        .attr('offset', function(d) { return d.offset; })
                        .attr('stop-color', function(d) { return d.color; }))
                      )
                  linearGradientAttrs
                }
                function offsetParameter(arr){
                  return arr.map(d => {
                    // console.log(mergeAttrs.mergeOffsets[arr.i](d.time))
                    return {
                      offset: mergeAttrs.mergeOffsets[arr.i](d.time), //d.index/arr.length.toString()
                      color: util.labelScale(wm._rangeInsert(d))
                    }
                  })
                }
                function initMergeArea(){
                  mergeG.selectAll('.batchG').data(rectPosition)
                      .join('g')
                      .attr('class', 'batchG')
                      .attr('transform', mergeAttrs.transform)
                      .call( g => g.selectAll('g')
                          .data((d, i) => horizenEX[i])
                          .join('g')
                          .attr('class', 'batchElement')
                          .attr('opacity', mergeAttrs.elementOpacity)
                          .attr('transform', mergeAttrs.elementTransform)
                              .call(g => g.append('path')
                                  .attr('fill', util.labelScale(2))
                                  .attr('class', 'path4')
                                  .datum(d => d)
                                  .attr('d', mergeAttrs.mergeArea[4]))
                              .call(g => g.append('path')
                                  .attr('fill', util.labelScale(2))
                                  .attr('class', 'path3')
                                  .datum(d => d)
                                  .attr('d', mergeAttrs.mergeArea[3]))
                                  .call(g => g.append('path')
                                  .attr('fill', util.labelScale(1))
                                  .attr('class', 'path2')
                                  .datum(d => d)
                                  .attr('d', mergeAttrs.mergeArea[2]))
                              .call(g => g.append('path')
                                  .attr('fill', util.labelScale(1))
                                  .attr('class', 'path1')
                                  .datum(d => d)
                                  .attr('d', mergeAttrs.mergeArea[1]))
                              .call(g => g.append('path')
                                  .attr('fill', util.labelScale(0))
                                  .attr('class', 'path0')
                                  .datum(d => d)
                                  .attr('d', mergeAttrs.mergeArea[0]))
                              .call(g => g.append('path')
                                  .attr('stroke-width', 2)
                                  .attr('class', 'line')
                                  .attr('stroke', d => `url(#${d.i}price-gradient${d.d}`)
                                  // .attr('stroke', (d, i) => d3.color(util.labelScale(0)).darker(0.6))
                                  .attr('fill', 'none')
                                  .datum(d => d)
                                  .attr('d', mergeAttrs.mergeLine))
                              .call(g => g.selectAll('circle')
                                  .data(d => d).join('circle')
                                  .attr('transform', mergeAttrs.mergeLocation)
                                  .attr('visibility', d => wm._rangeInsert(d) > 1 ? 'visible' : 'hidden')
                                  // .attr('fill', d => util.labelScale(wm._rangeInsert(d)))
                                  .attr('fill', 'none')
                                  .attr('stroke', d => d3.color(util.labelScale(wm._rangeInsert(d))).darker(0.5))
                                  // .attr('fill', (d, i) => lc[selectInfo[d.d].month])
                                  // .attr('stroke', (d, i) => d3.color(lc[selectInfo[d.d].month]).darker(1))
                                  .attr('stroke-width', 0.25)
                                  .attr('r', 1.8)))
                }
                function horizenParameter(array, data){	//horizen function
                    let xBatch = array.map((d, i) => {
                            let l = array[i],
                                scale = d3.scaleTime()
                                    .range([chartPadding.left, l - chartPadding.right])
                                    .domain(d3.extent(data[i][0], (e, f)=> e.time));
                            return scale
                        }),
                        yBatch = array.map((d, i) => {
                            return data[i].map((e, f) =>{
                                return d3.scaleLinear()
                                        .range(horizenAttrs.overHeight)
                                        .domain([d3.mean(e, e => e.exl), d3.mean(e, e => e.exl), d3.mean(e, e => e.l), 
                                            d3.mean(e, e => e.h), d3.mean(e, e => e.exh), d3.mean(e, e => e.exh)]);
                            })
                        }),
                        horizenArea = d3.area()
                            .curve(d3.curveBasis)
                            .x(d => xBatch[d.i](d.time))
                            .y0(0)
                            .y1((d, i) => -yBatch[d.i][d.d](d.value));
                    timeScale = xBatch;
                    return horizenArea
                }
                function initHorizenArea(){
                  sliderG.selectAll('.horizenG').data(rectPosition)
                  .join('g')
                    .attr('class', 'horizenG')
                    .attr('transform', horizenAttrs.transform)
                    .call(g => g.selectAll('g')
                        .data((d, i) => horizenEX[i])
                        .join('g')
                        .attr('class', 'horizenElement')
                        .attr('opacity', horizenAttrs.elementOpacity)
                        .attr('transform', horizenAttrs.elementTransform)
                            .call(g => g.append('clipPath')
                                .attr('id', d => `${d.i}clipy${d.d}`)
                                .append('rect')
                                    .attr('width', d => rectArray[d.i])
                                    .attr('class', 'clipRect')
                                    .attr('height', horizenAttrs.elementHeight))
                            .call(g => g.append('defs').append('path')
                                    .attr('opacity', 0.8)
                                .attr('class', 'allpath')
                                .attr('id', d => `${d.i}path-def${d.d}`)
                                    .datum(d => d)
                                    .attr('d', horizenAttrs.horizenArea))
                            .call(g => g.append('g')
                                .attr('clip-path', d => `url(#${d.i}clipy${d.d})`)
                                .selectAll('use')
                                    .data(d => new Array(horizenAttrs.overlap).fill(d))
                                    .enter()
                                    .append('use')
                                    .attr('fill', (d, i) => horizenAttrs.horizenColor(horizenAttrs.overlapNum[i]))
                                    .attr('transform', (d, i) => `translate(0,${(horizenAttrs.overlapNum[i] + 1) * (horizenAttrs.elementHeight)})`)
                                    .attr('href', d => `#${d.i}path-def${d.d}`)))
                }
                function heatMapParameter(array, data){
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
                        .range([0, heatMapAttrs.rectHeight - chartPadding.top/2])
                        .domain(d3.extent(d3.map(data, d => d3.map(d, e => d3.map(e, f => f.Q))).flat(2)));
                    let yBatch2 = d3.scaleLinear()
                        .range([0, heatMapAttrs.rectHeight - chartPadding.top/2])
                        .domain(d3.extent(d3.map(data, d => d3.map(d, e => d3.map(e, f => f.T2))).flat(2)));
                    let yColor = d3.scaleLinear()
                        .domain([0, 0.25, 0.5, 0.75, 1])
                        .range(util.levelColor);
                    return {xBatch ,yBatch1, yBatch2, yColor}
                }
                function initMapArea(){
                  heatMapG
                    .attr('transform', heatMapAttrs.position)
                    .selectAll('.heatMapG').data(rectPosition)
                    .join('g')
                    .attr('class', 'heatMapG')
                    .attr('transform', heatMapAttrs.transform)
                    .call( g => g.selectAll('g')
                      .data((d, i) => horizenEX[i])
                        .join('g')
                        .attr('opacity', heatMapAttrs.opacity)
                        .attr('class', 'heatMapElement')
                        .attr('transform', heatMapAttrs.elementTransform)
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
                function clickScale(e, d){
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
                function mouseOver(args){
                    opacityCache = (d, i) => {
                        if(wheel_y <= indexScale(i) && indexScale(i) < rectNum + wheel_y){
                            if(d.indexName){
                                return args.indexOf(d.indexName) !== -1  ? 1 : 0.4
                            }else if(d[0].indexName){
                                return args.indexOf(d[0].indexName) !== -1  ? 1 : 0.4
                            }else if(d[0][0].indexName){
                                return args.indexOf(d[0][0].indexName) !== -1  ? 1 : 0.4
                            }
                        }else{
                            return 0
                        }
                    }
                    initAttrs.call(wm)
                    renderSort()
                }
                function mouseOut(){
                    opacityCache = (d, i) => wheel_y <= indexScale(i) && indexScale(i) < rectNum + wheel_y ? 1 : 0;
                    initAttrs.call(wm)
                    renderSort()
                }
                function searchIndexName(){
                    return selectInfo.filter((d, i) => wheel_y <= indexScale(i) && indexScale(i) < rectNum + wheel_y).map(d => d.indexName)
                }
                function updateBar(){
                  chartHeight = wm._sliderInput;
                  renderyAxis();
                  renderSort();
                  renderShape()
                }
                return {
                  mouseOver,
                  mouseOut,
                  searchIndexName,
                  updateBar
                }
        }

        _renderWheelFilter(){
            let indexes;
            if(this._fliterStatus) {
                indexes = this._merge ? this._barInstance.searchIndexName() : d3.map(this._chartData.filter(this._outrate(true, false)), d => d.indexName);
                const angle = new Array(this._processindex.length).fill([]);
                d3.groups(this._chartData.filter(this._merge ? d => this._barInstance.searchIndexName().indexOf(d.indexName) !== -1 :this._outrate(true, false)), d => d.month)
                    .map(d => {
                        angle[d[0]] = d[1].map(d => (this._xpad[d.month](d.date) + this._barAngle/2) * 180 / Math.PI - 180 )
                    });
                this._renderBorderG(angle)
            }else{
                indexes = d3.map(this._chartData, d => d.indexName);
                this._initBorderG()
            }
            let searchIndex = d => indexes.indexOf(d.indexName) !== -1 ? 'visible' : 'hidden'
            if(this._heatOrRiver){
                this._contentG.selectAll('.riverG').selectAll('g').attr('visibility', searchIndex)
            }else{
                this._contentG.selectAll('.riverG').selectAll('circle').attr('visibility', searchIndex)
            }
            this._contentG.selectAll('.outerBarG').selectAll('g').attr('visibility', searchIndex);
            this._contentG.selectAll('.outerLineG').selectAll('g').attr('visibility', searchIndex);
            this._contentG.selectAll('.innerLineG').selectAll('g').attr('visibility', searchIndex);
            // if(!this._merge){
            //     this._contentG.selectAll('.outerElementG').selectAll('g')
            // }
        }

        _renderWheelContent() {
            const processData = d3.group(this._chartData, d => d.month);
            const sample = this._sort(this._chartData);
            this._allIndex = d3.map(sample, d => d.indexName);
            this._processData = processData;
            this._padindex = [...processData.keys()];//[0, 1, 2] or [0, 2];

            this._initBorderG()
            
            this._heatOrRiver ? this._initHeatG() : this._initRiverG()

            this._initOuterBarG()
            this._initOuterLineG()

            this._merge ? '' : this._initOuterElementG();

            this._initProcessCircle()
            this._initIconG()
            this._renderWheelFilter()
            this._contentG.raise()
        }
        
        _initBorderG(){
            this._contentG.selectAll('.borderG').remove()
            const lcBorderFunc = d => d3.color(this._labelcolor[d]).darker(1)
            this._contentG.selectAll('.borderG')
                    .data(this._padindex)
                    .join('g')
                    .attr('class', 'borderG')
                .call(g => g.append('line')      //扇形左边界
                    .attr('y1', this._radius.inner)
                    .attr('y2', this._radius.outer)
                    .attr('stroke', lcBorderFunc)
                    .attr('stroke-width', 0.5)
                    .attr('transform', d => `rotate(${this._padAngle[d][0]* 180 / Math.PI - 180})`))
                .call(g => g.append('line')     //扇形右边界
                    .attr('y1', this._radius.inner)
                    .attr('y2', this._radius.outer)
                    .attr('stroke', lcBorderFunc)
                    .attr('stroke-width', 0.5)
                    .attr('transform', d => `rotate(${this._padAngle[d][1]* 180 / Math.PI - 180})`))
                .call(g => g.append('path')
                    .attr('d', d => d3.arc()
                        .startAngle(this._padAngle[d][0])
                        .endAngle(this._padAngle[d][1])
                        .innerRadius(this._radius.outer)
                        .outerRadius(this._radius.outer + this._radius.bubble*1.1 + 0.25)(d))
                    .attr('stroke', lcBorderFunc)
                    .attr('fill','none')
                    .attr('stroke-width', 0.5))     
        }

        _renderBorderG(angle){
            this._contentG.selectAll('.borderG').remove()
            const lcBorderFunc = d => d3.color(this._labelcolor[d]).darker(1),
                v = this._barAngle * 180 / Math.PI;
            const borderAngle = angle.map((d, i) => {
                d.sort((a, b) => a - b)
                let arr = [];
                if(d.length == 0)return arr
                arr = d.map(e => [e - v/2, e + v/2, i]);
                for(let index = 0; index < arr.length - 1; index++){
                    if(arr[index + 1][0] - arr[index][1] < v/3){
                        arr.splice(index, 2, [arr[index][0], arr[index + 1][1], i])
                        index --
                    }
                }
                return arr
            })
            this._contentG.selectAll('.borderG')
                    .data(this._padindex.filter(d => angle[d].length !== 0))
                    .join('g')
                    .attr('class', 'borderG')
                .call(g => g.selectAll('g').data((d, i) => borderAngle[d])
                    .join('g')
                    .call(g => g.append('line')      //扇形左边界
                        .attr('y1', this._radius.inner)
                        .attr('y2', this._radius.outer)
                        .attr('stroke', d => lcBorderFunc(d[2]))
                        .attr('stroke-width', 0.5)
                        .attr('transform', d => `rotate(${d[0]})`))
                    .call(g => g.append('line')     //扇形右边界
                        .attr('y1', this._radius.inner)
                        .attr('y2', this._radius.outer)
                        .attr('stroke', d => lcBorderFunc(d[2]))
                        .attr('stroke-width', 0.5)
                        .attr('transform', d => `rotate(${d[1]})`))
                    .call(g => g.append('path')
                        .attr('d', d => d3.arc()
                            .startAngle((d[1] + 180)* Math.PI / 180)
                            .endAngle((d[0] + 180) * Math.PI / 180)
                            .innerRadius(this._radius.outer)
                            .outerRadius(this._radius.outer + this._radius.bubble*1.1 + 0.25)(d))
                        .attr('stroke', d => lcBorderFunc(d[2]))
                        .attr('fill','none')
                        .attr('stroke-width', 0.5)))
        }

        _initIconG(){
            this._contentG.selectAll('iconG')
                .data(this._padindex)
                .join(enter => enter.append('image')
                    .attr('class', 'iconG')
                        .attr('id', d => `icon${d}`)
                        .attr('transform', d => `rotate(${(this._padAngle[d][0] + this._padAngle[d][1])/2 * 180 / Math.PI - 5.8})`)
                        .attr('width', this._radius.isize)
                        .attr('width', this._radius.isize)
                        .attr('y', -this._radius.inner*0.97)
                        .attr('href', d => processIcon[d]),
                    update => update.attr('transform', d => `rotate(${(this._padAngle[d][0] + this._padAngle[d][1])/2 * 180 / Math.PI - 5.8})`)
                        .attr('href', d => processIcon[d])
                        .attr('id', d => `icon${d}`),
                    exit => exit.remove())
                // .join('g')
                // .attr('class', 'iconG')
                // .call(g => g.append('image')
                //     .attr('class', 'icon')
                //     .attr('id', d => `icon${d}`)
                //     .attr('transform', (d , i) => `rotate(${(this._padAngle[i][0] + this._padAngle[i][1])/2 * 180 / Math.PI - 5.8})`)
                //     .attr('y', -this._radius.inner*0.97)
                //     .attr('href', (d , i) => processIcon[i]))
        }

        _initRiverG(){
            this._initInnerLineG();
            
            const lcFunc = d => this._labelcolor[d],
                lineColorFunc =  d => d3.color(this._labelcolor[d]).darker(1),
                v = this._barAngle/2,
                //河流图节点
                circleColor = d => d3.color(this._labelcolor[d.month]).darker(0.2),
                strokeColor = d => d3.color(this._labelcolor[d.month]).darker(1);
            this._contentG.selectAll('.riverG')
                .data(this._padindex)
                .join('g')
                .attr('class', 'riverG')
                .call(g => g.selectAll('g').remove())
                .call(g => g.append('path')     //河流图内层
                    .attr('fill', lcFunc)
                    .attr('class' , d => `innerRiver${d}`)
                    .attr('fill-opacity', 0.8)
                    .attr('d', d => d3.areaRadial()
                        .curve(d3.curveCardinal)
                        .angle(e => this._xpad[d](e.date) + v)
                        .innerRadius(e => this._y(e.low))
                        .outerRadius(e => this._y(e.high))(this._processData.get(d))))
                .call(g => g.append('path')     //河流图外层
                    .attr('fill', lcFunc)
                    .attr('class', d => `outerRiver${d}`)
                    .attr('fill-opacity', 0.4)
                    .attr('d', d => d3.areaRadial()
                        .curve(d3.curveCardinal)
                        .angle(e => this._xpad[d](e.indexName) + v)
                        .innerRadius(e => this._y(e.elow))
                        .outerRadius(e => this._y(e.ehigh))(this._processData.get(d))))
                .call(g => g.append('path')      //河流线
                    .attr('fill', 'none')
                    .attr('class', 'riverLine')
                    .attr('id' , d => `riline${d}`)
                    .attr('stroke', lineColorFunc)
                    .attr('stroke-width', 1)
                    .attr('d', d => d3.lineRadial()
                        .curve(d3.curveLinear)
                        .angle(e => this._xpad[d](e.date) + v)
                        .radius(e => this._y(e.avg))(this._processData.get(d))))
                .call(g => g.selectAll('circle')
                    .data(d => this._processData.get(d))
                    .join('circle')
                    .attr('transform', d => `rotate(${(this._xpad[d.month](d.indexName) + v) * 180 / Math.PI - 180 })`)
                    .attr('class', this._processClass('circle_color'))
                    .attr('id', this._indexId('circle'))
                    .attr('fill', circleColor)
                    .attr('stroke', strokeColor)
                    .attr('stroke-width', 0.5)
                    .attr('stroke-opacity', 1)
                    .attr('cy', d => this._y(d.avg))
                    .attr('r', this._outrate(this._circleStyle.highlight_r, this._circleStyle.original_r))
                    )
        }

        _initHeatG(){
            const lcFunc = d => this._labelcolor[d];
            let length = 5, padding = 5,
                height = ((this._radius.outer - this._radius.inner) - (length - 1) * padding)/length,
                heightArray = new Array(length).fill(0).map((d, i) => {
                        return {
                            'x0': i * (height + padding) + this._radius.inner,
                            'x1': i * (height + padding) + this._radius.inner + height,
                        }
                    });

            this._contentG.selectAll('.riverG').remove()
            this._contentG.selectAll('.riverG')
                .data(this._padindex)
                .join('g')
                .attr('class', 'riverG')
                .selectAll('g')
                .data(d => this._processData.get(d))
                .join('g')
                .attr('class', this._processClass('heat'))
                .attr('id', this._indexId('heat'))
                .attr('transform', d => `rotate(${(this._xpad[d.month](d.indexName) ) * 180 / Math.PI - 180 })`)
                .call(g => g.selectAll('path').data(d => heatRange(d)).join('path')
                    // .attr('visibility', d => d.range ? 'visible' : 'hidden')
                    .attr('stroke', d => lcFunc(d.month))
                    .attr('stroke-opacity', 0.25)
                    .attr('fill', d => d.range ? lcFunc(d.month) : 'none')
                    .attr('d', (d, i) => this._linepad(heightArray[i].x0, heightArray[i].x1)))
            function heatRange(d){
                let arr = new Array(length).fill(false),
                    range = [d.elow, d.low, d.high, d.ehigh],
                    index = range.findIndex(e => d.avg < e);
                index = index !== -1 ? index : length - 1; 
                arr[index] = true;
                return arr.map(f => {
                    return {
                        'range': f,
                        'month': d.month
                    }
                })
            }
        }

        _initOuterBarG(){
            const lcFunc = d => this._labelcolor[d.month],
                lineColorFunc =  d => d3.color(this._labelcolor[d.month]).darker(1);
            this._contentG.selectAll('.outerBarG')
                .data(this._padindex)
                .join(
                    enter => enter.append('g')
                        .attr('class', 'outerBarG')
                        .selectAll('g')
                        .data(d => this._processData.get(d))
                        .join('g')
                        .attr('transform', d => `rotate(${(this._xpad[d.month](d.indexName) ) * 180 / Math.PI - 180 })`)
                        .call(g => g.append('path')
                            .attr('class', this._processClass('humidity'))
                            .attr('id', this._indexId('humidity'))
                            .attr('fill', lcFunc)
                            .attr('stroke', lineColorFunc)
                            .attr('d', d => this._linepad(this._radius.outer, this._h(d.humidity))))
                        .call(g => g.append('path')
                            .attr('class', this._processClass('precipitation'))
                            .attr('id', this._indexId('precipitation'))
                            .attr('fill', lcFunc)
                            .attr('stroke', lineColorFunc)
                            .attr('d', d => this._linepad(this._radius.outer + this._radius.bubble*1.10-this._hb(d.precipitation) , this._radius.outer + this._radius.bubble*1.10))),
                    update => update.selectAll('g')
                        .data(d => this._processData.get(d))
                        .join('g')
                        .attr('transform', d => `rotate(${(this._xpad[d.month](d.indexName) ) * 180 / Math.PI - 180 })`)
                        .call(g => g.append('path')
                            .attr('class', this._processClass('humidity'))
                            .attr('id', this._indexId('humidity'))
                            .attr('fill', lcFunc)
                            .attr('stroke', lineColorFunc)
                            .attr('d', d => this._linepad(this._radius.outer, this._h(d.humidity))))
                        .call(g => g.append('path')
                            .attr('class', this._processClass('precipitation'))
                            .attr('id', this._indexId('precipitation'))
                            .attr('fill', lcFunc)
                            .attr('stroke', lineColorFunc)
                            .attr('d', d => this._linepad(this._radius.outer + this._radius.bubble*1.10-this._hb(d.precipitation) , this._radius.outer + this._radius.bubble*1.10))),
                    exit => exit.remove())
        }

        _initOuterLineG(){
            const v = this._barAngle/2,
                lineStroke = d => (this._allIndex.indexOf(d.date) !== -1) ? d3.color(this._labelcolor[d.month]).darker(2) : d3.color(this._labelcolor[d.month]).darker(0.6),
                lineStrokeWidth = this._outrate(this._leadlineStyle.highlight_strwidth, this._leadlineStyle.original_strwidth);
            this._contentG
                .selectAll('.outerLineG').data(this._padindex)
                    .join('g')
                    .attr('class', 'outerLineG')
                    .selectAll('g')
                    .data(d => this._processData.get(d))
                    .join('g')
                    .attr('transform', d => `rotate(${(this._xpad[d.month](d.date) + v) * 180 / Math.PI - 180 })`)
                    .call(g => g.append('line')
                        .attr('class' , d => 'leadline'+ d.month +' line' + d.indexName)
                        .attr('y1', d => this._h(d.humidity))
                        .attr('y2', d => this._radius.outer + this._radius.bubble*1.10-this._hb(d.precipitation))
                        .attr('stroke', lineStroke)
                        .attr('stroke-width', lineStrokeWidth)
                        .attr('opacity', this._leadlineStyle.opacity))
        }

        _initInnerLineG(){
            const v = this._barAngle/2,
                lineStroke = d => (this._allIndex.indexOf(d.date) !== -1) ? d3.color(this._labelcolor[d.month]).darker(2) : d3.color(this._labelcolor[d.month]).darker(0.6),
                lineStrokeWidth = this._outrate(this._leadlineStyle.highlight_strwidth, this._leadlineStyle.original_strwidth);
            this._contentG
                .selectAll('.innerLineG').data(this._padindex)
                    .join('g')
                    .attr('class', 'innerLineG')
                    .selectAll('g')
                    .data(d => this._processData.get(d))
                    .join('g')
                    .attr('transform', d => `rotate(${(this._xpad[d.month](d.date) + v) * 180 / Math.PI - 180 })`)
                    .call(g => g.append('line')     //line1
                        .attr('class' , d => 'leadline'+ d.month +' line' + d.indexName +' '+'linecurve')
                        .attr('id' , this._indexId('linecurve'))
                        .style('visibility', this._merge ? 'hidden' : this._outrate('visible' , 'hidden' ))
                        .attr('y1', this._radius.inner*0.8 )
                        .attr('y2', d => this._y(d.avg) - 2)
                        .attr('stroke', lineStroke)
                        .attr('stroke-width', lineStrokeWidth)
                        .attr('opacity', this._leadlineStyle.opacity))
                    .call(g => g.append('line')     //line2
                        .attr('class' , d => 'leadline'+ d.month +' line' + d.indexName +' '+'linestart')
                        .attr('id' , this._indexId('linestart'))
                        .attr('y1', d => this._y(d.avg)+2)
                        .attr('y2', this._radius.outer)
                        .attr('stroke', lineStroke)
                        .attr('stroke-width', lineStrokeWidth)
                        .attr('opacity', this._leadlineStyle.opacity))
        }

        _initProcessCircle(){
            const wheel = this._container,
                wm = this,
                daker = d =>  d3.color(this._labelcolor[d]).darker(0.6);
            this._contentG
                .selectAll('.processPath').data(this._padindex)
                    .join('path')
                    .attr('class', 'processPath')
                    .attr('d', d => d3.arc()
                        .startAngle(this._padAngle[d][0])
                        .endAngle(this._padAngle[d][1])
                        .innerRadius(this._radius.inner*0.8)
                        .outerRadius(this._radius.inner)(d))
                    .attr('id', d => 'process' + d)
                    .attr('class', 'processPath')
                    .attr('stroke', d => d3.color(this._labelcolor[d]).darker(2))
                    .attr('fill',  d => this._labelcolor[d])
                    .attr('stroke-width', 0.5)
                    .attr('opacity', 0.6)
                    .on('mouseover', (e, d) => {
                        this._hightlightcss()
                        wheel.selectAll('#riline' + d)
                            .attr('opacity', 1)
                        wheel.selectAll('.clead'+d )
                            .attr('opacity', wm._cleadStyle.opacity)
                        wheel.selectAll('.innerRiver'+d)
                            .attr('opacity', 0.8)
                        wheel.selectAll('.outerRiver'+d)
                            .attr('opacity', 0.4)
                        wheel.selectAll('#process'+d)
                            .attr('fill',d3.color(this._labelcolor[d]).darker(0.2))
                            .attr('opacity' , 0.6)
                        wheel.selectAll('#circle'+d)
                            .attr('stroke' , 'white')
                        wheel.selectAll('#icon'+d)
                            .attr('href', iconwhite[d])
                        wheel.selectAll('.circle_color'+d)
                            .attr('r', wm._outrate(wm._circleStyle.highlight_r + 0.5, wm._circleStyle.original_r + 0.5))
                            .attr('opacity', 1);
                        wheel.selectAll('.heat'+d)
                            .attr('opacity', 1);
                        wheel.selectAll('.precipitation'+d)
                            .attr('stroke', wm._outrate(d3.color(this._labelcolor[d]).darker(1.6), daker(d)))
                            .attr('opacity', 1)
                        wheel.selectAll('.humidity'+d)
                            .attr('stroke', wm._outrate(d3.color(this._labelcolor[d]).darker(1.6), daker(d)))
                            .attr('opacity', 1)
                        wheel.selectAll('.lead' + d )
                            .attr('stroke-width', wm._outrate(wm._leadlineStyle.highlight_strwidth, wm._leadlineStyle.original_strwidth))
                            .attr('opacity', wm._leadlineStyle.opacity)
                        wheel.selectAll('.linestart')
                            .attr('y1', d => this._y(d.avg) + wm._outrate(wm._leadlineStyle.highlight_strwidth, wm._leadlineStyle.original_strwidth)(d))
                        wheel.selectAll('.linecurve')
                            .attr('y2', d => this._y(d.avg) - wm._outrate(wm._leadlineStyle.highlight_strwidth, wm._leadlineStyle.original_strwidth)(d))
                        wheel.selectAll('.arcpie'+d).selectAll('path')
                            .attr('opacity', 1)
                            .style('stroke-width', 0.5)
                        wheel.selectAll('.arctext'+d)
                            .attr('opacity', 1)
                            .attr('fill', d3.color(this._labelcolor[d]).darker(4))
                        d3.select('.iconG').raise()
                    })
                    .on('mouseleave', (e, d) => {
                        this._initcss()
                        wheel.selectAll('#process' + d)
                            .attr('fill',this._labelcolor[d])
                        wheel.selectAll('#circle'+d)
                            .attr('stroke' , daker(d))
                        wheel.selectAll('#icon'+d)
                            .attr('href', processIcon[d])
                        wheel.selectAll('.circle_color'+d)
                                .attr('r', this._outrate(this._circleStyle.highlight_r, this._circleStyle.original_r));
                        wheel.selectAll('.precipitation'+d)
                            .attr('stroke',daker(d))
                        wheel.selectAll('.humidity'+d)
                            .attr('stroke',daker(d))
                        wheel.selectAll('.lead'+d)
                            .attr('stroke-width', wm._outrate(1,0.5))
                        wheel.selectAll('.linestart')
                            .attr('y1', d =>  this._y(d.avg)+2)
                        wheel.selectAll('.linecurve')
                            .attr('y2', d =>  this._y(d.avg)-2)
                        wheel.selectAll('.arcpie'+d)
                            .style('stroke-width', 0.25)
                        wheel.selectAll('.arctext'+d)
                            .attr('fill', d3.color(this._labelcolor[d]).darker(1.5))
                    })
        }

        _initOuterElementG(){
            const pieAngle = d3.pie()
                    .value(d => d.angle)
                    .startAngle(0.5* Math.PI)
                    .endAngle(2.5 * Math.PI),
                piearc = d3.arc()
                    .innerRadius(0)
                    .outerRadius(this._radius.arc),
                v = this._barAngle/2;
            this._contentG.selectAll('.outerElementG')
                .data(this._padindex)
                .join(
                    enter => enter.append('g')
                        .attr('class', 'outerElementG')
                        .selectAll('g')
                        .data(d => this._processData.get(d))
                        .join('g')
                        .attr('visibility', this._outrate('visible', 'hidden'))
                        .call(g => g.append('g')
                            .attr('transform', d => `rotate(${(this._xpad[d.month](d.indexName) + v) * 180 / Math.PI - 180 }) translate(${[0, this._radius.outer + this._radius.bubble*1.38]})`)
                            .selectAll('path').data(d => pieAngle(d.property))
                            .join('path')
                            .attr('d', piearc)
                            .attr('class', d => `arcpie`+ d.data.process)
                            .attr('fill', d => ((+d.data.value) > this._labelLimit[d.data.limit]? this._labelcolor[+d.data.process] : 'white'))
                            .style('stroke', d => ((+d.data.value) > this._labelLimit[d.data.limit]? 'white' : this._labelcolor[+d.data.process]))
                            .style('stroke-width', 0.5))
                        .call(g => g.append('text')
                            .attr('transform', d => `rotate(${(this._xpad[d.month](d.indexName) + 1.5 * v) * 180 / Math.PI - 180 }) translate(${[0, this._radius.outer + this._radius.bubble*1.38 + this._radius.arc/2]})`)
                            .attr('class', this._processClass('arctext'))
                            .attr('id', this._indexId('arctext'))
                            .attr('fill', d =>  d3.color(this._labelcolor[d.month]).darker(3.5))
                            .attr('font-weight', 'bold')
                            .text((d => +this._allIndex.indexOf(d.indexName) + 1)))
                    ,
                    update => update,
                    exit => exit.remove()
                )
        }

        _initInnerOverlay(){
            this._contentG.selectAll('overlayG').remove()
            const overlayG = this._contentG.append('g')
                    .attr('class', 'overlayG');
            overlayG.selectAll(' .visoverlay')
                    .data(this._chartData)
                    .join('g')
                    .attr('class', 'visoverlay')
                    .attr('transform', d => `rotate(${this._xpad[d.month](d.indexName) * 180 / Math.PI - 180})`) // rad 2 deg - 180 -> rotate back to 12 o'clock                
                    .call(g => g.append('path')
                        .attr('d', this._line(this._radius.inner, this._radius.max)))
                        .on('mouseover', (e, d) => {
                            this._insertInfo(e, d);
                            this._hightlightcss()
                            this._axisenter(d.indexName, d.month);
                            this._merge ? this._barInstance.mouseOver([d.indexName]) : undefined;                            
                        })
                        .on('mouseleave', (e, d) => {
                            this._initcss()
                            this._axisout(d.indexName, d.month);
                            this._merge ? this._barInstance.mouseOut() : undefined;
                        });
        }

        _initChordData(){
            const sample = this._sort(this._chartData),
            // this._chartData,
                graph = {nodes:[],links:[]};
            // this._allIndex = d3.map(sample, d => d.indexName);
            for (let item in sample){
                let i = chorddata['label'].indexOf(sample[item].indexName),
                    targets = [],
                    id = sample[item].indexName;
                for (let target = +item + 1;target < sample.length ;target++){
                    let j = chorddata['label'].indexOf(sample[target].indexName);
                    if(chorddata['corr'][i][j] > vm.corrSize){
                        if(sample[item].month == sample[target].month){
                            targets.push(sample[target].indexName)
                            graph.links.push({'source':id,'target':sample[target].indexName,value:1})
                        }
                    }
                }
                graph.nodes.push({'id':id,'group': sample[item].month,'targets':targets})
            }
            this._graph = graph;
        }

        _renderWheelChord(){
            const r = this._radius,
                lc = this._labelcolor,
                xpad = this._xpad,
                v = this._barAngle/2,
                chordG = this._contentG.append('g')
                    .attr('transform',`rotate(${-60})`)
                    .attr('class', 'chordG'),
                tree = d3.cluster()
                    .size([2 * Math.PI, r.inner*0.8]),
                clusterLine = d3.lineRadial()
                    .curve(d3.curveBundle.beta(vm.curveSize))   //d3.curveNatural
                    .radius(d => d.y)
                    .angle(d => d.x),
                {nodes, links} = this._graph,
                groupById = new Map,
                nodeById = new Map(nodes.map(node => [node.id, node])),
                colornone = '#ccc';

            function bilink(root) {
                const map = new Map(root.leaves().map(d => [d.data.id, d]));
                for (const d of root.leaves()) d.incoming = [], d.outgoing = d.data.targets.map(i => [d, map.get(i)]);
                for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
                return root;
            }

            for (const node of nodes) {
                let group = groupById.get(node.group);
                if (!group) groupById.set(node.group, group = {id: node.group, children: []});
                group.children.push(node);
                node.targets = [];
            }

            for (const {source: sourceId, target: targetId} of links) {
                nodeById.get(sourceId).targets.push(targetId);
            }

            const data={children: [...groupById.values()]};
            const root = tree(bilink(d3.hierarchy(data)
                // .sort((a, b) => d3.ascending(a.height, b.height) || d3.ascending(a.data.id, b.data.id))
                ));
            const node = chordG.append('g')
                .selectAll('g')
                .data(root.leaves())
                .join('g')
                    .attr('transform', d => {
                        d.x=xpad[+d.data.group](d.data.id) + v +1/3*(Math.PI);
                        return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`
                        })
                .call(g =>g.append('path')
                    .attr('transform', d => `translate(${-d.y},0)  rotate(${-90-v* 180 / Math.PI})`)
                    .attr('fill', 'white')
                    .attr('opacity', 0)
                    .attr('d', this._line(r.inner, r.max)))
                    .on('mouseover', (e, d) => {
                        this._overed(e, d.data.id, d.data.group)
                    })
                    .on('mouseout', (e, d) => {
                        this._outed(e, d.data.id, d.data.group)
                    })
            const labelcol=(d , i) => d3.color(lc[+d[0].data.group]).darker(0.6);
            const linedata = root.leaves().flatMap(leaf => leaf.outgoing);
            this._leavesData = root.leaves();
            this._lineData = linedata;

            const link = chordG.append('g')
                .attr('stroke', colornone)
                .attr('fill', 'none')
                .selectAll('path')
                .data(linedata)
                .join('path')
                    .attr('d', ([i, o]) => clusterLine(i.path(o)))
                    .each(function(d) { d.path = this; })
                    .attr('class',d=>{
                        return 'clead'+ (+d[0].data.group) + ' clinein'+d[0].data.id +' clineout'+d[1].data.id
                    })
                    .attr('stroke',  labelcol)
                    .attr('stroke-width', this._cleadStyle['stroke-width'])
                    .attr('opacity', this._cleadStyle.opacity)
        }

        _axisenter(name, key){
            const cG = this._container,
                wm = this,
                lck =  this._labelcolor[key],
                daker = d3.color(lck).darker(0.6);
            cG.selectAll('#riline'+key)
                    .attr('opacity',1)
            cG.selectAll('.innerRiver'+key)
                    .attr('opacity', 0.8)
            cG.selectAll('.outerRiver'+key)
                .attr('opacity', 0.4)
            cG.selectAll('#process' + key)
                    .attr('opacity' , 0.6)
            cG.select('#circle'+name)
                    .attr('r', this._circleStyle.highlight_r)
                    .attr('opacity', 1);
            cG.select('#heat' + name)
                .attr('opacity', 1)
            cG.select('#precipitation'+name)
                .attr('stroke', wm._outrate(d3.color(lck).darker(1.6), daker))
                .attr('opacity', 1)
            cG.select('#humidity'+name)
                .attr('stroke', wm._outrate(d3.color(lck).darker(1.6), daker))
                .attr('opacity', 1)
            cG.selectAll('.line'+name)
                .attr('stroke',d3.color(lck).darker(4))
            cG.selectAll('.line' + name)
                .attr('stroke-width', 1.5)
                .attr('opacity', 0.4)
            cG.selectAll('#linestart'+ name)
                .attr('y1', d => wm._y(d.avg) + this._circleStyle.highlight_r)
            cG.selectAll('#linecurve' + name)
                .attr('y2', d => wm._y(d.avg) - this._circleStyle.highlight_r)
            cG.selectAll('.piePath'+ name).selectAll('path')
                .style('stroke-width', 0.5)
                .attr('opacity', 1)
            cG.selectAll('#arctext'+name)
                    .attr('opacity', 1)
                    .attr('fill', d3.color(lck).darker(4))
            cG.selectAll('.clinein' + name)
                .attr('opacity', this._cleadStyle.opacity)
            cG.selectAll('.clineout' + name)
                .attr('opacity', this._cleadStyle.opacity)
        }

        _axisout(name, key){
            const cG = this._container,
                lck =  this._labelcolor[key],
                daker = d3.color(lck).darker(0.6);
            cG.select('#circle'+name)
                .attr('r', this._circleStyle.original_r);
            cG.select('#precipitation'+name)
                .attr('stroke', daker)
            cG.select('#humidity'+name)
                .attr('stroke', daker)
            cG.selectAll('.line'+name)
                .attr('stroke', daker)        
            cG.selectAll('.line' + name)
                .attr('stroke-width', this._outrate(this._leadlineStyle.highlight_strwidth, this._leadlineStyle.original_strwidth))
            cG.selectAll('#linestart'+ name)
                .attr('y1', d =>  this._y(d.avg) + this._circleStyle.original_r)
            cG.selectAll('#linecurve' + name)
                .attr('y2', d =>  this._y(d.avg)- this._circleStyle.original_r)
            cG.selectAll('.piePath'+ name).selectAll('path')
                .style('stroke-width', 0.25)
            cG.selectAll('#arctext'+name)
                .attr('fill', d3.color(lck).darker(1.5))
            cG.selectAll('.dailyInfo').remove()
            cG.selectAll('.clineout' + name)
                .attr('opacity',0.4)
                .attr('stroke', daker).raise()
            cG.selectAll('.clinein' + name)
                    .attr('opacity',0.4)
        }

        _multiplyTarget(name){
            var target=[]
            for (let item of this._leavesData){
                if(item.data.id===name){
                    target=item.data.targets
                }
            }
            for (let item of this._lineData){
                if(item[1].data.id===name){
                    target.push(item[0].data.id)
                }
            }
            return [...new Set(target)]
        }

        _outed(e, name, key) {
            this._initcss()
            this._axisout(name, key);
            let rlines = this._multiplyTarget(name);
            for (let index of rlines){
                this._axisout(index, key);
            }
            this._merge ? this._barInstance.mouseOut() : undefined;
        }

        _overed(e, name, key){
            const data = this._chartData.filter(d => d.indexName===name)[0];
            this._hightlightcss()
            this._axisenter(name, key);
            let rlines = this._multiplyTarget(name)
            for (let index of rlines){
                this._axisenter(index, key);
            }
            this._insertInfo(e, data)
            this._merge ? this._barInstance.mouseOver([name,...rlines]) : undefined;
        }

        _initcss(){
            const cG = this._container;
            cG.selectAll('.riverLine')
                .attr('opacity', 1)
            for (let i in [0,1,2]){
                cG.selectAll('.leadline'+i )
                    .attr('opacity', this._leadlineStyle.opacity)
                cG.selectAll(`.clead${i}`)
                    .attr('opacity', this._cleadStyle.opacity)
                cG.selectAll('.humidity'+i)
                    .attr('opacity', 1)
                cG.selectAll('.precipitation'+i)
                    .attr('opacity', 1)
                cG.selectAll('.circle_color'+i)
                    .attr('opacity', 1)
                cG.selectAll('.heat' + i)
                    .attr('opacity', 1)
                cG.selectAll('.arcpie'+i)
                    .attr('opacity', 1)
                cG.selectAll('.arctext'+i)
                    .attr('opacity', 1)
                cG.selectAll('.innerRiver'+i)
                    .attr('opacity', 0.8)
                cG.selectAll('.outerRiver'+i)
                    .attr('opacity', 0.4)
            }
            cG.selectAll('.processPath')
                .attr('opacity' , 0.6)
        }
        _hightlightcss(){
            const cG = this._container;
            cG.selectAll('.riverLine')
                .attr('opacity', 0.4)
            for (let i in [0,1,2]){
                cG.selectAll('.leadline' + i )
                    .attr('opacity', 0.1)
                cG.selectAll('.clead' + i )
                    .attr('opacity', 0.1)
                cG.selectAll('.humidity' + i)
                    .attr('opacity', 0.5)
                cG.selectAll('.precipitation' + i)
                    .attr('opacity', 0.5)
                cG.selectAll('.circle_color' + i)
                    .attr('opacity', 0.5)
                cG.selectAll('.heat' + i)
                    .attr('opacity', 0.5)
                cG.selectAll('.arcpie' + i)
                    .attr('opacity', 0.5)
                cG.selectAll('.arctext' + i)
                    .attr('opacity', 0.5)
                cG.selectAll('.innerRiver' + i)
                    .attr('opacity', 0.4)
                cG.selectAll('.outerRiver' + i)
                    .attr('opacity', 0.1)
            }
            cG.selectAll('.processPath')
                .attr('opacity' , 0.3)
        }

        _insertInfo(e, d){
            const t = this._texts,
                lck = this._labelcolor[d.month];
            let x=  e.offsetX,
                y=  e.offsetY;
            this._dailyInfo = this._container.append('g')
                // .style('visibility', 'hidden')
                .attr('transform', `translate(${[x , y - this._height/2]})`)
                .attr('class','dailyInfo')
                .attr('font-size', '7pt')
                .style('font-family', 'DIN')
                .style('font-weight', 'normal')
                .call(g => g.append('rect')
                        .attr('x' , -10)
                        .attr('y' , -15)
                        .attr('rx' , 5)
                        .attr('ry', 5)
                        .style('fill', lck)
                        .attr('stroke', 'grey')
                        .attr('stroke-width',1)
                        .attr('width', 165)
                        .attr('opacity' ,0.5)
                        .attr('height', 95))
                .call(g => g.append('g')                       
                    .call(g => t.name = g.append('text').attr('fill', 'black').text('Date: '))
                    .call(g =>  g.append('line').attr('x1',-1).attr('x2', 130).style('stroke', d3.color(lck).darker(4)).attr('y1', 2).attr('y2', 2).style('stroke-width', 0.5))
                    .call(g => t.avg = g.append('text').attr('y', '1.3em').attr('fill', 'black').text('Avg: ')) 
                    .call(g => t.deviation = g.append('text').attr('y', '2.6em').attr('fill', 'black').text('Deviation: ')))
                    .call(g => t.high = g.append('text').attr('y', '3.9em').attr('fill', 'black').text('High: '))
                    .call(g => t.low = g.append('text').attr('y', '5.2em').attr('fill', 'black').text('Low: '))
                    .call(g => t.prec = g.append('text').attr('y', '6.5em').attr('fill', 'black').text('Prec.: '))
                    .call(g =>  g.append('line').attr('x1',-1).attr('x2', 135).style('stroke', d3.color(lck).darker(4)).attr('y1', 2+4*12.4).attr('y2', 2+4*12.4).style('stroke-width', 0.5))
                    .call(g => t.humidity = g.append('text').attr('y', '7.8em').attr('fill', 'black').text('Humidity: '))
            t.name.text(`Index: ${d.indexName}`);
            t.avg.text(`Value: ${d.avg.toFixed(3)}`)
            t.deviation.text(`Deviation: ${d.deviation.toFixed(3)}`)
            t.high.text(`High: ${d.high.toFixed(3)}`);
            t.low.text(`Low: ${d.low.toFixed(3)}`);
            t.prec.text(`SPE.: ${d.precipitation.toFixed(3)}`);
            t.humidity.text(`T^2: ${d.humidity.toFixed(3)}`);
            this._dailyInfo.raise();
        }
        _sort(data){
            let speSort = d3.sort(data,d=> d.precipitation),
                T2Sort = d3.sort(data,d=> d.humidity);
            var sortdata = data.filter(d =>{
                return d.deviation !==0
                // (d3.map(speSort, e=> e.indexName).indexOf(d.indexName)<= vm.multiPara || d3.map(T2Sort, e=> e.indexName).indexOf(d.indexName)<= vm.multiPara) && d.deviation !==0
            })
            var SPE=d3.sort(sortdata,d=> -d.precipitation),
                T2=d3.sort(sortdata,d=> -d.humidity),
                res=d3.sort(sortdata,d=> -d.deviation);
            for (let item in SPE){
                let query=SPE[item].indexName                     
                SPE[item].order=+item+1+(+T2.findIndex((value)=> value.indexName===query))+1+(+res.findIndex((value)=> value.indexName===query))+1
            }
            return d3.sort(SPE,d=> d.order).filter((d, i) => i <= vm.multiPara);
        }

        _deepCopy(obj){
            if(obj instanceof Date) return obj;
            if(typeof obj!=='object') return obj;
            var newObj=obj instanceof Array ? [] :{};
            for (let key in obj){
                if(obj.hasOwnProperty(key)){
                    if(obj[key]===null){
                        newObj[key]===null;
                    }
                    newObj[key]=typeof obj[key] ? this._deepCopy(obj[key]) : obj[key];
                }
            }
            return newObj
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
        _line(y1, y2) {
            return d3.arc()
                .innerRadius(y1)
                .outerRadius(y2)
                .startAngle(Math.PI)
                .endAngle(this._barAngle + Math.PI)();
        }
        _linepad(y1, y2) {
            return d3.arc()
                .innerRadius(y1)
                .outerRadius(y2)
                .startAngle(Math.PI)
                .padAngle((this._barAngle)/this._linespace)
                .endAngle(this._barAngle + Math.PI)();
        }

        _outrate(item1 , item2){
          return d => (this._allIndex.indexOf(d.indexName) !== -1 && this._allIndex.indexOf(d.indexName) < 9) ? item1 : item2
        }

        _sliderArray(arr, totalData){
            return d3.map(arr, (d, f) => {
                d.index = f;
                // console.log(batchData);
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
        
        _rangeInsert(s){
          if(s.h >= s.value && s.value >= s.l)return 0;
          else if(s.exh >= s.value && s.h <= s.value || s.value <= s.l && s.value >= s.exl)return 1;
          else if(s.sxh >= s.value && s.exh <= s.value || s.value <= s.exl && s.value >= s.sxl)return 2;
          else return 3;
        }
      }
      this.wheelChart = new wheelRound(this.svg)
        .size([diameter, diameter])
        .data(wheeldata)
        .process(processJson)
        .labels(labels)
        .render();
    },
    renderChart(){
      this.paintChart(this.jsondata, this.chorddata, this.batchData)
    }
	},
	mounted() {
	},
  computed:{
    ...mapGetters([
      'corrSize',
      'multiPara',
      'curveSize',
      'trainBorder',
      'filterStatus',
      'heatOrRiver'
    ])
  },
  watch:{
    corrSize:function(){
      this.renderChart()
  },
    multiPara:function(){
      this.renderChart()
    },
    curveSize:function(){
      this.renderChart()
    },
    filterStatus:function(){
      this.wheelChart._fliterStatus = this.filterStatus
      this.wheelChart._renderWheelFilter()
    },
    heatOrRiver:function(){
      this.wheelChart._heatOrRiver = this.heatOrRiver
      this.heatOrRiver ? this.wheelChart._initHeatG() : this.wheelChart._initRiverG()
      this.wheelChart._renderWheelFilter()
    }
  }
}
</script>

<style lang="scss" scoped>
@import url("../../assets/marey/wheel.scss");
</style>