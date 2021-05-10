<template>
	<div :id="menuId" style="height: 100%"></div>
	<!-- <div :id="menuId" style="height: 100%; overflow-y: scroll;overflow-x: hidden;"></div> -->
</template>

<script>
import * as d3 from 'd3';
import { Delaunay } from 'd3-delaunay';
import util from './util.js';
import { mapGetters, mapMutations} from 'vuex'
export default {
	data() {
		return {
			menuId: 'marey',
			categoryColors: util.categoryColor,
			labelColors: util.labelColor, // [bad, good]
			labelColorsFunc: util.labelColorFunc,
			svg: undefined,
			trainSelectedList: [],
			trainGroupStyle: undefined,
			changeColor: true,
			data: undefined,
			station: undefined,
			highLightStrokeWidth : 2,
			defaultStrokeWidth : undefined,
			minrange: 10,
			minconflict: 4,
			isMerge: true,
			processColor: util.processColor,
			brushData: undefined,
			initialBrushXSelection : undefined
		}
	},
	methods: {
		...mapMutations([
			"hightLight"
		]),
		paintPre(alldata, stationsData, changeColor, brushData){
			alldata  = this.deepCopy(alldata);
			stationsData = this.deepCopy(stationsData);
			var sampleStaions = stationsData.slice(0, 7),
				collstation = stationsData.slice(-3),
				rollStation = [ "RMF3", "RML3", "RMEnd","FMStart", "FMF3", "FML3", "FMEnd"],
				fmindex = [7, 8, 9, 10, 11 , 12  ,13],
				ccindex = [-3, -2, -1];
			for(let i in rollStation){
				sampleStaions.push({
					distance: sampleStaions.slice(-1)[0].distance + 40,
					key: "020" + i,
					name: rollStation[i],
					zone: "2"
				})
			}
			for(let i in collstation){
				collstation[i].distance = sampleStaions.slice(-1)[0].distance + 40
				sampleStaions.push(collstation[i])
			}
			for(let item in alldata){
				let rm = alldata[item].totalpassesrm,
					datastops = alldata[item].stops,
					heatstops = alldata[item].stops.slice(0, 7),
					fm = alldata[item].totalpassesfm,
					fmtime = [ 7  +  3, 7  + rm -3 , 7  +  rm  , 7 + rm + 1, 7 + rm + 3, 7 + rm + fm - 3, 7 + rm + fm],
					coolstops = (+datastops.slice(-1)[0].station.zone) === 3 ? true : false;		//if cool stops exist
				// heatstops.push({
				// 	realTime: datastops[7 + rm].realTime,
				// 	station: sampleStaions[7],
				// 	time: datastops[7 + rm].time,
				// })
				for(let j in fmindex){
					heatstops.push({
						realTime: datastops[fmtime[j]].realTime,
						station: sampleStaions[fmindex[j]],
						time: datastops[fmtime[j]].time,
					})
				}
				if(coolstops){
					for(let j in ccindex){
						heatstops.push({
							realTime: datastops.slice(ccindex[j])[0].realTime,
							station: sampleStaions.slice(ccindex[j])[0],
							time: datastops.slice(ccindex[j])[0].time
						})
					}
				}else{
					for(let j in ccindex){
						heatstops.push({
							realTime: heatstops.slice(-1)[0].realTime,
							station: sampleStaions.slice(ccindex[j])[0],
							time: heatstops.slice(-1)[0].time,
						})
					}
				}
				alldata[item].stops = heatstops
			}
			this.initialBrushXSelection = undefined
			this.paintMareyChart(alldata, sampleStaions, changeColor, brushData)
		},
		paintMareyChart(alldata, stationsData, changeColor, brushData) {
		this.data = this.deepCopy(alldata), this.station = this.deepCopy(stationsData),this.brushData = brushData
		var stopsTime = d3.map(alldata, d => {
			let arr = d3.pairs(d.stops, (a,b) => new Date(b.realTime).getTime() - new Date(a.realTime).getTime())
			arr.upid = d.upid
			return arr
		}),
		timebins = stopsTime[0].map((d, i) => {
			return d3.bin().thresholds(20)(d3.map(stopsTime, (e,f) => e[i]))
		});
		const brushUCL = d3.group(brushData, d => d.upid),
			dataUCL = d3.group(alldata, d => d.upid),
			allupid = d3.map(alldata, d => d.upid),	//total upid
			allDetail = d3.map(allupid, d  => {
				let arr = brushUCL.get(d)[0]
				return {
					thickness : arr.platedata[0][5],
					width : arr.platedata[0][6],
					length : arr.platedata[0][7],
					good :	arr.good_plate_num,
					bad : arr.bad_plate_num,
					num : arr.same_cate_plate_num
				}
			}),		//total platedata
			allmaxxen = {	//total max
				width : d3.max(allDetail, d => d.width),
				thickness : d3.max(allDetail, d => d.thickness),
				length : d3.max(allDetail, d => d.length),
				num : d3.max(allDetail, d => d.num),
				good : d3.max(allDetail, d => d.good),
				bad : d3.max(allDetail, d => d.bad),
				percent : d3.max(allDetail, d => d.good/d.num)
			},
			allminxen = {	//total max
				width : d3.min(allDetail, d => d.width),
				thickness : d3.min(allDetail, d => d.thickness),
				length : d3.min(allDetail, d => d.length),
				num : d3.min(allDetail, d => d.num),
				good : d3.min(allDetail, d => d.good),
				bad : d3.min(allDetail, d => d.bad),
				percent : d3.min(allDetail, d => d.good/d.num)
			},
			rectlength = 40,	//tag length
			allScale = {	//total scale
				width : d3.scaleLinear().domain([allminxen.width , allmaxxen.width]).range([0, rectlength]),
				length : d3.scaleLinear().domain([allminxen.length , allmaxxen.length]).range([0, rectlength]),
				thickness : d3.scaleLinear().domain([allminxen.thickness , allmaxxen.thickness]).range([0, rectlength]),
				percent : d3.scaleLinear().domain([0, 1]).range([0, rectlength]),
				num : d3.scaleLinear().domain([allminxen.num , allmaxxen.num]).range([0, 200])
			};
		this.trainSelectedList = []; // 2019-5-16 23:29:30 清空选择列表
		var vm = this;
		this.changeColor = changeColor
		this.trainGroupStyle = this.changeColor ?(  d => d.flag === 0 ? vm.labelColors[0] : vm.labelColors[1]) :( d => vm.categoryColors(d.productcategory));
		var stationcolor = this.processColor;
		// data

		var data = alldata
		var width = document.getElementById(this.menuId).offsetWidth;
		const mainHeight = document.getElementById(this.menuId).offsetHeight;
		var stations = stationsData
		var stops = d3.merge(data.map(d => d.stops.map(s => ({ train: d, stop: s }))))
		var statname = d3.map(stations, d => d.name),
			flagSort = arr => d3.sort(d3.map(arr, d => d.upid), d => -dataUCL.get(d)[0].flag);

		// chart
		var defaultStrokeWidth = d3.scaleLinear()
			.domain([0.006, 0.16])
			.range([0.5, 1.2])
		this.defaultStrokeWidth = defaultStrokeWidth
		var highLightStrokeWidth = this.highLightStrokeWidth
		let margin = ({ top: 50, right: 70, bottom: 0, left: 100 }),
			mareylength = width - 7.6 * margin.right,
			mareyEntry = 2.6 * margin.left,
			coreX = mareyEntry * 0.55,
			mareyDistance = 1.8 * margin.top;
		var x = d3.scaleLinear()
			.domain(d3.extent(stations, d => d.distance))
			.range([ mareyEntry , mareylength ])

		// zpj 2019-4-15 20:02:15
		var minDate = data[0].stops[0].time,
			maxDate = data.slice(-1)[0].stops.slice(-1)[0].time;
		var unitHeight = 300;
		var unitPerTime = 3.5;
		const timeHeightScale = unitHeight / (60 * 60 * 1000 * unitPerTime) // 单位高度 时间跨度x小时
		// var height = document.getElementById(this.menuId).offsetHeight
		// console.log((new Date(maxDate).getTime() - new Date(minDate).getTime()) * timeHeightScale)
		var height = (new Date(maxDate).getTime() - new Date(minDate).getTime()) * timeHeightScale
		var y = d3.scaleTime()
			.domain([new Date(minDate), new Date(maxDate)])
			.range([mareyDistance, height - margin.bottom])
		var yScale = d => y(new Date(d.stops.slice(-1)[0].time))

		var line = d3.line()
			.x(d => x(d.station.distance))
			.y(d => y(new Date(d.time)))

		var voronoi = Delaunay
			.from(stops, d => x(d.stop.station.distance), d => y(new Date(d.stop.time)))
			.voronoi([mareyEntry, mareyDistance, mareylength, mareyDistance + height])

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

		//init()
		timebins = timebins.map(d => {
			let arr1 = [], arr2 = [];
			if(d.length === 1) {
				d[0].length = 0
				arr1.x0 = 1,arr1.x1 = 1;
				d.push(arr1)
			}else{
				arr1.x0 = 0,arr1.x1 = 0;
				arr2.x0 = d[d.length - 1].x1, arr2.x1 = d[d.length - 1].x1
				d.unshift(arr1)
				d.push(arr2)
			}
			return d
		})
		const labellength =  mareylength - (mareyEntry),
				timelength = labellength / (stations.length - 1),
				labelRect = (timelength) / 1.2,
				rectDistance = (timelength - labelRect)/2,
				binxScale = timebins.map(d => 
					d3.scaleLinear()
					.domain([d[0].x0, d[d.length - 1].x1])
					.range([5, labelRect - 5])
				),
				binYScale = timebins.map(d => 
					d3.scaleLinear()
					.domain([0, d3.max(d, e => e.length)])
					.range([0, mareyDistance - margin.top - 10])
				),
				labelwidth = (labelRect) / 1.414,
				rectwidth = 60,
				polygonlength = (width - 1.5 * margin.right - (mareyEntry))/1.414  +  labelwidth + 3,
				axisG = svg.append("g").attr("class", "axisG");
		var timedistance = g => g
				.selectAll("g")
				.data(stations.slice(0, -1))
				.join("g")
				.attr("transform", d => `translate(${[x(d.distance) + rectDistance, mareyDistance - 1]})`)
				.call(g => g.append("rect")
						.attr("y", margin.top - mareyDistance)
						.attr("fill", (d,i) => d3.color(i < 6 ? stationcolor [0] : ( i> stations.length - 5 ? stationcolor [2] : stationcolor [1])))
						.attr("opacity", 0.6)
						.attr("stroke", (d,i) => d3.color(i < 6 ? stationcolor [0] : ( i> stations.length - 5 ? stationcolor [2] : stationcolor [1])))
						.attr("stroke-width", 1)
						.attr("width", labelRect)
						.attr("height", mareyDistance - margin.top)
						.attr("filter","url(#shadow-card)"))
		var xAxis = g => g
				.style("font", "13px DIN")
				.selectAll("g")
				.data(stations.filter((d,i) => i !== stations.length - 4))
				.join("g")
				.attr("transform", (d, i) => i < stations.length - 4 ? `translate(${x(d.distance)+labelwidth + rectDistance},-2)` : `translate(${x(d.distance - 40)+labelwidth + rectDistance},-2)`)
				.call(g => g.append("polygon")
					.attr("transform", `translate(${-labelwidth} , ${margin.top + 0}) rotate(-45)`)
					.attr("points", `0, 0  ${labelwidth},${labelwidth}  110 , ${labelwidth}  ${110 - labelwidth}, 0`)// .attr("points", "0, 0  17, 17  110 , 17  93, 0")
					.attr("fill", (d,i) => statname.indexOf(d.name) <6 ? stationcolor [0] : ( statname.indexOf(d.name) > stations.length - 4 ? stationcolor [2] : stationcolor [1]))
					.attr("id", d => "polygon" + d.name)
					.attr("stroke" , "none"))
				.call(g => g.append("text")
					.attr("transform", `translate(-4 ,${margin.top -1.5}) rotate(-45)`)
					.attr("id", d => "station"+d.name)
					.attr("x", 8)
					.attr("dy", "0.25em")
					.attr("font-family" , "DIN")
					.attr("fill", "white")
					.text(d => d.name.replace(/harging/, "harge").replace(/Cc/, "C").replace(/ing/, "").replace(/MPass/, "MP")
						.replace(/arge/, "").replace(/MPStart/, "RMStart").replace(/CDQ/, "DQ").replace(/CAC/, "AC")))
					.on("mouseover", statOver)
					.on("mouseout", statOut);
		var xRect = g => g.append("polygon")
				.attr("transform", `translate(${mareyEntry - labelwidth/2 - 6} ,${margin.top -1.5}) rotate(-45)`)
				.attr("id", "rectxLine")
				.attr("points", `0, 0  ${polygonlength},${polygonlength} ${112 - labelwidth + polygonlength}, ${polygonlength}  ${112 - labelwidth}, 0`)
				.attr("fill", "none")
				.attr("stroke", "#c4c4c4")
				.attr("stroke-width", 0.15)
				.attr("filter","url(#shadow-rect)")
		axisG.append("g")
				.call(xRect)
				.call(xAxis);
		axisG.append("g")
			.call(timedistance);
		for(let bin in  stations.slice(0, -1)){
			axisG.append("g")
				.attr("transform", `translate(${[x(stations[bin].distance), mareyDistance - 1]})`)
				.selectAll(".binRect").data(timebins[bin]).join("rect")
					.attr("class", `binRect${bin}`)
					.attr("x", d => binxScale[bin](d.x0) + 1)
					.attr("fill", "#b9c6cd")
					.attr("stroke", "#aaa")
					.attr("stroke-width", 0.25)
					.attr("width", d =>  binxScale[bin](d.x1) - binxScale[bin](d.x0))
					.attr("y", d => - binYScale[bin](d.length))
					.attr("height", d => binYScale[bin](d.length))
		}
		function statOver (e,m){
			var i = d3.select(this).attr("i")
			d3.select("#polygon" + m.name).attr("fill", (d,i) => d3.color(statname.indexOf(d.name) <6 ? stationcolor [0] : ( statname.indexOf(d.name) > stations.length - 4 ? stationcolor [2] : stationcolor [1])).darker(0.2))
			d3.selectAll(`.mline${i}`).attr("stroke-width" , 2.5)
			d3.selectAll(`.mline${i++}`).attr("stroke-width" , 2.5)
			// d3.select("#line" + m.name).attr("stroke-width" , 2.5)
			d3.select("#station" + m.name).attr("font-weight", "bold")
		}
		function statOut (e,m){
			var i = d3.select(this).attr("i")
			d3.select("#polygon" + m.name).attr("fill", (d,i) => statname.indexOf(d.name) <6 ? stationcolor [0] : ( statname.indexOf(d.name) > stations.length - 4 ? stationcolor [2] : stationcolor [1]))
			d3.selectAll(`.mline${i}`).attr("stroke-width" , 0.5)
			d3.selectAll(`.mline${i++}`).attr("stroke-width" , 0.5)
			d3.select("#station" + m.name).attr("font-weight", "normal")
		}
		function mouseoverUCL(e, d){
			e.preventDefault()
			e.stopPropagation()
			let uclid = d3.select(this).attr("upid")
			mouseoverLine(uclid)
			let upiddata = dataUCL.get(uclid)[0]
			const tooltip = svg.append("g")
				.attr("class", "UCLtooltip")
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
			let toopcolor = vm.trainGroupStyle(upiddata)
			tooltip
				.style("display", null)
				.attr("fill", "white");
				line1.text(`upid: ${upiddata.upid}`);
				// line2.text(d.stop.station.name);productcategory
				line2.text(`category: ${upiddata.productcategory}`);
				// line3.text(`time: ${upiddata.toc.toLocaleString(undefined, { hour: "numeric", minute: "numeric" })}`);
				path
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
			tooltip.attr("transform", `translate(${[e.offsetX - 75, e.offsetY + 35]})`)
		}
		function mouseoverLine(uclid){
			const flag = dataUCL.get(uclid)[0].flag;
			d3.select("#id"+ uclid)
				.attr("stroke-width", highLightStrokeWidth)
				.selectAll("rect")
				.attr("stroke", "black");
			d3.selectAll(".Qcircle"+ uclid)
				.attr("r", 3.5);
			d3.selectAll(".T2circle"+ uclid)
				.attr("r", 3.5)
				.style("visibility", "visible");
			d3.selectAll(".startline"+ uclid)
				.style("visibility", flag == 0 ? "visible" :  "hidden");
		}
		function mouseoutUCL(e, d){
			e.preventDefault()
			e.stopPropagation()
			let uclid = d3.select(this).attr("upid")
			mouseoutLine(uclid)
			d3.select(".UCLtooltip").remove()
		}
		function mouseoutLine(uclid){
			const flag = dataUCL.get(uclid)[0].flag;
			d3.select("#id"+ uclid)
			.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) })
			.selectAll("rect")
			.attr("stroke", "none");
			d3.selectAll(".Qcircle"+ uclid)
				.attr("r", (d, i) => flag == 0 ? 2 : 0.5);
			d3.selectAll(".T2circle"+ uclid)
				.attr("r", (d, i) => flag == 0 ? 2 : 0.5);
			d3.selectAll(".startline"+ uclid)
				.style("visibility",  "hidden");
			for(let m in stopsTime){		//reset binRect
				svg.selectAll(`.binRect${m}`)
					.attr("fill", "#b9c6cd")
			}
		}
		function initMerge(){
			svg.selectAll(".lineRect")
				.attr("stroke-width", 1)
				.attr("stroke-opacity", 0.4)
			svg.selectAll(".linkRectMerge")
				.attr("opacity", 0.4)
			// svg.selectAll(".mergerect").attr("opacity", 0.4)
			svg.selectAll(".mergeG").attr("opacity", 1)
		}
		function mouseMerge(item){
			svg.select("#lineRect"+item)
				.attr("stroke-width", 2)
				.attr("stroke-opacity", 0.8)
			svg.select(`#linkRectMerge${item}`)
				.attr("opacity", 0.8)
			// svg.select("#mergerect"+item).attr("opacity", 0.4)
			// svg.selectAll(".mergeG").attr("opacity", 0.4)
			svg.selectAll(`#mergeG${item}`).attr("opacity", 1)
		}
		function flatdata(array1, array2, array3){
			for (let i in array1){
				for(let j in array2){
					array3[array2[j]].push(brushUCL.get(array1[i].upid)[0][array2[j]])
				}
			}
		}

		var mergeresult = this.merge(data , stations)
		var filterdata = this.deepCopy(data)
		for (let item in mergeresult){
			filterdata.splice(...mergeresult[mergeresult.length-item-1]["index"])
		}
		
		var merge = d3.map(d3.merge(d3.map(mergeresult , d => d.merge)) , d =>d.upid),
			remainId =allupid.filter(d => merge.indexOf(d) === -1),
			select = d3.map(d3.merge(d3.map(mergeresult , d => d.select)) , d =>d.upid);
		var filter = d3.filter(merge , d => select.indexOf(d) === -1 )
		var indexname = ["fuTotalTimeAfter" , "mtotalTime" , "ccTotalTime"]

		var renderG = this.svg.append("g")
		var mergeClickValue = [];	//Click List
		function render(){
			renderG !== undefined && renderG.remove()
			renderG = vm.svg.append("g")
			//add Axis			
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
			filtershadow.append("feDropShadow")
				.attr("dx",0)
				.attr("dy", 0)
				.attr("stdDeviation", 10)
				.attr("flood-color", "#bfbdbd")

			renderG.append("g")
				.call(g => g.append("rect")
					.attr("x" , mareyEntry - labelwidth + 10)
					.attr("y", margin.top)
					.style("fill","white")
					.attr("width", mareylength- mareyEntry + 8 + labelwidth)
					.attr("height", height - margin.top - margin.bottom))
				.call(g => g.append("rect")
					.attr("x" , mareyEntry - labelwidth + 10)
					.attr("class", "shadow_rect")
					.attr("y", margin.top)
					.style("fill","none")
					.attr("width", mareylength- mareyEntry + 8 + labelwidth)
					.attr("height", height - margin.top - margin.bottom))
					.attr("filter","url(#shadow-card)")
			renderG.append("g")
				.call(g => g.append("rect")
					.attr("x" , mareylength + 35)
					.attr("y", mareyDistance)
					.style("fill","white")
					.attr("width", 420)
					.attr("height", height - mareyDistance - margin.bottom))
				.call(g => g.append("rect")
					.attr("x" , mareylength + 35)
					.attr("class", "shadow_rect")
					.attr("y", mareyDistance)
					.style("fill","none")
					.attr("width", 420)
					.attr("height", height - mareyDistance - margin.bottom))
					.attr("filter","url(#shadow-card)")
			renderG.append("g")
				.call(g => g.append("rect")
					.attr("x" , coreX - 1.8 * 65)
					// .attr("y", mareyDistance)
					.style("fill","white")
					.attr("width", 65  * 3)
					// .attr("height", height - mareyDistance - margin.bottom))
					.attr("height", height  - margin.bottom))
				.call(g => g.append("rect")
					.attr("x" , coreX - 1.8 * 65)
					.attr("class", "shadow_rect")
					.style("fill","none")
					.attr("width", 65 + coreX - 20)
					.attr("height", height - margin.bottom))
					.attr("filter","url(#shadow-card)")
			renderG.append("g")
				.attr("class", "axisrect")
				.call(g => g.append("rect")
					.attr("class", "background")
					.attr("y", 0)
					.attr("x", mareyEntry - 15)
					.style("fill","white")
					.attr("width", width - mareyEntry + 15)
					.attr("height", mareyDistance))


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
					.attr("class", "processline")
					.attr("y2", height - margin.bottom + 3)
					.attr("class", (d,i) => `mline${i}`)
					// .attr("id", d => "line" + d.name)
					.attr("stroke-width" , 0.5)
					// .attr("stroke-dasharray", "1.5,2")
					.attr("opacity" , 0.4)
					.attr("stroke" , (d , i) => d3.color(i <6 ? stationcolor [0] : ( i> stations.length - 5 ? stationcolor [2] : stationcolor [1]))))

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
			var qualityData = [],
				positionData = [];


			for (let item in mergeresult){
				var mergeG = renderG.append("g")
					.attr("class", `mergeG`)
					.attr("id", `mergeG${item}`)
				if(!vm.isMerge) break
				var xaxlength = 32,
					circleLength = 1.5 * xaxlength,
					mergeItem = mergeresult[item]["merge"],	//merge Plate
					mergeSelect = mergeresult[item]["select"],	//select Plate
					mergeId = d3.map(mergeItem, d => d.upid),
					selectId = d3.map(mergeSelect, d => d.upid);
				// var mergeindex = mergeresult[item]["data"]

				var quality = d3.sort(d3.groups(mergeItem, d => d.flag), d=> d[1].length),
					mergeArea = d3.area()
						.x((d, i) => x(d.distance))
						.y0((d, i) => y(new Date(mergeItem[0].stops[i].time)))
						.y1((d, i) => y(new Date(mergeItem[mergeItem.length - 1].stops[i].time))),
					pathColor = vm.changeColor ?  (quality[1] !== undefined ? vm.labelColors[quality[1][0]] : vm.labelColors[quality[0][0]]) : vm.trainGroupStyle(mergeItem[0]);
				mergeG.append("path")
					.datum(stations)
					.attr("class", "mergerect")
					.attr("id", "mergerect"+item)
					.attr("index", item)
					.attr("fill", pathColor)
					.attr("d", mergeArea)
					.attr("opacity" , 0.4)
				if(vm.changeColor && quality[1] !== undefined){
					mergeG.append("g")
					.attr("fill", "white")
					.selectAll(`.select g`+item)
					.data(quality[1] !== undefined ? quality[0][1] : [])
					.join("g")
					.style("color", vm.trainGroupStyle)
					.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) } )
					.attr("id", d => ("id" + d.upid))
					.call(g => g.append("path")
						.attr("fill", "none")
						.attr("stroke", "currentColor")
						.attr("d", d => line(d.stops)))
					qualityData.push(...d3.map(quality[0][1], d=> d.upid))
				}
				mergeG.append("g")
					.attr("fill", "white")
					.selectAll(`.select g`+item)
					.data(mergeSelect)
					.join("g")
					.style("color", vm.trainGroupStyle)
					.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) } )
					.attr("id", d => ("id" + d.upid))
					.call(g => g.append("path")
						.attr("fill", "none")
						.attr("stroke", "currentColor")
						.attr("d", d => line(d.stops)))
				
				var categorysdata = d3.group(data , d => d.productcategory).get(mergeItem[0].productcategory),
					lineposition = [],
					lineScale = [],
					circleRy = (y((new Date(mergeItem[mergeItem.length - 1].stops[0].time))) + y((new Date(mergeItem[0].stops[0].time)))) /2,
					position = [ coreX , circleRy],
					badupid = d3.map(d3.filter(mergeItem, d => d.flag === 0), d => d.upid),
					newPosition
					// selectId
					;
					// Array.from(new Set(array))
					if(circleRy - rectwidth >=-20 && circleRy + rectwidth < 650){
						if(positionData.length === 0){
							newPosition = Math.abs(70 + 10 + rectwidth - circleRy) < 15 ? [coreX, 70 + 10 + rectwidth] : position
						}else{
							var prev = positionData[positionData.length - 1][1][1]
							if(prev - rectwidth >= -20 && prev + rectwidth < 650){
								newPosition = [coreX, positionData[positionData.length - 1][1][1] + 2 * rectwidth + 14 ]
							}else{
								newPosition = Math.abs(70 + 10 + rectwidth - circleRy) < 15 ? [coreX, 70 + 14 + rectwidth] : position
							}
						}
						if(positionData.length !== 0){
							newPosition = [coreX, newPosition[1] - rectwidth < positionData[positionData.length - 1][1][1]  + rectwidth + 5 ?  positionData[positionData.length - 1][1][1] + 2 * rectwidth + 14 : newPosition[1]]
						}
					}else{
						var newPosition = position
					}
					positionData.push([[...position], [...newPosition]])
					position = newPosition
				const rectG = mergeG
					.append("g")
					.attr("index", item)
					.on("click", pathClick)
					.on("mouseout",pathOut)
					.on("mouseover",pathOver)
				var LinkG = rectG.append("g"),		//Rect LineTo Merge
					pathHeight = (y((new Date(mergeItem[mergeItem.length - 1].stops[0].time)))- y((new Date(mergeItem[0].stops[0].time))));
				LinkG.append("path")
					.attr("class", "linkRectMerge")
					.attr("id", `linkRectMerge${item}`)
					.attr("d", d3.linkHorizontal()({
						source: [position[0] + rectwidth, position[1]],
						target: [mareyEntry - 10, (circleRy > 90 - pathHeight/2 && circleRy < 90 + pathHeight / 2) ? (circleRy + pathHeight/2 - 90)/2 + 90 : circleRy]
					}))
					.attr("stroke", pathColor)
					.attr("opacity", 0.4)
					.attr("fill", "none")
					.attr("stroke-width", 2)
				LinkG.append("rect")
					.attr("transform", `translate(${[mareyEntry - 10, y((new Date(mergeItem[0].stops[0].time)))]})`)
					.attr("width", 2)
					.attr("height", pathHeight)
					.attr("fill", pathColor)
					.attr("opacity", 0.4)
				rectG.attr("visibility",  circleRy < 90 - pathHeight/2 ? "hidden" : "visible")
				const mergeupid = d3.map(mergeresult[item].merge, d => d.upid),		//merge upid
					mergeDetail = d3.map(mergeupid, d  => {
						let arr = brushUCL.get(d)[0]
						return {
							thickness : arr.platedata[0][5],
							width : arr.platedata[0][6],
							length : arr.platedata[0][7],
							good :	arr.good_plate_num,
							bad : arr.bad_plate_num,
							num : arr.same_cate_plate_num
						}
					}),		//merge platedata
					mergemixen = {	//merge max
						width : d3.min(mergeDetail, d => d.width),
						thickness : d3.min(mergeDetail, d => d.thickness),
						length : d3.min(mergeDetail, d => d.length),
						num : d3.mean(mergeDetail, d => d.num),
						good : d3.mean(mergeDetail, d => d.good),
						bad : d3.mean(mergeDetail, d => d.bad),
						percent : d3.mean(mergeDetail, d => d.good/d.num)
					},
					mergemaxen = {	//merge max
						width : d3.max(mergeDetail, d => d.width),
						thickness : d3.max(mergeDetail, d => d.thickness),
						length : d3.max(mergeDetail, d => d.length),
						num : d3.mean(mergeDetail, d => d.num),
						good : d3.mean(mergeDetail, d => d.good),
						bad : d3.mean(mergeDetail, d => d.bad),
						percent : d3.filter(mergeItem, d => d.flag == 1).length/mergeItem.length
						// d3.mean(mergeDetail, d => d.good/d.num)
					};
				const labelLength = rectwidth/5,	//tag distance
					labelColor = "#cbdcea";
				var lineRect = g => g.append("g")
					.attr("transform", `translate(${[position[0]-rectwidth, position[1]-rectwidth]})`)
					.call(g => g.append("rect")
						.attr("transform", `translate(${[-rectlength - 2, (labelLength + 10) - 2]})`)
						.attr("stroke", labelColor)
						.attr("stroke-width", 2)
						.attr("height", labelLength/2 + 4)
						.attr("width", rectlength + 4)
						.attr("fill", "none"))
					.call(g => g.append("rect")
						.attr("transform", `translate(${[-allScale.width(mergemaxen.width), (labelLength + 10)]})`)
						.attr("stroke", labelColor)
						.attr("stroke-width", 2.5)
						.attr("height", labelLength/2)
						.attr("width", allScale.width(mergemixen.width) + 5)
						.attr("fill", labelColor))
					.call(g => g.append("rect")
						.attr("transform", `translate(${[-rectlength - 2, (labelLength + 10) * 2 - 2]})`)
						.attr("stroke", labelColor)
						.attr("stroke-width", 2)
						.attr("height", labelLength/2 + 4)
						.attr("width", rectlength + 4)
						.attr("fill", "none"))
					.call(g => g.append("rect")
						.attr("transform", `translate(${[-allScale.length(mergemaxen.length), (labelLength + 10) * 2]})`)
						// .attr("srtoke", "none")
						.attr("stroke", labelColor)
						.attr("stroke-width", 2.5)
						.attr("height", labelLength/2)
						.attr("width", allScale.length(mergemixen.length) + 5)
						.attr("fill", labelColor))
					.call(g => g.append("rect")
						.attr("transform", `translate(${[-rectlength - 2, (labelLength + 10) * 3 - 2]})`)
						.attr("stroke", labelColor)
						.attr("stroke-width", 2.5)
						.attr("height", labelLength/2 + 4)
						.attr("width", rectlength + 4)
						.attr("fill", "none"))
					.call(g => g.append("rect")
						.attr("transform", `translate(${[-allScale.thickness(mergemaxen.thickness)-5, (labelLength + 10) * 3]})`)
						// .attr("srtoke", "none")
						.attr("stroke", labelColor)
						.attr("stroke-width", 2)
						.attr("height", labelLength/2)
						.attr("width", allScale.thickness(mergemixen.thickness) + 10)
						.attr("fill", labelColor))
					.call(g => g.append("rect")
						.attr("transform", `translate(${[-rectlength - 2, (labelLength + 10) * 4 - 2]})`)
						.attr("stroke", labelColor)
						.attr("stroke-width", 2.5)
						.attr("height", labelLength/2 + 4)
						.attr("width", rectlength + 4)
						.attr("fill", "none"))
					.call(g => g.append("rect")
						.attr("transform", `translate(${[-allScale.percent(mergemaxen.percent), (labelLength + 10) * 4]})`)
						.attr("stroke", labelColor)
						.attr("stroke-width", 2)
						.attr("height", labelLength/2)
						.attr("width", allScale.percent(mergemaxen.percent))
						.attr("fill", labelColor))
					.call(g => g.append("rect")
						// .attr("stroke", "#c4c4c4")
						.attr("stroke", pathColor)
						.attr("stroke-width", 1)
						.attr("stroke-opacity", 0.4)
						.attr("fill", "white")
						.attr("class", "lineRect")
						.attr("id", "lineRect"+item)
						.attr("width", 2*rectwidth)
						.attr("height", 2*rectwidth)
						.attr("filter","url(#shadow-card)"))
				rectG.call(lineRect)
				for (let i in indexname){
					// const categorys = d3.group(data , d => d.productcategory)[]
					let linedata = d3.map(categorysdata , d => d[indexname[i]]).sort()
					let meandata = d3.mean(d3.map(mergeItem , d => d[indexname[i]]).sort())
					
					
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
						.domain([maxmin[0] * 0.5 , maxmin[1] * 1.1]).nice()
						.range([0, xaxlength]);
					const link = [d3.quantile(linedata, 0.1), d3.quantile(linedata, 0.9)]
					const text = ["H", "R", "C"][i];
					rectG.append("g").selectAll(".processPath")
						.data(link).join("g")
						.attr("transform", `rotate(${(+i - 1)*120 - 30} ,${position}) `)
						.attr("class", "processPath")
						.call(g => g.append("line")
							.attr("stroke", d3.color(stationcolor[i]).darker(0.5))
							.attr("transform", (d, i) =>`translate( ${[ position[0] + xline(d) + (i === 0 ? -5 : 5), position[1] ]})`  )
							.attr("stroke-width", 1.5)
							.attr("y1", -3)
							.attr("y2", 3))
						rectG.append("g")
						.attr("transform", `rotate(${(+i - 1)*120 - 30} ,${position}) `)
						.attr("class", "processPath")
						.call(g => g.append("line")
							.attr("stroke", d3.color(stationcolor[i]).darker(0.5))
							.attr("transform", `translate( ${position })`  )
							.attr("stroke-width", 1.5)
							.attr("x1", xline(link[0]) - 5)
							.attr("x2", xline(link[1]) + 5))
						.call(g => g.append("circle")
							.attr("transform", `translate( ${[position[0]  +(xline(link[0]) + xline(link[1]))/2 , position[1]]})`  )
							.attr("stroke", d3.color(stationcolor[i]).darker(0.5))
							.attr("fill", d3.color(stationcolor[i]).brighter(0.1))
							.attr("cy", 0)
							.attr("r" , 2.5))
						rectG.append("g")
							.attr("transform", `translate( ${position}) rotate( ${ (i- 1) * 120  -45} )`  )
							.call(g => g.append("g")
								.attr("transform", `translate(${xaxlength - (+i !== 0 ? 9 : 0)}, 0)`)
								.append("text")
								.attr("transform", `rotate( ${ -(i- 1) * 120  + 45} )`)
								.style("font-family", "DIN")
								.attr("fill", d3.color(stationcolor[i]).darker(0.6))
								.attr("font-size", "9px")
								.text(text))
					lineposition.push(meandata)
					lineScale.push(xline)
				}
				const pathindex = ["Q", "QUCL", "T2", "T2UCL1"],
					pathdata = {
						Q: [],
						QUCL: [],
						T2: [],
						T2UCL1: [],
						time: []
					};
				for (let i in mergeItem){
					for(let j in pathindex){
						pathdata[pathindex[j]].push(brushUCL.get(mergeItem[i].upid)[0][pathindex[j]])
					}
					pathdata["time"].push(new Date(mergeItem[i].stops.slice(-1)[0].time))
				}
				var allQ = [...pathdata.Q, ...pathdata.QUCL],
					allT2 = [...pathdata.T2, ...pathdata.T2UCL1];
				var QUCLMax = d3.max(allQ),
					T2UCLMax = d3.max(allT2),
					QUCLMin = d3.min(allQ),
					T2UCLMin = d3.min(allT2),
					minmax = [[QUCLMin, QUCLMax], [T2UCLMin, T2UCLMax]],
					rectheight = (d, i) => i !== pathdata.T2.length-1 ? yScale(mergeItem[i + 1]) - yScale(mergeItem[i]) : yScale(mergeItem[i]) - yScale(mergeItem[i - 1]);
				for(let pi =0 ; pi < 2 ; pi ++){
					var k1 = pathdata[pathindex[2 * pi]],
						k2 = pathdata[pathindex[2 * pi + 1]]
					for(let i in k1){
						k1[i] = minmax[pi][1] === minmax[pi][0]  ? 0 : (k1[i] - minmax[pi][0])/(minmax[pi][1] - minmax[pi][0])
						k2[i] = minmax[pi][1] === minmax[pi][0]  ? 0 : (k2[i] - minmax[pi][0])/(minmax[pi][1] - minmax[pi][0])
					}
				}
				QUCLMax = d3.max([...pathdata.Q, ...pathdata.QUCL])
				T2UCLMax = d3.max([...pathdata.T2, ...pathdata.T2UCL1])
				const QScale = d3.scaleLinear()
					.domain([-1, QUCLMax])
					.range([0, 65]);
				const T2Scale = d3.scaleLinear()
						.domain( [-1 , T2UCLMax])
						.range([0, 65]);
				const  Qline  = d3.line()
						.x(d => - QScale(d))
						.y((d,i) => +y(pathdata["time"][i]) + rectheight(undefined, i)/2)
						.curve(d3.curveLinear);
				const  T2line  = d3.line()
						.x(d => T2Scale(d))
						.y((d,i) => +y(pathdata["time"][i]) + rectheight(undefined, i)/2)
						.curve(d3.curveLinear);
				const QLineData = [[0, yScale(mergeItem[0])]], T2LineData = [[0, yScale(mergeItem[0])]]
				for(let f in pathdata.Q){
					QLineData.push([- QScale(pathdata.QUCL[f]), yScale(mergeItem[f])])
					QLineData.push([- QScale(pathdata.QUCL[f]), yScale(mergeItem[f]) + rectheight(undefined, +f)])
					T2LineData.push([ T2Scale(pathdata.T2UCL1[f]), yScale(mergeItem[f])])
					T2LineData.push([ T2Scale(pathdata.T2UCL1[f]), yScale(mergeItem[f]) + rectheight(undefined, +f)])
				}
				QLineData.push([0, yScale(mergeItem[mergeItem.length - 1]) + rectheight(undefined, mergeItem.length - 1)])
				T2LineData.push([0, yScale(mergeItem[mergeItem.length - 1]) + rectheight(undefined, mergeItem.length - 1)])
				const QLineness = d3.line()
						.x(d => d[0])
						.y(d => d[1])
						.curve(d3.curveLinearClosed);
				const T2Lineness = d3.line()
						.x(d => d[0])
						.y(d => d[1])
						.curve(d3.curveLinearClosed);
				// const areaT2UCL = d3.area()
				// 	.curve(d3.curveBasis)
				// 	.x1(40)
				// 	.x0((d, i) => T2Scale(d))
				// 	.y((d,i) => +y(pathdata["time"][i]));
				var monitorWidth = 360;
				var monitorG = mergeG.append("g")
				monitorG.append("g")
					.attr("transform", `translate(${[mareylength + monitorWidth/3, 0]})`)
					.call(g => g.selectAll(".startline").data(pathdata.T2).join("g")
						.attr("class", (d, i) => "startline" + mergeItem[i].upid)
						.attr("transform", (d, i) =>  `translate(${[0, y(pathdata["time"][i])]})`)
						.attr("stroke", (d, i) => vm.trainGroupStyle(mergeItem[i]))
						.attr("stroke-width", 2)
						.attr("fill", "none")
						.style("visibility", "hidden" )
							.call( g => g.append("line")
								.attr("x2", (d, i) => - QScale(pathdata.Q[i]) - 3.5)
								.attr("x1", (d, i) => -150))
							.call( g => g.append("line")
								.attr("x2", (d, i) => - QScale(pathdata.Q[i]) + 3.5)
								.attr("x1", (d, i) => 100 + T2Scale(pathdata.T2[i]) - 3.5)))
					.call(g => g.selectAll(".Qcircle").data(pathdata.Q).join("g")
							.call(g => g.append("rect")
								.attr("class", (d, i) => "Qrect" + mergeItem[i].upid)
								.attr("y",(d, i) =>  yScale(mergeItem[i]))
								.attr("height",  rectheight)
								.attr("x", (d, i) =>  - QScale(pathdata.QUCL[i]))
								.attr("width", (d, i)  => QScale(pathdata.QUCL[i]))
								.attr("fill", pathColor)
								.attr("opacity", 0.4)
								.attr("upid", (d, i) => mergeItem[i].upid))
							.call(g => g.append("circle")
								.attr("class", (d, i) => "Qcircle" + mergeItem[i].upid)
								.attr("r",  (d, i) => mergeItem[i].flag == 0 ? 2 : 0.5)
								.attr("cy", (d, i) => y(pathdata["time"][i]))
								.style("visibility", (d, i) => mergeItem[i].flag == 0 ? "visible" :  "hidden" )
								.attr("cx", d => - QScale(d))
								.attr("fill", "none")
								.attr("stroke", (d, i) => vm.trainGroupStyle(mergeItem[i]))
								.attr("upid", (d, i) => mergeItem[i].upid)
								.attr("stroke-width", 0.5)
								.attr("r",2)))
					.call(g => g.append("path")
							.attr("fill", "none")
							.attr("class", "QLine")
							.attr("stroke", d3.color(pathColor).darker(1))
							.attr("stroke-width", 1)
							.attr("opacity", 0.8)
							.attr("d", QLineness(QLineData)))
					.call(g => g.append("path")
							.attr("fill", "none")
							.attr("class", "QLine")
							.attr("stroke", d3.color(pathColor).darker(1))
							.attr("stroke-width", 1)
							.attr("opacity", 0.8)
							.attr("d", Qline(pathdata.Q)))
							// .on("mouseover", mouseoverUCL)
							// .on("mouseout", mouseoutUCL)
				monitorG.append("g")
					.attr("transform", `translate(${[mareylength + monitorWidth/3 + 10, 0]})`)	//95
					.call(g => g.selectAll(".T2circle").data(pathdata.T2).join("g")
							.call(g => g.append("circle")
								.attr("class", (d, i) => "T2circle" + mergeItem[i].upid)
								.attr("r",  (d, i) => mergeItem[i].flag == 0 ? 2 : 0.5)
								.attr("cy", (d, i) => y(pathdata["time"][i]))
								.attr("cx", d => T2Scale(d))
								.style("visibility", (d, i) => mergeItem[i].flag == 0 ? "visible" :  "hidden" )
								.attr("fill", "none")
								.attr("stroke", (d, i) => vm.trainGroupStyle(mergeItem[i]))
								.attr("upid", (d, i) => mergeItem[i].upid))
							.call(g => g.append("rect")
									.attr("class", (d, i) => "T2rect" + mergeItem[i].upid)
									.attr("y",(d, i) =>  yScale(mergeItem[i]))
									.attr("height",  rectheight)
									.attr("width", (d, i) => T2Scale(pathdata.T2UCL1[i]))
									.attr("fill", pathColor)
									.attr("opacity", 0.4)
									.attr("upid", (d, i) => mergeItem[i].upid)))
					.call(g => g.append("path")
						.attr("fill", "none")
						.attr("class", "T2Line")
						.attr("stroke", d3.color(pathColor).darker(1))
						.attr("stroke-width", 1)
						.attr("opacity", 0.8)
						.attr("d", T2Lineness(T2LineData)))
					.call(g => g.append("path")
							.attr("fill", "none")
							.attr("class", "QLine")
							.attr("stroke", d3.color(pathColor).darker(1))
							.attr("stroke-width", 1)
							.attr("opacity", 0.8)
							.attr("d", T2line(pathdata.T2)))
				monitorG.append("rect")
					.attr("fill", "#cccccc")
					.attr("transform", `translate(${[mareylength + monitorWidth*2/3 , yScale(mergeItem[0])]})`)
					.attr("width", 100)
					.attr("height", yScale(mergeItem[mergeItem.length - 1]) - yScale(mergeItem[0]))
				const platearc = d3.arc().innerRadius(15).outerRadius(18),
					platedata = [mergemixen.bad, mergemixen.good],
					platepie = d3.pie()
						.padAngle(0.01)
						.value(d => d)
						.startAngle(-Math.PI)
						.endAngle( Math.PI);
				// monitorG.append("g")
				// 	.attr("transform", `translate(${[mareylength + 240, y(pathdata.time[0]) + 18]})`)
				// 	.attr("class", "mergearc")
				// 	.call(g => g.selectAll("path")
				// 		.data(platepie(platedata))
				// 		.join("path")
				// 		.attr("d",platearc)
				// 		.attr("opacity", 0.8)
				// 		.attr("fill", (d, i) => util.labelColor[i]))
				// 	.call(g => g.append("text")
				// 		.attr("stroke", "none")
				// 		.style("font-family", "DIN")
				// 		.attr("fill", util.labelColor[1])
				// 		.attr("font-size", "10px")
				// 		.attr("text-anchor", "middle")
				// 		.attr("dy", "0.5em")
				// 		.text((mergemixen.percent * 100).toFixed(0) + "%"));
			var processindex = [
					"Heat_Q", "Heat_QUCL", "Heat_T2", "Heat_T2UCL",
					"Roll_Q", "Roll_QUCL", "Roll_T2", "Roll_T2UCL",
					"Cool_Q", "Cool_QUCL", "Cool_T2", "Cool_T2UCL"
				],
				// processdata = {Cool_Q: [],Cool_QUCL: [],Cool_T2: [],Cool_T2UCL: [],Heat_Q: [],Heat_QUCL: [],Heat_T2: [],Heat_T2UCL: [],Roll_Q: [],Roll_QUCL: [],Roll_T2: [],Roll_T2UCL: []},
				scaleData = {Cool_Q: [],Cool_QUCL: [],Cool_T2: [],Cool_T2UCL: [],Heat_Q: [],Heat_QUCL: [],Heat_T2: [],Heat_T2UCL: [],Roll_Q: [],Roll_QUCL: [],Roll_T2: [],Roll_T2UCL: []};
				// // var processRemain = [...data.filter(d => mareyDistance - 15 <= yScale(d) && yScale(d)<= mainHeight + 15 && remainId.indexOf(d.upid) !== -1)]
				// // var mergeRemain = mergeresult.filter((d, i)=> {
				// // 	d.merge.map(e => e.mergeSearch = i)
				// // 	if(mareyDistance - 15 <= positionData[i][0][1] && positionData[i][0][1] <= mainHeight + 15)return true
				// // }).map(d => d.merge).flat()
				// flatdata(mergeItem, processindex, scaleData)
				// if(mareyDistance - 15 <= circleRy && circleRy <= mainHeight + 15){
				// 	// for (let item in mergeItem){
				// 	// 	for(let index in processindex){
				// 	// 		scaleData[processindex[index]].push(brushUCL.get(mergeItem[item].upid)[0][processindex[index]])
				// 	// 	}
				// 	// }
				// 	var badlength = 160,goodlength = 50, disrect = 30, startRect = 160, 
				// 		underUCL = d3.scaleLinear()
				// 			.domain( [0, 1])
				// 			.range([startRect + badlength + goodlength + disrect, startRect + badlength + disrect]),
				// 		divisionFunc = (arr1, arr2) => d3.map(arr1, (d,i) => arr2[i] == 0 ?( arr1[i] == 0 ? 0.5 : 1.5) : arr1[i]/arr2[i]),
				// 		division = d3.map(new Array(6), (d,i) => divisionFunc(scaleData[processindex[2*i]], scaleData[processindex[2*i + 1]])),
				// 		UclScale = d3.map(division, (d,i) => {
				// 			return d3.scaleLinear()
				// 				.domain( [1, d3.max(division[i]) > 1 ? d3.max(division[i]) : 2])
				// 				.range([startRect + badlength, startRect])
				// 		});
				// 	var monitorline = (d, i) => {
				// 		var arr = [];
				// 		arr.push([mareylength + 120, yScale(d)])
				// 		for(let j = 0; j < 3; j++){
				// 			arr.push([arr[arr.length - 1][0] + (j == 0 ? 45 : 30), division[2 * j][i] > 1 ? UclScale[2 * j](division[2 * j][i]) : underUCL(division[2 * j][i])])
				// 			arr.push([arr[arr.length - 1][0] + 30, arr[arr.length - 1][1]])
				// 		}
				// 		arr.push([arr[arr.length - 1][0] + 45, yScale(d)])
				// 		return arr
				// 	}
				// 	var monitorPosition = mergeItem.map(monitorline)
				// 	monitorG
				// 		.append("path")
				// 		.attr("fill", pathColor)
				// 		.attr("opacity", 0.4)
				// 		.attr("class", "monitorPath")
				// 		.datum(d3.map(monitorPosition[0], d => d[0]))
				// 		// .attr("stroke-width", 1)
				// 		.attr("d", d3.area()
                //                 .curve(d3.curveLinear)
                //                 .x((d, i) => d)
                //                 .y0((d, i) => d3.min(d3.map(monitorPosition, e => e[i][1])))
                //                 .y1((d, i) => d3.max(d3.map(monitorPosition, e => e[i][1]))))
				// 		// .selectAll("monitorLine")
				// 		// .data(monitorId).join("g")
				// 		// 	.call(g => g.append("path")
				// 		// 		.attr("fill", "none")
				// 		// 		.attr("class", "monitorLine")
				// 		// 		.attr("stroke", d => vm.trainGroupStyle(dataUCL.get(d)[0]))
				// 		// 		.attr("stroke-width", 1)
				// 		// 		.attr("stroke-opacity", 0.4)
				// 		// 		.attr("d", (d, i) => d3.line()
				// 		// 			.x(e => e[0])
				// 		// 			.y(e => e[1])
				// 		// 			.curve(d3.curveLinear)(monitorline(d, i))
				// 		// 			)
				// 		// 		)
				// }
				// var monitorData = [
				// 	// ...mergeRemain,
				// 	...processRemain];
				// var monitorId = d3.map(monitorData, d => d.upid)
				
				// var monitorline = (d, i) => {
				// 	var arr = [];
				// 	arr.push([mareylength + 120, yScale(dataUCL.get(d)[0])])
				// 	for(let j = 0; j < 3; j++){
				// 		arr.push([arr[arr.length - 1][0] + (j == 0 ? 45 : 30), division[2 * j][i] > 1 ? UclScale[2 * j](division[2 * j][i]) : underUCL(division[2 * j][i])])
				// 		arr.push([arr[arr.length - 1][0] + 30, arr[arr.length - 1][1]])
				// 	}
				// 	arr.push([arr[arr.length - 1][0] + 45, yScale(dataUCL.get(d)[0])])
				// 	return arr
				// }
					
				// monitorG.append("g")
				// 	.attr("transform", `translate(${[mareylength + 120, startRect]})`)	//95
				// 	.selectAll(".monitorRect")
				// 	.data(division.filter((d, i) => (i % 2) ==0)).join("g")
				// 		.attr("class", "monitorRect")
				// 		.attr("transform", (d, i) => `translate(${[60 * (i + 1), 0]})`)
				// 		.call(g => g.append("rect")
				// 			.attr("stroke", util.labelColor[0])
				// 			// .attr("stroke-width", 2.5)
				// 			.attr("x", -15)
				// 			.attr("width", 30)
				// 			.attr("fill", "none")
				// 			.attr("height", badlength))
				// 		.call(g => g.append("rect")
				// 			.attr("stroke", util.labelColor[1])
				// 			.attr("y", badlength + disrect)
				// 			.attr("width", 30)
				// 			.attr("x", -15)
				// 			.attr("fill", "none")
				// 			.attr("height", goodlength))
				// monitorG.append("g")
				// 	.selectAll("monitorLine")
				// 	.data(monitorId).join("g")
				// 		.call(g => g.append("path")
				// 			.attr("fill", "none")
				// 			.attr("class", "monitorLine")
				// 			.attr("stroke", d => vm.trainGroupStyle(dataUCL.get(d)[0]))
				// 			.attr("stroke-width", 1)
				// 			.attr("stroke-opacity", 0.4)
				// 			.attr("d", (d, i) => d3.line()
				// 				.x(e => e[0])
				// 				.y(e => e[1])
				// 				.curve(d3.curveLinear)(monitorline(d, i))
				// 				)
				// 			)
				const meanLine = d3.lineRadial()
					.curve(d3.curveLinearClosed)
					.angle((d , i) => i*2/3*Math.PI -Math.PI/3);
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
				const pcRadius = d3.scaleLinear()
					.domain( [0 , d3.extent(wheeldata)[1]])
					.range([0 , 10]);
				const scRadius = d3.scaleLinear()
					.domain( [ d3.extent(wheeldata)[0] , 0])
					.range([ 10 , 0]);
				const arrayindex =  [ [0 , 6 ] , [ 6 , -2 ] , [-5]],
					angleArray = [-Math.PI/3, Math.PI/3, Math.PI];
				const piedata = d3.map(arrayindex , d => wheeldata.slice(...d));
				for (let item in piedata){
					piedata[item].unshift(0);
					piedata[item].push(0);
				}
				const piearea = d3.map(piedata , (e,f) =>  d3.areaRadial()
					.curve(d3.curveCardinal)
					.angle((d , i) => {
						// console.log((f * 1 /3 -1/6+ ( - 1 )/(piedata[f].length - 1)/3 ) * 360)
						// console.log((f * 1 /3 -1/6+ ( piedata[f].length )/(piedata[f].length - 1)/3 ) * 360)
						// console.log((f * 1 /3 -1/6+ (piedata[f].length - 1 )/(piedata[f].length - 1)/3 ) * 360)
						// console.log((f * 1 /3 -1/6+ ( i- 1 + 2*i /(piedata[f].length - 1))/(piedata[f].length - 1)/3 ) * 180)
						// return (f * 1 /3 +1/6+ ( i- 2 + 4*i /(piedata[f].length - 1))/(piedata[f].length - 1)/3 ) * 2 * Math.PI}))
						return (f * 1 /3 -1/6+ ( i)/(piedata[f].length - 1)/3 ) * 2 * Math.PI}))
				var circleG = g => g.append("circle")
					.attr("fill", "none")	
					.attr("stroke", "#c9cbcc")
					.attr("stroke-width", 1)
				rectG
				.append("g")
				.attr("transform", ` translate( ${position})`)
				.call(g => g.append("path")      // radar 
					.attr("fill", pathColor)
					.attr("opacity", 0.4)
					.attr("d", meanLine
						.radius((d , i)=> lineScale[i](d))
						(lineposition)))
				.call(g => g.selectAll(".radar_line")
					.data([0 , 1 , 2])
					.join("g")
					.call(g => g.append("line")
						.style("stroke","#c9cbcc")
						.attr("transform", (d , i) => ` rotate( ${ d * 120 - 60} ) `)
						.attr("y2", -circleLength)
						.attr("opacity", 0.4)
						.style("stroke-width", 1.5))
					.call(g => g.append("path")
						.attr("fill", (d , i) => stationcolor [i] )
						.attr("d",  (e , f) => piearea[f]
							.innerRadius( d => d>=0 ? circleLength - 0.5 : circleLength - 0.5 - scRadius(d))
							.outerRadius(d => d>0 ? circleLength + 0.5 + pcRadius(d) : circleLength + 0.5)(piedata[f])))
					.call(g => g.append("path")      // radar stroke
						.attr("fill", "none")
						.attr("stroke", (d , i) => i == 2 ? stationcolor[0] :stationcolor[i + 1])
						.attr("stroke-width", 2)
						.attr("d", (d , i) => 
							d3.lineRadial()
							.curve(d3.curveLinearClosed)
							.angle((e , f) => (angleArray.filter((m,n) => n !==i))[f])
							.radius((e , f)=> (lineScale.filter((m,n) => n !==i))[f](e))
							(lineposition.filter((m,n) => n !==i)))))
				.call(g => circleG(g)	//radar 1
					.attr("r", xaxlength))
				.call(g => circleG(g) 	//radar 2
					.attr("r", circleLength))
				rectG.lower()
				mergeGopacity()
			}
			function pathOut(e,d){
				var i = d3.select(this).attr("index")
				initMerge()
				mouseOutPath()
				if(mergeClickValue.indexOf(i) == -1)vm.$emit("trainMouse", {upid: d3.map(mergeresult[i]["merge"], d => d.upid),  mouse: 1})
				mergeGopacity()
			}
			function mergeGopacity(){	//brush变更后 copy mergeG state
				if(mergeClickValue.length !== 0){
					svg.selectAll(".mergeG").attr("opacity", 0.4)
					for(let j in mergeClickValue){
						mouseMerge(mergeClickValue[j])
						mouseOverPath(mergeClickValue[j])
					}
				}
			}
			function pathOver(e,d){
				var i = d3.select(this).attr("index")
				initMerge()
				svg.selectAll(".mergeG").attr("opacity", 0.4)
				mouseMerge(i)
				mouseOverPath(i)
				if(mergeClickValue.indexOf(i) == -1)vm.$emit("trainMouse", {upid: d3.map(mergeresult[i]["merge"], d => d.upid),  mouse: 0});
			}
			function pathClick(e,d){
				var i = d3.select(this).attr("index");
				if(mergeClickValue.includes(i)){
					mergeClickValue.splice(mergeClickValue.indexOf(i), 1)
					vm.hightLight([])
				}else{
					if(mergeClickValue.length !== 0){
						mergeClickValue = []
					}
					mergeClickValue.push(i)
					vm.$emit("trainClick",{list: vm.trainSelectedList, color: vm.trainGroupStyle(mergeSelect.slice(-1)[0]), 
						upidSelect: [... d3.map(d3.filter(mergeresult[i]["merge"], d => d.flag === 0), d => d.upid),
						...d3.map(mergeresult[i]["select"], d => d.upid)], type: "group", batch: d3.map(mergeresult[i]["merge"], d => d.upid)})
					vm.hightLight(flagSort(mergeresult[i]["merge"]))
				}
			}
			function mouseOverRect(upid){
				var distanceData = d3.pairs(dataUCL.get(upid)[0].stops, (a, b) => (new Date(b.realTime)).getTime()- (new Date(a.realTime)).getTime())
				for(let m in distanceData){
					svg.selectAll(`.binRect${m}`)
						.attr("fill", d => distanceData[m] <= d.x1 && d.x0 <= distanceData[m] ? d3.color(vm.trainGroupStyle(dataUCL.get(upid)[0])).darker(0.5) : "#b9c6cd")
				}
			}
			function mouseOutPath(){
				for(let m in stopsTime){		//reset binRect
					svg.selectAll(`.binRect${m}`)
						.attr("fill", "#b9c6cd")
				}
			}
			function mouseOverPath(i){
				var distanceData = d3.map(mergeresult[i]["merge"], d =>{ 
					var timeRect = d3.pairs(d.stops, (a, b) => (new Date(b.realTime)).getTime()- (new Date(a.realTime)).getTime())
					timeRect.flag = d.flag
					timeRect.upid = d.upid
					return timeRect
				})
				var distanceRect = distanceData.filter(d => +d.flag == 0)
				var gooddistance = distanceData.filter(d => +d.flag == 1)
				if(distanceRect.length > 0){
					for(let m in distanceRect[0]){
						svg.selectAll(`.binRect${m}`)
							.attr("fill", d => (((d3.map(distanceRect, d => d[m])).filter(e => e<= d.x1 && d.x0 <=e)).length > 0) ? d3.color(vm.trainGroupStyle(dataUCL.get(distanceRect[0].upid)[0])).darker(0.5) :
							((((d3.map(gooddistance, d => d[m])).filter(e => e<= d.x1 && d.x0 <=e)).length > 0 && gooddistance.length > 0) ? d3.color(vm.trainGroupStyle(dataUCL.get(gooddistance[0].upid)[0])).darker(0.5) : "#b9c6cd"))
					}
				}else{
					for(let m in distanceData[0]){
						svg.selectAll(`.binRect${m}`)
							.attr("fill", d => (((d3.map(distanceData, d => d[m])).filter(e => e<= d.x1 && d.x0 <=e)).length > 0) ? d3.color(vm.trainGroupStyle(dataUCL.get(distanceData[0].upid)[0])).darker(0.5) : "#b9c6cd")
					}
				}
			}
			var plateindex = ["same_cate_plate_num", "bad_plate_num"],
			platedata = {
				same_cate_plate_num: [],
				bad_plate_num: [],
				time: []
			};
			for (let item in data){
				for(let index in plateindex){
					platedata[plateindex[index]].push(brushUCL.get(data[item].upid)[0][plateindex[index]])
				}
				platedata["time"].push(new Date(data[item].stops.slice(-1)[0].time))
			}
			var platemax = d3.map(plateindex, d => d3.max(platedata[d])),
				plateScale = d3.map(platemax, d => d3.scaleLinear().domain( [-platemax[1] , d]).range([0, 60])),
				minHeight = d3.min(d3.pairs(d3.map(data, yScale), (a, b) => b - a))  - 2;
				minHeight = minHeight <= 0 ? 2 : minHeight;
			var plateG = renderG.append("g").attr("class", "plateNum"),
				visualbility = (d, i) => vm.isMerge ? (merge.indexOf(d.upid)  === -1 ? "visible" :  "hidden") : "visible";
			plateG.append("g").selectAll(".plateNum").data(data).join("g")
				.attr("transform", `translate(${[mareylength + 240, 0]})`)
				.call(g => g.append("rect")
					.attr("class", "plateNum")
					.attr("transform", (d, i) => `translate(${[0, yScale(d)]})`)
					.attr("x", (d, i) => - plateScale[0](platedata.bad_plate_num[i]))
					.attr("width", (d, i) => plateScale[0](platedata.bad_plate_num[i]))
					.style("visibility", vm.isMerge ? "hidden" : "visible")
					.attr("height", minHeight)
					.attr("fill", util.delabelColor[0]))
				.call(g => g.append("rect")
					.attr("class", "plateNum")
					.attr("transform", (d, i) => `translate(${[0, yScale(d)]})`)
					.style("visibility", vm.isMerge ? "hidden" : "visible" )
					.attr("x", 1)
					.attr("width", (d, i) => plateScale[0](platedata.same_cate_plate_num[i]))
					.attr("height", minHeight)
					.attr("fill", util.delabelColor[1]))
			var pathindex = ["Q", "QUCL", "T2", "T2UCL1"],
			pathdata = { Q: [], QUCL: [], T2: [], T2UCL1: [], time: []};
			for (let item in data){
				for(let index in pathindex){
					pathdata[pathindex[index]].push(brushUCL.get(data[item].upid)[0][pathindex[index]])
				}
				pathdata["time"].push(new Date(data[item].stops.slice(-1)[0].time))
			}
			for(let index in pathindex){
				let item = pathdata[pathindex[index]]
				for(let i in item){
					item[i] = (item[i] - d3.min(item))/(d3.max(item) - d3.min(item))
				}
			}
			// var QUCLMax = d3.max([...pathdata.Q, ...pathdata.QUCL]),
			// 	T2UCLMax = d3.max([...pathdata.T2, ...pathdata.T2UCL1]);
				var allQ = [...pathdata.Q, ...pathdata.QUCL],
					allT2 = [...pathdata.T2, ...pathdata.T2UCL1];
				var QUCLMax = d3.max(allQ),
					T2UCLMax = d3.max(allT2),
					QUCLMin = d3.min(allQ),
					T2UCLMin = d3.min(allT2),
					minmax = [[QUCLMin, QUCLMax], [T2UCLMin, T2UCLMax]]
				// 	rectheight = (d, i) => i !== pathdata.T2.length-1 ? yScale(mergeItem[i + 1]) - yScale(mergeItem[i]) : yScale(mergeItem[i]) - yScale(mergeItem[i - 1]);
				for(let pi =0 ; pi < 2 ; pi ++){
					var k1 = pathdata[pathindex[2 * pi]],
						k2 = pathdata[pathindex[2 * pi + 1]]
					for(let i in k1){
						k1[i] = minmax[pi][1] === minmax[pi][0]  ? 0 : (k1[i] - minmax[pi][0])/(minmax[pi][1] - minmax[pi][0])
						k2[i] = minmax[pi][1] === minmax[pi][0]  ? 0 : (k2[i] - minmax[pi][0])/(minmax[pi][1] - minmax[pi][0])
					}
				}
				QUCLMax = d3.max([...pathdata.Q, ...pathdata.QUCL])
				T2UCLMax = d3.max([...pathdata.T2, ...pathdata.T2UCL1])


			var QScale = d3.scaleLinear()
				.domain([-1, QUCLMax])
				.range([0, 65]);
			var T2Scale = d3.scaleLinear()
					.domain( [-1 , T2UCLMax])
					.range([0, 65]);
			plateG.append("g").selectAll(".remainUpid").data(remainId).join("g")
				.attr("class", "remainUpid")
				.attr("transform", (d, i) => `translate(${[mareylength + 120, yScale(dataUCL.get(d)[0])]})`)
				.call(g => g.append("rect")
					.attr("x", (d, i) => - QScale(pathdata.Q[allupid.indexOf(d)]))
					.attr("width", (d, i) => QScale(pathdata.Q[allupid.indexOf(d)]))
					.attr("y", minHeight/3)
					.attr("height", minHeight/2)
					.attr("fill", d => +alldata[allupid.indexOf(d)].flag === 0 ? util.labelColor[0] : util.labelColor[1])
					.attr("opacity", 1))
			plateG.append("g").selectAll(".remainUpid").data(remainId).join("g")
				.attr("class", "remainUpid")
				.attr("transform", (d, i) => `translate(${[mareylength + 360, yScale(dataUCL.get(d)[0])]})`)
				.call(g => g.append("rect")
					.attr("width", (d, i) => T2Scale(pathdata.T2[allupid.indexOf(d)]))
					.attr("y", minHeight/3)
					.attr("height", minHeight/2)
					.attr("fill", d => +alldata[allupid.indexOf(d)].flag === 0 ? util.labelColor[0] : util.labelColor[1])
					.attr("opacity", 1))
			var processindex = [
					"Heat_Q", "Heat_QUCL", "Heat_T2", "Heat_T2UCL",
					"Roll_Q", "Roll_QUCL", "Roll_T2", "Roll_T2UCL",
					"Cool_Q", "Cool_QUCL", "Cool_T2", "Cool_T2UCL"
				],
				processdata = {Cool_Q: [],Cool_QUCL: [],Cool_T2: [],Cool_T2UCL: [],Heat_Q: [],Heat_QUCL: [],Heat_T2: [],Heat_T2UCL: [],Roll_Q: [],Roll_QUCL: [],Roll_T2: [],Roll_T2UCL: []},
				scaleData = {Cool_Q: [],Cool_QUCL: [],Cool_T2: [],Cool_T2UCL: [],Heat_Q: [],Heat_QUCL: [],Heat_T2: [],Heat_T2UCL: [],Roll_Q: [],Roll_QUCL: [],Roll_T2: [],Roll_T2UCL: []};
				var processRemain = [...data.filter(d => mareyDistance - 15 <= yScale(d) && yScale(d)<= mainHeight + 15 && remainId.indexOf(d.upid) !== -1)]
				var mergeRemain = vm.isMerge ? mergeresult.filter((d, i)=> {
					d.merge.map(e => e.mergeSearch = i)
					if(mareyDistance - 15 <= positionData[i][0][1] && positionData[i][0][1] <= mainHeight + 15)return true
				}).map(d => d.merge).flat() : []
				var monitorData = [
					// ...mergeRemain,
					...processRemain];
				flatdata(data, processindex, scaleData)
				var monitorId = d3.map(monitorData, d => d.upid)
				var badlength = 160,goodlength = 50, disrect = 30, startRect = 160, 
					underUCL = d3.scaleLinear()
						.domain( [0, 1])
						.range([startRect + badlength + goodlength + disrect, startRect + badlength + disrect]),
					divisionFunc = (arr1, arr2) => d3.map(arr1, (d,i) => arr2[i] == 0 ?( arr1[i] == 0 ? 0.5 : 1.5) : arr1[i]/arr2[i]),
					division = d3.map(new Array(6), (d,i) => divisionFunc(scaleData[processindex[2*i]], scaleData[processindex[2*i + 1]])),
					UclScale = d3.map(division, (d,i) => {
						return d3.scaleLinear()
							.domain( [1, d3.max(division[i]) > 1 ? d3.max(division[i]) : 2])
							.range([startRect + badlength, startRect])
					});
				var monitorline = (d, i) => {
					var arr = [];
					arr.push([mareylength + 120, yScale(dataUCL.get(d)[0])])
					for(let j = 0; j < 3; j++){
						arr.push([arr[arr.length - 1][0] + (j == 0 ? 45 : 30), division[2 * j][i] > 1 ? UclScale[2 * j](division[2 * j][i]) : underUCL(division[2 * j][i])])
						arr.push([arr[arr.length - 1][0] + 30, arr[arr.length - 1][1]])
					}
					arr.push([arr[arr.length - 1][0] + 45, yScale(dataUCL.get(d)[0])])
					return arr
				}
					
				// renderG.append("g")
				// 	.attr("transform", `translate(${[mareylength + 120, startRect]})`)	//95
				// 	.selectAll(".monitorRect")
				// 	.data(division.filter((d, i) => (i % 2) ==0)).join("g")
				// 		.attr("class", "monitorRect")
				// 		.attr("transform", (d, i) => `translate(${[60 * (i + 1), 0]})`)
				// 		.call(g => g.append("rect")
				// 			.attr("stroke", util.labelColor[0])
				// 			// .attr("stroke-width", 2.5)
				// 			.attr("x", -15)
				// 			.attr("width", 30)
				// 			.attr("fill", "none")
				// 			.attr("height", badlength))
				// 		.call(g => g.append("rect")
				// 			.attr("stroke", util.labelColor[1])
				// 			.attr("y", badlength + disrect)
				// 			.attr("width", 30)
				// 			.attr("x", -15)
				// 			.attr("fill", "none")
				// 			.attr("height", goodlength))
				renderG.append("g")
					.selectAll("monitorLine")
					.data(monitorId).join("g")
						.call(g => g.append("path")
							.attr("fill", "none")
							.attr("class", "monitorLine")
							.attr("stroke", d => vm.trainGroupStyle(dataUCL.get(d)[0]))
							.attr("stroke-width", 1)
							.attr("stroke-opacity", 0.4)
							.attr("d", (d, i) => d3.line()
								.x(e => e[0])
								.y(e => e[1])
								.curve(d3.curveLinear)(monitorline(d, i))
								)
							)
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
						if( (filter.indexOf(d.train.upid) !==-1 && (qualityData.indexOf(d.train.upid) ===-1)) && vm.isMerge) return;
						vm.$emit("trainMouse", {upid: [d.train.upid],  mouse: 1});
						tooltip.style("display", "none");
						if(vm.trainSelectedList.includes(d.train.upid))return
						mouseoutLine(d.train.upid)
						mouseOutPath()
						mergeGopacity()
					})

					.on("mouseover", (event, d) => {
						if( (filter.indexOf(d.train.upid) !==-1 && (qualityData.indexOf(d.train.upid) ===-1)) && vm.isMerge) return;
						vm.$emit("trainMouse", {upid: [d.train.upid],  mouse: 0});
						let toopcolor = vm.trainGroupStyle(d.train)
						mouseoverLine(d.train.upid)
						mouseOverRect(d.train.upid)
						tooltip
						.style("display", null)
						.attr("fill", "white");
						line1.text(`upid: ${d.train.upid}`);
						line2.text(`category: ${d.train.productcategory}`);
						line3.text(`time: ${d.stop.realTime.toLocaleString(undefined, { hour: "numeric", minute: "numeric" })}`);
						path
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
							vm.trainSelectedList = vm.trainSelectedList.filter(v => v !== d.train.upid)
							mouseoutLine(d.train.upid) // 取消选中
						} else {
						// 选中
							if(vm.trainSelectedList.length !==0){
								mouseoutLine(vm.trainSelectedList[vm.trainSelectedList.length-1])
								mouseOutPath()
							}
							vm.trainSelectedList.push(d.train.upid);
							mouseoverLine(d.train.upid)
							mouseOverRect(d.train.upid)
						}
						let upidSelect = d3.map(d3.filter(data.slice(allupid.indexOf(d.train.upid)), d => d.flag === 0), d => d.upid)
						vm.$emit("trainClick", {list: vm.trainSelectedList, upidSelect: upidSelect, type: "single",batch: upidSelect});
					})
				});
			d3.select(".axisrect").raise()
			d3.selectAll(".processPath").raise()
			d3.selectAll(".shadow_rect").raise()
			d3.selectAll(".processline").raise()
			d3.selectAll(".monitorPath").raise()
			d3.select(".axisG").raise()
			// var yGroup = renderG.append("g")
			// 	.call(yAxis);
		}
		// render()
		const miniDistance = d3.min(d3.pairs(d3.map(data, d => new Date(d.stops[0].time)), (a, b) => b.getTime() -a.getTime()))
		var miniMargin = { top: 115, right: 15, bottom: 200, left: 35 },
			miniheight =  mainHeight - miniMargin.top - miniMargin.bottom,
			miniwidth = 75,
			miniXScale = d3.scaleTime()
				.domain([new Date(minDate), new Date(maxDate)])
				.range([0, miniheight - miniMargin.bottom - miniMargin.top]),
			mainXZoom = d3.scaleLinear()
				.range([mareyDistance, mainHeight - margin.bottom])
				.domain([0, miniheight]),
			BrushSelectHeight = miniXScale(new Date(50 * miniDistance + new Date(data[0].stops[0].time).getTime())),
			// data.length > 50 ? (this.isMerge ? miniXScale(new Date(data[50].stops[0].time)) : miniXScale(new Date(data[65].stops[0].time))) : (this.isMerge ? 0.5 * unitHeight : 0.3 * unitHeight),
			// miniXScale(new Date(data[65].stops[0].time.slice(0, 19))),
			// BrushSelectHeight =50,
			initialBrushXSelection = [0, BrushSelectHeight],
			brush = d3.brushY()
				.extent([[0, 0], [miniwidth - miniMargin.right - miniMargin.left, miniheight - miniMargin.bottom - miniMargin.top]])
				.on("end", brushmove),
			stellheight = d3.scaleLinear()
				.domain([0.006, 0.16])
				.range([1.4, 1.5]);
			initialBrushXSelection = vm.initialBrushXSelection !== undefined ? vm.initialBrushXSelection : initialBrushXSelection
			// [miniXScale.invert(extentX[0]),miniXScale.invert(extentX[1])]
			// console.log(BrushSelectHeight)

		function brushmove(event) {
			const extentX = event.selection;
			const selected = miniXScale
				.domain()
				.filter(d => (extentX[0] + 1e-2 <= miniXScale(d)) && (miniXScale(d) <= extentX[1] - 1e-2));
			const selectTime = [miniXScale.invert(extentX[0]),miniXScale.invert(extentX[1])];
			mainXZoom.domain(extentX);
			y = d3.scaleTime()
				.domain(selectTime)
				.range([mareyDistance, miniheight - miniMargin.bottom - miniMargin.top])
			line = d3.line()
				.x(d => x(d.station.distance))
				.y(d => y(new Date(d.time)))
			voronoi = Delaunay
				.from(stops, d => x(d.stop.station.distance), d => y(new Date(d.stop.time)))
				.voronoi([mareyEntry, mareyDistance, mareylength, mareyDistance + height])
			d3.select(".miniGroup").selectAll(".rect")
				.attr("opacity", d=> miniXScale(new Date(d.stops[0].time))>extentX[0] && miniXScale(new Date(d.stops[0].time))<extentX[1] ? 0.4 : 0.2)
			d3.select(".miniLine1").attr("y1", miniMargin.top + extentX[0])
			d3.select(".miniLine2").attr("y1", miniMargin.top + extentX[1])
			svg.select(".selection")
				.attr("fill", "none")
				.attr("stroke", "#aaa")
			vm.initialBrushXSelection = extentX
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


		const wrapperGroup = svg.append("g")
			.attr("class", "wrapperGroup");

		// const mainBarsGroup = wrapperGroup.append("g")
		// 	.attr("class", "mainBarsGroup");
		const brushXPosition = width - miniMargin.right - margin.right / 2;
		const miniGroup = svg.append("g")
			.attr("class", "miniGroup")
			.attr("transform", `translate(${[brushXPosition, miniMargin.top]})`);
		const brushGroup = svg.append("g")
			.attr("class", "brushWrapper")
			.attr("transform", `translate(${[brushXPosition, miniMargin.top]})`)
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
		const miniBars = miniGroup
				.call(g => g.selectAll(".rect")
					.data(vm.isMerge ? filterdata : data)
					.join('rect')
						.attr("class", "rect")
						.attr('x', 0)
						.attr('y', d => miniXScale(new Date(d.stops[0].time)))
						.attr("id", d => "miniBar" + d.upid)
						.attr("height", d => stellheight(d.tgtplatethickness2))
						.attr('width', miniwidth - miniMargin.right - miniMargin.left)
						.attr("fill", vm.trainGroupStyle)
						.attr("opacity", d=> miniXScale(new Date(d.stops[0].time))>initialBrushXSelection[0] && miniXScale(new Date(d.stops[0].time))<initialBrushXSelection[1] ? 0.8 : 0.7))
				.call(g => g.selectAll(".mergePath")
					.data(vm.isMerge ? mergeresult : [])
					.join('rect')
						.attr('y', (d, i) => miniXScale(new Date(mergeresult[i]["merge"][0].stops[0].time)))
						.attr("opacity", 0.5)
						.attr("height", d => miniXScale(new Date(d["merge"][d["merge"].length - 1].stops[0].time)) - miniXScale(new Date(d["merge"][0].stops[0].time)))
						.attr('width', miniwidth - miniMargin.right - miniMargin.left)
						.attr("fill", (d, i) => {
							var mergeItem = mergeresult[i]["merge"]
							var quality = d3.sort(d3.groups(mergeItem, d => d.flag), d=> d[1].length),
							pathColor = vm.changeColor ?  (quality[1] !== undefined ? vm.labelColors[quality[1][0]] : vm.labelColors[quality[0][0]]) : vm.trainGroupStyle(mergeItem[0]);
							return pathColor
						})
				)
		const miniLine = svg
			.call(g => g.append("line")
						.attr("x1", brushXPosition)
						.attr("y1", miniMargin.top + initialBrushXSelection[0])
						.attr("class", "miniLine1")
						.style("stroke","#c9cbcc")
						.attr("x2", mareylength + 455)
						.attr("y2", mareyDistance)
						.style("stroke-width", 0.75))
			.call(g => g.append("line")
						.attr("class", "miniLine2")
						.attr("x1", brushXPosition)
						.attr("y1", miniMargin.top + initialBrushXSelection[1])
						.style("stroke","#c9cbcc")
						.attr("x2", mareylength + 455)
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
			.attr("transform", `translate(${[brushXPosition + 30, miniMargin.top]})`)
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
			.attr("transform", `translate(${[brushXPosition, miniMargin.top]})`)
			.attr("height", miniheight - miniMargin.bottom - miniMargin.top)
			.attr("width", miniwidth - miniMargin.right - miniMargin.left)
			.attr("fill", "none")
			.attr("stroke", "#c9cbcc")
			.attr("stroke-width", 0.15)
			.attr("filter","url(#shadow-label)")
		brushGroup.call(brush.move, initialBrushXSelection);
		svg.select(".selection")
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
			// if (bool) {
			// 	this.changeColor = true
			// 	this.showColor = this.labelColorsFunc
			// 	this.trainGroup &&
			// 	this.trainGroup.style('color', d => d.flag === 0 ? this.labelColors[0] : this.labelColors[1])
			// } else {
			// 	this.changeColor = false
			// 	this.showColor = this.categoryColors
			// 	this.trainGroup &&
			// 	this.trainGroup.style('color', d => this.categoryColors(d.productcategory))
			// }
			this.changeColor = ! this.changeColor
			if(this.data !== undefined && this.station !== undefined){
				this.paintMareyChart(this.data,this.station, this.changeColor, this.brushData)
				this.hightLight([])
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
			const mergeIndex = {}	// merge station maxlength
			const mergeresult = [] ;
			// mpass = /MPass/ ;
			// const mpassnumber = (+stations.slice(-4)[0].name.replace(mpass,''))
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
				const categoryindex=mergecategorys.indexOf(json[item].productcategory)

				//filter data
				if(categoryindex ===-1)	continue
				var index =item
				while(json[index] !== undefined && json[item].productcategory === json[index].productcategory){
					index++
				}
				if( index - item < minrange) continue

				// merge length
				const mergedata = json.slice(item,index)

				// //mPass expand
				// for (var key = 0 ; key < mergedata.length-1 ; key++){
				// 	if(mergedata[key].stops.slice(-1)[0].station.zone === '3'){
				// 		let mpassindex = (+mergedata[key].stops.slice(-4)[0].station.name.replace(mpass,''))
				// 		if(mpassindex === mpassnumber) continue
				// 		const stationsstops3 = stations.slice(-3 + mpassindex - mpassnumber , -3)
				// 		for (let stopkey in stationsstops3){
				// 			mergedata[key].stops.splice( -3 , 0 , {
				// 				"time" : mergedata[key].stops.slice(-4)[0].time,
				// 				"realTime" : mergedata[key].stops.slice(-4)[0].realTime,
				// 				"station" : stationsstops3[stopkey]
				// 			})
				// 		}
				// 		continue
				// 	}
				// 	let mpassindex = (+mergedata[key].stops.slice(-1)[0].station.name.replace(mpass,''))
				// 	const stationsstops3 = stations.slice(-3 + mpassindex - mpassnumber)
				// 	for (let stopkey in stationsstops3){
				// 		mergedata[key].stops.push({
				// 			"time" : mergedata[key].stops.slice(-1)[0].time,
				// 			"realTime" : mergedata[key].stops.slice(-1)[0].realTime,
				// 			"station" : stationsstops3[stopkey]
				// 		})
				// 	}
				// }
				
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
					if(mergeflag < minrange){
						item ++
						continue
					}
					var mergeDistanceTime = d3.pairs(d3.map(mergedata.slice(0 , 0 + mergeflag), d => new Date(d.stops.slice(-1)[0].time).getTime()) , (a,b) => b - a),
						distanceIndex = 0;
					for(var number = 0 ; number < mergeDistanceTime.length-1 ; number++){
						if(mergeDistanceTime[number] > 3 * d3.min(mergeDistanceTime)){
							distanceIndex = number
							break
						}
					}
					// console.log(mergeDistanceTime)
					if(distanceIndex !== 0){
						item = item + distanceIndex + 1
						continue
					}
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
				if(index - item < minrange){
					item ++
					continue
				}
				// console.log(mergedata)
				var mergeDistanceTime = d3.pairs(d3.map(mergedata, d => new Date(d.stops.slice(-1)[0].time).getTime()) , (a,b) => b - a),
					distanceIndex = 0;
				for(var number = 0 ; number < mergeDistanceTime.length-1 ; number++){
					if(mergeDistanceTime[number] > 3 * d3.min(mergeDistanceTime)){
						distanceIndex = number
						break
					}
				}
				// console.log(mergeDistanceTime)
				if(distanceIndex !== 0){
					item = item + distanceIndex + 1
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
					this.hightLight([])
				}
			})

		}
	},
	mounted() {
	},
	computed:{
        ...mapGetters([
            "hightlightGroup"
        ])
	}
}
</script>

<style>
</style>
