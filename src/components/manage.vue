<template>
    <div class="my-manage">
        <el-row type="flex" justify="end" align="middle" style="margin-bottom: 1rem;">
            <el-col v-for="operation in operationsAboveTable" :key="operation.functionName" :span="1">
                <el-button :type="operation.type" :class="operation.icon" size="mini"
                    @click="clickButtonAboveTable(operation.functionName)">
                </el-button>
            </el-col>
        </el-row>
        <el-table ref="customTable" :data="tableData" style="width: 100%" border :highlight-current-row="false"
            @selection-change="selectionChange" :row-style="highlightSelection">
            <el-table-column v-if="tableSelection" type="selection" width="55" align="center">
            </el-table-column>
            <el-table-column v-if="tableIndex" type="index" width="55" label="序号" align="center">
            </el-table-column>
            <el-table-column v-for="tableColumn in tableColumns" :key="tableColumn.english" align="center"
                :property="tableColumn.english" :label="tableColumn.chinese" :min-width="tableColumn.minWidth">
            </el-table-column>
            <el-table-column label="操作" v-if="operationsInTable.length > 0" :width="operationsInTable.length * 60" align="center" fixed="right">
                <template slot-scope="scope">
                    <el-button v-for="operation in operationsInTable" :key="operation.functionName"
                        size="mini" :type="operation.type" :class="operation.icon"
                        @click="clickButtonInTable(operation.functionName, scope.row)">
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination class="custom-pagination"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="pageOptions.pageNum"
            :page-sizes="pageInfo.pageSizes"
            :page-size="pageOptions.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pageInfo.total">
        </el-pagination>
    </div>
</template>

<script>
    export default {
        props: {
            operationsAboveTable: {
                type: Array,
                default: []
            },
            tableIndex: {
                type: Boolean,
                default: false
            },
            tableSelection: {
                type: Boolean,
                default: false
            },
            tableColumns:  {
                type: Array,
                default: []
            },
            operationsInTable:  {
                type: Array,
                default: []
            },
            tableData: {
                type: Array,
                validator: function (value) {
                    value.map((item, index) => {
                        item.index = index
                    })
                    return true
                }
            },
            pageInfo: {
                type: Object,
                default: {
                    pageSizes: [10, 20, 30, 40],
                    total: 0
                }
            },
            pageOptions: {
                type: Object,
                default: {
                    isAll: 0,
                    sortType: 'asc',
                    sortBy: 'created_time',
                    pageNum: 1,
                    pageSize: 20
                }
            }
        },
        data () {
            return {
                selection: [],
                selectionIndex: []
            }
        },
        mounted () {

        },
        methods: {
            clickButtonAboveTable (functionName) {
                this.$emit(functionName, this.selection)
            },

            clickButtonInTable (functionName, rowData) {
                this.$emit(functionName, rowData)
            },

            selectionChange (selection) {
                this.selection = selection
                this.selectionIndex = selection.map(item => {
                    return item.index
                })
            },

            highlightSelection (obj) {
                if (this.selectionIndex.indexOf(obj.rowIndex) !== -1) {
                    return 'background-color: #ecf5ff'
                }
            },

            handleSizeChange (val) {
                this.$emit('size-change', val)
            },

            handleCurrentChange (val) {
                this.$emit('page-change', val)
            }
        }
    }
</script>

<style lang="scss">
    .my-manage {
        .el-table .cell {
            white-space: pre-wrap;
        }
        .custom-pagination {
            float: right;
            margin-top: 1rem;
        }
    }
</style>
