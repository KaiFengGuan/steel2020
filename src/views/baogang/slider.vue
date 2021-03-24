<template>
    <div :id="menuId" style="width: 100%; height: 100%;"></div>
</template>

<script>
import * as d3 from 'd3'
import sliderdata from "./data.json"
import {mapGetters, mapMutations} from "vuex"
export default {
    data () {
        return {
            menuId: 'slider',
            svg: undefined
        }
    },

    mounted () {
    },
    computed:{
        ...mapGetters([
            "labelColor",
            "startDate",
            "endDate",
            "brushSelectColor"
        ])
    },
    methods: {
        ...mapMutations([
            "setStartDate",
            "setEndDate"
        ]),
        paintChart(brushData) {
            const width = document.getElementById(this.menuId).offsetWidth,
                height = document.getElementById(this.menuId).offsetHeight,
                miniMargin =  {top: 5, right: 20, bottom: 10, left: 30},
                miniHeight = height - miniMargin.bottom - miniMargin.top,
                miniXScale = d3.scaleBand()
                    .domain(brushData.endTimeOutput)
                    .range([miniMargin.left, width - miniMargin.right])
                    .paddingInner(0.5),
                vm = this,
                miniYScale = d3.scaleLinear()
                    .domain([0, d3.max(brushData.good_flag, (d, i) => d + brushData.bad_flag[i])]).nice()
                    .range([0, miniHeight*0.75]);
            var timeout = undefined;
            this.svg !== undefined && this.svg.remove()
			this.svg = d3.select("#"+ this.menuId)
				.append("svg")
				.attr("class",'timeSlider')
				.attr("width", width)
				.attr("height", height);	
            const svg = this.svg,
                keys = brushData.endTimeOutput.map((d,i) => i);
            const miniBars = svg.selectAll(".bar")
                .data(keys).join("g")
                .call(g => g.append("rect")
                    .attr("class", "goodbar")
                    .attr("x", d => miniXScale(brushData.endTimeOutput[d]))
                    .attr("y", d => miniHeight - miniYScale(brushData.good_flag[d]))
                    .attr("width", miniXScale.bandwidth())
                    .attr("height", d => miniYScale(brushData.good_flag[d]))
                    .attr("stroke", "none")
                    .attr("fill", this.labelColor[1]))
                .call(g => g.append("rect")
                    .attr("class", "badbar")
                    .attr("x", d => miniXScale(brushData.endTimeOutput[d]))
                    .attr("y", d => miniHeight - miniYScale(brushData.good_flag[d]) - miniYScale(brushData.bad_flag[d]))
                    .attr("width", miniXScale.bandwidth())
                    .attr("height", d => miniYScale(brushData.bad_flag[d]))
                    .attr("stroke", "none")
                    .attr("fill", this.labelColor[0]))
                .on("mouseover",mouseover)
                .on("mouseout",mouseout);
            const arc = d3.arc()
                    .innerRadius(0)
                    .outerRadius(10)
                    .startAngle(0)
                    .endAngle(2 * Math.PI ),
                x = d3.scaleLinear([0, 1], [miniMargin.left, width - miniMargin.right]),
                brushHandle = (g, selection) => g
                    .selectAll(".handle--custom")
                    .data([{type: "w"}, {type: "e"}])
                    .join(
                        enter => enter.append("path")
                            .attr("class", "handle--custom")
                            .attr("fill", (d, i) => i === 0 ? d3.color(this.labelColor[1 - i]) : d3.color(this.labelColor[1 - i]).brighter(1.6))
                            // .attr("fill", (d, i) => this.labelColor[i])
                            // .attr("fill-opacity", 0.8)
                            .attr("stroke", (d, i) => d3.color(this.labelColor[ 1 - i]).darker(0.5))
                            .attr("stroke-width", 2)
                            .attr("cursor", "ew-resize")
                            .attr("d", arc)
                    )
                        .attr("display", selection === null ? "none" : null)
                        .attr("id", (d, i) => "handle" + i)
                        .attr("coordinate", selection === null ? null : (d, i) => [selection[i], (height  - miniMargin.bottom - 5)])
                        .attr("transform", selection === null ? null : (d, i) => `translate(${selection[i]},${(height  - miniMargin.bottom - 5)})`),
                brush = d3.brushX()
                    .extent([[miniMargin.left, height - miniMargin.bottom - 11], [width - miniMargin.right, height - 7]])
                    .on("start brush", brushed)
                    .on("end", endSelect);
            svg.append("g")
                .call(brush)
                .call(brush.move, [50, 100]);
            function brushed({selection}) {
                const brushEnter = d3.map(brushData.endTimeOutput, d => {
                    return miniXScale(d) >= selection[0]  && selection[1] >= miniXScale(d)
                })
                let good = 0, bad = 0;
                brushEnter.map((d, i) =>{
                    if(d){
                        good += brushData.good_flag[i]
                        bad += brushData.bad_flag[i]
                    }
                })
                // console.log(good,bad)
                d3.selectAll(".goodbar").attr("opacity", (d,i) => brushEnter[i] ? 1 : 0.2)
                d3.selectAll(".badbar").attr("opacity", (d,i) => brushEnter[i] ? 1 : 0.2)
                const textX = +d3.select(".selection").attr("x") + (+ d3.select(".selection").attr("width"))/2,
                    textY = +d3.select(".selection").attr("y") + 11;
                d3.select(".selectionText").remove()
                svg.append("text")
                    .attr("class", "selectionText")
                    .attr("x", textX)
                    .attr("y", textY)
                    .attr("text-anchor", "middle")
                    .attr("font-family", "DIN")
                    .attr("stroke", "none")
                    .attr("fill", "white")
                    .attr("font-size", "10px")
                    .text(good + bad)
                // console.log(d3.select(".selectionText").node().getBBox())
                if(d3.select(".selection").attr("width") - 10 < d3.select(".selectionText").node().getBBox().width){
                    d3.select(".selectionText").attr("fill", "none")
                }
                // console.log(d3.select(".selection"))
                d3.selectAll(".handletext").remove()
                if(good + bad !== 0 &&  selection !== null){
                    svg.selectAll(".handletext").data(selection)
                    .join(
                        enter => enter.append("text")
                        .attr("class", "handletext")
                        .attr("text-anchor", "middle")
                        .attr("font-family", "DIN")
                        .attr("transform", (d, i) => `translate(${selection[i]},${(height  - miniMargin.bottom)})`)
                        .attr("stroke", "none")
                        .attr("fill", "white")
                        .attr("font-size", "10px")
                        .text((d, i) => i === 0 ? 100 - (bad/ (bad + good)*100).toFixed(0) : (bad/ (bad + good)*100).toFixed(0))
                    )
                    // .join("g")
                    // .call(g => g.append("text")
                    //     .attr("class", "handletext")
                    //     .attr("text-anchor", "middle")
                    //     .attr("font-family", "DIN")
                    //     .attr("transform", (d, i) => `translate(${selection[i]},${(height  - miniMargin.bottom)})`)
                    //     .attr("stroke", "none")
                    //     .attr("fill", "black")
                    //     .attr("font-size", "12px")
                    //     .text((d, i) => i === 0 ? (bad/ (bad + good)*100).toFixed(0) : 100 - (bad/ (bad + good)*100).toFixed(0)))
                }
                d3.select(this).call(brushHandle, selection);
                svg.select(".selection").attr("fill-opacity", 1).attr("fill", vm.brushSelectColor)
                svg.select(".overlay").attr("stroke", "#bbbbbb").attr("stroke-width", 1).attr("fill", "#eeeeee").attr("rx", 8).attr("ry", 8)
                svg.selectAll(".handle--custom").raise()
            }
            function endSelect  ({selection}) {
                if(timeout !==  undefined) {
                    clearTimeout(timeout)
                }
                if(selection == null)return
                const brushTime = d3.filter(brushData.endTimeOutput, d => {
                    return miniXScale(d) >= selection[0]  && selection[1] >= miniXScale(d)
                })
                const brushEnter = d3.map(brushData.endTimeOutput, d => {
                    return miniXScale(d) >= selection[0]  && selection[1] >= miniXScale(d)
                })
                let good = 0, bad = 0;
                brushEnter.map((d, i) =>{
                    if(d){
                        good += brushData.good_flag[i]
                        bad += brushData.bad_flag[i]
                    }
                })
                if(good + bad ===0){
                    return
                }else{
                    timeout = setTimeout(function uploaddate(){
                        if(selection.length >= 2){
                            vm.setStartDate(new Date(new Date(brushTime[0]) - 0.5*86400*1000))
                            vm.setEndDate(new Date(brushTime[brushTime.length - 1]))
                        }else{
                            vm.setStartDate(new Date(new Date(brushTime[0]) - 0.5*86400*1000))
                            vm.setEndDate(new Date(brushTime[0]))
                        }
                        svg.select(".selection").attr("fill-opacity", 1).attr("fill", vm.brushSelectColor)
                    }, 1000)
                }
            }
            // function uploaddate(selection, brushTime){
            //     console.log("dufvuu")
            //     if(selection.length >= 2){
            //         vm.setStartDate(new Date(new Date(brushTime[0]) - 0.5*86400*1000))
            //         vm.setEndDate(new Date(brushTime[brushTime.length - 1]))
            //     }else{
            //         vm.setStartDate(new Date(new Date(brushTime[0]) - 0.5*86400*1000))
            //         vm.setEndDate(new Date(brushTime[0]))
            //     }
            // }
            function mouseover(event,d){
                const tooltip = svg.append("g")
                .attr("class", "tooltip")
                .style("font", "11px DIN");

                const path = tooltip.append("path")
                    .attr("stroke", "rgba(148, 167, 183, 0.4)")
                    .attr("fill", "white");

                const text = tooltip.append("text");

                const line1 = text.append("tspan")
                    .attr("x", 0)
                    .attr("y", 0)
                    .style("font-weight", "bold");

                const line2 = text.append("tspan")
                    .attr("x", 0)
                    .attr("y", "1.3em");

                const line3 = text.append("tspan")
                    .attr("x", 0)
                    .attr("y", "2.6em");
                tooltip
                    .style("display", null)
                    .attr("fill", "white");
                line1.text(`Time : `+ brushData.endTimeOutput[d]).attr("fill", "black");
                line2.text(`Good : ` + brushData.good_flag[d]).attr("fill", vm.labelColor[1]);
                line3.text(`Bad  : ` + brushData.bad_flag[d]).attr("fill", vm.labelColor[0]);
                const box = text.node().getBBox();
                let x = event.offsetX,
                    y = event.offsetY;
                if(x + box.width < width - miniMargin.right + 10){
                    path.attr("d", `
                        M${box.x - 10},${box.y - 5}
                        h${box.width + 20}
                        v${box.height + 10}
                        h-${box.width + 20}
                        v-${box.height/2 - 5}
                        l-15,-5l15,-5
                        V${box.y - 5}
                        z
                    `)
                    tooltip.attr("transform", `translate(${[x + 30, y - 10]})`);
                }else{
                    path.attr("d", `
                        M${box.x - 10},${box.y - 5}
                        h${box.width + 20}
                        v${box.height/2 - 5}
                        l15,5l-15,5
                        v${box.height/2 +5}
                        h-${box.width + 20}
                        V${box.y - 5}
                        z
                    `)
                    tooltip.attr("transform", `translate(${[x - box.width - 25, y - 10]})`);
                }
                d3.select(".tooltip").raise()
            }
            function mouseout(event, d){
                svg.selectAll(".tooltip").remove();
            }
            setInterval(function selectionOR(){
                svg.select(".selection").attr("fill-opacity", 1).attr("fill", vm.brushSelectColor)
            }, 1000)
        }
    }
}
</script>

<style scoped>
/* .domain {
    stroke: "#E6E5F0";
}
.tick line {
    stroke: "#E6E5F0";
} */
</style>
