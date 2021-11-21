import * as d3 from 'd3'

export function getMonitorChunk(merge_index, plates, monitordata) {
  plates.sort((a, b) => new Date(a.stops[0].time).getTime() - new Date(b.stops[0].time).getTime());
  let all_diag = [[], [], []];
  let process = ['Heat', 'Roll', 'Cool'];
  const n = plates.length;
  let over_p = [0, 0, 0], total = [0, 0, 0];

  for (let j = 0; j < process.length; j++) {
    let key = process[j];
    for (let i = 0; i < n; i++) {
      let k = i;
      let temp = [];
      while (k < n && monitordata[plates[k].upid]) {
        let plate = plates[k];
        let cur_moni = monitordata[plate.upid];
        if (!cur_moni[key + '_QUCL'] && !cur_moni[key + '_Q']
          && !cur_moni[key + '_T2UCL'] && !cur_moni[key + '_T2']) {
          break;
        }
        let Q_UCL  = cur_moni[key + '_QUCL'],
            Q      = cur_moni[key + '_Q'] > cur_moni[key + '_QUCL'] * 1.5 ? cur_moni[key + '_QUCL'] * 1.5 : cur_moni[key + '_Q'],
            T2_UCL = cur_moni[key + '_T2UCL'],
            T2     = cur_moni[key + '_T2'] > cur_moni[key + '_T2UCL'] * 1.5 ? cur_moni[key + '_T2UCL'] * 1.5 : cur_moni[key + '_T2'];
      
        if (Q > Q_UCL)  over_p[j]++;
        if (T2 > T2_UCL) over_p[j]++;
        total[j] += 2;

        temp.push({
          upid: plate.upid,
          toc: plate.toc,
          endtime: new Date(plate.stops.slice(-1)[0].time),
          nextendtime: k+1 === n ? 0 : new Date(plates[k+1].stops.slice(-1)[0].time),
          index: j,
          Q_UCL:  Q_UCL,
          Q:      Q,
          T2_UCL: T2_UCL,
          T2:     T2
        });
        k++;
      }
      if (temp.length !== 0) all_diag[j].push(temp);
      i = k;
    }
  }

  let merge_exit_date = [];
  let date_exit_s = new Date(plates[0].stops.slice(-1)[0].time);
  let date_exit_e = new Date(plates[plates.length - 1].stops.slice(-1)[0].time);
  // console.log(over_p, total)
  for (let j = 0; j < 3; j++) {
    if (all_diag[j].length !== 0) {
      let percent = over_p[j] / total[j];
      merge_exit_date.push({
        merge_index: merge_index,
        process_index: j,
        date_exit_s: date_exit_s,
        date_exit_e: date_exit_e,
        percent: percent
      })
    }
  }

  return [all_diag.filter(d => d.length !== 0), merge_exit_date]
}
