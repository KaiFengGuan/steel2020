<template>
	<div>
		<div :id="menuId" style="height: 100%;width:100%;"></div>
	</div>
</template>

<script>
import * as d3 from 'd3';
import heaticon from "../../assets/images/heatwheel.svg";
import heatwhite from "../../assets/images/heatwhite.svg";
import coolicon from "../../assets/images/coolwheel.svg";
import coolwhite from "../../assets/images/coolwhite.svg";
import rollicon from "../../assets/images/rollwheel.svg";
import rollwhite from "../../assets/images/rollwhite.svg";
import mergeLabel from "../../assets/images/mergeLabel.svg";
import deMergeLabel from "../../assets/images/deMergeLabel.svg"
import util from './util.js';
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
                    this._xpad=null; //pad scale
                    this._y = null; // temperature scale
                    this._ac = null;// avg color scale
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

                    this._process=[
                        ["ave_temp_entry_pre","temp_uniformity_entry_pre", "sur_temp_entry_pre", 
                            "center_temp_entry_pre", "skid_temp_entry_pre", "ave_temp_pre", "staying_time_pre", "ave_temp_entry_1",
                            "temp_uniformity_entry_1", "sur_temp_entry_1", "center_temp_entry_1", "skid_temp_entry_1", "ave_temp_1",
                            "staying_time_1", "ave_temp_entry_2", "temp_uniformity_entry_2", "sur_temp_entry_2", "center_temp_entry_2", 
                            "skid_temp_entry_2", "ave_temp_2", "staying_time_2", "ave_temp_entry_soak", "temp_uniformity_entry_soak",
                            "sur_temp_entry_soak", "center_temp_entry_soak", "skid_temp_entry_soak", "ave_temp_soak", "staying_time_soak",
                            "ave_temp_dis", "temp_uniformity_dis", "sur_temp_dis", "center_temp_dis", "skid_temp_dis", "t_0", "t_1", "t_2", "t_3", "t_4", "t_5", "t_6"
                        ],
                        ['topwrplatecountfm','topwrplatecountrm','topbrplatecountfm','topbrplatecountrm','botbrplatecountfm',
                            'botbrplatecountrm','botwrplatecountfm','botwrplatecountrm','crownbody','crowntotal',
                            'devcrownbody','devcrowntotal','devthicknesscentertotal','devthicknessclosetotal',
                            'devwedgebody','devwedgetotal','maxcrownbody','maxcrowntotal','maxthicknesscentertotal',
                            'maxthicknessclosetotal','maxwedgebody','maxwedgetotal','mincrownbody','mincrowntotal',
                            'minthicknesscentertotal','minthicknessclosebody','minthicknessclosehead','minthicknessclosetotal',
                            'minwedgetotal','ratiolpls','thicknesscenterbody','thicknesscenterhead','thicknesscentertotal',
                            'thicknessclosebody','thicknessclosehead','thicknessclosetotal','wedgebody','wedgetotal'
                        ],
                        ['avg_p1','std_p1','max_p1','min_p1','avg_p2','std_p2','max_p2','min_p2','avg_sct','std_sct',
                            'max_sct','min_sct','avg_fct','std_fct','max_fct','min_fct','avg_p5','std_p5','max_p5','min_p5',
                            'avg_cr_cal','std_cr_cal','max_cr_cal','min_cr_cal','avg_cr_act','std_cr_act','max_cr_act',
                            'min_cr_act','avg_time_b','std_time_b','max_time_b','min_time_b','avg_time_w','std_time_w',
                            'max_time_w','min_time_w','avg_time_a','std_time_a','max_time_a','min_time_a','speed_ratio',
                            'last_water_temp','last_air_temp','fqc_label'
                        ]
                    ];
                    this._padprocess=[[],[],[]];
                    this._processindex=["heat", "roll", "cool"];
                    this._labelcolor={
                        index:'steelblue',
                        0:'#fcd8a9',
                        1:'#cce9c7',
                        2: "#c1c9ee",
                        // 2:'#b3cee2'
                    };
                    this._padAngle=[];
                    this._linespace=6;
                    this._merge = true;
                    this._horizonView = false;
                    this._indexdata = [];
                    this._indexInfo = [];
                    this._indexlength = 6;
                    this._allIndex = [];    //index name
                    this._rectArray = null;
                    this._indexScale = undefined;
                    this._mouseDis  = undefined;
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
                _initdata() {
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
                        labels.push(datum.dateStr)
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
                            dateStr: d[field.date],
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
                        wm._padprocess[wm.getIndex(datum.dateStr)].push(datum.dateStr)
                        labels.push(datum.dateStr)
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
                    var r = this._radius,
                        R = r.outer+r.bubble*1.05,
                        wm = this,
                        lc =this._labelcolor,
                        limit = 0.3,
                        xpad = this._xpad,
                        v = (this._dayRadian-Math.PI)/2,
                        RectWidth = 400,
                        rectX = r.outer+r.bubble* 5.4,  //rect_doct x
                        maxBarHeight = 20,  // river max height
                        maxHeight = maxBarHeight + 5,   //rect max height
                        indexSpace = 5,
                        indexPadding = 4,
                        rectNum = Math.floor((this._height - 50)/(maxHeight + indexSpace)),
                        selectInfo = this._indexInfo.slice(0, this._indexInfo.length > rectNum ? rectNum : this._indexInfo.length),
                        indexArray = d3.map(selectInfo, (d, i) => i),
                        indexSort = d3.map(selectInfo, d => d.dateStr),
                        indexScale = d3.scaleOrdinal().domain(indexArray).range(indexArray),
                        rectY = this._indexInfo.length > rectNum ? i => (this._height - 50)/rectNum * (indexScale(i) + 0.5) + 25 - this._height/2 : i => (this._height - 50)/this._indexInfo.length * (indexScale(i) + 0.5) + 25,
                        rectYLocation = this._indexInfo.length > rectNum ? (new Array(rectNum).fill(1)).map((d, i) => rectY(i)) : (new Array(this._indexInfo.length).fill(1)).map((d, i) => rectY(i)),
                        mainG = this._g.append("g").attr("class", "mainG"),
                        startXY = d => [R * (Math.sin(xpad[d.month](d.date)+ v)), -R * Math.cos(Math.abs(xpad[d.month](d.date)+ v))],
                        centerScaleY = d => startXY(d)[1] + 25/startXY(d)[0] * startXY(d)[1],
                        lastY = rectY(indexArray[indexArray.length - 1])  + maxHeight/2;
                        var pieAngle = d3.pie()
                                .value(d => d.angle)
                                .startAngle(0.5* Math.PI)
                                .endAngle(2.5 * Math.PI),
                            piearc = d3.arc()
                                .innerRadius(0)
                                .outerRadius(r.bubble * 0.16),
                            line = d3.line()
                                .x(e => e[0])
                                .y(e => e[1])
                                .curve(d3.curveLinear),
                            lineToCircle = d =>{
                                let [startX, startY] = startXY(d),
                                centerY = centerScaleY(d);
                                return [[startX, startY], [startX + 25, centerY], [rectX - 105, centerY]]
                            },
                            lineToRect = (d, i) =>{
                                let centerY = centerScaleY(d),
                                    endY = rectY(+i) + maxHeight/2;
                                return [[rectX - 75, centerY],[rectX - 60, centerY], [rectX - maxHeight, endY], [rectX , endY], [rectX + RectWidth, endY]]
                            },
                            lineG = mainG.append("g").attr("class", "lineG");
                        lineG.selectAll("g").data(selectInfo).join("g")
                            .call(g => g.append("path")
                                .attr("stroke", d => d3.color(lc[d.month]).darker(0.5))
                                .datum(lineToCircle)
                                .attr("d", d => line(d))
                                // .attr("opacity", 0.6)
                                .attr("stroke-width", 1)
                                .attr("fill", "none"))
                            .call(g => g.append("circle")
                                    // .attr("class", d => `arctext${d.month}`)
                                    // .attr("id", d => `arctext${d.date}`)
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
                                .text(d => d.dateStr.replace(/thickness/, "").replace(/temp_uniformity_/, "").replace(/wedge/, "").slice(0, 8))
                                .attr("transform", d => `translate(${[rectX - 90, centerScaleY(d) + 2]})`))
                            .call(g => g.append("path")
                                .attr("class", "lineToRect")
                                .attr("stroke", d => d3.color(lc[d.month]).darker(0.5))
                                .attr("d", (d, i) => line(lineToRect(d, i)))
                                // .attr("opacity", 0.6)
                                .attr("stroke-width", 1)
                                .attr("fill", "none"))
                        for(let item in selectInfo){
                            const pindex = selectInfo[item],
                                xkey = pindex.month;
                                let [startX, startY] = startXY(pindex),
                                    centerY = startY + 25/startX * startY;
                                let piedata = pieAngle(pindex.property)
                                let g = lineG.selectAll(" .pie"+pindex.date)
                                    .data(piedata).enter()
                                    .append("g")
                                    .attr("transform", `translate(${[rectX - 125, centerY]})`);
                                g.append("path")
                                    .attr("class", `arcpie`+xkey +' pie'+ pindex.date)
                                    .attr("d", piearc)
                                    .attr("fill", (d,i) => ((+d.data.value)>limit? lc[xkey] : "white"))
                                    .style("stroke", d3.color(lc[xkey]).darker(2))
                                    .style('stroke-width', 0.25)
                                    .attr("opacity", 1)
                        }
                        var sliderG = mainG.append("g")
                            .attr("class", "sliderG")
                            .attr("transform", `translate(${[rectX, 0]})`)
                        var maxLength = 5,  //batch numbers
                            minRect = RectWidth/ (maxLength + 0.5),
                            rectArray = this._rectArray ? this._rectArray : new Array(maxLength).fill(minRect).map((d, i) => Math.ceil(maxLength/2) == i + 1 ? 1.5 * d : d),   //batch position
                            rectPosition = Array.from(d3.cumsum(rectArray));
                            this._rectArray = rectArray;
                        sliderG.append("g")		//area drag
                            .selectAll("g")
                            .data(Object.keys(rectPosition).map(d => +d).slice(0, -1)).join("g")
                            .attr("class", "dragG")
                            .attr("transform", d => `translate(${[rectPosition[d], 0]})`)
                            .call(g => g
                                .call(g => g.selectAll("g")
                                    .data(Object.keys(selectInfo))
                                    .join("g")
                                    .attr("transform", (d, i) => `translate(${[0 , rectY(i) + maxHeight/2]})`)
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
                                    .on('drag', drag)
                                ))
                        var sliderData = this._sliderArray(selectInfo),
                            horizenEX = (new Array(maxLength).fill(0))
                            .map((d, i) => wm._deepCopy(sliderData).map((e, f) =>{ 
                                    var temp = e.map(f => {
                                        f.i = i;
                                        // f.over = f.h >= f.value && f.value >= f.l ? 0 : (f.h >= f.value ? f.value - f.l : f.h - f.value);
                                        return f
                                    })
                                    temp.i = i;
                                    temp.d = f;
                                    return temp
                                }
                            )),
                            overlap = 3,    //horizen layer
                            overlaps = Array.from({length: overlap * 2} , (_, i) => Object.assign({index: i < overlap ? -i - 1: i - overlap})),     //horizen layer index
                            overlapNum = [-1, -2, -3, 0, 1, 2],
                            horizenColor = i => {
                                return ["#e34649", "#f7a8a9", "#fcdcdc", "#f7f7f7", "#fcdcdc","#f7a8a9", "#e34649"][i + (i >= 0) + overlap]
                            },
                            timeScale;
                            //https://observablehq.com/d/d503153fbfd48b03
                        var areaParameter = (array, data) => {	//area function
                            let xBatch = array.map((d, i) => {
                                let l = array[i],
                                    scale = d3.scaleLinear()
                                        .range([0, l])
                                        .domain(d3.extent(data[i][0], (e, f)=> e.time));
                                return scale
                            });
                            let yBatch = d3.scaleLinear()
                                .range([ 0, maxBarHeight ])
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
                            return [xBatch, mergeArea, mergeLine, mergeLocation]
                        }
                        var horizenParameter = (array, data) => {	//horizen function
                            let xBatch = array.map((d, i) => {
                                    let l = array[i],
                                        scale = d3.scaleTime()
                                            .range([0, l])
                                            .domain(d3.extent(data[i][0], (e, f)=> e.time));
                                    return scale
                                }),
                                yBatch = d3.scaleLinear()
                                    .range([ - maxHeight * overlap , maxHeight * overlap ])
                                    .domain([-1, 1]),
                                horizenArea = d3.area()
                                    .curve(d3.curveBasis)
                                    .x(d => xBatch[d.i](d.time))
                                    .y0(0)
                                    .y1((d, i) => -yBatch(d.over));
                            return [xBatch, horizenArea]
                        }
                        if(wm._horizonView){
                            var [batchTimeScale, mergeArea, mergeLine, mergeLocation] = areaParameter(rectArray, horizenEX);
                            timeScale = batchTimeScale;
                            sliderG.selectAll(".batchG").data(rectPosition)
                                .join("g")
                                .attr("class", "batchG")
                                .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`)
                                .call( g => g.selectAll("g")
                                    .data((d, i) => horizenEX[i])
                                    .join("g")
                                    .attr("class", "selectG")
                                    .attr("transform", (d, i) =>`translate(${[0, rectY(i) + maxHeight/2]})`)
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
                                    ;
                            initAxisG(batchTimeScale)
                        }else{
                            var [batchTimeScale, horizenArea] = horizenParameter(rectArray, horizenEX)
                            timeScale = batchTimeScale;
                            sliderG.selectAll(".horizenG").data(rectPosition)
                            .join("g")
                                .attr("class", "horizenG")
                                .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], 0]})`)
                                .call(g => g.selectAll("g")
                                    .data((d, i) => horizenEX[i])
                                    .join("g")
                                    .attr("class", "hozenG")
                                    .attr("transform", (d, i) =>`translate(${[0, rectY(i) - maxHeight/2 ]})`)
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
                            initAxisG(batchTimeScale)
                        }
                        var pathG = mainG.append("g").attr("class", "pathG");
                        pathG
                            .attr("transform", `translate(${[rectX- maxHeight, 0]})`)
                            .selectAll("g").data(selectInfo).join("g")
                            .attr("transform", (d, i) =>`translate(${[0, rectY(i) - maxHeight/2]})`)
                            .call(g => g.append("rect")
                                .attr("height", maxHeight)
                                .attr("width", maxHeight)
                                // .attr("stroke", "grey")
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
                        var mouseInfo = this._mouseDis !== undefined ? mouseLocation(this._mouseDis) : undefined;
                        sliderG.append("line")
                            .attr("class", "mouseG")
                            .attr("y1", rectY(0) - maxHeight/2)
                            .attr("y2", lastY)
                            .attr("transform", (d, i) =>`translate(${[mouseInfo !==undefined ? this._mouseDis : 0, 0]})`)
                            .attr("stroke", mouseInfo !==undefined ? "#bbbcbd" : "none")
                            .attr("stroke-width", 0.25)
                            // .attr("stroke-dasharray", "2,2")
                        sliderG.selectAll("textG").data(Object.keys(selectInfo)).join("text")
                            .attr("class", "textG")
                            .attr("transform", d =>`translate(${[mouseInfo !==undefined ? this._mouseDis - 10 : 0, rectY(d) ]})`)
                                .text(d => mouseInfo !==undefined ? (+mouseInfo[d]).toFixed(2) : "")
                                .attr("fill", "black")
                        sliderG.on("mousemove", (e, d) => {
                            let mouseDis = e.offsetX - rectX;//mouse distance
                            if(mouseDis <= 0)return
                            sliderG.select(".mouseG")
                                .attr("transform", (d, i) =>`translate(${[mouseDis, 0]})`)
                                .attr("stroke", "#bbbcbd")
                            var mouseInfo = mouseLocation(mouseDis);
                            sliderG.selectAll(".textG")
                                .attr("transform", d =>`translate(${[mouseDis - 10, rectY(d) ]})`)
                                .text(d => (+mouseInfo[d]).toFixed(2))
                            this._mouseDis = mouseDis;
                        })
                        .on("click", function(e, d){
                            let index = d3.leastIndex(rectYLocation, d => e.offsetY - wm._height/2 > d);
                            console.log(e.offsetY - wm._height/2)
                            console.log(index)
                            console.log(d3.scaleOrdinal(indexScale.range(), indexScale.domain())(index))
                            console.log(rectYLocation)
                            console.log(e)
                        })
                        if(this._rectArray.some(d => d === maxBarHeight + 5))renderRectG()
                        function mouseLocation(dis){
                            let sumsearch = d3.leastIndex(rectPosition, d => dis > d),
                                indexsearch = sumsearch === 0 ? dis : dis - rectPosition[sumsearch],
                                mouseDate = new Date(timeScale[sumsearch].invert(indexsearch)),
                                mouseInfo = horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time)[wm._horizonView ? "ovalue" : "ovalue"]);
                                console.log(mouseInfo)
                            return mouseInfo
                        }
                        function infoArea(arr, index, flag){
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
                        function drag(e, d){    //update batch
                            rectPosition[d] = e.x
                            rectPosition = Array.from(rectPosition);
                            rectPosition.unshift(0);
                            var rectlength = d3.pairs(rectPosition, (a, b) => b -a).filter((d, i) => i + 1 !== Math.ceil(maxLength/2));
                            if(!rectlength.every(d => d > maxBarHeight)){   //RectWidth/ maxLength/2
                                minRect = maxBarHeight + 5
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
                            if(wm._horizonView){
                                let [batchTimeScale, mergeArea, mergeLine, mergeLocation] = areaParameter(rectArray, horizenEX);
                                timeScale = batchTimeScale;
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
                                // sliderG.selectAll(".axisG")
                                //     .transition(d3.transition()
                                //         .duration(200)
                                //         .ease(d3.easeLinear))
                                //     .attr("transform", (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ], lastY]})`)
                                //     .each(function(d,i) {
                                //         d3.select(this)
                                //         .call(d3.axisBottom(batchTimeScale[i])
                                //             .ticks(rectArray[i] < 60 ? 1 : 3)
                                //             .tickFormat((d, i) => i === 0 ? d3.timeFormat("%d %H:%M")(d) : d3.timeFormat("%d %H:%M")(d))
                                //             .tickSize(2)
                                //             .tickPadding(2.5)
                                //         )
                                //     })                            
                            }else{
                                var [batchTimeScale, horizenArea] = horizenParameter(rectArray, horizenEX)
                                timeScale = batchTimeScale;
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
                            renderAxisG(timeScale)
                            wm._rectArray = rectArray;
                            minRect !== maxBarHeight + 5 ? sliderG.selectAll(".rectG").remove() : renderRectG();
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
                                    .attr("transform", (d, i) =>`translate(${[0, rectY(i) - maxHeight/2]})`)
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
                        let tempsort = d3.map(d3.sort(selectInfo, d => -d.humidity), d => d.dateStr),
                            sortArray = d3.map(indexSort, d => tempsort.indexOf(d)),
                            totalSort = d3.map(this._sort(selectInfo, d => -d.humidity), d => d.dateStr),
                            totalArray = d3.map(indexSort, d => totalSort.indexOf(d));
                        var scaleArray = [indexScale, d3.scaleOrdinal().domain(indexArray).range(sortArray), d3.scaleOrdinal().domain(indexArray).range(totalArray)];
                        indexScale = this._indexScale !== undefined ? scaleArray[this._indexScale] : scaleArray[0];
                        let sortG = mainG.append("g")
                                .attr("class", "sortG"),
                            sortColor = "#678fba",
                            sortChange = (value1, value2) => d => d === (this._indexScale !== undefined ? this._indexScale : 0) ? value1: value2,
                            sortText = ["Single" ,"Limit", "Total"];
                        sortG.selectAll("g").data([2, 1, 0]).join("g")
                            .attr("transform", d => `translate(${[rectX + RectWidth - 100 -  60 * (1 - d), -this._height/2 + 2.5]})`)
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
                                this._indexScale = d;
                                rectY =  i => (this._height - 50)/selectInfo.length * (indexScale(i) + 0.5) + 25 - this._height/2;
                                lineToRect = (d, i) =>{
                                    let centerY = centerScaleY(d),
                                        endY = rectY(+i) + maxHeight/2;
                                    return [[rectX - 75, centerY],[rectX - 60, centerY], [rectX - maxHeight, endY], [rectX , endY], [rectX + RectWidth, endY]]
                                };
                                renderSort()
                            })
                        const switchG = mainG.append("g").attr("class", "switchG"),
                            text = ["Horizon", "River"],
                            tabColor = "#678fba",
                            transfrom = (v1, v2) => d => this._horizonView == Boolean(d) ? v1 : v2;
                        switchG.selectAll("g").data([1, 0]).join("g")
                            .attr("transform", d => `translate(${[rectX +  60 * (1 - d), - this._height/2 + 2.5]})`)//280  - 100
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
                                .text(d => text[d]))
                            .on("click", (e, d) =>{
                                if(this._horizonView !== Boolean(d)){
                                    this._horizonView = Boolean(d);
                                    let t = d3.transition()
                                            .duration(300)
                                            .ease(d3.easeLinear);
                                    switchG.selectAll("rect")
                                        .transition(t)
                                        .attr("fill", transfrom(tabColor, "#fff"));
                                    switchG.selectAll("text")
                                        .transition(t)
                                        .attr("fill", transfrom("#fff", tabColor));
                                    this._container.select(".mainG").remove()
                                    this._renderMainBar()
                                }
                            })
                        function renderSort(){
                            const t = d3.transition()
                                        .duration(300)
                                        .ease(d3.easeLinear);
                                lineG.selectAll(".lineToRect")
                                    .transition(t)
                                    .attr("d", (d, i) => line(lineToRect(d, i)))
                                if(wm._horizonView){ 
                                    sliderG.selectAll(".selectG")
                                        .transition(t)
                                        .attr("transform", (d, i) =>`translate(${[0, rectY(i) + maxHeight/2]})`)                           
                                }else{
                                    sliderG.selectAll(".hozenG")
                                        .transition(t)
                                        .attr("transform", (d, i) =>`translate(${[0, rectY(i) - maxHeight/2 ]})`)
                                }
                                sliderG.selectAll(".rectg")
                                    .transition(t)
                                    .attr("transform", (d, i) =>`translate(${[0, rectY(i) - maxHeight/2 ]})`)
                                pathG.selectAll("g")
                                    .transition(t)
                                    .attr("transform", (d, i) =>`translate(${[0, rectY(i) - maxHeight/2]})`)
                                sortG.selectAll("rect")
                                    .transition(t)
                                    .attr("fill", sortChange(sortColor, "#fff"));
                                sortG.selectAll("text")
                                    .transition(t)
                                    .attr("fill", sortChange("#fff", sortColor));
                                if(this._mouseDis !== undefined){
                                    var mouseInfo = mouseLocation(this._mouseDis);
                                    sliderG.selectAll(".textG")
                                        .transition(t)
                                        .attr("transform", d =>`translate(${[this._mouseDis - 10, rectY(d)]})`)
                                        .text(d => (+mouseInfo[d]).toFixed(2))
                                }
                        }
                        function initAxisG(batchTimeScale){
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
                        function renderAxisG(batchTimeScale){
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
                }
                _renderWheelContent() {
                    const r = this._radius,
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
                        graph={nodes:[],links:[]},
                        wm=this,
                        colorLinear1=[],
                        colorLinear2=[];
                        const sample = this._sort(this._chartData)
                        this._allIndex = d3.map(sample, d => d.dateStr);
                        var outrate = (item1 , item2) => {
                            return d => (wm._allIndex.indexOf(d.dateStr) !== -1) ? item1 : item2
                        };
                    const vis = this._g.selectAll("#" +menuId + " .vis").data(this._chartData);
                    for (let key in xpad){
                        const processdata = [], 
                        lck = lc[key],
                        daker = d3.color(lck).darker(0.6),
                        darkerborder = d3.color(lck).darker(2),
                        line_stroke = outrate(darkerborder,daker);
                        for (let item of this._chartData){
                            if(item.month == key)processdata.push(item)
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
                                    .attr("stroke",d => (wm._allIndex.indexOf(d.dateStr) !== -1) ? d3.color(lck).darker(colorlinear1(d.precipitation)+2) :daker)
                                    .attr("opacity", 1)
                                d3.selectAll("#" +menuId + " .humidity"+key)
                                    .attr("stroke",d => (wm._allIndex.indexOf(d.dateStr) !== -1) ? d3.color(lck).darker(colorlinear2(d.humidity)+2) :daker)
                                    .attr("opacity", 1)
                                d3.selectAll("#" +menuId + " .lead"+key )
                                    .attr("stroke-width", outrate(1.5,0.5))
                                    .attr("opacity", 0.4)
                                d3.selectAll("#" +menuId + " .linestart")
                                    .attr("y1", d => (wm._allIndex.indexOf(d.dateStr) !== -1) ? this._y(d.avg)+3.5 : this._y(d.avg)+2)
                                d3.selectAll("#" +menuId + " .linecurve")
                                    .attr("y2", d => (wm._allIndex.indexOf(d.dateStr) !== -1) ? this._y(d.avg)-3.5 : this._y(d.avg)-2)
                                d3.selectAll("#" +menuId + " .arcpie"+key)
                                    .attr("opacity", 1)
                                    .style('stroke-width', 0.5)
                                d3.selectAll("#" +menuId + " .arctext"+key)
                                    .attr("opacity", 1)
                                    .attr("fill", d3.color(lck).darker(4))
                            })
                            .on("mouseleave", (e, d) => {
                                this._initcss()
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
                                .attr("stroke", daker)
                                .attr("d", d => this._linepad(r.outer, this._h(d.humidity))))
                            .call(g => g.append("path")
                                .attr("class", "precipitation"+key)
                                .attr('id',d=>'precipitation'+d.dateStr)
                                .attr("fill",d=> d3.color(lck).brighter(colorlinear1(d.precipitation)))
                                .attr("stroke", daker)
                                .attr("d", d => this._linepad(r.outer+r.bubble*1.10-this._hb(d.precipitation) , r.outer+r.bubble*1.10)))

                        const t = this._texts;

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
                                    axisenter(d.dateStr,key,lck,daker,true);                                   
                                })
                                .on("mouseleave", (e, d) => {
                                    this._initcss()
                                    axisout(d.dateStr,key,lck,daker,true);
                                });
                    }
                    for (let item in sample){
                        let index = chorddata['label'].indexOf(sample[item].dateStr),targets=[],id=sample[item].dateStr;
                        for (let target =item+1;target < sample.length ;target++){
                            if(chorddata['corr'][item][target] > vm.corrSize&&chorddata['corr'][item][target]>0){
                                if(sample[item].month == sample[target].month){
                                    targets.push(sample[target].dateStr)
                                    graph.links.push({'source':id,'target':sample[target].dateStr,value:1})
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
                    const labelcolor=(d , i) => d3.color(lc[+d[0].data.group]).darker(2);
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
                            .attr("stroke",  labelcolor)
                            .attr("stroke-width",1)
                            .attr("opacity", 0.4)
                        d3.selectAll(".processPath").raise()
                        d3.selectAll(".icon").raise()
                        function overed(e, d){
                            const name=d.data.id,key=d.data.group,lck=lc[key],daker=d3.color(lck).darker(0.6);
                            const data=wm._chartData.filter(d => d.dateStr===name)[0];
                            wm._hightlightcss()
                            d3.selectAll("#" +menuId + " .clead" + key)
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
                                .attr("stroke",d => (wm._allIndex.indexOf(d.dateStr) !== -1) ? d3.color(lck).darker(colorLinear1[key](d.precipitation)+2) :daker)
                                .attr("opacity", 1)
                            d3.select("#" +menuId + " #humidity"+name)
                                .attr("stroke", d => (wm._allIndex.indexOf(d.dateStr) !== -1) ? d3.color(lck).darker(colorLinear2[key](d.humidity)+2) :daker)
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
                        .attr("stroke",d => (wm._allIndex.indexOf(d.dateStr) !== -1) ? d3.color(lck).darker(colorLinear1[key](d.precipitation)+2) :daker)
                        .attr("opacity", 1)
                    cG.select("#humidity"+name)
                        .attr("stroke", d => (wm._allIndex.indexOf(d.dateStr) !== -1) ? d3.color(lck).darker(colorLinear2[key](d.humidity)+2) :daker)
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
                        cG.selectAll(".lead"+i )
                            .attr("opacity", 0.1)
                        cG.selectAll(".clead"+i )
                            .attr("opacity", 0.1)
                        cG.selectAll(".humidity"+i)
                            .attr("opacity", 0.5)
                        cG.selectAll(".precipitation"+i)
                            .attr("opacity", 0.5)
                        cG.selectAll(".circle_color"+i)
                            .attr("opacity", 0.5)
                        cG.selectAll(".arcpie"+i)
                            .attr("opacity", 0.5)
                        cG.selectAll(".arctext"+i)
                            .attr("opacity", 0.5)
                        cG.selectAll("#process"+i)
                            .attr("opacity" , 0.3)
                        cG.selectAll(".river1"+i)
                            .attr("opacity",0.1)
                        cG.selectAll(".river2"+i)
                            .attr("opacity",0.4)
                    }
                }

                _sort(data){
                    let speSort = d3.sort(data,d=> d.precipitation),
                        T2Sort = d3.sort(data,d=> d.humidity);
                    var sortdata = data.filter(d =>{
                        return (d3.map(speSort, e=> e.dateStr).indexOf(d.dateStr)<= vm.multiPara || d3.map(T2Sort, e=> e.dateStr).indexOf(d.dateStr)<= vm.multiPara) && d.deviation !==0
                    })
                    var SPE=d3.sort(sortdata,d=> -d.precipitation),
                        T2=d3.sort(sortdata,d=> -d.humidity),
                        res=d3.sort(sortdata,d=> -d.deviation);
                    for (let item in SPE){
                        let query=SPE[item].dateStr                     
                        SPE[item].order=+item+1+(+T2.findIndex((value)=> value.dateStr===query))+1+(+res.findIndex((value)=> value.dateStr===query))+1
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
                        var name = d.dateStr,
                        
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
                _getover(d) {
                    return d.avg-d.low>d.high-d.avg?d.avg-d.low:d.high-d.avg
                }
            }
                const wheel = new wheelRound(this.svg)
                                .size([diameter, diameter])
                                .data(wheeldata)
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
/* g > text {
    stroke: white;
    fill:none;

} */
@import url("../../assets/marey/wheel.scss");
</style>