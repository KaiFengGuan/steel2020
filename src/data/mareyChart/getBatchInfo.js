import * as d3 from "d3";
import util from '../../views/baogang/util.js'

const labelColors = util.labelColor;
const noflagColor = util.noflagColor;

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
function __getPathColor(datalist) {
  let quality = d3.sort(d3.groups(datalist, d => d.flag), d=> d[1].length);
  let last_quality = quality.slice(-1);
  let pathColor = last_quality[0][0] !== 404 ? labelColors[last_quality[0][0]] : noflagColor;

  return pathColor;
}


export function getOneBatchInfo(
  key,
  batch_index_count,
  category_name,
  mergeItem, 
  mergeItem_flat, 
  stationsdata,
  labelStatistics, 
  extend, 
  cate_extend,
  tar_extent
) {
  let fu_arr = [], m_arr = [], c_arr = [], t_arr = [];
  let sub_arr = [];
  let stage_for_pre_plate = [];
  let targetKey = ["tgtplatelength2", "tgtwidth", "tgtplatethickness"];
  let targetDataArr = {};
  targetKey.forEach(key => targetDataArr[key] = []);

  for (let i in mergeItem_flat) {
    let item_data = mergeItem_flat[i];
    let item_data_stops = item_data.stops;
    let single_arr = [];
    let fu_time = item_data.fuTotalTimeAfter * 1000;
    let m_time = item_data.mtotalTime * 1000;
    let c_time = item_data.ccTotalTime * 1000;
    let pr_time = new Date(item_data_stops[5].time);
    fu_arr.push(fu_time);
    m_arr.push(m_time);
    c_arr.push(c_time);
    t_arr.push(pr_time); // 节奏指标：出炉时间
    stage_for_pre_plate.push({
      upid: item_data.upid,
      stage_angle: [fu_time / extend.fu[1], m_time / extend.m[1], c_time / extend.c[1]],
      // pr_angle: pr_time / t_extent[1],  // 节奏是两块板之间的出炉时间间隔，单块板不存在节奏？
      toc: new Date(item_data.toc)
    })

    for (let key of targetKey) {
      targetDataArr[key].push(item_data[key]);
    }

    for (let j in stationsdata.slice(0, -1)) {
      let stations_item = stationsdata[j];
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
  stage_for_pre_plate.sort((a, b) => a.toc - b.toc);
  t_arr = d3.pairs(t_arr, (a, b) => b - a);
  let fu_mean = d3.mean(fu_arr), fu_std = d3.deviation(fu_arr);
  let m_mean  = d3.mean(m_arr),  m_std = d3.deviation(m_arr);
  let c_mean  = d3.mean(c_arr),  c_std = d3.deviation(c_arr);
  let t_mean  = d3.mean(t_arr),  t_std = d3.deviation(t_arr);
  let fu_quantile = getQuantile(fu_arr).map(d => d/cate_extend.fu[1]);
  let m_quantile = getQuantile(m_arr).map(d => d/cate_extend.m[1]);
  let c_quantile = getQuantile(c_arr).map(d => d/cate_extend.c[1]);
  let t_quantile = getQuantile(t_arr).map(d => d/cate_extend.t[1]);

  let sub_mean = [], stage_sub_avg_angle = [], stage_sub_std_angle = [];
  for (let i = 0; i < 16; i++) {
    let a = [];
    sub_arr.forEach(d => a.push(d[i]));

    let m_a = d3.mean(a);
    let std_a = d3.deviation(a);
    sub_mean.push(m_a);
    stage_sub_avg_angle.push({
      stage_i: (i>=0&&i<=5) ? 0 : (i>=6&&i<=13) ? 1 : (i>=14&&i<=16) ? 2 : undefined,
      data: m_a/extend.sub[i][1]
    });
    stage_sub_std_angle.push({
      stage_i: (i>=0&&i<=5) ? 0 : (i>=6&&i<=13) ? 1 : (i>=14&&i<=16) ? 2 : undefined,
      data: std_a/extend.sub[i][1]
    });
  }
  let pr_angle = t_mean/extend.t[1]
  let pr_std_angle = t_std/extend.t[1]
  let stage_avg_angle = [fu_mean/extend.fu[1], m_mean/extend.m[1], c_mean/extend.c[1]]
  let stage_std_angle = [fu_std/extend.fu[1], m_std/extend.m[1], c_std/extend.c[1]]

  stage_sub_avg_angle = computeSubStageAngle(stage_sub_avg_angle);
  stage_sub_std_angle = computeSubStageAngle(stage_sub_std_angle);

  let link_info_list = [];
  for (let i = 0; i < mergeItem.length; i++) {
    let one_merge_item = mergeItem[i]
      .sort((a, b) => new Date(a.stops[0].time).getTime() - new Date(b.stops[0].time).getTime());
    let merge_color = __getPathColor(one_merge_item);

    link_info_list.push({
      name: category_name === "cannotMerge" ? category_name + i : category_name,
      info_index: key,
      batch_index: batch_index_count,
      merge_index: category_name === "cannotMerge" ? -1 : i,
      merge_data: one_merge_item,
      pathColor: merge_color === undefined ? 'red' : merge_color,
      batch_s: new Date(mergeItem[0][0].stops[0].time),
      batch_e: new Date(mergeItem.slice(-1)[0].slice(-1)[0].stops[0].time),
      date_entry_s: new Date(one_merge_item[0].stops[0].time),
      date_entry_e: new Date(one_merge_item[one_merge_item.length - 1].stops[0].time)
    })
  }

  let targetInfo = {};
  targetKey.forEach(key => {
    let m = d3.mean(targetDataArr[key]);
    let max = tar_extent[key][1];
    targetInfo[key] = [m / max, m];
  });

  let steelspecGroup = d3.groups(mergeItem_flat, d => d.steelspec)
    .sort((a, b) => a[1].length - b[1].length);
  let maxSteelspec = steelspecGroup.slice(-1)[0];
  let steelspecSuffix = (category_name === "cannotMerge" && steelspecGroup.length > 1) ? ', etc.' : '';

  // 角度数组含义：[平均值, 标准差]
  return {
    info_index: key,
    pathColor: __getPathColor(mergeItem_flat),
    steelspec: category_name,
    maxSteelspec: maxSteelspec[0] + steelspecSuffix,
    maxSteelspecColor: __getPathColor(maxSteelspec[1]),
    pr_angle: [pr_angle, pr_std_angle],
    pr_quantile: t_quantile,
    stage_angle: stage_avg_angle.map((d, i) => [d, stage_std_angle[i]]),
    stage_quantile: [fu_quantile,  m_quantile, c_quantile],
    stage_sub_angle: stage_sub_avg_angle.map((d, i) => [d, stage_sub_std_angle[i]]),
    stage_for_pre_plate: stage_for_pre_plate,
    link_rect: link_info_list,
    link_rect_data: mergeItem,
    label_statistics: [labelStatistics],
    targetInfo: targetInfo
  }
}