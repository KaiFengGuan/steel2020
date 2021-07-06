let state = {
    filterStatus: false,
    heatOrRiver: false
}

let getters = {
    filterStatus: state => state.filterStatus,
    heatOrRiver: state => state.heatOrRiver
}

let actions = {
}

let mutations = {
    changeStatus(state, status){
        state.filterStatus = status
    },
    riverStatus(state, status){
        state.heatOrRiver = status
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}