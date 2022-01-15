import * as d3 from 'd3'
import { time } from 'echarts';
import {convertTime} from '../../utils/index.js'

const OprationThreshold = 0.00100;  // 单位: m, 范围: -0.004m ~ 0.004m

function hasOperation(curr, next) {
  let curr_zp = curr.station.zeropoint ? curr.station.zeropoint : undefined;
  let next_zp = next.station.zeropoint ? next.station.zeropoint : undefined;

  if (curr_zp && next_zp) {
    let zp = curr_zp.map((d, i) => Math.abs(d - next_zp[i]));
    let m = d3.mean(curr_zp) - d3.mean(next_zp);
    return [zp.some(d => d >= OprationThreshold), m];
  }

  return [false, 0];
}

export function filterMareyChartEventIcon(timesData) {
  const N = timesData.length;

  let eventIconData = []
  for (let i = 0; i < N - 1; i++) {
    let curr_item = timesData[i];
    let next_item = timesData[i + 1];
    let curr_rmF3 = curr_item.stops[7];   // 粗轧前3道次
    let next_rmF3 = next_item.stops[7];
    let curr_fmL3 = curr_item.stops[12];  // 精轧后3道次
    let next_fmL3 = next_item.stops[12];

    // console.log(i, curr_item.upid)
    
    let toc = (new Date(next_item.toc).getTime() + new Date(curr_item.toc).getTime()) / 2;

    if (curr_rmF3 && next_rmF3) {
      let [op, val] = hasOperation(curr_rmF3, next_rmF3);
      if (op) {
        eventIconData.push({
          upid: next_item.upid,
          toc: convertTime(toc),
          flag: next_item.flag,
          distance: next_rmF3.station.distance,
          // time: convertTime((new Date(next_rmF3.time).getTime() + new Date(curr_rmF3.time).getTime()) / 2)
          time: next_rmF3.time,
          value: val
        });
      }
    }

    if (curr_fmL3 && next_fmL3) {
      let [op, val] = hasOperation(curr_fmL3, next_fmL3);
      if (op) {
        eventIconData.push({
          upid: next_item.upid,
          toc: convertTime(toc),
          flag: next_item.flag,
          distance: next_fmL3.station.distance,
          // time: convertTime((new Date(next_fmL3.time).getTime() + new Date(curr_fmL3.time).getTime()) / 2)
          time: next_fmL3.time,
          value: val
        });
      }
    }
  }

  return eventIconData;
}

export function eventIconDataProcess (eventData, jsonData) {
  let jsonDataMap = new Map();
  jsonData.forEach(d => jsonDataMap.set(d.upid, d));

  // console.log(eventData)
  // console.log(jsonDataMap)
  let keys = Object.keys(eventData);
  for (let key of keys) {
    let keyData = eventData[key];
    let newKeyData = [];
    for (let i = 0; i < keyData.length; i++) {
      // console.log(keyData[i].upid);
      // console.log(jsonDataMap.get(keyData[i].upid));

      let plate = jsonDataMap.get(keyData[i].upid);
      if (!plate) continue;

      let upidStop = new Map();
      plate.stops.forEach(d => {
        upidStop.set(d.station.distance, d.time);
      });
      // console.log(keyData[i].distance)
      // console.log(upidStop)
      let time = upidStop.get(keyData[i].distance);
      keyData[i]['time'] = time;
      // console.log(upidStop)
      newKeyData.push(keyData[i]);
    }
    eventData[key] = newKeyData;
  }
  return eventData;
}