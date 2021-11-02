import * as d3 from 'd3'
import {convertTime} from '../../utils/index.js'

const OprationThreshold = 0.00100;  // 单位: m, 范围: -0.004m ~ 0.004m

function hasOperation(curr, next) {
  let curr_zp = curr.station.zeropoint ? curr.station.zeropoint : undefined;
  let next_zp = next.station.zeropoint ? next.station.zeropoint : undefined;

  if (curr_zp && next_zp) {
    let zp = curr_zp.map((d, i) => Math.abs(d - next_zp[i]));
    // console.log(zp)
    return zp.some(d => d >= OprationThreshold);
  }

  return false;
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

    if (curr_rmF3
      && next_rmF3
      && hasOperation(curr_rmF3, next_rmF3)
    ) {
      eventIconData.push({
        upid: next_item.upid,
        toc: convertTime(toc),
        flag: next_item.flag,
        distance: next_rmF3.station.distance,
        // time: convertTime((new Date(next_rmF3.time).getTime() + new Date(curr_rmF3.time).getTime()) / 2)
        time: next_rmF3.time
      });
    }

    if (curr_fmL3
      && next_fmL3
      && hasOperation(curr_fmL3, next_fmL3)
    ) {
      eventIconData.push({
        upid: next_item.upid,
        toc: convertTime(toc),
        flag: next_item.flag,
        distance: next_fmL3.station.distance,
        // time: convertTime((new Date(next_fmL3.time).getTime() + new Date(curr_fmL3.time).getTime()) / 2)
        time: next_fmL3.time
      });
    }
  }

  return eventIconData;
}
