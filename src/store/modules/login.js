import * as types from '../mutation-types.js'
import { login } from 'services/user.js'
import myVue from 'src/main.js'
import getRouterMap from 'router/afterLogin.js'

let state = {
    loginId: 1,
    loginName: 'dev',
    loginAppId: '',
    loginUserId: '',
    loginPath: '',
    isLogin: false,
    isCollapse: true,
    loginAuth: {
        menus: [],
        views: []
    },
    loginToken: ''
}

let getters = {
    loginId: state => state.loginId,
    loginName: state => state.loginName,
    loginAppId: state => state.loginAppId,
    loginUserId: state => state.loginUserId,
    loginPath: state => state.loginPath,
    isLogin: state => state.isLogin,
    isCollapse: state => state.isCollapse,
    loginAuth: state => state.loginAuth,
    loginToken: state => state.loginToken
}

let actions = {
    toggleCollapse ({ commit }) {
        commit('toggleCollapse')
    },

    login ({ commit }, userInfo) {
        return new Promise((resolve, reject) => {
            login(userInfo)
                .then(res => {
                    if (res.code === 0) {
                        if (res.data.auth.menus.length > 0) {
                            myVue.$router.addRoutes(getRouterMap(res.data.auth.menus))
                            window.localStorage.setItem('loginLogo', res.data.logo)
                            commit(types.LOGIN, res.data)
                            resolve()
                        }
                    } else {
                        reject('用户名或密码错误')
                    }
                })
                .catch(() => {
                    reject('用户名或密码错误')
                })
        })
    },

    logout ({ commit }) {
        return new Promise((resolve) => {
            location.reload()
            commit(types.LOGOUT, false)
            resolve()
        })
    }
}

let mutations = {
    toggleCollapse (state) {
        state.isCollapse = !state.isCollapse
    },

    [types.LOGIN] (state, data) {
        state.loginId = data.id
        state.loginName = data.name
        state.loginAppId = data.app_id
        state.loginUserId = data.user_id
        state.loginPath = data.login_path
        state.isLogin = true
        state.loginAuth = data.auth
        state.loginToken = data.token
    },

    [types.LOGOUT] (state) {
        state.loginId = ''
        state.loginName = ''
        state.loginAppId = ''
        state.loginUserId = ''
        state.loginPath = ''
        state.isLogin = false
        state.loginAuth = {
            menus: [],
            views: []
        }
        state.loginToken = ''
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
