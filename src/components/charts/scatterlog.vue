<template>
	<div>
		<div :id="menuId" style="height: 100%;width:100%;padding:5px"></div>
	</div>
</template>

<script>
import * as d3 from 'd3';
import util from 'src/views/baogang/util.js';
import {mapGetters} from "vuex"
export default {
	data() {
		return {
			menuId: 'scatterlog',
			svg: undefined,
			data:[],
			tooltip:undefined,
			scatterdata:[],
			changeColor: false,
			categoryColors: util.categoryColor,
			labelColors: util.labelColor, // [bad, good]
			labelColorsFunc: util.labelColorFunc,
			property:["ave_temp_dis","avg_p5","crowntotal","finishtemptotal","tgtplatelength2","tgtplatethickness2","tgtwidth","wedgetotal"],
			GaleArray:[],
			mouseAttrs:{"color": "#666666", "r": 3, "stroke": 0.5},
			clickAttrs:{"color": "#666666", "r": 4, "stroke": 1.25},
			mouseList: undefined
		}
	},
	methods: {
		paintChart(jsondata) {
			const vm=this
			const w = document.getElementById(this.menuId).offsetWidth, h = document.getElementById(this.menuId).offsetHeight,marginH = 15, marginW = 15;
			this.svg !== undefined && this.svg.remove()
			this.svg=d3.select("#scatterlog")
				.append("svg")
				.attr("class",'scatterlogger')
				.attr("width", w)
				.attr("height", h);	
			this.scatterdata = []
			this.scatterdata = Object.values(jsondata)
			const scatterdata=this.scatterdata
			const scaleX = d3.scaleLinear().range([marginW, w-marginW]).domain(d3.extent(scatterdata, d => d.x));
			const scaleY = d3.scaleLinear().range([h-marginH, h -w + marginH]).domain(d3.extent(scatterdata, d => d.y));
			var scattertooltip = g => {
				g.call(g =>g.append("g").attr("class" , "scatter")
					.selectAll("circle.dot")
					.data(scatterdata)
					.join("circle").attr("class", "dot")
					.attr("r", 1)
					.attr("id",(d,i)=>"scatter"+d.upid)
					.attr("cx", d => scaleX(d.x))
					.attr("cy", d => scaleY(d.y))
					.attr("fill",vm.tooltipColor)
					.attr("stroke", vm.tooltipColor)
					.attr("stroke-width", 0.25)
					.style("opacity", 1)
					.on("mouseover", (event, d)=> {
						const tooltip = vm.svg.append("g")
							.attr("class", "scattertooltip")
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
						const label=d;				
						tooltip
							.style("display", null)
							.attr("fill", "white");
						line1.text(`upid:`+ d.upid);
						line2.text(`category: `+d.productcategory);
						line3.text(`time:`+d.toc);
						path
							.attr("stroke", "none")
							.attr("fill", vm.tooltipColor(label));
						const box = text.node().getBBox();
						let x = event.offsetX - 78,
							y = event.offsetY ;
						if(y+box.height + 30>h-8*marginH){					
						path.attr("d", `
							M${box.x - 10},${box.y - 10}
							H${box.width / 2 - 5}l5,15l5,-15
							H${box.width + 10}
							v-${box.height + 20}
							h-${box.width + 20}
							z
						`)
						text.attr("transform", `translate(${[box.x,box.y - 50]})`);
						}else if(y+box.height + 30<h-2*marginH){
						y=y+24
						path.attr("d", `
							M${box.x - 10},${box.y - 10}
							H${box.width / 2 - 5}l5,-15l5,15
							H${box.width + 10}
							v${box.height + 20}
							h-${box.width + 20}
							z
						`);
						text.attr("transform", `translate(${[box.x+5,box.y+10]})`);
						}
						tooltip.attr("transform", `translate(${[x,y]})`);
						d3.selectAll("circle.dot").style("opacity", 0.1);
						d3.select(`#scatter${label.upid}`).style("opacity", 1);
						vm.changeDot([label.upid], this.mouseAttrs)
						vm.$emit("scatterMouse", {upid: [d.upid],  mouse: 0});
					})
					.on("mouseout", (event, d)=> {					
						this.paintArc(this.GaleArray)
						this.resetDot()
						d3.selectAll(".scattertooltip").remove();
						vm.$emit("scatterMouse", {upid: [d.upid],  mouse: 1});
					}))
			}
			this.svg.append("g")
				.call(scattertooltip);
			this.svg.call(d3.zoom()
				.extent([[0, 0], [w, h]])
				.scaleExtent([1, 8])
				.on("zoom", zoomed))
			function zoomed({transform}) {
				d3.select(".scatter").attr("transform", transform);
			}
		},
		paintArc([dateStart,dateEnd]){
			this.GaleArray=[dateStart,dateEnd];
			const vm=this;
			var data=this.scatterdata.filter(item=>{
				let toc=new Date(item.toc)
				return toc<dateEnd&&toc>dateStart
			})
			d3.selectAll(".dot")
				.attr("r",1)
				.style("opacity",0.1)
				.attr("fill" , vm.tooltipColor);
			for (let item in data){
					d3.select("#scatter"+data[item].upid)
					.style("opacity",1);
			}
		},
		mouse(value){
			const vm=this
			this.mouseList = value
			if(value.mouse===0){
				this.changeDot(value.upid, this.mouseAttrs)
			}else{
				this.init();
				this.changeDot(this.hightlightGroup, this.clickAttrs);
			}
		},
		changeDot(array, Attrs){	//change Style
			if(array.length === 0)return;
			for(let item in array){
				this.svg.select(`#scatter${array[item]}`)
					.attr("r", Attrs.r)
					.attr("stroke", Attrs.color)
					.attr("stroke-width", Attrs.stroke).raise()
			}
		},
		resetDot(){		//reset Style before highlight
			this.mouseList !==undefined ? this.mouse(this.mouseList) : this.changeDot(this.hightlightGroup, this.clickAttrs)
		},
		init(){		//init Style
			const vm=this;
			this.svg.selectAll(".dot")
				.attr("r",1)
				.attr("fill", vm.tooltipColor)
				.attr("stroke", vm.tooltipColor)
				.attr("stroke-width", 0.25)
		},
		setTrainColor(){
			this.changeColor=!this.changeColor;
			this.init()
			this.resetDot()
		}
	},
	mounted() {
	},
	computed:{
		tooltipColor:function (){
			return this.changeColor ? d => this.categoryColors(d.productcategory) : d=> this.labelColorsFunc(+d.label)
		},
		...mapGetters([
            "hightlightGroup"
        ])
	},
	watch:{
		hightlightGroup:function(){
			if(this.hightlightGroup.length === 0)this.init()
			this.changeDot(this.hightlightGroup, this.clickAttrs)
		}
	}
}
</script>

<style>
/* g .tick{
	opacity: 0.3;
} */
</style>