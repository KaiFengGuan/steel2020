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
                        date: "name",
                        low: "result_low",
                        high: "result_high",
                        elow: "result_extre_low",
                        ehigh: "result_extre_high",
                        avg: "result_value",
                        precipitation: "PCASPE",
                        humidity: "PCAT2",
                        condition: "Conditions"
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
                        date: null,
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
                    this._merge = true;
                    this._horizonView = true;
                    this._indexdata = [];
                    this._indexInfo = [];
                    this._indexlength = 6;
                    this._allIndex = [];    //index name
                    this._rectArray = null;
                    this._indexScale = undefined;
                    this._mouseDis  = undefined;
                    this._barVis = true;
                }
                getIndex(_){
                    for (let item in this._process){
                        if(this._process[item].indexOf(_)!==-1){
                            return item
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
                            indexName: d[field.date],
                            date: d[field.date],
                            month: wm.getIndex(d[field.date]),
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
                        datum.property[2].value=e.avg>e.low&e.high>e.avg? 0 : 1.6;
                        let deviation=e.avg>e.low&e.high>e.avg? 0 : (e.avg<e.low ? (e.low-e.avg)/e.low : (e.avg-e.high)/e.high);
                        datum.deviation=deviation;
                        wm._padprocess[wm.getIndex(d[field.date])].push(d[field.date])
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
                    const wm=this,limit = 0.5;
                    const labels=[],lows = [], highs = [], precs = [], humis = [];
                    const field = this._field;
                    this._chartData = this._data.map(d => {
                        const datum = {
                            indexName: d[field.date],
                            date: d[field.date],
                            month: wm.getIndex(d[field.date]),
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
                    this._indexInfo = this._indexdata;
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
                    var limit = 0.3,
                        RectWidth = 400,
                        rectX = r.outer+r.bubble* 5.4,  //rect_doct x
                        maxHeight = 25,   //rect max height
                        rectPadding = {left: 5, right: 5, top: 5, bottom: 5},
                        indexSpace = 5,
                        iconWidth = 20,
                        totalHeight = (this._barVis ? 2 : 1) * maxHeight,
                        rectNum = Math.floor((this._height - 50)/(totalHeight + indexSpace)),
                        selectInfo = this._indexInfo.slice(0, this._indexInfo.length > rectNum ? rectNum : this._indexInfo.length),
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
                        renderyAxis()
                        var lineG = mainG.append("g").attr("class", "lineG"),
                            arcG = mainG.append("g").attr("class", "arcG");
                        initLineG();
                        initArcG();
                        var sliderG = mainG.append("g")
                            .attr("class", "sliderG")
                            .attr("transform", `translate(${[rectX, 0]})`),
                            maxLength = 3,  //batch numbers
                            minRect = RectWidth/ (maxLength + 0.5),
                            rectArray = this._rectArray ? this._rectArray : new Array(maxLength).fill(minRect).map((d, i) => Math.ceil(maxLength/2) == i + 1 ? 1.5 * d : d),   //batch position
                            rectPosition = Array.from(d3.cumsum(rectArray));
                            this._rectArray = rectArray;
                        initDragG();
                        var sliderData = this._sliderArray(selectInfo),
                            horizenEX = (new Array(maxLength).fill(0))
                            .map((d, i) => wm._deepCopy(sliderData).map((e, f) =>{ 
                                    var temp = e.map(f => {
                                        f.i = i;
                                        return f
                                    })
                                    temp.i = i;
                                    temp.d = f;
                                    return temp
                                }
                            )),
                            overlap = 3,    //horizen layer
                            overlapNum = [-1, -2, -3, 0, 1, 2],
                            overHeight = [-3 , -2 , -1, 1, 2 , 3].map(d => d * maxHeight),
                            horizenColor = i => {
                                return ["#e34649", "#f7a8a9", "#fcdcdc", "#f7f7f7", "#fcdcdc","#f7a8a9", "#e34649"][i + (i >= 0) + overlap]
                            },
                            timeScale;
                            //https://observablehq.com/d/d503153fbfd48b03

                        wm._horizonView ? initMergeArea() : initHorizenArea();
                        if(this._rectArray.some(d => d === maxHeight))renderRectG()
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
                        function renderyAxis(){
                            let invert = d3.scaleOrdinal().domain(indexScale.range()).range(indexScale.domain())
                            rectHeight = indexArray.map(d => (barVisObject[indexSort[invert(+d)]] ? 2 : 1 )* maxHeight + indexSpace)
                            rectHeight.unshift(0)   //定位第一个元素
                            yScaleCache = Array.from(d3.cumsum(rectHeight)).map(d => -wm._height/2 + 2 * maxHeight + d);
                            yScale = i => yScaleCache[indexScale(i)];
                            startXY = d => [R * (Math.sin(xpad[d.month](d.date)+ v)), -R * Math.cos(Math.abs(xpad[d.month](d.date)+ v))];
                            centerScaleY = d => startXY(d)[1] + 25/startXY(d)[0] * startXY(d)[1];
                            lastY = yScale(indexArray[indexArray.length - 1]);
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
                                .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight ]})`)
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
                                    // d.collapse ? removeBar(d.index) : renderSingelBar(d.index);
                                }))
                        }
                        function removeBar(){

                        }
                        function renderSingelBar(index){// render triangleG
                            // const horizenEX.
                        }
                        function initLineG(){
                            lineG.selectAll("g").data(selectInfo).join("g")
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
                                        .text((d, i) => i + 1)
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
                            wm._rectArray = rectArray;
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
                                lineG.selectAll(".lineToRect")
                                    .transition(t)
                                    .attr("d", (d, i) => line(lineToRect(d, i)))
                                if(wm._horizonView){ 
                                    sliderG.selectAll(".selectG")
                                        .transition(t)
                                        .attr("transform", (d, i) =>`translate(${[0, yScale(i)]})`)                           
                                }else{
                                    sliderG.selectAll(".hozenG")
                                        .transition(t)
                                        .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight ]})`)
                                }
                                sliderG.selectAll(".dragElement")
                                    .transition(t)
                                    .attr("transform", (d, i) =>`translate(${[0, yScale(i)]})`)
                                sliderG.selectAll(".rectg")
                                    .transition(t)
                                    .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight ]})`)
                                barG.selectAll("g")
                                    .transition(t)
                                    .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight]})`)
                                sortG.selectAll("rect")
                                    .transition(t)
                                    .attr("fill", sortChange(sortColor, "#fff"));
                                sortG.selectAll("text")
                                    .transition(t)
                                    .attr("fill", sortChange("#fff", sortColor));
                                triangleG.selectAll("g")
                                    .transition(t)
                                    .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight ]})`)
                                if(wm._mouseDis !== undefined){
                                    var mouseInfo = mouseText(wm._mouseDis);
                                    sliderG.selectAll(".textG")
                                        .transition(t)
                                        .attr("transform", d =>`translate(${[wm._mouseDis - 10, yScale(d) - maxHeight/2]})`)
                                        .text(d => (+mouseInfo[d]).toFixed(2))
                                }
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
                                    wm._container.select(".mainG").remove()
                                    wm._renderMainBar()
                                }
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
                                .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight]})`)
                                .call(g => g.append("rect")
                                    .attr("height", maxHeight)
                                    .attr("width", maxHeight)
                                    .attr("stroke", (d, i) => lc[selectInfo[i].month])
                                    .attr("fill", "none")
                                    .attr("stroke-width", 0.5))
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
                            sliderG.selectAll("textG").data(Object.keys(selectInfo)).join("text")
                                .attr("class", "textG")
                                .attr("transform", d =>`translate(${[mouseInfo ?  wm._mouseDis - 10 : 0 , yScale(d) - maxHeight/2]})`)
                                    .text(d => mouseInfo !==undefined ? (+mouseInfo[d]).toFixed(2) : "")
                                    .attr("fill", "black")
                            sliderG.on("mousemove", (e, d) => {
                                let mouseDis = e.offsetX - rectX;//mouse distance
                                if(mouseDis <= 0)return
                                sliderG.select(".mouseG")
                                    .attr("transform", (d, i) =>`translate(${[mouseDis, 0]})`)
                                    .attr("stroke", "#bbbcbd")
                                var mouseInfo = mouseText(mouseDis);
                                sliderG.selectAll(".textG")
                                    .attr("transform", d =>`translate(${[mouseDis - 10, yScale(d) -maxHeight/2]})`)
                                    .text(d => (+mouseInfo[d]).toFixed(2))
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
                                    .attr("class", "rectg")
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
                                .range([ 0, maxHeight - rectPadding.top])
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
                                        .attr("class", "selectG")
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
                                        .attr("class", "hozenG")
                                        .attr("transform", (d, i) =>`translate(${[0, yScale(i) - maxHeight ]})`)
                                            .call(g => g.append("clipPath")
                                                .attr("id", d => `${d.i}clipy${d.d}`)
                                                .append("rect")
                                                    .attr("width", d => rectArray[d.i])
                                                    .attr("class", "clipRect")
                                                    .attr("height", maxHeight))
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
                                                    .attr("transform", (d, i) => `translate(0,${(overlapNum[i] + 1) * maxHeight})`)
                                                    .attr("href", d => `#${d.i}path-def${d.d}`)))
                        }
                }
                _renderWheelContent() {
                    const r = this._radius,
                        lc = this._labelcolor,
                        limit = 0.5,
                        a = this._padAngle,
                        xpad = this._xpad,
                        v = (this._dayRadian-Math.PI)/2,
                        icon = [heaticon , rollicon , coolicon],
                        iconwhite = [heatwhite , rollwhite , coolwhite],
                        piearc = d3.arc()
                            .innerRadius(0)
                            .outerRadius(r.bubble * 0.12),
                        graph = {nodes:[],links:[]},
                        wm = this,
                        wheel = this._container,
                        processData = d3.group(this._chartData, d => d.month);
                        const sample = this._sort(this._chartData)
                        this._allIndex = d3.map(sample, d => d.date);
                        var outrate = (item1 , item2) => {
                            return d => (wm._allIndex.indexOf(d.date) !== -1) ? item1 : item2
                        },
                        className = value => d => value + d.month,
                        idName = value => d => value + d.date,

                        //河流图节点
                        circleColor = d => d3.color(lc[d.month]).darker(0.2),
                        strokeColor = d => d3.color(lc[d.month]).darker(1),

                        //index line
                        lineStroke = d => (wm._allIndex.indexOf(d.date) !== -1) ? d3.color(lc[d.month]).darker(2) : d3.color(lc[d.month]).darker(0.6),
                        lineStrokeWidth = outrate(1,0.5),
                        lineOpacity = 0.4,
                        
                        //index rect
                        pathStroke = d => d3.color(lc[d.month]).darker(0.6),
                        pathFill = d => lc[d.month];
                    const scatterG = this._g
                        .append("g")
                        .attr("class", "scatterG"),
                    iconG = this._g
                        .append("g")
                        .attr("class", "iconG");
                    scatterG
                        .selectAll("g").data(xpad).join("g").selectAll("g")
                            .data((d, i) => processData.get("" + i) !== undefined ? processData.get("" + i) : [])
                            .join("g")
                            .attr("transform", d => `rotate(${(xpad[d.month](d.date) + v) * 180 / Math.PI - 180 })`)
                            .call(g => g.append("circle")
                                .attr("class", className("circle_color"))
                                .attr('id', idName('circle'))
                                .attr("fill", circleColor)
                                .attr("stroke", strokeColor)
                                .attr("opacity", 1)
                                .attr("stroke-width", 0.5)
                                .attr("stroke-opacity", 1)
                                .attr("cy", d => this._y(d.avg))
                                .attr("r",2))
                            .call(g => g.append("line")     //line1
                                .attr("class" , d => "lead"+ d.month +" line" + d.indexName +" "+"linecurve")
                                .attr("id" , idName("linecurve"))
                                .style("visibility", wm._merge ? "hidden" : outrate("visible" , "hidden" ))
                                .attr("y1",r.inner*0.8 )
                                .attr("y2", d => this._y(d.avg)-2)
                                .attr("stroke", lineStroke)
                                .attr("stroke-width", lineStrokeWidth)
                                .attr("opacity", lineOpacity))
                            .call(g => g.append("line")     //line2
                                .attr("class" , d => "lead"+ d.month +" line" + d.indexName +" "+"linestart")
                                .attr("id" , idName("linestart"))
                                .attr("y1", d => this._y(d.avg)+2)
                                .attr("y2", r.outer)
                                .attr("stroke", lineStroke)
                                .attr("stroke-width", lineStrokeWidth)
                                .attr("opacity", lineOpacity))
                            .call(g => g.append("line")
                                .attr("class" , d => "lead"+ d.month +" line" + d.indexName)
                                .attr("y1", d => this._h(d.humidity))
                                .attr("y2", d => r.outer+r.bubble*1.10-this._hb(d.precipitation))
                                .attr("stroke", lineStroke)
                                .attr("stroke-width", lineStrokeWidth)
                                .attr("opacity", lineOpacity))
                            .call(g => g.append("line")
                                .attr("class" , d => "lead"+ d.month +" line" + d.indexName +" "+"textline")
                                .attr("id" , idName("textline"))
                                .style("visibility", wm._merge ? "hidden" : outrate("visible" , "hidden" ))
                                .attr("y1", d => r.outer+r.bubble*1.10)
                                .attr("y2", d => r.outer+r.bubble*1.10)
                                .attr("stroke", lineStroke)
                                .attr("stroke-width", lineStrokeWidth)
                                .attr("opacity", lineOpacity))
                            .call(g => g.append("path")
                                .attr("class", className("humidity"))
                                .attr('id', idName('humidity'))
                                .attr("fill", pathFill)
                                .attr("stroke", pathStroke)
                                .attr("d", d => this._linepad(r.outer, this._h(d.humidity)))
                            .call(g => g.append("path")
                                .attr("class", className("precipitation"))
                                .attr('id',idName('precipitation'))
                                .attr("fill", pathFill)
                                .attr("stroke", pathStroke)
                                .attr("d", d => this._linepad(r.outer+r.bubble*1.10-this._hb(d.precipitation) , r.outer+r.bubble*1.10))))
                    iconG.selectAll("g").data(xpad)
                        .join("image")   //icon
                        .attr("class", "icon")
                        .attr("id", (d , i) => "icon" + i)
                        .attr("transform", (d , i) => `rotate(${(this._padAngle[i][0] + this._padAngle[i][1])/2 * 180 / Math.PI - 5.8})`)
                        .style("visibility", (d , i) => processData.get("" + i) === undefined ? "hidden" : "visible")
                        .attr("y",-r.inner*0.97)
                        .attr("href", (d , i) => icon[i])

                    for (let key in xpad){
                        const processdata = processData.get(key), 
                        lck = lc[key],
                        daker = d3.color(lck).darker(0.6),
                        darkerborder = d3.color(lck).darker(2);
                        if(processdata === undefined) continue                 
                        const area = d3.areaRadial()
                            // .curve(d3.curveBasis)
                            .curve(d3.curveCardinal)
                            .angle(d => xpad[key](d.date) + v);
                        const line = d3.lineRadial()
                            .curve(d3.curveLinear)
                            .angle(d => xpad[key](d.date) + v);
                        const arc=d3.arc()
                            .startAngle(a[key][0])
                            .endAngle(a[key][1]);
                        this._g
                        .call(g => g.append("path")     //河流图内层
                                .attr("fill", lck)
                                .attr("class" , "river1"+key)
                                .attr("fill-opacity", 0.4)
                                .attr("d", area
                                    .innerRadius(d => this._y(d.low))
                                    .outerRadius(d => this._y(d.high))
                                (processdata)))
                        .call(g => g.append("path")     //河流图外层
                            .attr("fill", lck)
                            .attr("class" , "river2"+key)
                            .attr("fill-opacity", 0.8)
                            .attr("d", area
                                .innerRadius(d => this._y(d.elow))
                                .outerRadius(d => this._y(d.ehigh))
                                (processdata)))
                        .call(g => g.append("path")      //河流线
                            .attr("fill", "none")
                            .attr("class" , "riline"+key)
                            .attr("stroke", daker)
                            .attr("stroke-width", 1)
                            .attr("d", line
                                .radius(d => this._y(d.avg))
                            (processdata)))
                        .call(g => g.append("line")      //扇形左边界
                                .attr("y1", r.inner)
                                .attr("y2", r.outer)
                                .attr("stroke", darkerborder)
                                .attr("stroke-width", 0.5)
                                .attr("transform", d => `rotate(${a[key][0]* 180 / Math.PI - 180})`))
                        .call(g => g.append("line")     //扇形右边界
                                .attr("y1", r.inner)
                                .attr("y2", r.outer)
                                .attr("stroke", darkerborder)
                                .attr("stroke-width", 0.5)
                                .attr("transform", d => `rotate(${a[key][1]* 180 / Math.PI - 180})`))
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
                                wheel.selectAll(".riline"+key)
                                    .attr("opacity",1)
                                wheel.selectAll(".clead"+key )
                                    .attr("opacity", 0.4)
                                wheel.selectAll(".river1"+key)
                                    .attr("opacity",0.4)
                                wheel.selectAll(".river2"+key)
                                    .attr("opacity",0.8)
                                wheel.selectAll("#process"+key)
                                    .attr("fill",d3.color(lck).darker(0.2))
                                    .attr("opacity" , 0.6)
                                wheel.selectAll("#circle"+key)
                                    .attr("stroke" , "white")
                                wheel.selectAll("#icon"+key)
                                    .attr("href", iconwhite[key])
                                wheel.selectAll(".circle_color"+key)
                                    .attr("r",outrate (3.5 , 2))
                                    .attr("opacity", 1);
                                wheel.selectAll(".precipitation"+key)
                                    .attr("stroke",d => (wm._allIndex.indexOf(d.indexName) !== -1) ? d3.color(lck).darker(1.6) :daker)
                                    .attr("opacity", 1)
                                wheel.selectAll(".humidity"+key)
                                    .attr("stroke",d => (wm._allIndex.indexOf(d.indexName) !== -1) ? d3.color(lck).darker(1.6) :daker)
                                    .attr("opacity", 1)
                                wheel.selectAll(".lead"+key )
                                    .attr("stroke-width", outrate(1.5,0.5))
                                    .attr("opacity", 0.4)
                                wheel.selectAll(".linestart")
                                    .attr("y1", d => (wm._allIndex.indexOf(d.indexName) !== -1) ? this._y(d.avg)+3.5 : this._y(d.avg)+2)
                                wheel.selectAll(".linecurve")
                                    .attr("y2", d => (wm._allIndex.indexOf(d.indexName) !== -1) ? this._y(d.avg)-3.5 : this._y(d.avg)-2)
                                wheel.selectAll(".arcpie"+key)
                                    .attr("opacity", 1)
                                    .style('stroke-width', 0.5)
                                wheel.selectAll(".arctext"+key)
                                    .attr("opacity", 1)
                                    .attr("fill", d3.color(lck).darker(4))
                                d3.select(".iconG").raise()
                            })
                            .on("mouseleave", (e, d) => {
                                this._initcss()
                                wheel.selectAll("#process"+key)
                                    .attr("fill",lck)
                                wheel.selectAll("#circle"+key)
                                    .attr("stroke" , daker)
                                wheel.selectAll("#icon"+key)
                                    .attr("href", icon[key])
                                wheel.selectAll(".circle_color"+key)
                                        .attr("r",2);
                                wheel.selectAll(".precipitation"+key)
                                    .attr("stroke",daker)
                                wheel.selectAll(".humidity"+key)
                                    .attr("stroke",daker)
                                wheel.selectAll(".lead"+key)
                                    .attr("stroke-width", outrate(1,0.5))
                                wheel.selectAll(".linestart")
                                    .attr("y1", d =>  this._y(d.avg)+2)
                                wheel.selectAll(".linecurve")
                                    .attr("y2", d =>  this._y(d.avg)-2)
                                wheel.selectAll(".arcpie"+key)
                                    .style('stroke-width', 0.25)
                                wheel.selectAll(".arctext"+key)
                                    .attr("fill", d3.color(lck).darker(1.5))
                            }))

                        for (let item in processdata){
                            if(wm._merge) break
                            const pindex=processdata[item];
                            if(pindex.humidity<limit&&pindex.precipitation<limit)continue
                            const thisangel=(xpad[key](pindex.date) + v) * 180 / Math.PI - 180;
                            
                            const pie = d3.pie()
                                .value(d => d.angle)
                                .startAngle(0.5* Math.PI)
                                .endAngle(2.5 * Math.PI);
                                // .startAngle(1.5* Math.PI-thisangel/180*Math.PI)
                                // .endAngle(1.5* Math.PI-thisangel/180*Math.PI + 2* Math.PI);
                            let piedata=pie(pindex.property)
                            let g=this._g.selectAll(".pie"+pindex.date)
                                .data(piedata).enter()
                                .append("g")
                                .attr("transform", `rotate(${(xpad[key](pindex.date) + v) * 180 / Math.PI - 180 }) translate(${[0,r.outer+r.bubble*1.30]})`);
                            g.append("path")
                                .attr("class", `arcpie`+key +' pie'+ pindex.date)
                                .attr("d", piearc)
                                .attr("fill", (d,i) => ((+d.data.value)>limit? lck : "white"))
                                .style("stroke", darkerborder)
                                .style('stroke-width', 0.25)
                                .attr("opacity", 1)
                            let label=(+sample.findIndex((value, index, arr)=> value.indexName===pindex.date))
                            let text=label !==-1  ? (sample.length-label) : "";
                            text= text >9 ? "" : text;
                            this._g.append("g")
                                .attr("class", `arctext`+key)
                                .attr("transform", `rotate(${(xpad[key](pindex.date) + 1.5*v) * 180 / Math.PI - 180 }) translate(${[0,r.outer+r.bubble*1.38]})`)
                            .call(g => g.append("text")     //外圈 circle
                                .attr("id", `arctext`+pindex.date)
                                .attr("fill", d3.color(lck).darker(1.5))
                                .style("font-family", "DIN")
                                .style("padding", "1px")
                                .attr("font-size", "6pt")
                                .attr("font-weight", "bold")
                                .text(text))     
                        }

                        this._g.append("g").selectAll(" .visoverlay")
                            .data(processdata)
                            .join("g")
                            .attr("class", "visoverlay")
                            .attr("transform", d => `rotate(${xpad[key](d.date) * 180 / Math.PI - 180})`) // rad 2 deg - 180 -> rotate back to 12 o'clock                
                            .call(g => g.append("path")
                                .attr("d", this._line(r.inner, r.max)))
                                .on("mouseenter", (e, d) => {
                                    insertInfo(e,lck,d);
                                    this._hightlightcss()
                                    axisenter(d.indexName,key,lck,daker,true);                                   
                                })
                                .on("mouseleave", (e, d) => {
                                    this._initcss()
                                    axisout(d.indexName,key,lck,daker,true);
                                });
                    }
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
                    const nodeG=this._g.append("g")
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
                    const labelcol=(d , i) => d3.color(lc[+d[0].data.group]).darker(2);
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
                            .attr("stroke-width",1)
                            .attr("opacity", 0.4)
                        d3.selectAll(".processPath").raise()
                        d3.selectAll(".icon").raise()
                        function overed(e, d){
                            const name=d.data.id,key=d.data.group,lck=lc[key],daker=d3.color(lck).darker(0.6);
                            const data=wm._chartData.filter(d => d.indexName===name)[0];
                            wm._hightlightcss()
                            wheel.selectAll(".clead" + key)
                                .attr("opacity", 0.1)
                            axisenter(name,key,lck,daker,true);
                            let rlines=multiplyaxis(name)
                            for (let index of rlines){
                                axisenter(index,key,lck,daker,false);
                            }
                            insertInfo(e,lck,data);
                        }

                        function outed(event, d) {
                            const name=d.data.id,key=d.data.group,lck=lc[key],daker=d3.color(lck).darker(0.6);
                            wm._initcss()
                            axisout(name,key,lck,daker,true);
                            let rlines=multiplyaxis(name)
                            for (let index of rlines){
                                axisout(index,key,lck,daker,false);
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
                        function axisenter(name,key,lck,daker,flag){
                            // hightlightcss()
                            wheel.selectAll(".riline"+key)
                                    .attr("opacity",1)
                            wheel.selectAll(".river1"+key)
                                    .attr("opacity",0.4)
                            wheel.selectAll(".river2"+key)
                                .attr("opacity",0.8)
                            wheel.selectAll("#process" + key)
                                    .attr("opacity" , 0.6)
                            wheel.select("#circle"+name)
                                    .attr("r",3.5)
                                    .attr("opacity", 1);
                            wheel.select("#precipitation"+name)
                                .attr("stroke",d => (wm._allIndex.indexOf(d.indexName) !== -1) ? d3.color(lck).darker(1.6) :daker)
                                .attr("opacity", 1)
                            wheel.select("#humidity"+name)
                                .attr("stroke", d => (wm._allIndex.indexOf(d.indexName) !== -1) ? d3.color(lck).darker(1.6) :daker)
                                .attr("opacity", 1)
                            wheel.selectAll(".line"+name)
                                .attr("stroke",d3.color(lck).darker(4))
                            wheel.selectAll(".line" + name)
                                .attr("stroke-width", 1.5)
                                .attr("opacity", 0.4)
                            wheel.selectAll("#textline" + name)
                                .style("visibility", "visible")
                                .attr("y2", outrate(r.outer+r.bubble*1.10,r.outer+r.bubble*1.20))
                            wheel.selectAll("#linestart"+ name)
                                .attr("y1", d => wm._y(d.avg)+3.5 )
                            wheel.selectAll("#linecurve" + name)
                                .attr("y2", d =>  wm._y(d.avg)-3.5)
                            wheel.selectAll(".pie"+ name)
                                .style('stroke-width', 0.5)
                                .attr("opacity", 1)
                            wheel.selectAll("#arctext"+name)
                                    .attr("opacity", 1)
                                    .attr("fill", d3.color(lck).darker(4))
                            if(flag){
                                wheel.selectAll(".clinein" + name)
                                    .attr("opacity", 0.5)
                                wheel.selectAll(".clineout" + name)
                                    .attr("opacity", 0.5)
                            }
                        }
                        function axisout(name,key,lck,daker,flag){
                            // initcss()
                            wheel.select("#circle"+name)
                                        .attr("r",2);
                            wheel.select("#precipitation"+name)
                                .attr("stroke",daker)
                            wheel.select("#humidity"+name)
                                .attr("stroke",daker)
                            wheel.selectAll(".line"+name)
                                .attr("stroke",daker)        
                            wheel.selectAll(".line" + name)
                                .attr("stroke-width", outrate(1,0.5))
                            wheel.selectAll("#textline" + name)
                                .style("visibility", wm._merge ? "hidden" : outrate("visible" , "hidden" ))
                                .attr("y2", r.outer+r.bubble*1.10)
                            wheel.selectAll("#linestart"+ name)
                                .attr("y1", d =>  wm._y(d.avg)+2)
                            wheel.selectAll("#linecurve" + name)
                                .attr("y2", d =>  wm._y(d.avg)-3.5)
                            wheel.selectAll(".pie"+ name)
                                .style('stroke-width', 0.25)
                            wheel.selectAll("#arctext"+name)
                                .attr("fill", d3.color(lck).darker(1.5))
                            wheel.selectAll(".dailyInfo").remove()
                            if(flag){
                                wheel.selectAll(".clineout" + name)
                                    .attr("opacity",0.4)
                                    .attr("stroke", labelcol).raise()
                                wheel.selectAll(".clinein" + name)
                                        .attr("opacity",0.4)
                            }
                        }
                        function insertInfo(e,lck,d){
                            const t = wm._texts;
                            let x=e.offsetX+wm._g.node().getBBox().x,
                                y=e.offsetY+wm._g.node().getBBox().y;
                            x*y>0 ? (x<0 ? (x=x-40,y=y-40):(x=x+20,y=y+40)) :(x<0 ? (x=x-40,y=y+40):(x=x+40,y=y-60));
                            wm._dailyInfo = wm._g.append("g")
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
                                    .call(g => t.date = g.append("text").attr("fill", "black").text("Date: "))
                                    .call(g =>  g.append("line").attr("x1",-1).attr("x2", 130).style("stroke", d3.color(lck).darker(4)).attr("y1", 2).attr("y2", 2).style("stroke-width", 0.5))
                                    .call(g => t.avg = g.append("text").attr("y", "1.3em").attr("fill", "black").text("Avg: ")) 
                                    .call(g => t.deviation = g.append("text").attr("y", "2.6em").attr("fill", "black").text("Deviation: ")))
                                    .call(g => t.high = g.append("text").attr("y", "3.9em").attr("fill", "black").text("High: "))
                                    .call(g => t.low = g.append("text").attr("y", "5.2em").attr("fill", "black").text("Low: "))
                                    .call(g => t.prec = g.append("text").attr("y", "6.5em").attr("fill", "black").text("Prec.: "))
                                    .call(g =>  g.append("line").attr("x1",-1).attr("x2", 135).style("stroke", d3.color(lck).darker(4)).attr("y1", 2+4*12.4).attr("y2", 2+4*12.4).style("stroke-width", 0.5))
                                    .call(g => t.humidity = g.append("text").attr("y", "7.8em").attr("fill", "black").text("Humidity: "))
                                    // .call(g =>  g.append("line").attr("x1",-1).attr("x2", 135).style("stroke", d3.color(lck).darker(4)).attr("y1", 2+5*12.4).attr("y2", 2+5*12.4).style("stroke-width", 0.5))
                                    
                            t.date.text(`Index: ${d.indexName}`);
                            t.avg.text(`Value: ${d.avg.toFixed(3)}`)
                            t.deviation.text(`Deviation: ${d.deviation.toFixed(3)}`)
                            t.high.text(`High: ${d.high.toFixed(3)}`);
                            t.low.text(`Low: ${d.low.toFixed(3)}`);
                            t.prec.text(`SPE.: ${d.precipitation.toFixed(3)}`);
                            t.humidity.text(`T^2: ${d.humidity.toFixed(3)}`);
                        }
                }

                _axisenter(name,key,lck,daker,flag){
                    const cG = this._container
                    // hightlightcss()
                    cG.selectAll(".riline"+key)
                            .attr("opacity",1)
                    cG.selectAll(".river1"+key)
                            .attr("opacity",0.4)
                    cG.selectAll(".river2"+key)
                        .attr("opacity",0.8)
                    cG.selectAll("#process" + key)
                            .attr("opacity" , 0.6)
                    cG.select("#circle"+name)
                            .attr("r",3.5)
                            .attr("opacity", 1);
                    cG.select("#precipitation"+name)
                        .attr("stroke",d => (wm._allIndex.indexOf(d.indexName) !== -1) ? d3.color(lck).darker(1.6) :daker)
                        .attr("opacity", 1)
                    cG.select("#humidity"+name)
                        .attr("stroke", d => (wm._allIndex.indexOf(d.indexName) !== -1) ? d3.color(lck).darker(1.6) :daker)
                        .attr("opacity", 1)
                    cG.selectAll(".line"+name)
                        .attr("stroke",d3.color(lck).darker(4))
                    cG.selectAll(".line" + name)
                        .attr("stroke-width", 1.5)
                        .attr("opacity", 0.4)
                    cG.selectAll("#textline" + name)
                        .style("visibility", "visible")
                        .attr("y2", outrate(r.outer+r.bubble*1.10,r.outer+r.bubble*1.20))
                    cG.selectAll("#linestart"+ name)
                        .attr("y1", d => wm._y(d.avg)+3.5 )
                    cG.selectAll("#linecurve" + name)
                        .attr("y2", d =>  wm._y(d.avg)-3.5)
                    cG.selectAll(".pie"+ name)
                        .style('stroke-width', 0.5)
                        .attr("opacity", 1)
                    cG.selectAll("#arctext"+name)
                            .attr("opacity", 1)
                            .attr("fill", d3.color(lck).darker(4))
                    if(flag){
                        cG.selectAll(".clinein" + name)
                            .attr("opacity", 0.5)
                        cG.selectAll(".clineout" + name)
                            .attr("opacity", 0.5)
                    }
                }
                _initcss(){
                    const cG = this._container;
                    for (let i in [0,1,2]){
                        cG.selectAll(".lead"+i )
                            .attr("opacity", 0.4)
                        cG.selectAll(".clead"+i )
                            .attr("opacity", 0.4)
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
                        cG.selectAll("#process"+i)
                            .attr("opacity" , 0.6)
                        cG.selectAll(".river1"+i)
                            .attr("opacity",0.4)
                        cG.selectAll(".river2"+i)
                            .attr("opacity",0.8)
                    }
                }
                _hightlightcss(){
                    const cG = this._container;
                    for (let i in [0,1,2]){
                        cG.selectAll(".lead" + i )
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
                        cG.selectAll("#process" + i)
                            .attr("opacity" , 0.3)
                        cG.selectAll(".river1" + i)
                            .attr("opacity",0.1)
                        cG.selectAll(".river2" + i)
                            .attr("opacity",0.4)
                    }
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

                _arc(radius, start, end, outerRadius) {
                    outerRadius = outerRadius || radius;
                    return d3.arc()
                        .innerRadius(radius)
                        .outerRadius(outerRadius)
                        .startAngle(start)
                        .endAngle(end)();
                }

                _circle(g, r) {
                    g.append("circle")
                        .attr("fill", "none")
                        .attr("stroke", "#aaa")
                        .attr("stroke-width", 0.5)
                        // .attr("stroke-dasharray", "10,5,2,5")
                        .attr("r", d => typeof r === "function" ? r(d) : r);
                }

                _sliderArray(arr){
                    return d3.map(arr, (d, f) => {
                        d.index = f;
                        console.log(batchData);
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