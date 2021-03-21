<template>
    <div :id="menuId" style="height: 100%;width:100%"></div>
</template>

<script>
import * as d3 from 'd3'
// import brushdata from "./chartdata/brushdata.json"
import util from 'src/views/baogang/util.js';
import { mapGetters, mapMutations} from 'vuex'
export default {
    data () {
        return {
            menuId: 'brushableParallel',
            svg: undefined,
            labelColors: util.labelColor, // [bad, good]
            categoryColors: util.categoryColor,
        }
    },

    mounted () {
    },
    computed:{
        ...mapGetters([
			"isSwitch",
			"trainGroupStyle",
            "brushMouseId",
            "brushSelection"
		])
    },
    watch:{
        isSwitch(val,oldVal){
            d3.selectAll(".pathColor").attr("stroke", this.trainGroupStyle)
        }
    },
    methods: {
        paintChart(plData, startTime, endTime) {
            // var brushdata = plData
            // console.log(brushdata[0].slab_thickness)
            var brushdata = d3.map(plData, d => {
                // d.slab_thickness = d.slab_thickness/100;
                return d
            })
            console.log(brushdata[0].slab_thickness)
            var margin = {top: 60, right: 30, bottom: 40, left: 30},
                brushHeight = 10,
                vm = this,
                deselectedColor = "#eeeeee",
                selectedColor = "#cccccc",
                label = d => d.name,
                keys = [ "tgtwidth", "tgtplatethickness2", "tgtplatelength2","slab_thickness","charging_temp_act", ],
                // keys = Object.keys(brushdata[0]).filter(d => d !== "name"),
                bardata = d3.map(keys, d => d3.map(brushdata, index => index[d])),
                barbin = d3.map(keys, (d, i) => {
                    var length = 6;
                    var maxlength = bardata[i].length
                    while(true){
                        var max = d3.max(d3.bin().thresholds(length)(bardata[i]), d => d.length) 
                        if(max/maxlength < 0.7){
                            break
                        }else{
                            length++
                        }
                    }
                    return d3.bin().thresholds(length)(bardata[i])
                }),
                // barNum = d3.map(bardata, alldata => {
                //     let range = d3.extent(alldata)
                //     let path = (range[1] - range[0])/6;
                //     let init = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0}
                //     let array = d3.groups(alldata, d => d == null ? 1 : Math.floor((d - range[0])/path) + 1)
                //     d3.map(array, (d,i) => {
                //         init[d[0]] = d[1].length
                //     })
                //     return Object.values(init)
                // }),
                barScale = d3.map(barbin, array => d3.scalePow().domain([0, d3.extent(d3.map(array, d => d.length))[1]]).range([10, 50])),
                barRange = new Map(d3.zip(keys,d3.map(bardata, alldata => d3.extent(alldata)))),
                // barScale = d3.map(barNum, num => d3.scalePow().domain([0, d3.extent(num)[1]]).range([10, 50])),
                width = document.getElementById(this.menuId).offsetWidth,
                // xBand = d3.scaleBand()
                //     .domain(d3.range(barNum[0].length))
                //     .range([margin.left, width - margin.right])
                //     .padding(0.5),
                arc = d3.arc()
                    .innerRadius(0)
                    .outerRadius(8)
                    .startAngle(0)
                    .endAngle((d, i) => i ? 2 * Math.PI : - 2 * Math.PI),
                height = keys.length * 85,
                x = new Map(Array.from(keys, key => [key, d3.scaleLinear([barbin[keys.indexOf(key)][0].x0, barbin[keys.indexOf(key)].slice(-1)[0].x1], [margin.left, width - margin.right])])),
                // x = new Map(Array.from(keys, key => [key, d3.scaleLinear([barbin[keys.indexOf(key)][0].x0, barbin[keys.indexOf(key)].slice(-1)[0].x1]), [margin.left, width - margin.right])])),
                // x = new Map(Array.from(keys, key => [key, d3.scaleLinear(d3.extent(brushdata, d => d[key]), [margin.left, width - margin.right])])),
                y = d3.scalePoint(keys, [margin.top, height - margin.bottom]),
                line = d3.line()
                    .defined(([, value]) => value != null)
                    .x(([key, value]) => x.get(key)(value))
                    .y(([key]) => y(key)),
                brushHandle = (g, selection) => g
                    .selectAll(".handle--custom")
                    .data([{type: "w"}, {type: "e"}])
                    .join(
                        enter => enter.append("path")
                            .attr("class", "handle--custom")
                            .attr("fill", "white")
                            .attr("fill-opacity", 1)
                            .attr("stroke", "#90a4ae")
                            .attr("stroke-width", 2)
                            .attr("cursor", "ew-resize")
                            .attr("d", arc)
                    )
                        .attr("display", selection === null ? "none" : null)
                        .attr("transform", selection === null ? null : (d, i) => `translate(${selection[i]},${0})`)
                function brushSlider(){
                    d3.selectAll("#parallel .overlay").attr("fill", "#eeeeee").raise()
                    d3.selectAll("#parallel .selection").attr("fill", selectedColor).attr("fill-opacity", 1).raise()
                    // d3.selectAll("#parallel .parallelPath").raise()
                    d3.selectAll(".handle--custom").raise()
                    d3.selectAll("#parallel .domain").remove()
                    d3.selectAll("#parallel .overlay").attr("rx", "5").attr("ry", "5").attr("stroke", "#bbbbbb").attr("stroke-width", 1)
                    d3.selectAll("#parallel .selection").attr("rx", "5").attr("ry", "5").attr("stroke", "#bbbbbb").attr("stroke-width", 1)
                    d3.selectAll("#parallel .tick text").attr("font-family", "DIN").attr("stroke", "none").attr("fill", "#2c3e50")
                }

            // const 
            // const height = document.getElementById(this.menuId).offsetHeight;
            // const height = 22;
            // const width = 350;
            this.svg !== undefined && this.svg.remove()
            this.svg=d3.select("#"+vm.menuId)
                .append("svg")
                .attr("width", width)
                .attr("height", height);
            var svg = this.svg.attr("id", "parallel")
            // const svg = d3.create("svg")
            //     .attr("id", "parallel")
            //     .attr("viewBox", [0, 0, width, height]);

            const brush = d3.brushX()
                .extent([
                    [margin.left, -(brushHeight / 2)],
                    [width - margin.right, brushHeight / 2]
                ])
                .on("start brush end", brushed);
            for(let item in keys){
                var barmargin =  (width - margin.right - margin.left) / barbin[item].length/2;
                svg.append("g")
                    .attr("class", "rectBar")
                    .attr("transform",`translate(0,${y(keys[item])})`)
                    .call(g => g.append("g")
                        .selectAll(".rect"+item)
                        .data(barbin[item])
                        .join("rect")
                        .attr("class", "rect" +item)
                        .attr("x", d => x.get(keys[item])(d.x0))
                        .attr("fill", selectedColor)
                        .attr("y", d => -barScale[item](d.length)+1)
                        .attr("height", d => barScale[item](d.length))
                        .attr("width", d => x.get(keys[item])(d.x1) - x.get(keys[item])(d.x0) - barmargin))
                // svg.append("g")
                //     .attr("class", "rectBar")
                //     .attr("transform",`translate(0,${y(keys[item])})`)
                //     .call(g => g.append("g")
                //         .selectAll(".rect"+item)
                //         .data(barNum[item])
                //         .join("rect")
                //         .attr("class", "rect" +item)
                //         .attr("x", (d, i) => xBand(i))
                //         .attr("fill", selectedColor)
                //         .attr("y", d => -barScale[item](d))
                //         .attr("height", d => barScale[item](d))
                //         .attr("width", xBand.bandwidth()))
                // this.brushSelection.set(keys[item], d3.extent(d3.map(brushdata.slice(400), d => d[keys[item]])))
                this.brushSelection.set(keys[item], d3.extent(d3.filter(brushdata, d => new Date(d.toc) >= startTime && new Date(d.toc) <= endTime), d => d[keys[item]]))
            }
            const path = svg.append("g")
                .attr("fill", "none")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.6)
                .attr("class", "parallelPath")
                .selectAll("path")
                .data(brushdata.slice().sort((a, b) => d3.ascending(a["upid"], b["upid"])))
                .join("path")
                .attr("stroke", this.trainGroupStyle)
                .attr("d", d => line(d3.cross(keys, [d], (key, d) => [key, d[key]])))
                .attr("class", "pathColor")
                .on("mouseover", pathover)
                .on("mouseout", pathout);

            // path.append("title")
            //     .text(label);
            var selections = this.brushSelection;
            svg.append("g")
                .selectAll("g")
                .data(keys)
                .join("g")
                .attr("transform", d => `translate(0,${y(d)+6})`)
                .attr("id", (d, i) => "parallel" + i)
                // .attr("fill", "#2c3e50")
                .each(function(d,i) { 
                    d3.select(this)
                    
                        .call(d3.axisBottom(x.get(d))
                            .tickSizeOuter(10)
                            .tickSizeInner(10)
                            .ticks(barbin[i].length)); 
                })
                .call(g => g.append("text")
                    .attr("x", width - margin.left)
                    .attr("y", -50)
                    .attr("text-anchor", "end")
                    .attr("fill", "#c0c5cb")
                    .attr("font-family", "DIN")
                    .attr("font-size", "10px")
                    .text(d => d))
                .call(g => g.selectAll("text")
                    .clone(true).lower()
                    .attr("fill", "none")
                    .attr("stroke-width", 5)
                    .attr("stroke-linejoin", "round")
                    .attr("font-family", "DIN")
                    // .attr("stroke", "white")
                    )
                .call(g =>g.selectAll(".domain").remove())
                .call(brush)
                .call(brush.move, d => selections.get(d).map(x.get(d)));
                brushSlider()
                // svg.selectAll("text").attr("font-family", "DIN").attr("stroke", "none").style("fill", "#2c3e50")
                
            function pathover(event,d){
                // d3.select(this).attr("stroke-width", 5)
                // const tooltip = svg.append("g")
                //     .attr("class", "parallelTooltip")
                //     .style("font", "12px DIN");

                // const path = tooltip.append("path")
                //     .attr("fill", "rgba(245, 245, 230, 0.97)");
                // const text = tooltip.append("text");

                // const line1 = text.append("tspan")
                //     .attr("x", 0)
                //     .attr("y", 0)
                //     .style("font-weight", "bold");

                // const line2 = text.append("tspan")
                //     .attr("x", 0)
                //     .attr("y", "1.1em");

				// 	const line3 = text.append("tspan")
				// 		.attr("x", 0)
				// 		.attr("y", "2.2em");
				// 	const label=d;
				// 	d3.selectAll("circle.dot").style("opacity", 0.4);
				// 	d3.select("#scatter"+label.upid).attr("r",2).style("opacity", 1);				
				// 	tooltip
				// 		.style("display", null)
				// 		.attr("fill", "white");
				// 	line1.text(`upid:`+ d.upid);
				// 	line2.text(`category: `+d.productcategory);
				// 	line3.text(`time:`+d.toc);
				// 	path
				// 		.attr("stroke", "none")
				// 		.attr("fill", vm.tooltipColor(label));
				// 	const box = text.node().getBBox();
				// 	let x = event.pageX - 78,
				// 		y = event.pageY - 150;
				// 	// const x=vm.scaleX(d.x)-75
				// 	// let y=vm.scaleY(d.y)+12
				// 	if(y+box.height + 30>h-8*marginH){					
				// 	path.attr("d", `
				// 		M${box.x - 10},${box.y - 10}
				// 		H${box.width / 2 - 5}l5,15l5,-15
				// 		H${box.width + 10}
				// 		v-${box.height + 20}
				// 		h-${box.width + 20}
				// 		z
				// 	`)
				// 	text.attr("transform", `translate(${[box.x,box.y - 50]})`);
				// 	}else if(y+box.height + 30<h-2*marginH){
				// 	y=y+24
				// 	path.attr("d", `
				// 		M${box.x - 10},${box.y - 10}
				// 		H${box.width / 2 - 5}l5,-15l5,15
				// 		H${box.width + 10}
				// 		v${box.height + 20}
				// 		h-${box.width + 20}
				// 		z
				// 	`);
				// 	text.attr("transform", `translate(${[box.x+5,box.y+10]})`);
				// 	}
				// 	tooltip.attr("transform", `translate(${[x,y]})`);
				// 	vm.$emit("scatterMouse", {upid: d.upid,  mouse: 0});
            }
            function pathout(e,d){
                // d3.select(this).attr("stroke-width", 5)
            }
            	// 			.on("mouseover", (event, d)=> {
				// 	const tooltip = vm.svg.append("g")
				// 		.attr("class", "scattertooltip")
				// 		.style("font", "12px sans-serif");

				// 	const path = tooltip.append("path")
				// 		.attr("fill", "rgba(245, 245, 230, 0.97)");

				// 	const text = tooltip.append("text");

				// 	const line1 = text.append("tspan")
				// 		.attr("x", 0)
				// 		.attr("y", 0)
				// 		.style("font-weight", "bold");

				// 	const line2 = text.append("tspan")
				// 		.attr("x", 0)
				// 		.attr("y", "1.1em");

				// 	const line3 = text.append("tspan")
				// 		.attr("x", 0)
				// 		.attr("y", "2.2em");
				// 	const label=d;
				// 	d3.selectAll("circle.dot").style("opacity", 0.4);
				// 	d3.select("#scatter"+label.upid).attr("r",2).style("opacity", 1);				
				// 	tooltip
				// 		.style("display", null)
				// 		.attr("fill", "white");
				// 	line1.text(`upid:`+ d.upid);
				// 	line2.text(`category: `+d.productcategory);
				// 	line3.text(`time:`+d.toc);
				// 	path
				// 		.attr("stroke", "none")
				// 		.attr("fill", vm.tooltipColor(label));
				// 	const box = text.node().getBBox();
				// 	let x = event.pageX - 78,
				// 		y = event.pageY - 150;
				// 	// const x=vm.scaleX(d.x)-75
				// 	// let y=vm.scaleY(d.y)+12
				// 	if(y+box.height + 30>h-8*marginH){					
				// 	path.attr("d", `
				// 		M${box.x - 10},${box.y - 10}
				// 		H${box.width / 2 - 5}l5,15l5,-15
				// 		H${box.width + 10}
				// 		v-${box.height + 20}
				// 		h-${box.width + 20}
				// 		z
				// 	`)
				// 	text.attr("transform", `translate(${[box.x,box.y - 50]})`);
				// 	}else if(y+box.height + 30<h-2*marginH){
				// 	y=y+24
				// 	path.attr("d", `
				// 		M${box.x - 10},${box.y - 10}
				// 		H${box.width / 2 - 5}l5,-15l5,15
				// 		H${box.width + 10}
				// 		v${box.height + 20}
				// 		h-${box.width + 20}
				// 		z
				// 	`);
				// 	text.attr("transform", `translate(${[box.x+5,box.y+10]})`);
				// 	}
				// 	tooltip.attr("transform", `translate(${[x,y]})`);
				// 	vm.$emit("scatterMouse", {upid: d.upid,  mouse: 0});
				// })
				// .on("mouseout", (event, d)=> {
				// 	d3.select("#scatter"+d.upid).style("opacity", 1)
				// 	let toc=new Date(d.toc)
				// 	if(toc<this.GaleArray[1]&&toc>this.GaleArray[0]){}else{
				// 		d3.select("#scatter"+d.upid).attr("r",1)
				// 	}					
				// 	d3.selectAll(".scattertooltip").remove();
				// 	vm.$emit("scatterMouse", {upid: d.upid,  mouse: 1});
				// })
            function brushed({selection}, key) {
                if (selection === null) selections.delete(key);
                else selections.set(key, selection.map(x.get(key).invert));
                const selected = [];
                path.each(function(d) {
                const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
                d3.select(this).attr("visibility", active ? "visible" : "hidden");
                // .style("stroke", active ? vm.trainGroupStyle(d) : "none");
                if (active) {
                    d3.select(this).raise();
                    selected.push(d);
                }
                });
                if (selection === null){
                    d3.selectAll(".rect" + keys.indexOf(key))
                    .attr("fill", selectedColor)
                }else{
                    let brushRange = d3.map(selection, x.get(key).invert)
                    // let [min, max] = [Math.floor((brushRange[0] - Range[0])/path), Math.floor((brushRange[1] - Range[0])/path)]
                    d3.selectAll(".rect" + keys.indexOf(key))
                        .attr("fill", (d,i) => (d.x0 + d.x1)/2 >= brushRange[0] && (d.x0 + d.x1)/2 <= brushRange[1] ? selectedColor : deselectedColor)
                }
                // console.log(this)
                // console.log(d3.select("#parallel" + keys.indexOf(key)).node())
                // console.log(this === d3.select("#parallel" + keys.indexOf(key)).node()) //true
    
                // d3.select("#parallel" + keys.indexOf(key)).call(brushHandle, selection);
                d3.select(this).call(brushHandle, selection);
                svg.property("value", selected).dispatch("input");
                d3.select(".rectBar").lower();
                brushSlider()
            }
        }
    },
    mounted(){
    },
    // computed:{
    //     ...mapGetters([
    //         "brushMouseId",
    //         "brushSelection"])
    // }

}
</script>

<style scoped>
/* .domain {
    stroke: "#E6E5F0";
}
.tick line {
    stroke: "#E6E5F0";
} */
text{
    fill: black;
}
</style>
