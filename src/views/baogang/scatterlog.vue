<template>
	<div>
		<div :id="menuId" style="height: 100%;width:100%;padding:5px"></div>
	</div>
</template>

<script>
import * as d3 from 'd3';
import { Delaunay } from 'd3-delaunay';
import util from './util.js';
export default {
	data() {
		return {
			menuId: 'scatterlog',
			svg: undefined,
			data:[],
			tooltip:undefined,
			scatterdata:[],
			changeColor: true,
			categoryColors: util.categoryColor,
			labelColors: util.labelColor, // [bad, good]
			labelColorsFunc: util.labelColorFunc,
			property:["ave_temp_dis","avg_p5","crowntotal","finishtemptotal","tgtplatelength2","tgtplatethickness2","tgtwidth","wedgetotal"],
			scaleX:undefined,
			scaleY:undefined,
			GaleArray:[],
			colorScale:[]
		}
	},
	methods: {
	paintChart(jsondata) {
		const vm=this		
		const w = 510, h = 350,marginH = 10, marginW = 20;
		// this.svg.remove()
		this.svg !== undefined && this.svg.remove()
		d3.select(".scatterlogger").remove()
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
		const scaleY = d3.scaleLinear().range([h-marginH, marginH]).domain(d3.extent(scatterdata, d => d.y));
		this.scaleX=scaleX;
		this.scaleY=scaleY;
		const axisX = d3.axisBottom(scaleX)
				.tickSize(h - marginH*2 + 10)
				.tickPadding(2);
		const axisY = d3.axisLeft(scaleY)
				.tickSize(w - marginW*2 + 10)
				.tickPadding(2);
		// const xG = this.svg.append("g").attr("class", "x-axis")
		// 	.attr("transform", `translate(${[0,marginH]})`)
		// 	.call(axisX);
		// const yG = this.svg.append("g").attr("class", "y-axis")
		// 		.attr("transform", `translate(${[w-marginW,0]})`)
		// 		.call(axisY);
		// d3.selectAll(".domain").remove();

		var scattertooltip = g => {
			const tooltip = g.append("g")
				.style("font", "12px sans-serif");

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
			this.svg.selectAll("circle.dot")
				.data(scatterdata)
				.join("circle").attr("class", "dot")
				.attr("r", 1.5)
				.attr("id",(d,i)=>"scatter"+d.upid)
				.attr("cx", d => scaleX(d.x))
				.attr("cy", d => scaleY(d.y))
				.attr("fill",vm.tooltipColor)
				.style("opacity", 0.8)
				.on("mouseover", (event, d)=> {
					// console.log(d)
					const label=d;
					d3.selectAll("circle.dot").style("opacity", 0.4);
					d3.select("#scatter"+label.upid).attr("r",3).style("opacity", 0.8);				
					tooltip
						.style("display", null)
						.attr("fill", "white");
					line1.text(`upid:`+d.upid);
					line2.text(`category: `+d.productcategory);
					line3.text(`time:`+d.toc);
					path
						.attr("stroke", "none")
						.attr("fill", vm.tooltipColor(label));
					const box = text.node().getBBox();
					const x=vm.scaleX(d.x)-75
					let y=vm.scaleY(d.y)+12
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
					// tooltip.attr("transform", `translate(${x},${y})`);
				})
				.on("mouseout", (event, d)=> {
					d3.selectAll("circle.dot").style("opacity", 0.8)
					let toc=new Date(d.toc)
					if(toc<this.GaleArray[1]&&toc>this.GaleArray[0]){}else{
						d3.select("#scatter"+d.upid).attr("r",1.5)
					}					
					tooltip.style("display", "none");
				});
		}
		this.svg.append("g")
			.call(scattertooltip);
		console.log('paint completed')
	},
	paintArc([dateStart,dateEnd]){
		this.GaleArray=[dateStart,dateEnd];
		const vm=this;
		var data=this.scatterdata.filter(item=>{
			let toc=new Date(item.toc)
			return toc<dateEnd&&toc>dateStart
		})
		for(let item in data){
			data[item].property=[]
			for(let index of this.property){
				data[item].property.push({"label": index, "value": data[item][index], "angle": 0.1})
			}
		}
		var nightinGale=g=>{
			const tooltip = g.append("g")
				.style("font", "12px sans-serif");

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
			const pieScale=[]
			for(let index in this.property){
				let scaleSort = d3.scaleLinear().range([15,5]).domain(d3.extent(data,d=>d.property[index].value))
				pieScale.push(scaleSort)
			}
			const colorScale = d3.scaleOrdinal(["#5B8FF9","#78D3F8","#61DDAA","#008685","#6F5EF9","#F08BB4"]);
			vm.colorScale=colorScale;
			const pie = d3.pie()
					.value(d => d.angle)
					.startAngle(0)
					.endAngle(2* Math.PI);
			const arc = d3.arc()
					.innerRadius(3)
					.outerRadius((d,i)=>pieScale[d.index](d.data.value))
					.padAngle(0.5)
					.padRadius(1);
			d3.selectAll(".dot").attr("r",1.5);
			d3.selectAll('.pathdate').remove();
			for (let item in data){
				d3.select("#scatter"+data[item].upid).attr("r",3);
				let piedata=pie(data[item].property)
				for (let label in piedata){
					piedata[label].source=data[item]
					piedata[label].sourceindex=+item
				}
				const g = this.svg.selectAll(`g .select${data[item].upid}`)
						.data(piedata).enter()
						.append("g")
						.attr("transform", `translate(${[vm.scaleX(data[item].x),vm.scaleY(data[item].y)]})`);
				g.append("path").attr("class", `pathdate sliceselect${data[item].upid}`)
						.attr("d", arc)
						.attr("fill", (d,i) => colorScale(i))
						.style("stroke", "black")
						.style('stroke-width', '.25')
						.style("opacity", 0.4)
						.on("mouseout", (event, d)=> {
							d3.selectAll(`.sliceselect${d.source.upid}`)
								.attr('fill',(d,i) => colorScale(i))
						})
						.on("mouseover", (event, d)=> {
							d3.selectAll(`.sliceselect${d.source.upid}`)
								.attr('fill',d3.select("#scatter"+d.source.upid).attr("fill"))
						});
			}
		}
		this.svg.append("g")
			.call(nightinGale);
	},
	mouse(value){
		const vm=this
		if(value.mouse===0){
			d3.selectAll(`.sliceselect${value.upid}`)
				.attr('fill',value.color)
		}else{
			d3.selectAll(`.sliceselect${value.upid}`)
						.attr("fill", (d,i) => vm.colorScale(i))
		}
		
	},
	setTrainColor(){
		const vm=this;
		this.changeColor=!this.changeColor;
		d3.selectAll("circle.dot").attr("fill",vm.tooltipColor)
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
		}
	}
}
</script>

<style>
g .tick{
	opacity: 0.3;
}
</style>