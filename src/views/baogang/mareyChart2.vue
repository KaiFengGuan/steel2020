<template>
  <div :id="menuId" style="height: 100%"></div>
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
      processColor: util.processColor,
      
			svg: undefined,
      timesdata: undefined,
      stationsdata: undefined,
      brushdata: undefined,
      changecolor: true,
      isMerge: true,

      conditionView: undefined
    };
  },
  methods: {
    ...mapMutations(['hightLight']),
    paintPre(timesdata, stationsdata, changecolor, brushdata) {
      const vm = this;

      vm.timesdata = timesdata;
      vm.stationsdata = stationsdata;
      vm.brushdata = brushdata;
      vm.changecolor = changecolor;

      const WIDTH = document.getElementById(vm.menuId).offsetWidth;
      const HEIGHT = document.getElementById(vm.menuId).offsetHeight;

      vm.svg !== undefined && vm.svg.remove();
      vm.svg = d3.select('#' + vm.menuId)
        .append('svg')
        .attr('class', 'ConditionView');
      
      class ConditionView {
        constructor (container) {
          this._container = container;
          this._marey_g = undefined;
          this._info_g = undefined;
          this._moni_g = undefined;
          this._brush_g = undefined;

          this._timesdata = undefined;
          this._stationsdata = undefined;
          this._brushdata - undefined;
          this._mergeresult = undefined;
          this._mergeresult_1 = [];
          this._filterdata = undefined;
          this._dataUCL = undefined;
          this._stopsTimes = undefined;
          this._allupid = undefined;
          this._stops = undefined;
          this._qualityData = [];
          this._categorysdata = [];
          
          this._width = 0;
          this._height = 0;
          this._y_height = 0;

          this._main_magin = {
            top: 50,
            right: 70,
            bottom: 0,
            left: 100
          }
          this._info_size = {
            w: 0,
            h: 0
          };
          this._marey_size = {
            w: 0,
            norm_h: 0,
            mini_h: 0
          };
          this._stations_size = {
            h: 0,
            gap: 0,
            p_w: 0,
            p_h: 0,
            s_w: 0,
            s_h: 0
          }
          this._moni_size = {
            w: 0,
            h: 0
          };
          this._brush_margin = {
            top: 115,
            right: 15,
            bottom: 220,
            left: 35
          };
          this._brush_size = {
            w: 0,
            h: 0
          };

          this._x = undefined;
          this._y = undefined;
          this._mini_y = undefined;
          this._zoom_mini_y = undefined;
          this._line = undefined;
          this._voronoi = undefined;
          this._is_merge = true;
          this._minrange = 10;
          this._minconflict = 4;
          this._brush_select = [0, 0];
          this._change_color = true;
          this._trainGroupStyle = undefined;
          this._defaultStrokeWidth = undefined;
          this._highLightStrokeWidth = 2;
          this._zoom_for_brush = 1;

          this._coreX = 0;
          this._rectWidth = 60;
          this._circleRy = undefined;
        }

        stateInit(is_merge, changecolor) {
          this._is_merge = is_merge;
          this._change_color = changecolor;

          return this;
        }
        dataInit(timesdata, stationsdata, brushdata) {
          this._timesdata = timesdata;
          this._stationsdata = stationsdata;
          this._brushdata = brushdata;

          this._trainGroupStyle = 
            this._change_color ? 
            ( d => d.flag !== 404 ? (d.flag === 0 ? vm.labelColors[0] : vm.labelColors[1]) : vm.noflagColor) :
            ( d => vm.categoryColors(d.productcategory));
          
          this._filterdata = this._deepCopy(this._timesdata);
          if (this._is_merge) {
            this._mergeresult = this._mergeTimesData(this._timesdata, this._stationsdata);
            for (let item in this._mergeresult) {
              let mergeItem = this._mergeresult[item]['merge'];
              let mergeSelect = this._mergeresult[item]['select'];

              let mergeId = d3.map(mergeItem, d => d.upid);
              let selectId = d3.map(mergeSelect, d => d.upid);
              let quality = d3.sort(d3.groups(mergeItem, d => d.flag), d=> d[1].length);
              let pathColor = this._change_color ?  
                (quality[1] !== undefined ? vm.labelColors[quality[1][0]] : vm.labelColors[quality[0][0]]) : 
                this._trainGroupStyle(mergeItem[0]);

              this._filterdata.splice(...this._mergeresult[this._mergeresult.length-item-1]['index']);
              if(this._change_color && quality[1] !== undefined) {
                this._qualityData.push(...d3.map(quality[0][1], d=> d.upid));
              }

              // 马雷合并相关图元需要的数据
              this._mergeresult_1.push({
                item: item,
                mergeItem: mergeItem,
                mergeSelect: mergeSelect,
                mergeId: mergeId,
                selectId: selectId,
                pathColor: pathColor
              })
            }
          }
          this._dataUCL = d3.group(this._timesdata, d => d.upid);
          this._stopsTimes = d3.map(this._timesdata, d => {
            let arr = d3.pairs(d.stops, (a,b) => new Date(b.realTime).getTime() - new Date(a.realTime).getTime())
            arr.upid = d.upid
            return arr
          });
          this._allupid = d3.map(this._timesdata, d => d.upid);
          this._categorysdata = d3.group(this._timesdata , d => d.productcategory);

          return this;
        }
        chartSizeInit(width, height) {
          this._width = width;
          this._height = height;
          
          this._info_size.w = 2.6 * this._main_magin.left;
          this._info_size.h = this._height;
          this._marey_size.w = this._width - this._info_size.w - 7.6 * this._main_magin.right;
          this._marey_size.norm_h = this._height;
          this._marey_size.mini_h = 500;
          this._brush_size.w = 75;
          this._brush_size.h = this._height - this._brush_margin.top - this._brush_margin.bottom;
          
          let stations_l = this._marey_size.w / this._stationsdata.length;
          this._stations_size.h = 1.8 * this._main_magin.top;
          this._stations_size.gap = 10;
          this._stations_size.s_w = stations_l / 1.2;
          this._stations_size.s_h = this._stations_size.h - this._main_magin.top;
          this._stations_size.p_h = this._stations_size.s_w / 1.414;
          this._stations_size.p_w = (this._width - 1.5 * this._main_magin.right - this._info_size.w) / 1.414 + this._stations_size.p_h + 3;

          this._coreX = this._info_size.w * 0.55;

          return this;
        }

        render() {
          this._scaleInit();

          this._container
            .attr('width', this._width)
            .attr('height', this._y_height);

          this._shadowInit();

          
          this._renderMareyBackground();
          this._renderMareyChart();
          this._renderMareyBrush();
          this._renderInfoChart();
          
          return this;
        }

        _scaleInit() {
          let min_date = this._timesdata[0].stops[0].time;
          let max_date = this._timesdata.slice(-1)[0].stops.slice(-1)[0].time;
          let unit_h = 300;
          let unit_per_time = 3.5;
          let t_h_scale = unit_h / (60 * 60 * 1000 * unit_per_time); // 单位高度 时间跨度x小时
          this._y_height = (new Date(max_date).getTime() - new Date(min_date).getTime()) * t_h_scale;

          let m_w = this._marey_size.w - this._stations_size.p_h - 20;
          let m_h_s = this._stations_size.h + this._stations_size.gap;
          let m_h_e = this._height - this._stations_size.h - this._stations_size.gap - 50;
          let miniDistance = d3.min(d3.pairs(d3.map(this._timesdata, d => new Date(d.stops[0].time)), (a, b) => b.getTime() -a.getTime()));
          this._stops = d3.merge(this._timesdata.map(d => d.stops.map(s => ({ train: d, stop: s }))));

          this._mini_y = d3.scaleTime()
            .domain([new Date(min_date), new Date(max_date)])
            .range([0, this._brush_size.h - this._brush_margin.top - this._brush_margin.bottom]);
          this._zoom_mini_y = d3.scaleLinear()
            .domain([0, this._brush_size.h])
            .range([this._stations_size.h, this._height]);
          this._brush_select[1] = this._mini_y(new Date(100 * miniDistance + new Date(this._timesdata[0].stops[0].time).getTime()));
          this._x = d3.scaleLinear()
            .domain(d3.extent(this._stationsdata, d => d.distance))
            .range([0 , m_w]);
          this._y = d3.scaleTime()
            .domain([this._mini_y.invert(this._brush_select[0]), this._mini_y.invert(this._brush_select[1])])
            .range([m_h_s, m_h_e])
            // .range([m_h_s, m_h_s + 1]);
          this._line = d3.line()
            .x(d => this._x(d.station.distance))
            .y((d, i, arr) => this._y(new Date(arr[i].time)) - this._y(new Date(arr[0].time)));
          this._defaultStrokeWidth = d3.scaleLinear()
            .domain([0.006, 0.16])
            .range([0.5, 1.2]);
          this._voronoi = Delaunay
            .from(this._stops, d => this._x(d.stop.station.distance), d => this._y(new Date(d.stop.time)))
            .voronoi([0, this._stations_size.h, this._marey_size.w, this._stations_size.h + this._y_height]);

          return this;
        }
        _shadowInit() {
          const defs = this._container.append('defs')
            .attr('class', 'shadowGroup');
          const filtershadow =defs.append('filter')
            .attr('id', 'shadow-rect');
          const filterrect =defs.append('filter')
            .attr('id', 'shadow-card');
          filtershadow.append('feDropShadow')
            .attr('dx',0)
            .attr('dy', 0)
            .attr('stdDeviation', 2.5)
            .attr('flood-color', '#bfbdbd');
          filtershadow.append('feDropShadow')
            .attr('dx',0)
            .attr('dy', 0)
            .attr('stdDeviation', 10)
            .attr('flood-color', '#bfbdbd');
          filterrect.append('feDropShadow')
            .attr('dx',0)
            .attr('dy', 0)
            .attr('stdDeviation', 5)
            .attr('flood-color', '#ededed');
        }
        _renderMareyBackground() {
          let shadow_x = -this._stations_size.p_h + 10;
          let shadow_y = this._main_magin.top;
          let shadow_w = this._marey_size.w + 8 + this._stations_size.p_h;
          let shadow_h = this._y_height - this._main_magin.top - this._main_magin.bottom;

          let bgc = this._container.append('g')
            .attr('class', 'background');

          bgc.append('g')
            .attr('transform', `translate(${[this._info_size.w, 0]})`)
            .call(g => g.append('rect')
              .attr('x', shadow_x)
              .attr('y', shadow_y)
              .style("fill", 'white')
              .attr('width', shadow_w)
              .attr('height', shadow_h))
            .call(g => g.append('rect')
              .attr('class', 'shadow_rect')
              .attr('x', shadow_x)
              .attr('y', shadow_y)
              .style('fill', 'none')
              .attr('width', shadow_w)
              .attr('height', shadow_h))
              .attr('filter', 'url(#shadow-card)');
          
          bgc.append('g')
            .attr('transform', `translate(${[0, 0]})`)
            .call(g => g.append("rect")
              .attr("x" , this._coreX - 1.8 * 65)
              .style("fill","white")
              .attr("width", 65 * 3)
              .attr("height", this._y_height - this._main_magin.bottom))
            .call(g => g.append("rect")
              .attr("class", "shadow_rect")
              .attr("x" , this._coreX - 1.8 * 65)
              .style("fill","none")
              .attr("width", 65 + this._coreX - 20)
              .attr("height", this._y_height - this._main_magin.bottom))
              .attr("filter","url(#shadow-card)")
          
          bgc.append("g")
            .attr('transform', `translate(${[this._info_size.w + this._marey_size.w, this._stations_size.h]})`)
            .call(g => g.append("rect")
              .attr("x" , 35)
              .attr("y", 0)
              .style("fill", "white")
              .attr("width", 420)
              .attr("height", this._y_height - this._stations_size.h - this._main_magin.bottom))
            .call(g => g.append("rect")
              .attr("class", "shadow_rect")
              .attr("x" , 35)
              .attr("y", 0)
              .style("fill", "none")
              .attr("width", 420)
              .attr("height", this._y_height - this._stations_size.h - this._main_magin.bottom))
              .attr("filter","url(#shadow-card)")
        }
        _mergeTimesData(json, stations) {
          const categorys = d3.group(json , d => d.productcategory);
          const mergecategorys = [];	// merge categorys
          const minrange = this._minrange;
          const minconflict = this._minconflict;
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
            const mergedata = json.slice(item, index)

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

        // 马雷图主图
        _renderMareyChart() {
          this._marey_g === undefined ? undefined : this._marey_g.remove();
          this._marey_g = this._container.append('g')
            .attr('class', 'mareyContentGroup')
            .attr('transform', `translate(${[this._info_size.w, 0]})`);
          
          
          this._renderMareyLine();
          this._renderMareyStations();
          this._renderMareyLineTooltip();
        }
        _renderMareyLine() {
          let removeElement = this._marey_g.selectAll('.mareyGroup')._groups[0][0]
          removeElement !== undefined && removeElement.remove()

          let MareyGroup = this._marey_g.append('g')
            .attr('class', 'mareyGroup');

          this._renderMareyLineNoMerge(MareyGroup);
          this._renderMareyLineMerge(MareyGroup);
        }
        _renderMareyLineNoMerge(MareyGroup) {
          let paintdata = this._is_merge ? this._filterdata : this._timesdata;

          MareyGroup.append('g')
            .attr('class', 'mareyLineGroup')
            .selectAll('g')
            .data(paintdata)
            .join('g')
            .attr('class', 'mareyLine')
            .attr('transform', (d, i, arr) => `translate(0, ${this._y(new Date(d.stops[0].time))})`)
            .style('color', this._trainGroupStyle)
            .attr('stroke-width', d => { return this._defaultStrokeWidth(d.tgtplatethickness2) })
            .attr('id', d => ('id' + d.upid))
            .call(g => g.append('path')
              .attr('fill', 'none')
              .attr('stroke', 'currentColor')
              .attr('d', d => this._line(d.stops)));
        }
        _renderMareyLineMerge(MareyGroup) {
          if (!this._is_merge) return;

          let mergeG = MareyGroup.selectAll('mergeG')
            .data(this._mergeresult_1)
            .join('g')
            .attr('class', 'mergeG')
            .attr('id', d => `mergeG${d.item}`)
            .attr('transform', d => `translate(${[0, this._y(new Date(d.mergeItem[0].stops[0].time))]})`)
          
          let mergeArea = e => d3.area()
              .x(f => this._x(f.distance))
              .y0(f => this._y(f.time0) - this._y(e[0].time0))
              .y1(f => this._y(f.time1) - this._y(e[0].time0))(e);
          
          mergeG.append('path')
              .attr('class', 'mergerect')
              .attr('id', (d, i) => 'mergerect' + i)
              .attr('index', (d, i) => i)
              .attr('fill', d => d.pathColor)
              .attr('opacity', 0.4)
              .datum(d => d.mergeItem[0].stops.map((e, i) => {
                return {
                  distance: e.station.distance,
                  time0: new Date(e.time),
                  time1: new Date(d.mergeItem[d.mergeItem.length - 1].stops[i].time)
                }
              }))
              .attr('d', mergeArea);

          if (this._change_color) {
            let quality = datum => d3.sort(d3.groups(datum.mergeItem, d => d.flag), d => d[1].length);
            
            let y_trans = e => this._y(new Date(d.stops[0].time))(e)
            mergeG.append('g')
              .attr('class', 'quality')
              .attr('transform', d => `translate(${ [0, -this._y(new Date(d.mergeItem[0].stops[0].time))] })`)
              .attr('fill', 'white')
              .selectAll(`.select g`)
              .data(datum => {
                quality = d3.sort(d3.groups(datum.mergeItem, d => d.flag), d=> d[1].length);
                return quality[1] !== undefined ? quality[0][1] : [];
              })
              .join('g')
              .attr('class', 'mareyLine')
              .attr('transform', d => `translate(0, ${this._y(new Date(d.stops[0].time))})`)
              .style('color', this._trainGroupStyle)
              .attr('stroke-width', d => { return this._defaultStrokeWidth(d.tgtplatethickness2) } )
              .attr('id', d => ('id' + d.upid))
              .call(g => g.append('path')
                .attr('fill', 'none')
                .attr('stroke', 'currentColor')
                .attr('d', d => this._line(d.stops)));
          }
        }
        _renderMareyLineTooltip() {
          let that = this;
          let stops = d3.merge(this._timesdata.map(d => d.stops.map(s => ({ train: d, stop: s }))));
          let filter = [];
          if (this._is_merge) {
            let merge = d3.map(d3.merge(d3.map(this._mergeresult, d => d.merge)), d =>d.upid);
            let remainId =this._allupid.filter(d => merge.indexOf(d) === -1);
            let select = d3.map(d3.merge(d3.map(this._mergeresult , d => d.select)) , d =>d.upid);
            filter = d3.filter(merge , d => select.indexOf(d) === -1 );
          }

          let MareyGroup = this._marey_g;
          let removeElement = MareyGroup.selectAll('.mareyTooltipGroup')._groups[0][0];
          removeElement !== undefined && removeElement.remove();

          let tooltipGroup = MareyGroup.append('g')
            .attr('class', 'mareyTooltipGroup');
          
          let tooltip = tooltipGroup.append('g');
          let path = tooltip.append('path')
            .attr('class', 'tooltipContent')
            .attr('fill', 'rgba(245, 245, 230, 0.97)');
          
          let text = tooltip.append('text')
            .attr('class', 'tooltipContent');
          let line1 = text.append('tspan')
            .attr('x', 0)
            .attr('y', 0)
            .style('font-family', util.conditionMareyTooltipAttr.line1.fontFamily)
            .style('font-size', util.conditionMareyTooltipAttr.line1.fontSize)
            .style('font-weight', util.conditionMareyTooltipAttr.line1.fontWeight)
            .style('font-style', util.conditionMareyTooltipAttr.line1.fontStyle);
          let line2 = text.append('tspan')
            .attr('x', 0)
            .attr('y', '1.1em')
            .style('font-family', util.conditionMareyTooltipAttr.line2.fontFamily)
            .style('font-size', util.conditionMareyTooltipAttr.line2.fontSize)
            .style('font-weight', util.conditionMareyTooltipAttr.line2.fontWeight)
            .style('font-style', util.conditionMareyTooltipAttr.line2.fontStyle);
          let line3 = text.append('tspan')
            .attr('x', 0)
            .attr('y', '2.2em')
            .style('font-family', util.conditionMareyTooltipAttr.line3.fontFamily)
            .style('font-size', util.conditionMareyTooltipAttr.line3.fontSize)
            .style('font-weight', util.conditionMareyTooltipAttr.line3.fontWeight)
            .style('font-style', util.conditionMareyTooltipAttr.line3.fontStyle);

          tooltipGroup.append('g')
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .selectAll('path')
            .data(stops)
            .join('path')
            .attr('d', (d, i) => this._voronoi.renderCell(i))
            .on('mouseover', (event, d) => {
              if((filter.indexOf(d.train.upid) !== -1 && (this._qualityData.indexOf(d.train.upid) === -1)) && this._is_merge) return;

              vm.$emit('trainMouse', {upid: [d.train.upid],  mouse: 0});
              let toopcolor = this._trainGroupStyle(d.train);
              mouseoverLine(d.train.upid);
              mouseOverRect(d.train.upid);
              tooltip
                .style('display', null)
                .attr('fill', util.conditionMareyTooltipAttr.line1.fontColor);
              let t_info = d.stop.realTime.toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
              line1.text(`upid: ${d.train.upid}`);
              line2.text(`category: ${d.train.productcategory}`);
              line3.text(`time: ${t_info}`);
              path
                .attr('fill', toopcolor);
              
              const box = text.node().getBBox();
              path.attr('d', `
                M${box.x - 10},${box.y - 10}
                H${box.width / 2 - 5}l5,-15l5,15
                H${box.width + 10}
                v${box.height + 20}
                h-${box.width + 20}
                z
              `);
              tooltip.attr('transform', `translate(${this._x(d.stop.station.distance) - box.width / 2}, ${this._y(new Date(d.stop.time)) + 37})`);
            })
            .on('mouseout', (event, d) => {
              if((filter.indexOf(d.train.upid) !== -1 && (this._qualityData.indexOf(d.train.upid) === -1)) && this._is_merge) return;

              vm.$emit('trainMouse', {upid: [d.train.upid],  mouse: 1});
              tooltip.style('display', 'none');
              mouseoutLine(d.train.upid);
              mouseOutPath();
              // mergeGopacity()
            })
          
          function mouseoverLine(uclid) {
            let flag = that._dataUCL.get(uclid)[0].flag;
            d3.select('#id' + uclid)
              .attr('stroke-width', that._highLightStrokeWidth)
              .selectAll('rect')
              .attr('stroke', 'black');
          }
          function mouseoutLine(uclid) {
            d3.select('#id' + uclid)
              .attr('stroke-width', d => { return that._defaultStrokeWidth(d.tgtplatethickness2) })
              .selectAll('rect')
              .attr('stroke', 'none');

            for(let m in that._stopsTimes) {		//reset binRect
              that._marey_g.selectAll(`.binRect${m}`)
                .attr('fill', '#b9c6cd');
            }
          }
          function mouseOverRect(upid) {
            let distanceData = d3.pairs(
              that._dataUCL.get(upid)[0].stops, 
              (a, b) => (new Date(b.realTime)).getTime() - (new Date(a.realTime)).getTime());

            for(let m in distanceData){
              that._marey_g.selectAll(`.binRect${m}`)
                .attr('fill', d => distanceData[m] <= d.x1 && d.x0 <= distanceData[m] ? that._trainGroupStyle(that._dataUCL.get(upid)[0]) : "#b9c6cd")
            }
          }
          function mouseOutPath(){
            for(let m in that._stopsTimes){		//reset binRect
              MareyGroup.selectAll(`.binRect${m}`)
                .attr('fill', '#b9c6cd')
            }
          }

        }
        _renderMareyStations() {
          let stopsTime = d3.map(this._timesdata, d => {
            let arr = d3.pairs(d.stops, (a,b) => new Date(b.realTime).getTime() - new Date(a.realTime).getTime())
            arr.upid = d.upid
            return arr
          });
          let timebins = stopsTime[0].map((d, i) => {
            return d3.bin().thresholds(20)(d3.map(stopsTime, (e,f) => e[i]))
          });
          let binxScale = timebins.map(d => 
            d3.scaleLinear()
              .domain([d[0].x0, d[d.length - 1].x1])
              .range([5, this._stations_size.s_w - 5])
          );
          let binYScale = timebins.map(d => 
            d3.scaleLinear()
              .domain([0, d3.max(d, e => e.length)])
              .range([0, this._stations_size.s_h - 10])
          );

          let removeElement = this._marey_g.selectAll('.stationsNameGroup')._groups[0][0];
          removeElement !== undefined && removeElement.remove();

          let stationsNameGroup = this._marey_g.append('g')
            .attr('class', 'stationsNameGroup');
          stationsNameGroup.append('g')
            .attr('class', 'axisrect')
            .call(g => g.append('rect')
              .attr('class', 'background')
              .attr('y', 0)
              .attr('x', -15)
              .style('fill','white')
              .attr('width', this._width - this._info_size.w + 15)
              .attr('height', this._stations_size.h + this._stations_size.gap));
          
          let stations_l = this._marey_size.w / this._stationsdata.length;
          let rectDistance = (stations_l - this._stations_size.s_w)/2;
          let statname = d3.map(this._stationsdata, d => d.name);
          let stationcolor = vm.processColor;
          let xRect = g => g.append("polygon")
            .attr("transform", `translate(${-this._stations_size.p_h/2 - 6} ,${this._main_magin.top -1.5}) rotate(-45)`)
            .attr("id", "rectxLine")
            .attr("points", `0, 0  ${this._stations_size.p_w},${this._stations_size.p_w} ${112 - this._stations_size.p_h + this._stations_size.p_w}, ${this._stations_size.p_w}  ${112 - this._stations_size.p_h}, 0`)
            .attr("fill", "none")
            .attr("stroke", "#c4c4c4")
            .attr("stroke-width", 0.15)
            .attr("filter","url(#shadow-rect)");
          let xAxis = g => g
            .attr('class', 'labelPolygon')
            .selectAll('g')
            .data(this._stationsdata)
            // .data(stations.filter((d,i) => i !== stations.length - 4))
            .join('g')
            .attr('transform', (d, i) => `translate(${this._x(d.distance) + this._stations_size.p_h + rectDistance}, -2)`)
            .attr('i', (d, i) => i)
            .call(g => g.append('polygon')
              .attr('transform', `translate(${-this._stations_size.p_h}, ${this._main_magin.top}) rotate(-45)`)
              .attr('points', `0, 0 ${this._stations_size.p_h}, ${this._stations_size.p_h} 110, ${this._stations_size.p_h} ${110 - this._stations_size.p_h}, 0`)
              .attr('fill', (d,i) => statname.indexOf(d.name) <6 ? stationcolor [0] : (statname.indexOf(d.name) > this._stationsdata.length - 4 ? stationcolor [2] : stationcolor [1]))
              .attr('id', d => 'polygon' + d.name)
              .attr('stroke', 'none'))
            .call(g => g.append('text')
              .attr('transform', `translate(-4 ,${this._main_magin.top -1.5}) rotate(-45)`)
              .attr('id', d => 'station' + d.name)
              .attr('x', 8)
              .attr('dy', '0.25em')
              .attr('font-family', util.conditionPolygonTextAttr.fontFamily)
              .attr('fill', util.conditionPolygonTextAttr.fontColor)
              .style('font-size', util.conditionPolygonTextAttr.fontSize)
              .attr('font-weight', util.conditionPolygonTextAttr.fontWeight)
              .style('font-style', util.conditionPolygonTextAttr.fontStyle)
              .text(d => d.name
                .replace(/harging/, 'harge')
                .replace(/Cc/, 'C')
                .replace(/ing/, '')
                .replace(/Pass/, '')
                .replace(/arge/, '')
                .replace(/CDQ/, 'DQ')
                .replace(/CAC/, 'AC')))
            .on('mouseover', statOver)
            .on('mouseout', statOut);
          let timedistance = g => g
            .attr('class', 'labelRect')
            .selectAll('g')
            .data(this._stationsdata)
            .join('g')
            .attr('transform', d => `translate(${[this._x(d.distance) + rectDistance, this._stations_size.h - 1]})`)
            .call(g => g.append('rect')
              .attr('y', this._main_magin.top - this._stations_size.h)
              .attr('fill', (d,i) => d3.color(i < 6 ? stationcolor[0] : (i> this._stationsdata.length - 4 ? stationcolor [2] : stationcolor [1])))
              .attr('opacity', 0.6)
              .attr('stroke', (d,i) => d3.color(i < 6 ? stationcolor[0] : (i> this._stationsdata.length - 4 ? stationcolor [2] : stationcolor [1])))
              .attr('stroke-width', 1)
              .attr('width', this._stations_size.s_w)
              .attr('height', this._stations_size.h - this._main_magin.top)
              .attr('filter','url(#shadow-card)'));
          stationsNameGroup.append('g')
            .call(xRect)
            .call(xAxis);
          stationsNameGroup.append('g')
            .call(timedistance);

          let timebinsGroup = stationsNameGroup.append('g')
            .attr('class', 'timebinsGroup');
          for(let bin in this._stationsdata.slice(0, -1)){
            timebinsGroup.append("g")
              .attr('transform', `translate(${[this._x(this._stationsdata[bin].distance), this._stations_size.h - 1]})`)
              .selectAll('.binRect')
              .data(timebins[bin])
              .join('rect')
                .attr('class', `binRect${bin}`)
                .attr('x', d => binxScale[bin](d.x0) + 1)
                .attr('fill', '#b9c6cd')
                .attr('stroke', '#aaa')
                .attr('stroke-width', 0.25)
                .attr('width', d =>  binxScale[bin](d.x1) - binxScale[bin](d.x0))
                .attr('y', d => - binYScale[bin](d.length))
                .attr('height', d => binYScale[bin](d.length))
          }

          // 站点提示线
          stationsNameGroup.append('g')
            .attr('class', 'stationsLine')
            .selectAll('g')
            .data(this._stationsdata)
            .join('g')
            .attr('transform', d => `translate(${this._x(d.distance)}, 0)`)
            .call(g => g.append('line')
              .attr('y1', this._main_magin.top - 3)
              .attr('class', 'processline')
              .attr('y2', this._y_height - this._main_magin.bottom + 3)
              .attr('class', (d,i) => `mline${i}`)
              .attr('stroke-width' , 0.5)
              .attr('opacity' , 0.4)
              .attr('stroke' , (d , i) => d3.color(
                i < 6 ? 
                stationcolor [0] : 
                (i > this._stationsdata.length - 4 ? stationcolor [2] : stationcolor [1])
              ))
            );

          let that = this;
          function statOver(e, m) {
            let i = d3.select(this).attr('i')
            d3.select('#polygon' + m.name)
              .attr('fill', (d,i) => 
                d3.color(
                  statname.indexOf(d.name) <6 ? 
                  stationcolor [0] : 
                  (statname.indexOf(d.name) > that._stationsdata.length - 4 ? stationcolor [2] : stationcolor [1])
                ).darker(0.2))
            d3.selectAll(`.mline${i}`)
              .attr('stroke-width', 2.5)
            d3.selectAll(`.mline${i++}`)
              .attr('stroke-width', 2.5)
            d3.select('#station' + m.name)
              .attr('font-weight', 'bold')
          }
          function statOut (e,m){
            let i = d3.select(this).attr('i')
            d3.select('#polygon' + m.name)
              .attr('fill', (d,i) => 
                statname.indexOf(d.name) <6 ? 
                stationcolor [0] : 
                (statname.indexOf(d.name) > that._stationsdata.length - 4 ? stationcolor [2] : stationcolor [1]))
            d3.selectAll(`.mline${i}`)
              .attr('stroke-width', 0.5)
            d3.selectAll(`.mline${i++}`)
              .attr('stroke-width', 0.5)
            d3.select('#station' + m.name)
              .attr('font-weight', 'normal')
          }
        }

        // 马雷图刷子
        _renderMareyBrush() {
          this._brush_g === undefined ? undefined : this._brush_g.remove();

          let brushXPosition = this._width - this._brush_margin.right - this._main_magin.right / 2;
          this._brush_g = this._container.append('g')
            .attr('class', 'mareyBrushGroup')
            .attr('transform', `translate(${[brushXPosition, this._brush_margin.top]})`);
          
          this._renderMareyBrushContent();
          this._renderMareyBrushHandle();
          this._renderMareyBrushLinkLine();
          this._renderMareyBrushAxis();
        }
        _renderMareyBrushContent() {
          let miniGroup = this._brush_g.append('g')
            .attr('class', 'miniGroup');
          let mini_g_w = this._brush_size.w - this._brush_margin.right - this._brush_margin.left;

          miniGroup
            .call(g => g.selectAll('.rect')
		    	  	.data(this._is_merge ? this._filterdata : this._timesdata)
		    	  	.join('rect')
		    	  		.attr('class', 'rect')
		    	  		.attr('x', 0)
		    	  		.attr('y', d => this._mini_y(new Date(d.stops[0].time)))
		    	  		.attr('id', d => 'miniBar' + d.upid)
                .attr('height', 1)
		    	  		.attr('width', mini_g_w)
		    	  		.attr("fill", this._trainGroupStyle)
                .attr("opacity", d=> 
                  this._mini_y(new Date(d.stops[0].time)) > this._brush_select[0] && 
                  this._mini_y(new Date(d.stops[0].time)) < this._brush_select[1] ? 
                  0.8 : 0.7)
            )
            .call(g => g.selectAll('.mergePath')
              .data(this._is_merge ? this._mergeresult : [])
              .join('rect')
                .attr('class', 'mergePath')
                .attr('y', d => this._mini_y(new Date(d['merge'][0].stops[0].time)))
                .attr('height', d => 
                  this._mini_y(new Date(d['merge'][d['merge'].length - 1].stops[0].time)) - 
                  this._mini_y(new Date(d["merge"][0].stops[0].time)))
                .attr('width', mini_g_w)
                .attr('fill', (d, i) => {
                  let mergeItem = d['merge'];
                  let quality = d3.sort(d3.groups(mergeItem, d => d.flag), d=> d[1].length);
                  let pathColor = this._change_color ? 
                    (quality[1] !== undefined ? vm.labelColors[quality[1][0]] : vm.labelColors[quality[0][0]]) : 
                    this._trainGroupStyle(mergeItem[0]);
                  return pathColor
                })
                .attr('opacity', 0.5)
            )
        }
        _renderMareyBrushHandle() {
          let that = this;
          let brushGroup = this._brush_g.append('g')
            .attr('class', 'brushWrapper');

          let x0_y0 = [0, 0];
          let x1_y1 = [this._brush_size.w - this._brush_margin.right - this._brush_margin.left, this._brush_size.h - this._brush_margin.bottom - this._brush_margin.top];
          let brush = d3.brushY()
            .extent([x0_y0, x1_y1])
            .on('end', brushed)
            .on('brush', brushing);

          let zoom_extent = [[this._brush_margin.left, this._brush_margin.top], 
            [this._brush_size.w-this._brush_margin.right, this._brush_size.h - this._brush_margin.bottom]];
          let zoom = d3.zoom()
            .translateExtent(zoom_extent)
            .extent(zoom_extent)
            .on('zoom', zoomed);
            
          let brushElement = brushGroup.append('g')
            .attr('class', 'brush')
            .call(brush)
            .call(zoom)
            .on('mousedown.zoom', null);
          brushGroup.select(".overlay")
            .attr("stroke", "#aaa")
            .style("stroke-width", 0.25)
            .each(d => d.type = "selection")
            .on("mousedown touchstart", function (event) {
              brushcenter(event);
            });
          
          brushElement.call(brush.move, this._brush_select);
          brushGroup.select(".selection")
            .attr("fill", "none")
            .attr("stroke", "#aaa");
          
          function brushcenter(event) {
            let selection = d3.brushSelection(brushElement.node()),
              size = selection[1] - selection[0],
              range = that._mini_y.range(),
              cx = d3.pointer(event)[1],
              x0 = cx - size / 2,
              x1 = cx + size / 2,
              y1 = d3.max(range) ,
              pos = x1 > y1 ? [y1 - size, y1] : x0 < 0 ? [0, size] : [x0, x1];
            brushElement.call(brush.move, pos);
          }
          function brushing(event) {
            const extentX = event.selection;
            d3.select(".miniLine1").attr("y1", that._brush_margin.top + extentX[0]);
            d3.select(".miniLine2").attr("y1", that._brush_margin.top + extentX[1]);
          }
          function brushed(event) {
            let extentX = event.selection;
            // let selected = this._mini_y
            //   .domain()
            //   .filter(d => (extentX[0] + 1e-2 <= miniXScale(d)) && (miniXScale(d) <= extentX[1] - 1e-2));
            let selectTime = [that._mini_y.invert(extentX[0]), that._mini_y.invert(extentX[1])];
            that._zoom_mini_y.domain(extentX);
            that._y = d3.scaleTime()
              .domain(selectTime)
              .range([that._stations_size.h + that._stations_size.gap, that._height - that._stations_size.h - that._stations_size.gap - 50]);
            
            d3.select(".miniGroup").selectAll(".rect")
              .attr("opacity", d=> 
                that._mini_y(new Date(d.stops[0].time))>extentX[0] && 
                that._mini_y(new Date(d.stops[0].time))<extentX[1] ? 0.4 : 0.2);
            d3.select(".miniGroup").selectAll(".mergePath")
              .attr("opacity", d=> (
                (extentX[0]>=that._mini_y(new Date(d["merge"][0].stops[0].time)) && extentX[0]<=that._mini_y(new Date(d["merge"][d["merge"].length - 1].stops[0].time))) ||
                (extentX[1]>=that._mini_y(new Date(d["merge"][0].stops[0].time)) && extentX[1]<=that._mini_y(new Date(d["merge"][d["merge"].length - 1].stops[0].time))) ||
                ( (that._mini_y(new Date(d["merge"][0].stops[0].time))>extentX[0] && that._mini_y(new Date(d["merge"][0].stops[0].time))<extentX[1]) && 
                  (that._mini_y(new Date(d["merge"][d["merge"].length - 1].stops[0].time))>extentX[0] && that._mini_y(new Date(d["merge"][d["merge"].length - 1].stops[0].time))<extentX[1]) )
                ) ? 0.4 : 0.2);
            that._brush_g.select(".selection")
              .attr("fill", "none")
              .attr("stroke", "#aaa");
            
            that._brush_select = extentX;
            
            that._mareyChartTranslate();
          }
          function zoomed(event) {
            let zoom_step = 5;
            let mini_select = 5;
            let k = event.transform.k;
            let brush_select = that._brush_select;
            let rect_h = that._brush_size.h - that._brush_margin.bottom - that._brush_margin.top;
            
            if (that._zoom_for_brush - k > 0) {
              if (brush_select[1] + zoom_step <= rect_h) {
                brush_select[1] = brush_select[1] + zoom_step;
              }
              else {
                brush_select[1] = rect_h;
              }
              if (brush_select[0] - zoom_step >= 0) {
                brush_select[0] = brush_select[0] - zoom_step;
              }
              else {
                brush_select[0] = 0
              }
            }
            else if (that._zoom_for_brush - k < 0) {
              let gap = (brush_select[1] - zoom_step) - (brush_select[0] + zoom_step)
              if (gap >= mini_select) {
                brush_select[0] = brush_select[0] + zoom_step;
                brush_select[1] = brush_select[1] - zoom_step;
              }
            }

            that._zoom_for_brush = k   // 保存状态
            brushElement.call(brush.move, brush_select);
          }
        }
        _renderMareyBrushLinkLine() {
          let s_x = this._width - this._brush_margin.right - this._main_magin.right / 2;
          let e_x = this._width - this._brush_size.w;
          
          this._container
            .call(g => g.append("line")
              .attr("class", "miniLine1")
              .attr("x1", s_x)
              .attr("y1", this._brush_margin.top + this._brush_select[0])
              .attr("x2", e_x)
              .attr("y2", this._stations_size.h + this._stations_size.gap)
              .style("stroke", "#c9cbcc")
              .style("stroke-width", 0.75))
            .call(g => g.append("line")
              .attr("class", "miniLine2")
              .attr("x1", s_x)
              .attr("y1", this._brush_margin.top + this._brush_select[1])
              .attr("x2", e_x)
              .attr("y2", this._marey_size.norm_h)
              .style("stroke", "#c9cbcc")
              .style("stroke-width", 0.75))
        }
        _renderMareyBrushAxis() {
          let miniAxis = d3.axisLeft(this._mini_y)
            .ticks(d3.formatMinute)
            // .ticks(5, d3.timeFormat("%b %d %H"))
            .tickSize(0)
          let miniyAxis = g => g
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
            
          let axis = this._brush_g
            .append("g")
            .attr("class", "axisclass")
            .attr("transform", `translate(${[30, 0]})`)
            .call(miniyAxis)
          axis.selectAll("text").attr("text-anchor", "start")
        }

        // 整图过渡动画
        _mareyChartTranslate() {
          this._translateMareyLine();
        }
        _translateMareyLine() {
          let line_tran = d3.transition()
            .delay(50)
            .duration(500)
            // .ease(d3.easeLinear);
          let marey_group = this._marey_g.select('.mareyGroup');
          let mergeLine = d => this._line(d.stops)
    
          marey_group
            .select('.mareyLineGroup')
            .selectAll('.mareyLine')
            .transition(line_tran)
            .attr('transform', (d, i, arr) => `translate(0, ${this._y(new Date(d.stops[0].time))})`)
            .call(g => g.selectAll('path')
              .attr('d', mergeLine));
          if (this._is_merge) {
            let mergeArea = e => d3.area()
                .x((d, i) => this._x(d.distance))
                .y0((d, i) => this._y(d.time0) - this._y(e[0].time0))
                .y1((d, i) => this._y(d.time1) - this._y(e[0].time0))(e);
            
            marey_group.selectAll('.mergeG')
              .transition(line_tran)
              .attr('transform', d => `translate(${[0, this._y(new Date(d.mergeItem[0].stops[0].time))]})`);
            marey_group.selectAll('.mergeG .mergerect')
              .transition(line_tran)
              .attr('d', mergeArea)
            marey_group.selectAll('.quality')
              .transition(line_tran)
              .attr('transform', d => `translate(${ [0, -this._y(new Date(d.mergeItem[0].stops[0].time))] })`)
              .selectAll('.mareyLine')
              .attr('transform', d => `translate(0, ${this._y(new Date(d.stops[0].time))})`)
              .call(g => g.selectAll("path")
                .attr('d', mergeLine))
          }
          
          this._voronoi = Delaunay
              .from(this._stops, d => this._x(d.stop.station.distance), d => this._y(new Date(d.stop.time)))
              .voronoi([0, this._stations_size.h, this._marey_size.w, this._stations_size.h + this._y_height]);
          this._renderMareyLineTooltip();
        }

        // 左边批次信息
        _renderInfoChart() {
          this._info_g === undefined ? undefined : this._info_g.remove();
          this._info_g = this._container.append('g')
            .attr('class', 'infoContentGroup')
            .attr('transform', `translate(${[0, 0]})`);
          
          this._renderInfoLinkMergeArea();
        }
        _renderInfoLinkMergeArea() {
          let LinkG = this._info_g.append('g')
            .attr('class', 'InfoGroup');

          let linkRectMerge = LinkG.selectAll('.linkRectMerge')
            .data(this._mergeresult_1)
            .join('g')
            .attr('class', 'linkRectMerge')
            .attr('id', d => `linkRectMerge${d.item}`)
            .attr('transform', d => `translate(${[0, this._y(new Date(d.mergeItem[0].stops[0].time))]})`)
          
          // linkRectMerge
          //   .attr('d', d => {
          //     let circleRy = (
          //       this._y((new Date(d.mergeItem[d.mergeItem.length - 1].stops[0].time))) + 
          //       this._y((new Date(d.mergeItem[0].stops[0].time)))
          //     ) / 2;
          //     let position = [this._coreX, circleRy];
          //     let pathHeight = (this._y((new Date(d.mergeItem[mergeItem.length - 1].stops[0].time)))- this._y((new Date(mergeItem[0].stops[0].time))));

          //     return d3.linkHorizontal()({
          //       source: [position[0] + this._rectWidth, position[1]],
          //       target: [this._info_size.w - 10, (circleRy > 90 - pathHeight/2 && circleRy < 90 + pathHeight / 2) ? (circleRy + pathHeight/2 - 90)/2 + 90 : circleRy]
          //     })
          //   })
          //   .attr("stroke", d => {
          //     let quality = d3.sort(d3.groups(d['merge'], d => d.flag), d=> d[1].length);
          //     let pathColor = this._change_color ?  
          //       (quality[1] !== undefined ? vm.labelColors[quality[1][0]] : vm.labelColors[quality[0][0]]) : 
          //       this._trainGroupStyle(mergeItem[0]);
                
          //     return pathColor})
          //   .attr("opacity", 0.4)
          //   .attr("fill", "none")
          //   .attr("stroke-width", 2)
          
          // LinkG.selectAll('.MergeHeight')
          //   .data(this._mergeresult)
          //   .append("rect")
          //   .attr("transform", `translate(${[this._info_size.w - 10, y((new Date(mergeItem[0].stops[0].time)))]})`)
          //   .attr("width", 2)
          //   .attr("height", pathHeight)
          //   .attr("fill", pathColor)
          //   .attr("opacity", 0.4)
        }

        _deepCopy(obj) {
          if (typeof obj !== "object") return obj;
          var newObj = obj instanceof Array ? [] : {};
          for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
              if (obj[key] === null) {
                newObj[key] === null;
              }
              newObj[key] = typeof obj[key] ? this._deepCopy(obj[key]) : obj[key];
            }
          }
          return newObj;
        }
      }

      vm.conditionView = new ConditionView(vm.svg);
      vm.conditionView
        .stateInit(vm.isMerge, vm.changecolor)
        .dataInit(vm.timesdata, vm.stationsdata, vm.brushdata)
        .chartSizeInit(WIDTH, HEIGHT)
        .render();
    },
    mouse(value) {
			const vm = this
			if(value.mouse===0) {
				d3.select(`#id${value.upid}`)
					.attr("stroke-width", vm.conditionView._highLightStrokeWidth)
					.selectAll("rect")
					.attr("stroke", "black");
				d3.select(`#miniBar${value.upid}`)
					.attr("fill", d=>  d3.color(vm.conditionView._trainGroupStyle(d)).darker(1))
			}else {
				d3.select(`#id${value.upid}`)
					.attr("stroke-width", d => { return vm.conditionView._defaultStrokeWidth(d.tgtplatethickness2) })
					.selectAll("rect")
					.attr("stroke", "none");
				d3.select(`#miniBar${value.upid}`)
					.attr("fill", d=>  vm.conditionView._trainGroupStyle(d))
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
