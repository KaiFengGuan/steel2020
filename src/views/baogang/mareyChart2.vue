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
import warningIcon5 from "../../assets/images/weixiu.svg"
import leanerIcon from "../../assets/images/leanerIcon_opera.svg"
import ACCIcon from '../../assets/images/ACCIcon.svg'
import DQIcon from '../../assets/images/DQIcon.svg'
import FmTotalIcon from '../../assets/images/FmTotalIcon.svg'
import {getOneBatchInfo} from '../../data/mareyChart/getBatchInfo.js'
import {getMonitorChunk, countTotalDiagPercent} from '../../data/mareyChart/getMoniData.js'
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
      mergeresult: undefined,
      monitordata: undefined,
      eventIconData: undefined,
      changecolor: true,
      isMerge: true,

      conditionView: undefined,
      minrange: 10,
      minconflict: 4,

      activatePlate: {
        upid: '21311224000',
        activate: true
      }
    };
  },
  methods: {
    ...mapMutations(['hightLight']),
    paintPre(data, changecolor, isMerge) {
      const vm = this;
      
      vm.timesdata = data.timesData;
      vm.stationsdata = data.stationsData;
      vm.mergeresult = data.mergeResult,
      vm.monitordata = data.monitorData;
      vm.eventIconData = data.eventIconData;

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
          this._monitoringdata = undefined;
          this._eventIconData = undefined;
          this._stopsTimes = undefined;
          this._allupid = undefined;
          this._stops = undefined;
          this._categorysdata = [];
          this._timesDataMap = null;
          
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
            bottom: 110,
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
          this._colorScale = undefined;

          this._coreX = 0;
          this._rectWidth = 60;
          this._info_bgc_w = 195;
          this._detail_rect_w = 150;
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
          this._displayIconData = undefined;
          this._iconClickStatus = undefined;
          this._displayInfoBadPlate = {};

          this._targetMargin = 15;
          this._targetHeadHeight = 40;
          this._targetTickWidth = 30;

          // 右边诊断视图相关
          this._moni_rect_w = 360 / 3;
          this._Q_T2_gap = 10;
          this._QScale = undefined;
          this._T2Scale = undefined;
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
                  time_spend = (new Date(item_data_stops[(+k)+1].time)).getTime() - (new Date(item_data_stops[k].time)).getTime()
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
        dataInit(timesdata, stationsdata, mergeresult, monitordata, eventIconData) {
          this._timesdata = timesdata;
          this._stationsdata = stationsdata;
          this._mergeresult = mergeresult;
          this._eventIconData = [...eventIconData.rm_event_change, ...eventIconData.fm_event_change];
          // console.log(eventIconData)
          // console.log(this._eventIconData)

          this._allEventData = eventIconData;
          
          this._timesDataMap = new Map();
          this._timesdata.forEach(d => this._timesDataMap.set(d.upid, d));

          this._trainGroupStyle = 
            this._change_color ? 
            ( d => d.flag !== 404 ? (d.flag === 0 ? vm.labelColors[0] : vm.labelColors[1]) : vm.noflagColor) :
            ( d => vm.categoryColors(d.productcategory));
          
          this._filterdata = [];
          this._allupid = d3.map(this._timesdata, d => d.upid);
          this._categorysdata = d3.group(this._timesdata , d => d.productcategory);
          this._dataUCL = d3.group(this._timesdata, d => d.upid);
          this._stopsTimes = d3.map(this._timesdata, d => {
            let arr = d3.pairs(d.stops, (a,b) => new Date(b.realTime).getTime() - new Date(a.realTime).getTime())
            arr.upid = d.upid
            return arr
          });


          // console.log('马雷图合并结果：', this._mergeresult);

          // 过滤合并的钢板
          let merge_upid = this._mergeresult.map(item => item.merge_result.merge.flat()).flat().map(d => d.upid)
          this._timesdata.forEach(d => {
            merge_upid.indexOf(d.upid) === -1 ? this._filterdata.push(d) : undefined;
          })

          // 左边圆形 母工序子工序 标尺范围计算
          let merge_plates = [];
          this._mergeresult.forEach(d => {
            let merge = d.merge_result.merge
            let cannot_merge = d.cannot_merge.flat();
            merge.forEach(e => merge_plates.push(...e))
            if (cannot_merge !== undefined) {
              cannot_merge.forEach(e => merge_plates.push(e))
            }
          })
          let [t_extent, fu_extent, m_extent, c_extent,
            sub_extent] = this.__getAllDataExtend(merge_plates, 0.99, true, true);
          this._info_extent = {
            stage: [t_extent, fu_extent, m_extent, c_extent],
            sub_stage: [
              sub_extent.slice(0, 5),
              sub_extent.slice(6, 13),
              sub_extent.slice(14, 16)
            ]
          }

          // 规格标尺计算
          let tar_arr = {}, tar_extent = {},
              target = ['tgtplatethickness', 'tgtwidth', 'tgtplatelength2'];
          target.forEach(key => {tar_arr[key] = []; tar_extent[key] = null;});
          for (let i in merge_plates) {
            let item_data = merge_plates[i];
            
            for (let tar of target) {
              tar_arr[tar].push(item_data[tar]);
            }
          }

          for (let tar of target) {
            tar_extent[tar] = d3.extent(tar_arr[tar]);
          }
          this._tar_extent = tar_extent;
          // console.log(tar_extent)
          
          // 按steelspec计算标尺范围
          let cate_extend = {};
          let category_data = d3.groups(merge_plates, d => d.steelspec)
          for (let key = 0; key < category_data.length; key++) {
            let one_cate_name = category_data[key][0];
            let one_cate_data = category_data[key][1];
          
            let [t, fu, m, c] = this.__getAllDataExtend(one_cate_data, 0.99, false, false);
            cate_extend[one_cate_name] = {t: t, fu: fu, m: m, c: c}
          }
          // console.log(cate_extend);


          // 合并相关图元 绘图数据
          let batch_index_count = 0;
          let over_p = [], total = [];
          for (let item in this._mergeresult) {
            let mergeItem = this._mergeresult[item].merge_result.merge;
            let mergeSelect = this._mergeresult[item].merge_result.select;
            let cannotMerge = this._mergeresult[item].cannot_merge;

            if (!mergeItem.length && !mergeSelect.length && !cannotMerge.length) {
              continue;
            }

            // 每个批次 子母工序 统计（用于左边圆圈） 新的写法：一个合并块的种类对应一个圆圈
            let one_batch_info = [];
            let merge_data = [];
            let cannot_merge_data = [];
            let one_batch_category = [];
            
            if (mergeItem.length !== 0) {
              one_batch_category = d3.groups(mergeItem, d => d[0].steelspec)
              for (let key = 0; key < one_batch_category.length; key++) {
                let category_name = one_batch_category[key][0];
                let category_data = one_batch_category[key][1];
                let category_data_flat = category_data.flat();
                let labelStatistics = this.__getLabelStatistics(category_data_flat);  // good, bad, no_flag

                let res = getOneBatchInfo(
                  key,
                  batch_index_count,
                  category_name,
                  category_data,
                  category_data_flat,
                  this._stationsdata,
                  labelStatistics,
                  {t: t_extent, fu: fu_extent, m: m_extent, c: c_extent, sub: sub_extent},
                  cate_extend[category_name],
                  tar_extent);

                one_batch_info.push(res);
              }
            }
            // 不能合并的钢板单独统计
            let cannotMerge_flat = cannotMerge.flat();
            if (cannotMerge_flat.length !== 0) {
              one_batch_info.push(getOneBatchInfo(
                one_batch_category.length,
                batch_index_count,
                "cannotMerge",
                cannotMerge,
                cannotMerge_flat,
                this._stationsdata,
                this.__getLabelStatistics(cannotMerge_flat),
                {t: t_extent, fu: fu_extent, m: m_extent, c: c_extent, sub: sub_extent},
                {t: t_extent, fu: fu_extent, m: m_extent, c: c_extent, sub: sub_extent},
                tar_extent
              ))
            }

            for (let key = 0; key < mergeItem.length; key++) {
              let one_merge_item = mergeItem[key];
              let one_merge_select = mergeSelect[key];
              let pathColor = this.__getPathColor(one_merge_item);

              merge_data.push({
                merge_index: key,
                mergeItem: one_merge_item,
                mergeSelect: one_merge_select,
                pathColor: pathColor,
                steelspec: one_merge_item[0].steelspec,
                batch_s: new Date(mergeItem[0][0].stops[0].time),
                date_entry_s: new Date(one_merge_item[0].stops[0].time),
                date_exit_s: new Date(one_merge_item[0].stops.slice(-1)[0].time),
                date_entry_e: new Date(one_merge_item[one_merge_item.length - 1].stops[0].time),
                date_exit_e: new Date(one_merge_item[one_merge_item.length - 1].stops.slice(-1)[0].time)
              })
            }
            if (one_batch_info.slice(-1)[0].steelspec === "cannotMerge") {
              cannot_merge_data = one_batch_info.slice(-1)[0].link_rect;
            }

            let batchColor = mergeItem.length !== 0
              ? this.__getPathColor(mergeItem.flat())
              : this.__getPathColor(cannotMerge.flat());


            // 当前批次的所有钢板的诊断数据
            let batch_all_plate = [...mergeItem.flat(), ...cannotMerge.flat()]
              .sort((a, b) => new Date(a.stops[0].time).getTime() - new Date(b.stops[0].time).getTime());
            let all_diag = [[], [], []];
            let process = ['Heat', 'Roll', 'Cool'];
            let n = batch_all_plate.length;
            for (let j = 0; j < process.length; j++) {
              let key = process[j];
              for (let i = 0; i < n; i++) {
                let k = i;
                let temp = [];
                while (k < n && monitordata[batch_all_plate[k].upid]) {
                  let plate = batch_all_plate[k];
                  let cur_moni = monitordata[plate.upid];
                  if (!cur_moni[key + '_QUCL'] && !cur_moni[key + '_Q']
                    && !cur_moni[key + '_T2UCL'] && !cur_moni[key + '_T2']) {
                    break;
                  }
                  temp.push({
                    upid: plate.upid,
                    toc: plate.toc,
                    endtime: new Date(plate.stops.slice(-1)[0].time),
                    nextendtime: k+1 === n ? 0 : new Date(batch_all_plate[k+1].stops.slice(-1)[0].time),
                    index: j,
                    Q_UCL:  cur_moni[key + '_QUCL'],
                    Q:      cur_moni[key + '_Q'] > cur_moni[key + '_QUCL'] * 1.5 ? cur_moni[key + '_QUCL'] * 1.5 : cur_moni[key + '_Q'],
                    T2_UCL: cur_moni[key + '_T2UCL'],
                    T2:     cur_moni[key + '_T2'] > cur_moni[key + '_T2UCL'] * 1.5 ? cur_moni[key + '_T2UCL'] * 1.5 : cur_moni[key + '_T2'],
                  });
                  k++;
                }
                if (temp.length !== 0) all_diag[j].push(temp);
                i = k;
              }
            }
            
            let merge_exit_date = [[], [], []];
            for (let key = 0; key < mergeItem.length; key++) {
                let one_merge_item = mergeItem[key];
                let date_exit_s = new Date(one_merge_item[0].stops.slice(-1)[0].time);
                let date_exit_e = new Date(one_merge_item[one_merge_item.length - 1].stops.slice(-1)[0].time);

              // console.log(one_merge_item)

              for (let j = 0; j < process.length; j++) {
                merge_exit_date[j].push({
                  merge_index: key,
                  process_index: j,
                  date_exit_s: date_exit_s,
                  date_exit_e: date_exit_e
                })
              }
            }
            // console.log( mergeItem.map(c => c.map(d => d.stops.length)) )


            // 新写法，一个批次的钢板 诊断数据方格 测试看看
            // console.log('批次：', batch_index_count)
            let one_batch_diag_data = [];
            for (let key = 0; key < mergeItem.length; key++) {
              let one_merge_item = mergeItem[key];

              // [new_diag, new_chunk]
              let { res, count } = getMonitorChunk(key, one_merge_item, monitordata);
              if (res[1].length !== 0) one_batch_diag_data.push(res);
              over_p.push(count[0]);
              total.push(count[1]);
            }
            for (let key = 0; key < cannotMerge.length; key++) {
              let one_cannotMerge = cannotMerge[key];

              // [new_diag, new_chunk]
              let { res, count } = getMonitorChunk(-1, one_cannotMerge, monitordata);
              if (res[1].length !== 0) one_batch_diag_data.push(res);
              over_p.push(count[0]);
              total.push(count[1]);
            }
            let batch_chunk_s = new Date(batch_all_plate[0].stops.slice(-1)[0].time);
            let batch_chunk_e = new Date(batch_all_plate[batch_all_plate.length - 1].stops.slice(-1)[0].time);
            let new_diagData = {
              batch_index: batch_index_count,
              diag_data: one_batch_diag_data.map(d => d[0]),
              diag_area: one_batch_diag_data.map(d => d[1]),
              batch_s: batch_chunk_s,
              batch_e: batch_chunk_e
            }
            // console.log('当前批次结果：', one_batch_diag_data)
            // console.log(' ')



            


            // 与合并相关的绘图数据
            this._mergeresult_1.push({
              batch_index: batch_index_count,
              // 马雷图合并 绘图数据
              merge_data: merge_data,
              cannot_merge: cannot_merge_data,
              batch_s: new Date(batch_all_plate[0].stops[0].time),
              batch_e: new Date(batch_all_plate[batch_all_plate.length - 1].stops[0].time),
              batchColor: batchColor,
              // 批次信息 绘图数据
              one_batch_info: one_batch_info,
              // 监控 绘图数据
              diag: all_diag,
              diag_area: merge_exit_date,
              new_diagData: new_diagData
            })
            batch_index_count++;
          }

          for (let i = 0; i < this._mergeresult_1.length; i++) {
            let batch = this._mergeresult_1[i];
            for (let j = 0; j < batch.one_batch_info.length; j++) {
              if (i === 0 && j === 0) {
                batch.one_batch_info[j]['prev_targetInfo'] = null;
              } else if (i > 0 && j === 0) {
                batch.one_batch_info[j]['prev_targetInfo'] = this._mergeresult_1[i - 1].one_batch_info.slice(-1)[0]['targetInfo'];
              } else {
                batch.one_batch_info[j]['prev_targetInfo'] = batch.one_batch_info[j - 1]['targetInfo'];
              }
            }
          }
          
          console.log("处理成绘图数据：", this._mergeresult_1)

          // 统计整图监控结果占比
          // console.log(over_p, total)
          // let [heat_bad, roll_bad, cool_bad] = countTotalDiagPercent(this._timesdata, monitordata);
          let allOver = [0, 0, 0], allTotal = [0, 0, 0];
          for (let _i = 0; _i < over_p.length; _i++) {
            for (let _j = 0; _j < 3; _j++) {
              allOver[_j] += over_p[_i][_j];
              allTotal[_j] += total[_i][_j];
            }
          }
          let heat_bad = (allOver[0] / allTotal[0]) * 100,
              roll_bad = (allOver[1] / allTotal[1]) * 100,
              cool_bad = (allOver[2] / allTotal[2]) * 100;
          this._statistics = [
            {bad: heat_bad, good: 100-heat_bad},
            {bad: roll_bad, good: 100-roll_bad},
            {bad: cool_bad, good: 100-cool_bad}
          ]


          this._monitoringdata = {};
          let all_diag = [[], [], []];
          let process = ['Heat', 'Roll', 'Cool'];
          let n = this._timesdata.length;
          for (let i = 0; i < n; i++) {
            let item = this._timesdata[i];
            let cur_moni = monitordata[item.upid];

            for (let j = 0; j < process.length; j++) {
              let key = process[j];
              all_diag[j].push({
                upid: item.upid,
                toc: item.toc,
                endtime: new Date(item.stops.slice(-1)[0].time),
                nextendtime: i+1 === n ? 0 : new Date(this._timesdata[i+1].stops.slice(-1)[0].time),
                index: j,
                Q_UCL:  cur_moni ? cur_moni[process[j] + '_QUCL']  ? cur_moni[process[j] + '_QUCL']  : 0 : 0,
                Q:      cur_moni ? cur_moni[process[j] + '_Q']     ? cur_moni[process[j] + '_Q'] > cur_moni[process[j] + '_QUCL'] * 1.5 ? cur_moni[process[j] + '_QUCL'] * 1.5 : cur_moni[process[j] + '_Q'] : 0 : 0,
                T2_UCL: cur_moni ? cur_moni[process[j] + '_T2UCL'] ? cur_moni[process[j] + '_T2UCL'] : 0 : 0,
                T2:     cur_moni ? cur_moni[process[j] + '_T2']    ? cur_moni[process[j] + '_T2'] > cur_moni[process[j] + '_T2UCL'] * 1.5 ? cur_moni[process[j] + '_T2UCL'] * 1.5 : cur_moni[process[j] + '_T2'] : 0 : 0,
              })
            }
          }

          this._monitoringdata['diag'] = all_diag;
          // console.log(this._monitoringdata);

          // getMonitorData(this._mergeresult, this._timesdata, monitordata);

          return this;
        }
        chartSizeInit(width, height) {
          this._width = width;
          this._height = height;
          this._main_magin.top += this._polygon_offset;
          
          this._info_size.w = 345;
          this._info_size.h = this._height;
          this._marey_size.w = 750;
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

          this._coreX = this._info_size.w * 0.35;

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
          this._brush_select[1] = (this._brush_size.h - this._brush_margin.top - this._brush_margin.bottom) * 0.2;

          
          this._x = d3.scaleLinear()
            .domain(d3.extent(this._stationsdata, d => d.distance))
            .range([0 , m_w]);
          this._y = d3.scaleTime()
            .domain([this._mini_y.invert(this._brush_select[0]), this._mini_y.invert(this._brush_select[1])])
            .range([m_h_s, m_h_e])
            // .range([0, 1]); // 开始绘制后可以出现瀑布效果
          this._line = d3.line()
            .x(d => this._x(d.station.distance))
            .y((d, i, arr) => this._y(new Date(arr[i].time)) - this._y(new Date(arr[0].time)));
          this._defaultStrokeWidth = d3.scaleLinear()
            .domain([0.006, 0.16])
            .range([0.5, 1.2]);
          this._voronoi = Delaunay
            .from(this._stops, d => this._x(d.stop.station.distance), d => this._y(new Date(d.stop.time)))
            .voronoi([0, this._stations_size.h, this._marey_size.w, this._stations_size.h + this._y_height]);

          this._colorScale = d3.scaleLinear()
            .domain([0, 1])
            .range(["#F6F7F7", "#FDD2C0"])

          // 
          let Q_max = [], T2_max = [];
          this._QScale = [];
          this._T2Scale = [];
          for (let i = 0; i < this._monitoringdata.diag.length; i++) { // 工序
            let proc = this._monitoringdata.diag[i];
            Q_max[i] = d3.max(proc, d => Math.max(d.Q, d.Q_UCL));
            T2_max[i] = d3.max(proc, d => Math.max(d.T2, d.T2_UCL));
          }
          for (let i = 0; i < 3; i++) {
            this._QScale[i] = d3.scaleLinear().domain([0, Q_max[i]]).range([0, this._moni_rect_w/2-10]);
            this._T2Scale[i] = d3.scaleLinear().domain([0, T2_max[i]]).range([0, this._moni_rect_w/2-10]);
          }

          let iconDataGroups = d3.groups(this._eventIconData, d => d.distance);
          this._iconOpScale = {};
          for (let [dis, data] of iconDataGroups) {
            let e = d3.extent(data, d => d.value);
            let max = Math.max(Math.abs(e[0]), Math.abs(e[1]));
            this._iconOpScale['' + dis] = d3.scaleLinear()
              .domain([-max, max])
              .range([-15, 15])
          }

          let rect_data = this._mergeresult_1.map(d => {
            return d.one_batch_info.map(e => e.link_rect_data.flat().length)
          }).flat();
          this._sankeyScale = d3.scaleLinear()
            .domain([0, d3.extent(rect_data)[1]])
            .range([0, 100])

          return this;
        }

        render() {
          this._trainSelectedList = []; // 清空选择列表
          this._container
            .attr('width', this._width)
            .attr('height', this._y_height);

          this._shadowInit();

          // this._renderMareyBackground();


          this._renderInfoChart();

          this._renderMonitorChart();

          this._renderMareyChart();

          this._renderMareyBrush();
          
          return this;
        }

        _shadowInit() {
          const markerBoxWidth = 5;
					const markerBoxHeight = 5;
					const refX = markerBoxWidth / 2;
					const refY = markerBoxHeight / 2;
					const markerWidth = markerBoxWidth / 2;
					const markerHeight = markerBoxHeight / 2;
					const arrowPoints = [[0, 0], [0, 5], [5, 2.5]];
          this._container.append('defs')
						.append('marker')
						.attr('id', 'targetInfo-shape-arrow')
						.attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
						.attr('refX', refX)
						.attr('refY', refY)
						.attr('markerWidth', markerBoxWidth)
						.attr('markerHeight', markerBoxHeight)
						.attr('orient', 'auto-start-reverse')
						.append('path')
						.attr('d', d3.line()(arrowPoints))
						.attr('fill', util.labelColor[0])
						.attr('stroke', util.labelColor[0])

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

        // 马雷图主图
        _renderMareyChart() {
          this._marey_g === undefined ? undefined : this._marey_g.remove();
          this._marey_g = this._container.append('g')
            .attr('class', 'mareyContentGroup')
            .attr('transform', `translate(${[this._info_size.w, 0]})`);
          
          this._renderMareyLine();
          this._renderMareyLineTooltip();
          this._renderEventIconData(this._marey_g);

          // 合并块的tooltip分组
          this._marey_g.append('g')
            .attr('id', 'mergeBlockTooltip')
          this._marey_g.append('g')
            .attr('id', 'mareyLineTooltip')

          this._renderMareyStations();
        }
        _renderMareyLine() {
          let removeElement = this._marey_g.selectAll('.mareyGroup')._groups[0][0]
          removeElement !== undefined && removeElement.remove()

          let MareyGroup = this._marey_g.append('g')
            .attr('class', 'mareyGroup');

          this._renderMareyLineNoMerge(MareyGroup);
          this._renderMareyLineMerge(MareyGroup);
          // this._renderEventIconData(MareyGroup);
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
                time1: new Date(d.mergeItem[d.mergeItem.length - 1].stops[i].time),
                pathColor: d.pathColor
              }
            }))
            .attr('d', mergeArea);
          
          mergeG.append('g')
            .attr('fill', 'white')
            .attr('class', 'mergeG_select_g')
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
        }
        _renderEventIconData(MareyGroup) {
          this._renderOperationIcon(MareyGroup);  // 人工操作
          this._renderACCEvent(MareyGroup);
          this._renderDQEvent(MareyGroup);
          this._renderFmTotalEvent(MareyGroup);
        }
        _renderOperationIcon(MareyGroup) {
          const cls = this;
          const cx = 20;
          const mareyEventIconCroup = MareyGroup
            .append('g')
            .attr('class', 'mareyEventIconCroup')
          
          // 画线
          let iconLink = {};
          let iconPlateData = Array.from(new Set(this._eventIconData.map(d => d.upid)));
          for (let item of iconPlateData.map(d => this._timesdata[this._allupid.indexOf(d)])) {
            if (!item) continue;
            let len = item.stops.length;
            let temp = [];
            for (let i = 0; i < len - 1; i++) {
              temp.push({
                curr_dis: item.stops[i].station.distance,
                curr_t: item.stops[i].time,
                next_dis: item.stops[i + 1].station.distance,
                next_t: item.stops[i + 1].time,
                color: this._trainGroupStyle(item)
              })
            }
            iconLink[item.upid] = temp;
          }
          // console.log(iconLink)
          let iconLinkGroup = mareyEventIconCroup.selectAll('.iconLinkGroup')
            .data(iconPlateData.filter(d => iconLink[d]))
            .enter()
            .append('g')
            .attr('class', 'iconLinkGroup')
            .attr('id', d => `iconLinkGroup${d}`)
          iconLinkGroup.selectAll(".iconLinkHorizontal")
            .data(d => iconLink[d])
            .enter()
            .append('path')
            .attr('class', 'iconLinkHorizontal')
            .attr('d', d => {
              let source_x = this._x(d.curr_dis);
              let source_y = this._y(new Date(d.curr_t));
              let target_x = this._x(d.next_dis);
              let target_y = this._y(new Date(d.next_t));
              return d3.linkHorizontal()({
                source: [source_x, source_y],
                target: [target_x, target_y]
              })
            })
            .attr('stroke', d => d.color)
            .attr('stroke-width', 3)
            .attr('fill', 'none')

          // 画圆
          this._displayIconData = this.__computeIconData(cx, this._eventIconData);
          this._iconClickStatus = this.__iconClickStatus(this._displayIconData);
          let iconGroup = mareyEventIconCroup.selectAll('eventIcon')
            .data(this._eventIconData)
            .enter()
            .append('g')
            .attr('class', 'eventIcon')
            .attr('id', d => `eventIcon_${d.upid}`)
            .attr('distance', d => `${d.distance}`)
            .attr('transform', d => `translate(${[this._x(d.distance), this._y(new Date(d.time))]})`)
            .attr("display", (d, i) => this._displayIconData.has(d.upid) ? null : 'none')
            // .on('mouseenter', __iconEnter)
            // .on('mouseleave', __iconLeave)
            .on('click', function (e, d) {
              if (cls._iconClickStatus.has(d.upid) 
                && cls._iconClickStatus.get(d.upid).has(''+d.distance)) {
                let status = cls._iconClickStatus.get(d.upid).get(''+d.distance);
                if (!status) {  // 没点击的状态
                  __iconEnter.call(this, e, d);
                } else {
                  __iconLeave.call(this, e, d);
                }
                cls._iconClickStatus.get(d.upid).set(''+d.distance, !status);
              }
            })
          this._renderIcon(iconGroup, cx, leanerIcon);

          const that = this;
          function __iconEnter(e, d) {
            const margin = 2, width = 15;
            const iconEle = d3.select(this);
            const distance = iconEle.attr('distance')
            const lineData = that._displayIconData.get(d.upid)[distance];
            const height = that._y(new Date(lineData.slice(-1)[0].time)) - that._y(new Date(lineData[0].time));
            const color = d.flag !== 404 ? (d.flag === 0 ? vm.labelColors[0] : vm.labelColors[1]) : vm.noflagColor;
            const zeroLineWidth = 1;
            const scaleX = that._iconOpScale[d.distance];
            const xAxis = d3.axisBottom(scaleX)
              .ticks(3)
              .tickFormat(x => x * 1000)
              .tickSizeInner(3)
              .tickSizeOuter(0)
            
            const iconEleGroup = iconEle.append('g')
              .attr('class', 'iconEleGroup')
              .attr('id', 'iconEleGroup_' + d.upid)
              .attr('opacity', 0)
            iconEleGroup.lower();
            
            iconEleGroup
              .append('rect')
              .attr('class', 'iconEle_background')
              .attr('width', (margin + width) * 2)
              // .attr('height', 0)
              .attr('height', height + margin + 13)
              .attr('transform', `translate(${[-margin - width, 0]})`)
              .attr('fill', 'white')
              .attr('stroke', color)
              .attr('rx', 3)

            iconEleGroup
              .append('line')
              .attr('class', 'iconEle_zeroLine')
              .attr('x1', 0)
              .attr('y1', 0)
              .attr('x2', 0)
              // .attr('y2', 0)
              .attr('y2', height)
              .attr("fill", 'none')
              .attr('stroke', color)
              .attr("stroke-width", zeroLineWidth)
              // .attr("stroke-linejoin", "round")
              // .attr("stroke-dasharray", "3 3")
              // .attr("stroke-linecap", "round")


            const line = d3.line()
              .x(d => scaleX(d.value))
              .y((d, i) => that._y(new Date(d.time)) - that._y(new Date(lineData[0].time)));
            const linePath = (d) => {
              const line_data = [];
              const N = d.length;
              line_data.push({
                line_x: scaleX(0),
                line_y: that._y(new Date(d[0].time))
              })
              for (let j = 0; j < N - 1; j++) {
                let e = that._y(new Date(d[j].time));
                let h = that._y(new Date(d[j + 1].time)) - e;
                let line_x = scaleX(d[j].value);
                line_x = line_x + (zeroLineWidth/2) * (line_x > 0 ? 1 : -1);
                line_data.push({
                  line_x: line_x,
                  line_y: e
                })
                line_data.push({
                  line_x: line_x,
                  line_y: e + h
                })
              }
              line_data.push({
                line_x: scaleX(0),
                line_y: that._y(new Date(d.slice(-1)[0].time))
              })
              const start = line_data[0].line_y;
              return d3.line()
                .x(e => e.line_x)
                .y(e => e.line_y - start)(line_data)
            }
            // const pathFillColor = 'red';
            // let removeElement = that._marey_g.select('.pathFillDefs');
            // removeElement ? removeElement.remove() : undefined;
            // iconEleGroup.append('defs')
            //   .attr('class', 'pathFillDefs')
            //   .append('linearGradient')
            //   .attr('gradientTransform', 'rotate(90)')
            //   .attr('id', 'pathFillColor')
            //   .call(g => g.append('stop')
            //     .attr('offset', '0%')
            //     .attr('stop-color', pathFillColor))
            //     .attr('stop-opacity', 1)
            //   .call(g => g.append('stop')
            //     .attr('class', 'needInterpolateStop')
            //     .attr('offset', `${0}%`)
            //     .attr('stop-color', pathFillColor))
            //     .attr('stop-opacity', 1)
            //   .call(g => g.append('stop')
            //     .attr('offset', '0%')
            //     .attr('stop-color', pathFillColor))
            //     .attr('stop-opacity', 0)

            iconEleGroup.append('path')
              .attr('class', 'operation_line')
              // .attr('d', line(lineData))
              .attr('d', linePath(lineData))
              .attr('fill', 'none')
              // .attr('fill', color)
              // .attr('fill', 'url("#pathFillColor")')
              .attr('stroke', color)
              .attr('stroke-width', 1.5)
              // .attr('stroke-dasharray', '0 1')
              // .attr("stroke-linejoin", "round")
              // .attr("stroke-dasharray", "3 3")
              // .attr("stroke-linecap", "round")

            iconEleGroup.append('g')
              .attr('transform', `translate(${[0, height]})`)
              .style("font-size", 8)
              .style("font-weight", 'normal')
              .style("color", 'black')
              .call(xAxis)
            

            
            // __trans('iconEle_background', 'height', false, function() {
            //   return d3.interpolate(0, height + margin);
            // });
            // __trans('iconEle_zeroLine', 'y2', false, function() {
            //   return d3.interpolate(0, height);
            // });
            // __trans('operation_line', 'stroke-dasharray', false, function() {
            //   const length = this.getTotalLength();
            //   return d3.interpolate(`0,${length}`, `${length},${length}`);
            // });
            // __trans('needInterpolateStop', 'offset', false, function() {
            //   let interpolate = d3.interpolate(`${0}%`, `${100}%`);
            //   return function (t) {
            //       return interpolate(t)
            //   }
            // });

            __trans(`#iconEleGroup_${d.upid}`, 'opacity', false, '', function() {
              return d3.interpolate(0, 1);
            });

          }
          function __trans(selector, attr, remove, removeId, fn) {
            const t = d3.transition()
              .duration(300)
              .ease(d3.easeQuad);
            that._marey_g.select(selector)
              .transition(t)
              .attrTween(attr, fn)
              .on('end', () => {
                if (remove) {
                  let removeElement = that._marey_g.select(removeId);
                  removeElement ? removeElement.remove() : undefined;
                }
              });
          }
          function __iconLeave(e, d) {
            // const margin = 2;
            // const iconEle = d3.select(this);
            // const distance = iconEle.attr('distance')
            // const lineData = that._displayIconData.get(d.upid)[distance];
            // const height = that._y(new Date(lineData.slice(-1)[0].time)) - that._y(new Date(lineData[0].time));
            // 
            // __trans('iconEle_background', 'height', true, function() {
            //   return d3.interpolate(height + margin, 0);
            // });
            // __trans('iconEle_zeroLine', 'y2', true, function() {
            //   return d3.interpolate(height, 0);
            // });
            // __trans('operation_line', 'stroke-dasharray', true, function() {
            //   const length = this.getTotalLength();
            //   return d3.interpolate(`${length},${length}`, `0,${length}`);
            // });

            __trans(`#iconEleGroup_${d.upid}`, 'opacity', true, `#iconEleGroup_${d.upid}`, function() {
              return d3.interpolate(1, 0);
            });
          }
        }
        _renderACCEvent(MareyGroup) {
          const cls = this;
          const cx = 20;
          const mareyEventIconCroup = MareyGroup
            .append('g')
            .attr('class', 'mareyACCEventIconCroup')
          
          let iconGroup = mareyEventIconCroup.selectAll('ACCEventIcon')
            .data(this._allEventData.acc_event_change)
            .enter()
            .append('g')
            .attr('class', 'ACCEventIcon')
            .attr('id', d => `ACCEventIcon_${d.upid}`)
            .attr('distance', d => `${d.distance}`)
            .attr('transform', d => `translate(${[this._x(d.distance), this._y(new Date(d.time))]})`)
          this._renderIcon(iconGroup, cx, ACCIcon);
        }
        _renderDQEvent(MareyGroup) {
          const cls = this;
          const cx = 20;
          const mareyEventIconCroup = MareyGroup
            .append('g')
            .attr('class', 'mareyDQEventIconCroup')
          
          let iconGroup = mareyEventIconCroup.selectAll('DQEventIcon')
            .data(this._allEventData.dq_event_change)
            .enter()
            .append('g')
            .attr('class', 'DQEventIcon')
            .attr('id', d => `DQEventIcon_${d.upid}`)
            .attr('distance', d => `${d.distance}`)
            .attr('transform', d => `translate(${[this._x(d.distance), this._y(new Date(d.time))]})`)
          this._renderIcon(iconGroup, cx, DQIcon);
        }
        _renderFmTotalEvent(MareyGroup) {
          const cls = this;
          const cx = 20;
          const mareyEventIconCroup = MareyGroup
            .append('g')
            .attr('class', 'mareyFmTotalEventIconCroup')
          
          let iconGroup = mareyEventIconCroup.selectAll('FmTotalEventIcon')
            .data(this._allEventData.fmtotal_acc_event_change)
            .enter()
            .append('g')
            .attr('class', 'FmTotalEventIcon')
            .attr('id', d => `FmTotalEventIcon_${d.upid}`)
            .attr('distance', d => `${d.distance}`)
            .attr('transform', d => `translate(${[this._x(d.distance), this._y(new Date(d.time))]})`)
          this._renderIcon(iconGroup, cx, FmTotalIcon);
        }
        __computeIconData(cr, iconData) {   // 计算可显示的图标，以及与其冲突的图标数据
          let group_data = d3.groups(iconData, d => d.distance);
          const displayIconMap = new Map();
          
          for (let [distance, arr] of group_data) {
            const N = arr.length;
            const pos_arr = [];
            const res = [];
            let l = 0, r = 0;

            while(r <= N) {   // 切割
              if (r === N) {
                res.push(pos_arr.slice(l, r));
                break;
              }
              let y = this._y(new Date(arr[r].time));
              if (pos_arr.length && (pos_arr.slice(-1)[0][0] + cr * 2 <= y)) {
                res.push(pos_arr.slice(l, r));
                l = r;
              }
              pos_arr.push([y, arr[r]]);
              r++;
            }
            for (let i = 0; i < res.length; i++) {  // 组合
              let item = res[i];
              let upid = item[0][1].upid;
              if (displayIconMap.has(upid)) {
                let obj = displayIconMap.get(upid);
                obj['' + distance] = item.map(d => d[1]);
                displayIconMap.set(upid, obj);
              } else {
                let obj = {};
                obj['' + distance] = item.map(d => d[1]);
                displayIconMap.set(upid, obj);
              }
            }
          }
          return displayIconMap;
        }
        __computeDisplayIcon(cr, data) {
          data.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
          let displayMap = new Map();
          for (let i = 0; i < data.length; i++) {
            if (i === 0) {
              displayMap.set(data[i].upid, true);
              continue;
            }

            if (this._y(new Date(data[i].time)) - this._y(new Date(data[i - 1].time)) > cr * 2) {
              displayMap.set(data[i].upid, true);
            } else {
              displayMap.set(data[i].upid, false);
            }
          }
          return displayMap;
        }
        __iconClickStatus(iconData) {
          let iconClickMap = new Map();
          for (let [upid, data] of iconData) {
            let temp = new Map();
            for (let k of Object.keys(data)) {
              temp.set(k, false);
            }
            iconClickMap.set(upid, temp);
          }
          return iconClickMap;
        }
        _renderIcon(iconGroup, cx, iconURL) {
          const color = '#C65B24'
          const color1 = '#94a7b7'

          const background_color = "white";
          const stroke_color = "#94a7b7";
          iconGroup
            .call(g =>
              g.append('defs')
                .append('filter')
                .attr('id','shadowicon')
                .append('feDropShadow')
                .attr('dx', 0)
                .attr('dy', 0)
                .attr('stdDeviation', 1)
                .attr('flood-color', stroke_color)
            )
            // .call(g =>
            //   g.append('circle')
            //     .attr('class', 'all_circle')
            //     .attr('cx', 0)
            //     .attr('cy', 0)
            //     .attr('r', 0.9 * cx)
            //     .attr('fill', background_color)
            //     .attr('stroke', stroke_color)
            //     .attr('filter', 'url(#shadowicon)')
            // )
            // .call(g => 
            //   g.append('circle')
            //     .attr('class', 'outer_circle')
            //     .attr('cx', 0)
            //     .attr('cy', 0)
            //     .attr('r', 0.9 * cx)
            //     .attr('fill', 'none')
            //     .attr('stroke', d3.color(color1).brighter(0.8))
            //     .attr('stroke-width', 0.1)
            // )
            .call(g => 
              g.append('circle')
                .attr('class', 'inner_circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', 0.68 * cx)
                .attr('fill', background_color)
                .attr('stroke', 'black')
                .attr('stroke-width', 0.25)
                .attr('filter', 'url(#shadowicon)')
            )
            .call(g => 
              g.append('image')
                .attr('transform', `translate(${-0.45 * cx},${-0.45 * cx})`)
                .attr('class', 'iconwarning')
                .attr('width', 0.9 * cx)
                .attr('height', 0.9 * cx)
                .attr('href', iconURL)
            )
        }
        _renderMareyLineTooltip() {
          let that = this;
          // let stops = d3.merge(this._timesdata.map(d => d.stops.map(s => ({ train: d, stop: s }))));
          let filter = {};
          let filter_with_select = {};
          let filter_with_cannot_merge = {};
          // if (this._is_merge) {
          if (true) {   // 不管和不合并，都将filter计算出来
            let merge = d3.map(d3.merge(d3.merge(that._mergeresult_1.map(d => d.merge_data.map(e => e.mergeItem)))) , d =>d.upid);
            let select = d3.map(d3.merge(d3.merge(that._mergeresult_1.map(d => d.merge_data.map(e => e.mergeSelect)))) , d =>d.upid);
            let cannot = that._mergeresult_1.map(d => d.cannot_merge.map(e => e.merge_data.map(f => f.upid))).flat().flat().flat()
            // console.log(cannot)
            // filter = d3.filter(merge , d => select.indexOf(d) === -1 );
            // filter_with_select = merge;

            for (let i = 0; i < that._mergeresult_1.length; i++) {
              let batch = that._mergeresult_1[i];
              for (let j = 0; j < batch.merge_data.length; j++) {
                let merge_data = batch.merge_data[j];
                for (let k = 0; k < merge_data.mergeItem.length; k++) {
                  let merge_item = merge_data.mergeItem[k];
                  if (select.indexOf(merge_item.upid) === -1) {
                    filter[merge_item.upid] = {
                      "batch_index": batch.batch_index,
                      "merge_index": j
                    }
                  }
                  filter_with_select[merge_item.upid] = {
                    "batch_index": batch.batch_index,
                    "merge_index": j
                  }
                }
              }
              
              let cannot_merge = batch.cannot_merge.map(d => d.merge_data).flat();
              // console.log(cannot_merge)
              for (let k = 0; k < cannot_merge.length; k++) {
                let item = cannot_merge[k];
                filter_with_cannot_merge[item.upid] = {
                  "batch_index": i
                }
              }
            }
            // console.log(filter, filter_with_select, filter_with_cannot_merge)
          }

          let MareyGroup = this._marey_g;
          let removeElement = MareyGroup.selectAll('.mareyTooltipGroup')._groups[0][0];
          removeElement !== undefined && removeElement.remove();

          let tooltipGroup = MareyGroup.append('g')
            .attr('class', 'mareyTooltipGroup');

          tooltipGroup.append('g')
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .selectAll('path')
            .data(this._stops)
            .join('path')
            .attr('class', 'mareyTooltipCell')
            .attr('d', (d, i) => this._voronoi.renderCell(i))
            .on('mouseover', (event, d) => {
              if(filter[d.train.upid] !== undefined && this._is_merge ) {
                let batch_index = filter[d.train.upid]['batch_index'];
                let merge_index = filter[d.train.upid]['merge_index'];
                let selected_plates = that.__getSelectPlate([batch_index], [merge_index]);

                let curr_batch_all_mergeindex = []
                let curr_batch_infos = this._info_g.selectAll(`#oneBatchChartGroup${batch_index} .chartGroup`);
                curr_batch_infos._groups[0].forEach(
                  d => curr_batch_all_mergeindex.push(d3.select(d).attr('merge_index')));
                let info_index;
                curr_batch_all_mergeindex.forEach((d, i) => {
                  let arr = d.split(" ").map(e => +e)
                  if (arr.indexOf(merge_index) !== -1) {
                    info_index = i;
                  }
                });

                let pathColor = this._mergeresult_1[batch_index].merge_data[merge_index].pathColor;
                this._marey_g.select('#mergeBlockTooltip')
                  .call(g => {
                    g.append('g')
                      .attr('id', 'textGroup')
                    .selectAll('selected_plates')
                      .data(selected_plates.map(d => d.upid))
                      .join('text')
                      .text(d => d)
                      .attr('y', (_, i) => `${1.1 * i}em`)
                      .attr('fill', pathColor)
                  })
                  .call(g => {
                    const mergeBlockTooltip = this._marey_g.select('#mergeBlockTooltip');
                    const box = mergeBlockTooltip.select('#textGroup').node().getBBox()

                    const textBackground = g.append('g')
                      .attr('id', 'textBackground')
                    textBackground.append('path')
                      .attr('stroke', pathColor)
                      .attr('fill', 'white')
                      .attr('d', `
                        M${box.x - 10},${box.y - 10}
                        H${box.width / 2 - 5}l5,-15l5,15
                        H${box.width + 10}
                        v${box.height + 20}
                        h-${box.width + 20}
                        z
                      `)
                    
                    textBackground.lower();
                    mergeBlockTooltip.attr('transform', `translate(${[
                      this._x(d.stop.station.distance) - box.width / 2, 
                      this._y(new Date(d.stop.time)) + 37]})`)
                  })

                this._setMergeRect([batch_index], [merge_index]);
                this._setMergeBin(selected_plates);
                this._emitToScatter(selected_plates, 0);
                this._setIconPlate(selected_plates.map(d => d.upid));
                // this._setInfoDetail(batch_index, info_index);
                if (info_index != undefined) {
                  this._setInfoDetail(batch_index, info_index);
                }
                this._setMoniBlock(batch_index, [merge_index]);
                return;
              }
              
              // console.log(filter_with_select[d.train.upid])
              if (filter_with_select[d.train.upid] !== undefined && !this._is_merge) {
                let batch_index = filter_with_select[d.train.upid]['batch_index'];
                this._setNoMergeInfoArc(batch_index, d.train.upid);
              }
              if (filter_with_cannot_merge[d.train.upid] !== undefined && !this._is_merge) {
                let batch_index = filter_with_cannot_merge[d.train.upid]['batch_index'];
                this._setNoMergeInfoArc(batch_index, d.train.upid);
              }

              vm.$emit('trainMouse', {upid: [d.train.upid],  mouse: 0});
              let toopcolor = this._trainGroupStyle(d.train);
              mouseoverLine(d.train.upid);
              changeBin(d.train.upid);

              const mareyLineTooltip = this._marey_g.select('#mareyLineTooltip');
              let tooltip = mareyLineTooltip.append('g');
              let path = tooltip.append('path')
                .attr('class', 'tooltipContent')
                .attr('stroke', 'rgba(148, 167, 183, 0.4)')
                .attr('fill', 'white')
              
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
              tooltip
                .style('display', null)
                .attr('fill', toopcolor);
              let t_info = d.stop.realTime.toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
              line1.text(`upid: ${d.train.upid}`);
              line2.text(`steelspec: ${d.train.steelspec}`);
              line3.text(`time: ${t_info}`);
              path
                .attr('stroke', toopcolor)
              
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
              if (filter[d.train.upid] !== undefined && this._is_merge) {
                let batch_index = filter[d.train.upid]['batch_index'];
                let merge_index = filter[d.train.upid]['merge_index'];
                let selected_plates = that.__getSelectPlate([batch_index], [merge_index]);

                this._marey_g.select('#mergeBlockTooltip')
                  .selectAll('g').remove()

                this._resetMergeRect();
                this._resetMergeBin();
                this._emitToScatter(selected_plates, 1);
                this._resetInfoDetail();
                this._keepClickedStatus();
                this._resetMoniBlock(batch_index, [merge_index]);
                this._resetIconPlate();

                that._keepClickedStatus();
                return;
              }
              if (this._trainSelectedList.includes(d.train.upid))
                return;
              
              if (filter_with_select[d.train.upid] !== undefined && !this._is_merge) {
                let batch_index = filter_with_select[d.train.upid]['batch_index'];
                this._resetNoMergeInfoArc(batch_index, d.train.upid);
              }
              if (filter_with_cannot_merge[d.train.upid] !== undefined && !this._is_merge) {
                let batch_index = filter_with_cannot_merge[d.train.upid]['batch_index'];
                this._resetNoMergeInfoArc(batch_index, d.train.upid);
              }

              vm.$emit('trainMouse', {upid: [d.train.upid],  mouse: 1});
              mouseoutLine(d.train.upid);
              resetBin();
              // mergeGopacity()

              this._marey_g.select('#mareyLineTooltip')
                .selectAll('g').remove()
            })
            .on('click', (event, d) => {
              if (this._trainSelectedList.includes(d.train.upid)) {
                this._trainSelectedList = this._trainSelectedList.filter(v => v !== d.train.upid)
                mouseoutLine(d.train.upid) // 取消选中
              } else { // 选中
                if(this._trainSelectedList.length !==0) {
                  mouseoutLine(this._trainSelectedList[this._trainSelectedList.length-1])
                  resetBin();
                }
                this._trainSelectedList.push(d.train.upid);
                mouseoverLine(d.train.upid)
                changeBin(d.train.upid);

                let upidSelect = d3.map(
                  d3.filter(this._timesdata.slice(this._allupid.indexOf(d.train.upid)), d => d.flag === 0), 
                  d => d.upid)
                vm.$emit("trainClick", {
                  list: this._trainSelectedList,
                  upidSelect: upidSelect,
                  type: "single",
                  batch: upidSelect
                });
              }
            })
          
          const diagColor = (d, ucl) => d > ucl ? vm.labelColors[0] : vm.labelColors[1];
          function mouseoverLine(uclid) {
            let flag = that._dataUCL.get(uclid)[0].flag;
            d3.select('#id' + uclid)
              .attr('stroke-width', that._highLightStrokeWidth)
              .selectAll('rect')
              .attr('stroke', 'black');
            
            d3.selectAll('#Q_diagnosis_value_' + uclid)
              .attr('fill', d => d3.color(diagColor(d['Q'], d['Q_UCL'])).darker(0.2))
              .attr('stroke', d => d3.color(diagColor(d['Q'], d['Q_UCL'])).darker(1))
              .attr('stroke-width', 2)
            d3.selectAll('#T2_diagnosis_value_' + uclid)
              .attr('fill', d => d3.color(diagColor(d['T2'], d['T2_UCL'])).darker(0.2))
              .attr('stroke', d => d3.color(diagColor(d['T2'], d['T2_UCL'])).darker(1))
              .attr('stroke-width', 2)
          }
          function mouseoutLine(uclid) {
            d3.select('#id' + uclid)
              .attr('stroke-width', d => { return that._defaultStrokeWidth(d.tgtplatethickness2) })
              .selectAll('rect')
              .attr('stroke', 'none');
            
            d3.selectAll('#Q_diagnosis_value_' + uclid)
              .attr('fill', d => diagColor(d['Q'], d['Q_UCL']))
              .attr('stroke', d => d3.color(diagColor(d['Q'], d['Q_UCL'])).darker(0.2))
              .attr('stroke-width', 1)
            d3.selectAll('#T2_diagnosis_value_' + uclid)
              .attr('fill', d => diagColor(d['T2'], d['T2_UCL']))
              .attr('stroke', d => d3.color(diagColor(d['T2'], d['T2_UCL'])).darker(0.2))
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
          // console.log(this._stationsdata.splice(-3, 1))
          let xAxis = g => g
            .attr('class', 'labelPolygon')
            .selectAll('g')
            .data(this._stationsdata)
            // .data(stations.filter((d,i) => i !== stations.length - 4))
            .join('g')
            .attr('transform', (d, i) => `translate(${this._x(d.distance) + this._stations_size.p_h + rectDistance}, ${-2 + this._polygon_offset})`)
            .attr('i', (d, i) => i)
            .attr('class', (d, i) => 'labelPolygon_' + i)
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
              .attr('class', (_, i) => `polygon_${i}`)
              .attr('stroke', 'none'))
            .call(g => g.append('text')
              .attr('transform', `translate(-4 ,${this._main_magin.top -1.5}) rotate(-45)`)
              .attr('class', (_, i) => `station_${i}`)
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
            .attr('class', (d, i) => 'labelRect_' + i)
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
            // .call(xRect)
            .call(xAxis);
          stationsNameGroup.append('g')
            .call(timedistance);

          let timebinsGroup = stationsNameGroup.append('g')
            .attr('class', 'timebinsGroup');


          stationsNameGroup.select('.station_14')._groups[0][0].innerHTML = 'DQEnd';
          stationsNameGroup.select('.station_15')._groups[0][0].innerHTML = 'ACCEnd';
          stationsNameGroup.select('.labelPolygon_16').attr('opacity', 0);
          stationsNameGroup.select('.labelRect_16').attr('opacity', 0);


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
            that._setStationLine(i);
            // d3.select('#polygon' + m.name)
            //   .attr('fill', (d,i) => 
            //     d3.color(
            //       statname.indexOf(d.name) <6 ? 
            //       stationcolor [0] : 
            //       (statname.indexOf(d.name) > that._stationsdata.length - 4 ? stationcolor [2] : stationcolor [1])
            //     ).darker(0.2))
            // d3.selectAll(`.mline${i}`)
            //   .attr('stroke-width', 2.5)
            // d3.selectAll(`.mline${i++}`)
            //   .attr('stroke-width', 2.5)
            // d3.select('#station' + m.name)
            //   .attr('font-weight', 'bold')
          }
          function statOut (e,m){
            let i = d3.select(this).attr('i')
            that._resetStationLine(i);
            // d3.select('#polygon' + m.name)
            //   .attr('fill', (d,i) => 
            //     statname.indexOf(d.name) <6 ? 
            //     stationcolor [0] : 
            //     (statname.indexOf(d.name) > that._stationsdata.length - 4 ? stationcolor [2] : stationcolor [1]))
            // d3.selectAll(`.mline${i}`)
            //   .attr('stroke-width', 0.5)
            // d3.selectAll(`.mline${i++}`)
            //   .attr('stroke-width', 0.5)
            // d3.select('#station' + m.name)
            //   .attr('font-weight', 'normal')
          }



          const tableoffset = 12;
          let rect_radius = 3;
          let monitorWidth = 360;
          let moni_rect_w = monitorWidth/3;
          let text_list = ['Heat', 'Roll', 'Cool'];

          let diagnosisTextGroup = this._marey_g.append('g')
            .attr('class', 'diagnosisTextGroupGroup')
            .attr('transform', `translate(${[this._marey_size.w + 75, this._stations_size.h]})`)
          diagnosisTextGroup.selectAll('.diagnosisTextGroup')
            .data(text_list)
            .enter()
            .append('text')
            .attr('class', 'diagnosisTextGroup')
            .attr('transform', (d, i) => `translate(${[(moni_rect_w+10)*i - tableoffset - 20, -12]})`)
            .text(d => d)
            .attr('fill', (d, i) => d3.color(vm.processColor[i]))  //.darker(0.3)
            .style('font-size', 18)
            .style('font-weight', 500)
            .style('font-family', util.conditionPolygonTextAttr.fontFamily)
          
          let r = 10;
          let angle_gap = 0.1;
          let remain_angle = 2*Math.PI-angle_gap*2;
          let statisticsInfoGroup = this._marey_g.append('g')
            .attr('class', 'statisticsInfoGroupGroup')
            .attr('transform', `translate(${[this._marey_size.w + 115, this._stations_size.h-10]})`) // 原来偏移是135
            .attr('opacity', 0.8)
          
          statisticsInfoGroup.selectAll('.statisticsInfoGroup')
          .data(this._statistics)
          .enter()
          .append('g')
            .attr('class', 'statisticsInfoGroup')
            .call(g => {
              g.append('path')
                .attr('transform', (d, i) => `translate(${[(moni_rect_w+10)*i - tableoffset, -9]})`)
                .attr('d', d => 
                  d3.arc()
                    .innerRadius(r)
                    .outerRadius(r+4)
                    .startAngle(angle_gap+0)
                    .cornerRadius(2)
                    .endAngle(angle_gap+remain_angle*(d.bad/100))()
                )
                .attr('fill', (d, i) => vm.processColor[i])
            })
            .call(g => {
              g.append('text')
                .attr('transform', (d, i) => `translate(${[(moni_rect_w+10)*i - tableoffset, -6]})`)
                .text(d => Math.round(d.bad))
                .attr('fill', vm.labelColors[0])
                .attr('font-size', 11)
                .style('font-weight', 'bold')
                .style('font-style', 'italic')
                .attr('text-anchor', 'middle')
                .attr('opacity', 0.8)
            })
            .call(g => {
              let height = 45;
              g.append('rect')
                .attr('transform', (d, i) => `translate(${[(moni_rect_w+10)*i - 100, 15 - height]})`)
                .attr('width', moni_rect_w)
                .attr('height', height)
                .attr('fill', 'none')
                .attr('stroke', '#C9C9C9')
                .attr('stroke-width', 1.5)
                .attr('rx', 5)
            })
          statisticsInfoGroup
            .append('line')
            .attr('transform', (d, i) => `translate(${[(moni_rect_w+10)*i - 100, 10]})`)
            .attr('x1', 0).attr('y1', 0)
            .attr('x2', monitorWidth + 20).attr('y2', 0)
            .attr('stroke', '#C9C9C9')
            .attr('stroke-width', 1.5)
          statisticsInfoGroup
            .append('rect')
            .attr('transform', (d, i) => `translate(${[(moni_rect_w+10)*i - 100, 11.25]})`)
            .attr('height', 5)
            .attr('width', monitorWidth + 20)
            .attr('fill', 'white')
          
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
          // if (!this._is_merge) return;

          this._info_g === undefined ? undefined : this._info_g.remove();
          this._info_g = this._container.append('g')
            .attr('class', 'infoContentGroup')
            .attr('transform', `translate(${[0, 0]})`);
          
          this._renderInfoLinkMergeArea();
          this._renderInfoDetail();

          this._changeInfoCircleStatusButton();
        }
        _renderInfoLinkMergeArea() {
          let InfoLinkGroup = this._info_g.append('g')
            .attr('class', 'InfoLinkGroup');

          let linkRectMerge = InfoLinkGroup.selectAll('.linkRectMerge')
            .data(this._mergeresult_1)
            .join('g')
            .attr('class', 'linkRectMerge')
            .attr('id', d => `linkRectMerge${d.batch_index}`)
            // .attr("opacity", 0.4)
          
          let batchNum = this._mergeresult_1.map(d => {
            let mergeNum = d.merge_data.map(e => e.mergeItem).flat().length;
            let cannotNum = d.cannot_merge.map(e => e.merge_data).flat().length;
            let timeSpan = (d.batch_e.getTime() - d.batch_s.getTime()) / 3600000;
            return (mergeNum + cannotNum) / timeSpan;
          })
          console.log(batchNum)
          const lineWidthScale = d3.scaleLinear()
            .domain(d3.extent(batchNum))
            .range([1, 3])

          // 批次提示线
          linkRectMerge
            .append("line")
            .attr('class', 'linkRectMergeBatch')
            .attr('id', d => `linkRectMergeBatch${d.batch_index}`)
            .attr('batch_index', d => d.batch_index)
            .attr("transform", d => `translate(${[this._info_size.w - 10, this._y(d.batch_s)]})`)
            .attr("x1", 1)
            .attr("y1", 0)
            .attr("x2", 1)
            .attr("y2", d => this._y(d.batch_e)- this._y(d.batch_s))
            .attr("stroke-width", (d, i) => {
              return lineWidthScale(batchNum[i])
            })
            .attr("stroke", d => d.batchColor)

          // 批次内合并块提示线
          linkRectMerge.selectAll('linkRectMergeItem')
            .data(d => d.merge_data)
            .enter()
            .append("line")
            .attr('class', 'linkRectMergeItem')
            .attr('id', d => `linkRectMergeItem${d.merge_index}`)
            .attr('merge_index', d => d.merge_index)
            .attr("transform", d => `translate(${[this._info_size.w - 12, this._y(d.date_entry_s)]})`)
            .attr("x1", 1)
            .attr("y1", 0)
            .attr("x2", 1)
            .attr("y2", d => this._y(d.date_entry_e)- this._y(d.date_entry_s))
            .attr("stroke-width", 2)
            .attr("stroke", d => d.pathColor)
          
          // 批次内不能合并块提示线
          linkRectMerge.selectAll('linkRectCannotMergeItem')
            .data(d => d.cannot_merge)
            .enter()
            .append("line")
            .attr('class', 'linkRectMergeItem')
            .attr('id', d => `linkRectMergeItem_${d.name}`)
            .attr("transform", d => `translate(${[this._info_size.w - 12, this._y(d.date_entry_s)]})`)
            .attr("x1", 1)
            .attr("y1", 0)
            .attr("x2", 1)
            .attr("y2", d => this._y(d.date_entry_e)- this._y(d.date_entry_s))
            .attr("stroke-width", 2)
            .attr("stroke", d => d.pathColor)
              .attr("stroke-linejoin", "round")
              .attr("stroke-dasharray", "3 3")
              .attr("stroke-linecap", "round")
          
          // // 原来画线的写法
          // let link_path = d => {
          //   let pathHeight = this._y(d.date_entry_e) - this._y(d.date_entry_s);

          //   let source_x = this._coreX + this._rectWidth;
          //   let source_y = this._y(d.batch_s) + d.info_index*(this._detail_rect_w+this._detail_gap);
          //   let target_x = this._info_size.w - 20;
          //   let target_y = this._y(d.date_entry_s) + pathHeight/2;

          //   return d3.linkHorizontal()({
          //     source: [source_x, source_y],
          //     target: [target_x, target_y]
          //   })
          // }
          // linkRectMerge.selectAll('steelspec_link_group')
          //   .data(d => d.one_batch_info)
          //   .enter()
          //   .append('g')
          //   .attr('class', 'steelspec_link_group')
          //   .attr('id', d => `steelspec_link_group_${d.info_index}`)
          // .selectAll('.linkRectLine')
          //   .data(d => d.link_rect)
          //   .enter()
          //   .append('path')
          //   .attr('class', 'linkRectLine')
          //   .attr('id', d => `linkRectLine${
          //     d.name.slice(0, 11) === "cannotMerge"
          //     ? '_' + d.name
          //     : d.merge_index
          //   }`)
          //   .attr('batch_index', d => d.batch_index)
          //   .attr('info_index', d => d.info_index)
          //   .attr('merge_index', d => d.merge_index)
          //   .attr('d', link_path)
          //   .attr("stroke", d => d.pathColor)
          //   .attr("fill", "none")
          //   .attr("stroke-width", 2)
          //     .attr("stroke-linejoin", d => d.name.slice(0, 11) === "cannotMerge" ? "round" : "")
          //     .attr("stroke-dasharray", d => d.name.slice(0, 11) === "cannotMerge" ? "4 4" : "")
          //     .attr("stroke-linecap", d => d.name.slice(0, 11) === "cannotMerge" ? "round" : "")


          // 改为桑基图
          const link_path = d => {
            let pathHeight = this._y(d.parent.date_entry_e) - this._y(d.parent.date_entry_s);

            let source_x = this._coreX + this._rectWidth;
            let target_x = this._info_size.w - 20;
            let source_y = this._y(d.parent.batch_s) + d.parent.info_index*(this._detail_rect_w+this._detail_gap);
            let target_y = this._y(d.parent.date_entry_s) + pathHeight/2;

            return d3.linkHorizontal()({
              source: [source_x, source_y],
              target: [target_x, target_y]
            })
          };
          const link_width = d => {
            return this._sankeyScale(d.value);
          }
          const link_color = d => {
            let color = d.flagName === 'good'
              ? vm.labelColors[1]
              : d.flagName === 'bad'
              ? vm.labelColors[0]
              : vm.noflagColor
            return color
          }
          let steelspec_link_group = linkRectMerge.selectAll('steelspec_link_group')
            .data(d => d.one_batch_info)
            .enter()
            .append('g')
            .attr('class', 'steelspec_link_group')
            .attr('id', d => `steelspec_link_group_${d.info_index}`)
          
          

          steelspec_link_group.selectAll('.linkRectLine')
            .data(d => {
              let merge_link = d.link_rect.map((e, i) => {
                let good = e.merge_data.filter(f => f.flag == 1).length
                let bad = e.merge_data.filter(f => f.flag == 0).length
                let no = e.merge_data.filter(f => f.flag == 404).length
                let arr = [good, bad, no];
                
                return [
                  {link_i: i, value: good, flagName: 'good', parent: e, targetArr: arr},
                  {link_i: i, value: bad, flagName: 'bad', parent: e, targetArr: arr},
                  {link_i: i, value: no, flagName: 'no', parent: e, targetArr: arr}
                ]
              });
              let all_good = merge_link.map(d => d[0].value);
              let all_bad = merge_link.map(d => d[1].value);
              let all_no = merge_link.map(d => d[2].value);

              merge_link.forEach(e => {
                e[0].parentValue = d3.sum(all_good);
                e[1].parentValue = d3.sum(all_bad);
                e[2].parentValue = d3.sum(all_no);
              });
              let linkData = merge_link.flat();


              linkData.forEach(e => {
                e.sourceArr = [all_good, all_bad, all_no];
              });

              return linkData;
            })
            .join('g')
            .call(g => {
              g.append('path')
                .attr('class', d => {
                  let cls = [];
                  cls.push('linkRectLine');
                  cls.push(`linkRectLine${
                    d.parent.name.slice(0, 11) === "cannotMerge"
                    ? '_' + d.parent.name
                    : d.parent.merge_index}`);
                  cls.push(`linkRectLine-${d.flagName}`);
                  
                  return cls.join(' ');
                })
                .attr('id', d => {
                  let id = [];
                  id.push('linkRectLine');
                  id.push(d.parent.name.slice(0, 11) === "cannotMerge"
                    ? d.parent.name
                    : d.parent.merge_index);
                  id.push(d.flagName);
                  
                  return id.join('-');
                })
                .attr('opacity', 0.5)
                .attr("stroke", link_color)
                .attr("fill", "none")
                .attr("stroke-width", link_width)
                .attr('d', link_path)
                .on('mouseenter', linkPathMouseOver)
                .on('mouseleave', linkPathMouseOut)
            })
            .call(g => {
              g.append('rect')
                .attr('class', d => {
                  let cls = [];
                  cls.push('linkRectSourceNode');
                  cls.push(`linkRectSourceNode${
                    d.parent.name.slice(0, 11) === "cannotMerge"
                    ? '_' + d.parent.name
                    : d.parent.merge_index}`);
                  cls.push(`linkRectSourceNode-${d.flagName}`);
                  
                  return cls.join(' ');
                })
                .attr('id', d => {
                  let id = [];
                  id.push('linkRectSourceNode');
                  id.push(d.parent.name.slice(0, 11) === "cannotMerge"
                    ? d.parent.name
                    : d.parent.merge_index);
                  id.push(d.flagName);
                  
                  return id.join('-');
                })
                .attr('width', 5)
                .attr('height', 20)
                .attr('fill', link_color)
            })
            .call(g => {
              g.append('rect')
                .attr('class', d => {
                  let cls = [];
                  cls.push('linkRectTargetNode');
                  cls.push(`linkRectTargetNode${
                    d.parent.name.slice(0, 11) === "cannotMerge"
                    ? '_' + d.parent.name
                    : d.parent.merge_index}`);
                  cls.push(`linkRectTargetNode-${d.flagName}`);
                  
                  return cls.join(' ');
                })
                .attr('id', d => {
                  let id = [];
                  id.push('linkRectTargetNode');
                  id.push(d.parent.name.slice(0, 11) === "cannotMerge"
                    ? d.parent.name
                    : d.parent.merge_index);
                  id.push(d.flagName);
                  
                  return id.join('-');
                })
                .attr('width', 3)
                .attr('height', 0)
                .attr('fill', link_color)
            })
          function linkPathMouseOver (e, d) {
            let flagName = d.flagName;
            let ele = d3.select(this)._groups[0][0].parentNode.parentNode;
            d3.select(ele).selectAll('.linkRectLine-' + flagName)
              .attr('opacity', 0.8)
          }
          function linkPathMouseOut (e, d) {
            let flagName = d.flagName;
            let ele = d3.select(this)._groups[0][0].parentNode.parentNode;
            d3.select(ele).selectAll('.linkRectLine-' + flagName)
              .attr('opacity', 0.5)
          }
        }
        _renderInfoDetail() {
          const that = this;
          let infoSingleClickStatus = {};
          for (let batch of this._mergeresult_1) {
            for (let info of batch.one_batch_info) {
              let info_id = `${batch.batch_index}_${info.info_index}`
              infoSingleClickStatus[info_id] = false;
            }
          }

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
            // .on('click', __singleClick)
            .on('dblclick', __pathClick)
            .on('mouseenter', __pathOver)
            .on('mouseleave', __pathOut);
          
          // 背景
          chartGroup
            .append('g')
            .attr('class', 'infoBackground')
            .call(g => {
              g.append('rect')
                .attr('class', 'lineRect')
                .attr('width', this._detail_rect_w)
                .attr('height', this._detail_rect_w)
                .attr('stroke', d => d.pathColor)
                .attr('stroke-width', 2)
                .attr('stroke-opacity', 0.4)
                .attr('fill', 'white')
                .attr('filter', 'url(#shadow-card)');
            })
            .call(g => {
              g.append('rect')
                .attr('transform', `translate(${[this._detail_rect_w, this._detail_rect_w/2]})`)
                .attr('class', 'linkRectSourceBGC')
                .attr('width', 8)
                .attr('height', 50)
                .attr('fill', 'white')
            });
          
          // 具体内容
          let chartContentGroup = chartGroup.append('g')
            .attr('class', 'infoContent')
            .attr('transform', `translate(${[this._circleR, this._circleR]}) scale(0)`);
          this._renderInfoDetailCircle(chartContentGroup);

          // 规格信息
          let targetInfoGroup = chartGroup.append('g')
            .attr('class', 'targetInfo')
            .attr('transform', `translate(${[this._circleR, this._circleR]}) scale(1)`);
          this._renderInfoTargetInfo(targetInfoGroup);

          // let centerRect = oneBatchChartGroup.selectAll('centerRect')
          //   .data(d => d.one_batch_info)
          //   .join('g')
          //   .attr('transform', (d, i) => `translate(${[0, (this._detail_rect_w + this._detail_gap)*d.info_index]})`)
          //   .attr('class', 'centerRect')
          //   .attr('id', d => `centerRect_${d.info_index}`)
          //   .attr('info_index', d => d.info_index)
          //   .attr('batch_index', d => d.link_rect[0].batch_index)
          //   .attr('merge_index', d => d.link_rect.map(e => ''+e.merge_index).join(' '))
          //   .on('mouseenter', __centerRect)
          //   .on('mouseleave', __centerLeave);
          // this._renderCenterRect(centerRect);   // 中间正方形

          InfoDetailGroup.lower();

          let timer;
          function __pathClick(e, d) {  // 双击触发诊断
            clearTimeout(timer);
            // console.log('双击')
            let info_index = d3.select(this).attr('info_index');
            let batch_index = d3.select(this).attr('batch_index');
            let merge_index = d3.select(this).attr('merge_index');
            let merge_index_list = merge_index.split(' ').map(d => +d);
            let info_id = batch_index + '_' + info_index;

            // 移动整个画面，将当前的batch放在第一个位置
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
              vm.$emit('exitDiagStatus');
            } else {
              if (Object.keys(that._mergeClickValue).length !== 0) {
                that._mergeClickValue = [];
              }
              that._mergeClickValue[info_id] = {
                batch_index: batch_index,
                info_index: info_index,
                merge_index_list: merge_index_list
              };
              // console.log(info_id)
              
              let merge_items_upid = selected_plates.map(d => d.upid);
              let sort_res = d3.sort(merge_items_upid, d => that._dataUCL.get(d)!==undefined ? -that._dataUCL.get(d)[0].flag : 0);
              vm.hightLight(sort_res);

              that._trainClickHandle(info_id.split('_').map(d => (+d)));   // 点击后往父组件发送数据
            }
          }
          function __pathOver(e, d) {
            let batch_index = d3.select(d3.select(this)._groups[0][0].parentNode).attr('batch_index');
            let merge_index = d3.select(this).attr('merge_index');
            let merge_index_list = d.link_rect.map(e => e.merge_index);
            let info_index = d3.select(this).attr('info_index');
            let info_id = batch_index + '_' + info_index;

            that._setInfoDetail(batch_index, info_index);
            if (d.steelspec !== "cannotMerge") {
              let selected_plates = that.__getSelectPlate([batch_index], merge_index_list);

              if (that._is_merge) {
                that._setMergeRect([batch_index], merge_index.split(' ').map(d => +d));
                that._setMoniBlock(batch_index, merge_index.split(' ').map(d => +d));
              } else {
                let selected_plates = d.link_rect_data.flat();
                that._reduceOpacity();
                for (let upid of selected_plates.map(d => d.upid)) {
                  that.__setMareyLine(upid);
                  that._setMoniPlates(upid);
                }
              }

              that._setIconPlate(selected_plates.map(d => d.upid));
              that._setLinkLine([batch_index], d.link_rect.map(e => e.merge_index));
              that._setMergeBin(selected_plates);
              that._emitToScatter(selected_plates, 0);

              if(that._mergeClickValue[info_id] == undefined) {
                that._emitToScatter(selected_plates, 0);
              }
            } else {
              let selected_plates = d.link_rect_data.flat();
              that._reduceOpacity();
              for (let upid of selected_plates.map(d => d.upid)) {
                that.__setMareyLine(upid);
                that._setMoniPlates(upid);
              }

              if (that._is_merge) {
                that._setMoniBlock(batch_index, [-1]);
              }

              that._setIconPlate(selected_plates.map(d => d.upid));
              that._setLinkLine([batch_index], d.link_rect.map(e => '_' + e.name));
              that._setMergeBin(selected_plates);
              that._emitToScatter(selected_plates, 0);

              if(that._mergeClickValue[info_id] == undefined) {
                that._emitToScatter(selected_plates, 0);
              }
            }

            
          }
          function __pathOut(e, d) {
            let batch_index = d3.select(d3.select(this)._groups[0][0].parentNode).attr('batch_index');
            let merge_index = d3.select(this).attr('merge_index');
            let merge_index_list = d.link_rect.map(e => e.merge_index);
            let info_index = d3.select(this).attr('info_index');
            let info_id = batch_index + '_' + info_index;
            
            that._resetInfoDetail();

            if (d.steelspec !== "cannotMerge") {
              let selected_plates = that.__getSelectPlate([batch_index], merge_index_list);
              if (that._is_merge) {
                that._resetMergeRect();
                that._resetMoniBlock(batch_index, merge_index.split(' ').map(d => +d));
              } else {
                let selected_plates = d.link_rect_data.flat();
                that._raiseOpacity();
                for (let upid of selected_plates.map(d => d.upid)) {
                  that.__resetMareyLine(upid);
                  that._resetMoniPlates(upid);
                }
              }

              that._emitToScatter(selected_plates, 1);
              if(that._mergeClickValue[info_id] == undefined) {
                that._emitToScatter(selected_plates, 1);
              }
            } else {
              let selected_plates = d.link_rect_data.flat();
              that._raiseOpacity();
              for (let upid of selected_plates.map(d => d.upid)) {
                that.__resetMareyLine(upid);
                that._resetMoniPlates(upid);
              }
              if (that._is_merge) {
                that._resetMoniBlock(batch_index, [-1]);
              }
              that._emitToScatter(selected_plates, 1);
              if(that._mergeClickValue[info_id] == undefined) {
                that._emitToScatter(selected_plates, 1);
              }
            }
            that._resetIconPlate();
            that._resetLinkLine();
            that._resetMergeBin();
            that._keepClickedStatus();
          }
          function __singleClick(e, d) {
            clearTimeout(timer);
            let _info_id = `${d3.select(this).attr('batch_index')}_${d.info_index}`
            let _info_status = infoSingleClickStatus[_info_id];
            timer = setTimeout(() => {
              if(!_info_status) {
                __centerRect.bind(this, e, d)();
              }
              else {
                __centerLeave.bind(this, e, d)();
              }
              infoSingleClickStatus[_info_id] = !_info_status;
            }, 300);
          }
          function __centerRect(e, d) { // 单击触发切换
            let line_tran = d3.transition()
              .delay(50)
              .duration(500)
            let info_index = d3.select(this).attr('info_index');
            let batch_index = d3.select(this).attr('batch_index');
            let merge_index = d3.select(this).attr('merge_index');
            let merge_index_list = merge_index.split(' ').map(d => +d);
            let info_id = batch_index + '_' + info_index;

            that._info_g.select(`#oneBatchChartGroup${batch_index} #chartGroup_${info_index} .infoContent`)
              .transition(line_tran)
              .attr('transform', `translate(${[that._circleR, that._circleR]}) scale(0)`)
            
            that._info_g.select(`#oneBatchChartGroup${batch_index} #chartGroup_${info_index} .targetInfo`)
              .transition(line_tran)
              .attr('transform', `translate(${[that._circleR, that._circleR]}) scale(1)`)
          }
          function __centerLeave(e, d) {
            let line_tran = d3.transition()
              .delay(50)
              .duration(500)
            let info_index = d3.select(this).attr('info_index');
            let batch_index = d3.select(this).attr('batch_index');
            let merge_index = d3.select(this).attr('merge_index');
            let merge_index_list = merge_index.split(' ').map(d => +d);
            let info_id = batch_index + '_' + info_index;

            that._info_g.select(`#oneBatchChartGroup${batch_index} #chartGroup_${info_index} .infoContent`)
              .transition(line_tran)
              .attr('transform', `translate(${[that._circleR, that._circleR]}) scale(1)`)
            
            that._info_g.select(`#oneBatchChartGroup${batch_index} #chartGroup_${info_index} .targetInfo`)
              .transition(line_tran)
              .attr('transform', `translate(${[that._circleR, that._circleR]}) scale(0)`)
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
          this._is_merge ? this._uniform_ErrorLine(chartGroup) : undefined;    // 画误差线
          this._uniform_QuantileLine(chartGroup);    // 分位线
          // this._StageText(chartGroup);            // 工序文字
          this._renderCenterRect(chartGroup);   // 中间正方形

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
          const that = this;
          let circlecolor = this._deepCopy(vm.processColor);
          circlecolor.unshift('#cccccc');  // 时间颜色
          let all_stage_angle = this._uniformity_angle, pr_angle = this._uniformity_pr_angle;

          let FillArcGroup = chartGroup
            .append('g')
              .attr('class', 'FillArcGroup')
          
          prFill(); // 节奏
          this._is_merge ? mergeStageFill() : noMergeStageFill(); // 填充内环
          subStageFill(); // 填充外环

          
          function prFill() {
            FillArcGroup
              .append('path')
              .attr('d', d => d3.arc()
                .innerRadius(that._inner_arc_r1)
                .outerRadius(that._inner_arc_r2)
                .startAngle(that._arc_start)
                .endAngle(that._arc_start + pr_angle * (d.pr_angle[0]>=1?1:d.pr_angle[0]))())
              .attr('class', 'inner_pr_fill')
              .attr('fill', d => d.pr_angle[0]>=1?`url(#hatching_pattern_${0})`:circlecolor[0])
              .on('mouseenter', function(e, d) {
                let group = d3.select(this.parentNode.parentNode.parentNode);
                group.select('.inner_pr_stroke')
                  .attr('stroke-width', 2)

                let a = 0;
                let r = (that._inner_arc_r2 + that._inner_arc_r1) / 2;
                let [x, y] = that.__translateXY(r - 5, a);
                
                let val = that._info_extent.stage[0][1] * d.pr_angle[0] / 1000
                let infoContent = d3.select(this.parentNode.parentNode)
                infoContent.call(g => {
                  that.__infoTooltip(g, `${val.toFixed(2)} s`, [x, y], circlecolor[0])
                })
              })
              .on('mouseleave', function(e, d) {
                let group = d3.select(this.parentNode.parentNode.parentNode);
                group.select('.inner_pr_stroke')
                  .attr('stroke-width', 1)
                
                let infoContent = d3.select(this.parentNode.parentNode)
                infoContent.select('#infoTooltip').remove()
              })
          }
          function mergeStageFill() {
            FillArcGroup.selectAll('.innerFill')
              .data(datum => datum.stage_angle)
              .enter()
              .append('path')
              .attr('d', (d, i) => {
                let start_angle = all_stage_angle[i].stage_start;
                let end_angle = all_stage_angle[i].stage_end;
                let arc_angle = start_angle + (end_angle-start_angle) * (d[0]>=1?1:d[0]);
                return d3.arc()
                  .innerRadius(that._inner_arc_r1 + 0.5)
                  .outerRadius(that._inner_arc_r2 - 0.5)
                  .startAngle(start_angle)
                  .endAngle(arc_angle)()
              })
              .attr('class', (d, i) => `inner_stage_fill inner_stage_fill_${i}`)
              .attr('fill', (d, i) => d[0]>=1?`url(#hatching_pattern_${i+1})`:circlecolor[i+1])
              .on('mouseenter', function (e, d) {
                let group = d3.select(this.parentNode.parentNode.parentNode);
                let i = d3.select(this).attr('class').slice(-1)
                group.select('.inner_stage_stroke_' + i)
                  .attr('stroke-width', 2)
                
                // 计算角度
                let stage_angle = !that._info_state ? that._proportion_angle : that._uniformity_angle
                let a = (stage_angle[i].stage_start + stage_angle[i].stage_end) / 2;
                let r = (that._inner_arc_r2 + that._inner_arc_r1) / 2;
                let pos = that.__translateXY(r, a);
                
                let val = that._info_extent.stage[(+i) + 1][1] * d[0] / 1000
                let infoContent = d3.select(this.parentNode.parentNode)
                infoContent.call(g => {
                  that.__infoTooltip(g, `${val.toFixed(2)} s`, pos, circlecolor[(+i) + 1])
                })

                // 更改马雷图线
                let range = i === "0" ? [0, 6] : i === "1" ? [6, 14] : [14, 17]
                for (let index = range[0]; index < range[1]; index++) {
                  that._setStationLine(index);
                }
              })
              .on('mouseleave', function (e, d) {
                let group = d3.select(this.parentNode.parentNode.parentNode);
                let i = d3.select(this).attr('class').slice(-1)
                group.select('.inner_stage_stroke_' + i)
                  .attr('stroke-width', 1)
                
                let infoContent = d3.select(this.parentNode.parentNode)
                infoContent.select('#infoTooltip').remove()

                let range = i === "0" ? [0, 6] : i === "1" ? [6, 14] : [14, 17]
                for (let index = range[0]; index < range[1]; index++) {
                  that._resetStationLine(index);
                }
              })
          }
          function noMergeStageFill() {
            const stage_width = that._inner_arc_width;
            const bar_stroke_width = 0;
            FillArcGroup.selectAll('.per_plate_fill')
              .data(d => d.stage_for_pre_plate.map((e, i) => {
                return {upid: e.upid, stage_angle: e.stage_angle, n: d.stage_for_pre_plate.length, k: i}  // k: 第k块板
              }))
              .enter()
              .append('g')
                .attr('class', 'per_plate_fill')
                .attr('id', d => 'per_plate_fill_' + d.upid)
                .selectAll('.pre_plate_stage_fill')
                .data(d => d.stage_angle.map((e, i) => {return {i: i, data: e, n: d.n, k: d.k}}))
                .enter()
                .append('path')
                .attr('d', (d, i) => {
                  let bar_width = stage_width / d.n;
                  let bar_r1 = that._inner_arc_r1 + d.k * bar_width + bar_stroke_width;
                  let bar_r2 = that._inner_arc_r1 + (d.k + 1) * bar_width - bar_stroke_width;

                  let angle_span = all_stage_angle[i].stage_end - all_stage_angle[i].stage_start;
                  let bar_span = angle_span * (d.data > 1 ? 1 : d.data);
                  return d3.arc()
                    .innerRadius(bar_r1)
                    .outerRadius(bar_r2)
                    .startAngle(all_stage_angle[i].stage_start)
                    .endAngle(all_stage_angle[i].stage_start + bar_span)()
                })
                .attr('fill', (d, i) => circlecolor[i+1])
                // .attr('stroke-width', bar_stroke_width)
                // .attr('stroke', (d, i) => d3.color(circlecolor[i+1]).darker(0.5))
                
          }
          function subStageFill() {
            FillArcGroup.selectAll('.outerFill')
              .data(datum => datum.stage_sub_angle)
              .enter()
              .append('path')
                .attr('d', d => {
                  let start_angle = all_stage_angle[d[0].stage_i].stage_sub[d[0].sub_j][0];
                  let end_angle = all_stage_angle[d[0].stage_i].stage_sub[d[0].sub_j][1];
                  let arc_angle = start_angle + (end_angle - start_angle) * (d[0].data>=1?1:d[0].data);
                  return d3.arc()
                    .innerRadius(that._outer_arc_r1)
                    .outerRadius(that._outer_arc_r2)
                    .startAngle(start_angle)
                    .endAngle(arc_angle)()
                })
                .attr('class', 'inner_sub_fill')
                .attr('stage_i', d => d[0].stage_i)
                .attr('sub_j', d => d[0].sub_j)
                .attr('fill', d => d[0].data>=1?`url(#hatching_sub_pattern_${d[0].stage_i+1})`:circlecolor[d[0].stage_i + 1])
                .on('mouseenter', function(e, d) {
                  let ele = d3.select(this)
                  let stage_i = ele.attr('stage_i')
                  let sub_j = ele.attr('sub_j')
                  let group = d3.select(this.parentNode.parentNode.parentNode);
                  group.select(`.outer_sub_stroke_${stage_i}_${sub_j}`)
                    .attr('stroke-width', 2)
                  
                  // 计算角度
                  let stage_angle = !that._info_state ? that._proportion_angle : that._uniformity_angle
                  let a = (stage_angle[+stage_i].stage_sub[+sub_j][0] + stage_angle[+stage_i].stage_sub[+sub_j][1]) / 2;
                  let r = (that._outer_arc_r1 + that._outer_arc_r2) / 2
                  let pos = that.__translateXY(r, a);

                  let val = that._info_extent.sub_stage[+stage_i][+sub_j][1] * d[0].data / 1000
                  let infoContent = d3.select(this.parentNode.parentNode)
                  infoContent.call(g => {
                    that.__infoTooltip(g, `${val.toFixed(2)} s`, pos, circlecolor[(+stage_i) + 1])
                  })
                  
                  let setIndex = stage_i === "0" ? (+sub_j) : stage_i === "1" ? (+sub_j) + 6 : (+sub_j) + 14;
                  that._setStationLine(setIndex);
                  that._setStationLine(setIndex + 1);
                })
                .on('mouseleave', function(e, d) {
                  let ele = d3.select(this)
                  let stage_i = ele.attr('stage_i')
                  let sub_j = ele.attr('sub_j')
                  let group = d3.select(this.parentNode.parentNode.parentNode);
                  group.select(`.outer_sub_stroke_${stage_i}_${sub_j}`)
                    .attr('stroke-width', 1)
                  
                  let infoContent = d3.select(this.parentNode.parentNode)
                  infoContent.select('#infoTooltip').remove()
                  
                  let setIndex = stage_i === "0" ? (+sub_j) : stage_i === "1" ? (+sub_j) + 6 : (+sub_j) + 14;
                  that._resetStationLine(setIndex);
                  that._resetStationLine(setIndex + 1);
                })
          }
        }
        _uniform_StageStroke(chartGroup) {
          let all_stage_angle = this._uniformity_angle;
          let pr_angle = this._uniformity_pr_angle;
          let path_attr = g => g
              .attr('stroke', 'grey')
              .attr('stroke-width', 1)
              .attr('fill', 'none')
            
          let ArcGroup = chartGroup.append('g')
            .attr('class', 'ArcGroup')
            
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
            .attr('class', (d, i) => `inner_stage_stroke inner_stage_stroke_${i}`)
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
            .attr('class', (d, j) => {
              let i = j < 5 ? 0 : j < 12 ? 1 : 2
              let _j = j < 5 ? j : j < 12 ? j - 5 : j - 12
              return `outer_sub_stroke outer_sub_stroke_${i}_${_j}`
            })
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

          quantileLineGroup
            .append('circle')
            .attr('class', 'quantile_circle')
            .attr('fill', (d, i) => d3.color(circlecolor[i+1]))//.brighter(0.3)
            .attr('stroke', (d, i) => d3.color(circlecolor[i+1]).darker(0.5))
            .attr('stroke-width', 1)
            .attr("r", (d, i) => (!d[0] || d[0] >= 1 || d[3] >= 1) ? 0 : 2)
            .attr("cy", (d, i) => this.__computeQuantileCicleCxCy(d, i, all_stage_angle, false))
            .attr("cx", (d, i) => this.__computeQuantileCicleCxCy(d, i, all_stage_angle, true));
        }
        __computeQuantileCicleCxCy = (d, i, all_stage_angle, cx) => {
          if (!d[0]) return 0
          let c_r = (this._quantile_r2 + this._quantile_r1) / 2;
          let start_angle = all_stage_angle[i].stage_start;
          let end_angle = all_stage_angle[i].stage_end;
          let c_angle = start_angle + (end_angle-start_angle) * d[1];
          let res = cx ? Math.sin(c_angle) * c_r : -(Math.cos(c_angle) * c_r);
          if (!res) return;
          return res;
        }
        _renderCenterRect(chartGroup) {
          let color = [vm.labelColors[1], vm.labelColors[0], vm.noflagColor]; // good, bad, noflag
          let rect_w = 20;
          let gap = 1.5;
          const that = this;

          let CenterRectGroup = chartGroup.selectAll('CenterRectGroup')
            .data(d => d.label_statistics)
            .enter()
            .append('g')
            .attr('class', 'CenterRectGroup')
            .attr('transform', `translate(${[0, -rect_w/Math.pow(2, 0.5)]}) rotate(45)`)
            .on('click', function (e, d) {
              const chartGroup = d3.select(this.parentNode.parentNode);
              let batch_index = +chartGroup.attr('batch_index')
              let info_index = +chartGroup.attr('info_index')
              let merge_index_list = chartGroup.attr('merge_index').split(' ').map(e => (+e))
              let click_id = `${batch_index}_${info_index}`

              if (that._displayInfoBadPlate[click_id]) {
                that._displayInfoBadPlate[click_id] = !that._displayInfoBadPlate[click_id]
              } else {
                that._displayInfoBadPlate[click_id] = true
              }

              if (that._displayInfoBadPlate[click_id]) {
                let bad_plates = [];
                that._mergeresult_1[batch_index].merge_data.forEach((e, i) => {
                  if (merge_index_list.indexOf(i) !== -1) {
                    bad_plates.push(e.mergeItem.filter(f => f.flag === 0))
                  }
                })

                for (let merge_index of merge_index_list) {
                  let mergeG_select_g = that._marey_g.select(`#batchG${batch_index} #mergeG${merge_index}`)
                    .select('.mergeG_select_g')
                  
                  mergeG_select_g.selectAll('info_bad_plate_mareyline')
                    .data(bad_plates.flat())
                    .join('g')
                    .attr('class', `select_g info_bad_plate_${click_id}`)
                    .attr('transform', d => `translate(0, ${that._y(new Date(d.stops[0].time))})`)
                    .style('color', that._trainGroupStyle)
                    .attr('stroke-width', d => { return that._defaultStrokeWidth(d.tgtplatethickness2) } )
                    .attr('id', d => ('id' + d.upid))
                    .call(g => g.append('path')
                      .attr('fill', 'none')
                      .attr('stroke', 'currentColor')
                      .attr('d', d => that._line(d.stops)))
                }
              } else {
                that._marey_g.selectAll('.info_bad_plate_' + click_id).remove()
              }

              e.stopPropagation()
            })

          CenterRectGroup.selectAll('.good_bad_noflag')
            .data(d => getPolygonPoint(rect_w, gap, ...d))
            .enter()
            .append("path")
            .attr("fill", (_, i) => color[i])
            .attr("fill-opacity", 0.4)
            .attr("stroke", (_, i) => d3.color(color[i]).darker(0.5))
            .attr('stroke-width', 0.5)
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
        _changeInfoCircleStatusButton() {
          let that = this;
          let changebutton = this._info_g.append('g')
            .attr('transform', `translate(${[27, 10]})`);

          let button_w = 30
          let button_gap = 5;
          // changebutton.append('rect')
          //   .attr('width', button_w)
          //   .attr('height', button_w)
          //   .attr('fill', 'white')
          //   .attr('rx', 2)
          //   .attr('ry', 2)
          //   // .attr('stroke', '#aaa');
          // changebutton.append('image')
          //   .attr('id', 'info_state')
          //   .attr('width', button_w-button_gap)
          //   .attr('height', button_w-button_gap)
          //   .attr('transform', `translate(${[button_gap/2, button_gap/2]})`)
          //   .attr('href', info_state)

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
                __transQuantileLine(InfoDetailGroup, this._proportion_pr_angle, this._uniformity_pr_angle, this._proportion_angle, this._uniformity_angle);
                __transText(InfoDetailGroup, this._proportion_pr_angle, this._proportion_angle);
              }
              // proportion to uniformity
              else {
                __transStroke(InfoDetailGroup, this._uniformity_pr_angle, this._proportion_pr_angle, this._uniformity_angle, this._proportion_angle);
                __transFill(InfoDetailGroup, this._uniformity_pr_angle, this._proportion_pr_angle, this._uniformity_angle, this._proportion_angle);
                __transErrLine(InfoDetailGroup, this._uniformity_pr_angle, this._proportion_pr_angle, this._uniformity_angle, this._proportion_angle);
                __transQuantileLine(InfoDetailGroup, this._uniformity_pr_angle, this._proportion_pr_angle, this._uniformity_angle, this._proportion_angle);
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
            
            if (that._is_merge) {
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
            } else {
              const stage_width = that._inner_arc_width;
              const bar_stroke_width = 0;
              FillArcGroup.selectAll('.per_plate_fill path')
                .transition(tran)
                .attrTween('d', (d, i) => {
                  let bar_width = stage_width / d.n;
                  let bar_r1 = that._inner_arc_r1 + d.k * bar_width + bar_stroke_width;
                  let bar_r2 = that._inner_arc_r1 + (d.k + 1) * bar_width - bar_stroke_width;

                  let old_angle_span = old_stage_angle[d.i].stage_end - old_stage_angle[d.i].stage_start;
                  let old_bar_span = old_angle_span * (d.data > 1 ? 1 : d.data);
                  let new_angle_span = new_stage_angle[d.i].stage_end - new_stage_angle[d.i].stage_start;
                  let new_bar_span = new_angle_span * (d.data > 1 ? 1 : d.data);

                  let start_interpolate = d3.interpolate(old_stage_angle[d.i].stage_start, new_stage_angle[d.i].stage_start);
                  let end_interpolate = d3.interpolate(
                    old_stage_angle[d.i].stage_start + old_bar_span,
                    new_stage_angle[d.i].stage_start + new_bar_span
                  );
                  return function(t) {
                    return d3.arc()
                      .innerRadius(bar_r1)
                      .outerRadius(bar_r2)
                      .startAngle(start_interpolate(t))
                      .endAngle(end_interpolate(t))()
                  }
                })
            }

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

            QuantileLineGroup.selectAll('.quantile_line')
              .transition(tran)
              .attrTween('d', (d,i) => {
                if (!d[0] || d[0] >= 1 || d[3] >= 1) return ''

                let old_arc_start_angle = old_stage_angle[i].stage_start + (old_stage_angle[i].stage_end-old_stage_angle[i].stage_start) * d[0];
                let old_arc_end_angle = old_stage_angle[i].stage_start + (old_stage_angle[i].stage_end-old_stage_angle[i].stage_start) * d[2];
                let new_arc_start_angle = new_stage_angle[i].stage_start + (new_stage_angle[i].stage_end-new_stage_angle[i].stage_start) * d[0];
                let new_arc_end_angle = new_stage_angle[i].stage_start + (new_stage_angle[i].stage_end-new_stage_angle[i].stage_start) * d[2];

                let start_interpolate = d3.interpolate(old_arc_start_angle, new_arc_start_angle);
                let end_interpolate = d3.interpolate(old_arc_end_angle, new_arc_end_angle);
                return function(t) {
                  return d3.arc()
                  .cornerRadius(1.5)
                  .innerRadius(that._quantile_r1)
                  .outerRadius(that._quantile_r2)
                  .startAngle(start_interpolate(t))
                  .endAngle(end_interpolate(t))()
                }
              })
            QuantileLineGroup.selectAll('.quantile_circle')
              .transition(tran)
              .attr("cy", (d, i) => that.__computeQuantileCicleCxCy(d, i, new_stage_angle, false))
              .attr("cx", (d, i) => that.__computeQuantileCicleCxCy(d, i, new_stage_angle, true));
          }
        }
        _renderInfoTargetInfo(chartGroup) {
          const target = ['tgtplatethickness', 'tgtwidth', 'tgtplatelength2'];
          const targetMap = {
            tgtplatelength2: {name: "L", unit: "m"},
            tgtwidth: {name: "W", unit: "m"},
            tgtplatethickness: {name: "T", unit: "mm"}
          }
          target.forEach(d => targetMap[d]['extent'] = this._tar_extent[d]);
          const labelColor = [vm.labelColors[1], vm.labelColors[0], vm.noflagColor];

          const width = this._detail_rect_w - this._targetMargin * 2;
          const headHeight = this._targetHeadHeight;
          const contHeight = width - headHeight;
          const contWidth = width - this._targetTickWidth;

          const xScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, this._detail_rect_w-this._targetMargin*2 - this._targetTickWidth - 10])
          const yScale = d3.scaleBand()
            .domain(target.map(d => targetMap[d].name))
            .range([0, width - headHeight])
            .padding(0.35);
          const yAxis = d3.axisLeft(yScale)
            .tickSizeOuter(0);
          
          // // 定位用，删
          // chartGroup.append('rect')
          //   .attr('width', width)
          //   .attr('height', headHeight)
          //   .attr('transform', `translate(${[-width/2, -width/2]})`)
          //   .attr('fill', 'none')
          //   .attr('stroke', 'red')
          // chartGroup.append('rect')
          //   .attr('width', this._targetTickWidth)
          //   .attr('height', contHeight)
          //   .attr('transform', `translate(${[-width/2, -width/2 + headHeight]})`)
          //   .attr('fill', 'none')
          //   .attr('stroke', 'green')
          // chartGroup.append('rect')
          //   .attr('width', contWidth)
          //   .attr('height', contHeight)
          //   .attr('transform', `translate(${[-width/2 + this._targetTickWidth, -width/2 + headHeight]})`)
          //   .attr('fill', 'none')
          //   .attr('stroke', 'blue')

          const headFontSize = 20;
          const headOffset = 10;
          const headBottemMargin = 10;
          chartGroup.append('g')
            .attr('transform', `translate(${[-width/2, -width/2]})`)
            .call(g => g.append('text')
              .attr('transform', `translate(${[width/2 - 20, headHeight/2 + headFontSize/2 - headOffset - 2]})`)
              .text(d => d.maxSteelspec)
              .attr("fill", d => d.maxSteelspecColor)
              .style("font-family", util.conditionMiniYAxisTextAttr.fontFamily)
              .style("font-size", headFontSize)
              .style("font-weight", 'normal')
              .style('text-anchor', 'middle'))
            .call(g => g.append('line')
              .attr('transform', `translate(${[0, headHeight - headOffset]})`)
              .attr('x1', headBottemMargin)
              .attr('x2', width-headBottemMargin)
              .attr('stroke', '#ccc')
              .attr('stroke-width', 2))
            .call(g => {
              let p = g.append('g')
                .attr('transform', `translate(${[width - 20, 10]})`)
                .attr("stroke", 'white')
                .attr("stroke-width", 1)
              
              p.selectAll('path')
              .data(d => d3.pie()(d.label_statistics[0]))
              .join('path')
                .attr('fill', (_, i) => labelColor[i])
                .attr('d', d3.arc().innerRadius(6).outerRadius(12))
            })
            .call(g => {
              g.append('g')
                .attr('transform', `translate(${[width - 12, 0]})`)
                .attr("fill", labelColor[1])
                .style("font-family", util.conditionMiniYAxisTextAttr.fontFamily)
                .style("font-size", 10)
                .style("font-weight", 'normal')
                .append('text')
                .text(d => (d.label_statistics[0][1] * 100).toFixed(1) + '%')
            })
          

          chartGroup.append('g')
            .attr('class', 'barChart')
            .attr('transform', `translate(${[-width/2 + this._targetTickWidth, -width/2 + headHeight]})`)
            .selectAll('rect')
            .data(d => {
              const cmp = e => [...d.targetInfo[e],
                d.prev_targetInfo ? d.targetInfo[e][1] - d.prev_targetInfo[e][1] : 0]
              return target.map(cmp)
            })
            .join('g')
            .attr('index', (_, i) => i)
            // .on('mouseenter', function (e, d) {
            //   let barGroup = d3.select(this);
            //   let index = barGroup.attr('index')
            //   const fontSize = 11;
            //   const fontColor = d3.color('#cbdcea').darker(1);
            //   barGroup.append('text')
            //     .text(`${d[1].toFixed(2)} ${targetMap[target[index]].unit}`)
            //     .attr('x', xScale(1) / 2)
            //     .attr('y', yScale(targetMap[target[index]].name) + (yScale.bandwidth() + fontSize) / 2 - 2)
            //     .attr('fill', fontColor)
            //     .attr('font-size', fontSize)
            //     .style('font-weight', 'normal')
            //     .style('font-style', 'normal')
            //     .attr('text-anchor', 'middle')

            // })
            // .on('mouseleave', function (e, d) {
            //   let barGroup = d3.select(this);
            //   barGroup.select('text').remove()
            // })   
            .call(g => g.append('rect')
              .attr('fill', 'white')
              .attr('stroke', '#999')
              .attr('stroke-width', 1.5)
              .attr('x', xScale(0) + 2)
              .attr('y', (_, i) => yScale(targetMap[target[i]].name) - 0.75)
              .attr('width', d => xScale(1))
              .attr('height', yScale.bandwidth() + 1.5))
            .call(g => g.append('rect')
              .attr('fill', '#cbdcea')
              .attr('x', xScale(0))
              .attr('y', (_, i) => yScale(targetMap[target[i]].name))
              .attr('width', d => xScale(d[0]) + 2)
              .attr('height', yScale.bandwidth()))
            .call(g => {
              const fontSize = 11;
              const fontColor = d3.color('#cbdcea').darker(1);
              g.append('text')
                .text((d, i) => `${d[1].toFixed(2)} ${targetMap[target[i]].unit}`)
                .attr('x', xScale(1) / 2)
                .attr('y', (d, i) => yScale(targetMap[target[i]].name) + (yScale.bandwidth() + fontSize) / 2 - 2)
                .attr('fill', fontColor)
                .attr('font-size', fontSize)
                .style('font-weight', 'normal')
                .style('font-style', 'normal')
                .attr('text-anchor', 'middle')
            })
            .call(g => {
              g.append('path')
                .attr('d', (d, i) => {
                  const DIFF = targetMap[target[i]].extent[1] * 0.1;
                  if (d[2] >= -DIFF && d[2] <= DIFF) return '';

                  let x = xScale(0.98);
                  let y = yScale(targetMap[target[i]].name) + yScale.bandwidth() / 2;
                  return d3.line()([[x, y], [x - 10, y]]);
                })
                .attr('stroke', 'black')
                .attr('marker-start', (d, i) => {
                  const DIFF = targetMap[target[i]].extent[1] * 0.1;
                  return d[2] > DIFF ? 'url(#targetInfo-shape-arrow)' : ''
                })
                .attr('marker-end', (d, i) => {
                  const DIFF = targetMap[target[i]].extent[1] * 0.1;
                  return d[2] < -DIFF ? 'url(#targetInfo-shape-arrow)' : ''
                })
            })
          
          chartGroup.append('g')
            .attr('transform', `translate(${[-width/2 + this._targetTickWidth, -width/2 + headHeight]})`)
            .style("font-family", util.conditionMiniYAxisTextAttr.fontFamily)
            .style("font-size", 10)
            .style("font-weight", 'normal')
            .style("color", '#999')
            .call(yAxis)

        }
        __infoTooltip(g, text, pos, color) {
          let box
          const infoTooltip = g.append('g')
          .attr('id', 'infoTooltip')

          color = d3.color(color).darker(0.5)
          infoTooltip
          .call(g => {
            g.append('text')
              .text(text)
              .attr('id', 'infoTooltipText')
              .attr('fill', color)
          })
          .call(g => {
            box = g.select('#infoTooltipText').node().getBBox()
            g.append('path')
              .attr('stroke', color)
              .attr('fill', 'white')
              .attr('d', `
                M${box.x - 10},${box.y - 10}
                H${box.width / 2 - 5}l5,-15l5,15
                H${box.width + 10}
                v${box.height + 20}
                h-${box.width + 20}
                z
              `)
              .lower()
          })
          .attr('transform', `translate(${[pos[0] - box.width/2, pos[1] + box.height+20]})`)
        }
        __translateXY (radius, alpha) {
          let x = Math.sin(alpha) * radius;
          let y = - Math.cos(alpha) * radius;
          return [x, y];
        }

        // 右边监控视图
        _renderMonitorChart() {
          this._moni_g === undefined ? undefined : this._moni_g.remove();
          this._moni_g = this._container.append('g')
            .attr('class', 'monitorContentGroup')
            .attr('transform', `translate(${[this._info_size.w + this._marey_size.w + 15, 0]})`); // 原来偏移是35

          // this._renderMonitorContent();

          this._renderMonitorContent_1();
        }
        _renderMonitorContent() {
          const that = this;
          let process = ['Heat', 'Roll', 'Cool'];
          
          let monitorDiagGroup = this._moni_g.append('g')
            .attr('class', 'monitorDiagGroup');
          
          let monitorProcess = monitorDiagGroup.selectAll('monitorProcess')
            .data(this._monitoringdata.diag)
            .enter()
            .append('g')
            .attr('class', 'monitorProcess')
            .attr('id', (d, i) => 'monitorProcess_' + process[i])
            .attr('transform', (d, i) => `translate(${(this._moni_rect_w + 10) * i}, 0)`)
          
          // let moni_process = monitorRect.selectAll('.moni_process_rect')
          //   .data(d => d.proce_num)
          //   .enter()
          //   .append('g')
          //   .attr('transform', (d, i) => `translate(${(moni_rect_w+10) * (+d.d - 1)}, 0)`)
          // moni_process
          //   .append('rect')
          //   .attr('class', 'moni_process_rect')
          //   .attr('width', moni_rect_w)
          //   .attr('height', d => this._y(d.h_e)-this._y(d.h_s))
          //   .attr('rx', rect_radius)
          //   .attr('ry', rect_radius)
          //   .attr('fill', d => d.color)
          //   .attr('opacity', 0.1)
          //   .attr('stroke', '#CED3D6')
          //   .attr('stroke-width', 1)
          // moni_process
          //   .append('rect')
					// 	.attr('class', 'moni_process_rect')
          //   .attr('width', moni_rect_w)
          //   .attr('height', d => this._y(d.h_e)-this._y(d.h_s))
          //   .attr('rx', rect_radius)
          //   .attr('ry', rect_radius)
          //   .attr('stroke', d => d3.color(d.color).darker(0.1))
          //   .attr('stroke-width', 1)
          //   .attr('stroke-opacity', 0.4)
          //   .attr('fill', 'none')
          //   .attr('filter', 'url(#shadow-card)');
          

          paintDiagnosis(monitorProcess, 'Q');
          paintDiagnosis(monitorProcess, 'T2');

          function paintDiagnosis(Group, type) {
            let Scale;
            if (type === 'Q') Scale = that._QScale;
            else if (type === 'T2') Scale = that._T2Scale;
            else return

            const diagColor = (d, ucl) => d > ucl ? vm.labelColors[0] : vm.labelColors[1];
            Group.selectAll(`.${type}_diagnosis_value`)
              .data(d => d)
              .enter()
              .append('rect')
              .attr('class', `${type}_diagnosis_value`)
              .attr('id', d => `${type}_diagnosis_value_` + d.upid)
              .attr('transform', (d, i) => {
                return `translate(${[
                type === 'Q' ? -Scale[d.index](d[type]) + that._moni_rect_w/2-5 : that._moni_rect_w/2 + 5, 
                that._y(d.endtime)]})`
              })
              .attr('width', d => Scale[d.index](d[type]))
              .attr('height', d => {
                let h = that._y(d.nextendtime) - that._y(d.endtime);
                return h < 0 ? 3 : h;
              })
              .attr('fill', d => diagColor(d[type], d[type+'_UCL']))
              .attr('stroke', d => d3.color(diagColor(d[type], d[type+'_UCL'])).darker(0.2))
              .attr('stroke-width', 1)
              .attr('opacity', 0.4)
            // 报警线
            Group
              .append('path')
              .attr('class', `${type}_Line`)
              .attr('transform', `translate(${[that._moni_rect_w/2 + (type === 'Q' ? 5 : -5), 0]})`)
              .attr("fill", 'none')
              .attr("stroke", "#666")
              .attr("stroke-width", 1)
              .attr("stroke-linejoin", "round")
              .attr("stroke-dasharray", "3 3")
              .attr("stroke-linecap", "round")
              .attr("d", (d, i) => {
                let line_data = [];
                for (let j = 0; j < d.length; j++) {
                  let h = that._y(d[j].nextendtime) - that._y(d[j].endtime);
                  let e = that._y(d[j].endtime);
                  let line_x = Scale[d[j].index](d[j][type+'_UCL']) * (type === 'Q' ? 1 : -1);
                  line_data.push({
                    line_x: line_x,
                    line_y: e
                  })
                  line_data.push({
                    line_x: line_x,
                    line_y: e + (h < 0 ? 3 : h)
                  })
                }
                return d3.line()
                  .x(e => e.line_x)
                  .y(e => e.line_y)(line_data)
              })
          }
        }
        _renderMonitorContent_1() {
          const that = this;
          let process = ['Heat', 'Roll', 'Cool'];
          
          let monitorDiagGroup = this._moni_g.append('g')
            .attr('class', 'monitorDiagGroup');
          
          let monitorBatch = monitorDiagGroup.selectAll('monitorBatch')
            .data(this._mergeresult_1)
            .enter()
            .append('g')
            .attr('class', 'monitorBatch')
            .attr('id', d => `monitorBatch${d.batch_index}`)

          this._renderMonitorSPE_T2(monitorBatch);  // 绘制T2 SPE块

          // 监控块
          if (!this._is_merge) return
          this._renderMonitorBlock(monitorBatch); // 绘制每个工序的遮盖块
        }
        _renderMonitorSPE_T2(monitorBatch) {
          const that = this;
          let process = ['Heat', 'Roll', 'Cool'];

          let monitorProcess = monitorBatch.selectAll('.monitorProcess')
              .data(datum => datum.new_diagData.diag_data)
              .enter()
              .append('g')
            .selectAll('.monitorProcess')
              .data(d => d)
              .enter()
              .append('g')
              .attr('class', 'monitorProcess')
              .attr('id', (d, i) => 'monitorProcess_' + process[i])
              .attr('transform', (d, i) => `translate(${(this._moni_rect_w + 10) * i}, 0)`)
            paintDiagnosis(monitorProcess, 'Q');
            paintDiagnosis(monitorProcess, 'T2');


          function paintDiagnosis(Group, type) {
            let Scale;
            if (type === 'Q') Scale = that._QScale;
            else if (type === 'T2') Scale = that._T2Scale;
            else return

            // console.log(type)

            const diagColor = (d, ucl) => {
              // console.log(d > ucl, d, ucl)
              return d > ucl ? vm.labelColors[0] : vm.labelColors[1];
            }
            Group.selectAll(`.${type}_diagnosis_value`)
              .data(d => d)
              .enter()
              .append('g')
            .selectAll(`.what_ever_something`)
            .data(d => d)
              .enter()
              .append('rect')
              .attr('class', `${type}_diagnosis_value`)
              .attr('id', d => `${type}_diagnosis_value_` + d.upid)
              .attr('plotData', d => ' ' + d[type] + ' ' + d[type+'_UCL'])
              .attr('transform', (d, i) => {
                return `translate(${[
                type === 'Q' ? -Scale[d.index](d[type]) + that._moni_rect_w/2-5 : that._moni_rect_w/2 + 5, 
                that._y(d.endtime)]})`
              })
              .attr('width', d => Scale[d.index](d[type]))
              .attr('height', d => {
                let h = that._y(d.nextendtime) - that._y(d.endtime);
                return h < 0 ? 3 : h;
              })
              .attr('fill', d => diagColor(d[type], d[type+'_UCL']))
              .attr('stroke', d => d3.color(diagColor(d[type], d[type+'_UCL'])).darker(0.2))
              .attr('stroke-width', 1)
              .attr('opacity', 0.4)
            
            // 报警线
            Group.selectAll('.what_ever_something')
            .data(d => d)
              .enter()
              .append('path')
              .attr('class', `${type}_Line`)
              .attr('transform', `translate(${[that._moni_rect_w/2 + (type === 'Q' ? 5 : -5), 0]})`)
              .attr("fill", 'none')
              .attr("stroke", "#666")
              .attr("stroke-width", 1)
              .attr("stroke-linejoin", "round")
              .attr("stroke-dasharray", "3 3")
              .attr("stroke-linecap", "round")
              .attr("d", (d, i) => {
                let line_data = [];
                for (let j = 0; j < d.length; j++) {
                  let h = that._y(d[j].nextendtime) - that._y(d[j].endtime);
                  let e = that._y(d[j].endtime);
                  let line_x = Scale[d[j].index](d[j][type+'_UCL']) * (type === 'Q' ? 1 : -1);
                  line_data.push({
                    line_x: line_x,
                    line_y: e
                  })
                  line_data.push({
                    line_x: line_x,
                    line_y: e + (h < 0 ? 3 : h)
                  })
                }
                return d3.line()
                  .x(e => e.line_x)
                  .y(e => e.line_y)(line_data)
              })
          }
        }
        _renderMonitorBlock(monitorBatch) {
          const that = this;
          let process = ['Heat', 'Roll', 'Cool'];

          monitorBatch
          // .selectAll('.monitor_batch')
          //   .data(datum => datum)
          //   .enter()
            .append('rect')
            .attr('class', 'monitor_batch')
            .attr('id', d => 'monitor_batch_' + d.new_diagData.batch_index)
            .attr('transform', d => `translate(${[0, this._y(d.new_diagData.batch_s)]})`)
            .attr('width', 360 + 20)
            .attr('height', d => this._y(d.new_diagData.batch_e) - this._y(d.new_diagData.batch_s) + 3)
            .attr('fill', 'white')


          let monitorMergeBlock = monitorBatch.selectAll('.monitorMergeBlock')
            .data(datum => datum.new_diagData.diag_area)
            .enter()
            .append('g')
            .attr('class', 'mergeIndex')
          // .selectAll('.monitorMergeBlock')
          //   .data(d => d)
          //   .enter()
          //   .append('g')
          //   .attr('class', 'monitorMergeBlock')
          //   .attr('id', (d, i) => 'monitorMergeBlock_' + process[i])
          //   .attr('transform', (d, i) => `translate(${(this._moni_rect_w + 10) * i}, 0)`)
          monitorMergeBlock.selectAll('.monitor_diagnosis_block')
            .data(d => d)
            .enter()
            .append('g')
            .call(g => {
              g.append('rect')
                .attr('class', d => `monitor_diagnosis_block_bgc monitor_diagnosis_block_bgc_${d.merge_index}`)
                .attr('transform', (d, i) => `translate(${[
                  (this._moni_rect_w + 10) * d.process_index,
                  this._y(d.date_exit_s)
                ]})`)
                .attr('width', this._moni_rect_w)
                .attr('height', d => this._y(d.date_exit_e) - this._y(d.date_exit_s))
                .attr('percent', d => d.percent)
                .attr('fill', "white")
                .attr('stroke', "white")
                .attr('stroke-width', 2)
            })
            .call(g => {
              g.append('rect')
                .attr('class', d => `monitor_diagnosis_block monitor_diagnosis_block_${d.merge_index}`)
                .attr('transform', (d, i) => `translate(${[
                  (this._moni_rect_w + 10) * d.process_index,
                  this._y(d.date_exit_s)
                ]})`)
                .attr('width', this._moni_rect_w)
                .attr('height', d => this._y(d.date_exit_e) - this._y(d.date_exit_s))
                .attr('percent', d => d.percent)
                .attr('fill', d => d.percent <= 0.2 ? "white" : this._colorScale(d.percent))
                .attr('stroke', d => d.percent <= 0.2 ? "white" : d3.color(this._colorScale(d.percent)).darker(0.2))
                .attr('stroke-width', 2)
            })
            .on('mouseenter', function (e, d) {
              let merge_index = d.merge_index;
              let __data__ = d3.select(this)._groups[0][0].parentNode.parentNode.__data__;
              let batch_index = __data__.batch_index;
              // console.log("原始数据：", __data__)
              // console.log(batch_index, merge_index)

              let selected_plates = merge_index !== -1
                ? __data__.merge_data[merge_index].mergeItem
                : __data__.cannot_merge[0].merge_data;
              
              // console.log("选中的钢板：", selected_plates)

              that._setMergeRect([batch_index], [merge_index]);
              that._setMoniBlock(batch_index, [merge_index]);
              that._emitToScatter(selected_plates, 0);
              that._setMergeBin(selected_plates);
              that._setIconPlate(selected_plates.map(d => d.upid));

              if (merge_index === -1) {
                let link_rect = __data__.one_batch_info.slice(-1)[0].link_rect.map(e => '_' + e.name);
                // console.log('连接线数据：', link_rect)

                that._setLinkLine([batch_index], link_rect);
                for (let upid of selected_plates.map(d => d.upid)) {
                  that.__setMareyLine(upid);
                  that._setMoniPlates(upid);
                }
              }
            })
            .on('mouseleave', function (e, d) {
              let merge_index = d.merge_index;
              let __data__ = d3.select(this)._groups[0][0].parentNode.parentNode.__data__;
              let batch_index = __data__.batch_index;

              let selected_plates = merge_index !== -1
                ? __data__.merge_data[merge_index].mergeItem
                : __data__.cannot_merge[0].merge_data;

              that._resetMergeRect();
              that._resetMoniBlock(batch_index, [merge_index]);
              that._resetLinkLine();
              that._emitToScatter(selected_plates, 1);
              that._resetMergeBin();
              that._resetIconPlate();
              

              if (merge_index === -1) {
                for (let upid of selected_plates.map(d => d.upid)) {
                  that.__resetMareyLine(upid);
                  that._resetMoniPlates(upid);
                }
              }
              
              that._keepClickedStatus();
            })
        }

        // 交互事件, 改变各图元的样式
        _reduceOpacity() {
          this._marey_g.selectAll('.mergeG')
            .attr('opacity', 0.4);
          this._marey_g.selectAll('.mareyLine')
            .attr('opacity', 0.4);
        }
        _raiseOpacity() {
          this._marey_g.selectAll('.mergeG')
            .attr('opacity', 1);
          this._marey_g.selectAll('.mareyLine')
            .attr('opacity', 1);
          
          this._marey_g.selectAll('.mergeG')
            .selectAll('.mergerect')
            .attr('stroke', 'none')
            .attr('stroke-width', 0)
        }
        _setMergeRect(batch_index_list, merge_index_list) {
          this._reduceOpacity();

          for (let batch_index of batch_index_list) {
            for (let merge_index of merge_index_list) {
              this._marey_g.select(`#batchG${batch_index} #mergeG${merge_index}`)
                .attr('opacity', 1);

              this._marey_g.select(`#batchG${batch_index} #mergeG${merge_index} .mergerect`)
                .attr('stroke', d => d3.color(d[0].pathColor).darker(0.5))
                .attr('stroke-width', 3);
            }
          }

          this._setLinkLine(batch_index_list, merge_index_list);
        }
        _resetMergeRect() {
          this._raiseOpacity();
          this._resetLinkLine();
        }
        _setLinkLine(batch_index_list, merge_index_list) {
          this._info_g.selectAll('.linkRectLine')
            .attr('opacity', 0.2);
          this._info_g.selectAll('.linkRectSourceNode')
            .attr('opacity', 0.4);
          this._info_g.selectAll('.linkRectTargetNode')
            .attr('opacity', 0.5);
          this._info_g.selectAll('.linkRectMergeBatch')
            .attr('opacity', 0.4);
          this._info_g.selectAll('.linkRectMergeItem')
            .attr('opacity', 0.4);

          for (let batch_index of batch_index_list) {
            this._info_g.select(`#linkRectMerge${batch_index} #linkRectMergeBatch${batch_index}`)
              .attr('opacity', 1);

            for (let merge_index of merge_index_list) {
              this._info_g.selectAll(`#linkRectMerge${batch_index} .linkRectLine${merge_index}`)
                .attr('opacity', 0.5);
              this._info_g.selectAll(`#linkRectMerge${batch_index} .linkRectSourceNode${merge_index}`)
                .attr('opacity', 1);
              this._info_g.selectAll(`#linkRectMerge${batch_index} .linkRectTargetNode${merge_index}`)
                .attr('opacity', 1);
              this._info_g.select(`#linkRectMerge${batch_index} #linkRectMergeItem${merge_index}`)
                .attr('opacity', 1);
            }
          }
        }
        _resetLinkLine() {
          this._info_g.selectAll('.linkRectLine')
            .attr('opacity', 0.5);
          this._info_g.selectAll('.linkRectSourceNode')
            .attr('opacity', 1);
          this._info_g.selectAll('.linkRectTargetNode')
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
          
          this._info_g.select(`#oneBatchChartGroup${batch_index} #chartGroup_${info_index} .lineRect`)
            .attr('stroke', d => d3.color(d.pathColor).darker(0.5))
            .attr('stroke-width', 3)
        }
        _resetInfoDetail() {
          this._info_g.selectAll('.chartGroup')
            .attr('opacity', 1);
          
          this._info_g.selectAll(`.lineRect`)
            .attr('stroke', d => d.pathColor)
            .attr('stroke-width', 2)
        }
        __getSelectPlate(batch_index_list, merge_index_list) {
          let selected_plates = [];
          for (let batch_index of batch_index_list) {
            let current_batch = this._mergeresult_1[batch_index];
            for (let merge_index of merge_index_list) {
              let current_merge = current_batch.merge_data[merge_index];
              if (current_merge) {
                selected_plates.push(current_merge.mergeItem);
              }
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
        _trainClickHandle(id) {
          const batch_index = id[0], info_index = id[1];
          let batch_all_upid = [];
          let batch_date_s = [], batch_date_e = [];

          // // 简单粗暴，但是并不是这样取。。。。
          // let mergeData;
          // let mergeSelect;
          // let data_len = this._mergeresult_1.length;
          // if (data_len >= 5) {
          //   if (batch_index <= 2) {
          //     mergeData = this._mergeresult_1.slice(0, 5)
          //       .map(d => d['merge_data'].map(e => e['mergeItem']).flat());
          //     mergeSelect = this._mergeresult_1.slice(0, 5)
          //       .map(d => d['merge_data'].map(e => e['mergeSelect']).flat());
          //   }
          //   else if (batch_index > data_len-3) {
          //     mergeData = this._mergeresult_1.slice(-6)
          //       .map(d => d['merge_data'].map(e => e['mergeItem']).flat());
          //     mergeSelect = this._mergeresult_1.slice(-6)
          //       .map(d => d['merge_data'].map(e => e['mergeSelect']).flat());
          //   }
          //   else {
          //     mergeData = this._mergeresult_1.slice(batch_index-2, batch_index+3)
          //       .map(d => d['merge_data'].map(e => e['mergeItem']).flat());
          //     mergeSelect = this._mergeresult_1.slice(batch_index-2, batch_index+3)
          //       .map(d => d['merge_data'].map(e => e['mergeSelect']).flat());
          //   }
          // } else if (data_len>=3 && data_len<=4) {
          //   mergeData = this._mergeresult_1.slice(0, 3)
          //     .map(d => d['merge_data'].map(e => e['mergeItem']).flat());
          //   mergeSelect = this._mergeresult_1.slice(0, 3)
          //     .map(d => d['merge_data'].map(e => e['mergeSelect']).flat());
          // }
          // else {
          //   return
          // }
          // console.log(mergeData);


          let [mergeData, mergeSelect, relevantDate] = this.__selectDataBlockForDiag(batch_index, info_index);
          // console.log(mergeData);
          // console.log(mergeSelect);
          // console.log("关联时间：", relevantDate)

          if (mergeData.length === 0) {
            vm.getNotification("批次数据计算失败，无法获得诊断时间区间！")
            return;
          }



          mergeData.forEach(d => {
            batch_all_upid.push(d.map(e => e.upid));
            batch_date_s.push(d[0].stops[0].time);
            batch_date_e.push(d.slice(-1)[0].stops[0].time);
          });

          // console.log(batch_all_upid);
          // console.log(batch_date_s);
          // console.log(batch_date_e);

          vm.$emit("trainClick", {
            list: this._trainSelectedList, 
            color: this._trainGroupStyle(mergeSelect.flat().slice(-1)[0]), 
            upidSelect: [
              ...mergeData.flat().filter(d => d.flag === 0).map(d => d.upid), 
              ...mergeSelect.flat().map(d => d.upid)
            ],
            type: "group", 
            batch: batch_all_upid,
            date_s: batch_date_s,
            date_e: batch_date_e,
            relevantDate: relevantDate
          })
        }
        __selectDataBlockForDiag(batch_index, info_index) {
          const DIAG_NUM = 5;
          const CANNOT_THRESHOLD = 5;   // 不能合并的板的阈值
          const N = this._mergeresult_1.length;
          let mergeData = [];
          let mergeSelect = [];

          let curr_batch = this._mergeresult_1[batch_index];
          let merge_index = curr_batch.one_batch_info[info_index].link_rect.map(d => d.merge_index)
          
          // console.log(curr_batch, merge_index)
          let date1, date2;
          if (merge_index.some(d => d !== -1)) {
            date1 = curr_batch.merge_data[merge_index[0]].date_entry_s;
            date2 = curr_batch.merge_data[merge_index.slice(-1)[0]].date_entry_e;
          } else {
            let cannot = curr_batch.cannot_merge;
            date1 = cannot[0].date_entry_s;
            date2 = cannot.slice(-1)[0].date_entry_e;
          }
          
          if (merge_index.length >= DIAG_NUM) {   // 最理想的情况: 所连接的合并块 >= 5, 可以直接取
            for (const i of merge_index.slice(0, DIAG_NUM)) {
              mergeData.push(curr_batch.merge_data[i].mergeItem);
              mergeSelect.push(curr_batch.merge_data[i].mergeSelect);
            }
          }
          else if (merge_index.length < DIAG_NUM) {
            let cannot_len = curr_batch.cannot_merge.map(d => d.merge_data).filter(d => d.length >= CANNOT_THRESHOLD);
            if (curr_batch.merge_data.length + cannot_len.length >= DIAG_NUM) { // 也能在当前批次直接取,
              __selectCurrentBatchData(curr_batch, mergeData, mergeSelect);
            }
            else {  // 要到隔壁批次取数据 (T_T)
              // vm.getNotification("要到隔壁取数据 (T_T)| ")
              // 先取了自己的
              __selectCurrentBatchData(curr_batch, mergeData, mergeSelect);
              
              if (batch_index === 0) {  // 点到的是第1个批次
                let batch_point = batch_index;
                while (mergeData.length < 5 && batch_point < N) {
                  let temp = this._mergeresult_1[++batch_point];
                  if (!temp) break;
                  __selectCurrentBatchData(temp, mergeData, mergeSelect);
                }
              } else {
                let batch_point = batch_index;
                while (mergeData.length < 5 && batch_point >= 0) {
                  let temp = this._mergeresult_1[--batch_point];
                  if (!temp) break;
                  __selectCurrentBatchData(temp, mergeData, mergeSelect);
                }
                batch_point = batch_index;
                while (mergeData.length < 5 && batch_point < N) {
                  let temp = this._mergeresult_1[++batch_point];
                  if (!temp) break;
                  __selectCurrentBatchData(temp, mergeData, mergeSelect);
                }
              }
            }
          }
          else {
            vm.getNotification("发生了肾么事？！")
          }

          // 选择一个批次内所有能拿去诊断的数据块（在这里可以写数量不够的板怎么合到合并块中去的逻辑）
          function __selectCurrentBatchData(curr_batch, mergeData, mergeSelect) {
            for (const item of curr_batch.merge_data) {
              if (mergeData.length >= DIAG_NUM) return;
              mergeData.push(item.mergeItem);
              mergeSelect.push(item.mergeSelect);
            }
            
            for (const data of curr_batch.cannot_merge) {
              if (mergeData.length >= DIAG_NUM) return;
              if (data.merge_data.length >= CANNOT_THRESHOLD) {
                mergeData.push(data.merge_data);
              }
            }
          }

          const sortHandle = (a, b) => new Date(a[0].stops[0].time).getTime() - new Date(b[0].stops[0].time).getTime();
          mergeData.sort(sortHandle);
          mergeSelect.sort(sortHandle);

          return [mergeData, mergeSelect, [date1, date2]];
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
              this._setMoniBlock(batch_index, merge_index_list)
            }
          }
          // if (vm.activatePlate.activate) {
          //   this.KeepAlivePlate();
          // }
        }
        _setNoMergeInfoArc(batch_index, upid) {
          const batchGroup = this._info_g.select(`#oneBatchChartGroup${batch_index}`);
          batchGroup.selectAll('.per_plate_fill')
            .attr('opacity', 0.2)
          batchGroup.select(`#per_plate_fill_${upid}`)
            .attr('opacity', 1)
        }
        _resetNoMergeInfoArc(batch_index) {
          const batchGroup = this._info_g.select(`#oneBatchChartGroup${batch_index}`);
          batchGroup.selectAll('.per_plate_fill')
            .attr('opacity', 1)
        }
        __setMareyLine(uclid) {
          d3.select('#id' + uclid)
            .attr('opacity', 1)
            .attr('stroke-width', this._highLightStrokeWidth)
            .selectAll('rect')
            .attr('stroke', 'black');
        }
        __resetMareyLine(uclid) {
          d3.select('#id' + uclid)
            .attr('stroke-width', d => { return this._defaultStrokeWidth(d.tgtplatethickness2) })
            .selectAll('rect')
            .attr('stroke', 'none');
        }
        _setMoniBlock(batch_index, merge_index_list) {
          let moniBatch = this._moni_g.select('#monitorBatch' + batch_index)

          moniBatch.select('#monitor_batch_' + batch_index)
            .attr('opacity', 0)
          this._moni_g.selectAll('.monitor_diagnosis_block')
            .attr('opacity', 0.2)

          for (let i of merge_index_list) {
            moniBatch.selectAll('.monitor_diagnosis_block_' + i)
              .attr('opacity', 1)
              .attr('fill', 'none')
              .attr('stroke', d => d3.color(this._colorScale(d.percent)).darker(0.3))
              .attr('stroke-width', 3)
            moniBatch.selectAll('.monitor_diagnosis_block_bgc_' + i)
              .attr('opacity', 0)
          }
        }
        _resetMoniBlock(batch_index, merge_index_list) {
          let moniBatch = this._moni_g.select('#monitorBatch' + batch_index)
          
          moniBatch.select('#monitor_batch_' + batch_index)
            .attr('opacity', 1)
          this._moni_g.selectAll('.monitor_diagnosis_block')
            .attr('opacity', 1)

          for (let i of merge_index_list) {
            moniBatch.selectAll('.monitor_diagnosis_block_' + i)
              .attr('fill', d => d.percent <= 0.2 ? "white" : this._colorScale(d.percent))
              .attr('stroke', d => d.percent <= 0.2 ? "white" : d3.color(this._colorScale(d.percent)).darker(0.2))
              .attr('stroke-width', 2)
            moniBatch.selectAll('.monitor_diagnosis_block_bgc_' + i)
              .attr('opacity', 1)
          }
        }
        _setMoniPlates(upid) {
          const diagColor = (d, ucl) => d > ucl ? vm.labelColors[0] : vm.labelColors[1];
          this._moni_g.selectAll('#Q_diagnosis_value_' + upid)
            .attr('fill', d => d3.color(diagColor(d['Q'], d['Q_UCL'])).darker(0.2))
            .attr('stroke', d => d3.color(diagColor(d['Q'], d['Q_UCL'])).darker(1))
            .attr('stroke-width', 2)
          this._moni_g.selectAll('#T2_diagnosis_value_' + upid)
            .attr('fill', d => d3.color(diagColor(d['T2'], d['T2_UCL'])).darker(0.2))
            .attr('stroke', d => d3.color(diagColor(d['T2'], d['T2_UCL'])).darker(1))
            .attr('stroke-width', 2)
        }
        _resetMoniPlates(upid) {
          const diagColor = (d, ucl) => d > ucl ? vm.labelColors[0] : vm.labelColors[1];
          this._moni_g.selectAll('#Q_diagnosis_value_' + upid)
            .attr('fill', d => diagColor(d['Q'], d['Q_UCL']))
            .attr('stroke', d => d3.color(diagColor(d['Q'], d['Q_UCL'])).darker(0.2))
            .attr('stroke-width', 1)
          this._moni_g.selectAll('#T2_diagnosis_value_' + upid)
            .attr('fill', d => diagColor(d['T2'], d['T2_UCL']))
            .attr('stroke', d => d3.color(diagColor(d['T2'], d['T2_UCL'])).darker(0.2))
            .attr('stroke-width', 1)
        }
        _reduceIconOpacity() {
          this._marey_g.selectAll('.iconLinkGroup')
            .attr('opacity', 0.4);
          this._marey_g.selectAll('.eventIcon')
            .attr('opacity', 0.4);
          
          this._marey_g.selectAll('.ACCEventIcon')
            .attr('opacity', 0.4);
          this._marey_g.selectAll('.DQEventIcon')
            .attr('opacity', 0.4);
          this._marey_g.selectAll('.FmTotalEventIcon')
            .attr('opacity', 0.4);
        }
        _raiseIconOpacity() {
          this._marey_g.selectAll('.iconLinkGroup')
            .attr('opacity', 1);
          this._marey_g.selectAll('.eventIcon')
            .attr('opacity', 1);

          this._marey_g.selectAll('.ACCEventIcon')
            .attr('opacity', 1);
          this._marey_g.selectAll('.DQEventIcon')
            .attr('opacity', 1);
          this._marey_g.selectAll('.FmTotalEventIcon')
            .attr('opacity', 1);
        }
        _setIconPlate(upids) {
          this._reduceIconOpacity();
          for (let upid of upids) {
            this._marey_g.selectAll('#iconLinkGroup' + upid)
              .attr('opacity', 1);
            this._marey_g.selectAll('#eventIcon_' + upid)
              .attr('opacity', 1);
            
            this._marey_g.selectAll('#ACCEventIcon_' + upid)
              .attr('opacity', 1);
            this._marey_g.selectAll('#DQEventIcon_' + upid)
              .attr('opacity', 1);
            this._marey_g.selectAll('#FmTotalEventIcon_' + upid)
              .attr('opacity', 1);
          }
        }
        _resetIconPlate() {
          this._raiseIconOpacity();
        }
        // _reduceAllIconPlates() {
        //   this._marey_g.selectAll('.iconLinkGroup')
        //     .attr('opacity', 1);
        //   this._marey_g.selectAll('#eventIcon_' + upid)
        //     .attr('opacity', 1);
        // }
        _setStationLine(index) {
          let color = vm.processColor;

          this._marey_g.selectAll(`.polygon_${index}`)
            .attr('stroke', d3.color(index < 6 ? color[0] : index < 14 ? color[1] : color[2]).darker(0.2))
            .attr('stroke-width', 2.5)
          this._marey_g.selectAll(`.station_${index}`)
            .attr('font-weight', 'bold')
          this._marey_g.selectAll(`.mline${index}`)
            .attr('stroke-width', 2.5)
        }
        _resetStationLine(index) {
          let color = vm.processColor;

          this._marey_g.selectAll(`.polygon_${index}`)
            // .attr('fill', index < 6 ? color[0] : index < 14 ? color[1] : color[2])
            .attr('stroke', 'none')
            .attr('stroke-width', 0)
          this._marey_g.selectAll(`.station_${index}`)
            .attr('font-weight', 'normal')
          this._marey_g.selectAll(`.mline${index}`)
            .attr('stroke-width', 0.5)
        }

        // 整图过渡动画
        _mareyChartTranslate() {
          this._translateMareyLine();

          this._translateInfoChart();

          this._translateMonitorChart();

          this._translateEventIcon();
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
          this._marey_g.selectAll('.mareyTooltipCell')
            .attr('d', (d, i) => this._voronoi.renderCell(i))

          if (vm.activatePlate.activate) {
            let plate = this._timesDataMap.get(vm.activatePlate.upid);

            let mareyLineTooltip = this._marey_g.select('#activateMareyLineTooltip');
            if (!mareyLineTooltip._groups[0][0]) return;  // 如果没有这个元素，不brush

            mareyLineTooltip.transition(line_tran);

            let tooltipGroup = mareyLineTooltip.selectAll('.tooltipGroup')
            let text = tooltipGroup.select('.tooltipContent');
            let box = text.node().getBBox();
            tooltipGroup
              .attr('transform', `translate(${[
                this._x(plate.stops[3].station.distance) - box.width / 2,
                this._y(new Date(plate.stops[3].time)) + 37
              ]})`);
            mareyLineTooltip.selectAll('#tooltipLine_' + plate.upid)
              .attr('transform', `translate(0, ${this._y(new Date(plate.stops[0].time))})`)
              .attr('d', this._line(plate.stops))
            
            this._marey_g.select('#mergeBlockTooltip').raise();
            this._marey_g.select('#mareyLineTooltip').raise();
            this._marey_g.select('.stationsNameGroup').raise();
            this._marey_g.select('.statisticsInfoGroupGroup').raise();
            this._marey_g.selectAll('.diagnosisTextGroupGroup').raise();
          }
        }
        _translateInfoChart() {
          let that = this;
          let line_tran = d3.transition()
            .delay(50)
            .duration(500);

          let linkRectMerge = this._info_g.selectAll('.linkRectMerge')
            .transition(line_tran);
          linkRectMerge.selectAll('.linkRectMergeBatch')
            .attr("transform", d => `translate(${[this._info_size.w - 8, this._y(d.batch_s)]})`)
            .attr("y2", d => this._y(d.batch_e)- this._y(d.batch_s))
          linkRectMerge.selectAll('.linkRectMergeItem')
            .attr("transform", d => `translate(${[this._info_size.w - 12, this._y(d.date_entry_s)]})`)
            .attr("y2", d => this._y(d.date_entry_e) - this._y(d.date_entry_s))
          linkRectMerge.selectAll('.linkRectMergeItem')
            .attr("transform", d => `translate(${[this._info_size.w - 12, this._y(d.date_entry_s)]})`)
            .attr("y2", d => this._y(d.date_entry_e) - this._y(d.date_entry_s))
          
          let oneBatchChartGroup = this._info_g.selectAll('.oneBatchChartGroup')
            .transition(line_tran);
          let position_data = [];
          oneBatchChartGroup
            .attr('transform', (d, i) => {
              let pos = this._getDetailPosition(position_data, d)
              
              return `translate(${[pos[0], pos[1]]})`
            })

          // let link_path = d => {
          //   let pathHeight = this._y(d.date_entry_e) - this._y(d.date_entry_s);
          //   let target_x = this._info_size.w - 12;
          //   let target_y = this._y(d.date_entry_s) + pathHeight/2;
          //   let pos = this._getLinkPosition(position_data, d);
          //   let source_x = pos[0];
          //   let source_y = pos[1]+this._detail_rect_w/2;

          //   if (source_y < -pathHeight * 0.5) {
          //     return d3.linkHorizontal()({
          //       source: [target_x, target_y],
          //       target: [target_x, target_y]
          //     })
          //   } else {
          //     return d3.linkHorizontal()({
          //       source: [source_x, source_y],
          //       target: [target_x, target_y]
          //     })
          //   }
          // }

          // 改为桑基图
          const computeSourceTarget = d => {
            const sankeyPadding = 5;
            let mergeWidth = this._y(d.parent.date_entry_e) - this._y(d.parent.date_entry_s);
            let batchWidth = this._y(d.parent.batch_e) - this._y(d.parent.batch_s);
            // console.log(d)
            // console.log(mergeWidth, batchWidth)
            
            let prevHeight = 0;
            let prevTimes = d.flagName === 'good' ? 0 : d.flagName === 'bad' ? 1 : 2;
            for (let i = 0; i < prevTimes; i++) {
              if (d.targetArr[i] === 0) continue;
              prevHeight += this._sankeyScale(d.targetArr[i]) + sankeyPadding;
            }
            let targetAllWidth = this._sankeyScale(d3.sum(d.targetArr.flat()));
            let width = this._sankeyScale(d.value);
            let targetLineCount = d.targetArr.filter(e => e > 0).length;
            let targetStartPos = this._y(d.parent.date_entry_s) - targetAllWidth/2 - sankeyPadding * (targetLineCount - 1);
            let target_x = this._info_size.w - 12;
            let target_y = targetStartPos + prevHeight + width/2 + mergeWidth/2;

            let sourceAllWidth = this._sankeyScale(d3.sum(d.sourceArr.flat()));
            let allPrev = 0; // 已用的总宽度
            let allPrevTimes = d.flagName === 'good' ? 0 : d.flagName === 'bad' ? 1 : 2;
            for (let i = 0; i < allPrevTimes; i++) {
              if (d.sourceArr[i].every(e => e === 0)) continue;
              allPrev += this._sankeyScale(d3.sum(d.sourceArr[i])) + sankeyPadding;
            }
            let curPrev = 0;  // 当前flag前面已用的宽度
            for (let i = 0; i < d.link_i; i++) {
              curPrev += this._sankeyScale(d.sourceArr[allPrevTimes][i]);
            }

            let pos = this._getLinkPosition(position_data, d);
            // let sourceLineCount = d.sourceArr.flat().filter(e => e > 0).length;
            let sourceLineCount = d.sourceArr.filter(e => e.every(f => f !== 0)).length;
            let startPos = pos[1] + this._detail_rect_w/2 - sourceAllWidth/2 - sankeyPadding*(sourceLineCount - 1)/2;
            let source_x = pos[0];
            let source_y = startPos + allPrev + curPrev + width/2;

            return {
              source: [source_x, source_y],
              target: [target_x, target_y],
              sourceWidth: width,
              targetWidth: width,
              mergeWidth,
              batchWidth
            };
          }
          const link_path = d => {
            let {source, target, mergeWidth, batchWidth} = computeSourceTarget(d);
            let range = 0.5 * (this._stations_size.h + this._stations_size.gap);

            if (target[1] < range || source[1] < 0) {
              return d3.linkHorizontal()({ source: target, target: target });
            }
            else {
              return d3.linkHorizontal()({ source: source, target: target });
            }
            // return d3.linkHorizontal()({ source: source, target: target });
          };

          linkRectMerge.selectAll('.linkRectLine')
            .attr('d', link_path);
          linkRectMerge.selectAll('.linkRectSourceNode')
            .attr('transform', d => {
              let {source, sourceWidth} = computeSourceTarget(d);
              return `translate(${[source[0] - 2.5, source[1] - sourceWidth/2]})`
            })
            .attr('height', d => {
              let {sourceWidth} = computeSourceTarget(d);
              return sourceWidth
            });
          linkRectMerge.selectAll('.linkRectTargetNode')
            .attr('transform', d => {
              let {target, targetWidth} = computeSourceTarget(d);
              return `translate(${[target[0] - 3, target[1] - targetWidth/2]})`
            })
            .attr('height', d => {
              let {targetWidth} = computeSourceTarget(d);
              return targetWidth
            });
          
          const computeBGC = d => {
            let plates = d.link_rect.map(e => e.merge_data).flat();
            let arr = [
              plates.filter(e => e.flag === 1).length,
              plates.filter(e => e.flag === 0).length,
              plates.filter(e => e.flag === 404).length
            ];
            let spanNum = arr.filter(e => e !== 0).length - 1;

            return {
              height: this._sankeyScale(d3.sum(arr)) + spanNum * 5
            }
          }          
          this._info_g.selectAll('.linkRectSourceBGC')
            .attr('transform', d => {
              let { height } = computeBGC(d);
              let x = this._detail_rect_w - 4;
              let y = this._detail_rect_w/2 - height/2 - 10;
              return `translate(${[x, y]})`;
            })
            .attr('height', d => {
              let { height } = computeBGC(d);
              return height + 20;
            });
        }
        _getLinkPosition(position_data, data) {
          // let chart_x = this._coreX + this._rectWidth;
          // let chart_y;
          // let path_y0 = data.info_index*(this._detail_rect_w+this._detail_gap);

          // chart_y = position_data[data.batch_index][0] + path_y0;
          
          // return [chart_x, chart_y];

          // 改为桑基图
          let chart_x = this._coreX + this._rectWidth;
          let chart_y;
          let path_y0 = data.parent.info_index*(this._detail_rect_w+this._detail_gap);

          chart_y = position_data[data.parent.batch_index][0] + path_y0;
          
          return [chart_x, chart_y];
        }
        _getDetailPosition(position_data, data) {
          let chart_x = this._coreX - 1.8*65 + (this._info_bgc_w - this._detail_rect_w)/2 + 3;
          let chart_y;

          let path_y0 = this._y(data.batch_s);
          let path_y1 = this._y(data.batch_e);
          let path_height = path_y1 - path_y0;

          let visualRange = [
            0.5 * (this._stations_size.h + this._stations_size.gap),
            this._height + 200
          ];
          let judgmentPoint = path_y0 + path_height / 2;

          // 判断是否在屏幕显示范围内
          if (judgmentPoint >= visualRange[0] && judgmentPoint <= visualRange[1]) {
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
            
            // 如果批次中点达到了某个区域，强制固定批次状态图元
            if ( true
              // && chart_y >= 50
              // && chart_y <= 250
              && judgmentPoint > -0.5 * (this._stations_size.h + this._stations_size.gap)
              && judgmentPoint <  1.5 * (this._stations_size.h + this._stations_size.gap)
            ) {
              chart_y = 100
            }
          } else if (judgmentPoint < visualRange[0]) {
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
          const that = this;
          let tran = d3.transition()
            .delay(50)
            .duration(500);
          
          this._moni_g.selectAll('.monitor_batch')
            .attr('transform', d => `translate(${[0, this._y(d.new_diagData.batch_s)]})`)
            .attr('height', d => this._y(d.new_diagData.batch_e) - this._y(d.new_diagData.batch_s) + 3)

          this._moni_g.selectAll('.monitor_diagnosis_block')
            .transition(tran)
            .attr('transform', (d, i) => `translate(${[
              (this._moni_rect_w + 10) * d.process_index,
              this._y(d.date_exit_s)
            ]})`)
            .attr('height', d => this._y(d.date_exit_e) - this._y(d.date_exit_s) + 3)
          this._moni_g.selectAll('.monitor_diagnosis_block_bgc')
            .transition(tran)
            .attr('transform', (d, i) => `translate(${[
              (this._moni_rect_w + 10) * d.process_index,
              this._y(d.date_exit_s)
            ]})`)
            .attr('height', d => this._y(d.date_exit_e) - this._y(d.date_exit_s) + 3)

          transDiagnosis('Q');
          transDiagnosis('T2');


          function transDiagnosis(type) {
            let Scale;
            if (type === 'Q') Scale = that._QScale;
            else if (type === 'T2') Scale = that._T2Scale;
            else return

            that._moni_g.selectAll(`.${type}_diagnosis_value`)
              .transition(tran)
              .attr('transform', (d, i) => `translate(${[
                type === 'Q' ? -Scale[d.index](d[type]) + that._moni_rect_w/2-5 : that._moni_rect_w/2 + 5, 
                that._y(d.endtime)]})`)
              .attr('height', d => {
                let h = that._y(d.nextendtime) - that._y(d.endtime);
                return h < 0 ? 3 : h;
              })

            that._moni_g.selectAll(`.${type}_Line`)
              .transition(tran)
              .attr("d", (d, i) => {
                let line_data = [];
                for (let j = 0; j < d.length; j++) {
                  let h = that._y(d[j].nextendtime) - that._y(d[j].endtime);
                  let e = that._y(d[j].endtime);
                  let line_x = Scale[d[j].index](d[j][type+'_UCL']) * (type === 'Q' ? 1 : -1);
                  line_data.push({
                    line_x: line_x,
                    line_y: e
                  })
                  line_data.push({
                    line_x: line_x,
                    line_y: e + (h < 0 ? 3 : h)
                  })
                }
                return d3.line()
                  .x(e => e.line_x)
                  .y(e => e.line_y)(line_data)
              })
          }
        }
        _translateEventIcon() {
          let line_tran = d3.transition()
            .delay(50)
            .duration(500);
          
          const cx = 20;
          this._displayIconData = this.__computeIconData(cx, this._eventIconData);
          this._iconClickStatus = this.__iconClickStatus(this._displayIconData);
          this._displatyClickStatus = new Map();
          const mareyEventIconCroup = this._marey_g.select('.mareyEventIconCroup');
          mareyEventIconCroup.selectAll('.eventIcon')
            .transition(line_tran)
            .attr('transform', d => `translate(${[this._x(d.distance), this._y(new Date(d.time))]})`)
            .attr("display", (d, i) => {
              if (this._displayIconData.has(d.upid)) {
                return this._displayIconData.get(d.upid)[d.distance] ? null : 'none';
              } else {
                return 'none';
              }
            })
          // console.log('显示的图标：', this._displayIconData)
          // console.log('图标最大最小：', Array.from(this._displayIconData).map(
          //   d => d[1]
          // ))

          this._marey_g.selectAll('.iconLinkGroup')
            .attr('display', d => this._displayIconData.has(d) ? null : 'none')
          this._marey_g.selectAll('.iconLinkHorizontal')
            .transition(line_tran)
            .attr('d', d => {
              let source_x = this._x(d.curr_dis);
              let source_y = this._y(new Date(d.curr_t));
              let target_x = this._x(d.next_dis);
              let target_y = this._y(new Date(d.next_t));
              return d3.linkHorizontal()({
                source: [source_x, source_y],
                target: [target_x, target_y]
              })
            })

          this._accDisplay = this.__computeDisplayIcon(cx, this._allEventData.acc_event_change);
          this._marey_g.selectAll('.ACCEventIcon')
            .transition(line_tran)
            .attr('transform', d => `translate(${[this._x(d.distance), this._y(new Date(d.time))]})`)
            .attr('display', d => this._accDisplay.get(d.upid) ? null : 'none')
          
          this._dqDisplay = this.__computeDisplayIcon(cx, this._allEventData.dq_event_change);
          this._marey_g.selectAll('.DQEventIcon')
            .transition(line_tran)
            .attr('transform', d => `translate(${[this._x(d.distance), this._y(new Date(d.time))]})`)
            .attr('display', d => this._dqDisplay.get(d.upid) ? null : 'none')

          this._fmtotalDisplay = this.__computeDisplayIcon(cx, this._allEventData.fmtotal_acc_event_change);
          this._marey_g.selectAll('.FmTotalEventIcon')
            .transition(line_tran)
            .attr('transform', d => `translate(${[this._x(d.distance), this._y(new Date(d.time))]})`)
            .attr('display', d => this._fmtotalDisplay.get(d.upid) ? null : 'none')
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

        
        KeepAlivePlate() {
          if (vm.activatePlate.activate) {
            this.changePlateStatus(vm.activatePlate);
          }
        }
        // 外部调用的方法
        changePlateStatus({upid, activate=true} = {}) {
          let plate = this._timesDataMap.get(upid);
          if (!plate) return;

          if (activate) {
            // this._marey_g.select('#id' + upid)
            //   .attr('stroke-width', this._highLightStrokeWidth)
            
            let toopcolor = this._trainGroupStyle(plate);

            let ele = d3.select('#activateMareyLineTooltip')._groups[0][0];
            if (ele) return;  // 如果还存在，不继续画了
            
            const mareyLineTooltip = this._marey_g.append('g')
              .attr('id', 'activateMareyLineTooltip')
            
            // 画线
            mareyLineTooltip.append('path')
              .attr('class', 'tooltipLine')
              .attr('id', 'tooltipLine_' + plate.upid)
              .attr('transform', `translate(0, ${this._y(new Date(plate.stops[0].time))})`)
              .attr('stroke-width', this._highLightStrokeWidth)
              .attr('fill', 'none')
              .attr('stroke', this._trainGroupStyle(plate))
              .attr('d', this._line(plate.stops))

            // 画框
            let tooltip = mareyLineTooltip.append('g')
              .attr('class', 'tooltipGroup');
            let path = tooltip.append('path')
              .attr('class', 'tooltipContent')
              .attr('stroke', 'rgba(148, 167, 183, 0.4)')
              .attr('fill', 'white')
              
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
            tooltip
              .style('display', null)
              .attr('fill', toopcolor);
            
            let t_info = plate.toc.toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
            line1.text(`upid: ${plate.upid}`);
            line2.text(`steelspec: ${plate.steelspec}`);
            line3.text(`time: ${t_info}`);
            path
              .attr('stroke', toopcolor)
              
            const box = text.node().getBBox();
            path.attr('d', `
              M${box.x - 10},${box.y - 10}
              H${box.width / 2 - 5}l5,-15l5,15
              H${box.width + 10}
              v${box.height + 20}
              h-${box.width + 20}
              z
            `);
            tooltip.attr('transform', `translate(${this._x(plate.stops[3].station.distance) - box.width / 2}, ${this._y(new Date(plate.stops[3].time)) + 37})`);

            this._marey_g.select('#mergeBlockTooltip').raise();
            this._marey_g.select('#mareyLineTooltip').raise();
            this._marey_g.select('.statisticsInfoGroupGroup').raise();
            this._marey_g.selectAll('.diagnosisTextGroupGroup').raise();
          } else {
            // this._marey_g.select('#id' + upid)
            //   .attr('stroke-width', d => this._defaultStrokeWidth(d.tgtplatethickness2))
            
            let ele = this._marey_g.selectAll('#activateMareyLineTooltip');
            ele.remove()
          }
          
        }
      }

      vm.conditionView = new ConditionView(vm.svg);
      vm.conditionView
        .stateInit(vm.isMerge, vm.changecolor, vm.minrange, vm.minconflict)
        .dataInit(vm.timesdata, vm.stationsdata, vm.mergeresult, vm.monitordata, vm.eventIconData)
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
    },
    getNotification(notice){
			const h = this.$createElement;
			this.$notify({
				title: '消息通知',
				message: h('i', { style: 'color: teal'}, notice)
			});
			this.loadingDataLoading = false
		},
    changePlateStatus(opts) {
      this.activatePlate = opts;
      this.conditionView.changePlateStatus(opts);
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
