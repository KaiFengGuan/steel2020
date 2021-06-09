<template>
	<div>
		<div :id="menuId" style="height: 100%;width:100%;"></div>
	</div>
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
import {mapGetters} from "vuex"
import { init } from 'echarts';
export default {
	data() {
		return {
			menuId: 'wheeling' + Math.random().toString(32).slice(-6),
			svg: undefined,
			data:[],
            jsondata: undefined,
            chorddata: undefined,
            batchData: undefined,
            upid: undefined
		}
	},
	methods: {
        paintChart(jsondata, chorddata, batchData) {
            this.jsondata = jsondata, this.chorddata = chorddata, this.batchData = batchData;
            const wheeldata = [] , labels = []
            const menuId = this.menuId
            this.upid = jsondata.upid
            for(let item in jsondata['INDEX']){
                labels.push(jsondata['INDEX'][item])
                wheeldata.push({
                    name: jsondata['INDEX'][item],
                    PCASPE: jsondata['CONTQ'][item],
                    PCAT2: jsondata['CONTJ'][item],
                    result_value: jsondata['value'][item],
                    result_low: jsondata['l'][item],
                    result_high: jsondata['u'][item],
                    result_extre_high: jsondata['extremum_u'][item],
                    result_extre_low: jsondata['extremum_l'][item]
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
            this.svg=d3.select("#"+vm.menuId)
                .append("svg")
                .attr("viewBox", `${-50} ${-diameter / 2} ${width} ${diameter}`)
                .style("width", width)
                .style("height", diameter);
            class wheelRound{
                constructor(container) {
                    this._container = container;
                    this._g = null;

                    this._width = 640;
                    this._height = 640;
                    this._radius = {
                        inner: 125,
                        outer: 0,
                        max: 0,
                        bubble: 30,
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
                        name: "name",
                        low: "result_low",
                        high: "result_high",
                        elow: "result_extre_low",
                        ehigh: "result_extre_high",
                        avg: "result_value",
                        precipitation: "PCASPE",
                        humidity: "PCAT2",
                    }

                    this._x = null; // date scale
                    this._xpad = null; //pad scale
                    this._y = null; // temperature scale
                    this._h = null; // humidity scale
                    this._hb = null;// humidity border scale
                    this._dayRadian = 0; // one-day radian

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

                    this._process=[];
                    this._padprocess = [[],[],[]];
                    this._processindex = ["heat", "roll", "cool"];
                    this._labelcolor = ["#fcd8a9", "#cce9c7", "#c1c9ee"];
                    this._padAngle=[];
                    this._linespace=6;
                    this._merge = false;
                    this._horizonView = true;
                    this._indexdata = [];
                    this._allIndex = [];    //index name
                    this._indexScale = undefined;
                    this._mouseDis  = undefined;
                    this._barVis = true;
                    this._labelLimit = 0.5;

                    //Style 
                    this._cleadStyle = {
                        "opacity": 0.4,
                        "stroke-width": 1
                    }
                    this._leadlineStyle = {
                        opacity: 0.4,
                        original_strwidth: 0.5,
                        highlight_strwidth: 1
                    }
                    this._circleStyle ={
                        original_r: 2,
                        highlight_r: 3.5
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
                    this._init();
                    this._renderComponents()
                    this._renderMerge()
                    return this;
                }
                _renderBar(){
                    this._fliterdata();
                    this._renderMainWheel();
                    this._renderMainBar();
                }
                _renderWheel(){
                    this._initdata();
                    this._renderMainWheel();
                    this._g.attr("transform", "translate(300,0)")
                }
                _renderMerge(){
                    this._g == null ? undefined : this._g.remove();
                    this._g = this._container.append("g").attr("transform", "translate(-50,0)");
                    this._merge ? this._renderBar() : this._renderWheel();
                }
                _renderComponents(){
                    this._container
                        .append("g")
                        .call(g => g.append("image")
                                .attr("class", "mergeIcon")
                                .attr("width", "25px")
                                .attr("height","25px")
                                .attr("transform", `translate(${[-45, -12.5]})`)
                                .attr("href", mergeLabel))
                        .on("click", (e,d) => {
                            this._merge = !this._merge
                            this._renderMerge()
                            d3.select(".mergeIcon").attr("href", this._merge ? mergeLabel: deMergeLabel);
                        })
                }
                _init() {
                    const r = this._radius;
                    
                    r.max = Math.min(this._width, this._height) / 2.5;
                    r.inner = r.max * 0.40;
                    r.bubble = r.max * 0.2;
                    r.outer = r.max - r.bubble *1.1 - r.label;
                    const fs = d3.scaleLinear().domain([4, 1024]).range([0, 28]);
                    // this._fontSize.info = fs(r.max);
                    fs.range([8, 36]);
                    // this._fontSize.center = fs(r.max);
                    fs.range([4, 18]);
                    // this._fontSize.month = this._fontSize.mark = this._fontSize.tick = fs(r.max);         

                }
                _initdata() {
                    const wm=this
                    const labels=[],lows = [], highs = [], precs = [], humis = [];
                    const field = this._field;
                    this._padprocess=[[],[],[]];
                    this._chartData = this._data.map(d => {
                        const datum = {
                            indexName: d[field.name],
                            date: d[field.name],
                            month: wm.getIndex(d[field.name]),
                            low: d[field.low],
                            high: d[field.high],
                            elow: d[field.elow],
                            ehigh: d[field.ehigh],
                            avg: d[field.avg],
                            precipitation: d[field.precipitation],
                            humidity: d[field.humidity],
                            property:[
                                {"label": "PCAT2", "value": d[field.humidity], "angle": 0.1 },
                                {"label": "PCASPE", "value": d[field.precipitation], "angle": 0.1},
                                {"label": "result", "value": d[field.precipitation], "angle": 0.2}
                            ]
                        };
                        const e=datum;
                        datum.property.map(m => {
                            m.process = +datum.month
                        });
                        datum.property[2].value=e.avg>e.low&e.high>e.avg? 0 : 1.6;
                        let deviation=e.avg>e.low&e.high>e.avg? 0 : (e.avg<e.low ? (e.low-e.avg)/e.low : (e.avg-e.high)/e.high);
                        datum.deviation=deviation;
                        wm._padprocess[wm.getIndex(datum.indexName)].push(datum.indexName)
                        labels.push(datum.indexName)
                        lows.push(datum.low, datum.elow);
                        highs.push(datum.high, datum.ehigh);
                        precs.push(datum.precipitation);
                        humis.push(datum.humidity);
                        return datum;
                    });

                    const pad = 0;
                    const angle = (Math.PI * 2 - 3 * pad )/this._data.length
                    this._dayRadian = (Math.PI * 2- 3 * pad) / this._data.length + Math.PI;
                    const a = angle * this._padprocess[0].length, b = angle * this._padprocess[1].length , c = angle * this._padprocess[2].length;
                    this._padAngle=[
                        [-a/2, a/2 ],
                        [a/2 +pad, a/2 + b + pad ],
                        [a/2 + b + 2 * pad, a/2 + b + c + 2 * pad],
                    ]
                    this._label=labels
                    this._initScales(labels, lows, highs, precs, humis);
                }
                _fliterdata(){
                    const wm=this,limit = this._labelLimit;
                    const labels=[],lows = [], highs = [], precs = [], humis = [];
                    const field = this._field;
                    this._chartData = this._data.map(d => {
                        const datum = {
                            indexName: d[field.name],
                            date: d[field.name],
                            month: wm.getIndex(d[field.name]),
                            low: d[field.low],
                            high: d[field.high],
                            elow: d[field.elow],
                            ehigh: d[field.ehigh],
                            avg: d[field.avg],
                            precipitation: d[field.precipitation],
                            humidity: d[field.humidity],
                            property:[
                                {"label": "PCAT2", "value": d[field.humidity], "angle": 0.1 },
                                {"label": "PCASPE", "value": d[field.precipitation], "angle": 0.1},
                                {"label": "result", "value": d[field.precipitation], "angle": 0.2}
                            ],
                        };
                        datum.property.map(m => {
                            m.process = +datum.month
                        });
                        const e=datum;
                        datum.property[2].value=e.avg>e.low&e.high>e.avg? 0 : 1.6;
                        let deviation=e.avg>e.low&e.high>e.avg? 0 : (e.avg<e.low ? (e.low-e.avg)/e.low : (e.avg-e.high)/e.high);
                        datum.deviation=deviation;
                        datum.over = e.avg>e.low&e.high>e.avg? 0 : (e.avg<e.low ? (e.low-e.avg) : (e.avg-e.high));
                        return datum;
                    });
                    // this._chartData = this._sort(this._chartData);
                    this._chartData = d3.sort(this._chartData, d => - Math.abs(d.over))
                    this._chartData = this._chartData.length > 25 ? this._chartData.slice(0,25) : this._chartData;
                    this._padprocess=[[],[],[]]; 
                    this._chartData.map(datum => {
                        wm._padprocess[wm.getIndex(datum.indexName)].push(datum.indexName)
                        labels.push(datum.indexName)
                        lows.push(datum.low, datum.elow);
                        highs.push(datum.high, datum.ehigh);
                        precs.push(datum.precipitation);
                        humis.push(datum.humidity);
                        return datum;
                    });
                    this._indexdata = this._chartData.slice(0);
                    const mergeLength = this._indexdata.length < 25 ? this._indexdata.length :25,
                        pad = 0,
                        startAngle = Math.PI/6,
                        angle = (Math.PI - 2 * startAngle - 3 * pad )/mergeLength;
                    this._dayRadian = (Math.PI - 2 * startAngle - 3 * pad) / mergeLength + Math.PI;
                    const diverangle = (mergeLength - this._indexdata.length) * angle / 2
                    const a = angle * this._padprocess[0].length + diverangle + Math.PI/6, b = angle * this._padprocess[1].length , c = angle * this._padprocess[2].length;
                    this._padAngle=[
                        [diverangle + Math.PI/6, a ],
                        [a +pad, a + b + pad ],
                        [a + b + 2 * pad, a + b + c + 2 * pad],
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

                    const bext = d3.extent(precs)
                    this._hb = d3.scaleLinear()
                        .domain(bext)
                        .range([0 , r.bubble*0.6]);                    

                    const hext = d3.extent(humis);
                    this._h = d3.scaleLinear()
                        .domain(hext)
                        .range([r.outer , r.outer + r.bubble * 0.6]);
                }
                _renderMainWheel() {
                    this._renderPre();
                    this._renderWheelContent();
                }
                _renderPre(){
                    const defs1 =this._g.append("defs");
                    const filter1 = defs1.append("filter").attr("id", "shadow-filter")
                    filter1.append("feDropShadow")
                        .attr("dx","0")
                        .attr("dy", "0")
                        .attr("stdDeviation", 4)
                        .attr("flood-color", "#bfbdbd")
                    const defs =this._g.append("defs");
                    const filter=defs.append("filter")
                                    .attr("id","filter")
                                    .attr("x", "0")
                                    .attr("y", "0")
                                    .attr("width", "200%")
                                    .attr("height", "200%");
                    filter
                    .call(g =>g.append("feOffset")
                        .attr("result", "offOut")
                        .attr("in", "SourceGraphic")
                        .attr("dx","2.5")
                        .attr("dy", "2.5"))
                    .call(g =>g.append("feGaussianBlur")
                        .attr("result", "blurOut")
                        .attr("in", "offOut")
                        .attr("stdDeviation","2"))
                    .call(g =>g.append("feBlend")
                        .attr("in2", "blurOut")
                        .attr("in", "SourceGraphic")
                        .attr("mode","normal"))
                }
                _renderMainBar(){
                    const r = this._radius,
                        R = r.outer+r.bubble*1.05,
                        wm = this,
                        lc =this._labelcolor,
                        xpad = this._xpad,
                        v = (this._dayRadian-Math.PI)/2,
                        mainG = this._g.append("g").attr("class", "mainG"),
                        line = d3.line()
                                .x(e => e[0])
                                .y(e => e[1])
                                .curve(d3.curveLinear),
                        pieAngle = d3.pie()
                                .value(d => d.angle)
                                .startAngle(0.5* Math.PI)
                                .endAngle(2.5 * Math.PI),
                        piearc = d3.arc()
                                .innerRadius(0)
                                .outerRadius(r.bubble * 0.16);
                    var limit = this._labelLimit,
                        RectWidth = 400,
                        rectX = r.outer+r.bubble* 5.4,  //rect_doct x
                        maxHeight = 25,   //rect max height
                        rectPadding = {left: 5, right: 5, top: 5, bottom: 2},
                        indexSpace = 5,
                        iconWidth = 20,
                        rectNum =  null,
                        opacityCache = null,
                        selectInfo = this._indexdata,
                        barVisObject = Object.assign({}, ...selectInfo.map(d => {return {[d.indexName] : this._barVis}})),
                        indexArray = d3.map(selectInfo, (d, i) => i),
                        indexSort = d3.map(selectInfo, d => d.indexName),
                        indexScale = d3.scaleOrdinal().domain(indexArray).range(indexArray),// index  --- sort
                        rectHeight = null,
                        yScaleCache = null,
                        yScale = null,  //指标在y轴上的坐标
                        startXY = null,
                        centerScaleY = null,
                        lineToCircle = null,
                        lineToRect = null,
                        lastY = null;
                        renderyAxis();

                        var lineG = mainG.append("g").attr("class", "lineG"),
                            arcG = mainG.append("g").attr("class", "arcG");
                        initLineG();
                        initArcG();

                        var sliderG = mainG.append("g")
                            .attr("class", "sliderG")
                            .attr("transform", `translate(${[rectX, 0]})`),
                            maxLength = 3,  //batch numbers
                            minRect = RectWidth/ (maxLength + 0.5),
                            rectArray = new Array(maxLength).fill(minRect).map((d, i) => Math.ceil(maxLength/2) == i + 1 ? 1.5 * d : d),   //batch position
                            rectPosition = Array.from(d3.cumsum(rectArray));
                        initDragG();
                        
                        var sliderData = this._sliderArray(selectInfo),
                            horizenEX = (new Array(maxLength).fill(0))
                            .map((d, i) => wm._deepCopy(sliderData).map((e, f) =>{ 
                                    var temp = e.map(g => {
                                        g.i = i;
                                        return g
                                    })
                                    temp.i = i;
                                    temp.d = f;
                                    return temp
                                }
                            )),
                            overlap = 3,    //horizen layer
                            overlapNum = [-1, -2, -3, 0, 1, 2],
                            overHeight = [-3 , -2 , -1, 1, 2 , 3].map(d => d * (maxHeight - rectPadding.top - rectPadding.bottom)),
                            horizenColor = i => {
                                return ["#e34649", "#f7a8a9", "#fcdcdc", "#f7f7f7", "#fcdcdc","#f7a8a9", "#e34649"][i + (i >= 0) + overlap]
                            },
                            timeScale;
                            //https://observablehq.com/d/d503153fbfd48b03

                        wm._horizonView ? initMergeArea() : initHorizenArea();
                        if(rectArray.some(d => d === maxHeight))renderRectG()
                        initAxisG(timeScale);

                        var triangleG = mainG.append("g")
                            .attr("class", "triangleG")
                            .attr("transform", `translate(${[rectX - iconWidth - 2.5, 0]})`),
                            trianIcon = d => barVisObject[d.indexName] ? "M-5,-2.5l10,0l-5,5l-5,-5zM-5,-2.5z" : "M-2.5,0l0,-5l5,5l-5,5zM-2.5,0z";
                        initIcon();

                        var barG = mainG.append("g").attr("class", "barG").attr("transform", `translate(${[rectX- maxHeight - iconWidth, 0]})`);
                        initBarG();

                        var mouseInfo = this._mouseDis !== undefined ? mouseText(this._mouseDis) : undefined;
                        initMouseG();

                        let tempsort = d3.map(d3.sort(selectInfo, d => -d.humidity), d => d.indexName),
                            sortArray = d3.map(indexSort, d => tempsort.indexOf(d)),
                            totalSort = d3.map(d3.sort(selectInfo, d => -Math.abs(d.over)), d => d.indexName),
                            totalArray = d3.map(indexSort, d => totalSort.indexOf(d));
                        var scaleArray = [indexScale, d3.scaleOrdinal().domain(indexArray).range(sortArray), d3.scaleOrdinal().domain(indexArray).range(totalArray)];
                        indexScale = this._indexScale !== undefined ? scaleArray[this._indexScale] : scaleArray[2];
                        let sortG = mainG.append("g")
                                .attr("class", "sortG"),
                            sortColor = "#678fba",
                            sortChange = (value1, value2) => d => d === (this._indexScale !== undefined ? this._indexScale : 0) ? value1: value2,
                            sortText = ["Single" ,"Limit", "Total"];
                        initSort();

                        const switchG = mainG.append("g").attr("class", "switchG"),
                            textColor = ["Horizon", "River"],
                            tabColor = "#678fba",
                            transfrom = (v1, v2) => d => this._horizonView == Boolean(d) ? v1 : v2;
                        initSwitch();

                        const visG = mainG.append("g").attr("class", "visG");
                        initVisG();

                        initMapArea()
                        sliderG.selectAll(".heatMapG").raise();

                        function renderyAxis(){
                            let invert = d3.scaleOrdinal().domain(indexScale.range()).range(indexScale.domain())
                            rectHeight = indexArray.map(d => (barVisObject[indexSort[invert(+d)]] ? 2 : 1 )* maxHeight + indexSpace)
                            rectHeight.unshift(0)   //定位第一个元素
                            yScaleCache = Array.from(d3.cumsum(rectHeight)).map(d => -wm._height/2 + 2 * maxHeight + d);
                            rectNum = yScaleCache.filter(d => d < wm._height/2 - maxHeight ).length;
                            opacityCache = (d, i) => indexScale(i) < rectNum ? 1 : 0;
                            yScale = i => yScaleCache[indexScale(i)];
                            startXY = d => [R * (Math.sin(xpad[d.month](d.date)+ v)), -R * Math.cos(Math.abs(xpad[d.month](d.date)+ v))];
                            centerScaleY = d => startXY(d)[1] + 25/startXY(d)[0] * startXY(d)[1];
                            lastY = wm._height/2 - maxHeight;
                            lineToRect = (d, i) =>{
                                let centerY = centerScaleY(d),
                                    endY = yScale(+i);
                                return [[rectX - 75, centerY],[rectX - 60, centerY], [rectX - maxHeight - iconWidth, endY], [rectX , endY], [rectX + RectWidth, endY]]
                            };
                            lineToCircle = d =>{
                                let [startX, startY] = startXY(d),
                                centerY = centerScaleY(d);
                                return [[startX, startY], [startX + 25, centerY], [rectX - 105, centerY]]
                            };
                        }
                        function initIcon(){// init triangleG
                            triangleG.selectAll("g")
                                .data(selectInfo)
                                .join("g")
                                .attr("opacity", opacityCache)
                                .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight ]})`)
                                .call(g => g.append("rect")
                                    .attr("fill", "none")
                                    .attr("width", maxHeight)
                                    .attr("stroke", d => lc[d.month])
                                    .attr("stroke-width", 0.25)
                                    .attr("height", maxHeight))
                                .call(g => g.append("path")
                                    .attr("transform", `translate(${[maxHeight/2, maxHeight/2]})`)
                                    .attr("d", trianIcon)
                                    .attr("fill", d => lc[d.month])
                                .on("click", function(e, d){
                                    const t = d3.transition()
                                        .duration(300)
                                        .ease(d3.easeLinear);
                                    barVisObject[d.indexName] = !barVisObject[d.indexName]; 
                                    d3.select(this).attr("d", trianIcon).transition(t);
                                    renderyAxis();
                                    renderSort();
                                }))
                        }
                        function initLineG(){
                            lineG.selectAll("g").data(selectInfo).join("g")
                                .attr("opacity", opacityCache)
                                .call(g => g.append("path")
                                    .attr("stroke", d => d3.color(lc[d.month]).darker(0.5))
                                    .datum(lineToCircle)
                                    .attr("d", d => line(d))
                                    .attr("stroke-width", 1)
                                    .attr("fill", "none"))
                                .call(g => g.append("circle")
                                        .attr("fill", d =>  lc[d.month])
                                        .attr("r", r.bubble * 0.16)
                                        .attr("stroke",d => d3.color(lc[d.month]).darker(0.5))
                                        .attr("transform", d =>  `translate(${[rectX - 145, centerScaleY(d)]})`))
                                .call(g => g.append("text")
                                        .attr("class", "sortIndex")
                                        .text((d, i) => +indexScale(i) + 1)
                                        // .text((d, i) => i + 1)
                                        .attr("transform", d => `translate(${[rectX - 145, centerScaleY(d) + 2.5]})`))
                                .call(g => g.append("text")
                                    .attr("font-size", "8px")
                                    .attr("class", d => `arctext${d.month}`)
                                    .attr("id", d => `arctext${d.date}`)
                                    .attr("fill", d => d3.color(lc[d.month]).darker(0.5))
                                    .text(d => d.indexName.replace(/thickness/, "").replace(/temp_uniformity_/, "").replace(/wedge/, "").slice(0, 8))
                                    .attr("transform", d => `translate(${[rectX - 90, centerScaleY(d) + 2]})`))
                                .call(g => g.append("path")
                                    .attr("class", "lineToRect")
                                    .attr("stroke", d => d3.color(lc[d.month]).darker(0.5))
                                    .attr("d", (d, i) => line(lineToRect(d, i)))
                                    .attr("stroke-width", 1)
                                    .attr("fill", "none"))
                        }
                        function initArcG(){
                            arcG.selectAll("g").data(selectInfo)
                                .join("g")
                                .attr("transform", d => `translate(${[rectX - 125, centerScaleY(d)]})`)
                                .attr("opacity", opacityCache)
                                .call(g => g.selectAll("path").data(d => pieAngle(d.property))
                                    .join("path")
                                    .attr("d", piearc)
                                    .attr("fill", d => ((+d.data.value)>limit? lc[+d.data.process] : "white"))
                                    .style("stroke", d => d3.color(lc[+d.data.process]).darker(2))
                                    .attr("opacity", 1)
                                    .style('stroke-width', 0.25)
                                )
                        }
                        function initDragG(){
                            sliderG.selectAll("dragG")  //area drag
                            .data(Object.keys(rectPosition).map(d => +d).slice(0, -1)).join("g")
                            .attr("class", "dragG")
                            .attr("transform", d => `translate(${[rectPosition[d], 0]})`)
                            .call(g => g
                                .call(g => g.selectAll("g")
                                    .data(selectInfo)
                                    .join("g")
                                    .attr("class", "dragElement")
                                    .attr("opacity", opacityCache)
                                    .attr("transform", (d, i) => `translate(${[0 , yScale(i)]})`)
                                    .call(g => g.append('rect')
                                        .attr("width", 0.5)
                                        .attr("y", - maxHeight)
                                        .attr("height", maxHeight))
                                    .call(g => g.append('rect')
                                        .attr("width", 5)
                                        .attr("x", -2.5)
                                        .attr("y", - maxHeight)
                                        .attr("height", maxHeight)
                                        .attr("opacity", 0)))
                                .call(d3.drag()
                                    .on('drag', dragMove)
                                ))
                        }
                        function dragMove(e, d){    //update batch
                            rectPosition[d] = e.x
                            rectPosition = Array.from(rectPosition);
                            rectPosition.unshift(0);
                            var rectlength = d3.pairs(rectPosition, (a, b) => b -a).filter((d, i) => i + 1 !== Math.ceil(maxLength/2));
                            if(!rectlength.every(d => d > maxHeight - 5)){   //RectWidth/ maxLength/2
                                minRect = maxHeight
                            }else{
                                minRect = (minRect ==  d3.min(rectlength)) ? d3.max(rectlength) : d3.min(rectlength);
                            }
                            if( RectWidth - (maxLength - 1) * minRect < RectWidth /maxLength)minRect = (RectWidth - RectWidth /maxLength)/(maxLength - 1)
                            rectArray = new Array(maxLength).fill(minRect).map((d, i) => Math.ceil(maxLength/2) == i + 1 ? RectWidth - (maxLength - 1) * minRect : d);   
                            rectPosition = d3.cumsum(rectArray)
                            d3.selectAll(".dragG")
                                .transition(d3.transition()
                                    .duration(200)
                                    .ease(d3.easeLinear))
                                .attr("transform", d => `translate(${[rectPosition[d], 0]})`)
                            updateArea();
                            renderAxisG(timeScale);
                            minRect !== maxHeight ? sliderG.selectAll(".rectG").remove() : renderRectG();
                        }
                        function initSort(){//init sortG
                            sortG.selectAll("g").data([2, 1, 0]).join("g")
                            .attr("transform", d => `translate(${[rectX + RectWidth - 100 -  60 * (1 - d), -wm._height/2 + 2.5]})`)
                            .call(g => g.append("rect")
                                .attr("fill",  sortChange(sortColor, "#fff"))
                                .attr("rx", 5)
                                .attr("ry", 5)
                                .attr("stroke", sortColor)
                                .attr("stroke-width", 0.5)
                                .attr("height", 20)
                                .attr("width", 45))
                            .call(g => g.append("text")
                                .attr("fill", sortChange("#fff", sortColor))
                                .attr("x", 22.5)
                                .attr("y", 12.5)
                                .text(d => sortText[d]))
                            .on("click", (e, d) =>{
                                indexScale = scaleArray[d];
                                wm._indexScale = d;
                                renderyAxis()
                                renderSort()
                            })
                        }
                        function mouseText(dis){// calculate abscissa
                            let sumsearch = d3.leastIndex(rectPosition, d => dis < d),
                                indexsearch = sumsearch === 0 ? dis : dis - rectPosition[sumsearch],
                                mouseDate = new Date(timeScale[sumsearch].invert(indexsearch)),
                                selectDate = horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time).time),
                                mouseInfo = horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time)[wm._horizonView ? "ovalue" : "ovalue"]);
                            if(wm._horizonView){
                                sliderG.selectAll("circle").attr("r", 2)
                                sliderG.selectAll("circle").attr("r", d => d.time.toString() !== selectDate[0].toString() ? 2 : 3.5)
                            }
                            return mouseInfo
                        }
                        function renderSort(){//render sortG
                            const t = d3.transition()
                                        .duration(300)
                                        .ease(d3.easeLinear);
                                lineG.selectAll("g")
                                    .transition(t)
                                    .attr("opacity", opacityCache)
                                lineG.selectAll(".sortIndex")
                                    .transition(t)
                                    .text((d, i) => indexScale(i) + 1)
                                lineG.selectAll(".lineToRect")
                                    .transition(t)
                                    .attr("d", (d, i) => line(lineToRect(d, i)))
                                if(wm._horizonView){ 
                                    sliderG.selectAll(".batchElement")
                                        .transition(t)
                                        .attr("transform", (d, i) =>`translate(${[0, yScale(i)]})`)
                                        .attr("opacity", opacityCache)
                                }else{
                                    sliderG.selectAll(".horizenElement")
                                        .transition(t)
                                        .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight +  rectPadding.top]})`)
                                        .attr("opacity", opacityCache)
                                }
                                sliderG.selectAll(".dragElement")
                                    .transition(t)
                                    .attr("transform", (d, i) =>`translate(${[0, yScale(i)]})`)
                                    .attr("opacity", opacityCache)
                                sliderG.selectAll(".rectElement")
                                    .transition(t)
                                    .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight ]})`)
                                    .attr("opacity", opacityCache)
                                barG.selectAll("g")
                                    .transition(t)
                                    .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight]})`)
                                    .attr("opacity", opacityCache)
                                sortG.selectAll("rect")
                                    .transition(t)
                                    .attr("fill", sortChange(sortColor, "#fff"));
                                sortG.selectAll("text")
                                    .transition(t)
                                    .attr("fill", sortChange("#fff", sortColor));
                                triangleG.selectAll("g")
                                    .transition(t)
                                    .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight ]})`)
                                    .attr("opacity", opacityCache)
                                        .selectAll("path")
                                        .attr("d", trianIcon)
                                if(wm._mouseDis !== undefined){
                                    var mouseInfo = mouseText(wm._mouseDis);
                                    sliderG.selectAll(".textG")
                                        .transition(t)
                                        .attr("opacity", opacityCache)
                                        .attr("transform", (d, i) =>`translate(${[wm._mouseDis - 10, yScale(i) - maxHeight/2]})`)
                                        .text((d, i) => (+mouseInfo[i]).toFixed(2))
                                    sliderG.select(".mouseG").raise()
                                    sliderG.selectAll(".textG").raise()
                                }
                                sliderG.selectAll(".heatMapElement")
                                    .transition(t)
                                    .attr("opacity", (d, i) => barVisObject[d[0].indexName] ? opacityCache(d, i) : 0)
                                    .attr("transform", (d, i) =>`translate(${[0, yScale(i) + maxHeight]})`)
                                arcG.selectAll("g")
                                    .transition(t)
                                    .attr("opacity", opacityCache)
                        }
                        function initSwitch(){ //init switchG
                            switchG.selectAll("g").data([1, 0]).join("g")
                                .attr("transform", d => `translate(${[rectX +  60 * (1 - d), - wm._height/2 + 2.5]})`)//280  - 100
                                .call(g => g.append("rect")
                                    .attr("fill", transfrom(tabColor, "#fff"))
                                    .attr("rx", 5)
                                    .attr("ry", 5)
                                    .attr("stroke", tabColor)
                                    .attr("stroke-width", 0.5)
                                    .attr("height", 20)
                                    .attr("width", 45))
                                .call(g => g.append("text")
                                    .attr("fill", transfrom("#fff", tabColor))
                                    .attr("x", 22.5)
                                    .attr("y", 12.5)
                                    .text(d => textColor[d]))
                                .on("click", (e, d) =>{
                                    if(wm._horizonView !== Boolean(d)){
                                        wm._horizonView = Boolean(d);
                                        let t = d3.transition()
                                                .duration(300)
                                                .ease(d3.easeLinear);
                                        switchG.selectAll("rect")
                                            .transition(t)
                                            .attr("fill", transfrom(tabColor, "#fff"));
                                        switchG.selectAll("text")
                                            .transition(t)
                                            .attr("fill", transfrom("#fff", tabColor));
                                        if(wm._horizonView){
                                            sliderG.selectAll(".horizenG")
                                            // .transition(d3.transition()
                                            //     .duration(200)
                                            //     .ease(d3.easeLinear))
                                            .remove();
                                            initMergeArea()
                                        }else{
                                            sliderG.selectAll(".batchG")
                                            // .transition(d3.transition()
                                            //     .duration(150)
                                            //     .ease(d3.easeLinear))
                                            .remove();
                                            initHorizenArea()
                                        }
                                    }
                                })
                        }
                        function initVisG(){
                            visG
                                .attr("transform", `translate(${[rectX +  RectWidth/3, - wm._height/2 + 2.5]})`)
                            visG.append("rect")
                                    .attr("fill", wm._barVis ? tabColor : "white")
                                    .attr("rx", 5)
                                    .attr("ry", 5)
                                    .attr("stroke", tabColor)
                                    .attr("stroke-width", 0.5)
                                    .attr("height", 20)
                                    .attr("width", 45)
                            visG.append("text")
                                    .attr("fill", wm._barVis ? "white" : tabColor)
                                    .attr("x", 22.5)
                                    .attr("y", 12.5)
                                    .text("vis")
                            visG.on("click", function(e, d){
                                    wm._barVis = !wm._barVis;
                                    d3.select(this).select("rect").attr("fill", wm._barVis ? tabColor : "white")
                                    d3.select(this).select("text").attr("fill", wm._barVis ? "white" : tabColor)
                                    barVisObject = Object.assign({}, ...selectInfo.map(d => {return {[d.indexName] : wm._barVis}}))
                                    renderyAxis();
                                    renderSort();
                                })
                        }
                        function initAxisG(batchTimeScale){ //init timeTick
                            sliderG.selectAll(".axisG").data(rectPosition)
                                .join("g")
                                .attr("class", "axisG")
                                .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], lastY]})`)
                                .call(g =>g
                                    .style("font", "6px")
                                    .style("font-weight", "normal")
                                    .style("color", "grey")
                                    .each(function(d,i) {
                                        d3.select(this)
                                        .call(d3.axisBottom(batchTimeScale[i])
                                            .ticks(rectArray[i] < 60 ? 1 : 3)
                                            .tickFormat((d, i) => i === 0 ? d3.timeFormat("%d %H:%M")(d) : d3.timeFormat("%d %H:%M")(d))
                                            .tickSize(2)
                                            .tickPadding(2.5)
                                        )
                                    })
                                )
                                // .call(g => g.select(".domain").remove()))
                                .call(g => g.selectAll("text")
                                    .attr("transform", "translate(0, 12)rotate(45)"))
                        }
                        function initBarG(){  //init BarG
                            barG
                                .selectAll("g").data(selectInfo).join("g")
                                .attr("opacity", opacityCache)
                                .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight]})`)
                                .call(g => g.append("rect")
                                    .attr("height", maxHeight)
                                    .attr("width", maxHeight)
                                    .attr("stroke", (d, i) => lc[selectInfo[i].month])
                                    .attr("fill", "none")
                                    .attr("stroke-width", 0.25))
                                .call(g => g.append("path")
                                    .attr("fill", "#b9c6cd")
                                    .attr("opacity", 0.8)
                                    .attr("d", (d, i) => infoArea(d, i, true)))
                                .call(g => g.append("path")
                                    .attr("fill", "#94a7b7")
                                    .attr("opacity", 0.8)
                                    .attr("d", (d, i) => infoArea(d, i, false)))
                        }
                        function initMouseG(){
                            sliderG.append("line")
                                .attr("class", "mouseG")
                                .attr("y1", yScale(0) - maxHeight)
                                .attr("y2", lastY)
                                .attr("transform", (d, i) =>`translate(${[mouseInfo ? wm._mouseDis : 0, 0]})`)
                                .attr("stroke", mouseInfo !==undefined ? "#bbbcbd" : "none")
                                .attr("stroke-width", 0.25)
                            sliderG.selectAll("textG").data(selectInfo).join("text")
                                .attr("class", "textG")
                                .attr("opacity", opacityCache)
                                .attr("transform", (d, i) =>`translate(${[mouseInfo ?  wm._mouseDis - 10 : 0 , yScale(i) - maxHeight/2]})`)
                                    .text((d, i) => mouseInfo !==undefined ? (+mouseInfo[i]).toFixed(2) : "")
                                    .attr("fill", "black")
                            sliderG.on("mousemove", (e, d) => {
                                let mouseDis = e.offsetX - rectX;//mouse distance
                                if(mouseDis <= 0)return
                                sliderG.select(".mouseG")
                                    .attr("transform", (d, i) =>`translate(${[mouseDis, 0]})`)
                                    .attr("stroke", "#bbbcbd")
                                var mouseInfo = mouseText(mouseDis);
                                sliderG.selectAll(".textG")
                                    .attr("transform", (d, i) =>`translate(${[mouseDis - 10, yScale(i) -maxHeight/2]})`)
                                    .text((d, i) => (+mouseInfo[i]).toFixed(2))
                                wm._mouseDis = mouseDis;
                            })
                        }
                        function renderRectG(){
                            sliderG.selectAll(".rectG").data(Object.keys(rectPosition).filter((d, i) => i !== Math.ceil(maxLength/2) - 1))
                                .join("g")
                                .attr("transform", d =>`translate(${[d == 0 ? 0 : rectPosition[+d -1 ], 0]})`)
                                .attr("class", "rectG")
                                .call(g => g.selectAll("g")
                                    .data(d => horizenEX[+d])
                                    .join("g")
                                    .attr("class", "rectElement")
                                    .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight]})`)
                                    .call(g => g.append("rect")
                                        .attr("height", maxHeight)
                                        .attr("width", maxHeight)
                                        .attr("fill", "white"))
                                    .call(g => g.append("rect")
                                        .attr("x", 2)
                                        .attr("y", 2)
                                        .attr("height", maxHeight - 4)
                                        .attr("width", maxHeight - 4)
                                        .attr("fill", d => wm._horizonColor(d))
                                        .attr("stroke",function(d){
                                            return d3.color(d3.select(this).attr("fill")).darker(0.5)
                                        })
                                        .on("mousemove", (e, d) => {
                                            e.stopPropagation()
                                        }))
                                    .call(g => g.append("polygon")
                                        .attr("transform", `translate(${[maxHeight/2, maxHeight/2]})`)
                                        .attr("points", d => wm._horizonPoint(d, maxHeight/2, true))
                                        .attr("fill", "#c65b24")
                                        .attr("opacity", 0.6)
                                        .attr("stroke", "#c65b24"))
                                    .call(g => g.append("polygon")
                                        .attr("transform", `translate(${[maxHeight/2, maxHeight/2]})`)
                                        .attr("points", d => wm._horizonPoint(d, maxHeight/2, false))
                                        .attr("fill", "#c65b24")
                                        .attr("opacity", 0.6)
                                        .attr("stroke", "#c65b24")))
                                
                        }
                        function infoArea(arr, index, flag){// barG bin distribute
                            let data = horizenEX.map(d => d[index]).flat().map(d => d.value),
                                bin = d3.bin().thresholds(30)(data),
                                y = d3.scaleLinear().domain([bin[0].x0, bin[bin.length - 1].x1]).range([2, maxHeight - 2]),
                                bin2 = d3.bin().thresholds(30)(horizenEX.slice(Math.ceil(maxLength / 2)- 1, Math.ceil(maxLength / 2)).map(d => d[index]).flat().map(d => d.value)),
                                x = d3.scaleLinear().domain([0, d3.max(bin, d => d.length)]).range([0, maxHeight - 2]),
                                area = d3.area()
                                    .x0(d => maxHeight - 2 -x(d.length))
                                    .x1(maxHeight)
                                    .y(d => y((d.x0 + d.x1)/2));
                            return flag ? area(bin) : area(bin2) 
                        }
                        function renderAxisG(batchTimeScale){// render timeTick
                            sliderG.selectAll(".axisG")
                                .transition(d3.transition()
                                    .duration(200)
                                    .ease(d3.easeLinear))
                                .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], lastY]})`)
                                .each(function(d,i) {
                                    d3.select(this)
                                    .call(d3.axisBottom(batchTimeScale[i])
                                        .ticks(rectArray[i] < 60 ? 1 : 3)
                                        .tickFormat((d, i) => i === 0 ? d3.timeFormat("%d %H:%M")(d) : d3.timeFormat("%d %H:%M")(d))
                                        .tickSize(2)
                                        .tickPadding(2.5)
                                    )
                                })
                            .call(g => g.selectAll("text")
                                    .attr("transform", "translate(0, 12)rotate(45)"))
                        }
                        function areaParameter(array, data){	//area function
                            let xBatch = array.map((d, i) => {
                                let l = array[i],
                                    scale = d3.scaleLinear()
                                        // .range([0, l])
                                        .range([rectPadding.left, l - rectPadding.right])
                                        .domain(d3.extent(data[i][0], (e, f)=> e.time));
                                return scale
                            });
                            let yBatch = d3.scaleLinear()
                                .range([0, maxHeight - rectPadding.top])//有个BUG ，无法改成下面一行
                                // .range([rectPadding.bootom, maxBarHeight -rectPadding.top])
                                .domain([0, 1]);
                            let mergeArea = d3.area()
                                .x(d => xBatch[d.i](d.time))
                                .y0((d, i) => -yBatch(d.min))
                                .y1((d, i) => -yBatch(d.max)),
                                mergeLine = d3.line()
                                    .x(d => xBatch[d.i](d.time))
                                    .y((d, i) => -yBatch(d.value))
                                    .curve(d3.curveLinear),
                                mergeLocation = d => [xBatch[d.i](d.time), -yBatch(d.value)];
                            timeScale = xBatch;
                            return [mergeArea, mergeLine, mergeLocation]
                        }
                        function updateArea(){
                            if(wm._horizonView){
                                let [mergeArea, mergeLine, mergeLocation] = areaParameter(rectArray, horizenEX);
                                sliderG.selectAll(".batchG")
                                    .transition(d3.transition()
                                        .duration(200)
                                        .ease(d3.easeLinear))
                                    .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`)
                                    .call(g => g.selectAll(".path")
                                        .attr("d", mergeArea))
                                    .call(g => g.selectAll(".line")
                                        .attr("d", mergeLine))
                                    .call(g => g.selectAll("circle")
                                        .attr("transform", d =>`translate(${mergeLocation(d)})`))
                                    ;                           
                            }else{
                                var horizenArea = horizenParameter(rectArray, horizenEX)
                                sliderG.selectAll(".horizenG")
                                    .transition(d3.transition()
                                        .duration(150)
                                        .ease(d3.easeLinear))
                                    .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`)
                                    .selectAll("path")
                                    .attr("d", horizenArea)
                                sliderG.selectAll(".clipRect")
                                    .transition(d3.transition()
                                    .duration(50)
                                    .ease(d3.easeLinear))
                                    .attr("width", d => rectArray[d.i])
                            }
                            initMapArea()
                            // var [xBatch,xLabelData ,qBatch, t2Batch] = heatMapParameter(rectArray, horizenEX)
                            // sliderG.selectAll(".heatMapG")
                            //         .transition(d3.transition()
                            //             .duration(150)
                            //             .ease(d3.easeLinear))
                            //         .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`)
                            //         .call(g => g.selectAll(".mapQ")
                            //             .attr("y", d => -qBatch(d.Q))
                            //             .attr("height", d => qBatch(d.Q))
                            //             .attr("width", (d, i) => xLabelData[d.i][i])
                            //             .attr("x", (d, i) => xBatch[d.i](d.time) - xLabelData[d.i][i]/2))
                            //         .call(g => g.selectAll(".mapT2")
                            //             .attr("y", d => -t2Batch(d.T2) - maxHeight/2)
                            //             .attr("height", d => t2Batch(d.T2))
                            //             .attr("width", (d, i) => xLabelData[d.i][i])
                            //             .attr("x", (d, i) => xBatch[d.i](d.time) - xLabelData[d.i][i]/2))
                        }
                        function initMergeArea(){
                            let [mergeArea, mergeLine, mergeLocation] = areaParameter(rectArray, horizenEX);
                                sliderG.selectAll(".batchG").data(rectPosition)
                                    .join("g")
                                    .attr("class", "batchG")
                                    .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`)
                                    .call( g => g.selectAll("g")
                                        .data((d, i) => horizenEX[i])
                                        .join("g")
                                        .attr("class", "batchElement")
                                        .attr("opacity", opacityCache)
                                        .attr("transform", (d, i) =>`translate(${[0, yScale(i)]})`)
                                            .call(g => g.append("path")
                                                .attr("fill", (d, i) => lc[selectInfo[i].month])
                                                .attr("class", "path")
                                                .attr("opacity", 0.8)
                                                .datum(d => d)
                                                .attr("d", mergeArea))
                                            .call(g => g.append("path")
                                                .attr("stroke-width", 1)
                                                .attr("class", "line")
                                                .attr("stroke", (d, i) => d3.color(lc[selectInfo[i].month]).darker(0.6))
                                                .attr("fill", "none")
                                                .datum(d => d)
                                                .attr("d", mergeLine)
                                                // .attr("d", d => mergeLine(d))
                                                )
                                            .call(g => g.selectAll("circle")
                                                .data(d => d).join("circle")
                                                .attr("transform", d =>`translate(${mergeLocation(d)})`)
                                                .attr("fill", (d, i) => lc[selectInfo[d.d].month])
                                                .attr("stroke", (d, i) => d3.color(lc[selectInfo[d.d].month]).darker(1))
                                                .attr("stroke-width", 0.25)
                                                .attr("r", 2)))
                        }
                        function horizenParameter(array, data){	//horizen function
                            let xBatch = array.map((d, i) => {
                                    let l = array[i],
                                        scale = d3.scaleTime()
                                            .range([rectPadding.left, l - rectPadding.right])
                                            .domain(d3.extent(data[i][0], (e, f)=> e.time));
                                    return scale
                                }),
                                yBatch = array.map((d, i) => {
                                    return data[i].map((e, f) =>{
                                        return d3.scaleLinear()
                                                .range(overHeight)
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
                            var horizenArea = horizenParameter(rectArray, horizenEX)
                                sliderG.selectAll(".horizenG").data(rectPosition)
                                .join("g")
                                    .attr("class", "horizenG")
                                    .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`)
                                    .call(g => g.selectAll("g")
                                        .data((d, i) => horizenEX[i])
                                        .join("g")
                                        .attr("class", "horizenElement")
                                        .attr("opacity", opacityCache)
                                        .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight +  rectPadding.top]})`)
                                            .call(g => g.append("clipPath")
                                                .attr("id", d => `${d.i}clipy${d.d}`)
                                                .append("rect")
                                                    .attr("width", d => rectArray[d.i])
                                                    .attr("class", "clipRect")
                                                    .attr("height", maxHeight - rectPadding.top - rectPadding.bottom))
                                            .call(g => g.append("defs").append("path")
                                                    .attr("opacity", 0.8)
                                                .attr("class", "allpath")
                                                .attr("id", d => `${d.i}path-def${d.d}`)
                                                    .datum(d => d)
                                                    .attr("d", horizenArea))
                                            .call(g => g.append("g")
                                                .attr("clip-path", d => `url(#${d.i}clipy${d.d})`)
                                                .selectAll("use")
                                                    .data(d => new Array(overlap).fill(d))
                                                    .enter()
                                                    .append("use")
                                                    .attr("fill", (d, i) => horizenColor(overlapNum[i]))
                                                    .attr("transform", (d, i) => `translate(0,${(overlapNum[i] + 1) * (maxHeight - rectPadding.top - rectPadding.bottom)})`)
                                                    .attr("href", d => `#${d.i}path-def${d.d}`)))
                        }
                        function heatMapParameter(array, data){
                            let xBatch = array.map((d, i) => {
                                let l = array[i],
                                    scale = d3.scaleLinear()
                                        .range([rectPadding.left, l - rectPadding.right])
                                        .domain(d3.extent(data[i][0], (e, f)=> e.time));
                                return scale
                            });
                            let xLabelData = array.map((d,i) =>{
                                let temp = data[i][0].map(d => xBatch[i](d.time));
                                temp.unshift(rectPadding.left)
                                let subtemp = d3.pairs(temp, (a, b) => b -a);
                                let key = 2.2;
                                let padding = subtemp.map((d, i) => {
                                    if(i !== temp.length - 1){
                                        return subtemp[i] > subtemp[i + 1] ? subtemp[i+1]/key : subtemp[i]/key;
                                    }
                                    return subtemp[i]/key
                                })
                                return padding
                            })
                            let yBatch1 = d3.scaleLinear()
                                .range([0, maxHeight/2 - rectPadding.top/2])
                                .domain(d3.extent(d3.map(data, d => d3.map(d, e => d3.map(e, f => f.Q))).flat(2)));
                            let yBatch2 = d3.scaleLinear()
                                .range([0, maxHeight/2 - rectPadding.top/2])
                                .domain(d3.extent(d3.map(data, d => d3.map(d, e => d3.map(e, f => f.T2))).flat(2)));
                            return [xBatch,xLabelData ,yBatch1, yBatch2]
                        }
                        function initMapArea(){
                            var [xBatch,xLabelData ,qBatch, t2Batch] = heatMapParameter(rectArray, horizenEX)
                            sliderG.selectAll(".heatMapG").data(rectPosition)
                                    .join("g")
                                    .attr("class", "heatMapG")
                                    .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`)
                                    .call( g => g.selectAll("g")
                                        .data((d, i) => horizenEX[i])
                                        .join("g")
                                        .attr("opacity", (d, i) => barVisObject[d[0].indexName] ? opacityCache(d, i) : 0)
                                        .attr("class", "heatMapElement")
                                        .attr("transform", (d, i) =>`translate(${[0, yScale(i) + maxHeight]})`)
                                            .call(g => g.selectAll(".mapQ")
                                                .data(d => d).join("rect")
                                                .attr("fill", d => lc[d.process])
                                                .attr("class", "mapQ")
                                                .attr("y", d => -qBatch(d.Q))
                                                .attr("height", d => qBatch(d.Q))
                                                .attr("width", (d, i) => xLabelData[d.i][i])
                                                .attr("x", (d, i) => xBatch[d.i](d.time) - xLabelData[d.i][i]/2))
                                            .call(g => g.selectAll(".mapT2")
                                                .data(d => d).join("rect")
                                                .attr("fill", d => lc[d.process])
                                                .attr("class", "mapT2")
                                                .attr("y", d => -t2Batch(d.T2) - maxHeight/2)
                                                .attr("height", d => t2Batch(d.T2))
                                                .attr("width", (d, i) => xLabelData[d.i][i])
                                                .attr("x", (d, i) => xBatch[d.i](d.time) - xLabelData[d.i][i]/2)))
                        }

                }
                _renderWheelContent() {
                    const contentG = this._g.append("g").attr("class", "contentG"),
                        r = this._radius,
                        lc = this._labelcolor,
                        limit = this._labelLimit,
                        a = this._padAngle,
                        xpad = this._xpad,
                        v = (this._dayRadian-Math.PI)/2,
                        iconwhite = [heatwhite , rollwhite , coolwhite],
                        piearc = d3.arc()
                            .innerRadius(0)
                            .outerRadius(r.bubble * 0.12),
                        graph = {nodes:[],links:[]},
                        wm = this,
                        wheel = this._container,
                        processData = d3.group(this._chartData, d => d.month);
                    const sample = this._sort(this._chartData);
                        this._allIndex = d3.map(sample, d => d.indexName);
                    var processClass = value => d => value + d.month,
                        indexId = value => d => value + d.indexName,

                        //河流图节点
                        circleColor = d => d3.color(lc[d.month]).darker(0.2),
                        strokeColor = d => d3.color(lc[d.month]).darker(1),

                        //index line
                        lineStroke = d => (wm._allIndex.indexOf(d.date) !== -1) ? d3.color(lc[d.month]).darker(2) : d3.color(lc[d.month]).darker(0.6),
                        lineStrokeWidth = this._outrate(this._leadlineStyle.highlight_strwidth, this._leadlineStyle.original_strwidth),
                        
                        //index rect
                        pathStroke = d => d3.color(lc[d.month]).darker(0.6),
                        pathFill = d => lc[d.month];
                    const padIndex = [...processData.keys()];//[0, 1, 2] or [0, 2];
                    const scatterG = this._g
                        .append("g")
                        .attr("class", "scatterG");
                    
                    scatterG
                        .selectAll("g").data(padIndex).join("g").selectAll("g")
                            .data(d => processData.get(d))
                            .join("g")
                            .attr("transform", d => `rotate(${(xpad[d.month](d.date) + v) * 180 / Math.PI - 180 })`)
                            .call(g => g.append("circle")
                                .attr("class", processClass("circle_color"))
                                .attr('id', indexId('circle'))
                                .attr("fill", circleColor)
                                .attr("stroke", strokeColor)
                                .attr("stroke-width", 0.5)
                                .attr("stroke-opacity", 1)
                                .attr("cy", d => this._y(d.avg))
                                .attr("r", this._outrate(this._circleStyle.highlight_r, this._circleStyle.original_r)))
                            .call(g => g.append("line")     //line1
                                .attr("class" , d => "leadline"+ d.month +" line" + d.indexName +" "+"linecurve")
                                .attr("id" , indexId("linecurve"))
                                .style("visibility", wm._merge ? "hidden" : this._outrate("visible" , "hidden" ))
                                .attr("y1",r.inner*0.8 )
                                .attr("y2", d => this._y(d.avg) - 2)
                                .attr("stroke", lineStroke)
                                .attr("stroke-width", lineStrokeWidth)
                                .attr("opacity", this._leadlineStyle.opacity))
                            .call(g => g.append("line")     //line2
                                .attr("class" , d => "leadline"+ d.month +" line" + d.indexName +" "+"linestart")
                                .attr("id" , indexId("linestart"))
                                .attr("y1", d => this._y(d.avg)+2)
                                .attr("y2", r.outer)
                                .attr("stroke", lineStroke)
                                .attr("stroke-width", lineStrokeWidth)
                                .attr("opacity", this._leadlineStyle.opacity))
                            .call(g => g.append("line")
                                .attr("class" , d => "leadline"+ d.month +" line" + d.indexName)
                                .attr("y1", d => this._h(d.humidity))
                                .attr("y2", d => r.outer+r.bubble*1.10-this._hb(d.precipitation))
                                .attr("stroke", lineStroke)
                                .attr("stroke-width", lineStrokeWidth)
                                .attr("opacity", this._leadlineStyle.opacity))
                            .call(g => g.append("path")
                                .attr("class", processClass("humidity"))
                                .attr('id', indexId('humidity'))
                                .attr("fill", pathFill)
                                .attr("stroke", pathStroke)
                                .attr("d", d => this._linepad(r.outer, this._h(d.humidity))))
                            .call(g => g.append("path")
                                .attr("class", processClass("precipitation"))
                                .attr('id', indexId('precipitation'))
                                .attr("fill", pathFill)
                                .attr("stroke", pathStroke)
                                .attr("d", d => this._linepad(r.outer+r.bubble*1.10-this._hb(d.precipitation) , r.outer+r.bubble*1.10)))
                    
                    const iconG = contentG.append("g")
                            .attr("class", "iconG"),
                        proIcon = [heaticon , rollicon , coolicon],
                        lcFunc = d => lc[d],
                        lcBorderFunc =  d => d3.color(lc[d]).darker(1),
                        lineColorFunc =  d => d3.color(lc[d]).darker(1);
                    initIconG()
                    function initIconG(){
                        iconG.selectAll("g")
                            .data([0, 1, 2])
                            .join("g")
                            .call(g => g.append("image")
                                .attr("class", "icon")
                                .attr("id", d => `icon${d}`)
                                .attr("transform", (d , i) => `rotate(${(wm._padAngle[i][0] + wm._padAngle[i][1])/2 * 180 / Math.PI - 5.8})`)
                                .style("visibility", (d , i) => processData.get(i) ? "visible" : "hidden")
                                .attr("y",-r.inner*0.97)
                                .attr("href", (d , i) => proIcon[i]))

                    }

                    initRiverG()
                    function initRiverG(){
                        contentG.selectAll(".riverG")
                            .data(padIndex)
                            .join("g")
                            .attr("class", "riverG")
                            .call(g => g.append("path")     //河流图内层
                                .attr("fill", lcFunc)
                                .attr("class" , d => `innerRiver${d}`)
                                .attr("fill-opacity", 0.8)
                                .attr("d", d => d3.areaRadial()
                                    .curve(d3.curveCardinal)
                                    .angle(e => xpad[d](e.date) + v)
                                    .innerRadius(e => wm._y(e.low))
                                    .outerRadius(e => wm._y(e.high))(processData.get(d))))
                            .call(g => g.append("path")     //河流图外层
                                .attr("fill", lcFunc)
                                .attr("class", d => `outerRiver${d}`)
                                .attr("fill-opacity", 0.4)
                                .attr("d", d => d3.areaRadial()
                                    .curve(d3.curveCardinal)
                                    .angle(e => xpad[d](e.date) + v)
                                    .innerRadius(e => wm._y(e.elow))
                                    .outerRadius(e => wm._y(e.ehigh))(processData.get(d))))
                            .call(g => g.append("path")      //河流线
                                .attr("fill", "none")
                                .attr("class" , d => `riline${d}`)
                                .attr("stroke", lineColorFunc)
                                .attr("stroke-width", 1)
                                .attr("d", d => d3.lineRadial()
                                    .curve(d3.curveLinear)
                                    .angle(e => xpad[d](e.date) + v)
                                    .radius(e => wm._y(e.avg))(processData.get(d))))
                            .call(g => g.append("line")      //扇形左边界
                                .attr("y1", r.inner)
                                .attr("y2", r.outer)
                                .attr("stroke", lcBorderFunc)
                                .attr("stroke-width", 0.5)
                                .attr("transform", d => `rotate(${a[d][0]* 180 / Math.PI - 180})`))
                            .call(g => g.append("line")     //扇形右边界
                                .attr("y1", r.inner)
                                .attr("y2", r.outer)
                                .attr("stroke", lcBorderFunc)
                                .attr("stroke-width", 0.5)
                                .attr("transform", d => `rotate(${a[d][1]* 180 / Math.PI - 180})`))
                            // .call(g => g.append("path") //河流图边框
                            //     .attr("d", d => d3.arc()
                            //         .startAngle(a[d][0])
                            //         .endAngle(a[d][1])
                            //         .innerRadius(r.outer)
                            //         .outerRadius(r.outer+r.bubble*1.1+0.25)
                            //     )
                            //     .attr("stroke", lcBorderFunc)
                            //     .attr("fill","none")
                            //     .attr("stroke-width", 0.5))
                    }

                    const outerArcG = contentG.append("g")
                            .attr("class", "outerArcG"),
                        outerTextG = contentG.append("g")
                            .attr("class", "outerTextG"),
                        pieAngle = d3.pie()
                            .value(d => d.angle)
                            .startAngle(0.5* Math.PI)
                            .endAngle(2.5 * Math.PI);
                    if(!this._merge){
                        initOuterArcG();
                        initOuterTextG();
                    }
                    function initOuterArcG(){
                        outerArcG.selectAll("g")
                            .data(wm._chartData)
                                .join("g")
                                .attr("transform", d => `rotate(${(xpad[d.month](d.indexName) + v) * 180 / Math.PI - 180 }) translate(${[0,r.outer+r.bubble*1.38]})`)
                                .attr("visibility", d => sample.findIndex(e => e.indexName===d.indexName) < 9 && sample.findIndex(e => e.indexName===d.indexName) !== -1 ? "visible" : "hidden")
                                .attr("class", d => `piePath${d.indexName}`)
                                .call(g => g.selectAll("path").data(d => pieAngle(d.property))
                                    .join("path")
                                    .attr("d", piearc)
                                    .attr("class", d => `arcpie`+ d.data.process)
                                    .attr("fill", d => ((+d.data.value) > limit? lc[+d.data.process] : "white"))
                                    .style("stroke", d => d3.color(lc[+d.data.process]).darker(2))
                                    .style('stroke-width', 0.25))
                    }
                    function initOuterTextG(){
                        outerTextG.selectAll("g")
                            .data(wm._chartData)
                                .join("text")
                                .attr("transform", d => `rotate(${(xpad[d.month](d.indexName) + 1.5*v) * 180 / Math.PI - 180 }) translate(${[0,r.outer+r.bubble*1.46]})`)
                                .attr("visibility", d => sample.findIndex(e => e.indexName===d.indexName) < 9 && sample.findIndex(e => e.indexName===d.indexName) !== -1 ? "visible" : "hidden")
                                .attr("class", processClass("arctext"))
                                .attr("id", indexId("arctext"))
                                .attr("fill", d =>  d3.color(lc[d.month]).darker(1.5))
                                .attr("font-weight", "bold")
                                .text(d => sample.findIndex(e=> e.indexName===d.indexName) + 1)
                    }

                    for (let key in xpad){
                        const processdata = processData.get(+key), 
                        lck = lc[key],
                        daker = d3.color(lck).darker(0.6),
                        darkerborder = d3.color(lck).darker(2);
                        if(processdata === undefined) continue                 
                        const arc=d3.arc()
                            .startAngle(a[key][0])
                            .endAngle(a[key][1]);
                        contentG
                        .call(g => g.append("path")
                                .attr("d", arc
                                    .innerRadius(r.outer)
                                    .outerRadius(r.outer+r.bubble*1.1+0.25)
                                )
                                .attr("stroke", darkerborder)
                                .attr("fill","none")
                                .attr("stroke-width", 0.5))
                        .call(g => g.append("path")     //内层circle
                            .attr("d", arc
                                .innerRadius(r.inner*0.8)
                                .outerRadius(r.inner)
                            )
                            .attr("id", "process"+key)
                            .attr("class", "processPath")
                            .attr("stroke", d3.color(lck).darker(2))
                            .attr("fill",lck)
                            .attr("stroke-width", 0.5)
                            .attr("opacity", 0.6)
                            .on("mouseover", (e, d) => {
                                this._hightlightcss()
                                wheel.selectAll(".riline" + key)
                                    .attr("opacity", 1)
                                wheel.selectAll(".clead"+key )
                                    .attr("opacity", wm._cleadStyle.opacity)
                                wheel.selectAll(".innerRiver"+key)
                                    .attr("opacity", 0.8)
                                wheel.selectAll(".outerRiver"+key)
                                    .attr("opacity", 0.4)
                                wheel.selectAll("#process"+key)
                                    .attr("fill",d3.color(lck).darker(0.2))
                                    .attr("opacity" , 0.6)
                                wheel.selectAll("#circle"+key)
                                    .attr("stroke" , "white")
                                wheel.selectAll("#icon"+key)
                                    .attr("href", iconwhite[key])
                                wheel.selectAll(".circle_color"+key)
                                    .attr("r", wm._outrate(wm._circleStyle.highlight_r , wm._circleStyle.original_r))
                                    .attr("opacity", 1);
                                wheel.selectAll(".precipitation"+key)
                                    .attr("stroke", wm._outrate(d3.color(lck).darker(1.6), daker))
                                    .attr("opacity", 1)
                                wheel.selectAll(".humidity"+key)
                                    .attr("stroke", wm._outrate(d3.color(lck).darker(1.6), daker))
                                    .attr("opacity", 1)
                                wheel.selectAll(".lead" + key )
                                    .attr("stroke-width", wm._outrate(wm._leadlineStyle.highlight_strwidth, wm._leadlineStyle.original_strwidth))
                                    .attr("opacity", wm._leadlineStyle.opacity)
                                wheel.selectAll(".linestart")
                                    .attr("y1", d => this._y(d.avg) + wm._outrate(wm._leadlineStyle.highlight_strwidth, wm._leadlineStyle.original_strwidth)(d))
                                wheel.selectAll(".linecurve")
                                    .attr("y2", d => this._y(d.avg) - wm._outrate(wm._leadlineStyle.highlight_strwidth, wm._leadlineStyle.original_strwidth)(d))
                                wheel.selectAll(".arcpie"+key).selectAll("path")
                                    .attr("opacity", 1)
                                    .style('stroke-width', 0.5)
                                wheel.selectAll(".arctext"+key)
                                    .attr("opacity", 1)
                                    .attr("fill", d3.color(lck).darker(4))
                                d3.select(".iconG").raise()
                            })
                            .on("mouseleave", (e, d) => {
                                this._initcss()
                                wheel.selectAll("#process" + key)
                                    .attr("fill",lck)
                                wheel.selectAll("#circle"+key)
                                    .attr("stroke" , daker)
                                wheel.selectAll("#icon"+key)
                                    .attr("href", proIcon[key])
                                wheel.selectAll(".circle_color"+key)
                                        .attr("r", this._leadlineStyle.original_strwidth);
                                wheel.selectAll(".precipitation"+key)
                                    .attr("stroke",daker)
                                wheel.selectAll(".humidity"+key)
                                    .attr("stroke",daker)
                                wheel.selectAll(".lead"+key)
                                    .attr("stroke-width", wm._outrate(1,0.5))
                                wheel.selectAll(".linestart")
                                    .attr("y1", d =>  this._y(d.avg)+2)
                                wheel.selectAll(".linecurve")
                                    .attr("y2", d =>  this._y(d.avg)-2)
                                wheel.selectAll(".arcpie"+key)
                                    .style('stroke-width', 0.25)
                                wheel.selectAll(".arctext"+key)
                                    .attr("fill", d3.color(lck).darker(1.5))
                            }))
                    }
                    const overlayG = this._g.append("g")
                            .attr("class", "overlayG");
                    
                    function initInnerOverlay(){
                        overlayG.selectAll(" .visoverlay")
                            .data(wm._chartData)
                            .join("g")
                            .attr("class", "visoverlay")
                            .attr("transform", d => `rotate(${xpad[d.month](d.indexName) * 180 / Math.PI - 180})`) // rad 2 deg - 180 -> rotate back to 12 o'clock                
                            .call(g => g.append("path")
                                .attr("d", wm._line(r.inner, r.max)))
                                .on("mouseenter", (e, d) => {
                                    wm._insertInfo(e, d);
                                    wm._hightlightcss()
                                    wm._axisenter(d.indexName, d.month, true);                               
                                })
                                .on("mouseleave", (e, d) => {
                                    wm._initcss()
                                    wm._axisout(d.indexName, d.month, true);
                                });
                    }
                    initInnerOverlay()
                    contentG.raise()
                    for (let item in sample){
                        let index = chorddata['label'].indexOf(sample[item].indexName),targets=[],id=sample[item].indexName;
                        for (let target =item+1;target < sample.length ;target++){
                            if(chorddata['corr'][item][target] > vm.corrSize&&chorddata['corr'][item][target]>0){
                                if(sample[item].month == sample[target].month){
                                    targets.push(sample[target].indexName)
                                    graph.links.push({'source':id,'target':sample[target].indexName,value:1})
                                }
                            }
                        }
                        graph.nodes.push({'id':id,'group': sample[item].month,'targets':targets})
                    }
                    const nodeG = this._g.append("g")
                            .attr("transform",`rotate(${-60})`)
                            .attr("class", "nodeG"),
                        tree = d3.cluster()
                            .size([2 * Math.PI, r.inner*0.8]),
                        clusterLine = d3.lineRadial()
                            .curve(d3.curveBundle.beta(vm.curveSize))   //d3.curveNatural
                            .radius(d => d.y)
                            .angle(d => d.x),
                        {nodes, links} = graph,
                        groupById = new Map,
                        nodeById = new Map(nodes.map(node => [node.id, node])),
                        colornone = "#ccc";

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
                    const node = nodeG.append("g")
                        .selectAll("g")
                        .data(root.leaves())
                        .join("g")
                            .attr("transform", d => {
                                d.x=xpad[+d.data.group](d.data.id) + v +1/3*(Math.PI);
                                return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`
                                })
                        .call(g =>g.append("path")
                            .attr("transform", d => `translate(${-d.y},0)  rotate(${-90-v* 180 / Math.PI})`)
                            .attr("fill", "white")
                            .attr("opacity", 0)
                            .attr("d", this._line(r.inner*0.8, r.max)))
                            .on("mouseenter", overed)
                            .on("mouseout", outed)
                    const labelcol=(d , i) => d3.color(lc[+d[0].data.group]).darker(0.6);
                    const linedata=root.leaves().flatMap(leaf => leaf.outgoing);
                    const link = nodeG.append("g")
                        .attr("stroke", colornone)
                        .attr("fill", "none")
                        .selectAll("path")
                        .data(linedata)
                        .join("path")
                            .attr("d", ([i, o]) => clusterLine(i.path(o)))
                            .each(function(d) { d.path = this; })
                            .attr("class",d=>{
                                return "clead"+ (+d[0].data.group) + " clinein"+d[0].data.id +" clineout"+d[1].data.id
                            })
                            .attr("stroke",  labelcol)
                            .attr("stroke-width", this._cleadStyle["stroke-width"])
                            .attr("opacity", this._cleadStyle.opacity)
                    function overed(e, d){
                        const name=d.data.id,key=d.data.group;
                        const data=wm._chartData.filter(d => d.indexName===name)[0];
                        wm._hightlightcss()
                        wm._axisenter(name, key, true);
                        let rlines=multiplyaxis(name)
                        for (let index of rlines){
                            wm._axisenter(index, key, false);
                        }
                        wm._insertInfo(e, data)
                    }

                    function outed(event, d) {
                        const name = d.data.id,key=d.data.group;
                        wm._initcss()
                        wm._axisout(name, key, true);
                        let rlines=multiplyaxis(name)
                        for (let index of rlines){
                            wm._axisout(index, key, false);
                        }
                    }
                    function multiplyaxis(name){
                        var target=[]
                        for (let item of root.leaves()){
                            if(item.data.id===name){
                                target=item.data.targets
                            }
                        }
                        for (let item of linedata){
                            if(item[1].data.id===name){
                                target.push(item[0].data.id)
                            }
                        }
                        return [...new Set(target)]
                    }
                }

                _axisenter(name, key, flag){
                    const cG = this._container,
                        wm = this,
                        lck =  this._labelcolor[key],
                        daker = d3.color(lck).darker(0.6);
                    cG.selectAll(".riline"+key)
                            .attr("opacity",1)
                    cG.selectAll(".innerRiver"+key)
                            .attr("opacity", 0.8)
                    cG.selectAll(".outerRiver"+key)
                        .attr("opacity", 0.4)
                    cG.selectAll("#process" + key)
                            .attr("opacity" , 0.6)
                    cG.select("#circle"+name)
                            .attr("r", this._circleStyle.highlight_r)
                            .attr("opacity", 1);
                    cG.select("#precipitation"+name)
                        .attr("stroke", wm._outrate(d3.color(lck).darker(1.6), daker))
                        .attr("opacity", 1)
                    cG.select("#humidity"+name)
                        .attr("stroke", wm._outrate(d3.color(lck).darker(1.6), daker))
                        .attr("opacity", 1)
                    cG.selectAll(".line"+name)
                        .attr("stroke",d3.color(lck).darker(4))
                    cG.selectAll(".line" + name)
                        .attr("stroke-width", 1.5)
                        .attr("opacity", 0.4)
                    cG.selectAll("#linestart"+ name)
                        .attr("y1", d => wm._y(d.avg) + this._circleStyle.highlight_r)
                    cG.selectAll("#linecurve" + name)
                        .attr("y2", d => wm._y(d.avg) - this._circleStyle.highlight_r)
                    cG.selectAll(".piePath"+ name).selectAll("path")
                        .style('stroke-width', 0.5)
                        .attr("opacity", 1)
                    cG.selectAll("#arctext"+name)
                            .attr("opacity", 1)
                            .attr("fill", d3.color(lck).darker(4))
                    if(flag){
                        cG.selectAll(".clinein" + name)
                            .attr("opacity", this._cleadStyle.opacity)
                        cG.selectAll(".clineout" + name)
                            .attr("opacity", this._cleadStyle.opacity)
                    }
                }

                _axisout(name, key, flag){
                    const cG = this._container,
                        // wm = this,
                        lck =  this._labelcolor[key],
                        daker = d3.color(lck).darker(0.6);
                    cG.select("#circle"+name)
                        .attr("r", this._circleStyle.original_r);
                    cG.select("#precipitation"+name)
                        .attr("stroke", daker)
                    cG.select("#humidity"+name)
                        .attr("stroke", daker)
                    cG.selectAll(".line"+name)
                        .attr("stroke", daker)        
                    cG.selectAll(".line" + name)
                        .attr("stroke-width", this._outrate(this._leadlineStyle.highlight_strwidth, this._leadlineStyle.original_strwidth))
                    cG.selectAll("#linestart"+ name)
                        .attr("y1", d =>  this._y(d.avg) + this._circleStyle.original_r)
                    cG.selectAll("#linecurve" + name)
                        .attr("y2", d =>  this._y(d.avg)- this._circleStyle.original_r)
                    cG.selectAll(".piePath"+ name).selectAll("path")
                        .style('stroke-width', 0.25)
                    cG.selectAll("#arctext"+name)
                        .attr("fill", d3.color(lck).darker(1.5))
                    cG.selectAll(".dailyInfo").remove()
                    if(flag){
                        cG.selectAll(".clineout" + name)
                            .attr("opacity",0.4)
                            .attr("stroke", daker).raise()
                        cG.selectAll(".clinein" + name)
                                .attr("opacity",0.4)
                    }
                }
                _initcss(){
                    const cG = this._container;
                    for (let i in [0,1,2]){
                        cG.selectAll(".leadline"+i )
                            .attr("opacity", this._leadlineStyle.opacity)
                        cG.selectAll(`.clead${i}`)
                            .attr("opacity", this._cleadStyle.opacity)
                        cG.selectAll(".humidity"+i)
                            .attr("opacity", 1)
                        cG.selectAll(".precipitation"+i)
                            .attr("opacity", 1)
                        cG.selectAll(".circle_color"+i)
                            .attr("opacity", 1)
                        cG.selectAll(".arcpie"+i)
                            .attr("opacity", 1)
                        cG.selectAll(".arctext"+i)
                            .attr("opacity", 1)
                        cG.selectAll(".innerRiver"+i)
                            .attr("opacity", 0.8)
                        cG.selectAll(".outerRiver"+i)
                            .attr("opacity", 0.4)
                    }
                    cG.selectAll(".processPath")
                        .attr("opacity" , 0.6)
                }
                _hightlightcss(){
                    const cG = this._container;
                    for (let i in [0,1,2]){
                        cG.selectAll(".riline" + i)
                            .attr("opacity", 0.4)
                        cG.selectAll(".leadline" + i )
                            .attr("opacity", 0.1)
                        cG.selectAll(".clead" + i )
                            .attr("opacity", 0.1)
                        cG.selectAll(".humidity" + i)
                            .attr("opacity", 0.5)
                        cG.selectAll(".precipitation" + i)
                            .attr("opacity", 0.5)
                        cG.selectAll(".circle_color" + i)
                            .attr("opacity", 0.5)
                        cG.selectAll(".arcpie" + i)
                            .attr("opacity", 0.5)
                        cG.selectAll(".arctext" + i)
                            .attr("opacity", 0.5)
                        cG.selectAll(".innerRiver" + i)
                            .attr("opacity", 0.4)
                        cG.selectAll(".outerRiver" + i)
                            .attr("opacity", 0.1)
                    }
                    cG.selectAll(".processPath")
                        .attr("opacity" , 0.3)
                }

                _insertInfo(e, d){
                    const t = this._texts,
                        lck = this._labelcolor[d.month];
                    let x=  e.offsetX + this._g.node().getBBox().x,
                        y=  e.offsetY + this._g.node().getBBox().y;
                    x*y>0 ? (x<0 ? (x=x-40,y=y-40):(x=x+20,y=y+40)) :(x<0 ? (x=x-40,y=y+40):(x=x+40,y=y-60));
                    this._dailyInfo = this._g.append("g")
                        // .style("visibility", "hidden")
                        .attr("transform", `translate(${[x,y]})`)
                        .attr("class","dailyInfo")
                        .attr("font-size", "7pt")
                        .style("font-family", "DIN")
                        .style("font-weight", "normal")
                        .call(g => g.append("rect")
                                .attr("x" , -10)
                                .attr("y" , -15)
                                .attr("rx" , 5)
                                .attr("ry", 5)
                                .style("fill",d3.color(lck).brighter(0.2))
                                .attr("stroke", "grey")
                                .attr("stroke-width",1)
                                .attr("width", 165)
                                .attr("opacity" ,0.5)
                                .attr("filter","url(#filter)")
                                .attr("height", 95))
                        .call(g => g.append("g")                       
                            .call(g => t.name = g.append("text").attr("fill", "black").text("Date: "))
                            .call(g =>  g.append("line").attr("x1",-1).attr("x2", 130).style("stroke", d3.color(lck).darker(4)).attr("y1", 2).attr("y2", 2).style("stroke-width", 0.5))
                            .call(g => t.avg = g.append("text").attr("y", "1.3em").attr("fill", "black").text("Avg: ")) 
                            .call(g => t.deviation = g.append("text").attr("y", "2.6em").attr("fill", "black").text("Deviation: ")))
                            .call(g => t.high = g.append("text").attr("y", "3.9em").attr("fill", "black").text("High: "))
                            .call(g => t.low = g.append("text").attr("y", "5.2em").attr("fill", "black").text("Low: "))
                            .call(g => t.prec = g.append("text").attr("y", "6.5em").attr("fill", "black").text("Prec.: "))
                            .call(g =>  g.append("line").attr("x1",-1).attr("x2", 135).style("stroke", d3.color(lck).darker(4)).attr("y1", 2+4*12.4).attr("y2", 2+4*12.4).style("stroke-width", 0.5))
                            .call(g => t.humidity = g.append("text").attr("y", "7.8em").attr("fill", "black").text("Humidity: "))
                    t.name.text(`Index: ${d.indexName}`);
                    t.avg.text(`Value: ${d.avg.toFixed(3)}`)
                    t.deviation.text(`Deviation: ${d.deviation.toFixed(3)}`)
                    t.high.text(`High: ${d.high.toFixed(3)}`);
                    t.low.text(`Low: ${d.low.toFixed(3)}`);
                    t.prec.text(`SPE.: ${d.precipitation.toFixed(3)}`);
                    t.humidity.text(`T^2: ${d.humidity.toFixed(3)}`);
                }
                _sort(data){
                    let speSort = d3.sort(data,d=> d.precipitation),
                        T2Sort = d3.sort(data,d=> d.humidity);
                    var sortdata = data.filter(d =>{
                        return (d3.map(speSort, e=> e.indexName).indexOf(d.indexName)<= vm.multiPara || d3.map(T2Sort, e=> e.indexName).indexOf(d.indexName)<= vm.multiPara) && d.deviation !==0
                    })
                    var SPE=d3.sort(sortdata,d=> -d.precipitation),
                        T2=d3.sort(sortdata,d=> -d.humidity),
                        res=d3.sort(sortdata,d=> -d.deviation);
                    for (let item in SPE){
                        let query=SPE[item].indexName                     
                        SPE[item].order=+item+1+(+T2.findIndex((value)=> value.indexName===query))+1+(+res.findIndex((value)=> value.indexName===query))+1
                    }
                    return d3.sort(SPE,d=> d.order);
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
                        .range(["#b9c6cd", "#e3ad92"])
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
                        .endAngle(this._dayRadian)();
                }
                _linepad(y1, y2) {
                    return d3.arc()
                        .innerRadius(y1)
                        .outerRadius(y2)
                        .startAngle(Math.PI)
                        .padAngle((this._dayRadian - Math.PI)/this._linespace)
                        .endAngle(this._dayRadian)();
                }

                _outrate(item1 , item2){
                    return d => (this._allIndex.indexOf(d.indexName) !== -1 && this._allIndex.indexOf(d.indexName) < 9) ? item1 : item2
                }

                _sliderArray(arr){
                    return d3.map(arr, (d, f) => {
                        d.index = f;
                        // console.log(batchData);
                        var name = d.indexName,
                        
                        batch = batchData.map(e => {
                            let s = {},
                            i = e.INDEX.indexOf(name);
                            s.time = new Date(e.toc),
                            s.Q = e.CONTQ[i],
                            s.T2 = e.CONTJ[i],
                            s.self = e.upid == vm.upid ? true : false ,
                            s.h = e.u[i],
                            s.l = e.l[i],
                            s.exh = e.extremum_u[i],
                            s.exl = e.extremum_l[i],
                            s.upid = e.upid, 
                            s.value = e.value[i],
                            s.indexName = name,
                            s.process = this.getIndex(name),
                            s.ovalue = e.original_value[i],
                            s.max = Math.max(s.h, s.l, s.value),
                            s.min = Math.min(s.h, s.l, s.value),
                            s.over = s.h >= s.value && s.value >= s.l ? 0 : (s.h >= s.value ? s.value - s.l : s.h - s.value);
                            s.d = f
                            return s
                        })
                        batch.d = f;
                        return batch
                    })
                }
                _getMonthData(month) {
                    return this._chartData.filter(d => d.month === month);
                }
            }
            const wheel = new wheelRound(this.svg)
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
            "corrSize",
            "multiPara",
            "curveSize",
            "trainBorder"
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
        }
    }
}
</script>

<style lang="scss" scoped>
@import url("../../assets/marey/wheel.scss");
</style>