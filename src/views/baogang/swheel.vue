<template>
	<div>
		<div :id="menuId" style="height: 100%;width:100%;"></div>
	</div>
</template>

<script>
import * as d3 from 'd3';
import { Delaunay } from 'd3-delaunay';
import heaticon from "../../assets/images/heatwheel.svg";
import steelicon from "../../assets/images/steel.svg";
import heatwhite from "../../assets/images/heatwhite.svg";
import coolicon from "../../assets/images/coolwheel.svg";
import coolwhite from "../../assets/images/coolwhite.svg";
import rollicon from "../../assets/images/rollwheel.svg";
import rollwhite from "../../assets/images/rollwhite.svg";
import thickicon from "../../assets/images/wheel/thick.svg";
import widthicon from "../../assets/images/wheel/width.svg";
import lengthicon from "../../assets/images/wheel/length.svg";
import upidicon from "../../assets/images/wheel/upid.svg";
import timesvg from "../../assets/images/wheel/timesvg.svg";
import categoryicon from "../../assets/images/wheel/category.svg";
import util from './util.js';
export default {
	data() {
		return {
			menuId: 'wheeling' + Math.random().toString(32).slice(-6),
			svg: undefined,
			data:[],
		}
	},
	methods: {
	paintChart(jsondata,chorddata) {
        const wheeldata = [] , labels = []
        const menuId = this.menuId
        for(let item in jsondata['PCASPE']['xData']){
            labels.push(jsondata['PCASPE']['xData'][item])
            wheeldata.push({
                name:jsondata['PCASPE']['xData'][item],
                PCASPE:jsondata['PCASPE']['sData'][item]?jsondata['PCASPE']['sData'][item]:0,
                PCAT2:jsondata['PCAT2']['sData'][item]?jsondata['PCAT2']['sData'][item]:0,
                outOfGau:jsondata['outOfGau']['sData'][item],
                result_value:jsondata['result'][item]['value'],
                result_low:jsondata['result'][item]['l'],
                result_high:jsondata['result'][item]['u'],
                result_original_l:jsondata['result'][item]['original_l'],
            })
        }
        const details=jsondata['Steel']
        // this.menuId = this.menuId 
        const vm=this
        const diameter = document.getElementById(this.menuId).offsetHeight;	
        const width = document.getElementById(this.menuId).offsetWidth;	
        this.svg !== undefined && this.svg.remove()
        console.log(this.menuId)
		this.svg=d3.select("#"+vm.menuId)
			.append("svg")
			.attr("viewBox", `${-diameter / 2} ${-diameter / 2} ${width} ${diameter}`)
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
                this._half = { width: 0, height: 0 };
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
                this._tempUnit = "°F";
                this._precUnit = "in";
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
                this._padAngle=[
                    [-1/3* Math.PI,1/3* Math.PI],
                    [1/3* Math.PI,Math.PI],
                    [ Math.PI,5/3* Math.PI]
                ];
                this._categoryLimit=[1, 1, 0.6],
                this._linespace=6
            }
            getProcess(_){
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

            temperatureUnit(_) {
                return arguments.length ? (this._tempUnit = _, this) : this._tempUnit;
            }

            precipitationUnit(_) {
                return arguments.length ? (this._precUnit = _, this) : this._precUnit;
            }
            size(_) {
                return arguments.length ? (this._width = _[0], this._height = _[1], this) : [this._width, this._height];
            }
            render() {
                this._init();
                this._process();

                this._g = this._container
                    .append("g")
                    .attr("transform", "translate(18 , 0)");
                // this._initGradients();

                this._renderMainWheel();
                // this._initDynamicParts();
                // this._renderMainWheel();
                // this._showStatistics(this._chartData, this._year);
                return this;
            }
            _init() {
                const r = this._radius;
                
                r.max = Math.min(this._width, this._height) / 2;
                r.inner = r.max * 0.40;
                r.bubble = r.max * 0.2;
                r.outer = r.max - r.bubble *1.1 - r.label;
                const fs = d3.scaleLinear().domain([4, 1024]).range([0, 28]);
                this._fontSize.info = fs(r.max);
                fs.range([8, 36]);
                this._fontSize.center = fs(r.max);
                fs.range([4, 18]);
                this._fontSize.month = this._fontSize.mark = this._fontSize.tick = fs(r.max);
                
                this._half = { width: this._width / 2, height: this._height / 2 };              

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
                this._chartData = this._data.map(d => {
                    const datum = {
                        dateStr: d[field.date],
                        date: d[field.date],
                        month: wm.getProcess(d[field.date]),
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
                    wm._padprocess[wm._processindex[wm.getProcess(d[field.date])]].push(d[field.date])
                    labels.push(datum.dateStr)
                    lows.push(datum.low);
                    highs.push(datum.high);
                    precs.push(datum.precipitation);
                    humis.push(datum.humidity);
                    return datum;
                });
                
                const pad=0*Math.PI;
                const angle = (2*Math.PI - 3 * pad )/this._data.length
                this._dayRadian = (2 * Math.PI- 3 * pad) / this._data.length + Math.PI;
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
            _initDynamicParts() {
                const r = this._radius, half = this._half;

                this._highlight = this._g.append("g")
                    .attr("opacity", 0)
                    .call(g => g.append("path")
                        .attr("class", "highlight")
                        .attr("opacity", 0)
                        // .attr("fill", "grey")
                        .attr("fill", "none")
                        .attr("d", d => this._line(r.inner, r.max - r.label)));

                this._statistics = this._g.append("g")
                    .attr("text-anchor", "middle")            
                    .attr("transform", `translate(${half.width - r.inner - half.width},${half.height - r.inner - half.height})`)
                    .call(g => g.append("circle")
                        .attr("fill", "white")
                        .attr("opacity", 0)
                        .attr("cx", r.inner).attr("cy", r.inner)
                        .attr("r", r.inner))
                    .call(g => g.append("text")
                        .attr("class", "label")
                        .attr("font-size", this._fontSize.center)
                        .attr("fill", "#aaa")
                        .attr("transform", `translate(${r.inner},${r.inner})`)
                        .text(this._year))
                    .on("click", () => {
                        this._yearStat = !this._yearStat;
                        if (this._yearStat)
                            this._showStatistics(this._chartData, this._year);
                        else
                            this._showStatistics(this._getMonthData(this._currMonth), this._months[this._currMonth]);
                    });

                const t = this._texts, c = this._colors;
                this._dailyInfo = this._g.append("g")
                    .style("visibility", "hidden")
                    .attr("class","dailyInfo")
                    .attr("font-size", this._fontSize.info+1 + "pt")
                    .style("font-family", "DIN")
                    // .call(g => t.icon = g.append("image")
                    //     .attr("width", r.inner / 2)
                    //     .attr("opacity", 0.35)
                    //     .attr("transform", `translate(${-r.inner / 1.3},${-r.inner / 4})`))
                    .attr("transform", `translate(${r.max/2},0)`)
                    .call(g => g.append("rect")
                            .attr("x" , -15)
                            .attr("y" , -15)
                            .attr("rx" , 5)
                            .attr("ry", 5)
                            .style("fill","pink")
                            .attr("stroke", "grey")
                            .attr("stroke-width",1)
                            .attr("width", 150)
                            .attr("height", 75))
                    .call(g => g.append("g")                       
                        .call(g => t.date = g.append("text").attr("fill", "black").text("Date: "))
                        // .call(g =>  g.append("line").attr("fill", "black").text("Date: "))
                        .call(g => t.high = g.append("text").attr("y", "1.1em").attr("fill", "black").text("High: "))
                        .call(g => t.low = g.append("text").attr("y", "2.2em").attr("fill", "black").text("Low: "))
                        .call(g => t.avg = g.append("text").attr("y", "3.3em").attr("fill", "black").text("Avg: "))
                        .call(g => t.prec = g.append("text").attr("y", "4.4em").attr("fill", "black").text("Prec.: "))
                        .call(g => t.humidity = g.append("text").attr("y", "5.5em").attr("fill", "black").text("Humidity: ")))
                        .call(g => t.deviation = g.append("text").attr("y", "6.6em").attr("fill", "black").text("Deviation: "));
            }
            _renderMainWheel() {
                this._renderPre();
                this._renderWheelContent();
            }
            _renderPre(){
                const defs =this._g.append("defs");
                const filter=defs.append("filter")
                    .attr("id","shadow-filter")
                    .attr("x", "-5%")
                    .attr("y", "-5%")  
                    .attr("width", "110%")
                    .attr("height", "110%")
                    .attr("filterUnits", "objectBoundingBox");
                filter
                .call(g =>g.append("feOffset")
                    .attr("result", "shadowOffsetOuter1")
                    .attr("in", "SourceAlpha")
                    .attr("dx","0")
                    .attr("dy", "0.5")
                    .attr("flood-color", "#bebebe"))
                .call(g =>g.append("feGaussianBlur")
                    .attr("result", "shadowBlurOuter1")
                    .attr("in", "shadowOffsetOuter1")
                    .attr("stdDeviation","0.5"))
                .call(g =>g.append("feBlend")
                    .attr("values", "0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.2 0")
                    .attr("in", "shadowBlurOuter1")
                    .attr("mode","normal")
                    .attr("type", "matrix")
                    .attr("result", "shadowMatrixOuter1"))
                const feMerge = filter.append("feMerge");
                feMerge
                    .call(g => g.append("feMergeNode")
                        .attr("in", "shadowMatrixOuter1"))
                    .call(g => g.append("feMergeNode")
                        .attr("in", "SourceGraphic"))
                // const filter=defs.append("filter")
                //                 .attr("id","filter")
                //                 .attr("x", "0")
                //                 .attr("y", "0")
                //                 .attr("width", "200%")
                //                 .attr("height", "200%");
                // filter
                // .call(g =>g.append("feOffset")
                //     .attr("result", "offOut")
                //     .attr("in", "SourceGraphic")
                //     .attr("dx","2.5")
                //     .attr("dy", "2.5"))
                // .call(g =>g.append("feGaussianBlur")
                //     .attr("result", "blurOut")
                //     .attr("in", "offOut")
                //     .attr("stdDeviation","2"))
                // .call(g =>g.append("feBlend")
                //     .attr("in2", "blurOut")
                //     .attr("in", "SourceGraphic")
                //     .attr("mode","normal"))
            }
            _renderWheelContent() {
                const r = this._radius,
                    c = this._colors,
                    lc =this._labelcolor,
                    a = this._padAngle,
                    xpad = this._xpad,
                    v = (this._dayRadian-Math.PI)/2,
                    icon = [heaticon , rollicon , coolicon],
                    iconwhite = [heatwhite , rollwhite , coolwhite],
                    piearc = d3.arc()
                        .innerRadius(0)
                        .outerRadius(r.bubble * 0.12),
                    outrate = (item1 , item2) => {
                        return d => (d.humidity>1.5|d.precipitation>1.5) ? item1 : item2
                    },
                    titleinfo = ["upid" , "toc" , "cate", "p_thick", "p_wid", "p_len", "s_thick", "s_wid", "s_len"],
                    titleicon=[upidicon,timesvg,categoryicon,thickicon,widthicon,lengthicon,thickicon,widthicon,lengthicon],
                    graph={nodes:[],links:[]},
                    wm=this,
                    colorLinear1=[],
                    colorLinear2=[];
                    const sortdata=d3.filter(this._chartData, d => d.humidity>1.5|d.precipitation>1.5);
                    const SPE=d3.sort(sortdata,d=>d.precipitation),
                        T2=d3.sort(sortdata,d=>d.humidity),
                        res=d3.sort(sortdata,d=>d.deviation);
                    this._g.attr("class","wheelg")
                    for (let item in SPE){
                        let query=SPE[item].dateStr                     
                        SPE[item].order=+item+1+(+T2.findIndex((value, index, arr)=> value.dateStr===query))+1+(+res.findIndex((value, index, arr)=> value.dateStr===query))+1
                    }
                    const sample=d3.sort(SPE,d=>d.order);
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
                                .attr("stroke",d => d.humidity>1.5|d.precipitation>1.5|d.low>d.value|d.high<d.value ? d3.color(lck).darker(colorlinear1(d.precipitation)+2) :daker)
                                .attr("opacity", 1)
                            d3.selectAll("#" +menuId + " .humidity"+key)
                                .attr("stroke",d => d.humidity>1.5|d.precipitation>1.5|d.low>d.value|d.high<d.value ? d3.color(lck).darker(colorlinear2(d.humidity)+2) :daker)
                                .attr("opacity", 1)
                            d3.selectAll("#" +menuId + " .lead"+key )
                                .attr("stroke-width", outrate(1.5,0.5))
                                .attr("opacity", 0.4)
                            d3.selectAll("#" +menuId + " .linestart")
                                .attr("y1", d => d.humidity>1.5|d.precipitation>1.5|d.low>d.value|d.high<d.value ? this._y(d.avg)+3.5 : this._y(d.avg)+2)
                            d3.selectAll("#" +menuId + " .linecurve")
                                .attr("y2", d => d.humidity>1.5|d.precipitation>1.5|d.low>d.value|d.high<d.value ? this._y(d.avg)-3.5 : this._y(d.avg)-2)
                            d3.selectAll("#" +menuId + " .textname" + key)
                                .attr("font-weight", "bold")
                                .attr("opacity" , 1)
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
                            d3.selectAll("#" +menuId + " .textname" + key)
                                .attr("font-weight", "normal")
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
                            .style("visibility", outrate("visible" , "hidden" ))
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
                            .style("visibility", outrate("visible" , "hidden" ))
                            .attr("y1", d => r.outer+r.bubble*1.10)
                            .attr("y2", d => r.outer+r.bubble*1.20)
                            .attr("stroke", line_stroke)
                            .attr("stroke-width", outrate(1,0.5))
                            .attr("opacity", 0.4))
                        // .call(g => g.append("text")
                        //     .attr("class",d => "textname" + key)
                        //     .attr("id",d => "name" + d.dateStr)
                        //     .attr("transform", d => xpad[key](d.date)>0 & xpad[key](d.date)<Math.PI ? `rotate(${90.5})` : `rotate(${-90.5})`)
                        //     .style("visibility", outrate("visible" , "hidden" ))
                        //     .attr("x", d => xpad[key](d.date)>0 & xpad[key](d.date)<Math.PI ? r.outer+r.bubble*1.50 : -(r.outer+r.bubble*1.50))
                        //     .style("font-family", "Optima")
                        //     .style("padding", "1px")
                        //     .attr("font-size", "6pt")
                        //     .attr("font-weight", "normal")
                        //     .style("text-anchor", d => xpad[key](d.date)>0 & xpad[key](d.date)< Math.PI ? "start" : "end")
                        //     .text(d=>d.dateStr)
                        //     .attr("fill", daker)
                        //     .attr("stroke", "none"))
                            )
                    .call(g => g.append("image")    //icon
                            .attr("class", "icon")
                            .attr("id", "icon"+key)
                            .attr("width", "12px")
                            .attr("height","12px")
                            .attr("transform", (d , i) => `rotate(${(this._padAngle[key][0] + this._padAngle[key][1])/2 * 180 / Math.PI - 5.8})`)
                            .attr("y",-r.inner*1)
                            .attr("href", icon[key]))
                    if(+key === 2){
                        d3.select("#" +menuId + " #icon"+key)
                            .attr("width", "30px")
                            .attr("height","30px")
                            .attr("transform", (d , i) => `rotate(${(this._padAngle[key][0] + this._padAngle[key][1])/2 * 180 / Math.PI - 13.8})`)
                            .attr("y", "-4.1em")
                    }                        

                    for (let item in processdata){
                        const pindex=processdata[item];
                        if(pindex.humidity<1.5&&pindex.precipitation<1.5)continue
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
                            .attr("fill", (d,i) => ((+d.data.value)>1.5? lck : "white"))
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
                    const seriesdata=processdata.filter(outrate(true,false))
                    for (let item in seriesdata){
                        let index = chorddata['label'].indexOf(seriesdata[item].dateStr),targets=[],id=seriesdata[item].dateStr;
                        for (let target =item+1;target < seriesdata.length ;target++){
                            if(chorddata['corr'][item][target]<1&&chorddata['corr'][item][target]>0){
                                targets.push(seriesdata[target].dateStr)
                                graph.links.push({'source':id,'target':seriesdata[target].dateStr,value:1})
                            }
                        }
                        graph.nodes.push({'id':id,'group':key,'targets':targets})
                    }
                }
                // d3.xml("../../assets/images/heat.svg")
                // .then(data => {
                //     console.log(data)
                //     this._g.node().append(data.documentElement)
                // });

                // var myimg = require('./b_icon__fire.png')
                // console.log(myimg)
                // var img = document.createElement("img");
                // // img.src = "b_icon__fire.png";
                // img.src = myimg
                // // src = getElementById("gamediv");
                // var src = document.getElementById("gamediv");
                // src.appendChild(img)                  
                // console.log(src)
                
                // d3.selectAll(".circle_color").raise()
                // d3.selectAll(".steelcircle").lower()
                const initial = 40;
                const barrect = [initial, 125];
                const length=d3.scaleLinear()
                        .domain([0,51.5])
                        .range(barrect);
                const width=d3.scaleLinear()
                        .domain([1.32,4.82])
                        .range(barrect);
                const thickness=d3.scaleLinear()
                        .domain([0.001,0.230])
                        .range(barrect)
                const sthickness=d3.scaleLinear()
                        .domain([100 , 600])
                        .range(barrect);
                const swidth=d3.scaleLinear()
                        .domain([1300 , 2300])
                        .range(barrect)
                const slength=d3.scaleLinear()
                        .domain([1520 , 5800])
                        .range(barrect);
                const widthScale =  [0 ,0 ,0 ,thickness(this._details['steel'][3]) ,width(this._details['steel'][4]) ,length(this._details['steel'][5])  ,
                    sthickness(this._details['steel'][6]) , swidth(this._details['steel'][7]) , slength(this._details['steel'][8])]
                const position =[r.max+r.bubble*2.2 + 20 , -80];
                if(this._details['steel'][2].length > 5)[this._details['steel'][1] , this._details['steel'][2]] = [this._details['steel'][2].slice(2) , this._details['steel'][1]];
                this._g
                    .call(g => g.append("rect")
                            .attr("transform",`translate(${position})`)
                            .attr("x" , -18)
                            .attr("y", -20)
                            .attr("rx" , 2)
                            .attr("ry", 2)
                            .style("fill","white")
                            .attr("stroke", "#ababab")
                            .attr("stroke-width",1)
                            .attr("width", r.bubble*3.2 + 158)
                            .attr("height", 200)
                            // .attr("box-shadow" , "0 0 20px rgba(0, 0, 0, 0.1)")
                            .attr("filter","url(#shadow-filter)")
                            // .attr("filter" , "drop-shadow(-25px 25px 25px rgba(26,58,70,0.7))")
                        )
                    .call(g => g.append("line")
                            .attr("transform",`translate(${[position[0] - 53 , 0]})`)
                            .attr("x1" , 0)
                            .attr("y1", -110)
                            .attr("y2", 110)
                            .attr("stroke", "#ababab")
                            .attr("stroke-width" , 1.25))
                    .call(g => g.append("line")
                            .attr("transform",`translate(${[position[0] + 75 , 0]})`)
                            .attr("x1" , 0)
                            .attr("y1", -94)
                            .attr("y2", 90)
                            .attr("stroke", "#e3e3e3")
                            .attr("stroke-width" , 1.5))
                    .call(g => g.selectAll("#" +menuId + " .steel_text").data(titleinfo).join("g")
                        .attr("transform", (d , i) => `translate(${position})`)
                        .call(g => g.append("rect")
                            .attr("x" , -8.5)
                            .attr("y", (d,i)=> i*16.5-12)
                            .style("fill","none")
                            .attr("stroke", "none")
                            // .attr("stroke", "grey")
                            .attr("stroke-width",0.5)
                            .attr("width", r.bubble*1.2+4.5)
                            .attr("height", 16)
                        )
                        .call(g => g.append("image")    //titleicon
                            .attr("width", 17.5)
                            .attr("height", 17.5)
                            .attr("x" , - 6)
                            .attr("y",(d,i)=> i* 20.5 -12)
                            .attr("href",(d,i) => titleicon[i]))
                        .call(g => g.append("text")
                            .attr("y", (d,i)=> i * 20.5)
                            .attr("font-size", "10pt")
                            .attr("font-weight", "normal")
                            .style("font-family", "DIN")
                            // .attr("x" , r.bubble*0.5 + 26)
                            .attr("x" , r.bubble*0.5 + 4 )
                            .text((d , i)=> d.toUpperCase())
                            .attr("fill", d3.color("grey").darker(0.9))
                            .attr("stroke", "none")
                            // .attr("text-anchor", "middle")
                        )
                        .call(g => g.append("rect")
                            .attr("x" , r.bubble*1.2)
                            .attr("y", (d,i)=> i*16.5-12)
                            .style("fill","none")
                            // .attr("rx" , 2)
                            // .attr("ry" , 2)
                            // .attr("stroke", "grey")
                            .attr("stroke", "none")
                            .attr("stroke-width",0.5)
                            .attr("width", r.bubble*2)
                            .attr("height", 16)
                        )
                        .call(g => g.append("rect")
                            .attr("x" , 83)
                            .attr("y", (d,i)=> i * 20.5 - 12)
                            .attr("rx" , 2)
                            .attr("ry" , 2)
                            .style("fill","pink")
                            .attr("stroke", "none")
                            .attr("stroke-width",0.25)
                            .attr("width", (d , i) => widthScale[i])
                            .attr("height", 16)
                        )
                        .call(g => g.append("line")
                            .attr("transform", (d,i) => `translate(${[0 , i * 20.5 + 6]})`)
                            .attr("x1" , -15)
                            .attr("x2" , 200)
                            .attr("y1", 0)
                            .attr("stroke", (d,i) => i !== titleinfo.length-1 ? "#e3e3e3" :"none")
                            .attr("stroke-width" , 0.75))
                        .call(g => g.append("text")
                            .attr("x", 90)
                            .attr("y", (d,i)=> i*20.5)
                            .attr("font-size", "10pt")
                            .attr("font-weight", "normal")
                            .style("font-family", "DIN")
                            .text((d , i) => i>=3 ? (this._details['steel'][i]<1 ? this._details['steel'][i].toFixed(3) +' m' : this._details['steel'][i].toFixed(1) +' m' ): this._details['steel'][i])
                            .attr("fill", d3.color("grey").darker(0.5))
                            .attr("stroke", "none")
                        ))

                const radius = r.outer*1.115,
                    colornone = "#ccc",
                    colorout = "#f00",
                    colorin = "#00f";
                const svg=d3.select("#" +menuId + " .wheelg").append("g")
                        .attr("transform",`rotate(${-60})`);
                    const tree = d3.cluster()
                        .size([2 * Math.PI, r.inner*0.8])
                    const line = d3.lineRadial()
                        .curve(d3.curveBundle.beta(1.25))
                        // .curve(d3.curveNatural)
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
                        // .append("text")
                        //     .attr("dy", "0.11em")
                        //     .attr("x", d => d.x < Math.PI ? 6 : -6)
                        //     .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
                        //     .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
                        //     // .text(d => d.data.id)
                        //     .text('1')
                        //     .each(function(d) { d.text = this; })
                        //     .on("mouseover", overed)
                        //     .on("mouseout", outed)
                        //     .call(text => text.append("title").text(d => `${d.data.id}
                        // ${d.outgoing.length} outgoing
                        // ${d.incoming.length} incoming`));
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
                        // d3.selectAll(d.incoming.map(([d]) => d.text)).attr("fill", colorin).attr("font-weight", "bold");
                        d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", highlightcolor).raise();
                        // d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr("fill", colorout).attr("font-weight", "bold");
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
                        // d3.selectAll(d.incoming.map(([d]) => d.text)).attr("fill", null).attr("font-weight", null);
                        d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", labelcolor);
                        // d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr("fill", null).attr("font-weight", null);
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
                            .attr("stroke",d => d.humidity>1.5|d.precipitation>1.5|d.low>d.value|d.high<d.value ? d3.color(lck).darker(colorLinear1[key](d.precipitation)+2) :daker)
                            .attr("opacity", 1)
                        d3.select("#" +menuId + " #humidity"+name)
                            .attr("stroke",d=> d => d.humidity>1.5|d.precipitation>1.5|d.low>d.value|d.high<d.value ? d3.color(lck).darker(colorLinear2[key](d.humidity)+2) :daker)
                            .attr("opacity", 1)
                        d3.selectAll("#" +menuId + " .line"+name)
                            .attr("stroke",d3.color(lck).darker(4))
                        d3.selectAll("#" +menuId + " .line" + name)
                            .attr("stroke-width", 1.5)
                            .attr("opacity", 0.4)
                        d3.selectAll("#" +menuId + " #textline" + name)
                            .style("visibility", "visible")
                            .attr("y2", outrate(r.outer+r.bubble*1.20,r.outer+r.bubble*1.50))
                        d3.selectAll("#" +menuId + " #linestart"+ name)
                            .attr("y1", d => wm._y(d.avg)+3.5 )
                        d3.selectAll("#" +menuId + " #linecurve" + name)
                            .attr("y2", d =>  wm._y(d.avg)-3.5)
                        d3.selectAll("#" +menuId + " #name" + name)
                            .attr("font-weight", "bold")
                            .style("visibility", "visible")
                            .attr("opacity" , 1)
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
                            .style("visibility", outrate("visible" , "hidden" ))
                            .attr("y2", r.outer+r.bubble*1.20)
                        d3.selectAll("#" +menuId + " #linestart"+ name)
                            .attr("y1", d =>  wm._y(d.avg)+2)
                        d3.selectAll("#" +menuId + " #linecurve" + name)
                            .attr("y2", d =>  wm._y(d.avg)-3.5)
                        d3.selectAll("#" +menuId + " #name" + name)
                            .attr("font-weight", "normal")
                            .style("visibility", d => d.humidity>1.5|d.precipitation>1.5 ? "visible" : "hidden")
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
                                .attr("opacity", 0.5)
                            d3.selectAll("#" +menuId + " .textname" + i)
                                .attr("opacity" , 1)
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
                            d3.selectAll("#" +menuId + " .textname" + i)
                                .attr("opacity" , 0.5)
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
                                    .attr("filter","url(#shadow-filter)")
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
            _category(d){
                let flag=0;
                d.humidity>this._categoryLimit[0] ? flag+=1 : flag;
                d.precipitation>this._categoryLimit[1] ? flag+=1 :flag;
                (d.avg-d.low>d.high-d.avg ? d.avg-d.low : d.high-d.avg) >this._categoryLimit[2]*0.6 ? flag+=1 :flag;
                return flag
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
                        .size([width, diameter])
                        .data(wheeldata)
                        .labels(labels)
                        .details(details)
                        .render();
	},
	},
	mounted() {
	},
	computed:{
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