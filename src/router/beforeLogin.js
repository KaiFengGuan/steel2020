import Vue from 'vue'
import Router from 'vue-router'
import visualView from 'views/baogang/marey.vue'
import test from 'views/baogang/test.vue'
import layout from 'components/layout/index.vue'
import routerView from './routerView.vue'

Vue.use(Router)
const routerMap =  [
    {
        path: '/visual',
        name: '可视化',
        component: visualView,
        icon: 'fa fa-eye fa-lg'
    },
    {
        path: '/test',
        name: 'test',
        component: test,
        icon: 'fa fa-eye fa-lg'
    },
]
export default new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [{
        path: '/',
        name: 'home',
        component: routerView,
        hidden: true,
        children: routerMap,
        redirect: routerMap[1].path
    }]
    
})

export {
    routerMap
}
