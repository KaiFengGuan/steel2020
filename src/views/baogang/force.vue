<template>
    <div :id="chartId" style="width: 100%; height: 100%;"></div>
</template>

<script>
    import echarts from 'echarts'
    import ecStat from 'echarts-stat'
    import { cloneObject } from 'utils/index.js'
    import * as d3 from 'd3';

    export default {
        props: {
            symboylsize: {
                type: Number,
                default: 0.05
            },
            linesize:{
                type:Number,
                defult:0.25
            }
        },
        data () {
            return {
                chartId: 'diagnosis-bar' + Math.random().toString(32),
                // myChart: null,
                option:{
                    // title: {
                    //     text: 'Correlation View',
                    //     subtext: 'Default layout',
                    //     top: 'bottom',
                    //     left: 'left',
                    //     textStyle:{
                    //         fontSize: 14,
                    //         fontWeight:'normal',
                    //         fontFamily:"Avenir"
                    //     }
                    // },
                    tooltip: {
                    },
                    legend: [{
                        // selectedMode: 'single',
                        data: []
                    }],
                    animationDuration: 1500,
                    animationEasingUpdate: 'quinticInOut',
                    series : [
                        {
                            // name: 'Les Miserables',
                            type: 'graph',
                            layout: 'force',
                            data: [],
                            links: [],
                            zoom:0.4,
                            categories: [],
                            // draggable:false,
                            roam: true,
                            focusNodeAdjacency: false,
                            itemStyle: {
                                borderColor: '#fff',
                                borderWidth: 1,
                                shadowBlur: 10,
                                shadowColor: 'rgba(0, 0, 0, 0.3)'
                            },
                            label: {
                                position: 'right',
                                formatter: '{b}'
                            },
                            lineStyle: {
                                color: 'source',
                                curveness: 0.3
                            },
                            emphasis: {
                                lineStyle: {
                                    width: 5
                                }
                            }
                        }
                    ]
                },
                nodes:[],
                links:[],
                faultlabel:{                                  
                    fault0:'bend',
                    fault1:"abnormalThickness",
                    fault2:"horizonWave",
                    fault3:"leftWave",
                    fault4:"rightWave"},
                myChart:'',
                chartData:[]
            }
        },

        mounted () {
            this.myChart = echarts.init(document.getElementById(this.chartId))
        },

        methods: {

            paint(chartData) {
                // console.log(chartData)
                this.chartData=chartData
                let heat=["tgtplatethickness2","tgtwidth","tgtplatelength2","slab_thickness","slab_width","slab_length","slab_weight_act",
                        "charging_temp_act","ave_temp_entry_pre","temp_uniformity_entry_pre", "sur_temp_entry_pre", 
                        "center_temp_entry_pre", "skid_temp_entry_pre", "ave_temp_pre", "staying_time_pre", "ave_temp_entry_1",
                        "temp_uniformity_entry_1", "sur_temp_entry_1", "center_temp_entry_1", "skid_temp_entry_1", "ave_temp_1",
                        "staying_time_1", "ave_temp_entry_2", "temp_uniformity_entry_2", "sur_temp_entry_2", "center_temp_entry_2", 
                        "skid_temp_entry_2", "ave_temp_2", "staying_time_2", "ave_temp_entry_soak", "temp_uniformity_entry_soak",
                        "sur_temp_entry_soak", "center_temp_entry_soak", "skid_temp_entry_soak", "ave_temp_soak", "staying_time_soak",
                        "ave_temp_dis", "temp_uniformity_dis", "sur_temp_dis", "center_temp_dis", "skid_temp_dis", "t_0", "t_1", "t_2", "t_3", "t_4", "t_5", "t_6"
                    ]
                let roll=['topwrplatecountfm','topwrplatecountrm','topbrplatecountfm','topbrplatecountrm','botbrplatecountfm',
                        'botbrplatecountrm','botwrplatecountfm','botwrplatecountrm','crownbody','crowntotal',
                        'devcrownbody','devcrowntotal','devthicknesscentertotal','devthicknessclosetotal',
                        'devwedgebody','devwedgetotal','maxcrownbody','maxcrowntotal','maxthicknesscentertotal',
                        'maxthicknessclosetotal','maxwedgebody','maxwedgetotal','mincrownbody','mincrowntotal',
                        'minthicknesscenterbody','minthicknesscenterhead','minthicknesscentertotal','minthicknessclosebody',
                        'minthicknessclosehead','minthicknessclosetotal','minwedgebody','minwedgehead','minwedgetail',
                        'minwedgetotal','ratiolpls','thicknesscenterbody','thicknesscenterhead','thicknesscentertotal',
                        'thicknessclosebody','thicknessclosehead','thicknessclosetotal','wedgebody','wedgetotal'
                    ];
                let cool=['avg_p1','std_p1','max_p1','min_p1','avg_p2','std_p2','max_p2','min_p2','avg_sct','std_sct',
                        'max_sct','min_sct','avg_fct','std_fct','max_fct','min_fct','avg_p5','std_p5','max_p5','min_p5',
                        'avg_cr_cal','std_cr_cal','max_cr_cal','min_cr_cal','avg_cr_act','std_cr_act','max_cr_act',
                        'min_cr_act','avg_time_b','std_time_b','max_time_b','min_time_b','avg_time_w','std_time_w',
                        'max_time_w','min_time_w','avg_time_a','std_time_a','max_time_a','min_time_a','speed_ratio',
                        'last_cooling_zone_length','last_water_temp','last_air_temp','fqc_label'
                    ]
                let allvalue=[heat,roll,cool]
                function valueserch(value){
                    for (let item in allvalue){
                        if(allvalue[item].indexOf(value)!==-1){
                            return item
                        }
                    }
                }
                this.myChart = echarts.init(document.getElementById(this.chartId))
                let nodes=[]
                for(let item in chartData['label']){
                    let color;
                    if(heat.indexOf(chartData['label'][item])!==-1){
                        color="#fb8b53"
                    }
                    if(cool.indexOf(chartData['label'][item])!==-1){
                        color="#28b2f7"
                    }
                    if(roll.indexOf(chartData['label'][item])!==-1){
                        color="#b4b4b4"
                    }
                    nodes.push({
                        id:""+item,
                        name:chartData['label'][item],
                        itemStyle:{
                            color:color
                        },
                        // draggable:false,
                        fault:{
                            fault0:chartData['fault0'][item],
                            fault1:chartData['fault1'][item],
                            fault2:chartData['fault2'][item],
                            fault3:chartData['fault3'][item],
                            fault4:chartData['fault4'][item]},
                        // x:null,
                        // y:null
                        x:chartData['position'][item][0]*8,
                        y:chartData['position'][item][1]*8,
                    })
                }
                console.log(nodes)
                let categories=[]
                let num=0
                nodes.forEach((node)=>{
                    node.key=+(node.fault['fault0']+node.fault['fault1']+node.fault['fault2']+node.fault['fault3']+node.fault['fault4'])
                    node.value=+((node.key*1e14).toFixed(4))
                    if(node.value<0.05){
                        node.symbolSize=0
                    }else{
                        node.symbolSize=node.value*75;
                        num++
                    }
                    node.label={
                        show: node.symbolSize>15,
                        color:'auto'
                    };
                    node.category=+valueserch(node.name)
                    categories.push(node.category)
                })
                console.log(num)
                categories=[...new Set(categories)]
                let category=[]
                for (var i = 0; i < categories.length; i++) {
                    category[i] = {
                        name: '类目' + i
                    };
                }
                console.log(category)
                let len=nodes.length
                let corr=chartData['corr']
                // []
                // for(let item in chartData['corr']){
                //     if(item<len){
                //     corr.push(chartData['corr'][item].splice(len,chartData['corr'][item].length-len))
                //     }else{
                //         break
                //     }
                // }
                let links=[],id=0;
                for (let i in corr){
                    for( let j in corr[i]){
                        if(j<i)continue
                        if(Math.abs(corr[i][j])<0.25)continue
                        if(nodes[i].symbolSize===0||nodes[j].symbolSize===0){
                            continue
                        }
                        // console.log(corr[i][j])
                        if(corr[i][j]>0&&corr[i][j]<1){
                        links.push({
                            linedata:Math.abs(corr[i][j]),
                            id:''+id,
                            source:''+i,
                            target:''+j,
                            name:{},
                            linestyle:{
                                normal:{}
                            }
                        })
                        }                        
                        if(corr[i][j]<0&&corr[i][j]>-1){
                        links.push({
                            linedata:Math.abs(corr[i][j]),
                            id:''+id,
                            source:''+j,
                            target:''+i,
                            name:{},
                            linestyle:{
                                normal:{}
                            }
                        })
                        }
                        id++
                    }
                }
                this.option.legend.data=category.map(function (a) {
                            return a.name;
                        })
                this.option.series[0].data=nodes
                this.option.series[0].links=links
                this.option.series[0].categories=category
                this.nodes=nodes
                this.links=links
                this.option.tooltip.formatter= (params)=>{                              
                        if(params.data.fault){
                            let tool=params.data.name +"<br/>"
                                + "sum_score:"+(+params.data.value).toFixed(4) + "<br/>"
                            for(let item of Object.keys(params.data.fault)){
                                if(params.data.fault[item]>0.0001){
                                    tool+=this.faultlabel[item]+":" +params.data.fault[item].toFixed(4)+"<br/>"
                                }
                            }
                            return tool
                        }else if(params.data.source){
                            // console.log(params)
                            let tool=this.nodes[+(params.data.source)].name+'--'+this.nodes[+(params.data.target)].name+'<br/>'+params.data.linedata.toString()
                            return tool.toString()
                        }

						}
                this.myChart.setOption(this.option)
            },
            paintcategory(categories) {
                this.option.series[0].data.forEach((node)=>{
                    if(node.category===categories){
                        node.symbolSize=node.symbolSize*1.5
                        node.itemStyle.borderColor="#404040"
                    }
                })
                this.myChart.setOption(this.option)
            },
            paintreset(categories){
                this.option.series[0].data.forEach((node)=>{
                    if(node.category===categories){
                        let key=node.symbolSize/1.5
                        node.symbolSize=key
                        node.itemStyle.borderColor="#FFFFFF"
                    }
                })
                this.myChart.setOption(this.option)
            },
            sizechange(){
                this.nodes.forEach((node)=>{
                    if(node.value<this.symboylsize){
                        node.symbolSize=0
                    }else{
                        node.symbolSize=node.value*75;
                    }
                    node.label={
                        show: node.symbolSize>15,
                        // color:'auto'
                    };
                })
                let corr=this.chartData['corr']
                let links=[],id=0;
                for (let i in corr){
                    for( let j in corr[i]){
                        if(j<i)continue
                        if(Math.abs(corr[i][j])<this.linesize)continue
                        if(this.nodes[i].symbolSize===0||this.nodes[j].symbolSize===0){
                            continue
                        }
                        if(corr[i][j]>0&&corr[i][j]<1){
                        links.push({
                            linedata:Math.abs(corr[i][j]),
                            id:''+id,
                            source:''+i,
                            target:''+j,
                            name:{},
                            linestyle:{
                                normal:{}
                            }
                        })
                        }                        
                        if(corr[i][j]<0&&corr[i][j]>-1){
                        links.push({
                            linedata:Math.abs(corr[i][j]),
                            id:''+id,
                            source:''+j,
                            target:''+i,
                            name:{},
                            linestyle:{
                                normal:{}
                            }
                        })
                        }
                        id++
                    }
                }               
                this.option.series[0].data=this.nodes
                this.option.series[0].links=links
                this.links=links
                // console.log(this.symboylsize,this.linesize)
                // console.log(this.nodes,this.links)
                this.myChart.setOption(this.option)
            }
        }
    }
</script>
