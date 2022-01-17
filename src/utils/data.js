import * as d3 from 'd3';
import * as util from '../views/baogang/util.js';
export function divideData(data){
  data = [...data];
  let res = [[data[0]]],
    last = res[res.length - 1];
  for(let item = 1; item < data.length; item++){
    if(last[last.length - 1].ovrage === data[item].ovrage){
      last.push(data[item])
    }else{
      if(last.length === 1){
        if(res[res.length - 2] !== undefined){
          res[res.length - 2].push(last[0]);
          last[0] = data[item];
        }else{
          last.push(data[item])
        }
      }else{
        res.push([data[item]])
        last = res[res.length - 1];
      }
    }
  }
  res.map(d => {
    let len = d.length;
    d.status = d.filter(e => e.ovrage).length / len >= 0.5 ? true : false;
  })
  for(let i = 1; i < res.length; i ++){
    if(!res[i - 1].status){
      res[i - 1].push(res[i][0])
    }else{
      res[i].unshift(res[i - 1][res[i - 1].length - 1])
    }
  }
  return res;
}
export function arrowData(data){
  // const multiIndex = [];
  // for(let i = 0; i < data.length; i++){
  //   if(data[i].dia_Status && data[i].flag == 0){
  //     multiIndex.push(i);
  //   }
  // }
  const singleIndex = [];
  for(let i = 0; i < data.length; i++){
    if(data[i].ovrage){
      singleIndex.push(i);
    }
  }
  const intersection = singleIndex;
  var obj = {};
  //   single: [...d3.difference(singleIndex, intersection)],
  //   multivariate: [...d3.difference(multiIndex, intersection)] 
  if(intersection.length !== 0){
    let res = [[intersection[0]]];
    for(let item = 1; item < intersection.length; item++){
      let last = res[res.length - 1];
      if(last[last.length - 1] === intersection[item] - 1 && data[last[last.length - 1]].range === data[intersection[item]].range){
        last.push(intersection[item])
      }else{
        res.push([intersection[item]])
      }
    }
    obj.intersection = res.filter(d => d.length !== 1);
  }else{
    obj.intersection = [];
  }
  const single = [...d3.difference(singleIndex, obj.intersection.flat())];
  // const multivariate = [...d3.difference(multiIndex, obj.intersection.flat())];
  
  obj.single = single.map(d => data[d]);
  // obj.multivariate = multiIndex.map(d => data[d]);
  obj.intersection = obj.intersection.map(d => d.map(e => data[e]));
  // if(obj.intersection.length !== 0)console.log(obj.intersection)
  return obj;
}

export function getSortIndex(data){
  let [start, end] = d3.extent(data.map(d => new Date(d.time)));
  let firstTime = 0,
      timeInterval = 1;
  let overSteel = data.filter(d => d.range !== 0),
    time = overSteel.map(d => new Date(d.time)),
    overDetails = [1, 2, 3].map(d => data.filter(e => Math.abs(e.range) === d).length);
  time[0] && (firstTime = (end - new Date(time[0]))/(end - start));
  let badSteel = data.filter(d => d.flag === 0),
    speNum = badSteel.filter(d => d.tqOrder < 10).length,
    t2Num = badSteel.filter(d => d.tjOrder < 10).length;
  // let interval = d3.pairs(time, (a, b) => b - a);
  // interval[0] && (timeInterval = (d3.min(interval))/(end - start));
  let extremum = d3.max(badSteel.map(d => d.over)),
      overNum = data.filter(d => d.ovrage).length,
      integrate = badSteel.filter(d => d.dia_Status).length;
  return {
    firstTime,
    // timeInterval,
    speNum,
    t2Num,
    integrate,
    extremum,
    overNum,
    overDetails
  };
}

export function sortDatum(data){
  let res = [];
  res[0] = data.map(d => d.firstTime);
  res[1] = data.map(d => d.overNum);
  res[2] = data.map(d => d.extremum);
  res[3] = data.map(d => 0.9 * d.speNum + 0.1 * d.t2Num);
  return res;
}

