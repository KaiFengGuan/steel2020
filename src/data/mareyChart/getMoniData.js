import * as d3 from 'd3'

export function getMonitorData(mergeresult, timesdata, monitordata) {
  // console.log(mergeresult)
  // console.log(timesdata)
  // console.log(monitordata)

  // let merge_flat = mergeresult.map(d => [
  //   ...d.cannot_merge, 
  //   ...d.merge_result.merge.flat(), 
  //   ...d.merge_result.select.flat()]);

  // let time_extend = [];
  // for (let batch of merge_flat) {
  //   let max_toc = new Date(batch[0].toc), min_toc = new Date(batch[0].toc);
  //   for (let plate of batch) {
  //     let cur_toc = new Date(plate.toc);
  //     if (cur_toc >= max_toc)  max_toc = cur_toc;
  //     if (cur_toc < min_toc)  min_toc = cur_toc;
  //   }
  //   time_extend.push([min_toc, max_toc]);
  // }
  
  
  // let moni_res = [];
  // for (let [min_toc, max_toc] of time_extend) {
  //   let one_batch_moni = [];
  //   for (let plate of timesdata) {
  //     let cur_toc = new Date(plate.toc);
  //     if (cur_toc >= min_toc && cur_toc <= max_toc &&)
  //   }
  // }

}


// this._monitoringdata = {};
//           let all_diag = [[], [], []];
//           let process = ['Heat', 'Roll', 'Cool'];
//           let n = this._timesdata.length;
//           for (let i = 0; i < n; i++) {
//             let item = this._timesdata[i];
//             let cur_moni = monitordata[item.upid];

//             for (let j = 0; j < process.length; j++) {
//               let key = process[j];
//               all_diag[j].push({
//                 upid: item.upid,
//                 toc: item.toc,
//                 endtime: new Date(item.stops.slice(-1)[0].time),
//                 nextendtime: i+1 === n ? 0 : new Date(this._timesdata[i+1].stops.slice(-1)[0].time),
//                 index: j,
//                 Q_UCL:  cur_moni ? cur_moni[process[j] + '_QUCL']  ? cur_moni[process[j] + '_QUCL']  : 0 : 0,
//                 Q:      cur_moni ? cur_moni[process[j] + '_Q']     ? cur_moni[process[j] + '_Q'] > cur_moni[process[j] + '_QUCL'] * 1.5 ? cur_moni[process[j] + '_QUCL'] * 1.5 : cur_moni[process[j] + '_Q'] : 0 : 0,
//                 T2_UCL: cur_moni ? cur_moni[process[j] + '_T2UCL'] ? cur_moni[process[j] + '_T2UCL'] : 0 : 0,
//                 T2:     cur_moni ? cur_moni[process[j] + '_T2']    ? cur_moni[process[j] + '_T2'] > cur_moni[process[j] + '_T2UCL'] * 1.5 ? cur_moni[process[j] + '_T2UCL'] * 1.5 : cur_moni[process[j] + '_T2'] : 0 : 0,
//               })
//             }
//           }