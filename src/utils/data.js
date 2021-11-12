import * as d3 from 'd3';
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
  const multiIndex = [];
  for(let i = 0; i < data.length; i++){
    if(data[i].dia_Status){
      multiIndex.push(i);
    }
  }
  const singleIndex = [];
  for(let i = 0; i < data.length; i++){
    if(data[i].ovrage){
      singleIndex.push(i);
    }
  }
  const intersection = [...d3.intersection(multiIndex, singleIndex)];
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
  const multivariate = [...d3.difference(multiIndex, obj.intersection.flat())];
  
  obj.single = single.map(d => data[d]);
  obj.multivariate = multivariate.map(d => data[d]);
  obj.intersection = obj.intersection.map(d => d.map(e => data[e]));
  // if(obj.intersection.length !== 0)console.log(obj.intersection)
  return obj;
}
export const mergeColor = ['#c65b24', 'rgb(91 143 249)']

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