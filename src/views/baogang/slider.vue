<template>
    <div :id="menuId" style="width: 100%; height: 100%;"></div>
</template>

<script>
import * as d3 from 'd3'
import sliderdata from "./data.json"

export default {
    data () {
        return {
            menuId: 'slider'
        }
    },

    mounted () {
        this.paintChart()
    },

    methods: {
        paintChart() {
            console.log(sliderdata)
            console.log(this.menuId)
            var width = 600;
            var height = 35;
            const miniMargin =  {top: 10, right: 0, bottom: 10, left: 0}
            const miniWidth = width - miniMargin.left - miniMargin.right;
            const miniHeight = height - miniMargin.bottom - miniMargin.top ,
                barColor = "#766FAE" ,
                inactiveColor = "#E6E5F0" ,
                activeColor = "#534e7a" ,
                initialBrushXSelection = [0, 20];
            const miniXScale = d3.scaleBand()
                .domain(sliderdata.map(d => d.x))
                .range([0, miniWidth])
                .paddingInner(0.4);
            const miniYScale = d3.scaleLinear()
                .domain([0, d3.max(sliderdata, d => d.y)]).nice()
                .range([0, miniHeight*0.75]);
            const minimapPositionTranslate = "" + miniMargin.left + "," + parseFloat( miniMargin.top);
            const brush = d3.brushX()
                .extent([[0, 0], [miniWidth, miniHeight]])
                .on("brush", brushmove);
            function scroll() {
                const gBrush = d3.select(".brush");

                let selection = d3.brushSelection(gBrush.node());
                // console.log(event)
                console.log(selection)
                let size = selection[1] - selection[0],
                        range = miniXScale.range(),
                        x0 = d3.min(range),
                        x1 = d3.max(range) + miniXScale.bandwidth(),
                        // dx = -d3.event.deltaX,
                        dx = 0,
                        topSection;

                if (selection[0] - dx < x0) {
                    topSection = x0;
                } else if (selection[1] - dx > x1) {
                    topSection = x1 - size;
                } else {
                    topSection = selection[0] - dx;
                }

                // d3.event.stopPropagation();
                // d3.event.preventDefault();

                gBrush.call(brush.move, [topSection, topSection + size]);
            }

            function brushmove(event) {
                const extentX = event.selection;
                const selected = miniXScale
                    .domain()
                    .filter(d => (extentX[0] - miniXScale.bandwidth() + 1e-2 <= miniXScale(d)) && (miniXScale(d) <= extentX[1] - 1e-2));

                d3.select(".miniGroup").selectAll(".bar")
                    .style("fill", d => selected.indexOf(d.x) > -1 ? barColor : inactiveColor);
            }

            // chart

            const zoomer = d3.zoom()
                .on("zoom", null);

            const svg = d3.select("#"+this.menuId).append("svg")
                .attr("title", sliderdata.barChartSVGTitle)
                .attr("class", "svgWrapper")
                .attr("width", width)
                .attr("height", height)
                .call(zoomer)
                .on("wheel.zoom", scroll)
                .on("mousedown.zoom", null)
                .on("touchstart.zoom", null)
                .on("touchmove.zoom", null)
                .on("touchend.zoom", null);

            const defs = svg.append("defs");
            const wrapperGroup = svg.append("g")
                .attr("class", "wrapperGroup");

            const miniGroup = svg.append("g")
                .attr("class", "miniGroup")
                .attr("transform", "translate(" + minimapPositionTranslate + ")");
            
            const brushGroup = svg.append("g")
                .attr("class", "brushWrapper")
                .attr("transform", "translate(" + minimapPositionTranslate + ")")
                .append("g")
                    .attr("class", "brush")
                    .call(brush);

            brushGroup.selectAll("rect")
                .attr("width", miniWidth);
            
            brushGroup.select(".overlay")
                .each(d => d.type = "selection")
                .on("mousedown touchstart",  (event)=>{
                    try{brushcenter(event)}catch(e){console.log(e)}
                });
            
            function brushcenter(event) {
                let selection = d3.brushSelection(brushGroup.node()),
                    // size = selection[1] - selection[0],
                    size = initialBrushXSelection[1] - initialBrushXSelection[0],
                    range = miniXScale.range(),
                    cx = d3.pointer(event)[0],
                    x0 = cx - size / 2,
                    x1 = cx + size / 2,
                    y1 = d3.max(range) + miniXScale.bandwidth(),
                    pos = x1 > y1 ? [y1 - size, y1] : x0 < 0 ? [0, size] : [x0, x1];

                brushGroup.call(brush.move, pos);
            }

            const miniBars = miniGroup.selectAll(".bar")
                .data(sliderdata, d => d.dayCount)
                .join("rect")
                    .attr("class", "bar")
                    .attr("x", d => miniXScale(d.x))
                    .attr("y", d => miniHeight + miniMargin)
                    .attr("width", miniXScale.bandwidth())
                    .attr("height", d => miniHeight)
                    .attr("stroke", "black")
                    .style("fill", barColor);
            brushGroup.call(brush.move, initialBrushXSelection);
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
