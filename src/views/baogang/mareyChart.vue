<template>
	<div :id="menuId" style="height: 100%"></div>
	<!-- <div :id="menuId" style="height: 100%; overflow-y: scroll;overflow-x: hidden;"></div> -->
</template>

<script>
import * as d3 from 'd3';
import { Delaunay } from 'd3-delaunay';
import util from './util.js';
import jsondata, { fill } from './jsondata.js';
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
			data: undefined,
			station: undefined,
			highLightStrokeWidth : 2,
			defaultStrokeWidth : undefined,
			minrange: 20,
			minconflict: 5,
			isMerge: true,
			processColor: util.processColor,
			brushData: undefined
		}
	},
	methods: {
		paintMareyChart(alldata, stationsData, changeColor, brushData) {
		this.brushData = brushData
		console.log(brushData[0])
		const brushUCL = Array.from(d3.group(brushData, d => d.upid), ([key, value]) => ({[key]:value[0]}))
		// console.log(Array.from(d3.group(brushData, d => d.upid), ([key, value]) => ({[key]:value[0]})))
		this.trainSelectedList = []; // 2019-5-16 23:29:30 清空选择列表
		var vm = this;
		this.changeColor = changeColor
		this.changeColor ?(this.trainGroupStyle =  d => d.flag === 0 ? vm.labelColors[0] : vm.labelColors[1]) :(this.trainGroupStyle = d => vm.categoryColors(d.productcategory));
		
		var stationcolor = this.processColor;
		// data
		this.data=alldata;
		this.station=stationsData;
		var data = alldata
		var width = document.getElementById(this.menuId).offsetWidth;
		const mainHeight = document.getElementById(this.menuId).offsetHeight;
		const upidArray = d3.map(data, d => d.upid)
		var stations = stationsData
		var stops = d3.merge(data.map(d => d.stops.map(s => ({ train: d, stop: s }))))
		var statname = d3.map(stations, d => d.name)
		const statOver =  (e,m)  =>{
			d3.select("#polygon" + m.name).attr("fill", (d,i) => d3.color(statname.indexOf(d.name) <6 ? stationcolor [0] : ( statname.indexOf(d.name) > stations.length - 4 ? stationcolor [2] : stationcolor [1])).darker(0.2))
			d3.select("#line" + m.name).attr("stroke-width" , 2.5)
			d3.select("#station" + m.name).attr("font-weight", "bold")
		}
		const statOut =  (e,m)  =>{
			d3.select("#polygon" + m.name).attr("fill", (d,i) => statname.indexOf(d.name) <6 ? stationcolor [0] : ( statname.indexOf(d.name) > stations.length - 4 ? stationcolor [2] : stationcolor [1]))
			d3.select("#line" + m.name).attr("stroke-width" , 0.5)
			d3.select("#station" + m.name).attr("font-weight", "normal")
		}
		// chart
		// var height = 2400;
		var defaultStrokeWidth = d3.scaleLinear()
			.domain([0.006, 0.16])
			.range([0.5, 1.2])
		this.defaultStrokeWidth = defaultStrokeWidth
		var highLightStrokeWidth = this.highLightStrokeWidth
		let margin = ({ top: 65, right: 90, bottom: 0, left: 100 }),
			mareylength = width - 6 * margin.right;
		// margin.right = this.isMerge ? 90 : 50;
		var x = d3.scaleLinear()
			.domain(d3.extent(stations, d => d.distance))
			.range([margin.left + 10, mareylength ])

		// zpj 2019-4-15 20:02:15
		var minDate = data[0].stops[0].time.slice(0, 19);
		var maxDate = data.slice(-1)[0].stops.slice(-1)[0].time.slice(0, 19);
		var unitHeight = 300;
		var unitPerTime = 3.5;
		const timeHeightScale = unitHeight / (60 * 60 * 1000 * unitPerTime) // 单位高度 时间跨度x小时
		var height = 500
		console.log((new Date(maxDate).getTime() - new Date(minDate).getTime()) * timeHeightScale)
		// var height = (new Date(maxDate).getTime() - new Date(minDate).getTime()) * timeHeightScale
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

		const zoomer = d3.zoom()
			.on("zoom", null);
		this.svg !== undefined && this.svg.remove()
		this.svg = d3.select('#' + this.menuId)
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.attr("class", "svgWrapper")
			.attr("transform", "translate(-10,0)")
			.call(zoomer);
		const svg = this.svg;


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

		var renderG = this.svg.append("g").attr("class", "renderg")
		function render(){
			renderG !== undefined && renderG.remove()
			renderG = vm.svg.append("g").attr("class", "renderg")
			//add Axis
			const labellength =  mareylength - (margin.left + 10),
				labelwidth = ((labellength / (stations.length - 1)) )/1.5;
			var xAxis = g => g
				.style("font", "12px DIN")
				.selectAll("g")
				.data(stations)
				.join("g")
				.attr("transform", d => `translate(${x(d.distance)+4},0)`)
				// .call(g => g.append("line")
				// 	.attr("y1", margin.top - 0)
				// 	.attr("y2", margin.top)
				// 	.attr("stroke", "currentColor"))
				// .call(g => g.append("line")
				// 	.attr("y1", height - margin.bottom + 0)
				// 	.attr("y2", height - margin.bottom)
				// 	.attr("stroke", "currentColor"))
				// .call(g => g.append("line")
				// 	.attr("y1", margin.top - 3)
				// 	.attr("y2", height - margin.bottom + 3)
				// 	// .attr("stroke-dasharray", "1.5,2")
				// 	.attr("opacity" , 0.4)
				// 	.attr("stroke" , (d , i) => d3.color(i <6 ? stationcolor [0] : ( i> stations.length - 4 ? stationcolor [2] : stationcolor [1])))
				// 	// .attr("stroke", "currentColor")
				// 	// .attr("stroke-opacity", d => {
				// 	// 	return (d.name === "FuDischarging" || d.name === "MPass24") ? 0.8 : 0.4
				// 	// })
				// 	// .attr("stroke-opacity", 1)
				// 	)
				.call(g => g.append("polygon")
					.attr("transform", `translate(${-labelwidth} , ${margin.top + 0}) rotate(-45)`)
					.attr("points", `0, 0  ${labelwidth},${labelwidth}  95 , ${labelwidth}  ${95 - labelwidth}, 0`)
					// .attr("points", "0, 0  17, 17  110 , 17  93, 0")
					.attr("fill", (d,i) => statname.indexOf(d.name) <6 ? stationcolor [0] : ( statname.indexOf(d.name) > stations.length - 4 ? stationcolor [2] : stationcolor [1]))
					// .attr("fill" , (d , i) => i <6 ? stationcolor [0] : ( i> stations.length - 4 ? stationcolor [2] : stationcolor [1]))
					.attr("id", d => "polygon" + d.name)
					.attr("stroke" , "none")
					.on("mouseover", statOver)
					.on("mouseout", statOut))
				.call(g => g.append("text")
					.attr("transform", `translate(-4 ,${margin.top -1.5}) rotate(-45)`)
					.attr("id", d => "station"+d.name)
					.attr("x", 8)
					.attr("dy", "0.35em")
					.attr("font-family" , "DIN")
					.attr("fill", "white")
					.text(d => d.name.replace(/harging/, "harge").replace(/Cc/, "C").replace(/ing/, "").replace(/MPass/, "MP").replace(/arge/, ""))
					.on("mouseover", statOver)
					.on("mouseout", statOut))
			var polygonlength = (width - 1.5 * margin.right - (margin.left + 10))/1.414  +  labelwidth + 3
			var xRect = g => g.append("polygon")
					.attr("transform", `translate(${margin.left + 10 - labelwidth/2 - 6} ,${margin.top -1.5}) rotate(-45)`)
					.attr("id", "rectxLine")
					.attr("points", `0, 0  ${polygonlength},${polygonlength} ${112 - labelwidth + polygonlength}, ${polygonlength}  ${112 - labelwidth}, 0`)
					// .attr("stroke", "grey")
					.attr("fill", "none")
					// .attr("filter","url(#label-rect)")
					.attr("stroke", "#c4c4c4")
					.attr("stroke-width", 0.15)
					.attr("filter","url(#shadow-card)")
			
			// var xGroup = renderG.append("g")
			// 	.call(xAxis);
			const defs = renderG.append("defs");
			const filtershadow =defs.append("filter").attr("id", "shadow-rect")
			filtershadow.append("feDropShadow")
				.attr("dx",0)
				.attr("dy", 0)
				.attr("stdDeviation", 2.5)
				.attr("flood-color", "#bfbdbd")
			const filterrect =defs.append("filter").attr("id", "shadow-card")
			filterrect.append("feDropShadow")
				.attr("dx",0)
				.attr("dy", 0)
				.attr("stdDeviation", 5)
				.attr("flood-color", "#ededed")
			const filterlabel =defs.append("filter").attr("id", "label-rect")
			filtershadow.append("feDropShadow")
				.attr("dx",0)
				.attr("dy", 0)
				.attr("stdDeviation", 10)
				.attr("flood-color", "#bfbdbd")

			renderG.append("g")
				.call(g => g.append("rect")
					.attr("x" , margin.left - 5)
					.attr("y", margin.top)
					.style("fill","white")
					.attr("stroke", "#aaa")
					.attr("stroke-width",0.25)
					.attr("width", width - margin.left - 1.5*margin.right +15)
					.attr("height", height - margin.top - margin.bottom))
				.call(g => g.append("rect")
					.attr("x" , margin.left - 5)
					.attr("class", "shadow_rect")
					.attr("y", margin.top)
					.style("fill","none")
					.attr("stroke", "#aaa")
					.attr("stroke-width",0.25)
					.attr("width", width - margin.left - 1.5*margin.right +15)
					.attr("height", height - margin.top - margin.bottom))
					.attr("filter","url(#shadow-rect)")
					
			
			renderG.append("g")
				.attr("class", "axisrect")
				.call(g => g.append("rect")
					.attr("x" , margin.left - 5)
					.attr("class", "background")
					.attr("y", 0)
					.style("fill","white")
					.attr("stroke", "none")
					.attr("width", width - margin.left)
					.attr("height", margin.top))

				// .call(g => g
				// 	.style("font", "12px DIN")
				// 	.selectAll("g")
				// 	.data(stations)
				// 	.join("g")
				// 	.attr("transform", d => `translate(${x(d.distance)},0)`)
				// 	.call(g => g.append("line")
				// 		.attr("y1", margin.top - 3)
				// 		.attr("y2", height - margin.bottom + 3)
				// 		// .attr("stroke-dasharray", "1.5,2")
				// 		.attr("opacity" , 0.4)
				// 		.attr("stroke" , (d , i) => d3.color(i <6 ? stationcolor [0] : ( i> stations.length - 4 ? stationcolor [2] : stationcolor [1])).darker(1)))
				// 	.call(g => g.append("text")
				// 		.attr("transform", `translate(-4 ,${margin.top + 0}) rotate(-45)`)
				// 		.attr("class", "xAxisLabel")
				// 		.attr("x", 8)
				// 		.attr("dy", "0.35em")
				// 		.attr("font-family" , "DIN")
				// 		.attr("fill", "white")
				// 		.text(d => d.name))
				// )
			var _yAxis = d3.axisLeft(y)
				.ticks(d3.formatMinute)
				.tickSize(0)
			var yAxis = g => g
				.attr("transform", `translate(${margin.left + 5},0)`)
				.style("font", "12px DIN")
				.call(_yAxis
				// .tickFormat(date => date.toLocaleString(undefined, { hour: "numeric" }))
				)
				.call(g => g.select(".domain").remove())
				.call(g => g.selectAll(".tick line").clone().lower()
				.attr("stroke-opacity", 0.2)
				.attr("x2", width - 80))
			renderG.append("g")
				.style("font", "12px DIN")
				.selectAll("g")
				.data(stations)
				.join("g")
				.attr("transform", d => `translate(${x(d.distance)},0)`)

				.call(g => g.append("line")
					.attr("y1", margin.top - 3)
					.attr("y2", height - margin.bottom + 3)
					.attr("id", d => "line" + d.name)
					.attr("stroke-width" , 0.5)
					// .attr("stroke-dasharray", "1.5,2")
					.attr("opacity" , 0.4)
					.attr("stroke" , (d , i) => d3.color(i <6 ? stationcolor [0] : ( i> stations.length - 4 ? stationcolor [2] : stationcolor [1]))))

			filterdata = vm.isMerge ? filterdata : data
			var train = renderG.append("g")
				.attr("fill", "white")
				.selectAll("g")
				.data(filterdata)
				.join("g")
				.style("color", vm.trainGroupStyle)
				.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) })
				.attr("id", d => ("id" + d.upid))
				.call(g => g.append("path")
					.attr("fill", "none")
					.attr("stroke", "currentColor")
					.attr("d", d => line(d.stops)))
			
			var maxlength = d3.max(mergeresult, d => d["merge"].length)
			var axislength = 6 ;
			var lmaxlength = 50 ;
			var qualityData = [];
			const circledot = width - margin.right * 0.75;
			var circleline = d3.scaleLinear()
					.domain([20 , maxlength ]).nice()
					.range([ 40 , lmaxlength])
			for (let item in mergeresult){
				if(!vm.isMerge) break
				var xaxlength = 30
				// circleline(mergeresult[item]["merge"].length)
				var index = mergeresult[item]["data"]
				// console.log(mergeresult[item])

				var sDate = data[index[0]].stops[0].time;
				var eDate = data[index[1]].stops[0].time
				var lineheight = (y((new Date(eDate))) - y(new Date(sDate)))
				var midindex=Math.floor(d3.mean(index))

				var linetransfrom = 0
				// (y((new Date(data[midindex+1].stops[0].time))) - y(new Date(data[midindex].stops[0].time)))

				var quality = d3.sort(d3.groups(mergeresult[item]["merge"], d => d.flag), d=> d[1].length)
				// vm.changeColor
				renderG.append("g")
					.attr("fill", "white")
					.selectAll(`g`+item)
					.data(data.slice(midindex , midindex+1))
					.join("g")
					.style("color", vm.changeColor ?  (quality[1] !== undefined ? vm.labelColors[quality[1][0]] : vm.labelColors[quality[0][0]]) : vm.trainGroupStyle)
					.attr("stroke-width", lineheight )
					.attr("class", "mergerect")
					.attr("id", "mergerect"+item)
					.attr("opacity" , 1)
					.attr("transform", `translate( 0 ,${ linetransfrom })`)
					.call(g => g.append("path")
						.attr("fill", "none")
						.attr("stroke", "currentColor")
						.attr("opacity" , 0.4)
						.attr("d", d => line(d.stops)))
					.on("mouseover", (e,d) => {
						var selectmouse = d3.map(mergeresult[item]["select"], d => d.upid)
						var mergemouse = d3.map(mergeresult[item]["merge"], d => d.upid)
						// console.log(d3.filter(mergemouse , d => selectmouse.indexOf(d) === -1 ))
						vm.$emit("trainMouse", {upid: d3.filter(mergemouse , d => selectmouse.indexOf(d) === -1 ),  mouse: 0});
					})
					.on("mouseout", (e,d) => {
						var selectmouse = d3.map(mergeresult[item]["select"], d => d.upid)
						var mergemouse = d3.map(mergeresult[item]["merge"], d => d.upid)
						vm.$emit("trainMouse", {upid: d3.filter(mergemouse , d => selectmouse.indexOf(d) === -1 ),  mouse: 1});
					})
				if(vm.changeColor && quality[1] !== undefined){
					renderG.append("g")
					.attr("fill", "white")
					.selectAll(`.select g`+item)
					.data(quality[1] !== undefined ? quality[0][1] : [])
					.join("g")
					.style("color", vm.trainGroupStyle)
					.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) } )
					.attr("id", d => ("id" + d.upid))
					.attr("transform", `translate( 0 ,${ linetransfrom })`)
					.call(g => g.append("path")
						.attr("fill", "none")
						.attr("stroke", "currentColor")
						.attr("d", d => line(d.stops)))
					qualityData.push(...d3.map(quality[0][1], d=> d.upid))
				}
				renderG.append("g")
					.attr("fill", "white")
					.selectAll(`.select g`+item)
					.data(mergeresult[item]["select"])
					.join("g")
					.style("color", vm.trainGroupStyle)
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
				const position = [ circledot , (y((new Date(data[midindex+1].stops[stations.length-1].time))) )];
				const rectG = renderG
					.append("g")
					.on("click",(e,d) => {
						console.log("ghsui")
						d3.selectAll(".lineDate").attr("stroke-width", 0.15)
						d3.select("#lineDate"+item).attr("stroke-width", 1.5)
						let badupid = d3.map(d3.filter(mergeresult[item]["merge"], d => d.flag === 0), d => d.upid)
						// var selectUpid = new Set(badupid)
						// (d3.map(mergeresult[item]["merge"], d => d.upid)).forEach(x => selectUpid.add(x))
						var selectUpid = [...badupid,...d3.map(mergeresult[item]["select"], d => d.upid)] 
						if(mergeresult[item]["select"].length !==0)
							vm.trainSelectedList.push(mergeresult[item]["select"].slice(-1)[0].upid)
						let upidSelect = [...selectUpid]
						vm.$emit("trainClick",{list: vm.trainSelectedList, 
								color: vm.trainGroupStyle(mergeresult[item]["select"].slice(-1)[0]),
								upidSelect:upidSelect.slice(0,-1),
								"type":"group"})
						

						// let upidSelect = d3.map(d3.filter(data.slice(upidArray.indexOf(d.train.upid)), d => d.flag === 0), d => d.upid)
						// // let upidSelect = upidArray.slice(upidArray.indexOf(d.train.upid)+1, upidArray.indexOf(d.train.upid)+5)
						// vm.$emit("trainClick", {list: vm.trainSelectedList, color: vm.showColor(parseInt(d.train.flag)), upidSelect:upidSelect});
					})
					.on("mouseout",(e,d) => {
						d3.selectAll(".mergerect").attr("opacity", 1)
					})
					.on("mouseover",(e,d) => {
						d3.selectAll(".mergerect").attr("opacity", 0.6)
						d3.select("#mergerect"+item).attr("opacity", 1)
					})
				const rectwidth = xaxlength + 25;
				var rectCard;
				var lineDate = g => g.append("g")
					.attr("transform", `translate(${[position[0]-rectwidth, position[1]-rectwidth]})`)
					.call(g => g.append("rect")
						.attr("stroke", "#c4c4c4")
						.attr("stroke-width", 0.15)
						.attr("fill", "white")
						.attr("class", "lineDate")
						.attr("id", "lineDate"+item)
						.attr("x", -rectwidth)
						// .attr("transform", `translate(${[-xaxlength-25, -xaxlength-25]})`)
						.attr("width", 3*rectwidth)
						.attr("height", 2*rectwidth)
						.attr("filter","url(#shadow-card)"))
				if(item == 0 ||  item == mergeresult.length - 1){
					rectCard = g => g.append("g")
						.attr("transform", `translate(${[position[0] - 25, position[1]-rectwidth -  22]})`)
						.data(data.slice(midindex , midindex+1))
						.call(g => g.append("rect")
							.attr("stroke", "#c4c4c4")
							.attr("stroke-width", 0.15)
							.attr("width", 40)
							.attr("height", 20)
							.attr("fill", d => vm.categoryColors(d.productcategory))
							.attr("opacity", 0.7)
							.attr("rx", 10)
							.attr("filter","url(#shadow-card)"))
						.call(g => g.append("text")
							.attr("x", 25)
							.attr("y", 15)
							.attr("fill", "white")
							// .attr("opacity", 0.6)
							.attr("font-family", "DIN")
                            .attr("font-size", "10pt")
                            .attr("font-weight", "450")
                            .attr("text-anchor", "middle")
                            .text(d  =>  d.productcategory)
							.attr("stroke", "none"))
				}else{
					var Cateindex = Math.floor(d3.mean(mergeresult[+ item + 1 + ""]["data"]));
					rectCard = g => {
						var sries = g.append("defs")
						var marker =sries.append("marker")
								.attr("id", "triangle"+item)
								.attr("markerUnits", "strokeWidth")
								.attr("markerWidth", 5)
								.attr("markerWidth", 4)
								.attr("refX", 0)
								.attr("refY", 2)
								.attr("orient", "auto")
						marker.append("path")
									.attr("d", "M 0 0 L 5 2 L 0 4 z")
									.attr("fill", "#c4c4c4")
						g.append("g")
							.attr("transform", `translate(${[position[0]  - rectwidth * 0.1, position[1]-rectwidth -  12]})`)
							.call(g => g.append("path")
								.attr("stroke", "#c4c4c4")
								.attr("stroke-width", 2)
								.attr("fill", "none")
								.style("marker-end", `url(#triangle${item})`)
								.attr("d", "M -5,0 L 6,0"))
						g.append("g")
							.attr("transform", `translate(${[position[0] - 25 - rectwidth * 0.6 , position[1]-rectwidth -  22]})`)
							.data(data.slice(midindex , midindex+1))
							.call(g => g.append("rect")
								.attr("stroke", "#c4c4c4")
								.attr("stroke-width", 0.15)
								.attr("width", 40)
								.attr("height", 20)
								.attr("fill", d => vm.categoryColors(d.productcategory))
								.attr("opacity", 0.7)
								.attr("rx", 10)
								.attr("filter","url(#shadow-card)"))
							.call(g => g.append("text")
								.attr("x", 25)
								.attr("y", 15)
								.attr("fill", "white")
								// .attr("opacity", 0.6)
								.attr("font-family", "DIN")
								.attr("font-size", "10pt")
								.attr("font-weight", "450")
								.attr("text-anchor", "middle")
								.text(d  =>  d.productcategory)
								.attr("stroke", "none"))
						
						g.append("g")
							.attr("transform", `translate(${[position[0] - 25 + rectwidth * 0.6 , position[1]-rectwidth -  22]})`)
							.data(data.slice(Cateindex , Cateindex+1))
							.call(g => g.append("rect")
								.attr("stroke", "#c4c4c4")
								.attr("stroke-width", 0.15)
								.attr("width", 40)
								.attr("height", 20)
								.attr("fill", d => vm.categoryColors(d.productcategory))
								.attr("opacity", 0.7)
								.attr("rx", 10)
								.attr("filter","url(#shadow-card)"))
							.call(g => g.append("text")
								.attr("x", 25)
								.attr("y", 15)
								.attr("fill", "white")
								// .attr("opacity", 0.6)
								.attr("font-family", "DIN")
								.attr("font-size", "10pt")
								.attr("font-weight", "450")
								.attr("text-anchor", "middle")
								.text(d  =>  d.productcategory)
								.attr("stroke", "none"))
					}
				}
				rectG.call(lineDate)
				// .call(rectCard)
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
						if(linelength == 0)break
						// console.log(Math.floor((linedata[j] - maxmin[0])/linelength))
						// console.log(sortdata[Math.floor((linedata[j] - maxmin[0])/linelength)])
						sortdata[Math.floor((linedata[j] - maxmin[0])/linelength)][1] += 1
					}
					// if((+i)!==1) console.log(sortdata)
					sortdata.push([maxmin[1] + 1 * linelength , 0])
					sortdata.unshift([maxmin[0] - 1 * linelength , 0])
					let xline = d3.scaleLinear()
						.domain([maxmin[0] , maxmin[1]]).nice()
						.range([0, xaxlength]);
					const link = [d3.quantile(linedata, 0.1),d3.quantile(linedata, 0.9)]
					const text = ["H", "R", "C"][i];
					rectG.append("g").selectAll(".translatesfas")
						.data(link).join("g")
						.attr("transform", `rotate(${(+i - 1)*120 - 30} ,${position}) `)
						.attr("class", "translatesfas")
						.call(g => g.append("line")
							.attr("stroke", d3.color(stationcolor[i]).darker(0.1))
							.attr("transform", d =>`translate( ${[ position[0] + xline(d), position[1] ]})`  )
							.attr("stroke-width", 1.5)
							.attr("y1", -3)
							.attr("y2", 3))
						.call(g => g.append("line")
							.attr("stroke", d3.color(stationcolor[i]).darker(0.1))
							.attr("transform", `translate( ${position})`  )
							.attr("stroke-width", 1.5)
							.attr("x1", xline(link[0]))
							.attr("x2", xline(link[1])))
						.call(g => g.append("circle")
							.attr("transform", `translate( ${position})`  )
							.attr("stroke", d3.color(stationcolor[i]).darker(0.1))
							.attr("fill", d3.color(stationcolor[i]).brighter(0.2))
							.attr("cx", xline(d3.quantile(linedata, 0.5)))
							.attr("cy", 0)
							.attr("r" , 2.5))
						rectG.append("g")
							.attr("transform", `translate( ${position})`  )
							.call(g => g.append("text")
								.attr("transform", ` rotate( ${ (i- 2) * 120  -10} ) `)
								.attr("stroke", "none")
								.style("font-family", "DIN")
								.attr("fill", d3.color(stationcolor[i]).darker(0.6))
								.attr("y",xline(d3.quantile(linedata, 0.5)))
								.attr("font-size", "8px")
								.text(text))

					// let xline = d3.scaleLinear()
					// 	.domain([maxmin[0] - 0.5*linelength , maxmin[1] + 0.5*linelength ]).nice()
					// 	.range([0, xaxlength])

					// let yline = d3.scaleLinear()
					// 	.domain([0, d3.max(sortdata, d => d[1])])
					// 	.range([axislength , 0])
					// let liner = d3.line()
					// 	.curve(d3.curveBasis)

					lineposition.push(meandata)
					lineScale.push(xline)
					// if((+i)==2) continue
					// rectG.append("path")
					// 	.datum(sortdata)
					// 	.attr("fill", stationcolor[i])
					// 	.attr("class", "linedist")
					// 	.attr("stroke", "none")
					// 	.attr("transform", `rotate(${(+i)*120 - 90} ,${position}) translate( ${[ position[0] , position[1]-axislength ]})  `)
					// 	// rotate(${ 120 *(1+(+i)) -60} ,${[ 0 , 0 ]})
					// 	.attr("stroke-width", 1.5)
					// 	.attr("opacity" , 0.8)
					// 	.attr("stroke-linejoin", "round")
					// 	.attr("d", 
					// 			liner.x(d => xline(d[0]))
					// 				.y(d => yline(d[1])));
					// rectG.append("path")
					// 	.datum(sortdata)
					// 	.attr("fill", stationcolor[i])
					// 	.attr("class", "linedist")
					// 	.attr("stroke", "none")
					// 	.attr("transform", `rotate(${(+i)*120 - 90} ,${position}) translate( ${[ position[0] , position[1]-axislength ]})  `)
					// 	// rotate(${ 120 *(1+(+i)) -60} ,${[ 0 , 0 ]})
					// 	.attr("stroke-width", 1.5)
					// 	.attr("opacity" , 0.8)
					// 	.attr("stroke-linejoin", "round")
					// 	.attr("d", 
					// 			liner.x(d => xline(d[0]))
					// 				.y(d => yline(d[1])));
					// rectG.append("path")
					// 	.datum(sortdata)
					// 	.attr("fill", stationcolor[i])
					// 	.attr("class", "linedist")
					// 	.attr("stroke", "none")
					// 	.attr("transform", `rotate(${(+i)*120 - 90} ,${position}) translate( ${[ position[0] , position[1]+ axislength ]})  `)
					// 	.attr("stroke-width", 1.5)
					// 	.attr("opacity" , 0.8)
					// 	.attr("stroke-linejoin", "round")
					// 	.attr("d", 
					// 			liner.x(d => xline(d[0]))
					// 				.y(d => -yline(d[1])))
				}
				const meanLine = d3.lineRadial()
					.curve(d3.curveLinearClosed)
					.angle((d , i) => i*120/180*Math.PI -Math.PI/3);
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
				// console.log(wheeldata)
				const pcRadius = d3.scaleLinear()
					.domain( [0 , d3.extent(wheeldata)[1]])
					.range([0 , 8]);
				const scRadius = d3.scaleLinear()
					.domain( [ d3.extent(wheeldata)[0] , 0])
					.range([ 8 , 0]);
				const arrayindex =  [ [0 , 6 ] , [ 6 , -2 ] , [-5]];
				const piedata = d3.map(arrayindex , d => wheeldata.slice(...d));
				var lineSate = data[index[0]].stops.slice(-1)[0].time;
				var lineEate = data[index[1]].stops.slice(-1)[0].time;
				var meanposition = y(new Date(data.slice(midindex , midindex+1)[0].stops.slice(-1)[0].time))
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
				// console.log(piedata)

					// .call(g => g.append("line")
					// 	.attr("stroke", "#c4c4c4")
					// 	.attr("stroke-width", 0.45)
					// 	// .attr("y2", y(new Date(lineSate)) - position[1]+rectwidth)
					// 	.attr("y2", meanposition + rectwidth - position[1] - lineheight/2)
					// 	.attr("x2", width - 1.5 * margin.right -position[0]+rectwidth))
					// .call(g => g.append("line")
					// 	.attr("stroke", "#c4c4c4")
					// 	.attr("stroke-width", 0.45)
					// 	.attr("y1",2 * rectwidth)
					// 	// .attr("y2", y(new Date(lineEate)) - position[1]+rectwidth)
					// 	.attr("y2", meanposition + rectwidth - position[1] + lineheight/2)
					// 	.attr("x2", width - 1.5 * margin.right -position[0]+rectwidth))
				rectG
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
					// .call(g => g.append("circle")
					// 	.attr("transform", (d , i) => ` rotate( ${ d * 120 - 90} ) `)
					// 	.attr("fill", (d , i) => d3.color(stationcolor[d]).darker(0.5))
					// 	.attr("cx", d => lineScale[d](lineposition[d]))
					// 	.attr("cy", 0)
					// 	.attr("r" , 3))
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
				// 	.attr("fill", vm.categoryColors(mergeresult[item]["merge"][0].productcategory))
				// 	.attr("d", area
				// 		.innerRadius(d => d===0 ? xaxlength - 5 : xaxlength - 5 - cRadius(d))
				// 		.outerRadius(xaxlength)
				// 	(wheeldata)))
				rectG.lower()
			}
			
			renderG.append("g")
				.call(g => {
					const tooltip = g.append("g")
						.style("font", "15px DIN");
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
						if( (filter.indexOf(d.train.upid) !==-1 && (qualityData.indexOf(d.train.upid) ===-1)) && vm.isMerge) return
						if (vm.changeColor) {
						// vm.$emit("trainMouse", {upid: d.train.upid, color: vm.showColor(parseInt(d.train.flag)), mouse: 1});
						
						}else {
						// vm.$emit("trainMouse", {upid: d.train.upid, color: vm.showColor(d.train.productcategory), mouse: 1});
						}
						vm.$emit("trainMouse", {upid: [d.train.upid],  mouse: 1});
						tooltip.style("display", "none");
						let currentIdSearch = "#id" + d.train.upid;
						if(vm.trainSelectedList.includes(d.train.upid))return
						d3.select(currentIdSearch)
						.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) })
						.selectAll("rect")
						.attr("stroke", "none");
						
					})

					.on("mouseover", (event, d) => {
						// console.log(d)
						if( (filter.indexOf(d.train.upid) !==-1 && (qualityData.indexOf(d.train.upid) ===-1)) && vm.isMerge) return
						if (vm.changeColor) {
						// vm.$emit("trainMouse", {upid: d.train.upid, color: vm.showColor(parseInt(d.train.flag)), mouse: 0});
						
						}else {
						// vm.$emit("trainMouse", {upid: d.train.upid, color: vm.showColor(d.train.productcategory), mouse: 0});
						}
						vm.$emit("trainMouse", {upid: [d.train.upid],  mouse: 0});
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
						d3.select(currentIdSearch)
						.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) })
						.selectAll("rect")
						.attr("stroke", "none");
						} else {
						// 选中
						if(vm.trainSelectedList.length !==0){
							d3.select("#id"+ vm.trainSelectedList[vm.trainSelectedList.length-1])
								.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) })
								.selectAll("rect")
								.attr("stroke", "none");
						}
						vm.trainSelectedList.push(d.train.upid);
						let currentIdSearch = "#id" + d.train.upid;
						d3.select(currentIdSearch).attr("fill", "grey")
						d3.select(currentIdSearch)
						.attr("stroke-width", highLightStrokeWidth)
						.selectAll("rect")
						.attr("stroke", "black");
						}
						let upidSelect = d3.map(d3.filter(data.slice(upidArray.indexOf(d.train.upid)), d => d.flag === 0), d => d.upid)
						// let upidSelect = upidArray.slice(upidArray.indexOf(d.train.upid)+1, upidArray.indexOf(d.train.upid)+5)
						if (vm.changeColor) {
						vm.$emit("trainClick", {list: vm.trainSelectedList, color: vm.showColor(parseInt(d.train.flag)), upidSelect:upidSelect});
						
						}else {
						vm.$emit("trainClick", {list: vm.trainSelectedList, color: vm.showColor(d.train.productcategory), upidSelect:upidSelect});
						}
					})
			});
			d3.select(".axisrect").raise()
			
			var xGroup = renderG.append("g")
				.call(xRect).call(xAxis);
			renderG
			d3.select(".shadow_rect").raise()
			// var yGroup = renderG.append("g")
			// 	.call(yAxis);
			// d3.select(".xAxisLabel").raise()
		}
		render()

		const miniMargin = { top: 115, right: 25, bottom: -35, left: 25 },

			miniheight =  mainHeight - miniMargin.top - miniMargin.bottom,
			miniwidth = 75,
			miniXScale = d3.scaleTime()
				.domain([new Date(minDate), new Date(maxDate)])
				.range([0, miniheight - miniMargin.bottom - miniMargin.top]),
			miniYScale = d3.scaleLinear()
				.domain(d3.extent(stations, d => d.distance))
				.range([0 , miniwidth - miniMargin.right - miniMargin.left ]),
			mainXScale = d3.scaleTime()
				.domain([new Date(minDate), new Date(maxDate)])
				.range([margin.top, height - margin.bottom]),
			mainYScale = d3.scaleLinear()
				.domain(d3.extent(stations, d => d.distance))
				.range([margin.left + 10, width - 1.5 * margin.right ]),
			mainXZoom = d3.scaleLinear()
				.range([margin.top, mainHeight - margin.bottom])
				.domain([0, miniheight - miniMargin.bottom - miniMargin.top]),
			miniline = d3.line()
				.x(d => miniYScale(d.station.distance))
				.y(d => miniXScale(new Date(d.time))),
			BrushSelectHeight = this.isMerge ? miniXScale(new Date(data[50].stops[0].time.slice(0, 19))) : miniXScale(new Date(data[75].stops[0].time.slice(0, 19))),
			// BrushSelectHeight =50,
			initialBrushXSelection = [0, BrushSelectHeight],
			brush = d3.brushY()
				.extent([[0, 0], [miniwidth - miniMargin.right - miniMargin.left, miniheight - miniMargin.bottom - miniMargin.top]])
				.on("brush", brushmove),
			stellheight = d3.scaleLinear()
				.domain([0.006, 0.16])
				.range([1.4, 1.5]);
		function brushmove(event) {
			const extentX = event.selection;
			const selected = miniXScale
				.domain()
				.filter(d => (extentX[0] + 1e-2 <= miniXScale(d)) && (miniXScale(d) <= extentX[1] - 1e-2));
			const selectTime = [miniXScale.invert(extentX[0]),miniXScale.invert(extentX[1])];
			mainXZoom.domain(extentX);
			y = d3.scaleTime()
				.domain(selectTime)
				.range([margin.top, miniheight - miniMargin.bottom - miniMargin.top])
			line = d3.line()
				.x(d => x(d.station.distance))
				.y(d => y(new Date(d.time)))
			voronoi = Delaunay
				.from(stops, d => x(d.stop.station.distance), d => y(new Date(d.stop.time)))
				.voronoi([margin.left, margin.top, width-margin.left, miniheight-margin.top])
			d3.select(".miniGroup").selectAll(".rect")
				.attr("opacity", d=> miniXScale(new Date(d.stops[0].time))>extentX[0] && miniXScale(new Date(d.stops[0].time))<extentX[1] ? 0.4 : 0.2)
			d3.select(".miniLine1").attr("y1", miniMargin.top + extentX[0])
			d3.select(".miniLine2").attr("y1", miniMargin.top + extentX[1])
			d3.select(".selection")
				.attr("fill", "none")
				.attr("stroke", "#aaa")
			render()
			// d3.select(".miniGroup").selectAll(".bar")
			// 	.style("fill", d => selected.indexOf(d.x) > -1 ? barColor : inactiveColor);
			
			// let originalRange = mainXZoom.range();
			// mainXZoom.domain(extentX);

			// mainXScale.domain(data.map(d => d.x));
			// mainXScale.range([mainXZoom(originalRange[0]), mainXZoom(originalRange[1])]).paddingInner(1.2);
			
			// d3.select(".wrapperGroup").select(".x-axis")
			// 	.call(mainXAxis);
		}
		function scroll(event) {
			const gBrush = d3.select(".brush");

			let selection = d3.brushSelection(gBrush.node());
			
			let size = selection[1] - selection[0],
					range = miniXScale.range(),
					x0 = d3.min(range),
					x1 = d3.max(range),
					// dx = -d3.event.deltaX,
					dx = event.deltaX,
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
		// const defs = svg.append("defs");


		const wrapperGroup = svg.append("g")
			.attr("class", "wrapperGroup");

		const mainBarsGroup = wrapperGroup.append("g")
			.attr("class", "mainBarsGroup");
		const miniGroup = svg.append("g")
			.attr("class", "miniGroup")
			.attr("transform", `translate(${[miniMargin.left, miniMargin.top]})`);
		const brushGroup = svg.append("g")
			.attr("class", "brushWrapper")
			.attr("transform", `translate(${[miniMargin.left, miniMargin.top]})`)
			.append("g")
				.attr("class", "brush")
				.call(brush);
		brushGroup.selectAll("rect")
			.attr("width", miniwidth - miniMargin.right - miniMargin.left)
			.attr("height", miniheight - miniMargin.bottom - miniMargin.top);
		brushGroup.select(".overlay")
			.attr("stroke", "#aaa")
			.style("stroke-width", 0.25)
			.each(d => d.type = "selection")
			.on("mousedown touchstart", function (event) {
				brushcenter(event)
			});
		function brushcenter(event) {
			let selection = d3.brushSelection(brushGroup.node()),
				size = selection[1] - selection[0],
				range = miniXScale.range(),
				cx = d3.pointer(event)[1],
				x0 = cx - size / 2,
				x1 = cx + size / 2,
				y1 = d3.max(range) ,
				pos = x1 > y1 ? [y1 - size, y1] : x0 < 0 ? [0, size] : [x0, x1];
			brushGroup.call(brush.move, pos);
		}
		const miniBars = miniGroup.selectAll(".rect")
				.data(data)
				.join('rect')
					.attr("class", "rect")
					.attr('x', 0)
					.attr('y', d => miniXScale(new Date(d.stops[0].time)))
					.attr("id", d => "miniBar" + d.upid)
					.attr("height", d => stellheight(d.tgtplatethickness2))
					// .attr("opacity" , 0.4)
					.attr('width', miniwidth - miniMargin.right - miniMargin.left)
					.attr("fill", d=>  this.trainGroupStyle(d))
					.attr("opacity", d=> miniXScale(new Date(d.stops[0].time))>initialBrushXSelection[0] && miniXScale(new Date(d.stops[0].time))<initialBrushXSelection[1] ? 0.4 : 0.2)
					// .attr("fill", d=> miniXScale(new Date(d.stops[0].time))>initialBrushXSelection[0] && miniXScale(new Date(d.stops[0].time))<initialBrushXSelection[1] ? this.trainGroupStyle(d) : d3.color(this.trainGroupStyle(d)).brighter(1.2))
		const miniLine = svg
			.call(g => g.append("line")
						.attr("x1", miniwidth - miniMargin.right )
						.attr("y1", miniMargin.top + initialBrushXSelection[0])
						.attr("class", "miniLine1")
						.style("stroke","#c9cbcc")
						.attr("x2", margin.left - 5)
						.attr("y2", margin.top)
						.style("stroke-width", 0.75))
			.call(g => g.append("line")
						.attr("class", "miniLine2")
						.attr("x1", miniwidth - miniMargin.right )
						.attr("y1", miniMargin.top + initialBrushXSelection[1])
						.style("stroke","#c9cbcc")
						.attr("x2", margin.left - 5)
						.attr("y2", mainHeight)
						.style("stroke-width", 0.75))
		var miniAxis = d3.axisLeft(miniXScale)
			.ticks(d3.formatMinute)
			// .ticks(5, d3.timeFormat("%b %d %H"))
			.tickSize(0)
		var miniyAxis = g => g
			.style("font", "7.5px DIN")
			.style("font-weight", "bolder")
			.style("color", "black")
			.call(miniAxis
				// .tickFormat(date => date.toLocaleString('en-GB', { timeZone: 'UTC' }))
			// .tickFormat(date => date.toLocaleString(undefined, { hour: "numeric" }))
			)
			.call(g => g.select(".domain").remove())
		// 	// .call(g => g.selectAll(".tick line").clone().lower()
		// 	// .attr("stroke-opacity", 0.2)
		// 	// .attr("x2", width - 80))
		// svg.call(miniyAxis)
		const axis = svg
			.append("g")
			.attr("class", "axisclass")
			.attr("transform", `translate(${[miniwidth - miniMargin.right +5, miniMargin.top]})`)
			.call(miniyAxis)
		axis.selectAll("text").attr("text-anchor", "start")
		const defs = svg.append("defs");
			const filterrect =defs.append("filter").attr("id", "shadow-label")
			filterrect.append("feDropShadow")
				.attr("dx",0)
				.attr("dy", 0)
				.attr("stdDeviation", 20)
				.attr("flood-color", "#c9cbcc")
		svg
			.append("rect")
			.attr("class", "miniaxisrect")
			.attr("transform", `translate(${[miniMargin.left, miniMargin.top]})`)
			.attr("height", miniheight - miniMargin.bottom - miniMargin.top)
			.attr("width", miniwidth - miniMargin.right - miniMargin.left)
			.attr("fill", "none")
			.attr("stroke", "#c9cbcc")
			.attr("stroke-width", 0.15)
			.attr("filter","url(#shadow-label)")
		brushGroup.call(brush.move, initialBrushXSelection);
		d3.select(".selection")
			.attr("fill", "none")
			.attr("stroke", "#aaa")
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
			this.paintMareyChart(this.data,this.station, this.changeColor, this.brushData)
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
			const minrange = this.minrange
			const minconflict = this.minconflict
			// console.log(minconflict)
			const mergedata = {}
			const mergeIndex = {}	// merge station maxlength
			const mergeresult = [] , mpass = /MPass/ ;
			const mpassnumber = (+stations.slice(-4)[0].name.replace(mpass,''))
			for (let item of [...categorys]){
				item[1].length>minrange ? mergecategorys.push(item[0]) : undefined
			}
			// console.log(categorys)
			for (let item of  mergecategorys){
				let indexdata=d3.groups(categorys.get(item) , d => d.stops.length)
				// console.log(indexdata)
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
				while(json[index] !== undefined && json[item].productcategory === json[index].productcategory){
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
		},
		mouse(value){
			const vm = this
			if(value.mouse===0){
				d3.select(`#id${value.upid}`)
					.attr("stroke-width", this.highLightStrokeWidth)
					.selectAll("rect")
					.attr("stroke", "black");
				d3.select(`#miniBar${value.upid}`)
					.attr("fill", d=>  d3.color(this.trainGroupStyle(d)).darker(1))
			}else{
				d3.select(`#id${value.upid}`)
					.attr("stroke-width", d => { return vm.defaultStrokeWidth(d.tgtplatethickness2) })
					.selectAll("rect")
					.attr("stroke", "none");
				d3.select(`#miniBar${value.upid}`)
					.attr("fill", d=>  this.trainGroupStyle(d))
			}
		},
		renderChart(value1, value2, value3){
			this.$nextTick(() => {
				this.isMerge = value1
				this.minrange = value2
				this.minconflict  =  value3
				if(this.data !== undefined && this.station !== undefined){
					this.paintMareyChart(this.data,this.station, this.changeColor, this.brushData)
				}
			})

		}
	},
	mounted() {
	},
}
</script>

<style>
</style>
