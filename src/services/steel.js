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
export function getMonitorData (url, params) {
    return service.post(APIs.GET_MonitorData + `/${url.startDate}/${url.endDate}/${url.type}/${url.limit}`, params)
}
export function getProcessData (url, params){
    return service.post(APIs.GET_Steel_Process_Data + `/${url.upid}/${url.process}/${url.devation}/${url.limit}`, params)
}

export function getRollData (url, params){
    return service.post(APIs.GET_Steel_ROLL_DATA + `/${url.startDate}/${url.endDate}/${url.devation}/${url.limit}`, params)
}
export function getHeatData (url, params){
    return service.post(APIs.GET_Steel_HEAT_DATA + `/${url.startDate}/${url.endDate}/${url.number}/${url.devation}/${url.limit}`, params)
}
export function getCoolData (url, params){
    return service.post(APIs.GET_Steel_COOL_DATA + `/${url.startDate}/${url.endDate}/${url.number}/${url.header}/${url.devation}/${url.limit}`, params)
}
export function getEventIconData (url) {
    return service.get(APIs.GET_Event_Icon_Data + `/${url.startDate}/${url.endDate}/30/${url.threshold}/${url.operation}/`)
}