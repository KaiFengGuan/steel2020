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