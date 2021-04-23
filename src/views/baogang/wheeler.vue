<template>
	<div>
		<div :id="menuId" style="height: 100%;width:100%;"></div>
	</div>
</template>

<script>
import * as d3 from 'd3';
import heaticon from "../../assets/images/heatwheel.svg";
import steelicon from "../../assets/images/steel.svg";
import heatwhite from "../../assets/images/heatwhite.svg";
import coolicon from "../../assets/images/coolwheel.svg";
import coolwhite from "../../assets/images/coolwhite.svg";
import rollicon from "../../assets/images/rollwheel.svg";
import rollwhite from "../../assets/images/rollwhite.svg";
import mergeLabel from "../../assets/images/mergeLabel.svg";
import deMergeLabel from "../../assets/images/deMergeLabel.svg"
import thickicon from "../../assets/images/wheel/thick.svg";
import widthicon from "../../assets/images/wheel/width.svg";
import lengthicon from "../../assets/images/wheel/length.svg";
import upidicon from "../../assets/images/wheel/upid.svg";
import categoryicon from "../../assets/images/wheel/category.svg";
import util from './util.js';
import processDetail from "./sampledata/processDetail"
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
                name:jsondata['INDEX'][item],
                PCASPE:jsondata['CONTQ'][item],
                PCAT2:jsondata['CONTJ'][item],
                result_value:jsondata['value'][item],
                result_low:jsondata['l'][item],
                result_high:jsondata['u'][item]
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
        // const details=jsondata['Steel']
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

                this._months = ["heat", "roll", "cool"];
                this._condColors = [
                    { id: "Clear", color: "#fff3b0", icon: "" },
                    { id: "Partially_cloudy", color: "#e7d8c9", icon: "" },
                    { id: "Overcast", color: "#ddd", icon: "" },
                    { id: "Rain", color: "#98c1d9", icon: "" },
                    { id: "Snow", color: "#c2dfe3", icon: "" }
                ];
                this._colors = {
                    low: "#118ab2", // blue
                    mid: "#ffd166", // yellow
                    high: "#ef476f", // red
                    avg: "#006d77", // greenish
                    precipitation: "#8ecae6", // blue
                    precline: "#0077b6",
                    humidity: "#ddd" // gray
                };

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
                    avg: "result_value",
                    precipitation: "PCASPE",
                    humidity: "PCAT2",
                    condition: "Conditions"
                }

                this._x = null; // date scale
                this._xpad=null; //pad scale
                this._y = null; // temperature scale
                this._ac = null;// avg color scale
                this._b = null; // bubble radius scale
                this._bc = null;// precipitation color scale
                this._h = null; // humidity scale
                this._hb = null;// humidity border scale
                this._hc = null; // humidity color scale
                this._dayRadian = 0; // one-day radian

                this._labels=null;
                this._details=null;
                this._currMonth = 0;
                this._yearStat = true;
                this._highlight = null;
                this._statistics = null;
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

                this._f = true;
                // this._uniqueId = new String(Date.now() * Math.random()).replace(".", "");
                this._uniqueId=new String(Math.random()).replace(".", "");
                this.process={
                    heat:["ave_temp_entry_pre","temp_uniformity_entry_pre", "sur_temp_entry_pre", 
                        "center_temp_entry_pre", "skid_temp_entry_pre", "ave_temp_pre", "staying_time_pre", "ave_temp_entry_1",
                        "temp_uniformity_entry_1", "sur_temp_entry_1", "center_temp_entry_1", "skid_temp_entry_1", "ave_temp_1",
                        "staying_time_1", "ave_temp_entry_2", "temp_uniformity_entry_2", "sur_temp_entry_2", "center_temp_entry_2", 
                        "skid_temp_entry_2", "ave_temp_2", "staying_time_2", "ave_temp_entry_soak", "temp_uniformity_entry_soak",
                        "sur_temp_entry_soak", "center_temp_entry_soak", "skid_temp_entry_soak", "ave_temp_soak", "staying_time_soak",
                        "ave_temp_dis", "temp_uniformity_dis", "sur_temp_dis", "center_temp_dis", "skid_temp_dis", "t_0", "t_1", "t_2", "t_3", "t_4", "t_5", "t_6"
                    ],
                    roll:['topwrplatecountfm','topwrplatecountrm','topbrplatecountfm','topbrplatecountrm','botbrplatecountfm',
                        'botbrplatecountrm','botwrplatecountfm','botwrplatecountrm','crownbody','crowntotal',
                        'devcrownbody','devcrowntotal','devthicknesscentertotal','devthicknessclosetotal',
                        'devwedgebody','devwedgetotal','maxcrownbody','maxcrowntotal','maxthicknesscentertotal',
                        'maxthicknessclosetotal','maxwedgebody','maxwedgetotal','mincrownbody','mincrowntotal',
                        'minthicknesscentertotal','minthicknessclosebody',
                        'minthicknessclosehead','minthicknessclosetotal',
                        'minwedgetotal','ratiolpls','thicknesscenterbody','thicknesscenterhead','thicknesscentertotal',
                        'thicknessclosebody','thicknessclosehead','thicknessclosetotal','wedgebody','wedgetotal'
                    ],
                    cool:['avg_p1','std_p1','max_p1','min_p1','avg_p2','std_p2','max_p2','min_p2','avg_sct','std_sct',
                        'max_sct','min_sct','avg_fct','std_fct','max_fct','min_fct','avg_p5','std_p5','max_p5','min_p5',
                        'avg_cr_cal','std_cr_cal','max_cr_cal','min_cr_cal','avg_cr_act','std_cr_act','max_cr_act',
                        'min_cr_act','avg_time_b','std_time_b','max_time_b','min_time_b','avg_time_w','std_time_w',
                        'max_time_w','min_time_w','avg_time_a','std_time_a','max_time_a','min_time_a','speed_ratio',
                        'last_water_temp','last_air_temp','fqc_label'
                    ]
                };
                this._padprocess=[[],[],[]];
                this._processindex={
                    heat:0,
                    roll:1,
                    cool:2
                };
                this._labelcolor={
                    index:'steelblue',
                    steelline:'rgb(250, 85, 143)',
                    nodes:["rgb(127, 141, 245)", "rgb(250, 85, 143)"],
                    0:'#fcd8a9',
                    1:'#cce9c7',
                    2: "#c1c9ee",
                    // 2:'#b3cee2'
                };
                this._padAngle=[];
                this._linespace=6;
                this._merge = true;
                this._indexdata = {};
                this._indexInfo = [];
                this._indexlength = 6;
            }
            getIndex(_){
                for (let item in this.process){
                    if(this.process[item].indexOf(_)!==-1){
                        return item
                    }
                }
            }
            data(_) {
                return arguments.length ? (this._data = _, this) : this._data;
            }
            months(_) {
                return arguments.length ? (this._months = _, this) : this._months;
            }
            labels(_){
                return arguments.length ? (this._labels = _, this) : this._labels;
            }
            details(_){
                return arguments.length ? (this._details = _, this) : this._labels;
            }

            field(_) {
                return arguments.length ? (this._field = _, this) : this._field;
            }

            icon(_) {
                if (arguments.length) {
                    this._condColors[0].icon = _.clear;
                    this._condColors[1].icon = _.cloudy;
                    this._condColors[2].icon = _.overcast;
                    this._condColors[3].icon = _.rain;
                    this._condColors[4].icon = _.snow;
                    return this;
                }
                else {
                    return this._condColors.map(d => d.icon);
                }
            }

            size(_) {
                return arguments.length ? (this._width = _[0], this._height = _[1], this) : [this._width, this._height];
            }
            render() {
                this._init();
                this._renderComponents()
                // this._process();
                // this._fliterdata();
                // this._merge ? this._fliterdata() : this._process();
                this._g = this._container.append("g").attr("transform", "translate(-50,0)");
                this._renderMerge()
                // this._initGradients();
                return this;
            }
            _renderBar(){
                this._fliterdata();
                this._renderMainWheel();
                this._renderMainBar();
            }
            _renderWheel(){
                this._process();
                this._renderMainWheel();
                this._g.attr("transform", "translate(300,0)")
            }
            _renderMerge(){
                this._g.remove();
                this._g = this._container.append("g").attr("transform", "translate(-50,0)");
                this._merge ? this._renderBar() : this._renderWheel();
            }
            _renderComponents(){
                const b = this._container.append("g")
                b.call(g => g.append("image")
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
                this._fontSize.info = fs(r.max);
                fs.range([8, 36]);
                this._fontSize.center = fs(r.max);
                fs.range([4, 18]);
                this._fontSize.month = this._fontSize.mark = this._fontSize.tick = fs(r.max);         

            }
            _process() {
                // let getIndex = cond => {
                //     for (let i = 0; i < this._condColors.length; i++) {
                //         const c = this._condColors[i];
                //         if (c.id === cond) return i;
                //     }
                //     return -1;
                // }
                const wm=this
                const labels=[],lows = [], highs = [], precs = [], humis = [];
                const field = this._field;
                this._padprocess=[[],[],[]];
                this._chartData = this._data.map(d => {
                    const datum = {
                        dateStr: d[field.date],
                        date: d[field.date],
                        month: wm.getIndex(d[field.date]),
                        low: d[field.low],
                        high: d[field.high],
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
                    wm._padprocess[wm._processindex[wm.getIndex(d[field.date])]].push(d[field.date])
                    labels.push(datum.dateStr)
                    lows.push(datum.low);
                    highs.push(datum.high);
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
                        dateStr: d[field.date],
                        date: d[field.date],
                        month: wm.getIndex(d[field.date]),
                        low: d[field.low],
                        high: d[field.high],
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
                    return datum;
                });
                // const sortdata= this._chartData;
                // const SPE=d3.sort(sortdata,d=>d.precipitation),
                //     T2=d3.sort(sortdata,d=>d.humidity),
                //     res=d3.sort(sortdata,d=>d.deviation);
                // for (let item in SPE){
                //     let query=SPE[item].dateStr                     
                //     SPE[item].order=+item+1+(+T2.findIndex((value, index, arr)=> value.dateStr===query))+1+(+res.findIndex((value, index, arr)=> value.dateStr===query))+1
                // }
                // const sample=d3.sort(SPE,d=> -d.order).filter(d => (d.humidity > limit| d.precipitation >limit) ? true : false);
                // this._chartData = sample
                var speSort = d3.sort(this._chartData,d=> d.precipitation),
                        T2Sort = d3.sort(this._chartData,d=> d.humidity);
                    this._g.attr("class","wheelg")
                    var sortdata = this._chartData.filter(d =>{
                        return (d3.map(speSort, e=> e.dateStr).indexOf(d.dateStr)<= vm.multiPara || d3.map(T2Sort, e=> e.dateStr).indexOf(d.dateStr)<= vm.multiPara) && d.deviation !==0
                    })
                    var SPE=d3.sort(sortdata,d=> -d.precipitation),
                        T2=d3.sort(sortdata,d=> -d.humidity),
                        res=d3.sort(sortdata,d=> -d.deviation);
                    for (let item in SPE){
                        let query=SPE[item].dateStr                     
                        SPE[item].order=+item+1+(+T2.findIndex((value)=> value.dateStr===query))+1+(+res.findIndex((value)=> value.dateStr===query))+1
                    }
                    const sample=d3.sort(SPE,d=>d.order);
                    this._chartData = sample;
                this._padprocess=[[],[],[]];
                this._chartData.map(datum => {
                    wm._padprocess[wm._processindex[wm.getIndex(datum.dateStr)]].push(datum.dateStr)
                    labels.push(datum.dateStr)
                    lows.push(datum.low);
                    highs.push(datum.high);
                    precs.push(datum.precipitation);
                    humis.push(datum.humidity);
                    return datum;
                });
                this._indexdata = this._chartData.slice(0);
                const mergeLength = this._indexdata.length > 25 ? this._indexdata.length :25,
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
                const d = this._chartData, r = this._radius;

                this._x = d3.scaleBand()
                    .domain(labels)
                    .range([-0.3 * Math.PI, 1.66 * Math.PI ]); // whole circle - last day
                    // .range([0, 2 * Math.PI - (2 * Math.PI / d.length)]); // whole circle - last day
                
                this._xpad=[];
                for (let item in this._padAngle){
                    this._xpad.push(
                        d3.scaleBand()
                        .domain(this._padprocess[item])
                        .range(this._padAngle[item])
                    )
                }
                this._y = d3.scaleRadial()
                    .domain([d3.min(lows), d3.max(highs)]).nice()
                    .range([r.inner+0.1*r.bubble, r.outer-0.15*r.bubble]);

                this._ac = d3.scaleLinear()
                    .domain([0,d3.extent(this._chartData,d=>this._getover(d))[1]])
                    .range(0,1);

                const bext = d3.extent(precs)
                this._b = d3.scaleLinear()
                    .domain(d3.extent(precs))
                    .range([0 , r.bubble]);
                this._hb = d3.scaleLinear()
                    .domain(bext)
                    .range([0 , r.bubble*0.6]);                    
                this._bc = d3.scaleLinear()
                    .domain([0 , bext[1]])
                    .range(this._labelcolor.nodes);

                const hext = d3.extent(humis);
                this._h = d3.scaleLinear()
                    .domain(hext)
                    .range([r.outer , r.outer + r.bubble * 0.6]);
                this._hc = d3.scaleLinear()
                    .domain([0 , hext[1]])
                    .range(this._labelcolor.nodes);
            }
            _initGradients() {
                const r = this._radius, c = this._colors;
                this._g.append("linearGradient")
                    .attr("id", `line_${this._uniqueId}`)
                    .attr("x1", "100%")
                    .attr("x2", "100%")
                    .attr("y1", r.outer)
                    .attr("y2", r.inner)
                    .attr("gradientUnits", "userSpaceOnUse")
                    .call(g => g.append("stop").attr("stop-color", c.high).attr("offset", 0))
                    .call(g => g.append("stop").attr("stop-color", c.mid).attr("offset", 0.5))
                    .call(g => g.append("stop").attr("stop-color", c.low).attr("offset", 1));

                this._condColors.forEach(d => this._g.append("linearGradient")
                    .attr("id", `grad${d.id}_${this._uniqueId}`)
                    .attr("x1", "100%")
                    .attr("x2", "100%")
                    .attr("y1", r.inner)
                    .attr("y2", r.outer)
                    .attr("gradientUnits", "userSpaceOnUse")
                    .call(g => g.append("stop").attr("stop-color", d.color).attr("stop-opacity", 0).attr("offset", 0))
                    .call(g => g.append("stop").attr("stop-color", d.color).attr("stop-opacity", 0.25).attr("offset", 0.33))
                    .call(g => g.append("stop").attr("stop-color", d.color).attr("stop-opacity", 0.5).attr("offset", 0.66))
                    .call(g => g.append("stop").attr("stop-color", d.color).attr("stop-opacity", 0.0).attr("offset", 1))
                );
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
                this._indexInfo = this._indexdata.slice(0);
                const r = this._radius,
                    lc =this._labelcolor,
                    a = this._padAngle,
                    limit = 0.3,
                    xpad = this._xpad,
                    v = (this._dayRadian-Math.PI)/2,
                    RectWidth = 280,
                    square = 15,    //rect_doct square width and length
                    rectX = r.outer+r.bubble* 4.8,  //rect_doct x
                    maxBarHeight = 20,
                    rectNum = Math.floor((this._height - 50)/29),
                    selectInfo = this._indexInfo.slice(0, this._indexInfo.length > rectNum ? rectNum : this._indexInfo.length),
                    rectY = this._indexInfo.length > rectNum ? i => (this._height - 50)/rectNum * (i + 0.5) + 10  : i => (this._height - 50)/this._indexInfo.length * (i + 0.5) + 10,
                    fillcolor = d => d3.color(lc[+this._processindex[d.month]]).darker(0.2),
                    bordercolor = d => d3.color(lc[+this._processindex[d.month]]).darker(1),
                    borderAttr = g => g.append("rect")
                        .attr("fill", "none")
                        .attr("stroke", bordercolor)
                        .attr("stroke-width", 0.5);
                    this._g.append("g")
                        .call(g => g.selectAll(".rect_doct").data(selectInfo).join("g")      
                        .attr("class", "rect_doct")
                        .attr("transform", (d, i) => `translate(${[rectX, rectY(i) - this._height/2 + square]})`)
                            .call(g => borderAttr(g)
                                .attr("width", RectWidth)
                                .attr("height", maxBarHeight + 5)
                                .attr("x", 2 * square)
                                .attr("y", -(maxBarHeight + 5)/2))
                            .call(g => borderAttr(g)
                                .attr("width", RectWidth)
                                .attr("height", maxBarHeight + 5)
                                .attr("x", RectWidth + 80)
                                .attr("y", -(maxBarHeight + 5)/2))
                            .call(g => g.append("line")
                                .attr("transform", `translate(${[ RectWidth + 80, 0]})`)
                                .attr("stroke", d => d3.color(lc[+this._processindex[d.month]]).darker(0.6))
                                .attr("x2", RectWidth)
                                .attr("stroke-width", 0.5)
                                .attr("stroke-dasharray", "2,1,2,1")))
                    const xpadSort = d3.sort(selectInfo, d => xpad[+this._processindex[d.month]](d.date)),
                        pieAngle = d3.pie()
                            .value(d => d.angle)
                            .startAngle(0.5* Math.PI)
                            .endAngle(2.5 * Math.PI),
                        piearc = d3.arc()
                            .innerRadius(0)
                            .outerRadius(r.bubble * 0.16),
                        lineG = this._g.append("g").attr("class", "lineG");
                    for(let item in this._indexInfo){
                        if(item > selectInfo.length - 1)break
                        const pindex = this._indexInfo[item],
                            xkey = +this._processindex[this._indexInfo[item].month],
                            R = r.outer+r.bubble*1.05,
                            angle = (xpad[xkey](pindex.date) + v) * 180 / Math.PI - 180 ;
                            let d = this._indexInfo[item]
                                d.path1 = [],
                                d.path2 = [];
                                d.index = item;
                            let startX = R * (Math.sin(xpad[xkey](pindex.date)+ v)), startY = -R * Math.cos(Math.abs(xpad[xkey](pindex.date)+ v)),
                                endX = rectX, 
                                endY = rectY(+item - 1)- this._height/2 + 3 * square,
                                centerY = startY + 25/startX * startY;
                                d.path1.push([startX, startY])
                                d.path1.push([startX + 25, centerY])
                                d.path1.push([endX - 80, centerY])
                                d.path2.push([endX - 45, centerY])
                                d.path2.push([endX - 30, centerY])
                                d.path2.push([endX + 2 * square, endY])
                            const line = d3.line()
                                    .x(e => e[0])
                                    .y(e => e[1])
                                    .curve(d3.curveLinear)
                            lineG
                                .call(g => g.append("path")
                                    .attr("class", "lineToRect")
                                    .attr("d", line(d.path1))
                                    .attr("stroke", d3.color(lc[xkey]).darker(0.5))
                                    .attr("opacity", 0.6)
                                    .attr("stroke-width", 1)
                                    .attr("fill", "none"))
                                .call(g => g.append("path")
                                    .attr("class", "lineToRect")
                                    .attr("d", line(d.path2))
                                    .attr("stroke", d3.color(lc[xkey]).darker(0.5))
                                    .attr("opacity", 0.6)
                                    .attr("stroke-width", 1)
                                    .attr("fill", "none"))
                            let piedata = pieAngle(pindex.property)
                            let g = lineG.selectAll(" .pie"+pindex.date)
                                .data(piedata).enter()
                                .append("g")
                                .attr("transform", `translate(${[endX - 105, centerY]})`);
                            g.append("path")
                                .attr("class", `arcpie`+xkey +' pie'+ pindex.date)
                                .attr("d", piearc)
                                .attr("fill", (d,i) => ((+d.data.value)>limit? lc[xkey] : "white"))
                                .style("stroke", d3.color(lc[xkey]).darker(2))
                                .style('stroke-width', 0.25)
                                .attr("opacity", 1)
                            lineG.append("text")
                                .attr("font-size", "8px")
                                .attr("class", `arctext${xkey}`)
                                .attr("id", `arctext${pindex.date}`)
                                .attr("fill", d3.color(lc[xkey]).darker(0.5))
                                .attr("font-family", "DIN")
                                .attr("text-anchor", "middle")
                                .text(d.dateStr.replace(/thickness/, "").replace(/temp_uniformity_/, "").replace(/wedge/, "").slice(0, 8))
                                .attr("transform", `translate(${[endX - 60, centerY + 2]})`)
							lineG.append("text")
                                .attr("font-size", "8px")
                                .attr("fill", "#fff")
                                .attr("font-family", "DIN")
                                .attr("text-anchor", "middle")
                                .text(item)
                                .attr("transform", `translate(${[endX - 88, centerY + 2.5]})`)
                            lineG.append("circle")
                                .attr("fill", lc[xkey])
                                .attr("r", r.bubble * 0.16)
								.attr("stroke", d3.color(lc[xkey]).darker(0.5))
                                .attr("transform", `translate(${[endX - 88, centerY]})`).lower()
                    }
                    var renderSlider= (RectWidth)=>{
                        // d3.selectAll(".rect_doct").remove();
                        for (let item in selectInfo){
                        // const pindex = selectInfo[item],
                        //     xkey = +this._processindex[selectInfo[item].month];
                        let d = selectInfo[item]
                            d.index = item;
                        var name = selectInfo[item].dateStr,
                            processnumber = this._processindex[selectInfo[item].month],
                            batch = batchData.map(d => {
                                let s = {},
                                i = d.INDEX.indexOf(name);
                                s.Q = d.CONTQ[i],
                                s.T2 = d.CONTJ[i],
                                s.self = d.upid == vm.upid ? true : false ,
                                s.h = d.u[i],
                                s.l = d.l[i],
                                s.upid = d.upid, 
                                s.value = d.value[i],
                                s.max = Math.max(s.h, s.l, s.value),
                                s.min = Math.min(s.h, s.l, s.value)
                                return s
                            })
                        console.log(batch)
                        let xScale = d3.scaleBand()
                                .range([0, RectWidth])
                                .domain(d3.map(batch, (d,i)=> i))
                                .padding(0.5),
                            yScale =  d3.scaleLinear()
                                    .range([ 5, 20 ])
                                    .domain([d3.min(d3.map(batch, d => d.min)), d3.max(d3.map(batch, d => d.max))]),
                            t2Rect = d3.scaleLinear()
                                    .range([ 0, maxBarHeight ])
                                    .domain([0, d3.max(d3.map(batch, d => d.T2))]),
                            speRect = d3.scaleLinear()
                                    .range([ 0, maxBarHeight ])
                                    .domain([0, d3.max(d3.map(batch, d => d.Q))]),
                            areaValue = d3.area()
                                .curve(d3.curveLinear)
                                .x((d, i) => xScale(i))
                                .y0(d => -yScale(d.l))
                                .y1(d => -yScale(d.h));
                        var rectAttr = g => g.append("rect")
                            .attr("fill", d => batch[d].self ? vm.trainBorder(batchData[d])  : d3.color(lc[+processnumber]))
                            .attr("stroke", d3.color(lc[+processnumber]))
                            .attr("width", xScale.bandwidth())
                            .attr("x", d => xScale(d) - xScale.bandwidth()/2)
                            .attr("stroke-width", 1.75)
                            .attr("stroke-opacity", 0.5);
                        sliderG.append("g")   
                        .attr("class", "rect_doct")
                        .attr("id", `rect_doct${item}`)
                        .attr("transform", `translate(${[rectX + 2 * square, rectY(+item) - this._height/2 + square + (maxBarHeight + 5)/2]})`)
                            .call(g => g.append("g").selectAll(" .rect_fill").data(d3.map(batch, (d,i)=> i)).join("g")
                                .attr("class", "rect_fill")
                                .call(g => rectAttr(g)
                                    .attr("y", d => -speRect(batch[d].Q))
                                    .attr("height", d => speRect(batch[d].Q)))
                                .call(g => rectAttr(g)
                                    .attr("y", d => -t2Rect(batch[d].T2))
                                    .attr("height", d => t2Rect(batch[d].T2)))
                                .call(g => rectAttr(g)
                                    .attr("transform", `translate(${[RectWidth + 50, 0]})`)
                                    .attr("y", d => -yScale(batch[d].value))
                                    .attr("height", d => yScale(batch[d].value))))
                            // .call(g => g.append("path")
                            //     .datum(batch)
                            //     .attr("class", "DUGUDU")
                            //     .attr("fill",d3.color(lc[+processnumber]).darker(0))
                            //     .attr("opacity", 0.5)
                            //     .attr("d", areaValue))
                    }
                    }
                    var sliderG = this._g.append("g")
                        .attr("class", "sliderG")
                        .attr("transform", `translate(${[rectX + 2 * square, 0]})`)
                    var maxLength = 3,  //batch numbers
                        minRect = RectWidth/ (maxLength + 0.5),
                        rectArray = new Array(maxLength).fill(minRect).map((d, i) => Math.ceil(maxLength/2) == i + 1 ? 1.5 * d : d),   //batch position
                        rectPosition = Array.from(d3.cumsum(rectArray));
                    sliderG.append("g")		//area drag
                        .selectAll("g")
                        .data(Object.keys(rectPosition).map(d => +d).slice(0, -1)).join("g")
                        .attr("class", "dragTransition")
                        .attr("transform", d => `translate(${[rectPosition[d], 0]})`)
                        .call(g => g
                            .call(g => g.selectAll("g")
                                .data(Object.keys(selectInfo))
                                .join("g")
                                .attr("transform", (d, i) => `translate(${[-2 , rectY(i) - this._height/2 + square + (maxBarHeight + 5)/2]})`)
                                .call(g => g.append('rect')
                                    .attr("width", 3)
                                    .attr("y", - (maxBarHeight + 5))
                                    .attr("height", maxBarHeight + 5)
                                    .style('fill', '#cccccc')))
                            .call(d3.drag()
                                .on('drag', drag)
                            ));
                    var sliderData = d3.map(selectInfo, (d, f) => {
                        d.index = f;
                        var name = d.dateStr,
                        batch = batchData.map(e => {
                            let s = {},
                            i = e.INDEX.indexOf(name);
                            s.Q = e.CONTQ[i],
                            s.T2 = e.CONTJ[i],
                            s.self = e.upid == vm.upid ? true : false ,
                            s.h = e.u[i],
                            s.l = e.l[i],
                            s.upid = e.upid, 
                            s.value = e.value[i],
                            s.max = Math.max(s.h, s.l, s.value),
                            s.min = Math.min(s.h, s.l, s.value),
                            s.d = f
                            return s
                        })
                        return batch
                    })
                    var sliderEX = (new Array(maxLength).fill(0)).map((d, i) => deepCopy(sliderData).map(e => e.map(f => {f.i = i; return f})));
					var areaParameter = (array, data) => {	//area function
						let xBatch = array.map((d, i) => {
							let l = array[i],
								scale = d3.scaleLinear()
									.range([5, l * 1.1])
									.domain(d3.extent(data[i], (e, f)=> f))
									.nice()
							return scale
						});
						let yBatch = d3.scaleLinear()
							.range([ 0, 20 ])
							.domain([0, 1]);
						let mergeArea = d3.area()
							.x((d, i) => xBatch[d.i](i))
							.y0((d, i) => -yBatch(d.min))
							.y1((d, i) => -yBatch(d.max));
						return mergeArea
					}
					var mergeArea = areaParameter(rectArray, sliderEX)
                    sliderG.selectAll(".batchG").data(rectPosition)
                            .join("g")
                            .attr("class", "batchG")
                            .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`)
                            .call(g => g.selectAll("path")
                                .data((d, i) => sliderEX[i])
                                .join("path")
								.attr("fill", (d, i) => lc[+this._processindex[selectInfo[i].month]])
								.attr("stroke", (d, i) => d3.color(lc[+this._processindex[selectInfo[i].month]]).darker(1))
                                .attr("transform", (d, i) =>`translate(${[0, rectY(i) - this._height/2 + square + (maxBarHeight + 5)/2]})`)
                                .datum(d => d)
                                .attr("class", "sampleBatch")
                                .attr("d", mergeArea)
                                .attr("opacity" , 0.4))
                    function deepCopy(obj){
                        if(typeof obj!=='object') return obj;
                        var newObj=obj instanceof Array ? [] :{};
                        for (let key in obj){
                            if(obj.hasOwnProperty(key)){
                                if(obj[key]===null){
                                    newObj[key]===null;
                                }
                                newObj[key]=typeof obj[key] ? deepCopy(obj[key]) : obj[key];
                            }
                        }
                        return newObj
                    };
                    function drag(e, d){    //update batch
                        rectPosition[d] = e.x
                        rectPosition = Array.from(rectPosition);
                        rectPosition.unshift(0);
                        var rectlength = d3.pairs(rectPosition, (a, b) => b -a).filter((d, i) => i + 1 !== Math.ceil(maxLength/2));
                        if(!rectlength.every(d => d>15)){
                            minRect = 20
                        }else{
                            minRect = (minRect ==  d3.min(rectlength)) ? d3.max(rectlength) : d3.min(rectlength);
                        }
                        if( RectWidth - (maxLength - 1) * minRect < 30)minRect = (RectWidth -30)/(maxLength - 1)
                        rectArray = new Array(maxLength).fill(minRect).map((d, i) => Math.ceil(maxLength/2) == i + 1 ? RectWidth - (maxLength - 1) * minRect : d);   
                        rectPosition = d3.cumsum(rectArray)
                        d3.selectAll(".dragTransition")
                            .transition()
                            .duration(200)
                            .ease(d3.easeLinear)
                            .attr("transform", d => `translate(${[rectPosition[d], 0]})`)
                        let mergeArea = areaParameter(rectArray, sliderEX)
                        sliderG.selectAll(".batchG")
                            .transition(d3.transition()
                                .duration(200)
                                .ease(d3.easeLinear))
                            .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`)
							.selectAll("path")
							.attr("d", mergeArea)
                    }
                    // var processData = []
                    // for(let item in processDetail){
                    //     for(let index in processDetail[item]){
                    //         processData.push({
                    //             month : +item,
                    //             date : index,
                    //             low : processDetail[item][index]["min"],
                    //             high : processDetail[item][index]["max"],
                    //             value : processDetail[item][index]["sample"],
                    //             range : processDetail[item][index]["range"]
                    //         })
                    //     }
                    // }
                    // for(let item in processData){
                    //     // const proitem = processData[item]
                    //     let order = 0;
                    //     for (let index in processData[item]["value"]){
                    //         if(isNaN(processData[item]["value"][index]) || typeof(processData[item]["value"][index]) !== "number"){
                    //             processData[item]["value"][index] = 0
                    //         }else if(processData[item]["value"][index] >=  processData[item]["high"][index]){
                    //             order ++;
                    //             processData[item]["value"][index] = +processData[item]["value"] -  processData[item]["high"][index]
                    //         }else if(processData[item]["value"][index] <  processData[item]["low"][index]){
                    //             order ++;
                    //             processData[item]["value"][index] = +processData[item]["value"][index] -  processData[item]["low"][index]
                    //         }else{
                    //             processData[item]["value"][index] = 0
                    //         }
                    //         processData[item]["order"] =order
                    //     }
                    //     processData = d3.sort(processData, d => -d["order"])
                    // }
                    // console.log(processData)
                    // console.log(processDetail)
                    // for(let item in processData){
                    //     let overlap = 3,
                    //         h = (this._height - 50)/processData.length,
                    //         step = h,
                    //         horizenWidth = 290,
                    //         overlaps = Array.from({length: overlap * 2} , (_, i) => Object.assign({index: i < overlap ? -i - 1: i - overlap})),
                    //         xHorizon = d3.scaleLinear()
                    //             .range([0, horizenWidth])
                    //             .domain(processData[item]["value"].map((d,i) => i)),
                    //         color = i => {
                    //             return ["#e34649", "#f7a8a9", "#fcdcdc", "#f7f7f7", "#fcdcdc","#f7a8a9", "#e34649"][i + (i >= 0) + overlap]
                    //         },
                    //         max = d3.max(processData[item]["value"], d => Math.abs(d)),
                    //         yHorizon = d3.scaleLinear()
                    //                 .range([ h * overlap, -overlap * h ])
                    //                 .domain([-max, +max]),
                    //         dataarea = d3.area()
                    //             .curve(d3.curveBasis)
                    //             .x((d,i) => xHorizon(i))
                    //             .y0(0)
                    //             .y1(d => yHorizon(d));
                        // this._g.append("g")   
                        // .attr("class", "rect_horizon")
                        // .attr("transform", `translate(${[r.outer+r.bubble*3.60, h * (item-0.5)- (this._height)/2+ 15]})`)
                        //     .call(g => g.append("g")
                        //         .attr("transform", `translate(${[RectWidth + 150,0]})`)
                        //         .call(g => g.append("rect")
                        //                 .attr("stroke-width", 0.5)
                        //                 .attr("stroke", lc[processData[item].month])
                        //                 .attr("fill", "none")
                        //                 .attr("width", horizenWidth)
                        //                 .attr("height", h))
                        //         .call(g => g.append("clipPath")
                        //             .attr("id", `clipy${item}`)
                        //                 .append("rect")
                        //                 .attr("stroke", 1)
                        //                 .attr("width", horizenWidth)
                        //                 .attr("height", h))
                        //         .call(g => g
                        //         .append("defs")
                        //             .append("path")
                        //             .attr("id", `path-def${item}`)
                        //             .datum(processData[item]["value"])
                        //             .attr("d", dataarea)
                        //             )
                        //         .call(g => g.append("g")
                        //             .attr("clip-path", `url(#clipy${item})`)
                        //             .selectAll("use")
                        //             .data(overlaps)
                        //                 .enter().append("use")
                        //                 .attr("fill", d => color(d.index))
                        //                 .attr("transform", d => `translate(0,${(d.index + 1) * step})`)
                        //                 .attr("href", "#path-def" + item))
                        //         // .append("path")
                        //         //     .attr("d", d3.linkHorizontal()({
                        //         //         source: [-70, 15],
                        //         //         target: [0, h/2]
                        //         //         }))
                        //         //     .attr("stroke", d3.color(lc[+this._processindex[processData[item].month]]).darker(0.5))
                        //         //     .attr("opacity", 0.6)
                        //         //     .attr("stroke-width", 2.5)
                        //         //     .attr("fill", "none")
                        //                 )
                    // }
                    
            }
            _renderWheelContent() {
                const r = this._radius,
                    c = this._colors,
                    lc =this._labelcolor,
                    limit = 0.5,
                    a = this._padAngle,
                    xpad = this._xpad,
                    v = (this._dayRadian-Math.PI)/2,
                    icon = [heaticon , rollicon , coolicon],
                    iconwhite = [heatwhite , rollwhite , coolwhite],
                    piearc = d3.arc()
                        .innerRadius(0)
                        .outerRadius(r.bubble * 0.12),
                    titleinfo = [ "cate", "p_thick", "p_wid", "p_len"],
                    titleicon=[categoryicon,thickicon,widthicon,lengthicon],
                    graph={nodes:[],links:[]},
                    wm=this,
                    colorLinear1=[],
                    colorLinear2=[];
                    var speSort = d3.sort(this._chartData,d=> d.precipitation),
                        T2Sort = d3.sort(this._chartData,d=> d.humidity);
                    var sortdata = this._chartData.filter(d =>{
                        return (d3.map(speSort, e=> e.dateStr).indexOf(d.dateStr)<= vm.multiPara || d3.map(T2Sort, e=> e.dateStr).indexOf(d.dateStr)<= vm.multiPara) && d.deviation !==0
                    })
                    var SPE=d3.sort(sortdata,d=> -d.precipitation),
                        T2=d3.sort(sortdata,d=> -d.humidity),
                        res=d3.sort(sortdata,d=> -d.deviation);
                    this._g.attr("class","wheelg")
                    for (let item in SPE){
                        let query=SPE[item].dateStr                     
                        SPE[item].order=+item+1+(+T2.findIndex((value)=> value.dateStr===query))+1+(+res.findIndex((value)=> value.dateStr===query))+1
                    }
                    const sample=d3.sort(SPE,d=> d.order);
                    var sampleId = d3.map(sample, d => d.dateStr),
                    outrate = (item1 , item2) => {
                        return d => (sampleId.indexOf(d.dateStr) !== -1) ? item1 : item2
                    };
                const vis = this._g.selectAll("#" +menuId + " .vis").data(this._chartData);
                for (let key in xpad){
                    const processdata = [], 
                    lck = lc[key],
                    daker=d3.color(lck).darker(0.6),
                    darkerborder=d3.color(lck).darker(2),
                    line_stroke=outrate(d3.color(lck).darker(2),daker);
                    for (let item of this._chartData){
                        if(this._processindex[item.month] == key) {
                            processdata.push(item)
                        }
                    }
                    if(processdata.length === 0) continue                 
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
                                .innerRadius(d => this._y(d.low*0.90))
                                .outerRadius(d => this._y(d.high*1.10))
                            (processdata)))
                    .call(g => g.append("path")     //河流图外层
                        .attr("fill", lck)
                        .attr("class" , "river2"+key)
                        .attr("fill-opacity", 0.8)
                        .attr("d", area
                            .innerRadius(d => this._y(d.low))
                            .outerRadius(d => this._y(d.high))
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
                        .attr("stroke", d3.color(lck).darker(2))
                        .attr("fill",lck)
                        .attr("stroke-width", 0.5)
                        .attr("opacity", 0.6)
                        .on("mouseover", (e, d) => {
                            hightlightcss()
                            d3.selectAll("#" +menuId +" .riline"+key)
                                .attr("opacity",1)
                            d3.selectAll("#" +menuId + " .clead"+key )
                                .attr("opacity", 0.4)
                            d3.selectAll("#" +menuId + " .river1"+key)
                                .attr("opacity",0.4)
                            d3.selectAll("#" +menuId + " .river2"+key)
                                .attr("opacity",0.8)
                            d3.selectAll("#" +menuId + " #process"+key)
                                .attr("fill",d3.color(lck).darker(0.2))
                                .attr("opacity" , 0.6)
                            d3.selectAll("#" +menuId + " #circle"+key)
                                .attr("stroke" , "white")
                            d3.selectAll("#" +menuId + " #icon"+key)
                                .attr("href", iconwhite[key])
                            d3.selectAll("#" +menuId + " .circle_color"+key)
                                .attr("r",outrate (3.5 , 2))
                                .attr("opacity", 1);
                            d3.selectAll("#" +menuId + " .precipitation"+key)
                                .attr("stroke",d => (sampleId.indexOf(d.dateStr) !== -1) ? d3.color(lck).darker(colorlinear1(d.precipitation)+2) :daker)
                                .attr("opacity", 1)
                            d3.selectAll("#" +menuId + " .humidity"+key)
                                .attr("stroke",d => (sampleId.indexOf(d.dateStr) !== -1) ? d3.color(lck).darker(colorlinear2(d.humidity)+2) :daker)
                                .attr("opacity", 1)
                            d3.selectAll("#" +menuId + " .lead"+key )
                                .attr("stroke-width", outrate(1.5,0.5))
                                .attr("opacity", 0.4)
                            d3.selectAll("#" +menuId + " .linestart")
                                .attr("y1", d => (sampleId.indexOf(d.dateStr) !== -1) ? this._y(d.avg)+3.5 : this._y(d.avg)+2)
                            d3.selectAll("#" +menuId + " .linecurve")
                                .attr("y2", d => (sampleId.indexOf(d.dateStr) !== -1) ? this._y(d.avg)-3.5 : this._y(d.avg)-2)
                            d3.selectAll("#" +menuId + " .arcpie"+key)
                                .attr("opacity", 1)
                                .style('stroke-width', 0.5)
                            d3.selectAll("#" +menuId + " .arctext"+key)
                                .attr("opacity", 1)
                                .attr("fill", d3.color(lck).darker(4))
                        })
                        .on("mouseleave", (e, d) => {
                            initcss()
                            d3.selectAll("#" +menuId + " #process"+key)
                                .attr("fill",lck)
                            d3.selectAll("#" +menuId + " #circle"+key)
                                .attr("stroke" , daker)
                            d3.selectAll("#" +menuId + " #icon"+key)
                                .attr("href", icon[key])
                            d3.selectAll("#" +menuId + " .circle_color"+key)
                                    .attr("r",2);
                            d3.selectAll("#" +menuId + " .precipitation"+key)
                                .attr("stroke",daker)
                            d3.selectAll("#" +menuId + " .humidity"+key)
                                .attr("stroke",daker)
                            d3.selectAll("#" +menuId + " .lead"+key)
                                .attr("stroke-width", outrate(1,0.5))
                            d3.selectAll("#" +menuId + " .linestart")
                                .attr("y1", d =>  this._y(d.avg)+2)
                            d3.selectAll("#" +menuId + " .linecurve")
                                .attr("y2", d =>  this._y(d.avg)-2)
                            d3.selectAll("#" +menuId + " .arcpie"+key)
                                .style('stroke-width', 0.25)
                            d3.selectAll("#" +menuId + " .arctext"+key)
                                .attr("fill", d3.color(lck).darker(1.5))
                        }))
                    .call(g => g.selectAll("#" +menuId + " .circle_doct"+key).data(processdata).join("g")      
                        .attr("class", "circle_doct")
                        .attr("transform", d => `rotate(${(xpad[key](d.date) + v) * 180 / Math.PI - 180 })`)       ////河流图节点
                        .call(g => g.append("circle")
                            .attr("class", "circle_color"+key)
                            .attr('id',d=>'circle'+d.dateStr)
                            .attr("fill", d3.color(lck).darker(0.2))
                            .attr("stroke", d3.color(lck).darker(1))
                            .attr("opacity", 1)
                            .attr("stroke-width", 0.5)
                            .attr("stroke-opacity", 1)
                            .attr("cy", d => this._y(d.avg))
                            .attr("r",2))
                        .call(g => g.append("line")     //line1
                            .attr("class" , d => "lead"+key +" line" + d.dateStr +" "+"linecurve")
                            .attr("id" , d => "linecurve"+ d.dateStr)
                            .style("visibility", wm._merge ? "hidden" : outrate("visible" , "hidden" ))
                            .attr("y1",r.inner*0.8 )
                            .attr("y2", d => this._y(d.avg)-2)
                            .attr("stroke", line_stroke)
                            .attr("stroke-width", outrate(1,0.5))
                            .attr("opacity", 0.4))
                        .call(g => g.append("line")     //line2
                            .attr("class" , d => "lead"+key +" line" + d.dateStr +" "+"linestart")
                            .attr("id" , d => "linestart"+ d.dateStr)
                            .attr("y1", d => this._y(d.avg)+2)
                            .attr("y2", r.outer)
                            .attr("stroke", line_stroke)
                            .attr("stroke-width", outrate(1,0.5))
                            .attr("opacity", 0.4))
                        .call(g => g.append("line")
                            .attr("class" , d => "lead"+key +" line" + d.dateStr)
                            .attr("y1", d => this._h(d.humidity))
                            .attr("y2", d => r.outer+r.bubble*1.10-this._hb(d.precipitation))
                            .attr("stroke", line_stroke)
                            .attr("stroke-width", outrate(1,0.5))
                            .attr("opacity", 0.4))
                        .call(g => g.append("line")
                            .attr("class" , d => "lead"+key +" line" + d.dateStr +" "+"textline")
                            .attr("id" , d => "textline" + d.dateStr)
                            .style("visibility", wm._merge ? "hidden" : outrate("visible" , "hidden" ))
                            .attr("y1", d => r.outer+r.bubble*1.10)
                            .attr("y2", d => r.outer+r.bubble*1.10)
                            .attr("stroke", line_stroke)
                            .attr("stroke-width", outrate(1,0.5))
                            .attr("opacity", 0.4)))
                    .call(g => g.append("image")    //icon
                            .attr("class", "icon")
                            .attr("id", "icon"+key)
                            .attr("width", "13px")
                            .attr("height","13px")
                            .attr("transform", (d , i) => `rotate(${(this._padAngle[key][0] + this._padAngle[key][1])/2 * 180 / Math.PI - 5.8})`)
                            .style("visibility", processdata.length === 0 ? "hidden" : "visible")
                            .attr("y",-r.inner*0.97)
                            .attr("href", icon[key]))                        

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
                        let g=this._g.selectAll("#" +menuId + " .pie"+pindex.date)
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
                        let label=(+sample.findIndex((value, index, arr)=> value.dateStr===pindex.date))
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
                    
                    const colorlinear1=d3.scaleLinear()
                        .domain(d3.extent(processdata,d=>d.precipitation))
                        .range([0.25,0]);
                    const colorlinear2=d3.scaleLinear()
                        .domain(d3.extent(processdata,d=>d.humidity))
                        .range([0.25,0]);
                    colorLinear1.push(colorlinear1)
                    colorLinear2.push(colorlinear2)
                    const vis = this._g.selectAll("#" +menuId + " .vis"+key).data(processdata);
                    vis.join("g")
                        .attr("class", "vis")
                        .attr("transform", d => `rotate(${xpad[key](d.date) * 180 / Math.PI - 180})`)
                        .call(g => g.append("path")
                        .attr("class", "humidity"+key)
                            .attr('id',d=>'humidity'+d.dateStr)
                            .attr("fill",d=> d3.color(lck).brighter(colorlinear2(d.humidity)))
                            .attr("opacity", 1)
                            .attr("stroke", daker)
                            .attr("stroke-width", 0.5)
                            .attr("d", d => this._linepad(r.outer, this._h(d.humidity))))
                        .call(g => g.append("path")
                            .attr("class", "precipitation"+key)
                            .attr('id',d=>'precipitation'+d.dateStr)
                            .attr("fill",d=> d3.color(lck).brighter(colorlinear1(d.precipitation)))
                            .attr("opacity", 1)
                            .attr("stroke", daker)
                            .attr("stroke-width", 0.5)
                            .attr("d", d => this._linepad(r.outer+r.bubble*1.10-this._hb(d.precipitation) , r.outer+r.bubble*1.10)))

                    const t = this._texts;

                    this._g.selectAll("#" +menuId + " .visoverlay"+key)
                        .data(processdata)
                        .join("g")
                        .attr("class", "visoverlay"+key)
                        .attr("transform", d => `rotate(${xpad[key](d.date) * 180 / Math.PI - 180})`) // rad 2 deg - 180 -> rotate back to 12 o'clock                
                        .call(g => g.append("path")
                            .attr("fill", "white")
                            .attr("opacity", 0)
                            .attr("d", this._line(r.inner, r.max)))
                            .on("mouseenter", (e, d) => {
                                insertInfo(e,lck,d);
                                hightlightcss()
                                axisenter(d.dateStr,key,lck,daker,true);                                   
                            })
                            .on("mouseleave", (e, d) => {
                                initcss()
                                axisout(d.dateStr,key,lck,daker,true);
                            });
                }
                for (let item in sample){
                    let index = chorddata['label'].indexOf(sample[item].dateStr),targets=[],id=sample[item].dateStr;
                    for (let target =item+1;target < sample.length ;target++){
                        if(chorddata['corr'][item][target] < vm.corrSize&&chorddata['corr'][item][target]>0){
                            if(this._months.indexOf(sample[item].month) == this._months.indexOf(sample[target].month)){
                                targets.push(sample[target].dateStr)
                                graph.links.push({'source':id,'target':sample[target].dateStr,value:1})
                            }
                        }
                    }
                    graph.nodes.push({'id':id,'group': this._months.indexOf(sample[item].month),'targets':targets})
                }
                const colornone = "#ccc";
                const svg=this._g.append("g")
                        .attr("transform",`rotate(${-60})`);
                    const tree = d3.cluster()
                        .size([2 * Math.PI, r.inner*0.8])
                    const line = d3.lineRadial()
                        .curve(d3.curveBundle.beta(vm.curveSize))   //d3.curveNatural
                        .radius(d => d.y)
                        .angle(d => d.x)

                    function bilink(root) {
                        const map = new Map(root.leaves().map(d => [d.data.id, d]));
                        for (const d of root.leaves()) d.incoming = [], d.outgoing = d.data.targets.map(i => [d, map.get(i)]);
                        for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
                        return root;
                    }
                    const {nodes, links} = graph;
                    const groupById = new Map;
                    const nodeById = new Map(nodes.map(node => [node.id, node]));

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
                    // console.log(root)
                    // console.log(root.leaves())
                    // console.log(root.leaves().flatMap(leaf => leaf.outgoing))
                    const node = svg.append("g")
                        .attr("font-family", "sans-serif")
                        .attr("font-size", 10)
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
                    const labelcolor=(d , i) => d3.color(lc[+d[0].data.group]).darker(2);
                    const highlightcolor=(d , i) => d3.color(lc[+d[0].data.group]).darker(3);
                    const linedata=root.leaves().flatMap(leaf => leaf.outgoing);
                    const link = svg.append("g")
                        .attr("stroke", colornone)
                        .attr("fill", "none")
                        .selectAll("path")
                        .data(linedata)
                        .join("path")
                            // .style("mix-blend-mode", "multiply")
                            .attr("d", ([i, o]) => line(i.path(o)))
                            .each(function(d) { d.path = this; })
                            .attr("class",d=>{
                                return "clead"+ (+d[0].data.group) + " clinein"+d[0].data.id +" clineout"+d[1].data.id
                            })
                            .attr("stroke",  labelcolor)
                            .attr("stroke-width",1)
                            .attr("opacity", 0.4)
                    function overed(e, d){
                        const name=d.data.id,key=d.data.group,lck=lc[key],daker=d3.color(lck).darker(0.6);
                        const data=wm._chartData.filter(d => d.dateStr===name)[0];
                        hightlightcss()
                        d3.selectAll("#" +menuId + " .clead" + key)
                            .attr("opacity", 0.1)
                        axisenter(name,key,lck,daker,true);
                        let rlines=multiplyaxis(name)
                        for (let index of rlines){
                            axisenter(index,key,lck,daker,false);
                        }
                        insertInfo(e,lck,data);
                        // link.style("mix-blend-mode", null);
                        d3.select(this).attr("font-weight", "bold");
                        d3.selectAll(d.incoming.map(d => d.path)).attr("stroke", highlightcolor).raise();
                        d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", highlightcolor).raise();
                    }

                    function outed(event, d) {
                        const name=d.data.id,key=d.data.group,lck=lc[key],daker=d3.color(lck).darker(0.6);
                        initcss()
                        axisout(name,key,lck,daker,true);
                        let rlines=multiplyaxis(name)
                        for (let index of rlines){
                            axisout(index,key,lck,daker,false);
                        }
                        // link.style("mix-blend-mode", "multiply");
                        d3.select(this).attr("font-weight", null);
                        d3.selectAll(d.incoming.map(d => d.path)).attr("stroke", labelcolor);
                        d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", labelcolor);
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
                        d3.selectAll("#" +menuId + " .riline"+key)
                                .attr("opacity",1)
                        d3.selectAll("#" +menuId + " .river1"+key)
                                .attr("opacity",0.4)
                        d3.selectAll("#" +menuId + " .river2"+key)
                            .attr("opacity",0.8)
                        d3.selectAll("#" +menuId + " #process" + key)
                                .attr("opacity" , 0.6)
                        d3.select("#" +menuId + " #circle"+name)
                                .attr("r",3.5)
                                .attr("opacity", 1);
                        d3.select("#" +menuId + " #precipitation"+name)
                            .attr("stroke",d => (sampleId.indexOf(d.dateStr) !== -1) ? d3.color(lck).darker(colorLinear1[key](d.precipitation)+2) :daker)
                            .attr("opacity", 1)
                        d3.select("#" +menuId + " #humidity"+name)
                            .attr("stroke", d => (sampleId.indexOf(d.dateStr) !== -1) ? d3.color(lck).darker(colorLinear2[key](d.humidity)+2) :daker)
                            .attr("opacity", 1)
                        d3.selectAll("#" +menuId + " .line"+name)
                            .attr("stroke",d3.color(lck).darker(4))
                        d3.selectAll("#" +menuId + " .line" + name)
                            .attr("stroke-width", 1.5)
                            .attr("opacity", 0.4)
                        d3.selectAll("#" +menuId + " #textline" + name)
                            .style("visibility", "visible")
                            .attr("y2", outrate(r.outer+r.bubble*1.10,r.outer+r.bubble*1.20))
                        d3.selectAll("#" +menuId + " #linestart"+ name)
                            .attr("y1", d => wm._y(d.avg)+3.5 )
                        d3.selectAll("#" +menuId + " #linecurve" + name)
                            .attr("y2", d =>  wm._y(d.avg)-3.5)
                        d3.selectAll("#" +menuId + " .pie"+ name)
                            .style('stroke-width', 0.5)
                            .attr("opacity", 1)
                        d3.selectAll("#" +menuId + " #arctext"+name)
                                .attr("opacity", 1)
                                .attr("fill", d3.color(lck).darker(4))
                        if(flag){
                            d3.selectAll("#" +menuId + " .clinein" + name)
                                .attr("opacity", 0.5)
                            d3.selectAll("#" +menuId + " .clineout" + name)
                                .attr("opacity", 0.5)
                        }
                    }
                    function axisout(name,key,lck,daker,flag){
                        // initcss()
                        d3.select("#" +menuId + " #circle"+name)
                                    .attr("r",2);
                        d3.select("#" +menuId + " #precipitation"+name)
                            .attr("stroke",daker)
                        d3.select("#" +menuId + " #humidity"+name)
                            .attr("stroke",daker)
                        d3.selectAll("#" +menuId + " .line"+name)
                            .attr("stroke",daker)        
                        d3.selectAll("#" +menuId + " .line" + name)
                            .attr("stroke-width", outrate(1,0.5))
                        d3.selectAll("#" +menuId + " #textline" + name)
                            .style("visibility", wm._merge ? "hidden" : outrate("visible" , "hidden" ))
                            .attr("y2", r.outer+r.bubble*1.10)
                        d3.selectAll("#" +menuId + " #linestart"+ name)
                            .attr("y1", d =>  wm._y(d.avg)+2)
                        d3.selectAll("#" +menuId + " #linecurve" + name)
                            .attr("y2", d =>  wm._y(d.avg)-3.5)
                        d3.selectAll("#" +menuId + " .pie"+ name)
                            .style('stroke-width', 0.25)
                        d3.selectAll("#" +menuId + " #arctext"+name)
                            .attr("fill", d3.color(lck).darker(1.5))
                        d3.selectAll("#" +menuId + " .dailyInfo").remove()
                        if(flag){
                            d3.selectAll("#" +menuId + " .clineout" + name)
                                .attr("opacity",0.4)
                                .attr("stroke", labelcolor).raise()
                            d3.selectAll("#" +menuId + " .clinein" + name)
                                    .attr("opacity",0.4)
                        }
                    }
                    function initcss(){
                        for (let i in [0,1,2]){
                            d3.selectAll("#" +menuId + " .lead"+i )
                                .attr("opacity", 0.4)
                            d3.selectAll("#" +menuId + " .clead"+i )
                                .attr("opacity", 0.4)
                            d3.selectAll("#" +menuId + " .humidity"+i)
                                .attr("opacity", 1)
                            d3.selectAll("#" +menuId + " .precipitation"+i)
                                .attr("opacity", 1)
                            d3.selectAll("#" +menuId + " .circle_color"+i)
                                .attr("opacity", 1)
                            d3.selectAll("#" +menuId + " .arcpie"+i)
                                .attr("opacity", 1)
                            d3.selectAll("#" +menuId + " .arctext"+i)
                                .attr("opacity", 1)
                            d3.selectAll("#" +menuId + " #process"+i)
                                .attr("opacity" , 0.6)
                            d3.selectAll("#" +menuId + " .river1"+i)
                                .attr("opacity",0.4)
                            d3.selectAll("#" +menuId + " .river2"+i)
                                .attr("opacity",0.8)

                        }
                    }
                    function hightlightcss(){
                        for (let i in [0,1,2]){
                            d3.selectAll("#" +menuId + " .lead"+i )
                                .attr("opacity", 0.1)
                            d3.selectAll("#" +menuId + " .clead"+i )
                                .attr("opacity", 0.1)
                            d3.selectAll("#" +menuId + " .humidity"+i)
                                .attr("opacity", 0.5)
                            d3.selectAll("#" +menuId + " .precipitation"+i)
                                .attr("opacity", 0.5)
                            d3.selectAll("#" +menuId + " .circle_color"+i)
                                .attr("opacity", 0.5)
                            d3.selectAll("#" +menuId + " .arcpie"+i)
                                .attr("opacity", 0.5)
                            d3.selectAll("#" +menuId + " .arctext"+i)
                                .attr("opacity", 0.5)
                            d3.selectAll("#" +menuId + " #process"+i)
                                .attr("opacity" , 0.3)
                            d3.selectAll("#" +menuId + " .river1"+i)
                                .attr("opacity",0.1)
                            d3.selectAll("#" +menuId + " .river2"+i)
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
                                
                        t.date.text(`Index: ${d.dateStr}`);
                        t.avg.text(`Value: ${d.avg.toFixed(3)}`)
                        t.deviation.text(`Deviation: ${d.deviation.toFixed(3)}`)
                        t.high.text(`High: ${d.high.toFixed(3)}`);
                        t.low.text(`Low: ${d.low.toFixed(3)}`);
                        t.prec.text(`SPE.: ${d.precipitation.toFixed(3)}`);
                        t.humidity.text(`T^2: ${d.humidity.toFixed(3)}`);
                    }
            }


            _showStatistics(data, label) {
                const set = g => {
                    g.attr("transform", d => `translate(${d.x},${d.y})`)
                        .select("text")
                        .attr("fill", d => d3.color(d.data.color).darker(0.75))
                        .text(d => d.value);

                    const c = g.select("circle");
                    var t = !this._f ? c.transition().duration(250) : c;                    
                    t.attr("r", d => d.r)
                        .attr("fill", d => d.data.color)
                        .attr("stroke", d => d3.color(d.data.color).darker(0.75))            

                    return g;
                }

                this._statistics.select(".label").text(label);
                this._statistics.selectAll("g")
                    .data(this._pack(data).leaves().filter(d => d.data.color !== undefined))
                    .join(
                        enter => {
                            return enter.append("g")
                                .call(g => g.append("circle")
                                    .attr("opacity", 0.65)
                                    .attr("stroke-width", 0.5))
                                .call(g => g.append("text")
                                    .attr("dy", "0.25em")
                                    .attr("font-size", this._fontSize.center))
                        },
                        update => set(update, true),
                        exit => exit.remove())
                    .call(g => set(g));

                this._f = false;
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

            _pack(data) {
                const counts = [], w = this._radius.inner * 2;
                const grouped = d3.group(data, d => d.conditionIndex);
                grouped.forEach((value, key) => counts.push({
                    cond: key,
                    count: value.length,
                    color: this._condColors[key].color
                }));

                return d3.pack()
                    .size([w, w])
                    .padding(1)(
                        d3.hierarchy({ children: counts })
                            .sum(d => d.count)
                    );
            }

            _getMonthData(month) {
                return this._chartData.filter(d => d.month === month);
            }
            _getover(d) {
                return d.avg-d.low>d.high-d.avg?d.avg-d.low:d.high-d.avg
            }
        }
        const wheel = new wheelRound(this.svg)
                        .size([diameter, diameter])
                        .data(wheeldata)
                        .labels(labels)
                        // .details(details)
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

<style scoped>
g > text {
    stroke: white;
    fill:none;

}
text > title {
    stroke: black;
    fill:black;
}
</style>