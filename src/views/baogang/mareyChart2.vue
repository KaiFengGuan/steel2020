<template>
  <div :id="menuId" style="height: 100%"></div>
</template>

<script>
import * as d3 from "d3";
import { Delaunay } from "d3-delaunay";
import util from "./util.js";
import { mapGetters, mapMutations } from "vuex";
import info_state from "assets/images/info_state.svg"
import info_state1 from "assets/images/info_state1.svg"
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

      conditionView: undefined,
      minrange: 10,
      minconflict: 4
    };
  },
  methods: {
    ...mapMutations(['hightLight']),
    paintPre(timesdata, stationsdata, changecolor, brushdata, isMerge) {
      const vm = this;
      
      vm.timesdata = timesdata;
      vm.stationsdata = stationsdata;
      vm.brushdata = brushdata;
      vm.changecolor = changecolor;
      vm.isMerge = isMerge;

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
          this._brushUCL = undefined;
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

          // 全局坐标轴参数
          this._x = undefined;
          this._y = undefined;
          this._mini_y = undefined;
          this._zoom_mini_y = undefined;
          this._brush = undefined;
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
          this._line_tran = undefined;

          this._coreX = 0;
          this._rectWidth = 60;
          this._info_bgc_w = 195;
          this._detail_rect_w = this._rectWidth * 2.5;
          this._detail_gap = 10;
          this._mergeClickValue = [];
          this._trainSelectedList = [];
          this._polygon_offset = 5;
          this._arc_start = -Math.PI/6;
          this._arc_gap_angle = 0.1;
          this._uniformity_pr_angle = Math.PI/3;
          this._proportion_pr_angle = 0;
          this._proportion_stage_angle = [];
          this._proportion_sub_angle = [];
          this._uniformity_angle = undefined;
          this._proportion_angle = undefined;

          // 左边批次信息统计参数
          this._info_state = true;  // uniformity模式
          this._circleR = this._detail_rect_w / 2;
          this._inner_outer_gap = 4;
          this._outer_arc_width = 8;
          this._inner_arc_width = this._outer_arc_width/0.618;
          this._inner_arc_r1 = this._detail_rect_w/2 * 0.4;
          this._inner_arc_r2 = this._inner_arc_r1 + this._inner_arc_width;
          this._outer_arc_r1 = this._inner_arc_r2 + this._inner_outer_gap;
          this._outer_arc_r2 = this._outer_arc_r1 + this._outer_arc_width;
          this._inner_err_w = 1.5;
          this._outer_err_w = 1;
          this._quantile_r2 = this._inner_arc_r1 - 4
          this._quantile_r1 = this._quantile_r2 - 3;

          this._QScale = undefined;
          this._T2Scale = undefined;
          this._QLine = undefined;
          this._T2Line = undefined;
          this._statistics = undefined;
        }

        stateInit(is_merge, changecolor, minrange, minconflict) {
          this._is_merge = is_merge;
          this._change_color = changecolor;
          this._minrange = minrange;
          this._minconflict = minconflict;

          return this;
        }
        __getPathColor(datalist) {
          let quality = d3.sort(d3.groups(datalist, d => d.flag), d=> d[1].length);
          let last_quality = quality.slice(-1);
          let pathColor = this._change_color ?  
            (last_quality[0][0] !== 404 ? vm.labelColors[last_quality[0][0]] : vm.noflagColor) : 
            this._trainGroupStyle(datalist[0]);

          return pathColor;
        }
        __getAllDataExtend(merge_plates, p, need_sub, must_good) {
          const computeExtend = d => [0, d3.quantile(d, p)];

          let fu_arr = [], m_arr = [], c_arr = [], t_arr = [];
          let sub_arr = [];

          for (let i in merge_plates) {
            let item_data = merge_plates[i];
            let item_data_stops = item_data.stops;
            let single_arr = [];

            if (must_good && item_data.flag !== 1) continue;     // 只考虑好的钢板作为extent

            fu_arr.push(item_data.fuTotalTimeAfter * 1000);
            m_arr.push(item_data.mtotalTime * 1000);
            c_arr.push(item_data.ccTotalTime * 1000);
            t_arr.push(new Date(item_data_stops[0].time))

            for (let j in this._stationsdata.slice(0, -1)) {
              let stations_item = this._stationsdata[j];
              let time_spend = 0;
              for (let k in item_data_stops.slice(0, -1)) {
                if (stations_item.key === item_data_stops[k].station.key) {
                  time_spend = (new Date(item_data_stops[(+k)+1].time)).getTime() - (new Date(item_data_stops[k].time))
                }
              }
              single_arr.push(time_spend)
            }
            sub_arr.push(single_arr)
          }

          // fu_arr = fu_arr.filter(d => d!==0)
          // m_arr = m_arr.filter(d => d!==0)
          // c_arr = c_arr.filter(d => d!==0)
          t_arr = d3.pairs(t_arr, (a, b) => b - a)
          let fu_extent = computeExtend(fu_arr);
          let m_extent = computeExtend(m_arr);
          let c_extent = computeExtend(c_arr);
          // let t_extent = computeExtend(t_arr);
          let t_extent = [0, d3.quantile(t_arr, 0.75)]

          if (!need_sub) {
            return [t_extent, fu_extent, m_extent, c_extent]
          }

          let sub_extent = [];
          let sub_extent_for_stations = [];
          for (let i = 0; i < 16; i++) {
            let a = [];
            sub_arr.forEach(d => a.push(d[i]));
            let res = a.filter(e => e !== 0)
            sub_extent.push(computeExtend(res));
            sub_extent_for_stations.push(d3.mean(res));
          }
          sub_extent_for_stations = [
            ...sub_extent_for_stations.slice(0, 5), 
            ...sub_extent_for_stations.slice(6, 13), 
            ...sub_extent_for_stations.slice(14, 16)]
          

          const _2PI = 2 * Math.PI;
          let remain_2PI = _2PI - this._arc_gap_angle*4;
          let m_t = d3.mean(t_arr), m_fu = d3.mean(fu_arr), m_m = d3.mean(m_arr), m_c = d3.mean(c_arr);
          let sum_stage_time = d3.sum([m_t, m_fu, m_m, m_c]);
          let p_t_angle = m_t / sum_stage_time * remain_2PI,
            p_fu_angle = m_fu / sum_stage_time * remain_2PI,
            p_m_angle = m_m / sum_stage_time * remain_2PI,
            p_c_angle = m_c / sum_stage_time * remain_2PI;
          this._proportion_pr_angle = p_t_angle;
          this._proportion_stage_angle = [p_fu_angle, p_m_angle, p_c_angle];
          // console.log(this._proportion_pr_angle, this._proportion_stage_angle);
          // console.log(sub_extent_for_stations)
            
          let p_sub_angle = [[],[],[]];
          let sum_sub_extent = d3.sum(sub_extent_for_stations)
          let sum_fu_sub_extent = d3.sum(sub_extent_for_stations.slice(0, 5))
          let sum_m_sub_extent = d3.sum(sub_extent_for_stations.slice(5, 12))
          let sum_c_sub_extent = d3.sum(sub_extent_for_stations.slice(12, 14))
          // console.log(sum_fu_sub_extent, sum_m_sub_extent, sum_c_sub_extent)
          for (let i = 0; i < 14; i++) {
            let res = sub_extent_for_stations[i] / sum_sub_extent;

            (i>=0&&i<=4) ?
            p_sub_angle[0].push(sub_extent_for_stations[i]/sum_fu_sub_extent) : 
            (i>=5&&i<=11) ? 
            p_sub_angle[1].push(sub_extent_for_stations[i]/sum_m_sub_extent) : 
            (i>=12&&i<=13) ? 
            p_sub_angle[2].push(sub_extent_for_stations[i]/sum_c_sub_extent) : 
            undefined
          }
          this._proportion_sub_angle = p_sub_angle;
          
          return [t_extent, fu_extent, m_extent, c_extent, sub_extent]
        }
        __getLabelStatistics(data) {
          let m = data.length;
          let good = data.filter(d => d.flag==1).length / m;
          let bad = data.filter(d => d.flag==0).length / m;
          let no_flag = data.filter(d => d.flag!=1 && d.flag!=0).length / m;

          return [good, bad, no_flag]
        }
        dataInit(timesdata, stationsdata, brushdata) {
          this._timesdata = timesdata;
          this._stationsdata = stationsdata;
          this._brushdata = brushdata;

          this._trainGroupStyle = 
            this._change_color ? 
            ( d => d.flag !== 404 ? (d.flag === 0 ? vm.labelColors[0] : vm.labelColors[1]) : vm.noflagColor) :
            ( d => vm.categoryColors(d.productcategory));
          
          this._filterdata = [];
          this._allupid = d3.map(this._timesdata, d => d.upid);
          this._categorysdata = d3.group(this._timesdata , d => d.productcategory);
          this._dataUCL = d3.group(this._timesdata, d => d.upid);
          this._brushUCL = d3.group(this._brushdata, d => d.upid);
          this._stopsTimes = d3.map(this._timesdata, d => {
            let arr = d3.pairs(d.stops, (a,b) => new Date(b.realTime).getTime() - new Date(a.realTime).getTime())
            arr.upid = d.upid
            return arr
          });

          // if (this._is_merge)
          const computeSubStageAngle = angle => {
            let fu_angle = angle.slice(0, 5);
            fu_angle.forEach((d, j) => d['sub_j'] = j);
            let m_angle = angle.slice(6, 13);
            m_angle.forEach((d, j) => d['sub_j'] = j);
            let c_angle = angle.slice(14, 16);
            c_angle.forEach((d, j) => d['sub_j'] = j);
            
            return [...fu_angle, ...m_angle, ...c_angle];
          }
          const getQuantile = data => {
            let d_25 = d3.quantile(data, 0.05), d_75 = d3.quantile(data, 0.95),
            bin_data = d3.bin().thresholds(5)(data.filter(d => d>=d_25 && d<=d_75)).sort((a, b) => b.length - a.length);
            let d_val = Math.max(...bin_data[0]);
            return [d_25, d_val, d_75];
          }
          
          if (true)
          {
            this._mergeresult = this._mergeTimesData_1(this._timesdata, this._stationsdata);

            let merge_upid = this._mergeresult.map(item => item.merge_result.merge.flat()).flat().map(d => d.upid)
            for (let i = 0; i < this._timesdata.length; i++) {
              let item = this._timesdata[i];
              if (merge_upid.indexOf(item.upid) === -1) {
                this._filterdata.push(item)
              }
            }


            // 左边圆形 母工序子工序 标尺范围计算
            let merge_plates = [];
            this._mergeresult.forEach(d => {
              let merge = d.merge_result.merge
              let cannot_merge = d.cannot_merge
              merge.forEach(e => merge_plates.push(...e))
              if (cannot_merge !== undefined) {
                cannot_merge.forEach(e => merge_plates.push(e))
              }
            })
            let [t_extent, fu_extent, m_extent, c_extent,
              sub_extent] = this.__getAllDataExtend(merge_plates, 0.99, true, true);
            
            let cate_extend = {};
            let category_data = d3.groups(merge_plates, d => d.steelspec)
            for (let key = 0; key < category_data.length; key++) {
              let one_cate_name = category_data[key][0];
              let one_cate_data = category_data[key][1];

              let [t, fu, m, c] = this.__getAllDataExtend(one_cate_data, 0.99, false, false);
              cate_extend[one_cate_name] = {t: t, fu: fu, m: m, c: c}
            }
            console.log(cate_extend);


            // 合并相关图元 绘图数据
            let batch_index_count = 0;
            for (let item in this._mergeresult) {
              let mergeItem = this._mergeresult[item].merge_result.merge;
              let mergeSelect = this._mergeresult[item].merge_result.select;
              let cannotMerge = this._mergeresult[item].cannot_merge;
              // let Outliters = this._mergeresult[item]['outliers'];

              if (mergeItem.length === 0) {
                continue;
              }

              // 每个批次 子母工序 统计（用于左边圆圈） 新的写法：合并块的种类对应一个圆圈
              let one_batch_info = []
              let one_batch_category = d3.groups(mergeItem, d => d[0].steelspec)
              for (let key = 0; key < one_batch_category.length; key++) {
                let category_name = one_batch_category[key][0];
                let category_data = one_batch_category[key][1];
                let mergeItem_flat = category_data.flat();
                let pathColor = this.__getPathColor(mergeItem_flat);
                let labelStatistics = this.__getLabelStatistics(mergeItem_flat);  // good, bad, no_flag

                let fu_arr = [], m_arr = [], c_arr = [], t_arr = [];
                let sub_arr = [];

                for (let i in mergeItem_flat) {
                  let item_data = mergeItem_flat[i];
                  let item_data_stops = item_data.stops;
                  let single_arr = [];

                  fu_arr.push(item_data.fuTotalTimeAfter * 1000);
                  m_arr.push(item_data.mtotalTime * 1000);
                  c_arr.push(item_data.ccTotalTime * 1000);
                  t_arr.push(new Date(item_data_stops[5].time)) // 节奏指标：出炉时间

                  for (let j in this._stationsdata.slice(0, -1)) {
                    let stations_item = this._stationsdata[j];
                    let time_spend = 0;
                    for (let k in item_data_stops.slice(0, -1)) {
                      if (stations_item.key === item_data_stops[k].station.key) {
                        time_spend = (new Date(item_data_stops[(+k)+1].time)).getTime() - (new Date(item_data_stops[k].time))
                      }
                    }
                    single_arr.push(time_spend)
                  }
                  sub_arr.push(single_arr)
                }
                t_arr = d3.pairs(t_arr, (a, b) => b - a);
                let fu_mean = d3.mean(fu_arr), fu_std = d3.deviation(fu_arr);
                let m_mean  = d3.mean(m_arr),  m_std = d3.deviation(m_arr);
                let c_mean  = d3.mean(c_arr),  c_std = d3.deviation(c_arr);
                let t_mean  = d3.mean(t_arr),  t_std = d3.deviation(t_arr);
                let fu_quantile = getQuantile(fu_arr).map(d => d/cate_extend[category_name].fu[1]);
                let m_quantile = getQuantile(m_arr).map(d => d/cate_extend[category_name].m[1]);
                let c_quantile = getQuantile(c_arr).map(d => d/cate_extend[category_name].c[1]);
                let t_quantile = getQuantile(t_arr).map(d => d/cate_extend[category_name].t[1]);

                let sub_mean = [], stage_sub_avg_angle = [], stage_sub_std_angle = [];
                for (let i = 0; i < 16; i++) {
                  let a = [];
                  sub_arr.forEach(d => a.push(d[i]));

                  let m_a = d3.mean(a);
                  let std_a = d3.deviation(a);
                  sub_mean.push(m_a);
                  stage_sub_avg_angle.push({
                    stage_i: (i>=0&&i<=5) ? 0 : (i>=6&&i<=13) ? 1 : (i>=14&&i<=16) ? 2 : undefined,
                    data: m_a/sub_extent[i][1]
                  });
                  stage_sub_std_angle.push({
                    stage_i: (i>=0&&i<=5) ? 0 : (i>=6&&i<=13) ? 1 : (i>=14&&i<=16) ? 2 : undefined,
                    data: std_a/sub_extent[i][1]
                  });
                }
                let pr_angle = t_mean/t_extent[1]
                let pr_std_angle = t_std/t_extent[1]
                let stage_avg_angle = [fu_mean/fu_extent[1], m_mean/m_extent[1], c_mean/c_extent[1]]
                let stage_std_angle = [fu_std/fu_extent[1], m_std/m_extent[1], c_std/c_extent[1]]

                stage_sub_avg_angle = computeSubStageAngle(stage_sub_avg_angle);
                stage_sub_std_angle = computeSubStageAngle(stage_sub_std_angle);

                let link_info_list = [];
                for (let i = 0; i < mergeItem.length; i++) {
                  let one_merge_item = mergeItem[i];
                  if (one_merge_item[0].steelspec == category_name) {
                    let merge_color = this.__getPathColor(one_merge_item);
                    link_info_list.push({
                      name: category_name,
                      info_index: key,
                      batch_index: batch_index_count,
                      merge_index: i,
                      pathColor: merge_color === undefined ? 'red' : merge_color,
                      batch_s: new Date(mergeItem[0][0].stops[0].time),
                      date_entry_s: new Date(one_merge_item[0].stops[0].time),
                      date_entry_e: new Date(one_merge_item[one_merge_item.length - 1].stops[0].time)
                    })
                  }
                }
                
                // 角度数组含义：[平均值, 标准差]
                one_batch_info.push({
                  info_index: key,
                  pathColor: pathColor,
                  steelspec: category_name,
                  pr_angle: [pr_angle, pr_std_angle],
                  pr_quantile: t_quantile,
                  stage_angle: stage_avg_angle.map((d, i) => [d, stage_std_angle[i]]),
                  stage_quantile: [fu_quantile,  m_quantile, c_quantile],
                  stage_sub_angle: stage_sub_avg_angle.map((d, i) => [d, stage_sub_std_angle[i]]),
                  link_rect: link_info_list,
                  label_statistics: [labelStatistics]
                })
              }

              let merge_data = [];
              for (let key = 0; key < mergeItem.length; key++) {
                let one_merge_item = mergeItem[key];
                let one_merge_select = mergeSelect[key];

                let pathColor = this.__getPathColor(one_merge_item);

                let quality = d3.sort(d3.groups(one_merge_item, d => d.flag), d=> d[1].length);
                if(this._change_color && quality[1] !== undefined) {
                  this._qualityData.push(...d3.map(quality[0][1], d=> d.upid));
                }

                merge_data.push({
                  merge_index: key,
                  mergeItem: one_merge_item,
                  mergeSelect: one_merge_select,
                  // Outliters: Outliters,
                  pathColor: pathColor,
                  steelspec: one_merge_item[0].steelspec,
                  batch_s: new Date(mergeItem[0][0].stops[0].time),
                  date_entry_s: new Date(one_merge_item[0].stops[0].time),
                  date_exit_s: new Date(one_merge_item[0].stops.slice(-1)[0].time),
                  date_entry_e: new Date(one_merge_item[one_merge_item.length - 1].stops[0].time),
                  date_exit_e: new Date(one_merge_item[one_merge_item.length - 1].stops.slice(-1)[0].time)
                })
              }

              let batchColor = this.__getPathColor(d3.merge(mergeItem));

              // 与合并相关的数据
              this._mergeresult_1.push({
                batch_index: batch_index_count,
                // 马雷图合并 绘图数据
                merge_data: merge_data,
                batch_s: merge_data[0].date_entry_s,
                batch_e: merge_data[merge_data.length - 1].date_entry_e,
                batchColor: batchColor,

                // 批次信息 绘图数据
                one_batch_info: one_batch_info
              })
              batch_index_count++;
            }
            console.log(this._mergeresult_1)

            let heat_bad = Math.random() * 25;
            let roll_bad = Math.random() * 30;
            let cool_bad = Math.random() * 20;
            this._statistics = [
              {bad: heat_bad, good: 100-heat_bad},
              {bad: roll_bad, good: 100-roll_bad},
              {bad: cool_bad, good: 100-cool_bad}
            ]
          }

          return this;
        }
        chartSizeInit(width, height) {
          this._width = width;
          this._height = height;
          this._main_magin.top += this._polygon_offset;
          
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
          this._stations_size.s_h = this._stations_size.h - this._main_magin.top - this._polygon_offset;
          this._stations_size.p_h = this._stations_size.s_w / 1.414;
          this._stations_size.p_w = (this._width - 1.5 * this._main_magin.right - this._info_size.w) / 1.414 + this._stations_size.p_h + 3;
          // this._stations_size.p_w = this._stations_size.p_w + 100;

          this._coreX = this._info_size.w * 0.55;

          return this;
        }
        scaleInit() {
          let min_date = this._timesdata[0].stops[0].time;
          let max_date = this._timesdata.slice(-1)[0].stops.slice(-1)[0].time;
          let unit_h = 300;
          let unit_per_time = 3.5;
          let t_h_scale = unit_h / (60 * 60 * 1000 * unit_per_time); // 单位高度 时间跨度x小时
          this._y_height = (new Date(max_date).getTime() - new Date(min_date).getTime()) * t_h_scale;

          let m_w = this._marey_size.w - this._stations_size.p_h - 20;
          let m_h_s = this._stations_size.h + this._stations_size.gap;
          let m_h_e = this._height - this._stations_size.h - this._stations_size.gap - 50;
          this._stops = d3.merge(
            this._timesdata.map(
              d => d.stops.map(
                s => ({ train: d, stop: s }))
            )
          );
          
          this._mini_y = d3.scaleTime()
            .domain([new Date(min_date), new Date(max_date)])
            .range([0, this._brush_size.h - this._brush_margin.top - this._brush_margin.bottom]);
          this._zoom_mini_y = d3.scaleLinear()
            .domain([0, this._brush_size.h])
            .range([this._stations_size.h, this._height]);
          this._brush_select[1] = (this._brush_size.h - this._brush_margin.top - this._brush_margin.bottom) * 0.25;

          
          this._x = d3.scaleLinear()
            .domain(d3.extent(this._stationsdata, d => d.distance))
            .range([0 , m_w]);
          this._y = d3.scaleTime()
            .domain([this._mini_y.invert(this._brush_select[0]), this._mini_y.invert(this._brush_select[1])])
            .range([m_h_s, m_h_e])
            // .range([0, 1]);
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

        render() {
          this._trainSelectedList = []; // 清空选择列表
          this._container
            .attr('width', this._width)
            .attr('height', this._y_height);

          // this._shadowInit();

          // this._renderMareyBackground();


          this._renderInfoChart();

          // this._renderMonitorChart();

          this._renderMareyChart();

          this._renderMareyBrush();
          
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
          
          
          function hatching(defs, id_name, bgc_color, w, sk_w) {
            let pattern = defs.append('pattern')
            .attr('id', id_name)
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('patternTransform', `rotate(${45})`)
            .attr('width', w)
            .attr('height', w)
            pattern
              .append('rect')
              .attr('width', w)
              .attr('height', w)
              .attr('fill', bgc_color)
            pattern
              .append('line')
              .attr('x1', 0)
              .attr('y1', 0)
              .attr('x2', 0)
              .attr('y2', 50)
              .attr('stroke', 'white')
              .attr('stroke-width', sk_w)
              .attr('stroke-opacity', 1)
          }

          let stage_hatching_w = 5;
          let stage_hatching_sk_w = 4;
          hatching(defs, 'hatching_pattern_0', '#cccccc', stage_hatching_w, stage_hatching_sk_w);
          hatching(defs, 'hatching_pattern_1', vm.processColor[0], stage_hatching_w, stage_hatching_sk_w);
          hatching(defs, 'hatching_pattern_2', vm.processColor[1], stage_hatching_w, stage_hatching_sk_w);
          hatching(defs, 'hatching_pattern_3', vm.processColor[2], stage_hatching_w, stage_hatching_sk_w);

          let stage_sub_hatching_w = 4;
          let stage_sub_hatching_sk_w = 2;
          hatching(defs, 'hatching_sub_pattern_1', vm.processColor[0], stage_sub_hatching_w, stage_sub_hatching_sk_w);
          hatching(defs, 'hatching_sub_pattern_2', vm.processColor[1], stage_sub_hatching_w, stage_sub_hatching_sk_w);
          hatching(defs, 'hatching_sub_pattern_3', vm.processColor[2], stage_sub_hatching_w, stage_sub_hatching_sk_w);
          
          return this;
        }
        _renderMareyBackground() {
          let shadow_x = -this._stations_size.p_h + 10;
          let shadow_y = this._main_magin.top;
          let shadow_w = this._marey_size.w + 8 + this._stations_size.p_h;
          let shadow_h = this._y_height - this._main_magin.top - this._main_magin.bottom;

          let bgc = this._container.append('g')
            .attr('class', 'background');

          bgc.append('g')
            .attr('transform', `translate(${[this._info_size.w, this._polygon_offset]})`)
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
              .style("fill", "white")
              .attr("width", this._info_bgc_w)
              .attr("height", this._y_height - this._main_magin.bottom))
            .call(g => g.append("rect")
              .attr("class", "shadow_rect")
              .attr("x" , this._coreX - 1.8 * 65)
              .style("fill","none")
              .attr("width", this._info_bgc_w)
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
          
          return this;
        }
        _mergeTimesData(json, stations) {
          const categorys = d3.group(json , d => d.productcategory);
          const mergecategorys = [];	// merge categorys
          const minrange = this._minrange;
          const minconflict = this._minconflict;
          const mergeIndex = {};	// merge station maxlength
          const mergeresult = [];
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
            const dis_upper = []
            const dis_lower = []
            for (let key in json[item].stops) {
              dis_upper.push(d3.quantile(steeldisTotal, 0.75, d => d[key]))
              dis_lower.push(d3.quantile(steeldisTotal, 0.25, d => d[key] ))
            }
            // console.log(meandis)

            // merge selection
            const mergeselect = []
            const outliers = []
            const mergeflag = 0;
            for (let i in steeldisTotal) {
              const outrange = 0
              const one_out = []
              let out_flag = false
              for (let j in json[item].stops) {
                steeldisTotal[i][j] > dis_upper[j] ? ((steeldisTotal[i][j] - dis_upper[j])/dis_upper[j] > 1.1 & dis_upper[j] !== 0 ) ? outrange+=5 : outrange+=2 : undefined;
                steeldisTotal[i][j] < 0 ? outrange += 20 : undefined;

                if ((steeldisTotal[i][j] - dis_upper[j])/dis_upper[j] > 1.1 & dis_upper[j] !== 0) {
                  out_flag = true
                  one_out.push(mergedata[i].stops[j])
                }
              }
              out_flag ? outliers.push(one_out) : undefined;
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
                "merge" : mergedata.slice(0, 0+mergeflag),
                "select" : mergeselect,
                "outliers": outliers.slice(0, 0+mergeflag),
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
              "outliers": outliers,
              "index" : [item , index - item],
              "data" : [item , index ],
              "wave" : indexarray
            })
            item = index -1
          }
          // console.log(mergeresult)
          return mergeresult
        }
        _mergeTimesData_1(json, stations) {
          const minrange = this._minrange;
          const minconflict = this._minconflict;

          // console.log(json);
          // console.log(stations);
          // console.log( json.map(d => d.stops.map(e => e.station.key)) )

          // 批次划分
          let batch_plates = [];
          let plates_stops = json.map(d => d.stops);
          for (let i = 0; i < plates_stops.length; i++) {
            let batch_count = i + 1;
            let time_diff_init = compute_tr(plates_stops[i], plates_stops[batch_count]);

            while (plates_stops[i] !== undefined 
              && plates_stops[batch_count] !== undefined
              && plates_stops[i].length === plates_stops[batch_count].length)
            {
              let time_diff = compute_tr(plates_stops[batch_count-1], plates_stops[batch_count]);
              
              // console.log(batch_count, time_diff, Math.abs(time_diff - time_diff_init) )

              if (Math.abs(time_diff - time_diff_init) > 20) {
                break;
              }

              batch_count += 1;
            }

            if (batch_count - i > minrange) {
              batch_plates.push(json.slice(i, batch_count))
            }
            i = batch_count;
          }
          // console.log(batch_plates)


          // 对每个批次内的板进行合并  batch_plates.length
          let mergeresult = []
          for (let batch_index = 0; batch_index < batch_plates.length; batch_index++) {
            let one_batch = batch_plates[batch_index];

            let res = merge_plates(one_batch);
            // console.log(one_batch)
            // console.log(res)
            mergeresult.push(res);
            
          }
          // console.log(mergeresult)


          
          // 合并主逻辑
          function merge_plates(one_batch) {
            let categorys = d3.group(one_batch , d => d.steelspec)
            let mergecategorys = []
            let mergeIndex = {}	// merge station maxlength

            for (let item of [...categorys]) {
              item[1].length > minrange ? mergecategorys.push(item[0]) : undefined
            }
            for (let item of  mergecategorys) {
              let indexdata = d3.groups(categorys.get(item) , d => d.stops.length)
              mergeIndex[item] = indexdata[d3.maxIndex(indexdata ,  d => d[1].length)][0]
            }


            // 计算两块板之间的距离矩阵
            let dis_matrix = d3.pairs(one_batch, (a, b) => {
              let one_arr = []
              let stops_len = a.stops.length
              for (let i = 0; i < stops_len; i++) {
                let a_t = new Date(a.stops[i].time);
                let b_t = new Date(b.stops[i].time);
                one_arr.push(b_t - a_t)
              }

              return one_arr
            })

            // console.log('-----------------------------------------')
            // console.log('one batch: ', one_batch)
            // console.log('dis matrix: ', dis_matrix)

            let dis_upper = [];
            let dis_lower = [];
            for (let i = 0; i < dis_matrix[0].length; i++) {
              dis_upper.push(d3.quantile(dis_matrix, 0.80, d => d[i]))
              dis_lower.push(d3.quantile(dis_matrix, 0.80, d => d[i]))
            }

            // console.log('dis_upper: ', dis_upper)


            // 开始合并
            let merge_select = [];
            let merge_item = [];
            let merge_index = [];
            let cannot_merge = [];
            let outliers = []
            for (let i = 0; i < one_batch.length-1; i++) {
              let index = i;
              let m_item = [];
              let m_select = [];

              let curr_steelspec = one_batch[i].steelspec
              if (!can_merge(one_batch[i], {
                steelspec: mergecategorys.indexOf(curr_steelspec) === -1 ? "aaa" : curr_steelspec
                })
              )
              {
                cannot_merge.push(one_batch[i]);
                continue;
              }

              while (one_batch[index] !== undefined 
                && dis_matrix[index] !== undefined
                && can_merge(one_batch[index], {steelspec: curr_steelspec}))
              {
                let outrange = 0;

                for (let j = 0; j < one_batch[index].stops.length; j++) {
                  dis_matrix[index][j] > dis_upper[j] ? 
                  (dis_matrix[index][j]-dis_upper[j])/dis_upper[j] > 1.1 && dis_upper[j] !== 0 ?
                  outrange += 5 :
                  outrange += 2 :
                  undefined;

                  dis_matrix[index][j] < 0 ? outrange += 20 : undefined;
                }

                m_item.push(one_batch[index])
                if (outrange >= 15)  m_select.push(one_batch[index])
                if (m_select.length > minconflict - 1) break;
                
                index += 1
              }

              if (m_item.length >= minrange) {
                merge_item.push(m_item)
                merge_select.push(m_select)
              } else {
                m_item.forEach(d => cannot_merge.push(d))
              }

              i = index;
            }

            return {
              'merge_result': { 'merge': merge_item, 'select': merge_select},
              'cannot_merge': cannot_merge
            }
          }

          // 判断是否满足合并条件
          function can_merge(one_plate, condition) {
            if (one_plate.steelspec === condition.steelspec)
            {
              return true
            }
            else
            {
              return false
            }
          }

          // 计算相邻两块板的生产节奏间隔，单位为分钟
          function compute_tr(stop1, stop2) {
            if (stop1 === undefined || stop2 === undefined) {
              return 0
            }

            let stop1_tr = new Date(stop1[5].time);
            let stop2_tr = new Date(stop2[5].time);

            return (stop2_tr.getTime() - stop1_tr.getTime())/60000
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
          // this._renderMareyLineTooltip();
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

          let batchG = MareyGroup.selectAll('batchG')
            .data(this._mergeresult_1)
            .join('g')
            .attr('class', 'batchG')
            .attr('id', d => `batchG${d.batch_index}`)

          let mergeG = batchG.selectAll('mergeG')
            .data(d => d.merge_data)
            .join('g')
            .attr('class', 'mergeG')
            .attr('id', d => `mergeG${d.merge_index}`)
            // .attr('transform', d => `translate(${[0, this._y(new Date(d.mergeItem[0].stops[0].time))]})`)
          
          let mergeArea = e => d3.area()
            .x(f => this._x(f.distance))
            .y0(f => this._y(f.time0))
            .y1(f => this._y(f.time1))(e);
          
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
          
          mergeG.append('g')
            .attr('fill', 'white')
            .selectAll('.select g')
            .data(d => d.mergeSelect)
            .join('g')
            .attr('class', 'select_g')
            .attr('transform', d => `translate(0, ${this._y(new Date(d.stops[0].time))})`)
            .style('color', this._trainGroupStyle)
            .attr('stroke-width', d => { return this._defaultStrokeWidth(d.tgtplatethickness2) } )
            .attr('id', d => ('id' + d.upid))
            .call(g => g.append('path')
              .attr('fill', 'none')
              .attr('stroke', 'currentColor')
              .attr('d', d => this._line(d.stops)))
          
          // console.log(this._mergeresult_1)
          // let outGroup = mergeG.append('g')
          //   .attr('transform', d => `translate(${ [0, -this._y(new Date(d.mergeItem[0].stops[0].time))] })`)
          //   .selectAll('outGroup')
          //   .data(d => d.Outliters.length == 0 ? [] : d.Outliters)
          //   .enter()
          //   .append('g')
          //   .attr('class', 'outGroup')
          // outGroup.selectAll('out_point')
          //   .data(d => d)
          //   .enter()
          //   .append('circle')
          //   .attr('r', 5)
          //   .attr('fill', 'red')
          //   .attr("cx", d => this._x(d.station.distance))
          //   .attr("cy", d => this._y(new Date(d.time)))
          //   .attr('d', d => {
          //     // console.log(d)
          //     return d
          //   })

          // if (this._change_color) {
          //   mergeG.append('g')
          //     .attr('class', 'quality')
          //     // .attr('transform', d => `translate(${ [0, -this._y(new Date(d.mergeItem[0].stops[0].time))] })`)
          //     .attr('fill', 'white')
          //     .selectAll(`.select g`)
          //     .data(datum => {
          //       let quality = d3.sort(d3.groups(datum.mergeItem, d => d.flag), d => d[1].length);
          //       // console.log(quality)
          //       return quality[1] !== undefined ? quality[0][1] : [];
          //     })
          //     .join('g')
          //     .attr('class', 'mareyLine')
          //     .attr('transform', d => `translate(0, ${this._y(new Date(d.stops[0].time))})`)
          //     .style('color', this._trainGroupStyle)
          //     .attr('stroke-width', d => { return this._defaultStrokeWidth(d.tgtplatethickness2) } )
          //     .attr('id', d => ('id' + d.upid))
          //     .call(g => g.append('path')
          //       .attr('fill', 'none')
          //       .attr('stroke', 'currentColor')
          //       .attr('d', d => this._line(d.stops)));
          // }
        }
        _renderMareyLineTooltip() {
          let that = this;
          // let stops = d3.merge(this._timesdata.map(d => d.stops.map(s => ({ train: d, stop: s }))));
          let filter = [];
          let filter_1 = {};
          if (this._is_merge) {
            let merge = d3.map(d3.merge(d3.merge(that._mergeresult_1.map(d => d.merge_data.map(e => e.mergeItem)))) , d =>d.upid);
            let select = d3.map(d3.merge(d3.merge(that._mergeresult_1.map(d => d.merge_data.map(e => e.mergeSelect)))) , d =>d.upid);
            filter = d3.filter(merge , d => select.indexOf(d) === -1 );

            for (let i = 0; i < that._mergeresult_1.length; i++) {
              let batch = that._mergeresult_1[i];
              for (let j = 0; j < batch.merge_data.length; j++) {
                let merge_data = batch.merge_data[j];
                for (let k = 0; k < merge_data.mergeItem.length; k++) {
                  let merge_item = merge_data.mergeItem[k];
                  if (select.indexOf(merge_item.upid) === -1) {
                    filter_1[merge_item.upid] = {
                      "batch_index": batch.batch_index,
                      "merge_index": j
                    }
                  }
                }
              }
            }
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
            .data(this._stops)
            .join('path')
            .attr('d', (d, i) => this._voronoi.renderCell(i))
            .on('mouseover', (event, d) => {
              if(
                filter_1[d.train.upid] !== undefined
                && this._is_merge
              ) {
                let batch_index = filter_1[d.train.upid]['batch_index'];
                let merge_index = filter_1[d.train.upid]['merge_index'];
                let selected_plates = that.__getSelectPlate([batch_index], [merge_index]);

                let curr_batch_all_mergeindex = []
                let curr_batch_infos = this._info_g.selectAll(`#oneBatchChartGroup${batch_index} .chartGroup`);
                curr_batch_infos._groups[0].forEach(
                  d => curr_batch_all_mergeindex.push(d3.select(d).attr('merge_index')));
                let info_index;
                curr_batch_all_mergeindex.forEach((d, i) => {
                  if (d.includes(''+merge_index)) {
                    info_index = i;
                  }
                });

                this._setMergeRect([batch_index], [merge_index]);
                this._setMergeBin(selected_plates);
                this._emitToScatter(selected_plates, 0);
                // this._setInfoDetail(batch_index, info_index);
                if (info_index != undefined) {
                  this._setInfoDetail(batch_index, info_index);
                }
                return;
              }

              vm.$emit('trainMouse', {upid: [d.train.upid],  mouse: 0});
              let toopcolor = this._trainGroupStyle(d.train);
              mouseoverLine(d.train.upid);
              changeBin(d.train.upid);
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
              if (
                filter_1[d.train.upid] !== undefined
                && this._is_merge
              ) {
                let batch_index = filter_1[d.train.upid]['batch_index'];
                let merge_index = filter_1[d.train.upid]['merge_index'];
                let selected_plates = that.__getSelectPlate([batch_index], [merge_index]);

                this._resetMergeRect();
                this._resetMergeBin();
                this._emitToScatter(selected_plates, 1);
                this._resetInfoDetail();
                this._keepClickedStatus();
                return;
              }
              if (this._trainSelectedList.includes(d.train.upid))
                return;
              
              vm.$emit('trainMouse', {upid: [d.train.upid],  mouse: 1});
              tooltip.style('display', 'none');
              mouseoutLine(d.train.upid);
              resetBin();
              // mergeGopacity()
            })
            .on('click', (event, d) => {
              if (this._trainSelectedList.includes(d.train.upid)) {
                this._trainSelectedList = this._trainSelectedList.filter(v => v !== d.train.upid)
                mouseoutLine(d.train.upid) // 取消选中
              } else {
              // 选中
                if(this._trainSelectedList.length !==0) {
                  mouseoutLine(this._trainSelectedList[this._trainSelectedList.length-1])
                  mouseOutPath()
                }
                this._trainSelectedList.push(d.train.upid);
                mouseoverLine(d.train.upid)
                mouseOverRect(d.train.upid)
              }
              let upidSelect = d3.map(
                d3.filter(this._timesdata.slice(this._allupid.indexOf(d.train.upid)), d => d.flag === 0), 
                d => d.upid)
              vm.$emit("trainClick", {
                list: this._trainSelectedList,
                upidSelect: upidSelect,
                type: "single",
                batch: upidSelect
              });
            })
          
          function mouseoverLine(uclid) {
            let flag = that._dataUCL.get(uclid)[0].flag;
            d3.select('#id' + uclid)
              .attr('stroke-width', that._highLightStrokeWidth)
              .selectAll('rect')
              .attr('stroke', 'black');
            
            d3.selectAll('#diagnosis_value_' + uclid)
              .attr('fill', d => d3.color(d.color).darker(0.2))
              .attr('stroke', d => d3.color(d.color).darker(1))
              .attr('stroke-width', 2)
          }
          function mouseoutLine(uclid) {
            d3.select('#id' + uclid)
              .attr('stroke-width', d => { return that._defaultStrokeWidth(d.tgtplatethickness2) })
              .selectAll('rect')
              .attr('stroke', 'none');
            
            d3.selectAll('#diagnosis_value_' + uclid)
              .attr('fill', d => d.color)
              .attr('stroke', d => d3.color(d.color).darker(0.2))
              .attr('stroke-width', 1)

            for(let m in that._stopsTimes) {		//reset binRect
              // that._marey_g.selectAll(`.binRect${m}`)
              //   .attr('fill', '#b9c6cd');
              that._marey_g.selectAll(`.good_binRect${m}`)
                .attr('opacity', 0.4)
              that._marey_g.selectAll(`.bad_binRect${m}`)
                .attr('opacity', 0.4)
            }
          }
          function changeBin(upid) {
            let distanceData = d3.pairs(
              that._dataUCL.get(upid)[0].stops, 
              (a, b) => (new Date(b.realTime)).getTime() - (new Date(a.realTime)).getTime());
            for(let m in distanceData) {
              if (that._dataUCL.get(upid)[0].flag === 1) {
                that._marey_g.selectAll(`.good_binRect${m}`)
                  // .attr('fill', d => distanceData[m] <= d.x1 && d.x0 <= distanceData[m] ? d3.color(vm.labelColors[1]).darker(0.5) : vm.labelColors[1]);
                  .attr('opacity', d => distanceData[m] <= d.x1 && d.x0 <= distanceData[m] ? 1 : 0.4)
              }
              if (that._dataUCL.get(upid)[0].flag === 0) {
                that._marey_g.selectAll(`.bad_binRect${m}`)
                  // .attr('fill', d => distanceData[m] <= d.x1 && d.x0 <= distanceData[m] ? d3.color(vm.labelColors[0]).darker(0.5) : vm.labelColors[0]);
                  .attr('opacity', d => distanceData[m] <= d.x1 && d.x0 <= distanceData[m] ? 1 : 0.4)
              }
              
              // that._marey_g.selectAll(`.binRect${m}`)
              //   .attr('fill', d => distanceData[m] <= d.x1 && d.x0 <= distanceData[m] ? that._trainGroupStyle(that._dataUCL.get(upid)[0]) : "#b9c6cd")
            }
          }
          function resetBin(){
            // for(let m in that._stopsTimes){		//reset binRect
            //   MareyGroup.selectAll(`.binRect${m}`)
            //     .attr('fill', '#b9c6cd')
            // }
            for(let m in that._stopsTimes){		//reset binRect
              that._marey_g.selectAll(`.good_binRect${m}`)
                .attr('opacity', 0.4)
              that._marey_g.selectAll(`.bad_binRect${m}`)
                .attr('opacity', 0.4)
            }
          }
        }
        _renderMareyStations() {
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
            .attr("transform", `translate(${-this._stations_size.p_h/2 - 6} ,${this._main_magin.top -1.5 + this._polygon_offset}) rotate(-45)`)
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
            .attr('transform', (d, i) => `translate(${this._x(d.distance) + this._stations_size.p_h + rectDistance}, ${-2 + this._polygon_offset})`)
            .attr('i', (d, i) => i)
            .call(g => g.append('polygon')
              .attr('transform', `translate(${-this._stations_size.p_h}, ${this._main_magin.top}) rotate(-45)`)
              .attr('points', `
                0, 
                0 ${this._stations_size.p_h}, 
                ${this._stations_size.p_h} ${110+this._polygon_offset}, 
                ${this._stations_size.p_h} ${110+this._polygon_offset - this._stations_size.p_h}, 
                0
              `)
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
            .attr('transform', d => `translate(${[
              this._x(d.distance) + rectDistance, 
              this._stations_size.h + this._polygon_offset]
            })`)
            .call(g => g.append('rect')
              .attr('y', this._main_magin.top - this._stations_size.h)
              .attr('fill', (d,i) => d3.color(i < 6 ? stationcolor[0] : (i> this._stationsdata.length - 4 ? stationcolor [2] : stationcolor [1])))
              .attr('opacity', 0.4)
              .attr('stroke', (d,i) => d3.color(i < 6 ? stationcolor[0] : (i> this._stationsdata.length - 4 ? stationcolor [2] : stationcolor [1])))
              .attr('stroke-width', 1)
              .attr('width', this._stations_size.s_w)
              .attr('height', this._stations_size.s_h)
              .attr('filter','url(#shadow-card)'))
            .call(g => g.append('rect')
              .attr('y', this._main_magin.top - this._stations_size.h)
              .attr('fill', 'none')
              .attr('opacity', 1)
              .attr('stroke', (d,i) => d3.color(i < 6 ? stationcolor[0] : (i> this._stationsdata.length - 4 ? stationcolor [2] : stationcolor [1])))
              .attr('stroke-width', 1.2)
              .attr('width', this._stations_size.s_w)
              .attr('height', this._stations_size.s_h));
          stationsNameGroup.append('g')
            .call(xRect)
            .call(xAxis);
          stationsNameGroup.append('g')
            .call(timedistance);

          let timebinsGroup = stationsNameGroup.append('g')
            .attr('class', 'timebinsGroup');




          // let stopsTime = d3.map(this._timesdata, d => {
          //   let arr = d3.pairs(d.stops, (a,b) => new Date(b.realTime).getTime() - new Date(a.realTime).getTime())
          //   arr.upid = d.upid
          //   return arr
          // });
          // let timebins = stopsTime[0].map((d, i) => {
          //   return d3.bin().thresholds(20)(d3.map(stopsTime, (e,f) => e[i]))
          // });
          // let binxScale = timebins.map((d, i) => 
          //   d3.scaleLinear()
          //     .domain([d[0].x0, d[d.length-1].x1])
          //     .range([5, this._stations_size.s_w - 5])
          // );
          // let binYScale = timebins.map((d, i) => 
          //   d3.scaleLinear()
          //     .domain([0, d3.max(d, e => e.length)])
          //     .range([0, this._stations_size.s_h - 10])
          // );
          // for(let bin in this._stationsdata.slice(0, -1)) {
          //   timebinsGroup.append("g")
          //     .attr('transform', `translate(${[this._x(this._stationsdata[bin].distance), this._stations_size.h - 1]})`)
          //     .selectAll('.binRect')
          //     .data(timebins[bin])
          //     .join('rect')
          //       .attr('class', `binRect${bin}`)
          //       .attr('x', d => binxScale[bin](d.x0) + 1)
          //       .attr('fill', '#b9c6cd')
          //       .attr('stroke', '#aaa')
          //       .attr('stroke-width', 0.25)
          //       .attr('width', d =>  binxScale[bin](d.x1) - binxScale[bin](d.x0))
          //       .attr('y', d => - binYScale[bin](d.length))
          //       .attr('height', d => binYScale[bin](d.length))
          // }





          let stopsTime_good = d3.map(this._timesdata.filter(d => d.flag === 1), d => {
            let arr = d3.pairs(d.stops, (a,b) => new Date(b.realTime).getTime() - new Date(a.realTime).getTime())
            arr.upid = d.upid
            return arr
          });
          let stopsTime_bad = d3.map(this._timesdata.filter(d => d.flag === 0), d => {
            let arr = d3.pairs(d.stops, (a,b) => new Date(b.realTime).getTime() - new Date(a.realTime).getTime())
            arr.upid = d.upid
            return arr
          });
          
          let max_stations = d3.max(stopsTime_good.map(d => d.length));
          let timebins_good = [];
          let timebins_bad = [];
          for (let i = 0; i < max_stations; i++) {
            timebins_good.push(d3.bin().thresholds(20)(d3.map(stopsTime_good, (e,f) => e[i])));
            timebins_bad.push(d3.bin().thresholds(20)(d3.map(stopsTime_bad, (e,f) => e[i])));
          }

          let binxScale = timebins_good.map((d, i) => 
            d3.scaleLinear()
              .domain([
                d3.min([timebins_good[i][0].x0, timebins_bad[i][0].x0]), 
                d3.max([timebins_good[i][timebins_good[i].length-1].x1, timebins_bad[i][timebins_bad[i].length-1].x1])
              ])
              .range([5, this._stations_size.s_w - 5])
          );
          let binYScale = timebins_good.map((d, i) => 
            d3.scaleLinear()
              .domain([
                0, 
                d3.max([d3.max(timebins_good[i], e => e.length), d3.max(timebins_bad[i], e => e.length)])
              ])
              .range([0, this._stations_size.s_h - 10])
          );
          for(let bin in this._stationsdata.slice(0, -1)){
            timebinsGroup.append("g")
              .attr('transform', `translate(${[this._x(this._stationsdata[bin].distance), this._stations_size.h - 1]})`)
              .selectAll('.good_binRect')
              .data(timebins_good[bin])
              .join('rect')
                .attr('class', `good_binRect${bin}`)
                .attr('x', d => binxScale[bin](d.x0) + 1)
                .attr('fill', vm.labelColors[1])
                .attr('stroke', '#aaa')
                .attr('stroke-width', 0.25)
                .attr('width', d =>  binxScale[bin](d.x1) - binxScale[bin](d.x0))
                .attr('y', d => - binYScale[bin](d.length))
                .attr('height', d => binYScale[bin](d.length))
                .attr('opacity', 0.4)
            timebinsGroup.append("g")
              .attr('transform', `translate(${[this._x(this._stationsdata[bin].distance), this._stations_size.h - 1]})`)
              .selectAll('.bad_binRect')
              .data(timebins_bad[bin])
              .join('rect')
                .attr('class', `bad_binRect${bin}`)
                .attr('x', d => binxScale[bin](d.x0) + 1)
                .attr('fill', vm.labelColors[0])
                .attr('stroke', '#aaa')
                .attr('stroke-width', 0.25)
                .attr('width', d =>  binxScale[bin](d.x1) - binxScale[bin](d.x0))
                .attr('y', d => - binYScale[bin](d.length))
                .attr('height', d => binYScale[bin](d.length))
                .attr('opacity', 0.4)
          }

          // 站点提示线
          stationsNameGroup.append('g')
            .attr('class', 'stationsLine')
            .selectAll('g')
            .data(this._stationsdata)
            .join('g')
            .attr('transform', d => `translate(${this._x(d.distance)}, ${this._polygon_offset})`)
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



          let rect_radius = 3;
          let monitorWidth = 360;
          let moni_rect_w = monitorWidth/3;
          let text_list = ['Heat', 'Roll', 'Cool'];

          let diagnosisTextGroup = this._marey_g.append('g')
            .attr('transform', `translate(${[this._marey_size.w + 75, this._stations_size.h]})`)
          diagnosisTextGroup.selectAll('.diagnosisTextGroup')
            .data(text_list)
            .enter()
            .append('text')
            .attr('class', 'diagnosisTextGroup')
            .attr('transform', (d, i) => `translate(${[(moni_rect_w+10)*i, 0]})`)
            .text(d => d)
            .attr('fill', (d, i) => d3.color(vm.processColor[i]))  //.darker(0.3)
            .style('font-size', 18)
            .style('font-weight', 500)
            .style('font-family', util.conditionPolygonTextAttr.fontFamily)
          
          let r = 10;
          let angle_gap = 0.1;
          let remain_angle = 2*Math.PI-angle_gap*2;
          let statisticsInfoGroup = this._marey_g.append('g')
            .attr('transform', `translate(${[this._marey_size.w + 135, this._stations_size.h-10]})`)
            .attr('opacity', 0.8)
          statisticsInfoGroup.selectAll('.statisticsInfoGroup')
            .data(this._statistics)
            .enter()
            .append('path')
            .attr('transform', (d, i) => `translate(${[(moni_rect_w+10)*i, 0]})`)
            .attr('d', d => 
              d3.arc()
                .innerRadius(r)
                .outerRadius(r+4)
                .startAngle(angle_gap+0)
                .cornerRadius(2)
                .endAngle(angle_gap+remain_angle*(d.good/100))()
            )
            .attr('fill', (d, i) => vm.processColor[i])
          // statisticsInfoGroup.selectAll('.statisticsInfoGroup')
          //   .data(this._statistics)
          //   .enter()
          //   .append('path')
          //   .attr('transform', (d, i) => `translate(${[(moni_rect_w+10)*i, 0]})`)
          //   .attr('d', d => {
          //     let start = angle_gap*2+remain_angle*(d.good/100);
          //     let end = start + remain_angle*(d.bad/100)
          //     return d3.arc()
          //       .innerRadius(r)
          //       .outerRadius(r+5)
          //       .startAngle(start)
          //       .endAngle(end)()
          //   })
          //   .attr('fill', vm.labelColors[0])
          statisticsInfoGroup.selectAll('.statisticsInfoGroup')
            .data(this._statistics)
            .enter()
            .append('text')
            .attr('transform', (d, i) => `translate(${[(moni_rect_w+10)*i, 3]})`)
            .text(d => Math.round(d.bad))
            .attr('fill', vm.labelColors[0])
            .attr('font-size', 11)
            .style('font-weight', 'bold')
            .style('font-style', 'italic')
            .attr('text-anchor', 'middle')
            .attr('opacity', 0.8)
          
        }

        // 马雷图刷子
        _renderMareyBrush() {
          this._brush_g === undefined ? undefined : this._brush_g.remove();

          let brushXPosition = this._width - this._brush_margin.right - this._main_magin.right / 2;
          this._brush_g = this._container.append('g')
            .attr('class', 'mareyBrushGroup')
            .attr('transform', `translate(${[brushXPosition, this._brush_margin.top+this._polygon_offset]})`);
          
          this._renderMareyBrushContent();
          this._renderMareyBrushLinkLine();
          this._renderMareyBrushAxis();
          this._renderMareyBrushHandle();
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
                .attr('height', 0.5)
		    	  		.attr('width', mini_g_w)
		    	  		.attr("fill", this._trainGroupStyle)
                .attr("opacity", d=> 
                  this._mini_y(new Date(d.stops[0].time)) > this._brush_select[0] && 
                  this._mini_y(new Date(d.stops[0].time)) < this._brush_select[1] ? 
                  0.5 : 0.2)
            )
            .call(g => g.selectAll('.batchPath')
              .data(this._is_merge ? this._mergeresult_1 : [])
              .join('g')
              .selectAll('mergePath')
              .data(d => d.merge_data)
              .join('rect')
                .attr('class', 'mergePath')
                .attr('y', d => this._mini_y(d.date_entry_s))
                .attr('height', d => this._mini_y(d.date_entry_e) - this._mini_y(d.date_entry_s))
                .attr('width', mini_g_w)
                .attr('fill', d => d.pathColor)
                .attr('opacity', 0.5)
              
            )

            if (this._is_merge) {
              let merge_select_arr = d3.merge(d3.merge(this._mergeresult_1.map(d => d.merge_data.map(e => e.mergeSelect))));
              
                miniGroup
                  .call(g => g.selectAll('.merge_select_line')
                    .data(merge_select_arr)
                    .join('rect')
                    .attr('x', 0)
                    .attr('y', d => this._mini_y(new Date(d.stops[0].time)))
                    .attr('height', 0.5)
                    .attr('width', mini_g_w)
                    .attr('fill', this._trainGroupStyle)
                    .attr('opacity', 0.5)
                  )
            }
          
          // if (this._change_color) {
          //   if (!this._is_merge) return;

          //   let merge_data = d3.map(this._mergeresult_1, datum => {
          //     let quality = d3.sort(d3.groups(datum.merge_data.map(e => e.mergeItem), d => d.flag), d => d[1].length);
          //     return quality[1] !== undefined ? quality[0][1] : [];
          //   })

          //   let merge_data_arr = [];
          //   merge_data.forEach(d => merge_data_arr.push(...d));

          //   miniGroup
          //     .call(g => g.selectAll('.merge_line')
          //       .data(merge_data_arr)
          //       .join('rect')
          //       .attr('x', 0)
          //       .attr('y', d => this._mini_y(new Date(d.stops[0].time)))
          //       .attr('height', 0.5)
          //       .attr('width', mini_g_w)
          //       .attr('fill', this._trainGroupStyle)
          //       .attr('opacity', 0.5)
          //     )
          // }
        }
        _renderMareyBrushHandle() {
          let that = this;
          let brushGroup = this._brush_g.append('g')
            .attr('class', 'brushWrapper');

          let x0_y0 = [0, 0];
          let x1_y1 = [this._brush_size.w - this._brush_margin.right - this._brush_margin.left, this._brush_size.h - this._brush_margin.bottom - this._brush_margin.top];
          this._brush = d3.brushY()
            .extent([x0_y0, x1_y1])
            .on('brush', brushing)
            .on('end', brushed);

          let zoom_extent = [[this._brush_margin.left, this._brush_margin.top], 
            [this._brush_size.w-this._brush_margin.right, this._brush_size.h - this._brush_margin.bottom]];
          let zoom = d3.zoom()
            .translateExtent(zoom_extent)
            .extent(zoom_extent)
            .on('zoom', zoomed);
            
          let brushElement = brushGroup.append('g')
            .attr('class', 'brush')
            .call(this._brush)
            .call(zoom)
            .on('mousedown.zoom', null);
          brushGroup.select(".overlay")
            .attr("stroke", "#aaa")
            .style("stroke-width", 0.25)
            .each(d => d.type = "selection")
            .on("mousedown touchstart", function (event) {
              brushcenter(event);
            });
          
          brushElement.call(this._brush.move, this._brush_select);
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
            brushElement.call(that._brush.move, pos);
          }
          function brushing(event) {
            const extentX = event.selection;
            d3.select(".miniLine1").attr("y1", that._brush_margin.top + that._polygon_offset + extentX[0]);
            d3.select(".miniLine2").attr("y1", that._brush_margin.top + that._polygon_offset + extentX[1]);
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
                that._mini_y(new Date(d.stops[0].time))<extentX[1] ? 0.7 : 0.2);
            d3.select(".miniGroup").selectAll(".mergePath")
              .attr("opacity", d=> (
                (extentX[0]>=that._mini_y(d.date_entry_s) && extentX[0]<=that._mini_y(d.date_entry_e)) ||
                (extentX[1]>=that._mini_y(d.date_entry_s) && extentX[1]<=that._mini_y(d.date_entry_e)) ||
                ( (that._mini_y(d.date_entry_s)>extentX[0] && that._mini_y(d.date_entry_s)<extentX[1]) && 
                  (that._mini_y(d.date_entry_e))>extentX[0] && that._mini_y(d.date_entry_e)<extentX[1]) 
                ) ? 0.5 : 0.2);
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
            brushElement.call(that._brush.move, brush_select);
          }
        }
        _renderMareyBrushLinkLine() {
          let s_x = this._width - this._brush_margin.right - this._main_magin.right / 2;
          let e_x = this._width - this._brush_size.w;
          
          this._container
            .call(g => g.append("line")
              .attr("class", "miniLine1")
              .attr("x1", s_x)
              .attr("y1", this._brush_margin.top + this._polygon_offset + this._brush_select[0])
              .attr("x2", e_x)
              .attr("y2", this._stations_size.h + this._stations_size.gap)
              .style("stroke", "#c9cbcc")
              .style("stroke-width", 0.75))
            .call(g => g.append("line")
              .attr("class", "miniLine2")
              .attr("x1", s_x)
              .attr("y1", this._brush_margin.top + this._polygon_offset + this._brush_select[1])
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

        // 左边批次信息
        _renderInfoChart() {
          if (!this._is_merge) return;

          this._info_g === undefined ? undefined : this._info_g.remove();
          this._info_g = this._container.append('g')
            .attr('class', 'infoContentGroup')
            .attr('transform', `translate(${[0, 0]})`);
          
          this._renderInfoLinkMergeArea();
          this._renderInfoDetail();

          this._changeInfoCircleStatus();
        }
        _renderInfoLinkMergeArea() {
          let InfoLinkGroup = this._info_g.append('g')
            .attr('class', 'InfoLinkGroup');

          let linkRectMerge = InfoLinkGroup.selectAll('.linkRectMerge')
            .data(this._mergeresult_1)
            .join('g')
            .attr('class', 'linkRectMerge')
            .attr('id', d => `linkRectMerge${d.batch_index}`)
            // .attr('transform', d => `translate(${[0, this._y(d.batch_s)]})`)
            .attr("opacity", 0.4)
          
          linkRectMerge
            .append("rect")
            .attr('class', 'linkRectMergeBatch')
            .attr('id', d => `linkRectMergeBatch${d.batch_index}`)
            .attr('batch_index', d => d.batch_index)
            .attr("transform", d => `translate(${[this._info_size.w - 10, this._y(d.batch_s)]})`)
            .attr("width", 2)
            .attr("height", d => this._y(d.batch_e)- this._y(d.batch_s))
            .attr("fill", d => d.batchColor)
          
          linkRectMerge.selectAll('linkRectMergeItem')
            .data(d => d.merge_data)
            .enter()
            .append("rect")
            .attr('class', 'linkRectMergeItem')
            .attr('id', d => `linkRectMergeItem${d.merge_index}`)
            // .attr('id', d => `linkRectMergeItem_${d.steelspec}`)
            .attr('merge_index', d => d.merge_index)
            .attr("transform", d => `translate(${[this._info_size.w - 12, this._y(d.date_entry_s)]})`)
            .attr("width", 2)
            .attr("height", d => this._y(d.date_entry_e)- this._y(d.date_entry_s))
            .attr("fill", d => d.pathColor)
          
          let link_path = d => {
            let pathHeight = this._y(d.date_entry_e) - this._y(d.date_entry_s);

            let source_x = this._coreX + this._rectWidth;
            let source_y = this._y(d.batch_s) + d.info_index*(this._detail_rect_w+this._detail_gap);
            let target_x = this._info_size.w - 20;
            let target_y = this._y(d.date_entry_s) + pathHeight/2;

            return d3.linkHorizontal()({
              source: [source_x, source_y],
              target: [target_x, target_y]
            })
          }
          linkRectMerge.selectAll('steelspec_link_group')
            .data(d => d.one_batch_info)
            .enter()
            .append('g')
            .attr('class', 'steelspec_link_group')
            .attr('id', d => `steelspec_link_group_${d.info_index}`)
          .selectAll('.linkRectLine')
            .data(d => d.link_rect)
            .enter()
            .append('path')
            .attr('class', 'linkRectLine')
            .attr('id', d => `linkRectLine${d.merge_index}`)
            .attr('batch_index', d => d.batch_index)
            .attr('info_index', d => d.info_index)
            .attr('merge_index', d => d.merge_index)
            .attr('d', link_path)
            .attr("stroke", d => d.pathColor)
            .attr("fill", "none")
            .attr("stroke-width", 2)
          
        }
        _renderInfoDetail() {
          let that = this;

          let InfoDetailGroup = this._info_g.append('g')
            .attr('class', 'InfoDetailGroup');

          let oneBatchChartGroup = InfoDetailGroup.selectAll('.oneBatchChartGroup')
            .data(this._mergeresult_1)
            .join('g')
            .attr('transform', (d, i) => {
              let chart_x = this._coreX - 1.8*65 + (this._info_bgc_w - this._detail_rect_w)/2 + 3;
              let chart_y = this._y(d.batch_s);
              return `translate(${[chart_x, chart_y]})`
            })
            .attr('batch_index', d => d.batch_index)
            .attr('class', 'oneBatchChartGroup')
            .attr('id', d => `oneBatchChartGroup${d.batch_index}`)
            .attr('opacity', 0.8)

          let chartGroup = oneBatchChartGroup.selectAll('chartGroup')
            .data(d => d.one_batch_info)
            .join('g')
            .attr('transform', (d, i) => `translate(${[0, (this._detail_rect_w + this._detail_gap)*d.info_index]})`)
            .attr('class', 'chartGroup')
            .attr('id', d => `chartGroup_${d.info_index}`)
            .attr('info_index', d => d.info_index)
            .attr('batch_index', d => d.link_rect[0].batch_index)
            .attr('merge_index', d => d.link_rect.map(e => ''+e.merge_index).join(' '))
            // .attr('id', d => d.steelspec)
            .on('click', __pathClick)
            .on('mouseover', __pathOver)
            .on('mouseout', __pathOut);
          
          chartGroup
            .append('g')
            .attr('class', 'infoBackground')
            .append('rect')
						.attr('class', 'lineRect')
						// .attr('id', d => 'lineRect' + d.batch_index)
            .attr('width', this._detail_rect_w)
            .attr('height', this._detail_rect_w)
            .attr('stroke', d => d.pathColor)
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.4)
            .attr('fill', 'white')
            .attr('filter', 'url(#shadow-card)');
          
          this._renderInfoDetailCircle(chartGroup);

          function __pathClick(e, d) {
            let info_index = d3.select(this).attr('info_index');
            let batch_index = d3.select(this).attr('batch_index');
            let merge_index = d3.select(this).attr('merge_index');
            let merge_index_list = merge_index.split(' ').map(d => +d);
            let info_id = batch_index + '_' + info_index;

            let brush_h = that._brush_select[1] - that._brush_select[0];
            let new_brush_s = that._mini_y(d.link_rect[0].batch_s) - 2;
            let new_brush_e = new_brush_s + brush_h;
            let new_brush = [new_brush_s, new_brush_e]
            that._brush_select = new_brush
            that._brush_g.select('.brush').call(that._brush.move, new_brush);
            let selected_plates = that.__getSelectPlate([batch_index], merge_index_list);
            
            if (that._mergeClickValue[info_id] != undefined) {
              delete that._mergeClickValue[info_id];
              vm.hightLight([]);
              vm.$emit("clickDiagnosisButton");
            } else {
              if (Object.keys(that._mergeClickValue).length !== 0) {
                that._mergeClickValue = [];
              }
              that._mergeClickValue[info_id] = {
                batch_index: batch_index,
                info_index: info_index,
                merge_index_list: merge_index_list
              };

              that._trainClickHandle(info_id.split('_')[0]);   // 点击后往父组件发送数据
              
              let merge_items_upid = selected_plates.map(d => d.upid);
              let sort_res = d3.sort(merge_items_upid, d => that._dataUCL.get(d)!==undefined ? -that._dataUCL.get(d)[0].flag : 0);
              vm.hightLight(sort_res);
            }
          }
          function __pathOver(e, d) {
            let batch_index = d3.select(d3.select(this)._groups[0][0].parentNode).attr('batch_index');
            let merge_index = d3.select(this).attr('merge_index');
            let merge_index_list = d.link_rect.map(e => e.merge_index);
            let info_index = d3.select(this).attr('info_index');
            let info_id = batch_index + '_' + info_index;
            let selected_plates = that.__getSelectPlate([batch_index], merge_index_list);

            that._setMergeRect([batch_index], merge_index.split(' ').map(d => +d));
            that._setInfoDetail(batch_index, info_index);

            that._setMergeBin(selected_plates);
            that._emitToScatter(selected_plates, 0);

            if(that._mergeClickValue[info_id] == undefined) {
              that._emitToScatter(selected_plates, 0);
            }
          }
          function __pathOut(e, d) {
            let batch_index = d3.select(d3.select(this)._groups[0][0].parentNode).attr('batch_index');
            let merge_index_list = d.link_rect.map(e => e.merge_index);
            let info_index = d3.select(this).attr('info_index');
            let info_id = batch_index + '_' + info_index;
            let selected_plates = that.__getSelectPlate([batch_index], merge_index_list);

            that._resetMergeRect();
            that._resetInfoDetail();

            that._resetMergeBin();
            that._emitToScatter(selected_plates, 1);

            that._keepClickedStatus();

            // mergeGopacity(d);
            // var i = d3.select(this).attr('index');
            if(that._mergeClickValue[info_id] == undefined) {
              that._emitToScatter(selected_plates, 1);
            }
          }
        }
        _renderInfoDetailCircle(chartGroup) {
          let that = this;
          
          // 角度相关参数
          const PI = Math.PI;
          let arc_start = -PI/6;
          let arc_gap_angle = 0.1;
          let pr_angle = PI/3;
          

          let sub_num = [5, 7, 2];  // 各母工序包含子工序的个数
          let stage_name = ['H', 'R', 'C'];
          this._uniformity_angle = __uniformityArcAngle();
          this._proportion_angle = __propotionArcAngle();
          // console.log('uniformity: ', this._uniformity_angle);
          // console.log('proportion: ', this._proportion_angle);

          this._uniform_FillContent(chartGroup);  // 画填充
          this._uniform_StageStroke(chartGroup);   // 画格
          this._uniform_ErrorLine(chartGroup);    // 画误差线
          this._uniform_QuantileLine(chartGroup);    // 分位线
          // this._StageText(chartGroup);            // 工序文字
          this._renderCenterRect(chartGroup);

          // 角度计算 -> 图元模态：均匀分布
          function __uniformityArcAngle() {
            let stage_angle = [];
            let arc_angle_sum = 2*PI - pr_angle -4*arc_gap_angle;
            let per_sub_angle = arc_angle_sum / d3.sum(sub_num);
            sub_num.forEach(d => stage_angle.push(d * per_sub_angle));

            let res = [];
            for (let i = 0; i < stage_name.length; i++) {
              let stage_start = (i===0 ? (pr_angle/2) : res.slice(-1)[0].stage_end) + arc_gap_angle;
              let stage_end = stage_start + stage_angle[i];

              let _sub = [];
              for (let j = 0; j < sub_num[i]; j++) {
                let s = j===0 ? stage_start : _sub.slice(-1)[0][1];
                let e = s + per_sub_angle;
                _sub.push([s, e]);
              }

              res.push({
                name: stage_name[i],
                stage_start: stage_start,
                stage_end: stage_end,
                stage_sub: _sub
              })
            }
            
            return res;
          }
          // 角度计算 -> 图元模态：时长占比分布
          function __propotionArcAngle() {
            let res = [];
            for (let i = 0; i < stage_name.length; i++) {
              let stage_start = (
                i===0 ? (that._arc_start+that._proportion_pr_angle) : res.slice(-1)[0].stage_end
              ) + that._arc_gap_angle;

              let stage_end = stage_start + that._proportion_stage_angle[i];

              let _sub = [];
              for (let j = 0; j < sub_num[i]; j++) {
                let s = j===0 ? stage_start : _sub.slice(-1)[0][1];
                let e = s + that._proportion_sub_angle[i][j] * (stage_end - stage_start);
                _sub.push([s, e]);
              }

              res.push({
                name: stage_name[i],
                stage_start: stage_start,
                stage_end: stage_end,
                stage_sub: _sub
              })
            }
            
            return res;
          }
        }
        _uniform_FillContent(chartGroup) {
          let circlecolor = this._deepCopy(vm.processColor);
          circlecolor.unshift('#cccccc');  // 时间颜色
          let all_stage_angle = this._uniformity_angle;
          let pr_angle = this._uniformity_pr_angle;

          let FillArcGroup = chartGroup.append('g')
            .attr('class', 'FillArcGroup')
            .attr('transform', `translate(${[this._circleR, this._circleR]})`);
            
          // 节奏
          FillArcGroup.append('path')
            .attr('d', d => d3.arc()
              .innerRadius(this._inner_arc_r1)
              .outerRadius(this._inner_arc_r2)
              .startAngle(this._arc_start)
              .endAngle(this._arc_start + pr_angle * (d.pr_angle[0]>=1?1:d.pr_angle[0]))())
            .attr('class', 'inner_pr_fill')
            .attr('fill', d => d.pr_angle[0]>=1?`url(#hatching_pattern_${0})`:circlecolor[0]);
            
          // 填充内环
          FillArcGroup.selectAll('.innerFill')
            .data(datum => datum.stage_angle)
            .enter()
            .append('path')
            .attr('d', (d, i) => {
              let start_angle = all_stage_angle[i].stage_start;
              let end_angle = all_stage_angle[i].stage_end;
              let arc_angle = start_angle + (end_angle-start_angle) * (d[0]>=1?1:d[0]);
              return d3.arc()
                .innerRadius(this._inner_arc_r1)
                .outerRadius(this._inner_arc_r2)
                .startAngle(start_angle)
                .endAngle(arc_angle)()
            })
            .attr('class', 'inner_stage_fill')
            .attr('fill', (d, i) => d[0]>=1?`url(#hatching_pattern_${i+1})`:circlecolor[i+1]);
            
          // 填充外环
          let outerFill = FillArcGroup.selectAll('.outerFill')
            .data(datum => datum.stage_sub_angle)
            .enter()
            .append('path')
            .attr('d', d => {
              let start_angle = all_stage_angle[d[0].stage_i].stage_sub[d[0].sub_j][0];
              let end_angle = all_stage_angle[d[0].stage_i].stage_sub[d[0].sub_j][1];
              let arc_angle = start_angle + (end_angle - start_angle) * (d[0].data>=1?1:d[0].data);
              return d3.arc()
                .innerRadius(this._outer_arc_r1)
                .outerRadius(this._outer_arc_r2)
                .startAngle(start_angle)
                .endAngle(arc_angle)()
            })
            .attr('class', 'inner_sub_fill')
            .attr('fill', d => d[0].data>=1?`url(#hatching_sub_pattern_${d[0].stage_i+1})`:circlecolor[d[0].stage_i + 1]);
        }
        _uniform_StageStroke(chartGroup) {
          let all_stage_angle = this._uniformity_angle;
          let pr_angle = this._uniformity_pr_angle;
          let path_attr = g => g
              .attr('stroke', 'grey')
              .attr('stroke-width', 1)
              .attr('fill', 'none');
            
          let ArcGroup = chartGroup.append('g')
            .attr('class', 'ArcGroup')
            .attr('transform', `translate(${[this._circleR, this._circleR]})`);
            
          // 生产节奏
          ArcGroup.selectAll('.inner_pr_stroke')
            .data([pr_angle])
            .enter()
            .append('path')
            .attr('d', d => d3.arc()
              .innerRadius(this._inner_arc_r1)
              .outerRadius(this._inner_arc_r2)
              .startAngle(this._arc_start)
              .endAngle(this._arc_start + d)())
            .attr('class', 'inner_pr_stroke')
            .call(path_attr);

          // 母工序
          ArcGroup.selectAll('.parentProcess')
            .data(all_stage_angle)
            .enter()
            .append('path')
            .attr('d', d => d3.arc()
              .innerRadius(this._inner_arc_r1)
              .outerRadius(this._inner_arc_r2)
              .startAngle(d.stage_start)
              .endAngle(d.stage_end)())
            .attr('class', 'inner_stage_stroke')
            .call(path_attr);
          // 子工序
          ArcGroup.selectAll('.subProcess')
            .data(all_stage_angle.map(d => d.stage_sub).flatMap(d => d))
            .enter()
            .append('path')
            .attr('d', d => d3.arc()
              .innerRadius(this._outer_arc_r1)
              .outerRadius(this._outer_arc_r2)
              .startAngle(d[0])
              .endAngle(d[1])())
            .attr('class', 'outer_sub_stroke')
            .call(path_attr);
        }
        _uniform_ErrorLine(chartGroup) {
          let circlecolor = this._deepCopy(vm.processColor);
          circlecolor.unshift('#cccccc');  // 时间颜色
          let all_stage_angle = this._uniformity_angle;
          let pr_angle = this._uniformity_pr_angle;
          let error_end_len = (this._inner_arc_r2 - this._inner_arc_r1) / 4;
          let darker_val = 0.5;

          let ErrorLineGroup = chartGroup.append('g')
            .attr('class', 'ErrorLineGroup')
            .attr('transform', `translate(${[this._circleR, this._circleR]})`);
            
          // // 节奏
          // FillArcGroup.append('path')
          //   .attr('d', d => d3.arc()
          //     .innerRadius(this._inner_arc_r1)
          //     .outerRadius(this._inner_arc_r2)
          //     .startAngle(this._arc_start)
          //     .endAngle(this._arc_start + pr_angle * (d.pr_angle[0]>=1?1:d.pr_angle[0]))())
          //   .attr('class', 'inner_pr_fill')
          //   .attr('fill', d => d.pr_angle[0]>=1?`url(#hatching_pattern_${0})`:circlecolor[0]);
            
          // 内环误差线
          let innerErrorLine = ErrorLineGroup.selectAll('.innerErrorLine')
            .data(datum => datum.stage_angle)
            .enter()
            .append('g')
            .attr('class', 'innerErrorLine')

          innerErrorLine
            .append('path')
            .attr('class', 'inner_stage_error_line')
            .attr('fill', (d, i) => d3.color(circlecolor[i+1]).darker(darker_val))
            .attr('d', (d, i) => {
              if (d[0] >= 1) return ''

              let line_r = (this._inner_arc_r2 + this._inner_arc_r1) / 2 - this._inner_err_w/2;
              let start_angle = all_stage_angle[i].stage_start + (all_stage_angle[i].stage_end - all_stage_angle[i].stage_start) * d[0];
              let arc_angle = (all_stage_angle[i].stage_end - all_stage_angle[i].stage_start) * d[1];
              return d3.arc()
                .innerRadius(line_r - this._inner_err_w/2)
                .outerRadius(line_r + this._inner_err_w/2)
                .startAngle(start_angle - arc_angle/2)
                .endAngle(start_angle + arc_angle/2)()
            });
          innerErrorLine
            .append('path')
            .attr('class', 'inner_stage_error_line_end1')
            .attr('fill', (d, i) => d3.color(circlecolor[i+1]).darker(darker_val))
            .attr('d', (d, i) => {
              if (d[0] >= 1) return ''

              let line_r = (this._inner_arc_r2 + this._inner_arc_r1) / 2 - this._inner_err_w/2;
              let start_angle = all_stage_angle[i].stage_start + (all_stage_angle[i].stage_end - all_stage_angle[i].stage_start) * d[0];
              let arc_angle = (all_stage_angle[i].stage_end - all_stage_angle[i].stage_start) * d[1];
              return d3.arc()
                .innerRadius(line_r - error_end_len)
                .outerRadius(line_r + error_end_len)
                .startAngle(start_angle + arc_angle/2)
                .endAngle(start_angle + arc_angle/2 + 0.025)()
            });
          innerErrorLine
            .append('path')
            .attr('class', 'inner_stage_error_line_end2')
            .attr('fill', (d, i) => d3.color(circlecolor[i+1]).darker(darker_val))
            .attr('d', (d, i) => {
              if (d[0] >= 1) return ''

              let line_r = (this._inner_arc_r2 + this._inner_arc_r1) / 2 - this._inner_err_w/2;
              let start_angle = all_stage_angle[i].stage_start + (all_stage_angle[i].stage_end - all_stage_angle[i].stage_start) * d[0];
              let arc_angle = (all_stage_angle[i].stage_end - all_stage_angle[i].stage_start) * d[1];
              return d3.arc()
                .innerRadius(line_r - error_end_len)
                .outerRadius(line_r + error_end_len)
                .startAngle(start_angle - arc_angle/2)
                .endAngle(start_angle - arc_angle/2 - 0.025)()
            });
        }
        _uniform_QuantileLine(chartGroup) {
          let circlecolor = this._deepCopy(vm.processColor);
          circlecolor.unshift('#cccccc');  // 时间颜色
          let all_stage_angle = this._uniformity_angle;
          let pr_angle = this._uniformity_pr_angle;

          let QuantileLineGroup = chartGroup.append('g')
            .attr('class', 'QuantileLineGroup')
            .attr('transform', `translate(${[this._circleR, this._circleR]})`);
            
          // // 节奏
          // FillArcGroup.append('path')
          //   .attr('d', d => d3.arc()
          //     .innerRadius(this._inner_arc_r1)
          //     .outerRadius(this._inner_arc_r2)
          //     .startAngle(this._arc_start)
          //     .endAngle(this._arc_start + pr_angle * (d.pr_angle[0]>=1?1:d.pr_angle[0]))())
          //   .attr('class', 'inner_pr_fill')
          //   .attr('fill', d => d.pr_angle[0]>=1?`url(#hatching_pattern_${0})`:circlecolor[0]);
            
          // 填充内环
          let quantileLineGroup = QuantileLineGroup.selectAll('.quantileLine')
            .data(datum => datum.stage_quantile)
            .enter()
            .append('g')
            .attr('class', 'quantileLineGroup')
          
          quantileLineGroup
            .append('path')
            .attr('class', 'quantile_line')
            .attr('fill', (d, i) => circlecolor[i+1])
            .attr('d', (d, i) => {
              if (!d[0] || d[0] >= 1 || d[3] >= 1) return ''

              let start_angle = all_stage_angle[i].stage_start;
              let end_angle = all_stage_angle[i].stage_end;
              let arc_start_angle = start_angle + (end_angle-start_angle) * d[0];
              let arc_end_angle = start_angle + (end_angle-start_angle) * d[2];
              return d3.arc()
                .cornerRadius(1.5)
                .innerRadius(this._quantile_r1)
                .outerRadius(this._quantile_r2)
                .startAngle(arc_start_angle)
                .endAngle(arc_end_angle)()
            });

          let c_r = (this._quantile_r2 + this._quantile_r1) / 2;
          quantileLineGroup
            .append('circle')
            .attr('class', 'quantile_circle')
            .attr('fill', (d, i) => d3.color(circlecolor[i+1]))//.brighter(0.3)
            .attr('stroke', (d, i) => d3.color(circlecolor[i+1]).darker(0.5))
            .attr('stroke-width', 1)
            .attr("r", (d, i) => (!d[0] || d[0] >= 1 || d[3] >= 1) ? 0 : 2)
            .attr("cy", (d, i) => {
              if (!d[0]) return 0
              let start_angle = all_stage_angle[i].stage_start;
              let end_angle = all_stage_angle[i].stage_end;
              let c_angle = start_angle + (end_angle-start_angle) * d[1];
              return -(Math.cos(c_angle) * c_r);
            })
            .attr("cx", (d, i) => {
              if (!d[0]) return 0
              let start_angle = all_stage_angle[i].stage_start;
              let end_angle = all_stage_angle[i].stage_end;
              let c_angle = start_angle + (end_angle-start_angle) * d[1];
              return Math.sin(c_angle) * c_r;
            });
        }
        _renderCenterRect(chartGroup) {
          let color = [vm.labelColors[1], vm.labelColors[0], vm.noflagColor]; // good, bad, noflag
          let rect_w = 20;
          let gap = 1;

          let CenterRectGroup = chartGroup.selectAll('CenterRectGroup')
            .data(d => d.label_statistics)
            .enter()
            .append('g')
            .attr('class', 'CenterRectGroup')
            .attr('transform', `translate(${[this._circleR, this._circleR-rect_w/Math.pow(2, 0.5)]}) rotate(45)`)

          CenterRectGroup.selectAll('.good_bad_noflag')
            .data(d => getPolygonPoint(rect_w, gap, ...d))
            .enter()
            .append("path")
            .attr("fill", (_, i) => color[i])
            .attr("fill-opacity", 0.4)
            .attr("stroke", (_, i) => d3.color(color[i]).darker(0.5))
            .attr('stroke-width', 0.2)
            .attr("d", d => `M${d.point.join("L")}Z`)
            .attr("transform", d => `translate(${d.pos[0]}, ${d.pos[1]})`)
          
          function getPolygonPoint(rect_w, gap, good, bad, no_flag) {
            let square = rect_w*rect_w,
            g_sq = good*square, b_sq = bad*square, n_sq = no_flag*square;
            let no_point, good_point, bad_point;

            // 考虑极端情况
            if (good==0 && bad==0 && no_flag==1) {
              return [{point: [[0,0]], pos: [0,0]}, 
                {point: [[0,0]], pos: [0,0]},
                {point: [[0,0],[rect_w,0], [rect_w,rect_w], [0,rect_w], [0,0]], pos: [0,0]}];
            } else if (good==0 && bad==1 && no_flag==0) {
              return [{point: [[0,0]], pos: [0,0]}, 
                {point: [[0,0],[rect_w,0], [rect_w,rect_w], [0,rect_w], [0,0]], pos: [0,0]},
                {point: [[0,0]], pos: [0,0]}];
            } else if (good==1 && bad==0 && no_flag==0) {
              return [{point: [[0,0],[rect_w,0], [rect_w,rect_w], [0,rect_w], [0,0]], pos: [0,0]}, 
                {point: [[0,0]], pos: [0,0]},
                {point: [[0,0]], pos: [0,0]}];
            }

            if (n_sq != 0) {  // 存在无标签的板
              let no_w = Math.pow(n_sq, 0.5);
              no_point = [[0,0], [no_w,0], [no_w,no_w], [0,no_w], [0,0]];

              let sq_1 = (rect_w-no_w)*(rect_w-no_w)/2, sq_2 = sq_1 + no_w*(rect_w-no_w), sq_3 = sq_2 + no_w*(rect_w-no_w);
              if (g_sq <= sq_1) {   // 好板的面积落在区域1
                let g_w = Math.pow(2*g_sq, 0.5);
                good_point = [[0,rect_w-g_w], [g_w,rect_w], [0,rect_w], [0,rect_w-g_w]];
                bad_point  = [[0,rect_w-g_w], [0,no_w], [no_w,no_w], [no_w,0], [rect_w,0], [rect_w,rect_w], [g_w,rect_w], [0,rect_w-g_w]];
              } else if (g_sq > sq_1 && g_sq <= sq_2) {   // 好板的面积落在区域2
                let g_w1 = (2*g_sq/(rect_w-no_w) - rect_w + no_w) / 2,
                    g_w2 = g_w1 + rect_w - no_w;
                good_point = [[0,no_w], [g_w1,no_w], [g_w2,rect_w], [0,rect_w], [0,no_w]];
                bad_point  = [[g_w1,no_w], [no_w,no_w], [no_w,0], [rect_w,0], [rect_w,rect_w], [g_w2,rect_w], [g_w1,no_w]];
              } else if (g_sq > sq_2 && g_sq <= sq_3) {   // 好板的面积落在区域3
                let b_w1 = (2*b_sq/(rect_w-no_w) - rect_w + no_w) / 2,
                    b_w2 = b_w1 + rect_w - no_w;
                good_point = [[0,no_w], [no_w,no_w], [no_w,b_w1], [rect_w,b_w2], [rect_w,rect_w], [0,rect_w], [0,no_w]];
                bad_point  = [[no_w,b_w1], [no_w,0], [rect_w,0], [rect_w,b_w2], [no_w,b_w1]];
              } else {
                let b_w = Math.pow(2*b_sq, 0.5);
                good_point = [[rect_w-b_w,0], [rect_w,b_w], [rect_w,rect_w], [0,rect_w], [0,no_w], [no_w,no_w], [no_w,0], [rect_w-b_w,0]];
                bad_point  = [[rect_w-b_w,0], [rect_w,rect_w], [rect_w,b_w], [rect_w-b_w,0]];
              }
              return [{point: good_point, pos: good>=bad?[gap,gap]:[-gap/Math.pow(2,0.5),gap]}, 
                {point: bad_point, pos: good>=bad?[gap,-gap/Math.pow(2,0.5)]:[gap,gap]},
                {point: no_point, pos: [0,0]}];
            }
            else {  // 只有好与坏
              no_point = [[0,0]];
              if (g_sq>=b_sq) {
                let b_w = Math.pow(2*b_sq, 0.5);
                good_point = [[0,0], [rect_w-b_w, 0], [rect_w, b_w], [rect_w, rect_w], [0, rect_w], [0,0]];
                bad_point = [[rect_w-b_w,0], [rect_w,0], [rect_w,b_w], [rect_w-b_w,0]];
              } else {
                let g_w = Math.pow(2*g_sq, 0.5);
                good_point = [[0,rect_w-g_w], [g_w,rect_w], [0,rect_w], [0,rect_w-g_w]];
                bad_point = [[0,0], [rect_w, 0], [rect_w, rect_w], [g_w, rect_w], [0,rect_w-g_w], [0,0]];
              }
              return [{point: good_point, pos: [0,0]},
                {point: bad_point, pos: [gap/Math.pow(2,0.5),-gap/Math.pow(2,0.5)]},
                {point: no_point, pos: [0,0]}];
            }
          }
        }
        _StageText(chartGroup) {
          let circlecolor = this._deepCopy(vm.processColor);
          circlecolor.unshift('#cccccc');  // 时间颜色
          let all_stage_angle = this._uniformity_angle;
          let pr_angle = this._uniformity_pr_angle;
          let text = ['Pr', 'Fu', 'M', 'C']

          let StageText = chartGroup.append('g')
            .attr('class', 'StageText')
            .attr('transform', `translate(${[this._circleR, this._circleR]})`);

          StageText.selectAll('.StageTextContent')
            .data(text)
            .enter()
            .append('g')
            .attr('class', 'StageTextGroup')
            .attr("transform", (d, i) => {
              let text_r = this._quantile_r1 - 10;
              let start = i===0 ? this._arc_start : all_stage_angle[i-1].stage_start;
              let end = i===0 ? (this._arc_start+pr_angle) : all_stage_angle[i-1].stage_end;
              let rotate = start + (end - start)/2;
              let tran_x = text_r * Math.cos(rotate-Math.PI/2);
              let tran_y = text_r * Math.sin(rotate-Math.PI/2);
              return `translate(${tran_x}, ${tran_y})`
            })
            .append('text')
            .attr('class', 'StageTextContent')
            .attr("transform", (d, i) => {
              let text_r = this._quantile_r1 - 10;
              let start = i===0 ? this._arc_start : all_stage_angle[i-1].stage_start;
              let end = i===0 ? (this._arc_start+pr_angle) : all_stage_angle[i-1].stage_end;
              let rotate = start + (end - start)/2;
              return `rotate(${rotate*180/Math.PI})`
            })
            .text(d => d)
						.attr("fill", (d, i) => d3.color(circlecolor[i]).darker(0.6))
            .attr('text-anchor', 'middle')
            .style("font-family", util.conditionRadiaTextAttr.fontFamily)
            .style("font-weight", util.conditionRadiaTextAttr.fontWeight)
            .style("font-style", util.conditionRadiaTextAttr.fontStyle)
						.style("font-size", util.conditionRadiaTextAttr.fontSize)
        }
        _changeInfoCircleStatus() {
          let that = this;
          let changebutton = this._info_g.append('g')
            .attr('transform', `translate(${[27, 10]})`);

          let button_w = 30
          let button_gap = 5;
          changebutton.append('rect')
            .attr('width', button_w)
            .attr('height', button_w)
            .attr('fill', 'white')
            .attr('rx', 2)
            .attr('ry', 2)
            // .attr('stroke', '#aaa');
          changebutton.append('image')
            .attr('id', 'info_state')
            .attr('width', button_w-button_gap)
            .attr('height', button_w-button_gap)
            .attr('transform', `translate(${[button_gap/2, button_gap/2]})`)
            .attr('href', info_state)

          changebutton
            .on('click', (event, d) => {
              this._info_state = !this._info_state;
              this._info_g.select('#info_state')
                .attr('href', this._info_state ? info_state : info_state1)

              let InfoDetailGroup = this._info_g.select('.InfoDetailGroup');

              // uniformity to proportion
              if (!this._info_state) {
                __transStroke(InfoDetailGroup, this._proportion_pr_angle, this._uniformity_pr_angle, this._proportion_angle, this._uniformity_angle);
                __transFill(InfoDetailGroup, this._proportion_pr_angle, this._uniformity_pr_angle, this._proportion_angle, this._uniformity_angle);
                __transErrLine(InfoDetailGroup, this._proportion_pr_angle, this._uniformity_pr_angle, this._proportion_angle, this._uniformity_angle);
                __transText(InfoDetailGroup, this._proportion_pr_angle, this._proportion_angle);
              }
              // proportion to uniformity
              else {
                __transStroke(InfoDetailGroup, this._uniformity_pr_angle, this._proportion_pr_angle, this._uniformity_angle, this._proportion_angle);
                __transFill(InfoDetailGroup, this._uniformity_pr_angle, this._proportion_pr_angle, this._uniformity_angle, this._proportion_angle);
                __transErrLine(InfoDetailGroup, this._uniformity_pr_angle, this._proportion_pr_angle, this._uniformity_angle, this._proportion_angle);
                __transText(InfoDetailGroup, this._uniformity_pr_angle, this._uniformity_angle);
              }
            })

          function __transStroke(Group, new_pr_angle, old_pr_angle, new_stage_angle, old_stage_angle) {
            let tran = d3.transition().delay(50).duration(500);
            let path_attr = g => g
              .attr('stroke', 'grey')
              .attr('stroke-width', 1)
              .attr('fill', 'none');
            let ArcGroup = Group.selectAll('.ArcGroup');
            
            ArcGroup.selectAll('.inner_pr_stroke')
              .transition(tran)
              .attrTween('d', (d,i) => {
                let interpolate = d3.interpolate(that._arc_start + old_pr_angle, that._arc_start + new_pr_angle);
                return function(t) {
                  return d3.arc()
                    .innerRadius(that._inner_arc_r1)
                    .outerRadius(that._inner_arc_r2)
                    .startAngle(that._arc_start)
                    .endAngle(interpolate(t))();
                }
              })
            ArcGroup.selectAll('.inner_stage_stroke')
              .data(new_stage_angle)
              .transition(tran)
              .attrTween('d', (d, i) => {
                let start_interpolate = d3.interpolate(old_stage_angle[i].stage_start, d.stage_start);
                let end_interpolate = d3.interpolate(old_stage_angle[i].stage_end, d.stage_end);
                return function(t) {
                  return d3.arc()
                    .innerRadius(that._inner_arc_r1)
                    .outerRadius(that._inner_arc_r2)
                    .startAngle(start_interpolate(t))
                    .endAngle(end_interpolate(t))();
                }
              })
            let old_stage_sub = old_stage_angle.map(d => d.stage_sub).flatMap(d => d)
            ArcGroup.selectAll('.outer_sub_stroke')
              .data(new_stage_angle.map(d => d.stage_sub).flatMap(d => d))
              .transition(tran)
              .attrTween('d', (d, i) => {
                let start_interpolate = d3.interpolate(old_stage_sub[i][0], d[0]);
                let end_interpolate = d3.interpolate(old_stage_sub[i][1], d[1]);
                return function(t) {
                  return d3.arc()
                    .innerRadius(that._outer_arc_r1)
                    .outerRadius(that._outer_arc_r2)
                    .startAngle(start_interpolate(t))
                    .endAngle(end_interpolate(t))();
                }
              })
          }
          function __transFill(Group, new_pr_angle, old_pr_angle, new_stage_angle, old_stage_angle) {
            let tran = d3.transition().delay(50).duration(500);
            let FillArcGroup = Group.selectAll('.FillArcGroup');

            FillArcGroup.selectAll('.inner_pr_fill')
              .transition(tran)
              .attrTween('d', (d,i) => {
                let interpolate = d3.interpolate(
                  that._arc_start + old_pr_angle * (d.pr_angle[0]>=1?1:d.pr_angle[0]),
                  that._arc_start + new_pr_angle * (d.pr_angle[0]>=1?1:d.pr_angle[0])
                );
                return function(t) {
                  return d3.arc()
                    .innerRadius(that._inner_arc_r1)
                    .outerRadius(that._inner_arc_r2)
                    .startAngle(that._arc_start)
                    .endAngle(interpolate(t))();
                }
              })
            FillArcGroup.selectAll('.inner_stage_fill')
              .transition(tran)
              .attrTween('d', (d, i) => {
                let old_angle_span = (old_stage_angle[i].stage_end - old_stage_angle[i].stage_start) * (d[0]>=1?1:d[0]);
                let new_angle_span = (new_stage_angle[i].stage_end - new_stage_angle[i].stage_start) * (d[0]>=1?1:d[0]);

                let start_interpolate = d3.interpolate(old_stage_angle[i].stage_start, new_stage_angle[i].stage_start);
                let end_interpolate = d3.interpolate(
                  old_stage_angle[i].stage_start + old_angle_span,
                  new_stage_angle[i].stage_start + new_angle_span
                );
                return function(t) {
                  return d3.arc()
                    .innerRadius(that._inner_arc_r1)
                    .outerRadius(that._inner_arc_r2)
                    .startAngle(start_interpolate(t))
                    .endAngle(end_interpolate(t))();
                }
              })
            FillArcGroup.selectAll('.inner_sub_fill')
              .transition(tran)
              .attrTween('d', (d, i) => {
                let old_angle_span = (old_stage_angle[d[0].stage_i].stage_sub[d[0].sub_j][1] - old_stage_angle[d[0].stage_i].stage_sub[d[0].sub_j][0]) * (d[0].data>=1?1:d[0].data);
                let new_angle_span = (new_stage_angle[d[0].stage_i].stage_sub[d[0].sub_j][1] - new_stage_angle[d[0].stage_i].stage_sub[d[0].sub_j][0]) * (d[0].data>=1?1:d[0].data);

                let start_interpolate = d3.interpolate(old_stage_angle[d[0].stage_i].stage_sub[d[0].sub_j][0], new_stage_angle[d[0].stage_i].stage_sub[d[0].sub_j][0]);
                let end_interpolate = d3.interpolate(
                  old_stage_angle[d[0].stage_i].stage_sub[d[0].sub_j][0] + old_angle_span,
                  new_stage_angle[d[0].stage_i].stage_sub[d[0].sub_j][0] + new_angle_span,
                );
                return function(t) {
                  return d3.arc()
                    .innerRadius(that._outer_arc_r1)
                    .outerRadius(that._outer_arc_r2)
                    .startAngle(start_interpolate(t))
                    .endAngle(end_interpolate(t))();
                }
              })
          }
          function __transText(Group, new_pr_angle, new_stage_angle) {
            let tran = d3.transition().delay(50).duration(500);
            let StageText = Group.selectAll('.StageText');
            StageText.selectAll('.StageTextGroup')
              .transition(tran)
              .attr("transform", (d, i) => {
                let text_r = that._inner_arc_r1 - 10;
                let start = i===0 ? that._arc_start : new_stage_angle[i-1].stage_start;
                let end = i===0 ? (that._arc_start+new_pr_angle) : new_stage_angle[i-1].stage_end;
                let rotate = start + (end - start)/2;
                let tran_x = text_r * Math.cos(rotate-Math.PI/2);
                let tran_y = text_r * Math.sin(rotate-Math.PI/2);
                return `translate(${tran_x}, ${tran_y})`
              })
            StageText.selectAll('.StageTextContent')
              .transition(tran)
              .attr("transform", (d, i) => {
                let text_r = that._inner_arc_r1 - 10;
                let start = i===0 ? that._arc_start : new_stage_angle[i-1].stage_start;
                let end = i===0 ? (that._arc_start+new_pr_angle) : new_stage_angle[i-1].stage_end;
                let rotate = start + (end - start)/2;
                return `rotate(${rotate*180/Math.PI})`
              })
          }
          function __transErrLine(Group, new_pr_angle, old_pr_angle, new_stage_angle, old_stage_angle) {
            let tran = d3.transition().delay(50).duration(500);
            let ErrorLineGroup = Group.selectAll('.ErrorLineGroup');
            let error_end_len = (that._inner_arc_r2 - that._inner_arc_r1) / 4;

            ErrorLineGroup.selectAll('.inner_stage_error_line')
              .transition(tran)
              .attrTween('d', (d,i) => {
                if (d[0] >= 1) return ''

                let line_r = (that._inner_arc_r2 + that._inner_arc_r1) / 2 - that._inner_err_w/2;

                let old_start_angle = old_stage_angle[i].stage_start + (old_stage_angle[i].stage_end - old_stage_angle[i].stage_start) * d[0];
                let old_arc_angle = (old_stage_angle[i].stage_end - old_stage_angle[i].stage_start) * d[1];
                let new_start_angle = new_stage_angle[i].stage_start + (new_stage_angle[i].stage_end - new_stage_angle[i].stage_start) * d[0];
                let new_arc_angle = (new_stage_angle[i].stage_end - new_stage_angle[i].stage_start) * d[1];

                let start_interpolate = d3.interpolate(old_start_angle-old_arc_angle/2, new_start_angle-new_arc_angle/2);
                let end_interpolate = d3.interpolate(old_start_angle+old_arc_angle/2, new_start_angle+new_arc_angle/2);
                return function(t) {
                  return d3.arc()
                  .innerRadius(line_r - that._inner_err_w/2)
                  .outerRadius(line_r + that._inner_err_w/2)
                  .startAngle(start_interpolate(t))
                  .endAngle(end_interpolate(t))()
                }
              })
            ErrorLineGroup.selectAll('.inner_stage_error_line_end1')
              .transition(tran)
              .attrTween('d', (d,i) => {
                if (d[0] >= 1) return ''

                let line_r = (that._inner_arc_r2 + that._inner_arc_r1) / 2 - that._inner_err_w/2;
                
                let old_start_angle = old_stage_angle[i].stage_start + (old_stage_angle[i].stage_end - old_stage_angle[i].stage_start) * d[0];
                let old_arc_angle = (old_stage_angle[i].stage_end - old_stage_angle[i].stage_start) * d[1];
                let new_start_angle = new_stage_angle[i].stage_start + (new_stage_angle[i].stage_end - new_stage_angle[i].stage_start) * d[0];
                let new_arc_angle = (new_stage_angle[i].stage_end - new_stage_angle[i].stage_start) * d[1];

                let start_interpolate = d3.interpolate(old_start_angle+old_arc_angle/2, new_start_angle+new_arc_angle/2);
                let end_interpolate = d3.interpolate(old_start_angle+old_arc_angle/2 + 0.025, new_start_angle+new_arc_angle/2 + 0.025);
                return function(t) {
                  return d3.arc()
                  .innerRadius(line_r - error_end_len)
                  .outerRadius(line_r + error_end_len)
                  .startAngle(start_interpolate(t))
                  .endAngle(end_interpolate(t))()
                }
              })
            ErrorLineGroup.selectAll('.inner_stage_error_line_end2')
              .transition(tran)
              .attrTween('d', (d,i) => {
                if (d[0] >= 1) return ''

                let line_r = (that._inner_arc_r2 + that._inner_arc_r1) / 2 - that._inner_err_w/2;
                
                let old_start_angle = old_stage_angle[i].stage_start + (old_stage_angle[i].stage_end - old_stage_angle[i].stage_start) * d[0];
                let old_arc_angle = (old_stage_angle[i].stage_end - old_stage_angle[i].stage_start) * d[1];
                let new_start_angle = new_stage_angle[i].stage_start + (new_stage_angle[i].stage_end - new_stage_angle[i].stage_start) * d[0];
                let new_arc_angle = (new_stage_angle[i].stage_end - new_stage_angle[i].stage_start) * d[1];

                let start_interpolate = d3.interpolate(old_start_angle-old_arc_angle/2, new_start_angle-new_arc_angle/2);
                let end_interpolate = d3.interpolate(old_start_angle-old_arc_angle/2 - 0.025, new_start_angle-new_arc_angle/2 - 0.025);
                return function(t) {
                  return d3.arc()
                  .innerRadius(line_r - error_end_len)
                  .outerRadius(line_r + error_end_len)
                  .startAngle(start_interpolate(t))
                  .endAngle(end_interpolate(t))()
                }
              })
          }
          function __transQuantileLine(Group, new_pr_angle, old_pr_angle, new_stage_angle, old_stage_angle) {
            let tran = d3.transition().delay(50).duration(500);
            let QuantileLineGroup = Group.selectAll('.QuantileLineGroup');

            ErrorLineGroup.selectAll('.quantile_line')
              .transition(tran)
              .attrTween('d', (d,i) => {
                if (!d[0] || d[0] >= 1 || d[3] >= 1) return ''

                
              })
          }
        }

        // 右边监控视图
        _renderMonitorChart() {
          this._moni_g === undefined ? undefined : this._moni_g.remove();
          this._moni_g = this._container.append('g')
            .attr('class', 'monitorContentGroup')
            .attr('transform', `translate(${[this._info_size.w + this._marey_size.w + 35, 0]})`);

          this._renderMonitorContent_new();
        }
        _renderMonitorContent_new() {
          let rect_radius = 3;
          let monitorWidth = 360;
          let moni_rect_w = monitorWidth/3;
          let rectScale = d3.scaleLinear()
            .domain([0, 10])
            .range([0, moni_rect_w/2-10])

          let monitorRectGroup = this._moni_g.append('g')
            .attr('class', 'monitorRectGroup');
          
          let monitorRect = monitorRectGroup.selectAll('monitorRect')
            .data(this._mergeresult_1)
            .enter()
            .append('g')
            .attr('class', 'merge_moni')
            .attr('id', (d, i) => 'merge_moni_'+i)
            .attr('transform', d => `translate(${20}, ${this._y(d.proce_end_date_s)})`)
          
          let moni_process = monitorRect.selectAll('.moni_process_rect')
            .data(d => d.proce_num)
            .enter()
            .append('g')
            .attr('transform', (d, i) => `translate(${(moni_rect_w+10) * (+d.d - 1)}, 0)`)
          moni_process
            .append('rect')
            .attr('class', 'moni_process_rect')
            .attr('width', moni_rect_w)
            .attr('height', d => this._y(d.h_e)-this._y(d.h_s))
            .attr('rx', rect_radius)
            .attr('ry', rect_radius)
            .attr('fill', d => d.color)
            .attr('opacity', 0.1)
            .attr('stroke', '#CED3D6')
            .attr('stroke-width', 1)
          moni_process
            .append('rect')
						.attr('class', 'moni_process_rect')
            .attr('width', moni_rect_w)
            .attr('height', d => this._y(d.h_e)-this._y(d.h_s))
            .attr('rx', rect_radius)
            .attr('ry', rect_radius)
            .attr('stroke', d => d3.color(d.color).darker(0.1))
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.4)
            .attr('fill', 'none')
            .attr('filter', 'url(#shadow-card)');
          
          moni_process.selectAll('.diagnosis_value')
            .data(d => d.diag.T2)
            .enter()
            .append('rect')
            .attr('class', 'T2_diagnosis_value')
            .attr('id', d => 'diagnosis_value_' + d.upid)
            .attr('transform', (d, i) => `translate(${[
              -rectScale(d.value)+moni_rect_w/2-5, 
              d.i*(this._y(d.et)-this._y(d.st))/d.num
            ]})`)
            .attr('width', d => rectScale(d.value))
            .attr('height', d => (this._y(d.et)-this._y(d.st))/d.num)
            .attr('fill', d => d.color)
            .attr('stroke', d => d3.color(d.color).darker(0.2))
            .attr('stroke-width', 1)
            .attr('opacity', 0.4)
          
          moni_process.selectAll('.diagnosis_value')
            .data(d => d.diag.SPE)
            .enter()
            .append('rect')
            .attr('class', 'SPE_diagnosis_value')
            .attr('id', d => 'diagnosis_value_' + d.upid)
            .attr('transform', (d, i) => `translate(${[
              moni_rect_w/2+5, 
              d.i*(this._y(d.et)-this._y(d.st))/d.num
            ]})`)
            .attr('width', d => rectScale(d.value))
            .attr('height', d => (this._y(d.et)-this._y(d.st))/d.num)
            .attr('fill', d => d.color)
            .attr('stroke', d => d3.color(d.color).darker(0.2))
            .attr('stroke-width', 1)
            .attr('opacity', 0.4)
          
          // T2 报警线
          moni_process
            .append('path')
            .attr('class', 'T2_Line')
            .attr('transform', `translate(${[moni_rect_w/2-5, 0]})`)
            .attr('fill', 'none')
            .attr('stroke', '#666')
            .attr('stroke-width', 1)
            .attr('stroke-linejoin', 'round')
            .attr('stroke-dasharray', '3 3')
            .attr('stroke-linecap', 'round')
            .attr('d', (d, i) => {
              let line_data = [];
              let T2 = d.diag.T2;
              let count = 0;
              for (let j = 0; j < T2.length; j++) {
                let time_span = (this._y(T2[j].et)-this._y(T2[j].st))/T2[j].num;
                let line_x = -rectScale(T2[j].thresholds);
                line_data.push({
                  i: count,
                  line_x: line_x,
                  line_y: time_span
                })
                line_data.push({
                  i: count + 1,
                  line_x: line_x,
                  line_y: time_span
                })
                count += 1;
              }
              return d3.line()
                .x((e, j) => e.line_x)
                .y((e, j) => e.i*e.line_y)(line_data)
            })
          // SPE 报警线
          moni_process
            .append('path')
            .attr('class', 'SPE_Line')
            .attr('transform', `translate(${[moni_rect_w/2+5, 0]})`)
            .attr("fill", 'none')
            .attr("stroke", "#666")
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round")
            .attr("stroke-dasharray", "3 3")
            .attr("stroke-linecap", "round")
            .attr("d", (d, i) => {
              let line_data = [];
              let T2 = d.diag.SPE;
              let count = 0;
              for (let j = 0; j < T2.length; j++) {
                let time_span = (this._y(T2[j].et)-this._y(T2[j].st))/T2[j].num;
                let line_x = rectScale(T2[j].thresholds);
                line_data.push({
                  i: count,
                  line_x: line_x,
                  line_y: time_span
                })
                line_data.push({
                  i: count + 1,
                  line_x: line_x,
                  line_y: time_span
                })
                count += 1;
              }
              return d3.line()
                .x((e, j) => e.line_x)
                .y((e, j) => e.i*e.line_y)(line_data)
            })

          
          
            
        }

        // 交互事件定义
        _setMergeRect(batch_index_list, merge_index_list) {
          this._marey_g.selectAll('.mergeG')
            .attr('opacity', 0.4);
          this._marey_g.selectAll('.mareyLine')
            .attr('opacity', 0.4);

          for (let batch_index of batch_index_list) {
            for (let merge_index of merge_index_list) {
              this._marey_g.select(`#batchG${batch_index} #mergeG${merge_index}`)
                .attr('opacity', 1);
            }
          }

          this._setLinkLine(batch_index_list, merge_index_list);
        }
        _resetMergeRect() {
          this._marey_g.selectAll('.mergeG')
            .attr('opacity', 1);
          this._marey_g.selectAll('.mareyLine')
            .attr('opacity', 1);
          
          this._resetLinkLine();
        }
        _setLinkLine(batch_index_list, merge_index_list) {
          this._info_g.selectAll('.linkRectLine')
            .attr('opacity', 0.4);
          this._info_g.selectAll('.linkRectMergeBatch')
            .attr('opacity', 0.4);
          this._info_g.selectAll('.linkRectMergeItem')
            .attr('opacity', 0.4);

          for (let batch_index of batch_index_list) {
            this._info_g.select(`#linkRectMerge${batch_index} #linkRectMergeBatch${batch_index}`)
              .attr('opacity', 1);

            for (let merge_index of merge_index_list) {
              this._info_g.select(`#linkRectMerge${batch_index} #linkRectLine${merge_index}`)
                .attr('opacity', 1);
              this._info_g.select(`#linkRectMerge${batch_index} #linkRectMergeItem${merge_index}`)
                .attr('opacity', 1);
            }
          }
        }
        _resetLinkLine() {
          this._info_g.selectAll('.linkRectLine')
            .attr('opacity', 1);
          
          this._info_g.selectAll('.linkRectMergeBatch')
            .attr('opacity', 1);
          this._info_g.selectAll('.linkRectMergeItem')
            .attr('opacity', 1);
        }
        _setInfoDetail(batch_index, info_index) {
          this._info_g.selectAll('.chartGroup')
            .attr('opacity', 0.4);
          this._info_g.select(`#oneBatchChartGroup${batch_index} #chartGroup_${info_index}`)
            .attr('opacity', 1);
        }
        _resetInfoDetail() {
          this._info_g.selectAll('.chartGroup')
            .attr('opacity', 1);
        }
        __getSelectPlate(batch_index_list, merge_index_list) {
          let selected_plates = [];
          for (let batch_index of batch_index_list) {
            let current_batch = this._mergeresult_1[batch_index];
            for (let merge_index of merge_index_list) {
              let current_merge = current_batch.merge_data[merge_index];
              selected_plates.push(current_merge.mergeItem);
            }
          }

          return selected_plates.flat();
        }
        _setMergeBin(selected_plates) {
          let distanceData = d3.map(selected_plates, d => {
            let timeRect = d3.pairs(d.stops, (a, b) => (new Date(b.realTime)).getTime()- (new Date(a.realTime)).getTime())
            timeRect.flag = d.flag;
            timeRect.upid = d.upid;
            return timeRect;
          })
          
          let bad_distance = distanceData.filter(d => +d.flag == 0);
          let good_distance = distanceData.filter(d => +d.flag == 1);
          if (bad_distance.length > 0) {
            for (let m in bad_distance[0]) {
              this._container.selectAll(`.bad_binRect${m}`)
                .attr("opacity", d => 
                  d3.map(bad_distance, d => d[m]).filter(e => e <= d.x1 && d.x0 <= e).length > 0 ? 1 : 0.4
                )
            }
          }
          if (good_distance.length > 0) {
            for(let m in good_distance[0]){
              this._container.selectAll(`.good_binRect${m}`)
                .attr("opacity", d => 
                  d3.map(good_distance, d => d[m]).filter(e => e<= d.x1 && d.x0 <=e).length > 0 ? 1 : 0.4
                )
            }
          }
        }
        _resetMergeBin() {
          for(let m in this._stopsTimes){		//reset binRect
            this._container.selectAll(`.good_binRect${m}`)
              .attr("opacity", 0.4)
            this._container.selectAll(`.bad_binRect${m}`)
              .attr("opacity", 0.4)
          }
        }
        _emitToScatter(selected_plates, status) {
          vm.$emit("trainMouse", {upid: d3.map(selected_plates, d => d.upid),  mouse: status});
        }
        _trainClickHandle(batch_index) {
          let batch_data = [];
          let batch_date_s = [], batch_date_e = [];
          let data_len = this._mergeresult_1.length;
          let mergedata;
          let mergeSelect;

          if (data_len >= 5) {
            if (batch_index <= 2) {
              mergedata = this._mergeresult_1.slice(0, 5)
                .map(d => d['merge_data'].map(e => e['mergeItem']).flat());
              mergeSelect = this._mergeresult_1.slice(0, 5)
                .map(d => d['merge_data'].map(e => e['mergeSelect']).flat());
            }
            else if (batch_index > data_len-3) {
              mergedata = this._mergeresult_1.slice(-6)
                .map(d => d['merge_data'].map(e => e['mergeItem']).flat());
              mergeSelect = this._mergeresult_1.slice(-6)
                .map(d => d['merge_data'].map(e => e['mergeSelect']).flat());
            }
            else {
              mergedata = this._mergeresult_1.slice(batch_index-2, batch_index+3)
                .map(d => d['merge_data'].map(e => e['mergeItem']).flat());
              mergeSelect = this._mergeresult_1.slice(batch_index-2, batch_index+3)
                .map(d => d['merge_data'].map(e => e['mergeSelect']).flat());
            }
          } else if (data_len>=3 && data_len<=4) {
            mergedata = this._mergeresult_1.slice(0, 3)
              .map(d => d['merge_data'].map(e => e['mergeItem']).flat());
            mergeSelect = this._mergeresult_1.slice(0, 3)
              .map(d => d['merge_data'].map(e => e['mergeSelect']).flat());
          }
          else {
            return
          }

          mergedata.forEach(d => {
            batch_data.push(d.map(e => e.upid));
            batch_date_s.push(d[0].stops[0].time);
            batch_date_e.push(d.slice(-1)[0].stops[0].time);
          });

          vm.$emit("trainClick", {
            list: this._trainSelectedList, 
            color: this._trainGroupStyle(mergeSelect.flat().slice(-1)[0]), 
            upidSelect: [
              ...mergedata.flat().filter(d => d.flag === 0).map(d => d.upid), 
              ...mergeSelect.flat().map(d => d.upid)
            ],
            type: "group", 
            batch: batch_data,
            date_s: batch_date_s,
            date_e: batch_date_e
          })
        }
        _keepClickedStatus() {
          if(Object.keys(this._mergeClickValue).length !== 0) {
            for (let key in this._mergeClickValue) {
              let batch_index = this._mergeClickValue[key].batch_index;
              let info_index = this._mergeClickValue[key].info_index;
              let merge_index_list = this._mergeClickValue[key].merge_index_list;
              let selected_plates = this.__getSelectPlate([batch_index], merge_index_list);

              this._setInfoDetail(batch_index, info_index);
              this._setMergeRect([batch_index], merge_index_list);
              this._setMergeBin(selected_plates);
            }
          }
        }

        // 整图过渡动画
        _mareyChartTranslate() {
          this._translateMareyLine();

          if (this._is_merge) {
            this._translateInfoChart();
          }

          // this._translateMonitorChart();
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
            .attr('transform', d => `translate(0, ${this._y(new Date(d.stops[0].time))})`)
            .call(g => g.selectAll('path')
              .attr('d', mergeLine));
          if (this._is_merge) {
            let mergeArea = e => d3.area()
              .x(f => this._x(f.distance))
              .y0(f => this._y(f.time0))
              .y1(f => this._y(f.time1))(e);
            
            marey_group.selectAll('.mergeG .mergerect')
              .transition(line_tran)
              .attr('d', mergeArea)
            marey_group.selectAll('.mergeG .select_g')
              .transition(line_tran)
              .attr('transform', d => `translate(0, ${this._y(new Date(d.stops[0].time))})`)
              .call(g => g.selectAll('path')
                .attr('d', mergeLine))
            // marey_group.selectAll('.quality')
            //   .transition(line_tran)
            //   .attr('transform', d => `translate(${ [0, -this._y(new Date(d.mergeItem[0].stops[0].time))] })`)
            //   .selectAll('.mareyLine')
            //   .attr('transform', d => `translate(0, ${this._y(new Date(d.stops[0].time))})`)
            //   .call(g => g.selectAll("path")
            //     .attr('d', mergeLine))
          }
          
          this._voronoi = Delaunay
              .from(this._stops, d => this._x(d.stop.station.distance), d => this._y(new Date(d.stop.time)))
              .voronoi([0, this._stations_size.h, this._marey_size.w, this._stations_size.h + this._y_height]);
          this._renderMareyLineTooltip();
        }
        _translateInfoChart() {
          let that = this;
          let line_tran = d3.transition()
            .delay(50)
            .duration(500);

          let linkRectMerge = this._info_g.selectAll('.linkRectMerge')
            .transition(line_tran);
          linkRectMerge.selectAll('.linkRectMergeBatch')
            .attr("transform", d => `translate(${[this._info_size.w - 10, this._y(d.batch_s)]})`)
            .attr("height", d => this._y(d.batch_e)- this._y(d.batch_s));
          linkRectMerge.selectAll('.linkRectMergeItem')
            .attr("transform", d => `translate(${[this._info_size.w - 12, this._y(d.date_entry_s)]})`)
            .attr("height", d => this._y(d.date_entry_e) - this._y(d.date_entry_s))
          
          let oneBatchChartGroup = this._info_g.selectAll('.oneBatchChartGroup')
            .transition(line_tran);
          let position_data = [];
          oneBatchChartGroup
            .attr('transform', (d, i) => {
              let pos = this._getDetailPosition(position_data, d)
              
              return `translate(${[pos[0], pos[1]]})`
            })

          let link_path = d => {
            let pathHeight = this._y(d.date_entry_e) - this._y(d.date_entry_s);
            let target_x = this._info_size.w - 12;
            let target_y = this._y(d.date_entry_s) + pathHeight/2;
            let pos = this._getLinkPosition(position_data, d);
            let source_x = pos[0];
            let source_y = pos[1]+this._detail_rect_w/2;

            if (source_y < 0) {
              return d3.linkHorizontal()({
                source: [target_x, target_y],
                target: [target_x, target_y]
              })
            } else {
              return d3.linkHorizontal()({
                source: [source_x, source_y],
                target: [target_x, target_y]
              })
            }
          }
          linkRectMerge.selectAll('.linkRectLine')
            .attr('d', link_path);
        }
        _getLinkPosition(position_data, data) {
          let chart_x = this._coreX + this._rectWidth;
          let chart_y;
          let path_y0 = data.info_index*(this._detail_rect_w+this._detail_gap);

          chart_y = position_data[data.batch_index][0] + path_y0;
          
          return [chart_x, chart_y];
        }
        _getDetailPosition(position_data, data) {
          let chart_x = this._coreX - 1.8*65 + (this._info_bgc_w - this._detail_rect_w)/2 + 3;
          let chart_y;
          let path_y0 = this._y(data.batch_s);
          let path_y1 = this._y(data.batch_e);
          let path_height = path_y1 - path_y0;

          if (path_y0 >= 20 && path_y0 <= this._height) {  // 判断是否在屏幕现实范围内
            if (position_data.length === 0) {
              // chart_y = path_y0 - 50;
              chart_y = path_y0 + path_height/2 - this._detail_rect_w/2 - 15;
            } else {
              let prev_end = position_data.slice(-1)[0][1];
              if ( prev_end > path_y0) {
                chart_y = prev_end;
              } else {
                chart_y = path_y0 + path_height/2 - this._detail_rect_w/2 - 15;
              }
            }
          } else if (path_y0 < 20) {
            chart_y = path_y0 - 1000;
          } else {
            chart_y = path_y0;
          }

          position_data.push([
            chart_y, 
            chart_y + data.one_batch_info.length * (this._detail_rect_w + this._detail_gap)
            ]);

          return [chart_x, chart_y];
        }
        _getPosition(position_data, batch_s, date_s, date_e) {
          let chart_x = this._coreX - 1.8*65 + (this._info_bgc_w - this._detail_rect_w)/2 + 3;
          let chart_y;
          let path_y0 = this._y(batch_s);
          let path_y1 = this._y(date_e);

          if (path_y0 >= 0 && path_y0 <= this._height) {
            if (position_data.length === 0) {
              chart_y = path_y0 - 50;
            } else {
              let prev = position_data.slice(-1)[0];
              let prev_end = prev + this._detail_rect_w + this._detail_gap;
              if ( prev_end > path_y0) {
                chart_y = prev_end;
              } else {
                chart_y = path_y0;
              }
            }
          } else {
            chart_y = path_y0;
          }

          position_data.push(chart_y);

          return [chart_x, chart_y];
        }
        _translateMonitorChart() {
          let tran = d3.transition()
            .delay(50)
            .duration(500);
          
          let monitorWidth = 360;
          let moni_rect_w = monitorWidth/3;
          let rectScale = d3.scaleLinear()
            .domain([0, 10])
            .range([0, moni_rect_w/2-10])

          this._moni_g.selectAll('.merge_moni')
            .transition(tran)
            .attr('transform', d => `translate(${20}, ${this._y(d.proce_end_date_s)})`)
          this._moni_g.selectAll('.moni_process_rect')
            .transition(tran)
            .attr('height', d => this._y(d.h_e)-this._y(d.h_s))
          
          this._moni_g.selectAll('.T2_diagnosis_value')
            .transition(tran)
            .attr('transform', (d, i) => `translate(${[
              -rectScale(d.value)+moni_rect_w/2-5,
              d.i*(this._y(d.et)-this._y(d.st))/d.num
            ]})`)
            .attr('height', d => (this._y(d.et)-this._y(d.st))/d.num)
          
          this._moni_g.selectAll('.SPE_diagnosis_value')
            .transition(tran)
            .attr('transform', (d, i) => `translate(${[
              moni_rect_w/2+5, 
              d.i*(this._y(d.et)-this._y(d.st))/d.num
            ]})`)
            .attr('height', d => (this._y(d.et)-this._y(d.st))/d.num)
          
          this._moni_g.selectAll('.T2_Line')
            .transition(tran)
            .attr('d', (d, i) => {
              let line_data = [];
              let T2 = d.diag.T2;
              let count = 0;
              for (let j = 0; j < T2.length; j++) {
                let time_span = (this._y(T2[j].et)-this._y(T2[j].st))/T2[j].num;
                let line_x = -rectScale(T2[j].thresholds);
                line_data.push({
                  i: count,
                  line_x: line_x,
                  line_y: time_span
                })
                line_data.push({
                  i: count + 1,
                  line_x: line_x,
                  line_y: time_span
                })
                count += 1;
              }
              return d3.line()
                .x((e, j) => e.line_x)
                .y((e, j) => e.i*e.line_y)(line_data)
            })
          this._moni_g.selectAll('.SPE_Line')
            .transition(tran)
            .attr("d", (d, i) => {
              let line_data = [];
              let T2 = d.diag.SPE;
              let count = 0;
              for (let j = 0; j < T2.length; j++) {
                let time_span = (this._y(T2[j].et)-this._y(T2[j].st))/T2[j].num;
                let line_x = rectScale(T2[j].thresholds);
                line_data.push({
                  i: count,
                  line_x: line_x,
                  line_y: time_span
                })
                line_data.push({
                  i: count + 1,
                  line_x: line_x,
                  line_y: time_span
                })
                count += 1;
              }
              return d3.line()
                .x((e, j) => e.line_x)
                .y((e, j) => e.i*e.line_y)(line_data)
            })

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
        .stateInit(vm.isMerge, vm.changecolor, vm.minrange, vm.minconflict)
        .dataInit(vm.timesdata, vm.stationsdata, vm.brushdata)
        .chartSizeInit(WIDTH, HEIGHT)
        .scaleInit()
        ._shadowInit()
        // ._renderMareyBackground()
        .render();
    },
    reRender(isMerge, minrange, minconflict) {
      let miniLine1 = this.conditionView._container.selectAll('.miniLine1')._groups[0][0];
      let miniLine2 = this.conditionView._container.selectAll('.miniLine2')._groups[0][0];
      miniLine1 !== undefined && miniLine1.remove();
      miniLine2 !== undefined && miniLine2.remove();
      this.conditionView._marey_g !== undefined && this.conditionView._marey_g.remove();
      this.conditionView._info_g !== undefined && this.conditionView._info_g.remove();

      this.conditionView
        .stateInit(isMerge, this.changecolor, minrange, minconflict)
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
