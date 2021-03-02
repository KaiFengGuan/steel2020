import Vue from 'vue'
import Vuex from 'vuex'

import steel from './modules/steel.js'

Vue.use(Vuex)

export default new Vuex.Store({
    modules: {
        steel
    },
})
