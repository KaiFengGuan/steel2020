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
  if (one_plate.steelspec === condition.steelspec // steelspec相等
    && one_plate.stops.length === condition.stops.length        // 工序长度相等
  ) {
    return true;
  }
  return false;
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
    let stops_len = 17 //a.stops.length
    for (let i = 0; i < stops_len; i++) {
      try {
        let a_t = new Date(a.stops[i].time);
        let b_t = new Date(b.stops[i].time);
        one_arr.push(b_t - a_t);
      } catch {
        one_arr.push(0);
      }
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
  /**
   *    TMD !!! 这里边界条件要想清楚，特别是合并/不合并的情况下最后一个怎么切.
   *    否则数据会出现重复的板
   */
  let merge_select = [];
  let merge_item = [];
  let merge_index = [];
  let cannot_merge = [];
  for (let i = 0; i < one_batch.length;) {
    let index = i + 1;
    let cannot_m = [];

    // 先过滤一堆不能合并的
    let prev_index = index - 1;
    while (one_batch[index] !== undefined 
      && !can_merge(one_batch[index], {
        steelspec: mergecategorys.indexOf(one_batch[prev_index].steelspec) === -1 ? "aaa" : one_batch[prev_index].steelspec,
        stops: one_batch[prev_index].stops})
    ) {
      prev_index += 1;
      index = prev_index + 1;
    }
    cannot_m = one_batch.slice(i, prev_index);  // !!!

    // 终于到了能合并的区域
    i = prev_index;
    let m_item = [];
    let m_select = [];
    while (one_batch[index] !== undefined 
      && dis_matrix[index - 1] !== undefined
      && can_merge(one_batch[index], {steelspec: one_batch[i].steelspec, stops: one_batch[i].stops}))    
    {
      let outrange = 0;

      for (let j = 0; j < one_batch[index].stops.length; j++) {
        dis_matrix[index - 1][j] > dis_upper[j]
        ? (dis_matrix[index - 1][j]-dis_upper[j])/dis_upper[j] > 1.1 && dis_upper[j] !== 0
        ? outrange += 5
        : outrange += 2
        : undefined;

        dis_matrix[index - 1][j] < 0 ? outrange += 20 : undefined;
      }

      if (outrange >= 15)  m_select.push(one_batch[index]);
      index += 1;     // !!!

      if (m_select.length > minconflict - 1) break;   // 超出容许数量，结束当前合并
    }
    m_item = one_batch.slice(i, index);   // !!!

    if (m_item.length >= minrange) {
      merge_item.push(m_item);
      merge_select.push(m_select);
      cannot_m.length > 0 ? cannot_merge.push(cannot_m) : undefined;
    } else {
      cannot_merge.push([...cannot_m, ...m_item]);
    }

    i = index;    // !!!
  }

  return {
    'merge_result': { 'merge': merge_item, 'select': merge_select},
    'cannot_merge': cannot_merge
  }
}


export default function mergeTimesData(json, stations, minrange, minconflict) {
  // 批次划分
  const BatchInterval = 20; // min
  let batch_plates = [];
  let plates_stops = json.map(d => d.stops);
  for (let i = 0; i < plates_stops.length;) {
    let batch_count = i + 1;
    // let time_diff_init = compute_tr(plates_stops[i], plates_stops[batch_count]);

    while (plates_stops[i] !== undefined 
      && plates_stops[batch_count] !== undefined
      // && plates_stops[i].length === plates_stops[batch_count].length
    ) {
      let time_diff = compute_tr(plates_stops[batch_count-1], plates_stops[batch_count]);

      if (Math.abs(time_diff) > BatchInterval) break;

      batch_count += 1;
    }

    // if (batch_count - i > minrange) {
    //   batch_plates.push(json.slice(i, batch_count))
    // }
    batch_plates.push(json.slice(i, batch_count));

    i = batch_count;
  }
  // console.log(batch_plates)
  // console.log(d3.sum(batch_plates.map(d => d.length)))

  // 对每个批次内的板进行合并  batch_plates.length
  let mergeresult = []
  for (let batch_index = 0; batch_index < batch_plates.length; batch_index++) {
    let one_batch = batch_plates[batch_index];

    let res = merge_plates(one_batch, minrange, minconflict);
    mergeresult.push(res);
    
  }
  // console.log(mergeresult)
  // console.log( mergeresult.map(d => [...d.cannot_merge.flat(), ...d.merge_result.merge.flat()].map(e => e.upid)) )
  // console.log( mergeresult.map(d => {
  //   let all = [...d.cannot_merge.flat(), ...d.merge_result.merge.flat()];
  //   let map = new Map();
  //   all.forEach(e => map.set(e.upid, e));
  //   return Array.from(map);
  // }) )

  return mergeresult;
}
