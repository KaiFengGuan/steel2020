const baseUrl = '/baogangapi'
const newbaseUrl = '/newbaogangapi'

export const GET_Diagnosesdata = baseUrl + '/v1.0/baogangPlot/diagnosesdata'
export const GET_Visualization = baseUrl + '/v1.0/model/Visualization'
export const GET_VisualizationCorrelation = newbaseUrl + '/v1.0/model/VisualizationCorrelation/'
export const GET_MonitorData = newbaseUrl + '/v1.0/baogangPlot/monitordatabytime'
export const GET_Steel_Process_Data = newbaseUrl + '/v1.0/model/newVisualization'

export const GET_Steel_COOL_DATA = newbaseUrl + '/v1.0/model/newCoolVisualizationByBatch'
export const GET_Steel_HEAT_DATA = newbaseUrl + '/v1.0/model/newHeatVisualizationByBatch'
export const GET_Steel_ROLL_DATA = newbaseUrl + '/v1.0/model/newRollVisualizationByBatch'