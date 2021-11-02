import * as d3 from 'd3';
import { index } from 'd3';
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
  data = [...data];
  let res = [[data[0]]],
    last = res[res.length - 1];
  const diagIndex = [];
  for(let i = 0; i < data.length; i++){
    if(data[i].dia_Status){
      diagIndex.push(i);
    }
  }
  
  console.log(diagIndex)
  return res;
}
export const mergeColor = ['rgb(244 102 74)', 'rgb(91 143 249)']

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
  console.log(batchData)
}