let state = {
    filterStatus: false,
    heatOrRiver: false,
    tipViews: false,
    tipOptions: {}
}

let getters = {
    filterStatus: state => state.filterStatus,
    heatOrRiver: state => state.heatOrRiver,
    tipViews: state => state.tipViews,
    tipDisplay: state => state.tipViews ? 'block' : 'none',
    tipOptions: state => state.tipOptions
}

let actions = {
}

let mutations = {
    changeStatus(state, status){
        state.filterStatus = status
    },
    riverStatus(state, status){
        state.heatOrRiver = status
    },
    showTooltip(state, options){
        state.tipViews = true;
        state.tipOptions = options;
    },
    removeTooltip(state){
        state.tipViews = false;
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}