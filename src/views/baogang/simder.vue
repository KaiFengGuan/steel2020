<template>
    <div :id="menuId" style="height: 100%;width:100%;"></div>
</template>

<script>
import * as d3 from 'd3'
import { join } from './jsondata'

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
            const width = 400;
            this.svg !== undefined && this.svg.remove()
            this.svg=d3.select("#"+vm.menuId)
			.append("svg")
            .attr("width", width)
            .attr("height", height);
            // Simple
            const data = [0, 20]
            const sliderwidth = 250
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
                    .attr("transform", `translate(${[width / 2, 0]})`)
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
                if(Math.abs(event.x - width / 2) > sliderwidth/2)return
                d3.select(this)
                    .attr('cx', event.x - offset.x)
                console.log(Math.round(sliderScale(event.x - width / 2)))
                // .attr('cy', event.y - offset.y);
            }
            svg.append("rect")
                .attr("transform", `translate(${[width / 2 - sliderwidth/2 , boxHeight -10]})`)
                .attr("height", 8)
                .attr("width", sliderwidth)
                .attr("fill", "#b8b8b8")
                // .attr("fill", "black")
                // .attr("stroke", "")
            svg
            .append('circle')
            .attr('cx', width / 2)
            .attr('cy', boxHeight -5)
            .attr('r', 8)
            .style('fill', 'white')
            .style('stroke', "#90a4ae")
            .call(
            // Attach drag event handlers to the circle
            d3
                .drag()
                .on('start', dragStart)
                .on('drag', drag)
            );

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
