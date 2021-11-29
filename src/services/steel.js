import service from './index.js'
import * as APIs from './APIs.js'

export  function getDiagnosis (api, params) {
    // return service.post(APIs.GET_Diagnosesdata, params)
    return service.post(api, params)
}
export  function getVisualization (params) {
    return service.post(APIs.GET_Visualization, params)
}
export  function getVisCorrelation (url, params) {
  return service.post(APIs.GET_VisualizationCorrelation + `/${url.startDate}/${url.endDate}/${url.nums}`, params)
}
export function getMonitorData(url, params) {
  return service.post(APIs.GET_MonitorData + `/${url.startDate}/${url.endDate}/${url.type}/${url.limit}`, params)
}
export function getProcessData(url, params){
  return service.post(APIs.GET_Steel_Process_Data + `/${url.upid}/${url.process}/${url.devation}/${url.limit}`, params)
}