import service from './index.js'
import * as APIs from './APIs.js'

export  function getDiagnosis (params) {
    return service.post(APIs.GET_Diagnosesdata, params)
}