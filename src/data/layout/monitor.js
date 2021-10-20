import {convertTime} from '../../utils/index.js'
import * as d3 from "d3"

// 计算马雷图每一个合并的批次的规格
export function mareyChartBatchSpec(mergeresult) {
  let steelspec_list = [], toc_list = [], status_cooling_list = [], fqcflag_list = [];

  for (let item in mergeresult) {
    let mergeItem = mergeresult[item].merge_result.merge;
    let cannotMerge = mergeresult[item].cannot_merge;

    if (mergeItem.length === 0) continue;

    let batch_plates = [...mergeItem.flat(), ...cannotMerge];
    let moreflag = d3.sort(d3.groups(batch_plates, d => d.flag), d => d[1].length).slice(-1)[0];

    let steelspec = new Set();
    let status_cooling = batch_plates[0].stops.length === 17 ? 0 : 1;
    let fqcflag = moreflag[0] !== 404 ? 0 : 1;

    let maxtoc = batch_plates[0].toc;
    let mintoc = batch_plates[0].toc;
    for (let i = 1; i < batch_plates.length; i++) {
      steelspec.add(batch_plates[i].steelspec);
      let toc = new Date(batch_plates[i].toc);
      if (toc > new Date(maxtoc)) maxtoc = convertTime(toc);
      if (toc < new Date(mintoc)) mintoc = convertTime(toc);
    }

    toc_list.push([mintoc, maxtoc]);
    steelspec_list.push(Array.from(steelspec));
    status_cooling_list.push(status_cooling);
    fqcflag_list.push(fqcflag);
  }

  return {
    'slabthickness':      JSON.stringify([]),
    'tgtdischargetemp':   JSON.stringify([]),
    'tgtplatethickness':  JSON.stringify([]),
    'tgtwidth':           JSON.stringify([]), 
    'tgtplatelength2':    JSON.stringify([]),
    'tgttmplatetemp':     JSON.stringify([]),
    'cooling_start_temp': JSON.stringify([]),
    'cooling_stop_temp':  JSON.stringify([]),
    'cooling_rate1':      JSON.stringify([]),
    'productcategory':    JSON.stringify([]),
    'steelspec':          JSON.stringify(steelspec_list),
    'status_cooling':     JSON.stringify(status_cooling_list),
    'fqcflag':            JSON.stringify(fqcflag_list),
    'toc':                JSON.stringify(toc_list)
  }
}
