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
export function updateRange (selection, objStatus){
  console.log(selection)
  var values = [
    JSON.stringify(objStatus.slab_thickness ? [] : []),   // slabthickness  //selection[3].map(d => d / 1000)
    JSON.stringify(objStatus.tgtdischargetemp ? selection[4] : []),   // tgtdischargetemp
    JSON.stringify(objStatus.tgtthickness ? selection[0] : []),   // tgtplatethickness
    JSON.stringify(objStatus.tgtwidth ? [] : []),   // tgtwidth //selection[2]
    JSON.stringify(objStatus.tgtplatelength2 ? selection[1] : []),   // tgtplatelength2
    JSON.stringify(objStatus.tgttmplatetemp ? selection[5] : []),   // tgttmplatetemp
    JSON.stringify(objStatus.cooling_start_temp ? [] : []),   // cooling_start_temp
    JSON.stringify(objStatus.cooling_stop_temp ? [] : []),   // cooling_stop_temp
    JSON.stringify(objStatus.cooling_rate1 ? [] : []),   // cooling_rate1
    JSON.stringify([]),   // productcategory
    JSON.stringify([]),   // steelspec
    0,   // status_cooling //selection[6][0]
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