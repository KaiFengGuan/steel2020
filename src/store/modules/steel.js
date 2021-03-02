let state = {
    selectId: "feeiyOFU",
    brushMouseId: "",
    brushSelection: new Map(),
}

let getters = {
    selectId: state => state.selectId,
    brushMouseId: state => state.brushMouseId,
    brushSelection: state => state.brushSelection,
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
}

export default {
    state,
    getters,
    actions,
    mutations
}