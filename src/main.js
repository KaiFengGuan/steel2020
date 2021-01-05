import Vue from 'vue'
import App from './App.vue'
import router from './router/beforeLogin.js'
// import store from './store/index.js'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import 'font-awesome/scss/font-awesome.scss'
import stomp from 'stompjs'

// import getRouterMap from 'router/afterLogin.js'

Vue.config.productionTip = false

Vue.use(ElementUI)

// const whiteList = ['/login']
// router.beforeEach((to, from, next) => {
//     if (store.getters.isLogin) {
//         if (to.path === '/login') {
//             next('/run')
//         }
//         next()
//     } else {
//         if (whiteList.indexOf(to.path) !== -1) {
//             next()
//         } else {
//             next('/login')
//         }
//     }
// })
// if (store.getters.loginAuth.menus.length > 0) {
//     router.addRoutes(getRouterMap(store.getters.loginAuth.menus))
// }

import MuseUI from 'muse-ui'
import 'muse-ui/dist/muse-ui.css'
Vue.use(MuseUI)

export default new Vue({
    router,
    // store,
    render: h => h(App)
}).$mount('#app')

var ws = new WebSocket('ws://localhost:15674/ws')
var client = stomp.over(ws)
client.debug = null
var connectHeaders = {
    login: 'root',
    passcode: 'woshimima',
    host: '/'
}
var on_connect = function () {
    console.log('everything is fine with stomp...')
}
var on_error = function (err) {
    console.log('Oops, there is something wrong, look at the information below!!!')
    console.log(err)
}
client.connect(connectHeaders, on_connect, on_error)
// Vue.config.devtools = true;
export { client }
