import service from './index.js'
import * as APIs from './APIs.js'

export  function getDiagnosis (api, params) {
    // return service.post(APIs.GET_Diagnosesdata, params)
    return service.post(api, params)
}
export  function getVisualization (params) {
    return service.post(APIs.GET_Visualization, params)
}