<template>
	<div>
		<div :id="menuId" style="height: 100%;width:100%;padding:5px"></div>
	</div>
</template>

<script>
import * as d3 from 'd3';
import util from './util.js';
import sliderdata from "./data.json";
import {mapGetters, mapMutations} from "vuex"
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
			scaleX:undefined,
			scaleY:undefined,
			GaleArray:[],
			colorScale:[],
			mouseList: undefined
		}
	},
	methods: {
		paintChart(jsondata) {
			const vm=this
			const w = document.getElementById(this.menuId).offsetWidth, h = document.getElementById(this.menuId).offsetHeight,marginH = 15, marginW = 15;
			// this.svg.remove()
			this.svg !== undefined && this.svg.remove()
			// d3.select(".scatterlogger").remove()
			this.svg=d3.select("#scatterlog")
				.append("svg")
				.attr("class",'scatterlogger')
				.attr("width", w)
				.attr("height", h);	
			this.scatterdata=[]
			for (let item in jsondata){
				this.scatterdata.push(jsondata[item])
			}
			const scatterdata=this.scatterdata
			const scaleX = d3.scaleLinear().range([marginW, w-marginW]).domain(d3.extent(scatterdata, d => d.x));
			const scaleY = d3.scaleLinear().range([h-marginH, h -w + marginH]).domain(d3.extent(scatterdata, d => d.y));
			this.scaleX=scaleX;
			this.scaleY=scaleY;
			// const axisX = d3.axisBottom(scaleX)
			// 		.tickSize(h - marginH*2 + 10)
			// 		.tickPadding(2);
			// const axisY = d3.axisLeft(scaleY)
			// 		.tickSize(w - marginW*2 + 10)
			// 		.tickPadding(2);
			// const xG = this.svg.append("g").attr("class", "x-axis")
			// 	.attr("transform", `translate(${[0,marginH]})`)
			// 	.call(axisX);
			// const yG = this.svg.append("g").attr("class", "y-axis")
			// 		.attr("transform", `translate(${[w-marginW,0]})`)
			// 		.call(axisY);
			// d3.selectAll(".domain").remove();
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
						d3.selectAll("circle.dot").style("opacity", 0.1);
						d3.select("#scatter"+label.upid).attr("r",2).style("opacity", 1);				
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
						console.log(event)
						let x = event.offsetX - 78,
							y = event.offsetY ;
						// const x=vm.scaleX(d.x)-75
						// let y=vm.scaleY(d.y)+12
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
						vm.$emit("scatterMouse", {upid: [d.upid],  mouse: 0});
					})
					.on("mouseout", (event, d)=> {
						// d3.select("#scatter"+d.upid).style("opacity", 1)
						// let toc=new Date(d.toc)
						// console.log(this.GaleArray)
						// if(toc<this.GaleArray[1]&&toc>this.GaleArray[0]){
						// 	d3.select("#scatter"+d.upid).attr("r",2).style("opacity",1)
						// }else{
						// 	d3.select("#scatter"+d.upid).attr("r",1).style("opacity",0.1)
						// }					
						this.paintArc(this.GaleArray)
						this.mouseList !==undefined ? this.mouse(this.mouseList) : false
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
			// console.log('paint completed')
		},
		paintArc([dateStart,dateEnd]){
			this.GaleArray=[dateStart,dateEnd];
			const vm=this;
			// console.log(this.scatterdata.length)
			var data=this.scatterdata.filter(item=>{
				let toc=new Date(item.toc)
				return toc<dateEnd&&toc>dateStart
			})
			// console.log(data.length)
			d3.selectAll(".dot")
				.attr("r",1)
				.style("opacity",0.1)
				.attr("fill" , vm.tooltipColor);
			for (let item in data){
					d3.select("#scatter"+data[item].upid)
					// .attr("r",2)
					.style("opacity",1);
			}
			console.log('select completed')
		},
		mouse(value){
			console.log(value)
			const vm=this
			this.mouseList = value
			if(value.mouse===0){
				for(let item in value.upid){
					d3.selectAll(`#scatter${value.upid[item]}`)
						.attr('fill',"black")
						.attr("r",2)
						// .attr("stroke", "black")
						.attr("stroke", (d, i) => d3.color(vm.tooltipColor(d)).darker(1))
						.attr("stroke-width", 2.75)
				}

			}else{
				for(let item in value.upid){
					d3.selectAll(`#scatter${value.upid[item]}`)
					.attr("fill",vm.tooltipColor)
					.attr("r",1)
					.attr("stroke", vm.tooltipColor)
					.attr("stroke-width", 0.25)
							// .attr("fill", (d,i) => vm.colorScale(i))
				}
			}
			
		},
		setTrainColor(){
			const vm=this;
			this.changeColor=!this.changeColor;
			d3.selectAll("circle.dot").attr("fill",vm.tooltipColor)
			this.mouseList !==undefined ? this.mouse(this.mouseList) : false
		}
	},
	mounted() {
	},
	computed:{
		tooltipColor:function (){
			const tooltiplabelColors = this.labelColorsFunc
			const tooltipcategoryColors=this.categoryColors
			if (this.changeColor){
				return (d=> tooltipcategoryColors(d.productcategory))
			}else{
				return (d=>tooltiplabelColors(+d.label))
			}
		},
		hightLightColor:function (){
			const tooltiplabelColors = this.labelColorsFunc
			const tooltipcategoryColors=this.categoryColors
			if (this.changeColor){
				return (d=> d3.color(tooltipcategoryColors(d.productcategory)).darker(0.25))
			}else{
				return (d=> d3.color(tooltiplabelColors(+d.label)).darker(0.25))
			}
		}
	}
}
</script>

<style>
g .tick{
	opacity: 0.3;
}
</style>