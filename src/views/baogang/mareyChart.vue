<template>
  <div :id="menuId" style="height: 100%"></div>
  <!-- <div :id="menuId" style="height: 100%; overflow-y: scroll;overflow-x: hidden;"></div> -->
</template>

<script>
import * as d3 from "d3";
import { Delaunay } from "d3-delaunay";
import util from "./util.js";
import { mapGetters, mapMutations } from "vuex";
export default {
  data() {
    return {
      menuId: 'marey',
			categoryColors: util.categoryColor,
      labelColors: util.labelColor, // [bad, good]
      noflagColor: util.noflagColor,
			labelColorsFunc: util.labelColorFunc,
			svg: undefined,
			trainSelectedList: [],
			trainGroupStyle: undefined,
			changeColor: true,
			data: undefined,
      stations: undefined,
      filterdata: undefined,
      mergeresult: [],
			highLightStrokeWidth : 2,
			minrange: 10,
			minconflict: 4,
			isMerge: true,
			processColor: util.processColor,
			brushData: undefined,
			defaultStrokeWidth : undefined,
      initialBrushXSelection : undefined,
      mainHeight: 0
    };
  },
  methods: {
    ...mapMutations(["hightLight"]),
    paintPre(alldata, stationsData, changeColor, brushData) {
      // debugger
      alldata = this.deepCopy(alldata);
      stationsData = this.deepCopy(stationsData);
      this.initialBrushXSelection = undefined;
      this.paintMareyChart(alldata, stationsData, changeColor, brushData);
    },
    paintMareyChart(alldata, stationsData, changeColor, brushData) {
      (this.data = this.deepCopy(alldata)),
        (this.stations = this.deepCopy(stationsData)),
        (this.brushData = brushData);
      const dataUCL = d3.group(alldata, d => d.upid);
      const allupid = d3.map(alldata, d => d.upid);

      this.trainSelectedList = []; // 2019-5-16 23:29:30 清空选择列表
      var vm = this;
      this.changeColor = changeColor
      this.trainGroupStyle = 
        this.changeColor ?
        ( d => d.flag !== 404 ? (d.flag === 0 ? vm.labelColors[0] : vm.labelColors[1]) : vm.noflagColor) :
        ( d => vm.categoryColors(d.productcategory));
      var stationcolor = this.processColor;

      const width = document.getElementById(this.menuId).offsetWidth;
      const mainHeight = document.getElementById(this.menuId).offsetHeight;
      this.mainHeight = mainHeight
      const stationBottomGap = 10;
      var stops = d3.merge(this.data.map(d => d.stops.map(s => ({ train: d, stop: s }))));
      var stopsTime = d3.map(alldata, d => {
        let arr = d3.pairs(d.stops, (a,b) => new Date(b.realTime).getTime() - new Date(a.realTime).getTime())
        arr.upid = d.upid
        return arr
      });
      var statname = d3.map(this.stations, d => d.name);

      let margin = ({ top: 50, right: 70, bottom: 0, left: 100 }),
        mareyEntry = 2.6 * margin.left,
        mareyWidth = width - mareyEntry - 7.6 * margin.right,
        coreX = mareyEntry * 0.55,
        mareyDistance = 1.8 * margin.top;
      
      let stationlength = mareyWidth / vm.stations.length,
          stationRect = stationlength / 1.2,
          rectDistance = (stationlength - stationRect)/2,
          labelwidth = (stationRect) / 1.414,
          rectwidth = 60,
          polygonlength = (width - 1.5 * margin.right - (mareyEntry))/1.414  +  labelwidth + 3;
      
      var minDate = this.data[0].stops[0].time,
        maxDate = this.data.slice(-1)[0].stops.slice(-1)[0].time,
        unitHeight = 300,
        unitPerTime = 3.5;
      var timeHeightScale = unitHeight / (60 * 60 * 1000 * unitPerTime); // 单位高度 时间跨度x小时
      var height = (new Date(maxDate).getTime() - new Date(minDate).getTime()) * timeHeightScale;

      var x = d3.scaleLinear()
        .domain(d3.extent(this.stations, d => d.distance))
        .range([ 0 , mareyWidth - labelwidth - 20]);
      var y = d3.scaleTime()
        .domain([new Date(minDate), new Date(maxDate)])
        .range([mareyDistance + stationBottomGap, height - margin.bottom]);
      var line = d3.line()
        .x(d => x(d.station.distance))
        .y(d => y(new Date(d.time)));
      var voronoi = Delaunay
        .from(stops, d => x(d.stop.station.distance), d => y(new Date(d.stop.time)))
        .voronoi([0, mareyDistance, mareyWidth, mareyDistance + height]);
      var defaultStrokeWidth = d3.scaleLinear()
        .domain([0.006, 0.16])
        .range([0.5, 1.2])
      this.defaultStrokeWidth = defaultStrokeWidth
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
      
      this.svg !== undefined && this.svg.remove();
      this.svg = d3.select('#' + this.menuId)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "svgWrapper")
        .attr("transform", "translate(0,0)");
      
      

      



      shadowInit();
      paintMarey();
      
      
      






      function paintMarey() {
        let mareyContentGroup = vm.svg.append('g')
        .attr('class', 'mareyContentGroup')
        .attr('transform', `translate(${mareyEntry}, ${0})`);

        mareyContentGroup.append("g")
          .call(g => g.append("rect")
            .attr("x" , -labelwidth + 10)
            .attr("y", margin.top)
            .style("fill","white")
            .attr("width", mareyWidth + 8 + labelwidth)
            .attr("height", height - margin.top - margin.bottom))
          .call(g => g.append("rect")
            .attr("x" , -labelwidth + 10)
            .attr("class", "shadow_rect")
            .attr("y", margin.top)
            .style("fill","none")
            .attr("width", mareyWidth + 8 + labelwidth)
            .attr("height", height - margin.top - margin.bottom))
            .attr("filter","url(#shadow-card)");
          

        if (vm.isMerge) {
          vm.filterdata = vm.deepCopy(vm.data);
          vm.mergeresult = mergeMareyData(vm.data , vm.stations);
          // console.log('mergeresult: ', vm.mergeresult);
          for (let item in vm.mergeresult){
            vm.filterdata.splice(...vm.mergeresult[vm.mergeresult.length-item-1]["index"])
          }
        }


        paintMareyLine(mareyContentGroup);
        paintStationsLabel(mareyContentGroup);   // render marey stations
        paintMareyBrush(mareyContentGroup);
      }
      function mergeMareyData(json , stations) {
        // debugger
        const categorys = d3.group(json , d => d.productcategory);
        const mergecategorys = [];	// merge categorys
        const minrange = vm.minrange;
        const minconflict = vm.minconflict;
        const mergeIndex = {};	// merge station maxlength
        const mergeresult = [];
        // mpass = /MPass/ ;
        // const mpassnumber = (+stations.slice(-4)[0].name.replace(mpass,''))
        for (let item of [...categorys]) {
          item[1].length > minrange ? mergecategorys.push(item[0]) : undefined
        }
        // for (let item of  mergecategorys) {
        //   let indexdata=d3.groups(categorys.get(item) , d => d.stops.length)
        //   mergeIndex[item] = indexdata[d3.maxIndex(indexdata ,  d => d[1].length)][0]
        // }

        for(var item = 0; item < json.length - minrange; item++) {
          const categoryindex = mergecategorys.indexOf(json[item].productcategory)

          //filter data
          if(categoryindex === -1)	continue
          var index = item
          while(json[index] !== undefined && json[index].stops.length === json[item].stops.length && json[item].productcategory === json[index].productcategory){
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
          for (var key = 0 ; key < mergedata.length; key++) {
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

          const steeldisTotal = d3.pairs(mergedata , (a,b) => {
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
          for (let key in json[item].stops) {
            meandis.push(d3.quantile(steeldisTotal, 0.75 , d => d[key]))
          }
          // console.log(meandis)

          // merge selection
          const mergeselect = []
          const mergeflag = 0 ;
          for (let i in steeldisTotal) {
            const outrange = 0
            for (let j in json[item].stops) {
              steeldisTotal[i][j] > meandis[j] ? ((steeldisTotal[i][j] - meandis[j])/meandis[j] > 1.1 & meandis[j] !== 0 ) ? outrange+=5 : outrange+=2 : undefined
              steeldisTotal[i][j] < 0 ? outrange += 20 : undefined
            }
            if (outrange >= 15)  mergeselect.push(mergedata[+i+1])
            if (mergeselect.length > minconflict -1 ) {
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
      }
      function paintStationsLabel(mareyContentGroup) {
        var stopsTime = d3.map(vm.data, d => {
            let arr = d3.pairs(d.stops, (a,b) => new Date(b.realTime).getTime() - new Date(a.realTime).getTime())
            arr.upid = d.upid
            return arr
          }),
          timebins = stopsTime[0].map((d, i) => {
            return d3.bin().thresholds(20)(d3.map(stopsTime, (e,f) => e[i]))
          });
        let binxScale = timebins.map(d => 
            d3.scaleLinear()
            .domain([d[0].x0, d[d.length - 1].x1])
            .range([5, stationRect - 5])
          ),
          binYScale = timebins.map(d => 
            d3.scaleLinear()
            .domain([0, d3.max(d, e => e.length)])
            .range([0, mareyDistance - margin.top - 10])
          );
        
        let removeElement = mareyContentGroup.selectAll('.stationsNameGroup')._groups[0][0];
        removeElement !== undefined && removeElement.remove();

        let stationsNameGroup = mareyContentGroup.append("g").attr("class", "stationsNameGroup");
        stationsNameGroup.append("g")
          .attr("class", "axisrect")
          .call(g => g.append("rect")
            .attr("class", "background")
            .attr("y", 0)
            .attr("x", - 15)
            .style("fill","white")
            .attr("width", width - mareyEntry + 15)
            .attr("height", mareyDistance + stationBottomGap));
          
        var timedistance = g => g
          .attr('class', 'labelRect')
          .selectAll("g")
          // .data(stations.slice(0, -1))
          .data(vm.stations)
          .join("g")
          .attr("transform", d => `translate(${[x(d.distance) + rectDistance, mareyDistance - 1]})`)
          .call(g => g.append("rect")
            .attr("y", margin.top - mareyDistance)
            .attr("fill", (d,i) => d3.color(i < 6 ? stationcolor [0] : ( i> vm.stations.length - 4 ? stationcolor [2] : stationcolor [1])))
            .attr("opacity", 0.6)
            .attr("stroke", (d,i) => d3.color(i < 6 ? stationcolor [0] : ( i> vm.stations.length - 4 ? stationcolor [2] : stationcolor [1])))
            .attr("stroke-width", 1)
            .attr("width", stationRect)
            .attr("height", mareyDistance - margin.top)
            .attr("filter","url(#shadow-card)"));
        var xAxis = g => g
          .style("font", "13px DIN")
          .attr('class', 'labelPolygon')
          .selectAll("g")
          .data(vm.stations)
          // .data(stations.filter((d,i) => i !== stations.length - 4))
          .join("g")
          .attr("transform", (d, i) => `translate(${x(d.distance)+labelwidth + rectDistance}, -2)`)
          .attr('i', (d, i) => i)
          // .attr("transform", (d, i) => i < stations.length - 4 ? `translate(${x(d.distance)+labelwidth + rectDistance},-2)` : `translate(${x(d.distance - 40)+labelwidth + rectDistance},-2)`)
          .call(g => g.append("polygon")
            .attr("transform", `translate(${-labelwidth} , ${margin.top + 0}) rotate(-45)`)
            .attr("points", `0, 0  ${labelwidth},${labelwidth}  110 , ${labelwidth}  ${110 - labelwidth}, 0`)// .attr("points", "0, 0  17, 17  110 , 17  93, 0")
            .attr("fill", (d,i) => statname.indexOf(d.name) <6 ? stationcolor [0] : ( statname.indexOf(d.name) > vm.stations.length - 4 ? stationcolor [2] : stationcolor [1]))
            .attr("id", d => "polygon" + d.name)
            .attr("stroke" , "none"))
          .call(g => g.append("text")
            .attr("transform", `translate(-4 ,${margin.top -1.5}) rotate(-45)`)
            .attr("id", d => "station"+d.name)
            .attr("x", 8)
            .attr("dy", "0.25em")
            .attr("font-family" , util.conditionPolygonTextAttr.fontFamily)
            .attr("fill", util.conditionPolygonTextAttr.fontColor)
            .style("font-size", util.conditionPolygonTextAttr.fontSize)
            .attr("font-weight", util.conditionPolygonTextAttr.fontWeight)
            .style("font-style", util.conditionPolygonTextAttr.fontStyle)
            .text(d => d.name.replace(/harging/, "harge").replace(/Cc/, "C").replace(/ing/, "").replace(/Pass/, "")
              .replace(/arge/, "").replace(/CDQ/, "DQ").replace(/CAC/, "AC")))
          .on("mouseover", statOver)
          .on("mouseout", statOut);
        var xRect = g => g.append("polygon")
          .attr("transform", `translate(${mareyEntry - labelwidth/2 - 6} ,${margin.top -1.5}) rotate(-45)`)
          .attr("id", "rectxLine")
          .attr("points", `0, 0  ${polygonlength},${polygonlength} ${112 - labelwidth + polygonlength}, ${polygonlength}  ${112 - labelwidth}, 0`)
          .attr("fill", "none")
          .attr("stroke", "#c4c4c4")
          .attr("stroke-width", 0.15)
          .attr("filter","url(#shadow-rect)");
        stationsNameGroup.append("g")
          .call(xRect)
          .call(xAxis);
        stationsNameGroup.append('g')
          .call(timedistance);
        for(let bin in vm.stations.slice(0, -1)){
          stationsNameGroup.append("g")
            .attr("transform", `translate(${[x(vm.stations[bin].distance), mareyDistance - 1]})`)
            .selectAll(".binRect")
            .data(timebins[bin])
            .join("rect")
              .attr("class", `binRect${bin}`)
              .attr("x", d => binxScale[bin](d.x0) + 1)
              .attr("fill", "#b9c6cd")
              .attr("stroke", "#aaa")
              .attr("stroke-width", 0.25)
              .attr("width", d =>  binxScale[bin](d.x1) - binxScale[bin](d.x0))
              .attr("y", d => - binYScale[bin](d.length))
              .attr("height", d => binYScale[bin](d.length))
        }

        function statOver (e, m){
          let i = d3.select(this).attr("i")
          d3.select("#polygon" + m.name)
            .attr("fill", (d,i) => 
              d3.color(
                statname.indexOf(d.name) <6 ? 
                stationcolor [0] : 
                ( statname.indexOf(d.name) > vm.stations.length - 4 ? stationcolor [2] : stationcolor [1])
              ).darker(0.2))
          d3.selectAll(`.mline${i}`)
            .attr("stroke-width" , 2.5)
          d3.selectAll(`.mline${i++}`)
            .attr("stroke-width" , 2.5)
          // d3.select("#line" + m.name).attr("stroke-width" , 2.5)
          d3.select("#station" + m.name)
            .attr("font-weight", "bold")
        }
        function statOut (e,m){
          let i = d3.select(this).attr("i")
          d3.select("#polygon" + m.name)
            .attr("fill", (d,i) => 
              statname.indexOf(d.name) <6 ? 
              stationcolor [0] : 
              ( statname.indexOf(d.name) > vm.stations.length - 4 ? stationcolor [2] : stationcolor [1]))
          d3.selectAll(`.mline${i}`)
            .attr("stroke-width" , 0.5)
          d3.selectAll(`.mline${i++}`)
            .attr("stroke-width" , 0.5)
          d3.select("#station" + m.name)
            .attr("font-weight", "normal")
        }
      }
      function paintMareyLine(mareyContentGroup) {
        let removeElement = mareyContentGroup.selectAll('.mareyLineGroup')._groups[0][0]
        removeElement !== undefined && removeElement.remove()

        // 站点提示线
        let MareyGroup = mareyContentGroup.append("g").attr("class", "mareyLineGroup");
        MareyGroup.append("g")
          .attr('class', 'stationsLine')
          .selectAll("g")
          .data(vm.stations)
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
            .attr("stroke" , (d , i) => d3.color(i <6 ? stationcolor [0] : ( i> vm.stations.length - 4 ? stationcolor [2] : stationcolor [1]))))

        // 渲染马雷图线
        let paintdata = vm.isMerge ? vm.filterdata : vm.data
        var train = MareyGroup.append("g")
          .attr("fill", "white")
          .selectAll("g")
          .data(paintdata)
          .join("g")
          .attr("class", "mareyLine")
          .style("color", vm.trainGroupStyle)
          .attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) })
          .attr("id", d => ("id" + d.upid))
          .call(g => g.append("path")
            .attr("fill", "none")
            .attr("stroke", "currentColor")
            .attr("d", d => line(d.stops)))

        var qualityData = [],
				  positionData = [];
        // 渲染马雷图合并path
        for (let item in vm.mergeresult){
          if(!vm.isMerge) break
          
          let mergeG = MareyGroup.append("g")
            .attr("class", `mergeG`)
            .attr("id", `mergeG${item}`)

          let xaxlength = 32,
            circleLength = 1.5 * xaxlength,
            mergeItem = vm.mergeresult[item]["merge"],	//merge Plate
            mergeSelect = vm.mergeresult[item]["select"],	//select Plate
            mergeId = d3.map(mergeItem, d => d.upid),
            selectId = d3.map(mergeSelect, d => d.upid);
          
          let quality = d3.sort(d3.groups(mergeItem, d => d.flag), d=> d[1].length);
					let mergeArea = d3.area()
						.x((d, i) => x(d.station.distance))
						.y0((d, i) => y(new Date(mergeItem[0].stops[i].time)))
						.y1((d, i) => y(new Date(mergeItem[mergeItem.length - 1].stops[i].time)));
          let pathColor = vm.changeColor ?  (quality[1] !== undefined ? vm.labelColors[quality[1][0]] : vm.labelColors[quality[0][0]]) : vm.trainGroupStyle(mergeItem[0]);
          // debugger
          mergeG.append("path")
            .datum(mergeItem[0].stops)
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
        }

        // 马雷图 线 tooltip
        MareyGroup.append("g")
          .attr('class', 'mareyTooltipGroup')
          .call(g => {
            const tooltip = g.append("g")
            .style("font", "15px DIN");
            const path = tooltip.append("path")
              .attr('class', 'tooltipContent')
              .attr("fill", "rgba(245, 245, 230, 0.97)");

            const text = tooltip.append("text")
              .attr('class', 'tooltipContent');
            const line1 = text.append("tspan")
              .attr("x", 0)
              .attr("y", 0)
              .style("font-family", util.conditionMareyTooltipAttr.line1.fontFamily)
              .style("font-size", util.conditionMareyTooltipAttr.line1.fontSize)
              .style("font-weight", util.conditionMareyTooltipAttr.line1.fontWeight)
              .style("font-style", util.conditionMareyTooltipAttr.line1.fontStyle)
            const line2 = text.append("tspan")
              .attr("x", 0)
              .attr("y", "1.1em")
              .style("font-family", util.conditionMareyTooltipAttr.line2.fontFamily)
              .style("font-size", util.conditionMareyTooltipAttr.line2.fontSize)
              .style("font-weight", util.conditionMareyTooltipAttr.line2.fontWeight)
              .style("font-style", util.conditionMareyTooltipAttr.line2.fontStyle)
            const line3 = text.append("tspan")
              .attr("x", 0)
              .attr("y", "2.2em")
              .style("font-family", util.conditionMareyTooltipAttr.line3.fontFamily)
              .style("font-size", util.conditionMareyTooltipAttr.line3.fontSize)
              .style("font-weight", util.conditionMareyTooltipAttr.line3.fontWeight)
              .style("font-style", util.conditionMareyTooltipAttr.line3.fontStyle)
            
            let filter = [];
            if (vm.isMerge) {
              let stops = d3.merge(vm.data.map(d => d.stops.map(s => ({ train: d, stop: s }))))
              let merge = d3.map(d3.merge(d3.map(vm.mergeresult , d => d.merge)) , d =>d.upid),
                remainId =allupid.filter(d => merge.indexOf(d) === -1),
                select = d3.map(d3.merge(d3.map(vm.mergeresult , d => d.select)) , d =>d.upid);
              filter = d3.filter(merge , d => select.indexOf(d) === -1 );
            }
            
            
            g.append("g")
              .attr("fill", "none")
              .attr("pointer-events", "all")
              .selectAll("path")

              .data(stops)
              .join("path")
              .attr("d", (d, i) => voronoi.renderCell(i))
              .on("mouseover", (event, d) => {
                if( (filter.indexOf(d.train.upid) !==-1 && (qualityData.indexOf(d.train.upid) ===-1)) && vm.isMerge) return;
                vm.$emit("trainMouse", {upid: [d.train.upid],  mouse: 0});
                let toopcolor = vm.trainGroupStyle(d.train);
                mouseoverLine(d.train.upid);
                mouseOverRect(d.train.upid);
                tooltip
                  .style("display", null)
                  .attr("fill", util.conditionMareyTooltipAttr.line1.fontColor);
                line1.text(`upid: ${d.train.upid}`);
                line2.text(`category: ${d.train.productcategory}`);
                line3.text(`time: ${d.stop.realTime.toLocaleString(undefined, { hour: "numeric", minute: "numeric" })}`);
                path
                  .attr("fill", toopcolor);
                  // .attr("opacity", 0.96);
                const box = text.node().getBBox();
                path.attr("d", `
                  M${box.x - 10},${box.y - 10}
                  H${box.width / 2 - 5}l5,-15l5,15
                  H${box.width + 10}
                  v${box.height + 20}
                  h-${box.width + 20}
                  z
                `);
                tooltip.attr("transform", `translate(${x(d.stop.station.distance) - box.width / 2}, ${y(new Date(d.stop.time)) + 37})`);
              })
              .on("mouseout", (event, d) => {
                if( (filter.indexOf(d.train.upid) !==-1 && (qualityData.indexOf(d.train.upid) ===-1)) && vm.isMerge) return;
                vm.$emit("trainMouse", {upid: [d.train.upid],  mouse: 1});
                tooltip.style("display", "none");
                if(vm.trainSelectedList.includes(d.train.upid)) return
                mouseoutLine(d.train.upid);
                mouseOutPath();
                // mergeGopacity()
              })
          })
          // d3.select(".axisrect").raise()
          // // d3.selectAll(".processPath").raise()
          // d3.selectAll(".shadow_rect").raise()
          // d3.selectAll(".processline").raise()
          // // d3.selectAll(".monitorPath").raise()
          // d3.select(".stationsNameGroup").raise()


        function mouseoverLine(uclid) {
          const flag = dataUCL.get(uclid)[0].flag;
          d3.select("#id"+ uclid)
            .attr("stroke-width", vm.highLightStrokeWidth)
            .selectAll("rect")
            .attr("stroke", "black");
        }
        function mouseoutLine(uclid) {
          d3.select("#id"+ uclid)
            .attr("stroke-width", d => { return defaultStrokeWidth(d.tgtplatethickness2) })
            .selectAll("rect")
            .attr("stroke", "none");

          for(let m in stopsTime) {		//reset binRect
            mareyContentGroup.selectAll(`.binRect${m}`)
              .attr("fill", "#b9c6cd");
          }
        }
        function mouseOverRect(upid) {
          var distanceData = d3.pairs(dataUCL.get(upid)[0].stops, (a, b) => (new Date(b.realTime)).getTime() - (new Date(a.realTime)).getTime())
          for(let m in distanceData){
            mareyContentGroup.selectAll(`.binRect${m}`)
              .attr("fill", d => distanceData[m] <= d.x1 && d.x0 <= distanceData[m] ? vm.trainGroupStyle(dataUCL.get(upid)[0]) : "#b9c6cd")
          }
        }
        function mouseOutPath(){
          for(let m in stopsTime){		//reset binRect
            mareyContentGroup.selectAll(`.binRect${m}`)
              .attr("fill", "#b9c6cd")
          }
        }
      }
      function paintMareyBrush(mareyContentGroup) {
        let removeElement = mareyContentGroup.selectAll('.mareyMiniGroup')._groups[0][0]
        removeElement !== undefined && removeElement.remove()
        const mareyMiniGroup = mareyContentGroup.append("g")
          .attr("class", "mareyMiniGroup")

        const miniDistance = d3.min(d3.pairs(d3.map(vm.data, d => new Date(d.stops[0].time)), (a, b) => b.getTime() -a.getTime()));
        let miniMargin = { top: 115, right: 15, bottom: 200, left: 35 },
          miniheight =  mainHeight - miniMargin.top - miniMargin.bottom,
          miniwidth = 75,
          miniXScale = d3.scaleTime()
            .domain([new Date(minDate), new Date(maxDate)])
            .range([0, miniheight - miniMargin.bottom - miniMargin.top]),
          mainXZoom = d3.scaleLinear()
            .range([mareyDistance, mainHeight ])
            .domain([0, miniheight]),
          BrushSelectHeight = miniXScale(new Date(100 * miniDistance + new Date(vm.data[0].stops[0].time).getTime())),
          // data.length > 50 ? (this.isMerge ? miniXScale(new Date(data[50].stops[0].time)) : miniXScale(new Date(data[65].stops[0].time))) : (this.isMerge ? 0.5 * unitHeight : 0.3 * unitHeight),
          // miniXScale(new Date(data[65].stops[0].time.slice(0, 19))),
          // BrushSelectHeight =50,
          initialBrushXSelection = [0, BrushSelectHeight],
          brush = d3.brushY()
            .extent([[0, 0], [miniwidth - miniMargin.right - miniMargin.left, miniheight - miniMargin.bottom - miniMargin.top]])
            .on("end", brushmove);
        initialBrushXSelection = vm.initialBrushXSelection !== undefined ? vm.initialBrushXSelection : initialBrushXSelection

        const brushXPosition = width - mareyEntry - miniMargin.right - margin.right / 2;
        const miniGroup = mareyMiniGroup.append("g")
          .attr("class", "miniGroup")
          .attr("transform", `translate(${[brushXPosition, miniMargin.top]})`);
        const brushGroup = mareyMiniGroup.append("g")
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
        
        let miniBarsData = vm.isMerge ? vm.filterdata : vm.data
		    var stellheight = d3.scaleLinear()
		    	.domain([0.006, 0.16])
		    	.range([1.4, 1.5]);
		    const miniBars = miniGroup
		    	.call(g => g.selectAll(".rect")
		    		.data(miniBarsData)
		    		.join('rect')
		    			.attr("class", "rect")
		    			.attr('x', 0)
		    			.attr('y', d => miniXScale(new Date(d.stops[0].time)))
		    			.attr("id", d => "miniBar" + d.upid)
              .attr("height", d => {
                // console.log(d);
                // return stellheight(d.tgtplatethickness)
                return 1
                })
		    			.attr('width', miniwidth - miniMargin.right - miniMargin.left)
		    			.attr("fill", vm.trainGroupStyle)
              .attr("opacity", d=> miniXScale(new Date(d.stops[0].time))>initialBrushXSelection[0] && miniXScale(new Date(d.stops[0].time))<initialBrushXSelection[1] ? 0.8 : 0.7)
          )
				  .call(g => g.selectAll(".mergePath")
				  	.data(vm.isMerge ? vm.mergeresult : [])
            .join('rect')
              .attr("class", "mergePath")
				  		.attr('y', (d, i) => miniXScale(new Date(vm.mergeresult[i]["merge"][0].stops[0].time)))
				  		.attr("height", d => miniXScale(new Date(d["merge"][d["merge"].length - 1].stops[0].time)) - miniXScale(new Date(d["merge"][0].stops[0].time)))
				  		.attr('width', miniwidth - miniMargin.right - miniMargin.left)
				  		.attr("fill", (d, i) => {
				  			var mergeItem = vm.mergeresult[i]["merge"]
				  			var quality = d3.sort(d3.groups(mergeItem, d => d.flag), d=> d[1].length),
				  			pathColor = vm.changeColor ?  (quality[1] !== undefined ? vm.labelColors[quality[1][0]] : vm.labelColors[quality[0][0]]) : vm.trainGroupStyle(mergeItem[0]);
				  			return pathColor
              })
				  		.attr("opacity", 0.5)
          )
        const miniLine = mareyContentGroup
          .call(g => g.append("line")
                .attr("x1", brushXPosition)
                .attr("y1", miniMargin.top + initialBrushXSelection[0])
                .attr("class", "miniLine1")
                .style("stroke","#c9cbcc")
                .attr("x2", mareyWidth + 455)
                .attr("y2", mareyDistance + stationBottomGap)
                .style("stroke-width", 0.75))
          .call(g => g.append("line")
                .attr("class", "miniLine2")
                .attr("x1", brushXPosition)
                .attr("y1", miniMargin.top + initialBrushXSelection[1])
                .style("stroke","#c9cbcc")
                .attr("x2", mareyWidth + 455)
                .attr("y2", mainHeight)
                .style("stroke-width", 0.75))
        var miniAxis = d3.axisLeft(miniXScale)
          .ticks(d3.formatMinute)
          // .ticks(5, d3.timeFormat("%b %d %H"))
          .tickSize(0)
        var miniyAxis = g => g
          .style("font-family", util.conditionMiniYAxisTextAttr.fontFamily)
          .style("font-size", util.conditionMiniYAxisTextAttr.fontSize)
          .style("font-weight", util.conditionMiniYAxisTextAttr.fontWeight)
          .style("font-style", util.conditionMiniYAxisTextAttr.fontStyle)
          .style("color", util.conditionMiniYAxisTextAttr.fontColor)
          .call(miniAxis
            // .tickFormat(date => date.toLocaleString('en-GB', { timeZone: 'UTC' }))
          // .tickFormat(date => date.toLocaleString(undefined, { hour: "numeric" }))
          )
          .call(g => g.select(".domain").remove())
          
        const axis = mareyContentGroup
          .append("g")
          .attr("class", "axisclass")
          .attr("transform", `translate(${[brushXPosition + 30, miniMargin.top]})`)
          .call(miniyAxis)
        axis.selectAll("text").attr("text-anchor", "start")
        const defs = mareyContentGroup.append("defs");
          const filterrect =defs.append("filter").attr("id", "shadow-label")
          filterrect.append("feDropShadow")
            .attr("dx",0)
            .attr("dy", 0)
            .attr("stdDeviation", 20)
            .attr("flood-color", "#c9cbcc")
        mareyContentGroup
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
        mareyContentGroup.select(".selection")
          .attr("fill", "none")
          .attr("stroke", "#aaa")
          


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
        function brushmove(event) {
          const extentX = event.selection;
          const selected = miniXScale
            .domain()
            .filter(d => (extentX[0] + 1e-2 <= miniXScale(d)) && (miniXScale(d) <= extentX[1] - 1e-2));
          const selectTime = [miniXScale.invert(extentX[0]), miniXScale.invert(extentX[1])];
          mainXZoom.domain(extentX);
          y = d3.scaleTime()
            .domain(selectTime)
            .range([mareyDistance + stationBottomGap, mainHeight - 30]);
          line = d3.line()
            .x(d => x(d.station.distance))
            .y(d => y(new Date(d.time)));
          voronoi = Delaunay
            .from(stops, d => x(d.stop.station.distance), d => y(new Date(d.stop.time)))
            .voronoi([0, mareyDistance, mareyWidth, mareyDistance + height]);
          d3.select(".miniGroup").selectAll(".rect")
            .attr("opacity", d=> miniXScale(new Date(d.stops[0].time))>extentX[0] && miniXScale(new Date(d.stops[0].time))<extentX[1] ? 0.4 : 0.2);
          d3.select(".miniGroup").selectAll(".mergePath")
            .attr("opacity", d=> (
              (extentX[0]>miniXScale(new Date(d["merge"][0].stops[0].time)) && extentX[0]<miniXScale(new Date(d["merge"][d["merge"].length - 1].stops[0].time))) ||
              (extentX[1]>miniXScale(new Date(d["merge"][0].stops[0].time)) && extentX[1]<miniXScale(new Date(d["merge"][d["merge"].length - 1].stops[0].time))) ||
              ( (miniXScale(new Date(d["merge"][0].stops[0].time))>extentX[0] && miniXScale(new Date(d["merge"][0].stops[0].time))<extentX[1]) && 
                (miniXScale(new Date(d["merge"][d["merge"].length - 1].stops[0].time))>extentX[0] && miniXScale(new Date(d["merge"][d["merge"].length - 1].stops[0].time))<extentX[1]) )
              ) ? 0.4 : 0.2);
          d3.select(".miniLine1").attr("y1", miniMargin.top + extentX[0]);
          d3.select(".miniLine2").attr("y1", miniMargin.top + extentX[1]);
          mareyContentGroup.select(".selection")
            .attr("fill", "none")
            .attr("stroke", "#aaa");
          vm.initialBrushXSelection = extentX;

          paintMareyLine(mareyContentGroup);
          paintStationsLabel(mareyContentGroup);
        }
      }
      function shadowInit() {
        const defs = vm.svg.append("defs");
        const filtershadow =defs.append("filter").attr("id", "shadow-rect");
        const filterrect =defs.append("filter").attr("id", "shadow-card");
        filtershadow.append("feDropShadow")
          .attr("dx",0)
          .attr("dy", 0)
          .attr("stdDeviation", 2.5)
          .attr("flood-color", "#bfbdbd");
        filtershadow.append("feDropShadow")
          .attr("dx",0)
          .attr("dy", 0)
          .attr("stdDeviation", 10)
          .attr("flood-color", "#bfbdbd");
        filterrect.append("feDropShadow")
          .attr("dx",0)
          .attr("dy", 0)
          .attr("stdDeviation", 5)
          .attr("flood-color", "#ededed");
      }
    },


    deepCopy(obj) {
      if (typeof obj !== "object") return obj;
      var newObj = obj instanceof Array ? [] : {};
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (obj[key] === null) {
            newObj[key] === null;
          }
          newObj[key] = typeof obj[key] ? this.deepCopy(obj[key]) : obj[key];
        }
      }
      return newObj;
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
    renderChart(value1, value2, value3) {
      this.$nextTick(() => {
        this.isMerge = value1;
        this.minrange = value2;
        this.minconflict = value3;
        if (this.data !== undefined && this.stations !== undefined) {
          this.paintMareyChart(
            this.data,
            this.stations,
            this.changeColor,
            this.brushData
          );
          this.hightLight([]);
        }
      });
    },
    diagnosisClick(diagnosisVisible) {
      let miniLine2 = d3.selectAll('.miniLine2')
          .transition()
          .duration(1000);
      if (diagnosisVisible) {
        miniLine2.attr('y2', 500);
      }
      else {
        miniLine2.attr('y2', this.mainHeight);
      }
      
    }
  },
  mounted() {},
  computed: {
    ...mapGetters(["hightlightGroup"]),
  },
};
</script>

<style>
</style>
