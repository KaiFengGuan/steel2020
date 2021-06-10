<template>
    <div :id="menuId" style="height: 100%;width:100%"></div>
</template>

<script>
import * as d3 from 'd3'
// import brushdata from "./chartdata/brushdata.json"
import util from 'src/views/baogang/util.js';
// import util from '../../views/baogang/util.js'
import { mapGetters, mapMutations} from 'vuex'
import { forEach } from '../../views/baogang/sampledata/stationdata';
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
            slabThicknesssStation: 0,
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
            "hightlightGroup"
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
    watch:{
		isSwitch(val,oldVal){
            d3.selectAll(".pathColor").attr("stroke", this.deGroupStyle)
        },
		startDate:function(){
            if(this.plData !== undefined){
                this.paintChart(this.plData, this.startDate, this.endDate)
            }
		},
		hightlightGroup:function(){
            if(this.hightlightGroup.length === 0){
                this.init()
            }else{
                this.resetPath()
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
            plData = this.deepCopy(plData)
            this.plData = plData
            var brushdata = plData.map( d => {
                d.slab_thickness = d.slab_thickness/100;
                return d
            })
                width = 355
            this.brushdata = brushdata
            let objStatus ={"tgtplatethickness2":false,"tgtplatelength2":false,"tgtwidth":false,"slab_thickness":false}
            // keys = [ "tgtplatethickness2", "tgtplatelength2","tgtwidth", "slab_thickness"],
            // var margin = {top: 40, right: 20, bottom: 40, left: 20},
            // var margin = {top: 40, right: 20, bottom: 40, left: 20},
            var margin = {top: 40, right: 20, bottom: 40, left: 20},

                coolingArray = d3.filter(brushdata, (d,i) => d["status_cooling"] == 1),
                nocoolingArray = d3.filter(brushdata, (d,i) => d["status_cooling"] == 0),
                allArray = [],
                cooling = ["cooling","nocooling"]
            allArray.push(coolingArray)
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
                    .outerRadius(8)
                    .startAngle(0)
                    .endAngle((d, i) => i ? 2 * Math.PI : - 2 * Math.PI),
                height = (keys.length + 1) * 98,
                // x = new Map(Array.from(keys, key => [key, d3.scaleLinear([0,60])], [margin.left, width - margin.right]),
                // x = new Map(Array.from(keys, key => [key, d3.scaleLinear([0,60], [margin.left, width - margin.right])])),
                x = new Map(Array.from(keys, key => [key, d3.scaleLinear([barbin[keys.indexOf(key)][0].x0, barbin[keys.indexOf(key)].slice(-1)[0].x1], [margin.left, width - margin.right])])),
                
                // x = new Map(Array.from(keys, key => [key, d3.scaleLinear([newRange[keys.indexOf(key)][0], newRange[keys.indexOf(key)][1]], [margin.left, width - margin.right])])),
                // y = d3.scalePoint(keys, [margin.top, height - margin.bottom]);
                y = d3.scalePoint(newkeys, [margin.top, height - margin.bottom]),
                xScale = d3.axisBottom(xCooling).tickSizeOuter(0).tickSizeInner(0)
                // yScale = d3.scalePoint(1, [margin.top, height - margin.bottom])
                


              // console.log(yScale(13));
              x.set("status_cooling",d3.scaleBand([0,1], [margin.left, width - margin.right]))
              // x.set("status_cooling",d3.scaleBand(["cooling","nocooling"], [margin.left, width - margin.right]))


              var line = d3.line()
                    .defined(([, value]) => value != null)
                    .x(([key, value]) => x.get(key)(value))
                    .y(([key]) => y(key)),
                brushHandle = (g, selection) => g
                    .selectAll(".handle--custom")
                    .data([{type: "w"}, {type: "e"}])
                    .join(enter => enter.append("path")
                            .attr("class", "handle--custom")
                            .attr("fill", "white")
                            .attr("fill-opacity", 1)
                            .attr("stroke", "#90a4ae")
                            .attr("stroke-width", 2)
                            .attr("cursor", "ew-resize")
                            .attr("d", arc))
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
                .on("start brush end", brushed);
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
                        // .attr("width", d => x.get(keys[item])(d.x1) - x.get(keys[item])(d.x0) - barmargin))
                        .attr("stroke","#000")
                        .attr("stroke-width",1)
                    .call(g => g.append("rect")
                        .attr("class", "rect" +item)
                        .attr("x", d => x.get(keys[item])(d.x0))
                        .attr("fill", util.delabelColor[0])
                        .attr("y", 10)
                        // .attr("y", d => -barScale[item](d.length)+1)
                        .attr("height", d => barScale[item]((d3.filter(brushdata, e => e[keys[item]] <= d.x1 && d.x0 <= e[keys[item]] && (+e.label=== 0))).length))
                        .attr("width", d => x.get(keys[item])(d.x1) - x.get(keys[item])(d.x0) - barmargin))
                        .attr("stroke","#000")
                        .attr("stroke-width",1)
                    
                // console.log(item);
                // svg.append("circle")
                //     .attr("class","circle"+item)
                //     .attr("cx", x.)

                this.brushSelection.set(keys[item], d3.extent(d3.filter(brushdata, d => new Date(d.toc) >= startTime && new Date(d.toc) <= endTime), d => d[keys[item]]))
            }









            svg.append("g")
                .attr("class","rectCooling")
                // .attr("transform",`translate(0,${400})`)
                .selectAll("rect")
                // .selectAll("circle")
                .data(allArray)
                .join("g")
                .each(function(d,i) {
                   d3.select(this)
                      .append("circle")
                      .attr("class","coolingButton"+ i)
                      .attr("cx",xCooling(i) +9.4)
                      .attr("cy",484)
                      .attr("r", 5)
                      .attr("storke","#000")
                      .attr("stroke-width",1)
                      .attr("fill","#ccc")
                      .attr('cursor', 'pointer')
                      .on("click",function(e,d){
                          console.log(e);
                          console.log(d);
                          //  path.each(function(d) {
                          //     const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
                          //     d3.select(this).attr("stroke", active ? vm.deGroupStyle : "none");
                          //     if (active) {
                          //         d3.select(this).raise();
                          //         selected.push(d);
                          // }
                          // });
                      })
                })
                .call(g => 
                    g.append("rect")
                        .attr("class",(d, i) => "rectcooling"+ i)
                        .attr("x", (d, i) => xCooling(i))
                        .attr("y", d => 400 + yCooling((d3.filter(d,  e => e["label"] == "1")).length))
                        .attr("height", d => yCooling(0) - yCooling((d3.filter(d,  e => e["label"] == "1")).length) )
                        // .attr("width", xCooling - coolingMargin)
                        .attr("width", xCooling.bandwidth() - coolingMargin -50)
                        // .attr("width", xCooling.bandwidth())


                        // .attr("width", (d,i) => xCooling(i))

                        .attr("fill", util.delabelColor[1]))
                        .attr("opacity",0.5)
                        .attr("stroke","#000")
                        .attr("stroke-width",1)
                .call(g => 
                    g.append("rect")
                    .attr("class",(d, i) => "rectcooling"+ i)
                    .attr("x",(d,i) => xCooling(i))
                    .attr("y", d => 460)
                    .attr("height", d => yCooling(0) - yCooling((d3.filter(d,  e => e["label"] == "0")).length) )
                    .attr("width", xCooling.bandwidth()- coolingMargin -50)
                    // .attr("width", xCooling.bandwidth())
                    .attr("fill", util.delabelColor[0])
                    .attr("opacity",0.5)
                    .attr("stroke","#000")
                    .attr("stroke-width",1)

                )
                d3.select(".rectcooling0").lower()
                d3.select(".rectcooling1").lower()


              
                // .call(g => 
                //   g.append("circle")
                //     .attr("class","coolingCircle"+ i)
                //     .attr("cx",(d,i) => xCooling(i)+ 20)
                //     .attr("cy", 480)
                //     .attr("r", 5)
                //     .attr("storke","#000")
                //     .attr("stroke-width",2)
                //     .attr("fill","#ccc")
                //     .attr('cursor', 'pointer')
                // )





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
                      .attr("y", 410)
                      .attr("text-anchor", "end")
                      .attr("fill", util.tabularTipsTextAttr.fontColor)
                      .attr("font-family", util.tabularTipsTextAttr.fontFamily)
                      .attr("font-size", util.tabularTipsTextAttr.fontSize)
                      .attr("font-weight", util.tabularTipsTextAttr.fontWeight)
                      .attr("font-style", util.tabularTipsTextAttr.fontStyle)
                      .text("sta_cooling")
                  )
                // svg.append("g").attr("class",'x-axis').attr('transform',`translate(${20},${450})`).call(xScale)
                  









            

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
                // .attr("d", d => line(d3.cross(keys, [d], (key, d) => [key, d[key]])))
                .attr("d", d => line(d3.cross(newkeys, [d], (key, d) => [key, d[key]])))
                .attr("class", "pathColor")
                .on("mouseover", pathover)
                .on("mouseout", pathout);
            var selections = this.brushSelection;
            svg.append("g")
              .selectAll("g")
              .data(keys)
              .join("g")
              .attr("transform", d => `translate(0,${y(d)+6})`)
              .call(g => g.append("circle")
              .attr("class", (d, i) => "circlebutton" + i)
              .attr("cx",width - margin.left/2)
              .attr("cy", -40)
              .attr("r", 5)
              .attr("storke","#000")
              .attr("stroke-width",2)
              .attr("fill","#ccc")
              .attr('cursor', 'pointer')
              .on("click", function(e, d){
                  // e.preventDefault();
                  if(d == "tgtplatethickness2"){
                      objStatus["tgtplatethickness2"] = !objStatus["tgtplatethickness2"]
                      if(objStatus["tgtplatethickness2"]){
                          svg.select(".circlebutton0").attr("fill","red")
                      }else{
                          svg.select(".circlebutton0").attr("fill","#ccc")
                      }
                      // svg.select(".circlebutton0").attr("fill","red")
                      // objStatus.push("tgtplatethickness2")
                  }else if(d == "tgtplatelength2"){
                      objStatus["tgtplatelength2"] = !objStatus["tgtplatelength2"]
                      if(objStatus["tgtplatelength2"]){
                          svg.select(".circlebutton1").attr("fill","red")
                      }else{
                          svg.select(".circlebutton1").attr("fill","#ccc")
                      }
                  }else if(d == "tgtwidth"){
                      objStatus["tgtwidth"] = !objStatus["tgtwidth"]
                      if(objStatus["tgtwidth"]){
                          svg.select(".circlebutton2").attr("fill","red")
                      }else{
                          svg.select(".circlebutton2").attr("fill","#ccc")
                      }
                  }else{
                      objStatus["slab_thickness"] = !objStatus["slab_thickness"]
                      if(objStatus["slab_thickness"]){
                          svg.select(".circlebutton3").attr("fill","red")
                      }else{
                          svg.select(".circlebutton3").attr("fill","#ccc")
                      }
                  }
              }))



            svg.append("g")
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
                .call(g => g.append("text")
                    .attr("x", width - margin.left)
                    .attr("y", - 40)
                    .attr("text-anchor", "end")
                    .attr("fill", util.tabularTipsTextAttr.fontColor)
                    .attr("font-family", util.tabularTipsTextAttr.fontFamily)
                    .attr("font-size", util.tabularTipsTextAttr.fontSize)
                    .attr("font-weight", util.tabularTipsTextAttr.fontWeight)
                    .attr("font-style", util.tabularTipsTextAttr.fontStyle)
                    .text(d => d.replace(/tgtwidth/, "tgt_width").replace(/tgtplatethickness2/, "tgt_thickness")
                    .replace(/tgtplatelength2/, "tgt_length").replace(/slab_thickness/, "slab_thickness").replace(/charging_temp_act/, "charging").replace(/status_cooling/,"sta_cooling")))
                    
                .call(g => g.selectAll("text")
                    .clone(true).lower()
                    .attr("fill", "none")
                    .attr("stroke-width", 5)
                    .attr("stroke-linejoin", "round")
                    // .attr("font-family", "DIN")
                    // .attr("stroke", "white")
                    )
                .call(g =>g.selectAll(".domain").remove())
                .call(brush)
                .attr("class",(d,i) => "brushX" + i)
                .call(brush.move, (d,i)=>{
                  if(i< 4){
                    return selections.get(d).map(x.get(d))
                  }
                }
                );
                brushSlider()

                // svg.append("g")
                //  .selectAll("g")
                //  .data(cooling)


                // svg.selectAll("text").attr("font-family", "DIN").attr("stroke", "none").style("fill", "#2c3e50")
          
           
                
                // keys = [ "tgtplatethickness2", "tgtplatelength2","tgtwidth", "slab_thickness"],
            // svg.select(".circlebutton4").remove()
           
           










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
                // console.log(selections);
                if(objStatus[key] && !(tempValue.every((d, i) => d === selection[i]))){
                    d3.select(this).call(brush.move, selections.get(key).map(d => x.get(key)(d)));
                    return
                }else{
                    d3.select(this).call(brushHandle, selection);
                }
                // console.log(key);
                if (selection === null) selections.delete(key);
                else selections.set(key, selection.map(x.get(key).invert));
                const selected = [];
                // d3.select(this).call(brush.move, selections.get(key).map(d => x.get(key)(d)))
                path.each(function(d) {
                    const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
                    d3.select(this).attr("stroke", active ? vm.deGroupStyle : "none");
                    if (active) {
                        d3.select(this).raise();
                        selected.push(d);
                    }
                });
                
                if (selection === null){
                    d3.selectAll(".rect" + keys.indexOf(key))
                    .attr("opacity", 0.5)
                }else{
                    let brushRange = d3.map(selection, x.get(key).invert)
                    d3.selectAll(".rect" + keys.indexOf(key))
                        // .attr("fill", (d,i) => (d.x0 + d.x1)/2 >= brushRange[0] && (d.x0 + d.x1)/2 <= brushRange[1] ? selectedColor : deselectedColor)
                        .attr("opacity", (d,i) => (d.x0 + d.x1)/2 >= brushRange[0] && (d.x0 + d.x1)/2 <= brushRange[1] ? 0.5 : 0.05)
                }
                // if(objStatus[key]){
                //     d3.select(this).call(brushHandle, selection);
                // }
                // console.log(selections.get(key).map(d => x.get(key)(d)));

                svg.property("value", selected).dispatch("input");
                d3.select(".rectBar").lower();
                brushSlider()
               
            }
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
