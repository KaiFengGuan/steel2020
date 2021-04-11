import utils from "../../views/baogang/util.js"
let state = {
    selectId: "feeiyOFU",
    brushMouseId: "",
    brushSelection: new Map(),
    isSwitch: true,
    labelColor: [ "#c65b24", "#94a7b7"], //bad good
    startDate: new Date('2018-11-04 00:00:00'),
    endDate: new Date('2018-11-06 04:00:00'),
    brushSelectColor: "#c6cacc",
    corrSize: 0.5,
    multiPara: 20,
    curveSize: 0.5
}

let getters = {
    selectId: state => state.selectId,
    brushMouseId: state => state.brushMouseId,
    brushSelection: state => state.brushSelection,
    isSwitch: state => state.isSwitch,
    trainGroupStyle: state => {
        return state.isSwitch ? (d => +d.label === 0 ? utils.labelColor[0] : utils.labelColor[1]) : (d => utils.categoryColor(d.productcategory))
    },
    trainBorder: state => {
        return state.isSwitch ? (d => +d.fqc_label === 0 ? utils.labelColor[0] : utils.labelColor[1]) : (d => utils.categoryColor(d.platedata[0][2]))
    },
    deGroupStyle: state => {
        return state.isSwitch ? (d => +d.label === 0 ? utils.delabelColor[0] : utils.delabelColor[1]) : (d => utils.categoryColor(d.productcategory))
    },
    labelColor : state => state.labelColor,
    startDate: state => state.startDate,
    endDate: state => state.endDate,
    brushSelectColor: state => state.brushSelectColor,
    corrSize: state => state.corrSize,
    multiPara: state => state.multiPara,
    curveSize: state => state.curveSize
}

let actions = {
}

let mutations = {
    selectUpid(state, upid){
        state.selectId = upid
    },
    brushMouseUpid(state, upid){
        state.brushMouseId = upid
    },
    changeLabelColor(state){
        state.isSwitch = ! state.isSwitch
    },
    setStartDate(state, Date){
        state.startDate = Date
    },
    setEndDate(state, Date){
        state.endDate = Date
    },
    setCorrSize(state, size){
        state.corrSize = size
    },
    setmultiPara(state, size){
        state.multiPara = size
    },
    setCurveSize(state,size){
        state.curveSize = size
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}