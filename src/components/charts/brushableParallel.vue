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
            mouseList: undefined,
            brushdata: undefined
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
			"endDate"
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
            // console.log(this)
            plData = this.deepCopy(plData)
            var brushdata = plData.map( d => {
                d.slab_thickness = d.slab_thickness/100;
                return d
            })
            // console.log(brushdata)
            this.brushdata = brushdata
            // return
            var margin = {top: 60, right: 20, bottom: 40, left: 20},
                brushHeight = 10,
                vm = this,
                deselectedColor = "#eeeeee",
                selectedColor = "#cccccc",
                keys = [ "tgtwidth", "tgtplatethickness2", "tgtplatelength2","slab_thickness","charging_temp_act"],
                bardata = d3.map(keys, d => d3.map(brushdata, index => index[d])),
                barbin = d3.map(keys, (d, i) => {
                    var length = 6;
                    var maxlength = bardata[i].length
                    while(true){
                        var max = d3.max(d3.bin().thresholds(length)(bardata[i]), d => d.length) 
                        if(max/maxlength < 0.6){
                            break
                        }else{
                            length++
                        }
                    }
                    return d3.bin().thresholds(length)(bardata[i])
                }),
                barScale = d3.map(barbin, array => d3.scalePow().domain([0, d3.extent(d3.map(array, d => d.length))[1]]).range([0, 50])),
                width = document.getElementById(this.menuId).offsetWidth,
                arc = d3.arc()
                    .innerRadius(0)
                    .outerRadius(8)
                    .startAngle(0)
                    .endAngle((d, i) => i ? 2 * Math.PI : - 2 * Math.PI),
                height = keys.length * 105,
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
                    svg.selectAll("#parallel .overlay").attr("fill", "#eeeeee").raise()
                    svg.selectAll("#parallel .selection").attr("fill", vm.brushSelectColor).attr("fill-opacity", 0.8).raise()
                    // svg.selectAll("#parallel .parallelPath").raise()
                    svg.selectAll(".handle--custom").raise()
                    svg.selectAll("#parallel .domain").remove()
                    svg.selectAll("#parallel .overlay").attr("rx", "5").attr("ry", "5").attr("stroke", "#bbbbbb").attr("stroke-width", 1)
                    svg.selectAll("#parallel .selection").attr("rx", "5").attr("ry", "5").attr("stroke", "#aaa").attr("stroke-width", 1)
                    svg.selectAll("#parallel .tick text").attr("font-family", "DIN").attr("stroke", "none").attr("fill", "#2c3e50")
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
                // d => (d3.filter(brushdata, e => e[keys] <= d.x1 && d.x0 <= e[keys] && +e.label=== 0)).length
                svg.append("g")
                    .attr("class", "rectBar")
                    .attr("transform",`translate(0,${y(keys[item])})`)
                    .selectAll(".rect"+item)
                        .data(barbin[item])
                        .join("g")
                    .call(g => g.append("rect")
                        .attr("class", "rect" +item)
                        .attr("x", d => x.get(keys[item])(d.x0))
                        .attr("fill", util.delabelColor[1])
                        .attr("y", d => -barScale[item]((d3.filter(brushdata, e => e[keys[item]] <= d.x1 && d.x0 <= e[keys[item]] && (+e.label=== 1))).length)+1)
                        .attr("height", d => barScale[item]((d3.filter(brushdata, e => e[keys[item]] <= d.x1 && d.x0 <= e[keys[item]] && (+e.label=== 1))).length))
                        .attr("width", d => x.get(keys[item])(d.x1) - x.get(keys[item])(d.x0) - barmargin))
                    .call(g => g.append("rect")
                        .attr("class", "rect" +item)
                        .attr("x", d => x.get(keys[item])(d.x0))
                        .attr("fill", util.delabelColor[0])
                        .attr("y", 10)
                        // .attr("y", d => -barScale[item](d.length)+1)
                        .attr("height", d => barScale[item]((d3.filter(brushdata, e => e[keys[item]] <= d.x1 && d.x0 <= e[keys[item]] && (+e.label=== 0))).length))
                        .attr("width", d => x.get(keys[item])(d.x1) - x.get(keys[item])(d.x0) - barmargin))
                this.brushSelection.set(keys[item], d3.extent(d3.filter(brushdata, d => new Date(d.toc) >= startTime && new Date(d.toc) <= endTime), d => d[keys[item]]))
            }
            const path = svg.append("g")
                .attr("fill", "none")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.6)
                .attr("class", "parallelPath")
                .selectAll("path")
                .data(vm.paralleldata.slice().sort((a, b) => d3.ascending(a["upid"], b["upid"])))
                .join("path")
                .attr("stroke", this.deGroupStyle)
                .attr("id", d=> `paraPath${d.upid}`)
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
                    .attr("fill", "#2c3e50")
                    .attr("font-family", "DIN")
                    .attr("font-size", "10px")
                    .attr("font-weight", "normal")
                    .text(d => d.replace(/tgtwidth/, "tgt_width").replace(/tgtplatethickness2/, "tgt_thickness")
                        .replace(/tgtplatelength2/, "tgt_length").replace(/slab_thickness/, "slab_thickness").replace(/charging_temp_act/, "charging")))
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
                // console.log(d)
                const tooltip = vm.svg.append("g")
                    .attr("class", "tooltip")
                    .style("font", "12px DIN");

                const path = tooltip.append("path")
                    .attr("fill", "rgba(245, 245, 230, 0.97)");

                const text = tooltip.append("text");

                const line1 = text.append("tspan")
                    .attr("x", 0)
                    .attr("y", 0)
                    .style("font-weight", "bold");

                const line2 = text.append("tspan")
                    .attr("x", 0)
                    .attr("y", "1.1em");

                const line3 = text.append("tspan")
                    .attr("x", 0)
                    .attr("y", "2.2em");			
                tooltip
                    .style("display", null)
                    .attr("fill", "white");
                line1.text(`upid:`+ d.upid);
                line2.text(`category: `+d.productcategory);
                line3.text(`time:`+d.toc);
                path
                    .attr("stroke", "none")
                    .attr("fill", vm.deGroupStyle(d));
                const box = text.node().getBBox();
                // console.log(event)
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
                // .style("visibility", "hidden")
					vm.svg.select(`#paraPath${d.upid}`)
						.attr("stroke-opacity", 0.6)
                        .attr("stroke-width", 1.75)
                vm.$emit("parallMouse", {upid: [d.upid],  mouse: 0});
            }
            function pathout(e,d){
                // d3.select(this).attr("stroke-width", 5)
                vm.svg.selectAll(`.pathColor`)
                    .attr("stroke-opacity", 0.6)
                    .attr("stroke-width", 1)
                vm.svg.selectAll(".tooltip").remove()
                vm.mouseList !==undefined ? vm.mouse(vm.mouseList) : false
                vm.$emit("parallMouse", {upid: [d.upid],  mouse: 1});
            }
            function brushed({selection}, key) {
                if (selection === null) selections.delete(key);
                else selections.set(key, selection.map(x.get(key).invert));
                const selected = [];
                path.each(function(d) {
                const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
                d3.select(this).attr("stroke", active ? vm.deGroupStyle : "none");
                // .attr("visibility", active ? "visible" : "hidden");
                // .style("stroke", active ? vm.deGroupStyle(d) : "none");
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
                    // let [min, max] = [Math.floor((brushRange[0] - Range[0])/path), Math.floor((brushRange[1] - Range[0])/path)]
                    d3.selectAll(".rect" + keys.indexOf(key))
                        // .attr("fill", (d,i) => (d.x0 + d.x1)/2 >= brushRange[0] && (d.x0 + d.x1)/2 <= brushRange[1] ? selectedColor : deselectedColor)
                        .attr("opacity", (d,i) => (d.x0 + d.x1)/2 >= brushRange[0] && (d.x0 + d.x1)/2 <= brushRange[1] ? 0.5 : 0.05)
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
        },
        mouse(value){
			// console.log(value)
			const vm=this
			this.mouseList = value
            this.svg.selectAll(`.pathColor`)
                // .attr("stroke-opacity", 0.05)
                .attr("stroke-width", 1)
                .style("visibility", "hidden")
			if(value.mouse===0){
				for(let item in value.upid){
					this.svg.select(`#paraPath${value.upid[item]}`)
                        .style("visibility", "visible")
						// .attr("stroke-opacity", 0.6)
                        .attr("stroke-width", 1.75)
				}

			}else{
                this.svg.selectAll(`.pathColor`)
                    .style("visibility", "visible")
                    .attr("stroke-width", 1)
                // .attr("stroke-opacity", 0.6)
			}
			
		},
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
