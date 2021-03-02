import Vue from 'vue'
import Router from 'vue-router'
import controlView from 'views/baogang/control.vue'
import visualView from 'views/baogang/marey.vue'
import scatterloger from 'views/baogang/scatterloger.vue'
import test from 'views/baogang/test.vue'
import layout from 'components/layout/index.vue'
import routerView from './routerView.vue'

Vue.use(Router)
const routerMap =  [
    {
        path: '/control',
        name: '控制面板',
        component: controlView,
        icon: 'el-icon-s-marketing'
    },
    {
        path: '/visual',
        name: '可视化',
        component: visualView,
        icon: 'fa fa-eye fa-lg'
    },
    {
        path: '/scatterloger',
        name: 'scatterloger',
        component: scatterloger,
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
