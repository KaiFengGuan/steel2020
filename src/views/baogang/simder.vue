<template>
    <div :id="menuId" style="height: 100%;width:100%;"></div>
</template>

<script>
import * as d3 from 'd3'

export default {
    data () {
        return {
            menuId: 'simder',
            svg: undefined
        }
    },

    mounted () {
        // this.paintChart()
    },

    methods: {
        paintChart(sliderdata) {

            const vm=this
            // const height = document.getElementById(this.menuId).offsetHeight;
            const height = 22	
            const width = 350;
            this.svg !== undefined && this.svg.remove()
            this.svg=d3.select("#"+vm.menuId)
			.append("svg")
            .attr("width", width)
            .attr("height", height);
            // Simple
            const data = [0, 20]
            const sliderwidth = 200
            const sliderScale = d3.scaleLinear()
				.range(data)
				.domain([-sliderwidth/2 , sliderwidth/2])
            const boxHeight = 22;
            const svg = this.svg;
            if(sliderdata !== undefined){
                sliderdata = sliderdata.slice(0, data[1])
                console.log(sliderdata)
                const rectwidth = sliderwidth /sliderdata.length;
                svg.append("g")
                    .selectAll(".sliderRect")
                    .data(sliderdata)
                    .join("g")      
                    .attr("class", "sliderRect")
                    .attr("transform", `translate(${[width / 3, 0]})`)
                    .call(g => g.append("rect")
                        .attr("fill", d => d.color)
                        .attr("height", boxHeight - 10)
                        .attr("width", rectwidth)
                        .attr("x", (d,i) => sliderScale.invert(i)))
            }
            // offset represents the delta between the click/touch point
            // and the x-y coordinates of the circle
            let offset = { x: 0, y: 0 };

            // dragStart is called once
            function dragStart(event) {
                // Set the offset values
                // console.log(event)
                offset.x = event.x - d3.select(this).attr('cx');
                offset.y = event.y - d3.select(this).attr('cy');
            }

            // drag is called continuously
            function drag(event) {
                // Set the value of the circle coordinates
                // and maintain the click/touch offset
                // console.log(event)
                if(Math.abs(event.x - width / 3) > sliderwidth/2)return
                d3.select(this)
                    .attr('cx', event.x - offset.x)
                // d3.select("#sliderShadow").attr("width", event.x -( width / 3 - sliderwidth/2))
                console.log(Math.round(sliderScale(event.x - width / 3)))
                // .attr('cy', event.y - offset.y);
            }
            function dragEnd(event){
                const label = Math.round(sliderScale(event.x - width / 3))
                d3.select("#labeltext").text(sliderdata[label].date)
                d3.select("#labelrect").attr("fill", sliderdata[label].color)
                    .attr("stroke", d3.color(sliderdata[label].color).darker(2))
            }
            svg.append("rect")
                .attr("transform", `translate(${[width / 3 - sliderwidth/2 , boxHeight -10]})`)
                .attr("height", 6)
                .attr("width", sliderwidth)
                .attr("fill", "#E4E7ED")
                .attr("rx", 3)
                .attr("ry", 3)
            // svg.append("rect")
            //     .attr("transform", `translate(${[width / 3 - sliderwidth/2 , boxHeight -10]})`)
            //     .attr("height", 6)
            //     .attr("id", "sliderShadow")
            //     .attr("width", sliderwidth / 2)
            //     .attr("fill", "#999a9d")
            //     .attr("rx", 3)
            //     .attr("ry", 3)
            svg.append("g")
                .call(g => g.append("rect")
                        .attr("stroke", "#c4c4c4")
                        .attr("transform", `translate(${[width / 3 + sliderwidth/2 +10, 0]})`)
                        .attr("stroke-width", 0.15)
                        .attr("width", 120)
                        .attr("height", 20)
                        // .attr("fill", "#f4f4f5")
                        .attr("fill", sliderdata[Math.round(sliderScale(0))].color)
                        .attr("text-anchor", "middle")
                        .attr("stroke", d3.color(sliderdata[Math.round(sliderScale(0))].color).darker(2))
                        .attr("id", "labelrect")
                        .attr("opacity", 0.7)
                        .attr("rx", 10)
                        .attr("ry", 5))
                .call(g => g.append("text")
                    .attr("transform", `translate(${[width / 3 + sliderwidth/2 + 75, 15]})`)
                    .style("font-family", "DIN")
                    .style("padding", "0px")
                    .attr("font-size", "9pt")
                    .attr("id", "labeltext")
                    .attr("text-anchor", "middle")
                    .attr("fill", "#6d7885")
                    .attr("font-weight", 500)
                    .text(sliderdata[Math.round(sliderScale(0))].date))
            svg
            .append('circle')
            .attr('cx', width / 3)
            .attr('cy', boxHeight - 7)
            .attr('r', 7.5)
            .style('fill', 'white')
            .attr('stroke', "#90a4ae")
            .attr('stroke-width', 2)
            .call(
            // Attach drag event handlers to the circle
            d3
                .drag()
                .on('start', dragStart)
                .on('drag', drag)
                .on('end', dragEnd)
            );

        }
    },
    mounted(){
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
