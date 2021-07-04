<template>
    <div :id="menuId" style="height: 100%;width:100%"></div>
</template>

<script>
import * as d3 from 'd3'
// import brushdata from "./chartdata/brushdata.json"
import util from 'src/views/baogang/util.js';
// import util from '../../views/baogang/util.js'
import { mapGetters, mapMutations} from 'vuex'
import { forEach, map } from '../../views/baogang/sampledata/stationdata';
export default {
    data () {
        return {
            menuId: 'brushableParallel',
            svg: undefined,
            labelColors: util.labelColor, // [bad, good]
            categoryColors: util.categoryColor,
            mouseList: undefined,
            brushdata: undefined,
            plData: undefined,
            tgtThicknessStation: 0,
            lengthStation:0,
            widthStation: 0,
            xScale:new Map(),
            slabThicknesssStation: 0,
            countpaint:0,
            newBrushSelection:new Map(),
            objStatus: {"tgtplatethickness2":false,"tgtplatelength2":false,"tgtwidth":false,"slab_thickness":false},
            coolingStation: {"cooling":false,"nocooling":false}, 
            // diagnosisStation:false,
            keys: [ "tgtplatethickness2", "tgtplatelength2","tgtwidth", "slab_thickness"],
            brushGroup:[],
            newBrushData:[[0.02,0.05],[17,44],[3,3.5],[2.5,3]],
            brush: d3.brushX(),
            lastSelections:new Map(),
            lastHandle:new Map()
        }
    },
    mounted () {
    },
    computed:{
        ...mapGetters([
			"isSwitch",
			"trainGroupStyle",
            "deGroupStyle",
            "brushMouseId",
            "brushSelection",
            "brushSelectColor",
            "startDate",
			"endDate",
            "hightlightGroup",
            "diagnosisState"
		]),
        paralleldata: vm => {
            if(vm.brushdata == undefined)return undefined
			var pathdata = Object.values(vm.brushdata)
			return  pathdata.filter(d =>{
				var toc = new Date(d.toc);
				return toc < vm.endDate && toc > vm.startDate
			})
		}
    },
    // 看时间的只要变化就会对应着变化
    watch:{
		isSwitch(val,oldVal){
            d3.selectAll(".pathColor").attr("stroke", this.deGroupStyle)
        },
		// startDate:function(){
        //     if(this.plData !== undefined){
        //         this.paintChart(this.plData, this.startDate, this.endDate)
        //     }
		// },
		hightlightGroup:function(){
            if(this.hightlightGroup.length === 0){
                this.init()
            }else{
                this.resetPath()
            }
		},
        diagnosisState:function(){
                if(this.diagnosisState){
                    console.log("true");
                    // for(let i = 0; i < 4; i++){
                    //     this.brushGroup[i].call(this.brush.move, this.newBrushData[i].map(this.xScale.get(this.keys[i])))
                    //     // selections.get(key).map(d => x.get(key)(d))
                    // }
                    // this.brushGroup.push(svg.select(".brushX"+i))
                }else{
                    console.log("false");
                }
            }
        },
    methods: {
        deepCopy(obj){
			if(typeof obj!=='object') return obj;
			var newObj=obj instanceof Array ? [] :{};
			for (let key in obj){
				if(obj.hasOwnProperty(key)){
					if(obj[key]===null){
						newObj[key]===null;
					}
					newObj[key]=typeof obj[key] ? this.deepCopy(obj[key]) : obj[key];
				}
			}
			return newObj
		},
        paintChart(plData, startTime, endTime) {
            this.countpaint++
            plData = this.deepCopy(plData)
            this.plData = plData
            var brushdata = plData.map( d => {
                d.slab_thickness = d.slab_thickness/100;
                d.status_cooling = d.status_cooling + 1
                return d
            })
            var width = 355
            this.brushdata = brushdata
            var margin = {top: 40, right: 20, bottom: 40, left: 20},
                coolingArray = d3.filter(brushdata, (d,i) => d["status_cooling"] == 2),
                nocoolingArray = d3.filter(brushdata, (d,i) => d["status_cooling"] == 1),
                allArray = [],
                cooling = ["cooling","nocooling"],
                objStatus = {"tgtplatethickness2":false,"tgtplatelength2":false,"tgtwidth":false,"slab_thickness":false}

            allArray.push(coolingArray)
            // allArray.push(coolingArray)
            allArray.push(nocoolingArray)
            var xCooling =  d3.scaleBand() //Ordinal scale
                            .domain(d3.range(allArray.length )) 
                            .range([margin.left, width - margin.right - margin.left]),
                            // .paddingInner(0.5),
                yCooling = d3.scaleLinear()
                            .domain([0, d3.max(allArray, d => d.length)]).nice()
                            .range([50, 0]),
                            // .range([50, 0]),

                coolingMargin =  (width - margin.right - margin.left) /allArray.length/2 ;
            var brushHeight = 10,
                vm = this,
                deselectedColor = "#eeeeee",
                selectedColor = "#cccccc",
                // keys = [ "tgtwidth", "tgtplatethickness2", "tgtplatelength2","slab_thickness","charging_temp_act"],
                // keys = [ "tgtplatethickness2", "tgtplatelength2","tgtwidth", "slab_thickness","status_cooling"],
                keys = [ "tgtplatethickness2", "tgtplatelength2","tgtwidth", "slab_thickness"],
                bardata = d3.map(keys, d => d3.map(brushdata, index => index[d])),
                barbin = d3.map(keys, (d, i) => {
                    var length = 6;
                    var maxlength = bardata[i].length
                    while(true){
                        if(d !== "status_cooling"){
                             var max = d3.max(d3.bin().thresholds(length)(bardata[i]), d => d.length) 
                            if(max/maxlength < 0.5 || length >= 10){
                                break
                            }else{
                                length++
                            }
                        }else{
                            length = 1
                            break
                        }
                    }
                    return d3.bin().thresholds(length)(bardata[i])
                })
                barScale = d3.map(barbin, array => d3.scalePow().domain([0, d3.extent(d3.map(array, d => d.length))[1]]).range([0, 20]))
                // barScale = d3.map(barbin, array => d3.scalePow().domain([0, d3.extent(d3.map(array, d => d.length))[1]]).range([0, 20]))
            var newRange = []
            for(let i in bardata){
                newRange.push([d3.min(bardata[i]), d3.max(bardata[i])])
            }
            let newkeys =["tgtplatethickness2","tgtplatelength2","tgtwidth","slab_thickness","status_cooling"]
            var barScale = d3.map(barbin, array => d3.scalePow().domain([0, d3.extent(d3.map(array, d => d.length))[1]]).range([0, 50])),
                width = document.getElementById(this.menuId).offsetWidth,
                arc = d3.arc()
                    .innerRadius(0)
                    // .outerRadius(8)
                    .outerRadius(6)
                    .startAngle(0)
                    .endAngle((d, i) => i ? 2 * Math.PI : - 2 * Math.PI),
                arcDiagnosis = d3.arc()
                    .innerRadius(0)
                    // .outerRadius(8)
                    .outerRadius(8)
                    .startAngle(0)
                    .endAngle((d, i) => i ? 2 * Math.PI : - 2 * Math.PI),
                height = (keys.length + 1) * 98,
                x = new Map(Array.from(keys, key => [key, d3.scaleLinear([barbin[keys.indexOf(key)][0].x0, barbin[keys.indexOf(key)].slice(-1)[0].x1], [margin.left, width - margin.right])])),
                y = d3.scalePoint(newkeys, [margin.top, height - margin.bottom]),
                xScale = d3.axisBottom(xCooling).tickSizeOuter(0).tickSizeInner(0)
            //   x.set("status_cooling",d3.scaleBand([0,1], [margin.left, width - margin.right]))
              x.set("status_cooling",d3.scaleLinear([0,3], [margin.left, width - margin.right]))
              var line = d3.line()
                    .defined(([, value]) => value != null)
                    .x(([key, value]) => x.get(key)(value))
                    .y(([key]) => y(key)),
                // brushhandle的具体样式
                brushHandle = (g, selection) => g
                    .selectAll(".handle--custom")
                    .data([{type: "w"}, {type: "e"}])
                    .join(enter => enter.append("path")
                            .attr("class", "handle--custom")
                            .attr("fill", "white")
                            .attr("fill-opacity", 1)
                            .attr("stroke", "#90a4ae")
                            // .attr("stroke", "red")
                            .attr("stroke-width", 2)
                            .attr("cursor", "ew-resize")
                            .attr("d", vm.diagnosisState ? arcDiagnosis : arc))
                        .attr("display", selection === null ? "none" : null)
                        .attr("transform", selection === null ? null : (d, i) => `translate(${selection[i]},${0})`)
             
            function brushSlider(){
                svg.selectAll("#parallel .overlay").attr("fill", "#eeeeee").raise()
                svg.selectAll("#parallel .selection").attr("fill", vm.brushSelectColor).attr("fill-opacity", 0.8).raise()
                // svg.selectAll("#parallel .parallelPath").raise()
                svg.selectAll(".handle--custom").raise()
                svg.selectAll("#parallel .domain").remove()
                svg.selectAll("#parallel .overlay").attr("rx", "5").attr("ry", "5").attr("stroke", "#bbbbbb").attr("stroke-width", 1)
                svg.selectAll("#parallel .selection").attr("rx", "5").attr("ry", "5").attr("stroke", "#aaa").attr("stroke-width", 1)
                svg.selectAll("#parallel .tick text")
                    .attr("stroke", "none")
                    .style("font-family", util.tabularAxisTextAttr.fontFamily)
                    .style("color", util.tabularAxisTextAttr.fontColor)
                    .style("font-size", util.tabularAxisTextAttr.fontSize)
                    .style("font-weight", util.tabularAxisTextAttr.fontWeight)
                    .style("font-style", util.tabularAxisTextAttr.fontStyle)
            }
            function diagnosisBrushSlider(){
                    svg.selectAll("#parallel .overlay").attr("fill", "#eeeeee").raise()
                svg.selectAll("#parallel .selection").attr("fill", vm.brushSelectColor).attr("fill-opacity", 0.8).raise()
                // svg.selectAll("#parallel .parallelPath").raise()
                svg.selectAll("#parallel .handle--custom").attr("stroke",util.labelColor[0])
                svg.selectAll(".handle--custom").raise()
                svg.selectAll("#parallel .domain").remove()
                svg.selectAll("#parallel .overlay").attr("rx", "5").attr("ry", "5").attr("stroke", "#bbbbbb").attr("stroke-width", 1)
                svg.selectAll("#parallel .selection").attr("rx", "5").attr("ry", "5").attr("stroke", "#aaa").attr("stroke-width", 1)
                svg.selectAll("#parallel .tick text")
                    .attr("stroke", "none")
                    .style("font-family", util.tabularAxisTextAttr.fontFamily)
                    .style("color", util.tabularAxisTextAttr.fontColor)
                    .style("font-size", util.tabularAxisTextAttr.fontSize)
                    .style("font-weight", util.tabularAxisTextAttr.fontWeight)
                    .style("font-style", util.tabularAxisTextAttr.fontStyle)    
            }
            this.svg !== undefined && this.svg.remove()
            this.svg=d3.select("#"+vm.menuId)
                .append("svg")
                .attr("width", width)
                .attr("height", height);
            var svg = this.svg.attr("id", "parallel")
            const brush = d3.brushX()
                .extent([
                    [margin.left, -(brushHeight / 2)],
                    [width - margin.right, brushHeight / 2]
                ])
                .on("start brush end", brushed)
            svg.append("g")
                .attr("class","cardG")
                .selectAll("rect")
                .data(newkeys)
                .join("rect")
                .attr("class",(d,i) => "card"+i)
                .attr("transform",d => `translate(${10},${y(d) - 42 })`)
                .attr("fill","white")
                .attr("fill-opacity",1)
                .attr("stroke","#e0e0e0")
                .attr("stroke-width",3)
                .attr("stroke-opacity",0)
                .attr("width",307)
                .attr("height",80)
                .attr("rx",10)
                .attr("ry",10)
                
                
            for(let item in keys){
                var barmargin =  (width - margin.right - margin.left) / barbin[item].length/2;
                // d => (d3.filter(brushdata, e => e[keys] <= d.x1 && d.x0 <= e[keys] && +e.label=== 0)).length
                // 这里绘制的是柱状图
                svg.append("g")
                    .attr("class", "rectBar")
                    .attr("transform",`translate(0,${y(keys[item])})`)
                    .selectAll(".rect"+item)
                    .data(barbin[item])
                    .join("g")
                    .call(g => g.append("rect")
                        .attr("class", "rect" +item)
                        .attr("x", d => {
                            return x.get(keys[item])(d.x0)})
                        .attr("fill", util.delabelColor[1])
                        .attr("y", d => -barScale[item]((d3.filter(brushdata, e => e[keys[item]] <= d.x1 && d.x0 <= e[keys[item]] && (+e.label=== 1))).length)+1)
                        .attr("height", d => barScale[item]((d3.filter(brushdata, e => e[keys[item]] <= d.x1 && d.x0 <= e[keys[item]] && (+e.label=== 1))).length))
                        .attr("width", d => x.get(keys[item])(d.x1) - x.get(keys[item])(d.x0) - barmargin))
                        .attr("stroke","#000")
                        .attr("stroke-width",1)
                    .call(g => g.append("rect")
                        .attr("class", "rect" +item)
                        .attr("x", d => x.get(keys[item])(d.x0))
                        .attr("fill", util.delabelColor[0])
                        .attr("y", 10)
                        .attr("height", d => barScale[item]((d3.filter(brushdata, e => e[keys[item]] <= d.x1 && d.x0 <= e[keys[item]] && (+e.label=== 0))).length))
                        .attr("width", d => x.get(keys[item])(d.x1) - x.get(keys[item])(d.x0) - barmargin))
                        .attr("stroke","#000")
                        .attr("stroke-width",1)
                this.brushSelection.set(keys[item], d3.extent(d3.filter(brushdata, d => new Date(d.toc) >= startTime && new Date(d.toc) <= endTime), d => d[keys[item]]))
                this.newBrushSelection.set(keys[item],this.newBrushData[item])
            }
            svg.append("g")
                .attr("class","rectCooling")
                // .attr("transform",`translate(0,${400})`)
                .selectAll("rect")
                // .selectAll("circle")
                .data(allArray)
                .join("g")
                .call(g => 
                    g.append("rect")
                        .attr("class",(d, i) => "rectcooling"+ i)
                        .attr("x", (d, i) => x.get("status_cooling")(i + 1))
                        .attr("y", d => 400 + yCooling((d3.filter(d,  e => e["label"] == "1")).length))
                        .attr("height", d => yCooling(0) - yCooling((d3.filter(d,  e => e["label"] == "1")).length) )
                        // .attr("width", xCooling - coolingMargin)
                        .attr("width", xCooling.bandwidth() - coolingMargin -50)
                        .attr("fill", util.delabelColor[1]))
                        .attr("opacity",0.5)
                        .attr("stroke","#000")
                        .attr("stroke-width",1)
                .call(g => 
                    g.append("rect")
                    .attr("class",(d, i) => "rectcooling"+ i)
                    .attr("x",(d,i) =>  x.get("status_cooling")(i + 1))
                    .attr("y", d => 460)
                    .attr("height", d => yCooling(0) - yCooling((d3.filter(d,  e => e["label"] == "0")).length) )
                    .attr("width", xCooling.bandwidth()- coolingMargin -50)
                    // .attr("width", xCooling.bandwidth())
                    .attr("fill", util.delabelColor[0])
                    .attr("opacity",0.5)
                    .attr("stroke","#000")
                    .attr("stroke-width",1))
                d3.select(".rectcooling0").lower()
                d3.select(".rectcooling1").lower()
                svg.append("g")
                    .selectAll("g")
                    .data(cooling)
                    .join("g")
                    .call(g => g.append("circle")
                         .attr("class",(d,i) => "coolingButton"+ i)
                          .attr("cx",(d,i) =>  x.get("status_cooling")(i + 1) +9.4)
                          .attr("cy",480)
                          .attr("r", 5)
                          .attr("storke","#000")
                          .attr("stroke-width",1)
                          .attr("fill","#ccc")
                          .attr('cursor', 'pointer')
                          .on("click", function(e, d){
                              if(d == "cooling"){
                                   vm.coolingStation["cooling"] = !vm.coolingStation["cooling"]
                              }else{
                                   vm.coolingStation["nocooling"] = !vm.coolingStation["nocooling"]
                              }
                              svg.select(".coolingButton0").attr("fill",vm.coolingStation["cooling"] ? util.labelColor[0]:"#ccc")
                              svg.select(".coolingButton1").attr("fill",vm.coolingStation["nocooling"] ? util.labelColor[0]:"#ccc")
                              path.each(function(d) {
                                    const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
                                    if( vm.coolingStation["cooling"]&&vm.coolingStation["nocooling"]){
                                            d3.select(this).attr("stroke",( active && d["status_cooling"] == 2 && d["status_cooling"] == 1) ? vm.deGroupStyle : "none");
                                    }else if(vm.coolingStation["cooling"] && !vm.coolingStation["nocooling"]){
                                            d3.select(this).attr("stroke",( active && d["status_cooling"] == 1) ? vm.deGroupStyle : "none");
                                    }else if(!vm.coolingStation["cooling"] &&vm.coolingStation["nocooling"]){
                                            d3.select(this).attr("stroke",( active && d["status_cooling"] == 2) ? vm.deGroupStyle : "none");
                                    }else{
                                        d3.select(this).attr("stroke",active ? vm.deGroupStyle : "none");
                                    }
                              });
              }))
            svg.append("g").call(g =>
                g.append("rect")
                    .attr("x",20)
                    .attr("y",450)
                    .attr("width",295)
                    .attr("height",10)
                    .attr("fill","#eee")
                    .attr("rx",5)
                    .attr("ry",5)
                    .attr("stroke","#bbb")
                    .attr("stroke-width",1)
                    .raise()
                )
                .call(g => 
                    g.append("text")
                      .attr("x", width - margin.left)
                      .attr("y", 420)
                      .attr("text-anchor", "end")
                    //   .attr("fill", util.tabularTipsTextAttr.fontColor)
                      .attr("fill", "#94a7b7")
                      .attr("font-family", util.tabularTipsTextAttr.fontFamily)
                      .attr("font-size", util.tabularTipsTextAttr.fontSize)
                      .attr("font-weight", util.tabularTipsTextAttr.fontWeight)
                      .attr("font-style", util.tabularTipsTextAttr.fontStyle)
                      .text("sta_cooling")
                      
                  )
            const path = svg.append("g")
                            .attr("fill", "none")
                            .attr("stroke-width", 1)
                            .attr("stroke-opacity", 0.6)
                            .attr("class", "parallelPath")
                            .selectAll("path")
                            .data(vm.paralleldata.slice().sort((a, b) => {
                                return d3.ascending(a["upid"], b["upid"])}))
                            .join("path")
                            .attr("stroke", this.deGroupStyle)
                            .attr("id", d=> `paraPath${d.upid}`)
                            // .attr("id", d=> `paraPath${d.upid}`)
                            // .attr("d", d => line(d3.cross(keys, [d], (key, d) => [key, d[key]])))
                            .attr("d", d => line(d3.cross(newkeys, [d], (key, d) => [key, d[key]])))
                            .attr("class", "pathColor")
                            .on("mouseover", pathover)
                            .on("mouseout", pathout);
            var selections
            if(vm.diagnosisState){
                selections = this.newBrushSelection
            }else{
                selections = this.brushSelection   
            }
          
            svg.append("g")
                .attr("class","brushParalle")
                .selectAll("g")
                .data(keys)
                // .data(newkeys)
                .join("g")
                .attr("transform", d => `translate(0,${y(d)+6})`)
                .attr("id", (d, i) => "parallel" + i)
                // .attr("fill", "#2c3e50")
                .each(function(d,i) {
                  if(i< 4){ 
                    d3.select(this)
                        .call(d3.axisBottom(x.get(d))
                            .tickSizeOuter(5)
                            .tickSizeInner(5)
                            .tickFormat(d3.format(",.2f"))
                            // .ticks(barbin[i].length)); 
                            .ticks(5))
                  }
                })
                // .call(g => g.append("text")
                //             .attr("class",(d,i) => "textButton" + i)
                //             .attr("x", width - margin.left/2 -31)
                //             // .attr("y", - 40)
                //             .attr("y", - 35)
                //             .attr("text-anchor", "middle")
                //             .attr("fill", util.tabularTipsTextAttr.fontColor)
                //             .attr('font-family', util.buttonTextAttr.baseTextAttr.fontFamily)
                //             .attr('font-weight', util.buttonTextAttr.baseTextAttr.fontWeight)
                //             .attr('font-style', util.buttonTextAttr.baseTextAttr.fontStyle)
                //             .attr('font-size', util.buttonTextAttr.baseTextAttr.fontSize)
                //     // .attr("font-family", util.tabularTipsTextAttr.fontFamily)
                //     // .attr("font-size", util.tabularTipsTextAttr.fontSize)
                //     // .attr("font-weight", util.tabularTipsTextAttr.fontWeight)
                //     // .attr("font-style", util.tabularTipsTextAttr.fontStyle)
                //     .text(d => d.replace(/tgtwidth/, "tgt_width").replace(/tgtplatethickness2/, "tgt_thickness")
                //     .replace(/tgtplatelength2/, "tgt_length").replace(/slab_thickness/, "slab_thickness").replace(/charging_temp_act/, "charging").replace(/status_cooling/,"sta_cooling")))
                // .call(g => g.selectAll("text")
                //     .clone(true).lower()
                //     .attr("fill", "none")
                //     .attr("stroke-width", 5)
                //     .attr("stroke-linejoin", "round")
                //     // .attr("font-family", "DIN")
                //     // .attr("stroke", "white")
                //     )
                .call(g =>g.selectAll(".domain").remove())
                .call(brush)
                .attr("class",(d,i) => "brushX" + i)
                .call(brush.move, (d,i) => selections.get(d).map(x.get(d)))


            svg.append("g")
                .selectAll("g")
                .data(keys)
                .join("g")
                .attr("transform", d => `translate(0,${y(d)+6})`)
                .call(g => g.append("rect")
                                .attr("class",(d,i) => "rectButton" + i)
                                .attr("x",width - margin.left/2 -60)
                                .attr("y",-45)
                                .attr("width",62)
                                .attr("height",15)
                                .attr("stroke",util.labelColor[1])
                                .attr("rx",5)
                                .attr("ry",5)
                                .attr("fill","white"))
                               
                .call(g => g.append("text")
                            .attr("class",(d,i) => "textButton" + i)
                            .attr("x", width - margin.left/2 -31)
                            .attr("y", - 35)
                            .attr("text-anchor", "middle")
                            .attr("fill", "#94a7b7")
                            .attr('font-family', util.buttonTextAttr.baseTextAttr.fontFamily)
                            .attr('font-weight', util.buttonTextAttr.baseTextAttr.fontWeight)
                            .attr('font-style', util.buttonTextAttr.baseTextAttr.fontStyle)
                            .attr('font-size', util.buttonTextAttr.baseTextAttr.fontSize)
                            .attr("cursor","pointer")
                            // .attr("font-family", util.tabularTipsTextAttr.fontFamily)
                            // .attr("font-size", util.tabularTipsTextAttr.fontSize)
                            // .attr("font-weight", util.tabularTipsTextAttr.fontWeight)
                            // .attr("font-style", util.tabularTipsTextAttr.fontStyle)
                            .text(d => d.replace(/tgtwidth/, "tgt_width").replace(/tgtplatethickness2/, "tgt_thickness")
                            .replace(/tgtplatelength2/, "tgt_length").replace(/slab_thickness/, "slab_thickness").replace(/charging_temp_act/, "charging").replace(/status_cooling/,"sta_cooling")))
                             .on('click', function(e,d){
                                    if(d == "tgtplatethickness2"){
                                        objStatus["tgtplatethickness2"] = !objStatus["tgtplatethickness2"]
                                    }else if(d == "tgtplatelength2"){
                                        objStatus["tgtplatelength2"] = !objStatus["tgtplatelength2"]
                                    }else if(d == "tgtwidth"){
                                        objStatus["tgtwidth"] = !objStatus["tgtwidth"]
                                    }else{
                                        objStatus["slab_thickness"] = !objStatus["slab_thickness"]
                                    }
                                    svg.select(".rectButton" + keys.indexOf(d)).attr("fill", objStatus[d] ?  "#94a7b7" :  "#ffffff" )
                                    // svg.select("textButton" + keys.indexOf(d)).attr('color', objStatus[d] ? "red": util.buttonTextAttr.unactivated_color)
                                    svg.select(".textButton" + keys.indexOf(d)).attr('fill', objStatus[d] ? "#ffffff": "#94a7b7")
                                    svg.select(".card"+ keys.indexOf(d)).attr("stroke-opacity",objStatus[d] ? 0.3 : 0)
                                })
               

            // for(let i=0; i < 4;i++){
            //     d3.select("textButton" + i).raise()
            // }
            // console.log("ffd",svg.select("textButton0" ));
                // // .call(g => g.append("g")
                //             .attr("class",(key,item) => "previousHandle" + item)
                //             .selectAll(".handle--custom1")
                //             .data([{type: "w"}, {type: "e"}])
                //                     .join(enter => enter.append("path")
                //                                     .attr("class", "handle--custom1")
                //                                     .attr("fill", "white")
                //                                     .attr("fill-opacity", 1)
                //                                     .attr("stroke", "#90a4ae")
                //                                     .attr("stroke-width", 2)
                //                                     // .attr("cursor", "ew-resize")
                //                                     .attr("d", arc))
                //                                     .attr("transform", (d, i) => {
                //                                         console.log(d);
                //                                     // return `translate(${vm.lastHandle.get(key)[i]},${0})`
                //                                     }
                //     ))
            this.xScale = x
             if(vm.diagnosisState){
                    // for(let item in keys){
                    //     // console.log(item);
                    //     svg.select(".brushX" + item)
                    //         // .append("g")
                    //         // .attr("class","previousHandle" + item)
                    //         // .call(g => 
                    //                         .selectAll(".handle--custom1")
                    //                          .data([{type: "w1"}, {type: "e1"}])
                    //                          .join(enter => enter.append("path")
                    //                                 .attr("class", "handle--custom1")
                    //                                 .attr("fill", "white")
                    //                                 .attr("fill-opacity", 1)
                    //                                 .attr("stroke", "#90a4ae")
                    //                                 .attr("stroke-width", 2)
                    //                                 // .attr("cursor", "ew-resize")
                    //                                 .attr("d", arc))
                    //                                 .attr("transform", (d, i) => {
                    //                                     console.log(d);
                    //                                     console.log(i);
                    //                                     return `translate(${vm.lastHandle.get(keys[item])[i]},${0})`
                    //                                })
                    //         // )
                    // }
                    svg.select(".brushParalle")
                        .append("g")
                        .attr("class","previousBrushed")
                        // .append("g")
                        .selectAll("g")
                        .data(keys)
                        .join("g")
                        .attr("class",(d,i) => "previousbrusHandle"+i)
                        .attr("transform", d => `translate(0,${y(d)+6})`)
                        .each((key,i) => {
                            svg.select(".previousbrusHandle"+i).call(
                                g => g.selectAll(".handle--custom1")
                                    .data([{type: "w"}, {type: "e"}])
                                    .join(enter => enter.append("path")
                                                    .attr("class", "handle--custom1")
                                                    .attr("fill", "white")
                                                    .attr("fill-opacity", 1)
                                                    .attr("stroke", "#90a4ae")
                                                    .attr("stroke-width", 2)
                                                    // .attr("cursor", "ew-resize")
                                                    .attr("d", arc))
                                                    .attr("transform", (d, i) => {
                                                    return `translate(${vm.lastHandle.get(key)[i]},${0})`})
                                    )
                            })
                    // d3.select(".brushParalle").raise()
                    // for(let i =0; i < 4; i++){
                    //   d3.select("#parallel"+i).raise()

                    // }
                }
            if(vm.diagnosisState){
                diagnosisBrushSlider()
            }else{
                brushSlider()
            }


            // svg.select(".textButton0").attr("fill","red")
            
            // 折现和散点图之间的联动以及toptip
            function pathover(event,d){
                const tooltip = vm.svg.append("g")
                    .attr("class", "tooltip")
                    .style("font", "12px DIN");

                const path = tooltip.append("path")
                    .attr("fill", "rgba(245, 245, 230, 0.97)");

                const text = tooltip.append("text");

                const line1 = text.append("tspan")
                    .attr("x", 0)
                    .attr("y", 0)
                    .style('font-family', util.tabularTooltipAttr.line1.fontFamily)
                    .style('font-size', util.tabularTooltipAttr.line1.fontSize)
                    .style('font-weight', util.tabularTooltipAttr.line1.fontWeight)
                    .style('font-style', util.tabularTooltipAttr.line1.fontStyle)

                const line2 = text.append("tspan")
                    .attr("x", 0)
                    .attr("y", "1.1em")
                    .style('font-family', util.tabularTooltipAttr.line2.fontFamily)
                    .style('font-size', util.tabularTooltipAttr.line2.fontSize)
                    .style('font-weight', util.tabularTooltipAttr.line2.fontWeight)
                    .style('font-style', util.tabularTooltipAttr.line2.fontStyle)

                const line3 = text.append("tspan")
                    .attr("x", 0)
                    .attr("y", "2.2em")
                    .style('font-family', util.tabularTooltipAttr.line3.fontFamily)
                    .style('font-size', util.tabularTooltipAttr.line3.fontSize)
                    .style('font-weight', util.tabularTooltipAttr.line3.fontWeight)
                    .style('font-style', util.tabularTooltipAttr.line3.fontStyle)		
                tooltip
                    .style("display", null)
                    .attr("fill", util.tabularTooltipAttr.line1.fontColor);
                line1.text(`upid:`+ d.upid);
                line2.text(`category: `+d.productcategory);
                line3.text(`time:`+d.toc);
                path
                    .attr("stroke", "none")
                    .attr("fill", vm.deGroupStyle(d));
                const box = text.node().getBBox();
                let x = event.offsetX - 78,
                    y = event.offsetY + 10;					
                path.attr("d", `
                    M${box.x - 10},${box.y - 10}
                    H${box.width / 2 - 5}l5,15l5,-15
                    H${box.width + 10}
                    v-${box.height + 20}
                    h-${box.width + 20}
                    z
                `)
                text.attr("transform", `translate(${[box.x,box.y - 50]})`);
                tooltip.attr("transform", `translate(${[x,y]})`);
                vm.svg.selectAll(`.pathColor`)
                    .attr("stroke-opacity", 0.01)
                    .attr("stroke-width", 0.25)
                vm.svg.select(`#paraPath${d.upid}`)
                    .attr("stroke-opacity", 0.6)
                    .attr("stroke-width", 1.75)
                vm.$emit("parallMouse", {upid: [d.upid],  mouse: 0});
            }
            function pathout(e,d){
                vm.svg.selectAll(`.pathColor`)
                    .attr("stroke-opacity", 0.6)
                    .attr("stroke-width", 1)
                vm.svg.selectAll(".tooltip").remove()
                vm.mouseList !==undefined ? vm.mouse(vm.mouseList) : false
                vm.$emit("parallMouse", {upid: [d.upid],  mouse: 1});
            }
            function brushed({selection}, key) {
                var tempValue = selections.get(key).map(d => x.get(key)(d));

            
                d3.select(this).call(brushHandle, selection);


                if(objStatus[key] && !(tempValue.every((d, i) => d === selection[i]))){
                    d3.select(this).call(brush.move, selections.get(key).map(d => x.get(key)(d)))
                    return
                }
                // else{
                // }
                  
                if(!vm.diagnosisState && !(tempValue.every((d, i) => d === selection[i]))){
                    d3.select(this).call(brush.move, selections.get(key).map(d => x.get(key)(d)))
                    return
                }


                if (selection === null) selections.delete(key);
                else selections.set(key, selection.map(x.get(key).invert));
                // if (selection === null) selections.delete(key);
                // else selections.set(key, selection.map(x.get(key).invert));
                if(vm.diagnosisState !== true){
                    vm.lastSelections.set(key, selection.map(x.get(key).invert));
                    vm.lastHandle.set(key,selection)
                }
                const selected = [];
                // d3.select(this).call(brush.move, selections.get(key).map(d => x.get(key)(d)))
                //  path.each(function(d) {
                //                     const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
                //                     if(vm.coolingStation["nocooling"] &&vm.coolingStation["cooling"]){
                //                             d3.select(this).attr("stroke",( active && d["status_cooling"] == 1 && d["status_cooling"] == 0) ? vm.deGroupStyle : "none");
                //                     }else if(vm.coolingStation["cooling"] && !vm.coolingStation["nocooling"]){
                //                             d3.select(this).attr("stroke",( active && d["status_cooling"] == 0) ? vm.deGroupStyle : "none");
                //                     }else if(!vm.coolingStation["cooling"] &&vm.coolingStation["nocooling"]){
                //                             d3.select(this).attr("stroke",( active && d["status_cooling"] == 1) ? vm.deGroupStyle : "none");
                //                     }else{
                //                         d3.select(this).attr("stroke",active ? vm.deGroupStyle : "none");
                //                     }
                // });
                if(vm.diagnosisState){
                    // d3.select(".handle--custom1").raise()
                    // d3.select(".handle--custom").raise()
                    // d3.select(".handle--custom").raise()
                    
                    let currentSelections = Array.from(selections),
                    previousSelections = Array.from(vm.lastSelections),
                    secondStateSelections = []
                    previousSelections.forEach((d,i) => secondStateSelections.push([d[0],[d[1][0],currentSelections[i][1][0]],[currentSelections[i][1][1],d[1][1]]]))
                    path.each(function(d) {
                        const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
                        const lastActive = previousSelections.every(([key, [min, max]]) =>  d[key] >= min && d[key] <= max)
                        const secondStateactive = secondStateSelections.every(([key,[min1,max1],[min2,max2]]) => (d[key] >= min1 &&d[key]<=max1) || (d[key] >= min2 &&d[key]<=max2))
                        let state = 0
                        if(active){
                             d3.select(this).attr("stroke",vm.deGroupStyle)
                        }else if(secondStateactive){
                            state = 1
                             d3.select(this).attr("stroke",vm.deGroupStyle).attr("stroke-opacity",0.1)
                            //  d3.select(this).attr("stroke","none")

                        }else{
                             d3.select(this).attr("stroke","none")
                        }
                        // d3.select(this).attr("stroke", active ? vm.deGroupStyle : "none");
                        // d3.select(this).attr("stroke", state == 2 ? "red" :(state == 1 ? vm.deGroupStyle : "none"));
                         if (active ||secondStateactive ) {
                            d3.select(this).raise();
                            selected.push(d);
                        }

                         
                        // d3.select(this).attr("stroke", active ? "none" : vm.deGroupStyle );




                    })


                }else{
                    path.each(function(d) {
                        const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
                        // const active = Array.from(vm.lastSelections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
                        // d3.select(this).attr("stroke", active ? vm.deGroupStyle : "none");
                        d3.select(this).attr("stroke", active ? vm.deGroupStyle : "none");

                        // if(vm.coolingStation["cooling"] && vm.coolingStation["nocooling"]){
                        //         d3.select(this).attr("stroke",( active && d["status_cooling"] == 1 && d["status_cooling"] == 0) ? vm.deGroupStyle : "none");
                        // }else if(vm.coolingStation["cooling"] && !vm.coolingStation["nocooling"]){
                        //         d3.select(this).attr("stroke",( active && d["status_cooling"] == 0) ? vm.deGroupStyle : "none");
                        // }else if(!vm.coolingStation["cooling"] &&vm.coolingStation["nocooling"]){
                        //         d3.select(this).attr("stroke",( active && d["status_cooling"] == 1) ? vm.deGroupStyle : "none");
                        // }else{
                        //     d3.select(this).attr("stroke",active ? vm.deGroupStyle : "none");
                        // }
                        if (active) {
                            d3.select(this).raise();
                            selected.push(d);
                        }
                    });
                }
                if(vm.diagnosisState){
                    if (selection === null){
                        d3.selectAll(".rect" + keys.indexOf(key))
                        .attr("opacity", 0.5)
                    }else{
                        let brushRange = d3.map(selection, x.get(key).invert)
                        let previousRange = vm.lastSelections.get(key)
                        d3.selectAll(".rect" + keys.indexOf(key))
                            // .attr("fill", (d,i) => (d.x0 + d.x1)/2 >= brushRange[0] && (d.x0 + d.x1)/2 <= brushRange[1] ? selectedColor : deselectedColor)
                            .attr("opacity", (d,i) => (d.x0 + d.x1)/2 >= brushRange[0] && (d.x0 + d.x1)/2 <= brushRange[1] ? 0.5 : 
                            ((((d.x0 + d.x1)/2 >= previousRange[0] && (d.x0 + d.x1)/2 <= brushRange[0])|| ((d.x0 + d.x1)/2 >= brushRange[1] && (d.x0 + d.x1)/2 <= previousRange[1])) ? 0.1 : 0.05))
                    }
                }else{
                    if (selection === null){
                    d3.selectAll(".rect" + keys.indexOf(key))
                      .attr("opacity", 0.5)
                    }else{
                        let brushRange = d3.map(selection, x.get(key).invert)
                        d3.selectAll(".rect" + keys.indexOf(key))
                            // .attr("fill", (d,i) => (d.x0 + d.x1)/2 >= brushRange[0] && (d.x0 + d.x1)/2 <= brushRange[1] ? selectedColor : deselectedColor)
                            .attr("opacity", (d,i) => (d.x0 + d.x1)/2 >= brushRange[0] && (d.x0 + d.x1)/2 <= brushRange[1] ? 0.5 : 0.05)
                    }
                }
                d3.select(this).call(brushHandle, selection);
                svg.property("value", selected).dispatch("input");
                d3.select(".rectBar").lower();
                brushSlider()
            }
            console.log(svg.select("card0"));
            // svg.select("card0").attr("fill-opacity",0.3)
            // svg.select("card0").attr("fill-opacity",0.3)

        },
        mouse(value){
          this.mouseList = value
                this.clear();
          if(value.mouse===0){
                this.changePath(value.upid)
                this.changePath(this.hightlightGroup)
          }else{
                this.init()
                if(this.hightlightGroup.length !== 0){
                    this.clear()
                    this.changePath(this.hightlightGroup)
                }
			}
		},
        resetPath(){    //reset Style before highlight
			if(this.mouseList !==undefined){
                this.mouse(this.mouseList)
            }else{
                if(this.hightlightGroup.length !== 0){
                    this.clear()
                    this.changePath(this.hightlightGroup)
                }
            }
        },
        clear(){    //clear Style
            this.svg.selectAll(`.pathColor`)
                .attr("stroke-width", 1)
                .style("visibility", "hidden")
        },
        init(){     //init Style
            this.svg.selectAll(`.pathColor`)
                .style("visibility", "visible")
                .attr("stroke-width", 1)
        },
        changePath(array){	//change Style
            if(array.length === 0)return;
            for(let item in array){
                this.svg.select(`#paraPath${array[item]}`)
                            .style("visibility", "visible")
                            .attr("stroke-width", 1.75).raise()
          }
		},
       
       
    },
    mounted(){
    }
}
</script>

<style scoped>
</style>
