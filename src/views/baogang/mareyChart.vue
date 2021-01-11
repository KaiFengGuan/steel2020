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
		data:[]
		}
	},
	methods: {
		// paintMareyChart(alldata, stationsData, conditionData) {
		paintMareyChart() {
		const alldata=myJsonData
		const stationsData=myStationData
		console.log(stationsData)
		this.trainSelectedList = []; // 2019-5-16 23:29:30 清空选择列表
		this.trainGroupStyle === undefined && (this.trainGroupStyle = d => this.categoryColors(d.productcategory));
		var vm = this;
		
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
		var margin = ({ top: 70, right: 100, bottom: 70, left: 50 })

		var x = d3.scaleLinear()
			.domain(d3.extent(stations, d => d.distance))
			.range([margin.left + 10, width - margin.right])

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
		var tooltip = (stopsdata) =>g => {
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
			.data(stopsdata)
			.join("path")
			.attr("d", (d, i) => voronoi.renderCell(i))

			//.on("mouseout", () => tooltip.style("display", "none"))

			.on("mouseout", (event, d) => {
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
		}

		this.svg !== undefined && this.svg.remove()
		this.svg = d3.select('#' + this.menuId)
			.append("svg")
			.attr("width", width)
			.attr("height", height);

		var train = this.svg.append("g")
			.attr("fill", "white")
			.selectAll("g")
			.data(data)
			.join("g")
			.style("color", this.trainGroupStyle)
			.attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) })
			.attr("id", d => ("id" + d.upid))

		this.trainGroup = train;

		train
			.call(g => g.append("path")
				.attr("fill", "none")
				.attr("stroke", "currentColor")
				.attr("d", d => line(d.stops)))
			.call(g => g.append("g")
				.attr("stroke", "none")
				.selectAll("circle")
				.data(d => d.stops)
				.join("circle")
				.attr("transform", d => `translate(${x(d.station.distance)},${y(new Date(d.time))})`)
				.attr("r", d => d.station.name === "FuCharging" ? 3 :
				(d.station.name === "FuDischarging" ? 1.5 : 0.5)
				))

		var mergeresult = this.merge(data , stations)
		var filterdata = this.deepCopy(data)
		for (let item in mergeresult){
			console.log(...mergeresult[mergeresult.length-item-1]["index"])
			filterdata.splice(...mergeresult[mergeresult.length-item-1]["index"])
		}
		console.log(filterdata.length)
		console.log(data.length)
		var stops = d3.merge(data.map(d => d.stops.map(s => ({ train: d, stop: s }))))
		this.svg.append("g")
			.call(tooltip(stops));

		// private Object fuTotalTimeBefore;
		// private Object fuTotalTimeAfter;
		// private Object mTotalTime;
		// private Object ccTotalTime;
		
		console.log(mergeresult)

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
		
		//add Axis
		var xAxis = g => g
			.style("font", "12px sans-serif")
			.selectAll("g")
			.data(stations)
			.join("g")
			.attr("transform", d => `translate(${x(d.distance)},0)`)
			.call(g => g.append("line")
			.attr("y1", margin.top - 0)
			.attr("y2", margin.top)
			.attr("stroke", "currentColor"))
			.call(g => g.append("line")
			.attr("y1", height - margin.bottom + 0)
			.attr("y2", height - margin.bottom)
			.attr("stroke", "currentColor"))
			.call(g => g.append("line")
			.attr("y1", margin.top - 3)
			.attr("y2", height - margin.bottom + 3)
			.attr("stroke-dasharray", "1.5,2")
			.attr("stroke", "currentColor")
			.attr("stroke-opacity", d => {
				return (d.name === "FuDischarging" || d.name === "MPass24") ? 0.8 : 0.4
			})
			)
			.call(g => g.append("text")
			.attr("transform", `translate(-10,${margin.top + 0}) rotate(-45)`)
			.attr("x", 12)
			.attr("dy", "0.35em")
			.text(d => d.name))
			.call(g => g.append("text")
			.attr("text-anchor", "end")
			.attr("transform", `translate(10,${height - margin.top - 0}) rotate(-45)`)
			.attr("x", -12)
			.attr("dy", "0.35em")
			.text(d => d.name))

		var _yAxis = d3.axisLeft(y)
			.ticks(d3.formatMinute)
			.tickSize(0)
		var yAxis = g => g
			.attr("transform", `translate(${margin.left},0)`)
			.style("font", "12px sans-serif")
			.call(_yAxis
			// .tickFormat(date => date.toLocaleString(undefined, { hour: "numeric" }))
			)
			.call(g => g.select(".domain").remove())
			.call(g => g.selectAll(".tick line").clone().lower()
			.attr("stroke-opacity", 0.2)
			.attr("x2", width - 80))

		var xGroup = this.svg.append("g")
			.call(xAxis);
		var yGroup = this.svg.append("g")
			.call(yAxis);

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
			const minrange = 10
			const minconflict = 2
			const mergedata = {}
			const mergeIndex = {}	// merge station maxlength
			const mergeresult = []
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
				console.log(mergedata)

				// merge adaption
				// var minDate = data[0].stops[0].time;
				// var maxDate = data.slice(-1)[0].stops.slice(-1)[0].time

				const _mergedistance = []
				for (var key = 0 ; key < mergedata.length-1 ; key++){
					
				}
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
				const meandis = []
				for (let key in stations){
					meandis.push(d3.quantile(steeldisTotal, 0.75 , d => d[key]))
				}
				console.log(meandis)

				// merge selection
				const mergeselect = []
				for (let i in steeldisTotal){
					const outrange = 0
					for (let j in stations){
						steeldisTotal[i][j] > meandis[j] ? ((steeldisTotal[i][j] - meandis[j])/meandis[j]>1.1 & meandis[j] !==0 ) ? outrange+=5 : outrange+=1 : undefined
						steeldisTotal[i][j]<0  ?	outrange+=20 : undefined
					}
					if(outrange >=15)  mergeselect.push(mergedata[+i+1])
					// mergeselect.push(mergedata[i+1])
				}
				console.log(mergeselect)
				
				
				console.log(steeldisTotal)
				
				mergeresult.push({
					'merge' : mergedata,
					'select' : mergeselect,
					'index' : [item , index - item]
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
