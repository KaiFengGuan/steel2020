import utils from "../../views/baogang/util.js"
let state = {
    selectId: "feeiyOFU",
    brushMouseId: "",
    brushSelection: new Map(),
    isSwitch: true,
}

let getters = {
    selectId: state => state.selectId,
    brushMouseId: state => state.brushMouseId,
    brushSelection: state => state.brushSelection,
    isSwitch: state => state.isSwitch,
    trainGroupStyle: state => {
        return state.isSwitch ? (d => +d.label === 0 ? utils.labelColor[0] : utils.labelColor[1]) : (d => utils.categoryColor(d.productcategory))
    }
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
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}