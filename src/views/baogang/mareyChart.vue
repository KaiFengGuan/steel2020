<template>
	<div :id="menuId" style="height: 100%; overflow-y: scroll;overflow-x: hidden;"></div>
</template>

<script>
import * as d3 from 'd3';
import { Delaunay } from 'd3-delaunay';
import util from './util.js';
import myJsonData from "./jsondata.js"
import myStationData from "./stationdata.js"
export default {
	data() {
		return {
		menuId: 'marey',
		trainGroup: undefined,
		categoryColors: util.categoryColor,
		labelColors: util.labelColor, // [bad, good]
		labelColorsFunc: util.labelColorFunc,
		svg: undefined,
		trainSelectedList: [],
		trainGroupStyle: undefined,
		showColor: util.categoryColor,
		changeColor: false,
		areaStyle : undefined,
		data:[]
		}
	},
	methods: {
		// paintMareyChart(alldata, stationsData, conditionData) {
		paintMareyChart() {
		const alldata=myJsonData
		const stationsData=myStationData
		this.trainSelectedList = []; // 2019-5-16 23:29:30 清空选择列表
		this.trainGroupStyle === undefined && (this.trainGroupStyle = d => this.categoryColors(d.productcategory));
		this.areaStyle === undefined && (this.areaStyle = d => d3.color(this.categoryColors(d.productcategory)).brighter(2))
		var vm = this;
		var stationcolor =['#fcd8a9','#cce9c7',"#c1c9ee"];
		// data
		this.data=alldata;
		var data = alldata
		var width = document.getElementById(this.menuId).offsetWidth;

		var stations = stationsData
		var stops = d3.merge(data.map(d => d.stops.map(s => ({ train: d, stop: s }))))

		// chart
		// var height = 2400;
		var defaultStrokeWidth = d3.scaleLinear()
			.domain([0.006, 0.16])
			.range([0.5, 1.2])
		var highLightStrokeWidth = 2
		var margin = ({ top: 70, right: 100, bottom: 50, left: 50 })

		var x = d3.scaleLinear()
			.domain(d3.extent(stations, d => d.distance))
			.range([margin.left + 10, width - 1.5 * margin.right ])

		// zpj 2019-4-15 20:02:15
		var minDate = data[0].stops[0].time;
		var maxDate = data.slice(-1)[0].stops.slice(-1)[0].time
		var unitHeight = 300;
		var unitPerTime = 3.5;
		const timeHeightScale = unitHeight / (60 * 60 * 1000 * unitPerTime) // 单位高度 时间跨度x小时
		var height = (new Date(maxDate).getTime() - new Date(minDate).getTime()) * timeHeightScale
		var y = d3.scaleTime()
			.domain([new Date(minDate), new Date(maxDate)])
			.range([margin.top, height - margin.bottom])

		var line = d3.line()
			.x(d => x(d.station.distance))
			.y(d => y(new Date(d.time)))

		var voronoi = Delaunay
			.from(stops, d => x(d.stop.station.distance), d => y(new Date(d.stop.time)))
			.voronoi([0, 0, width, height])

		var tooltipColors = this.categoryColors
		var tooltiplabelColors = this.labelColorsFunc


		this.svg !== undefined && this.svg.remove()
		this.svg = d3.select('#' + this.menuId)
			.append("svg")
			.attr("width", width)
			.attr("height", height);

		// var train = this.svg.append("g")
		// 	.attr("fill", "white")
		// 	.selectAll("g")
		// 	.data(data)
		// 	.join("g")
		// 	.style("color", this.trainGroupStyle)
		// 	.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) })
		// 	.attr("id", d => ("id" + d.upid))

		// this.trainGroup = train;

		// var train = this.svg.append("g")
		// 	.attr("fill", "white")
		// 	.selectAll("g")
		// 	.data(data)
		// 	.join("g")
		// 	.style("color", this.trainGroupStyle)
		// 	.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) })
		// 	.attr("id", d => ("id" + d.upid))
		// 	.call(g => g.append("path")
		// 		.attr("fill", "none")
		// 		.attr("stroke", "currentColor")
		// 		.attr("d", d => line(d.stops)))
		// 	.call(g => g.append("g")
		// 		.attr("stroke", "none")
		// 		.selectAll("circle")
		// 		.data(d => d.stops)
		// 		.join("circle")
		// 		.attr("transform", d => `translate(${x(d.station.distance)},${y(new Date(d.time))})`)
		// 		.attr("r", d => d.station.name === "FuCharging" ? 3 :
		// 		(d.station.name === "FuDischarging" ? 1.5 : 0.5)
		// 		))

		var mergeresult = this.merge(data , stations)
		var filterdata = this.deepCopy(data)
		for (let item in mergeresult){
			filterdata.splice(...mergeresult[mergeresult.length-item-1]["index"])
		}
		
		var merge = d3.map(d3.merge(d3.map(mergeresult , d => d.merge)) , d =>d.upid)
		var select = d3.map(d3.merge(d3.map(mergeresult , d => d.select)) , d =>d.upid)
		var filter = d3.filter(merge , d => select.indexOf(d) === -1 )
		var indexname = ["fuTotalTimeAfter" , "mtotalTime" , "ccTotalTime"]

		//add Axis
		var xAxis = g => g
			.style("font", "12px sans-serif")
			.selectAll("g")
			.data(stations)
			.join("g")
			.attr("transform", d => `translate(${x(d.distance)},0)`)
			// .call(g => g.append("line")
			// 	.attr("y1", margin.top - 0)
			// 	.attr("y2", margin.top)
			// 	.attr("stroke", "currentColor"))
			// .call(g => g.append("line")
			// 	.attr("y1", height - margin.bottom + 0)
			// 	.attr("y2", height - margin.bottom)
			// 	.attr("stroke", "currentColor"))
			.call(g => g.append("line")
				.attr("y1", margin.top - 3)
				.attr("y2", height - margin.bottom + 3)
				// .attr("stroke-dasharray", "1.5,2")
				.attr("opacity" , 0.4)
				.attr("stroke" , (d , i) => d3.color(i <6 ? stationcolor [0] : ( i> stations.length - 4 ? stationcolor [2] : stationcolor [1])).darker(1))
				// .attr("stroke", "currentColor")
				// .attr("stroke-opacity", d => {
				// 	return (d.name === "FuDischarging" || d.name === "MPass24") ? 0.8 : 0.4
				// })
				// .attr("stroke-opacity", 1)
				)
			.call(g => g.append("polygon")
				.attr("transform", `translate(-17.5 , ${margin.top + 1.5}) rotate(-45)`)
				.attr("points", "0, 0  18, 18  110 , 18  92, 0")
				.attr("fill" , (d , i) => i <6 ? stationcolor [0] : ( i> stations.length - 4 ? stationcolor [2] : stationcolor [1]))
				// .attr("opacity" , 0.2)
				.attr("stroke" , "none"))
			// .call(g => g.append("text")
			// 	.attr("transform", `translate(-4 ,${margin.top + 0}) rotate(-45)`)
			// 	.attr("x", 8)
			// 	.attr("dy", "0.35em")
			// 	.attr("font-family" , "DIN")
			// 	.attr("fill", "white")
			// 	.text(d => d.name))

		var xGroup = this.svg.append("g")
			.call(xAxis);

		this.svg.append("g")
			.call(g => g.append("rect")
				.attr("x" , margin.left - 5)
				.attr("y", margin.top)
				.style("fill","white")
				.attr("stroke", "#aaa")
				.attr("stroke-width",0.25)
				.attr("width", width - margin.left - 1.5*margin.right +15)
				.attr("height", height - margin.top - margin.bottom))
			.call(g => g
				.style("font", "12px sans-serif")
				.selectAll("g")
				.data(stations)
				.join("g")
				.attr("transform", d => `translate(${x(d.distance)},0)`)
				.call(g => g.append("line")
					.attr("y1", margin.top - 3)
					.attr("y2", height - margin.bottom + 3)
					// .attr("stroke-dasharray", "1.5,2")
					.attr("opacity" , 0.4)
					.attr("stroke" , (d , i) => d3.color(i <6 ? stationcolor [0] : ( i> stations.length - 4 ? stationcolor [2] : stationcolor [1])).darker(1)))
				.call(g => g.append("text")
					.attr("transform", `translate(-4 ,${margin.top + 0}) rotate(-45)`)
					.attr("x", 8)
					.attr("dy", "0.35em")
					.attr("font-family" , "DIN")
					.attr("fill", "white")
					.text(d => d.name))
			)
		var _yAxis = d3.axisLeft(y)
			.ticks(d3.formatMinute)
			.tickSize(0)
		var yAxis = g => g
			.attr("transform", `translate(${margin.left + 5},0)`)
			.style("font", "12px sans-serif")
			.call(_yAxis
			// .tickFormat(date => date.toLocaleString(undefined, { hour: "numeric" }))
			)
			.call(g => g.select(".domain").remove())
			.call(g => g.selectAll(".tick line").clone().lower()
			.attr("stroke-opacity", 0.2)
			.attr("x2", width - 80))
				
		var yGroup = this.svg.append("g")
			.call(yAxis);

		var train = this.svg.append("g")
			.attr("fill", "white")
			.selectAll("g")
			.data(filterdata)
			.join("g")
			.style("color", this.trainGroupStyle)
			.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) })
			.attr("id", d => ("id" + d.upid))
			.call(g => g.append("path")
				.attr("fill", "none")
				.attr("stroke", "currentColor")
				.attr("d", d => line(d.stops)))
		
		var maxlength = d3.max(mergeresult, d => d["merge"].length)
		var axislength = 6 ;
		var lmaxlength = 50 ;
		const circledot = width - margin.right * 0.75;
		var circleline = d3.scaleLinear()
				.domain([20 , maxlength ]).nice()
				.range([ 40 , lmaxlength])
		for (let item in mergeresult){
			var xaxlength = 30
			// circleline(mergeresult[item]["merge"].length)
			var index = mergeresult[item]["data"]
			var sDate = data[index[0]].stops[0].time;
			var eDate = data[index[1]].stops[0].time
			var lineheight = (y((new Date(eDate))) - y(new Date(sDate)))
			var midindex=Math.floor(d3.mean(index))

			var linetransfrom = (y((new Date(data[midindex+1].stops[0].time))) - y(new Date(data[midindex].stops[0].time)))

			this.svg.append("g")
				.attr("fill", "white")
				.selectAll(`g`+item)
				.data(data.slice(midindex , midindex+1))
				.join("g")
				.style("color", this.trainGroupStyle)
				// .attr("opacity" , 0.4)
				.attr("stroke-width", lineheight )
				// .attr("id", d => ("id" + d.upid))
				.attr("transform", `translate( 0 ,${ linetransfrom })`)
				.call(g => g.append("path")
					.attr("fill", "none")
					.attr("stroke", "currentColor")
					.attr("opacity" , 0.4)
					.attr("d", d => line(d.stops)))
			this.svg.append("g")
				.attr("fill", "white")
				.selectAll(`.select g`+item)
				.data(mergeresult[item]["select"])
				.join("g")
				.style("color", this.trainGroupStyle)
				.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) } )
				.attr("id", d => ("id" + d.upid))
				.attr("transform", `translate( 0 ,${ linetransfrom })`)
				.call(g => g.append("path")
					.attr("fill", "none")
					.attr("stroke", "currentColor")
					.attr("d", d => line(d.stops)))
			
			const categorysdata = d3.group(data , d => d.productcategory).get(mergeresult[item]["merge"][0].productcategory)
			const lineposition = []
			const lineScale = [];
			var sDate = mergeresult[item]["merge"].slice(0)[0].stops[stations.length-1].time;
			var eDate = mergeresult[item]["merge"].slice(-1)[0].stops[stations.length-1].time;
			// const position = [ circledot , (y((new Date(eDate))) + y(new Date(sDate)))/2];
			const position = [ circledot , (y((new Date(data[midindex+1].stops[stations.length-1].time))) )];
			for (let i in indexname){
				// const categorys = d3.group(data , d => d.productcategory)[]
				let linedata = d3.map(categorysdata , d => d[indexname[i]]).sort()
				let meandata = d3.mean(d3.map(mergeresult[item]["merge"] , d => d[indexname[i]]).sort())
				
				// if(d3.mean(linedata) === 0) continue
				
				var sortdata = [] , maxmin = d3.extent(linedata);
				var linelength = (maxmin[1]*1.01 - maxmin[0]) / 3;
				// if(linelength === 0) continue
				for (let j = 0 ; j < 3 ; j++ ){
					sortdata.push([maxmin[0] + (j+0.5) * linelength , 0 ])
				}
				for (let j in linedata){
					sortdata[Math.floor((linedata[j] - maxmin[0])/linelength)][1] += 1
				}
				// if((+i)!==1) console.log(sortdata)
				sortdata.push([maxmin[1] + 1 * linelength , 0])
				sortdata.unshift([maxmin[0] - 1 * linelength , 0])

				let xline = d3.scaleLinear()
					.domain([maxmin[0] - 0.5*linelength , maxmin[1] + 0.5*linelength ]).nice()
					.range([0, xaxlength])

				let yline = d3.scaleLinear()
					.domain([0, d3.max(sortdata, d => d[1])])
					.range([axislength , 0])
				let liner = d3.line()
					.curve(d3.curveBasis)

				lineposition.push(meandata)
				lineScale.push(xline)

				this.svg.append("path")
					.datum(sortdata)
					.attr("fill", stationcolor[i])
					.attr("class", "linedist")
					.attr("stroke", "none")
					.attr("transform", `rotate(${(+i)*120 - 90} ,${position}) translate( ${[ position[0] , position[1]-axislength ]})  `)
					// rotate(${ 120 *(1+(+i)) -60} ,${[ 0 , 0 ]})
					.attr("stroke-width", 1.5)
					.attr("opacity" , 0.8)
					.attr("stroke-linejoin", "round")
					.attr("d", 
							liner.x(d => xline(d[0]))
								.y(d => yline(d[1])));
				this.svg.append("path")
					.datum(sortdata)
					.attr("fill", stationcolor[i])
					.attr("class", "linedist")
					.attr("stroke", "none")
					.attr("transform", `rotate(${(+i)*120 - 90} ,${position}) translate( ${[ position[0] , position[1]+ axislength ]})  `)
					.attr("stroke-width", 1.5)
					.attr("opacity" , 0.8)
					.attr("stroke-linejoin", "round")
					.attr("d", 
							liner.x(d => xline(d[0]))
								.y(d => -yline(d[1])))
			}
			const meanLine = d3.lineRadial()
				.curve(d3.curveLinearClosed)
				.angle((d , i) => i*120/180*Math.PI);
			const area = d3.areaRadial()
				.curve(d3.curveBasisOpen)
				.angle((d , i) => i*360/mergeresult[item]["wave"].length/180*Math.PI);
			const wheeldata = []
			for (let i in mergeresult[item]["wave"][0]){
				let mdata = d3.mean(mergeresult[item]["wave"] , d => d[i])
				let highdata = d3.quantile(mergeresult[item]["wave"] , 0.55, d => d[i])
				let lowdata = d3.quantile(mergeresult[item]["wave"] , 0.45, d => d[i])
				if(mdata !==0){
					wheeldata.push(highdata > mdata & mdata > lowdata ? 0 : (lowdata >= mdata ? (mdata - lowdata)/mdata : (mdata - highdata)/mdata))
				}else{
					wheeldata.push(highdata > mdata & mdata > lowdata ? 0 : (lowdata >= mdata ? (mdata - lowdata) : (mdata - highdata)))
				}
			}
			console.log(wheeldata)
			const pcRadius = d3.scaleLinear()
				.domain( [0 , d3.extent(wheeldata)[1]])
				.range([0 , 8]);
			const scRadius = d3.scaleLinear()
				.domain( [ d3.extent(wheeldata)[0] , 0])
				.range([ 8 , 0]);
			const arrayindex =  [ [0 , 6 ] , [ 6 , -2 ] , [-5]];
			const piedata = d3.map(arrayindex , d => wheeldata.slice(...d));
			for (let item in piedata){
				piedata[item].unshift(0);
				piedata[item].push(0);
			}
			const piearea = d3.map(piedata , (e,f) =>  d3.areaRadial()
				.curve(d3.curveCardinal)
				.angle((d , i) => {
					// console.log("fgsuf")
					// console.log((f * 1 /3 -1/6+ ( - 1 )/(piedata[f].length - 1)/3 ) * 360)
					// console.log((f * 1 /3 -1/6+ ( piedata[f].length )/(piedata[f].length - 1)/3 ) * 360)
					// console.log((f * 1 /3 -1/6+ (piedata[f].length - 1 )/(piedata[f].length - 1)/3 ) * 360)
					// console.log("fgsuf")
					// console.log((f * 1 /3 -1/6+ ( i- 1 + 2*i /(piedata[f].length - 1))/(piedata[f].length - 1)/3 ) * 180)
					// return (f * 1 /3 +1/6+ ( i- 2 + 4*i /(piedata[f].length - 1))/(piedata[f].length - 1)/3 ) * 2 * Math.PI}))
					return (f * 1 /3 -1/6+ ( i)/(piedata[f].length - 1)/3 ) * 2 * Math.PI}))
				//i*360/mergeresult[item]["wave"].length/180
			console.log(piedata)
			this.svg
			.append("g")
			.attr("transform", ` translate( ${position})`)
			.call(g => g.append("path")      // radar 
				.attr("fill", "none")
				.attr("stroke", "#c4c4c4")
				.attr("stroke-width", 1.5)
				.attr("d", meanLine
					.radius((d , i)=> lineScale[i](d))
					(lineposition)))
			.call(g => g.selectAll(".radar_line")
				.data([0 , 1 , 2])
				.join("g")
				.call(g => g.append("line")
					.attr("x1",0)
					.attr("y1", 0)
					.style("stroke", "#c9cbcc")
					.attr("stroke-dasharray", "1.5,2")
					.attr("transform", (d , i) => ` rotate( ${ d * 120} ) `)
					.attr("x2", 0)
					.attr("y2", -xaxlength)
					.style("stroke-width", 0.25))
				.call(g => g.append("line")
					.attr("x1",0)
					.attr("y1", 0)
					.style("stroke","#c9cbcc")
					.attr("transform", (d , i) => ` rotate( ${ d * 120 - 60} ) `)
					.attr("x2", 0)
					.attr("y2", -xaxlength)
					.style("stroke-width", 1.5))
				.call(g => g.append("circle")
					.attr("transform", (d , i) => ` rotate( ${ d * 120 - 90} ) `)
					.attr("fill", (d , i) => d3.color(stationcolor[d]).darker(0.5))
					.attr("cx", d => lineScale[d](lineposition[d]))
					.attr("cy", 0)
					.attr("r" , 3))
				.call(g => g.append("path")
					.attr("fill", (d , i) => stationcolor [i] )
					// .attr("transform", ` translate( ${position})`)
					.attr("d",  (e , f) => piearea[f]
						// .innerRadius( xaxlength)
						// .outerRadius( xaxlength + 25)
						.innerRadius( d => d>=0 ? xaxlength + 10 - 0.5 : xaxlength + 10 - 0.5 - scRadius(d))
						.outerRadius(d => d>0 ? xaxlength + 10 + 0.5 + pcRadius(d) : xaxlength + 10 + 0.5)
					(piedata[f])))
				// .call(g => g.append("path")
				// 	.attr("fill", (d , i) => stationcolor [i] )
				// 	.attr("d",  (e , f) => piearea[f]
				// 		.innerRadius( d => d>=0 ? xaxlength + 10 : xaxlength + 10)
				// 		.outerRadius(d => d>0 ? xaxlength + 10 + pcRadius(d) : xaxlength + 10)
				// 	(piedata[f])))
					)
			.call(g => g.append("circle")      // radar 1
				.attr("fill", "none")	
				.attr("stroke", "#c9cbcc")
				.attr("stroke-width", 2)
				.attr("r", xaxlength))
			.call(g => g.append("circle")      // radar 2
				.attr("fill", "none")
				.attr("stroke", "#c9cbcc")
				.attr("stroke-width", 1)
				.attr("cx", 0)
				.attr("cy", 0)
				.attr("r", xaxlength + 10))
			
			// .call(g => g.append("path")
			// 	.attr("class" , "dguerug")
			// 	.attr("fill", this.categoryColors(mergeresult[item]["merge"][0].productcategory))
			// 	.attr("d", area
			// 		.innerRadius(d => d===0 ? xaxlength - 5 : xaxlength - 5 - cRadius(d))
			// 		.outerRadius(xaxlength)
			// 	(wheeldata)))
		}
		this.svg.append("g")
			.call(g => {
				const tooltip = g.append("g")
					.style("font", "15px sans-serif");
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

				g.append("g")
					.attr("fill", "none")
					.attr("pointer-events", "all")
					.selectAll("path")
					.data(stops)
					.join("path")
					.attr("d", (d, i) => voronoi.renderCell(i))

				.on("mouseout", (event, d) => {
					if( filter.indexOf(d.train.upid) !==-1 ) return
					if (vm.changeColor) {
					vm.$emit("trainMouse", {upid: d.train.upid, color: vm.showColor(parseInt(d.train.flag)), mouse: 1});
					
					}else {
					vm.$emit("trainMouse", {upid: d.train.upid, color: vm.showColor(d.train.productcategory), mouse: 1});
					}
					let currentIdSearch = "#id" + d.train.upid;
					d3.select(currentIdSearch)
					.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) })
					.selectAll("rect")
					.attr("stroke", "none");
					tooltip.style("display", "none");
				})

				.on("mouseover", (event, d) => {
					// console.log(d)
					if( filter.indexOf(d.train.upid) !== -1 ) return
					if (vm.changeColor) {
					vm.$emit("trainMouse", {upid: d.train.upid, color: vm.showColor(parseInt(d.train.flag)), mouse: 0});
					
					}else {
					vm.$emit("trainMouse", {upid: d.train.upid, color: vm.showColor(d.train.productcategory), mouse: 0});
					}
					let toopcolor
						if(!vm.changeColor){toopcolor=tooltipColors(d.train.productcategory)}
						else{toopcolor=tooltiplabelColors(d.train.flag)}
					let currentIdSearch = "#id" + d.train.upid;
					// console.log(toopcolor)
					d3.select(currentIdSearch)
					.attr("stroke-width", highLightStrokeWidth)
					.selectAll("rect")
					.attr("stroke", "black");

					tooltip
					.style("display", null)
					.attr("fill", "white");
					line1.text(`upid: ${d.train.upid}`);
					// line2.text(d.stop.station.name);productcategory
					line2.text(`category: ${d.train.productcategory}`);
					line3.text(`time: ${d.stop.realTime.toLocaleString(undefined, { hour: "numeric", minute: "numeric" })}`);
					path
					.attr("stroke", "none")
					.attr("fill", toopcolor);
					//.attr("opacity", 0.96);
					const box = text.node().getBBox();
					path.attr("d", `
					M${box.x - 10},${box.y - 10}
					H${box.width / 2 - 5}l5,-15l5,15
					H${box.width + 10}
					v${box.height + 20}
					h-${box.width + 20}
					z
				`);
					tooltip.attr("transform", `translate(${
					x(d.stop.station.distance) - box.width / 2},${
					y(new Date(d.stop.time)) + 37
					})`);
				})

				.on("click", function (event, d) {
					if (vm.trainSelectedList.includes(d.train.upid)) {
					// 取消选中
					vm.trainSelectedList = vm.trainSelectedList.filter(v => v !== d.train.upid)
					let currentIdSearch = "#id" + d.train.upid;
					d3.select(currentIdSearch).attr("fill", "white")
					} else {
					// 选中
					vm.trainSelectedList.push(d.train.upid);
					let currentIdSearch = "#id" + d.train.upid;
					d3.select(currentIdSearch).attr("fill", "grey")
					}
					if (vm.changeColor) {
					vm.$emit("trainClick", {list: vm.trainSelectedList, color: vm.showColor(parseInt(d.train.flag))});
					
					}else {
					vm.$emit("trainClick", {list: vm.trainSelectedList, color: vm.showColor(d.train.productcategory)});
					}
					
					// vm.$emit("trainClick", {list: vm.trainSelectedList, color: vm.trainSelectedColor});
				})
		});

		// zpj 2019-5-8 19:10:28 延长线
		// var lineColor = "red";
		// train.append("g")
		//   .attr("stroke", lineColor)
		//   .attr("transform", d => `translate(${x(stationsData.slice(-1)[0].distance)},${y(new Date(d.stops.slice(-1)[0].time))})`)
		//   .append("line")
		//   .attr("x1", 0)
		//   .attr("x2", d => d.slab_length / 100)
		//   .attr("y1", 0)
		//   .attr("y2", 0);
		


		//add zoom
		// var zoom = d3.zoom()
		//   .scaleExtent([0.1, 10])
		//   // .translateExtent([[0,margin.top], [width, height - margin.bottom]])
		//   // .extent([[0,margin.top], [width, height - margin.bottom]])
		//   .on('zoom', () => {
		//     // train.attr("transform", d3.event.transform);
		//     train.attr("transform", "translate(0," + d3.event.transform.y + ") scale(1," + d3.event.transform.k + ")");
		//     yGroup.call(_yAxis.scale(d3.event.transform.rescaleY(y)));
		//   })
		// this.svg.call(zoom);

		},
		setTrainColor(bool) {
		if (bool) {
			this.trainGroupStyle = d => d.flag === 0 ? this.labelColors[0] : this.labelColors[1]
		} else {
			this.trainGroupStyle = d => this.categoryColors(d.productcategory)
		}
		this.changeTrainColor(bool);
		if(this.trainSelectedList.length!==0){
		let selectupid=this.trainSelectedList[this.trainSelectedList.length-1]
		let selectcolor
		this.data.forEach(d => {
			if(d.upid===selectupid){
			if(bool){
				selectcolor= ((d.flag === 0 ? this.labelColors[0] : this.labelColors[1]))
			}else{
				selectcolor= ((this.categoryColors(d.productcategory)))
			}
			}         
			})
			return selectcolor
		}
		},
		changeTrainColor(bool) {
		if (bool) {
			this.changeColor = true
			this.showColor = this.labelColorsFunc
			this.trainGroup &&
			this.trainGroup.style('color', d => d.flag === 0 ? this.labelColors[0] : this.labelColors[1])
		} else {
			this.changeColor = false
			this.showColor = this.categoryColors
			this.trainGroup &&
			this.trainGroup.style('color', d => this.categoryColors(d.productcategory))
		}
		},
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
		merge(json , stations){
			const categorys = d3.group(json , d => d.productcategory)
			const mergecategorys = []	// merge categorys
			const minrange = 20
			const minconflict = 5
			const mergedata = {}
			const mergeIndex = {}	// merge station maxlength
			const mergeresult = [] , mpass=/MPass/ ;
			const mpassnumber = (+stations.slice(-4)[0].name.replace(mpass,''))
			for (let item of [...categorys]){
				item[1].length>minrange ? mergecategorys.push(item[0]) : undefined
			}
			// console.log(categorys)
			for (let item of  mergecategorys){
				let indexdata=d3.groups(categorys.get(item) , d => d.stops.length)
				console.log(indexdata)
				mergeIndex[item] = indexdata[d3.maxIndex(indexdata ,  d => d[1].length)][0]
			}
			// console.log(mergecategorys)
			// console.log(mergeIndex)
			for(var item =0;item<json.length-minrange ; item++){
				const incorp =false
				const categoryindex=mergecategorys.indexOf(json[item].productcategory)

				//filter data
				if(categoryindex ===-1)	continue
				var index =item
				while(json[index] !== undefined &json[item].productcategory === json[index].productcategory){
					index++
				}
				if( index - item < minrange) continue

				// merge length
				const mergelength = mergeIndex[json[item].productcategory]
				const mergedata = json.slice(item,index)
				// console.log(mergedata)

				//mPass expand
				for (var key = 0 ; key < mergedata.length-1 ; key++){
					if(mergedata[key].stops.slice(-1)[0].station.zone === '3'){
						let mpassindex = (+mergedata[key].stops.slice(-4)[0].station.name.replace(mpass,''))
						if(mpassindex === mpassnumber) continue
						const stationsstops3 = stations.slice(-3 + mpassindex - mpassnumber , -3)
						for (let stopkey in stationsstops3){
							mergedata[key].stops.splice( -3 , 0 , {
								"time" : mergedata[key].stops.slice(-4)[0].time,
								"realTime" : mergedata[key].stops.slice(-4)[0].realTime,
								"station" : stationsstops3[stopkey]
							})
						}
						continue
					}
					let mpassindex = (+mergedata[key].stops.slice(-1)[0].station.name.replace(mpass,''))
					const stationsstops3 = stations.slice(-3 + mpassindex - mpassnumber)
					for (let stopkey in stationsstops3){
						mergedata[key].stops.push({
							"time" : mergedata[key].stops.slice(-1)[0].time,
							"realTime" : mergedata[key].stops.slice(-1)[0].realTime,
							"station" : stationsstops3[stopkey]
						})
					}
				}
				
				const indexarray=[]
				for (var key = 0 ; key < mergedata.length-1 ; key++){
					// let singlearray=d3.pairs(mergedata[key].stops , (a,b) => {
					const steeltime = []
					for (var i = 0 ; i < mergedata[key].stops.length - 1 ; i++){
						// let sample = {}
						let stoptime = new Date(mergedata[key].stops[(+i)+1].time) - new Date(mergedata[key].stops[(+i)].time)
						// sample[mergedata[key].stops[(+i)].station.name] = stoptime < 0 ? 0 : stoptime 
						steeltime.push(stoptime < 0 ? 0 : stoptime )
					}
					indexarray.push(steeltime)
				}
				// console.log(indexarray)

				const steeldisTotal=d3.pairs(mergedata , (a,b) => {
					const steeldistance=[]
					for (let key in stations){
						const search = false
						for (let i in a.stops){
							if(a.stops[i]["station"].name === stations[key].name){
								for (let j in b.stops){
									if(b.stops[j]["station"].name === stations[key].name){
										steeldistance.push(new Date(b.stops[j].time) - new Date(a.stops[i].time))
										search=true
									}
								}
							}
						}
						search !== true ? steeldistance.push(0) : undefined
					}
					return steeldistance
				})
				// console.log(steeldisTotal)

				//data mean distance
				const meandis = []	
				for (let key in stations){
					meandis.push(d3.quantile(steeldisTotal, 0.75 , d => d[key]))
				}
				// console.log(meandis)

				// merge selection
				const mergeselect = []
				const mergeflag = 0 ;
				for (let i in steeldisTotal){
					const outrange = 0
					for (let j in stations){
						steeldisTotal[i][j] > meandis[j] ? ((steeldisTotal[i][j] - meandis[j])/meandis[j]>1.1 & meandis[j] !==0 ) ? outrange+=5 : outrange+=1 : undefined
						steeldisTotal[i][j]<0  ?	outrange += 20 : undefined
					}
					if(outrange >= 15)  mergeselect.push(mergedata[+i+1])
					if(mergeselect.length > minconflict -1 ) {
						mergeflag = (+i) +1
						break
					}
					// mergeselect.push(mergedata[i+1])
				}
				// console.log(mergeselect)

				if(mergeflag !== 0){
					mergeresult.push({
						"merge" : mergedata.slice(0 , 0 + mergeflag),
						"select" : mergeselect,
						"index" : [item , mergeflag ],
						"data" : [item , item + mergeflag ],
						"wave" : indexarray.slice(0 , 0 + mergeflag)
					})
					item = item + mergeflag
					continue
				}

				mergeresult.push({
					"merge" : mergedata,
					"select" : mergeselect,
					"index" : [item , index - item],
					"data" : [item , index ],
					"wave" : indexarray
				})
				item = index -1
			}
			return mergeresult
		}
	},
	mounted() {
	}
}
</script>

<style>
</style>
