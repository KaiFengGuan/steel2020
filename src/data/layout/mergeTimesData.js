import * as d3 from "d3";

// 计算相邻两块板的生产节奏间隔，单位为分钟
function compute_tr(stop1, stop2) {
  if (stop1 === undefined || stop2 === undefined) return 0;

  let stop1_tr = new Date(stop1[5].time);
  let stop2_tr = new Date(stop2[5].time);
  return (stop2_tr.getTime() - stop1_tr.getTime())/60000;
}

// 判断是否满足合并条件
function can_merge(one_plate, condition) {
  return one_plate.steelspec === condition.steelspec ? true : false;
}

// 合并主逻辑
function merge_plates(one_batch, minrange, minconflict) {
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

  let dis_upper = [];
  let dis_lower = [];
  for (let i = 0; i < dis_matrix[0].length; i++) {
    dis_upper.push(d3.quantile(dis_matrix, 0.80, d => d[i]))
    dis_lower.push(d3.quantile(dis_matrix, 0.80, d => d[i]))
  }

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


export default function mergeTimesData(json, stations, minrange, minconflict) {
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

      if (Math.abs(time_diff - time_diff_init) > 20) break;

      batch_count += 1;
    }

    if (batch_count - i > minrange) {
      batch_plates.push(json.slice(i, batch_count))
    }
    i = batch_count;
  }

  // 对每个批次内的板进行合并  batch_plates.length
  let mergeresult = []
  for (let batch_index = 0; batch_index < batch_plates.length; batch_index++) {
    let one_batch = batch_plates[batch_index];

    let res = merge_plates(one_batch, minrange, minconflict);
    mergeresult.push(res);
    
  }

  return mergeresult;
}