export function sortDomain(data, coefficient){
  return data.map(d => d.firstTime * coefficient[0] + coefficient[1] * d.overNum + coefficient[2] * d.extremum + coefficient[3] * (0.9 * d.speNum + 0.1 * d.t2Num));
}

export const mergeColor = ["#e3ad92",   "#b9c6cd"]

export function diagnosticSort(batchData){
  for(let i = 0; i < batchData.length; i++){
    for(let j = 0; j < batchData[i].length; j++){
      let sdata = batchData[i][j];
      let len = sdata['CONTJ'].length;
      var original = sdata['CONTJ'].map((d, i) => [d, sdata['CONTQ'], i]);
      let CONTJ = original.sort((a, b) => b[0] - a[0]);
      sdata['tjOrder'] = new Array(len).fill(0);
      sdata['tqOrder'] = new Array(len).fill(0);
      for(let item in CONTJ){
        sdata['tjOrder'][CONTJ[item][2]] = +item;
      }
      let CONTQ = original.sort((a, b) => b[1] - a[1])
      for(let item in CONTQ){
        sdata['tqOrder'][CONTQ[item][2]] = +item;
      }
    }
  }
  // console.log(batchData)
}

export const queryIcon = ['M828.4 805.4L671.5 648.5c-46.8 48.5-112.3 78.3-184.9 79.3-146.8 2-268.5-118.2-268.2-265 0.3-146 118.3-263.8 264.4-263.8 146.3 0 264.4 118.1 264.4 264.4 0 48.3-13.2 93.7-35.7 133.4-3.8 6.8-2.6 15.2 2.9 20.7 8 8 21.4 6.3 27.2-3.5 26-43.8 40.8-95.2 40.8-150.6 0-165.7-134-299.7-299.7-299.7-165.8 0-299.7 133.9-299.7 299.7 0 165.7 134 299.7 299.7 299.7 70.5 0 135.7-24.7 186.9-65.2L802.9 831c7.2 7.2 19 7 26-0.4 6.6-7.2 6.4-18.3-0.5-25.2z m12.4 12.4', 'M313.1 441c10.2-82.6 76.4-147.4 159-154.9 9.1-0.8 16-8.4 16-17.6 0-10.4-8.9-18.5-19.2-17.6-99.1 9-178.6 86.8-190.8 185.6-1.3 10.5 6.9 19.8 17.5 19.8 8.9 0.1 16.5-6.5 17.5-15.3z m-1.2 15.4']

// brushable Data Preprocessing
export function brushPre(json){
  let result = [];
  for(let item in json){
    let temp = json[item];
    let sin = {};
    sin = {
      cooling_rate1: temp['cooling_rate1'],
      cooling_start_temp: temp['cooling_start_temp'],
      cooling_stop_temp: temp['cooling_stop_temp'],
      label: temp['flag'],
      productcategory: temp['productcategory'],
      slab_thickness: temp['slabthickness'] * 1000,
      steelspec: temp['steelspec'],
      tgtdischargetemp: temp['tgtdischargetemp'],
      tgtplatelength2: temp['tgtplatelength2'],
      tgtthickness: temp['tgtplatethickness'],
      tgttmplatetemp: temp['tgttmplatetemp'],
      tgtwidth: temp['tgtwidth'],
      toc: temp['toc'],
      upid: temp['upid'],
    }
    sin.status_cooling = sin.cooling_rate1 !== null ? 0 : 1;
    result.push(sin);
  }
  return result;
}
// {
//   slabthickness: JSON.stringify([]),
//   tgtdischargetemp: JSON.stringify([]),
//   tgtplatethickness: JSON.stringify([]),
//   tgtwidth: JSON.stringify([]),
//   tgtplatelength2: JSON.stringify([]),
//   tgttmplatetemp: JSON.stringify([]),
//   cooling_start_temp: JSON.stringify([]),
//   cooling_stop_temp: JSON.stringify([]),
//   cooling_rate1: JSON.stringify([]),
//   productcategory: JSON.stringify([]),
//   steelspec: JSON.stringify([]),
//   status_cooling:0,
//   fqcflag:0
// }