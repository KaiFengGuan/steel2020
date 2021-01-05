<template>
    <el-container class="my-layout">
        <el-aside :class="{collapse: isCollapse}">
            <el-menu background-color="rgb(48, 65, 86)" text-color="#fff" active-text-color="#ffd04b"
                @select="clickMenu" :default-active="$router.history.current.path">
                <div v-for="item in routerMap" :key="item.path">
                    <el-submenu v-if="item.children" :index="item.path">
                        <template slot="title">
                            <i :class="item.icon"></i>
                            <span>{{item.name}}</span>
                        </template>
                        <div v-for="subitem in item.children" :key="subitem.path">
                            <el-menu-item :index="subitem.path">
                                <i :class="subitem.icon"></i>
                                <span>{{subitem.name}}</span>
                            </el-menu-item>
                        </div>
                    </el-submenu>
                    <el-menu-item v-if="!item.children" :index="item.path">
                        <i :class="item.icon"></i>
                        <span slot="title">{{item.name}}</span>
                    </el-menu-item>
                </div>
            </el-menu>
        </el-aside>
        <el-container class="right-layout">
            <el-header height="2.5rem">
                <el-button @click="toggleCollapse" :icon="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'"
                    class="collapseButton" type="text">
                </el-button>
                <span style="font-size:1.6rem">宝钢厚板大数据可视化分析与产品质量预报系统</span>
                <!-- <span style="font-size:1rem">{{appObjById[loginAppId].version}}</span> -->
                <!-- <el-dropdown  class="user-area" trigger="click" @command="handleCommand"> -->
                    <!-- <img src="../../assets/images/defaultUser.png" class="user-avatar"> -->
                    <!-- <el-dropdown-menu slot="dropdown"> -->
                        <!-- <el-dropdown-item command="exit">退出</el-dropdown-item> -->
                    <!-- </el-dropdown-menu> -->
                <!-- </el-dropdown> -->
            </el-header>
            <el-main>
                <router-view></router-view>
            </el-main>
            <el-footer height="1.5rem">
                <span style="font-size:1rem;">Copyright &copy; {{new Date().getFullYear()}} 东北大学·流程工业综合自动化国家重点实验室 All Rights Reserved.</span>
            </el-footer>
        </el-container>
    </el-container>
</template>

<script>
    import { routerMap } from 'router/beforeLogin.js'
    import { mapGetters } from 'vuex'

    export default {
        data () {
            return {
                routerMap: routerMap,
                isCollapse: true
            }
        },

        computed: {
            // ...mapGetters([
            //     'loginPath',
            //     'loginAppId',
            //     'appObjById',
            //     'isCollapse'
            // ])
        },

        methods: {
            clickMenu (index) {
                this.$router.push(index)
            },

            handleCommand (command) {
                this.$router.push('/login/' + this.loginPath)
                // this.$store.dispatch('logout')
            },

            toggleCollapse () {
                // this.$store.dispatch('toggleCollapse')
                this.isCollapse = this.isCollapse?false:true
            }
        }
    }
</script>

<style lang="scss">
    body {
        margin: 0;
        .my-layout {
            height: 100vh;
            .el-aside {
                width: 11rem !important;
                height: 100%;
                transition: 0.2s all;
                .el-menu {
                    height: 100%;
                    overflow-x: hidden;
                    overflow-y: auto;
                    .el-menu-item {
                        i {
                            width: 30px;
                            float: left;
                            margin-top: 21px;
                            transition: 0.2s all;
                        }
                    }
                    .el-menu-item:focus, .el-menu-item:hover {
                        background: rgb(38, 52, 69) !important;
                    }
                }
            }
            .el-aside.collapse {
                width: 4.3rem !important;
                .el-menu {
                    .el-menu-item {
                        i {
                            width: 50px;
                            transform: translateX(-10px);
                        }
                    }
                }
            }
            .right-layout {
                background: #fff;
                .el-header {
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12);
                    line-height: 3rem;
                    background: #fff;
                    .collapseButton {
                        padding: 10px;
                        i {
                            font-size: 1.3rem;
                        }
                        float: left;
                        margin-left: -10px;
                        margin-top: 3px;
                    }
                    .user-area {
                        float: right;
                        .user-avatar {
                            cursor: pointer;
                            width: 40px;
                            height: 40px;
                            margin-top: 3px;
                            border-radius: 10px;
                        }
                    }
                }
                .el-footer {
                    line-height:2rem;
                    background:#fff;
                    box-shadow: 1px 0 3px 0 rgba(0, 0, 0, 0.12);
                }
            }
        }
    }

    // 解决element表格竖线错位问题
    body .el-table th.gutter{
        display: table-cell!important;
    }
    
    body .el-table colgroup.gutter{
        display: table-cell!important;
    }

    /*控制整个滚动条*/
    ::-webkit-scrollbar {
        background-color: transparent;
        width: 0.4rem;
        height: 0.4rem;
        background-clip: padding-box;
    }
    /*滚动条中间滑动部分*/
    ::-webkit-scrollbar-thumb {
        background-color: lightgray;
        border-radius: 0.5rem;
    }
    /*滚动条两端方向按钮*/
    // ::-webkit-scrollbar-button {
    //     background-color: pink;
    // }
    /*滚动条右下角区域*/
    // ::-webkit-scrollbar-corner {
    //     background-color: red;
    // }
    .el-textarea.is-disabled .el-textarea__inner, .el-input.is-disabled .el-input__inner{
        color: #606266 !important;
    }
</style>