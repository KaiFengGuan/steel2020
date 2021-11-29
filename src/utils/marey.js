import * as d3 from 'd3';
export function getBatchHeader(data, toc) {
  const steelspec_list = Array.from(d3.group(data, d => d.steelspec), ([key, value]) => key);
  const toc_list = toc;
  const thick_list = d3.extent(data, d => d.tgtplatethickness);
  const width_list = d3.extent(data, d => d.tgtwidth);
  const length_list = d3.extent(data, d => d.tgtplatelength2);
  // console.log(data)
  // console.log(d3.map(data, d => d.tgtwidth))
  return [toc_list,   // time_select
  JSON.stringify([]),   // slabthickness
  JSON.stringify([]),   // tgtdischargetemp
  JSON.stringify([thick_list[0] - 2, thick_list[1] + 2]),   // tgtplatethickness
  JSON.stringify([]),   // tgtwidth
  JSON.stringify([length_list[0] - 30, length_list[1] + 30]),   // tgtplatelength2
  JSON.stringify([]),   // tgttmplatetemp
  JSON.stringify([]),   // cooling_start_temp
  JSON.stringify([]),   // cooling_stop_temp
  JSON.stringify([]),   // cooling_rate1
  JSON.stringify([]),   // productcategory
  JSON.stringify(steelspec_list),   // steelspec
  0,   // status_cooling
  0   // fqcflag
  ]
}
export function updateRange (obj, selection){
  // var keys = ['tgtthickness', 'tgtplatelength2', 'tgtwidth', 'slab_thickness', 'tgtdischargetemp', 'tgttmplatetemp']
  var values = [
    JSON.stringify([]),   // slabthickness  //selection[3].map(d => d / 1000)
    JSON.stringify(selection[4]),   // tgtdischargetemp
    JSON.stringify(selection[0]),   // tgtplatethickness
    JSON.stringify([]),   // tgtwidth //selection[2]
    JSON.stringify(selection[1]),   // tgtplatelength2
    JSON.stringify(selection[5]),   // tgttmplatetemp
    JSON.stringify([]),   // cooling_start_temp
    JSON.stringify([]),   // cooling_stop_temp
    JSON.stringify([]),   // cooling_rate1
    JSON.stringify([]),   // productcategory
    JSON.stringify([]),   // steelspec
    selection[6][0],   // status_cooling
    0   // fqcflag
    ]
  var keys = ["slabthickness", "tgtdischargetemp", "tgtplatethickness", "tgtwidth",
    "tgtplatelength2", "tgttmplatetemp", "cooling_start_temp",
    "cooling_stop_temp", "cooling_rate1", "productcategory", "steelspec",
    "status_cooling" , "fqcflag"];
  let object = {};
  for(let key in keys){
    object[keys[key]] = values[key];
  }
    return object;
    // Object.fromEntries([keys, values]);
  }
    // {
//   "slabthickness":"[]",
//   "tgtdischargetemp":"[]",
//   "tgtplatethickness":"[17.25,21.25]",
//   "tgtwidth":"[]",
//   "tgtplatelength2":"[]",
//   "tgttmplatetemp":"[]",
//   "cooling_start_temp":"[]",
//   "cooling_stop_temp":"[]",
//   "cooling_rate1":"[]",
//   "productcategory":"[]",
//   "status_cooling":0,
//   "steelspec":"[\"X70M\"]",
//   "fqcflag":0
// }