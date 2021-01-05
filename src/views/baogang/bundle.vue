<template>
	<div>
		<div :id="menuId" style="height: 100%;width:100%;padding:5px"></div>
	</div>
</template>

<script>
//https://observablehq.com/@d3/bilevel-edge-bundling?collection=@d3/d3-hierarchy
//Bilevel Edge Bundling
import * as d3 from 'd3';
import { Delaunay } from 'd3-delaunay';
import util from './util.js';
export default {
	data() {
		return {
			menuId: 'bundle',
			svg: undefined,
            data:[],
		}
	},
	methods: {
	paintChart(jsondata,chorddata) {
        console.log( chorddata)
		const vm=this		
        const diameter=600;
        const radius = 350,
            colornone = "#ccc",
            colorout = "#f00",
            colorin = "#00f"
		// this.svg !== undefined && this.svg.remove()
		this.svg=d3.select("#bundle")
			.append("svg")
			.attr("viewBox", `${-diameter / 2} ${-diameter / 2} ${diameter} ${diameter}`)
            .style("width", diameter)
            .style("height", diameter);
        // this.svg=d3.select(".wheelg")
        const changecolor=[
                [t=>d3.interpolateRdBu(t), t=>d3.interpolateRdGy(t), t=>d3.interpolateRdYlBu(t)],
                [t=>d3.interpolateRdYlGn(t), t=>d3.interpolateSpectral(t), t=>d3.interpolatePuOr(t)],
                [t=>d3.interpolatePRGn(t), t=>d3.interpolateBrBG(t), t=>d3.interpolatePuOr(t)],
            ]
        const svg=this.svg;
        const process = {
                    0:["ave_temp_entry_pre","temp_uniformity_entry_pre", "sur_temp_entry_pre", 
                        "center_temp_entry_pre", "skid_temp_entry_pre", "ave_temp_pre", "staying_time_pre", "ave_temp_entry_1",
                        "temp_uniformity_entry_1", "sur_temp_entry_1", "center_temp_entry_1", "skid_temp_entry_1", "ave_temp_1",
                        "staying_time_1", "ave_temp_entry_2", "temp_uniformity_entry_2", "sur_temp_entry_2", "center_temp_entry_2", 
                        "skid_temp_entry_2", "ave_temp_2", "staying_time_2", "ave_temp_entry_soak", "temp_uniformity_entry_soak",
                        "sur_temp_entry_soak", "center_temp_entry_soak", "skid_temp_entry_soak", "ave_temp_soak", "staying_time_soak",
                        "ave_temp_dis", "temp_uniformity_dis", "sur_temp_dis", "center_temp_dis", "skid_temp_dis", "t_0", "t_1", "t_2", "t_3", "t_4", "t_5", "t_6"
                    ],
                    1:['topwrplatecountfm','topwrplatecountrm','topbrplatecountfm','topbrplatecountrm','botbrplatecountfm',
                        'botbrplatecountrm','botwrplatecountfm','botwrplatecountrm','crownbody','crowntotal',
                        'devcrownbody','devcrowntotal','devthicknesscentertotal','devthicknessclosetotal',
                        'devwedgebody','devwedgetotal','maxcrownbody','maxcrowntotal','maxthicknesscentertotal',
                        'maxthicknessclosetotal','maxwedgebody','maxwedgetotal','mincrownbody','mincrowntotal',
                        'minthicknesscenterbody','minthicknesscenterhead','minthicknesscentertotal','minthicknessclosebody',
                        'minthicknessclosehead','minthicknessclosetotal','minwedgebody','minwedgehead','minwedgetail',
                        'minwedgetotal','ratiolpls','thicknesscenterbody','thicknesscenterhead','thicknesscentertotal',
                        'thicknessclosebody','thicknessclosehead','thicknessclosetotal','wedgebody','wedgetotal'
                    ],
                    2:['avg_p1','std_p1','max_p1','min_p1','avg_p2','std_p2','max_p2','min_p2','avg_sct','std_sct',
                        'max_sct','min_sct','avg_fct','std_fct','max_fct','min_fct','avg_p5','std_p5','max_p5','min_p5',
                        'avg_cr_cal','std_cr_cal','max_cr_cal','min_cr_cal','avg_cr_act','std_cr_act','max_cr_act',
                        'min_cr_act','avg_time_b','std_time_b','max_time_b','min_time_b','avg_time_w','std_time_w',
                        'max_time_w','min_time_w','avg_time_a','std_time_a','max_time_a','min_time_a','speed_ratio',
                        'last_cooling_zone_length','last_water_temp','last_air_temp','fqc_label'
                    ]
                };
        let graph={nodes:[],links:[]}
        for (let item in chorddata['label']){
            let targets=[],group,id=chorddata['label'][item];
            for(let index in process){
                if(process[index].indexOf(id)!==-1)group=+index
            }
            for(let index in chorddata['corr'][item]){
                if(chorddata['corr'][item][index]<1&&chorddata['corr'][item][index]>0.5&index>item){
                    targets.push(chorddata['label'][index])
                    graph.links.push({'source':id,'target':chorddata['label'][index],value:1})
                }
            }
            graph.nodes.push({'id':id,'group':group,'targets':targets})
        }
        console.log(graph)
        const tree = d3.cluster()
            .size([2 * Math.PI, radius - 100])
        const line = d3.lineRadial()
            .curve(d3.curveBundle.beta(0.85))
            .radius(d => d.y)
            .angle(d => d.x)

        function bilink(root) {
            const map = new Map(root.leaves().map(d => [d.data.id, d]));
            for (const d of root.leaves()) d.incoming = [], d.outgoing = d.data.targets.map(i => [d, map.get(i)]);
            for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
            return root;
        }
        const {nodes, links} = graph;
        const groupById = new Map;
        const nodeById = new Map(nodes.map(node => [node.id, node]));

        for (const node of nodes) {
            let group = groupById.get(node.group);
            if (!group) groupById.set(node.group, group = {id: node.group, children: []});
            group.children.push(node);
            node.targets = [];
        }

        for (const {source: sourceId, target: targetId} of links) {
        nodeById.get(sourceId).targets.push(targetId);
        }

        const data={children: [...groupById.values()]};
        const root = tree(bilink(d3.hierarchy(data)
            .sort((a, b) => d3.ascending(a.height, b.height) || d3.ascending(a.data.id, b.data.id))));
        const node = svg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .selectAll("g")
            .data(root.leaves())
            .join("g")
                .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
            .append("text")
                .attr("dy", "0.31em")
                .attr("x", d => d.x < Math.PI ? 6 : -6)
                .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
                .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
                .text(d => d.data.id)
                // .text('node')
                .each(function(d) { d.text = this; })
                .on("mouseover", overed)
                .on("mouseout", outed)
                .call(text => text.append("title").text(d => `${d.data.id}
            ${d.outgoing.length} outgoing
            ${d.incoming.length} incoming`));
        const labelcolor=(d,i)=>{
            for(let index in [0,1,2]){
                if(process[index].indexOf(d[0].data.id)!==-1){
                    for(let item in [0,1,2]){
                        if(process[index].indexOf(d[1].data.id)!==-1){
                            let key=[chorddata['label'].indexOf(d[0].data.id),chorddata['label'].indexOf(d[1].data.id)];
                            let color=changecolor[item][index](1-chorddata['corr'][key[0]][key[1]]);
                            svg.append("linearGradient")
                                .attr("id", `line_${key[0]}${key[1]}`)
                                .attr("x1", "0%")
                                .attr("x2", "100%")
                                .attr("y1", "0%")
                                .attr("y2", "100%")
                                .attr("gradientUnits", "userSpaceOnUse")
                                .call(g => g.append("stop").attr("stop-color", 'yellow').attr("offset", 0))
                                .call(g => g.append("stop").attr("stop-color", "#ffffff").attr("offset", 0.5))
                                .call(g => g.append("stop").attr("stop-color", 'red').attr("offset", 1));
                            // console.log(changecolor)
                            // console.log(changecolor[item][index](1-chorddata['corr'][chorddata['label'].indexOf(d[0].data.id)][chorddata['label'].indexOf(d[1].data.id)]))
                            // return changecolor[item][index](1-chorddata['corr'][chorddata['label'].indexOf(d[0].data.id)][chorddata['label'].indexOf(d[1].data.id)])
                            return d3.color(changecolor[item][index]((1.1-chorddata['corr'][key[0]][key[1]])/0.5)).brighter(Math.random())
                            // return `url(line_${key[0]}${key[1]})`
                            // return "linear-gradient(to left, red , blue)"
                            // return d3.color(color).brighter()
                            // return d3.interpolateRdBu(1 - d3.easeQuad(i / ((1 << 6) - 1)))
                        }
                    }
                }
            }
        };
        const link = svg.append("g")
            .attr("stroke", colornone)
            .attr("fill", "none")
            .selectAll("path")
            .data(root.leaves().flatMap(leaf => leaf.outgoing))
            .join("path")
                .style("mix-blend-mode", "multiply")
                .attr("d", ([i, o]) => line(i.path(o)))
                .each(function(d) { d.path = this; })
                .attr("stroke",labelcolor)
                // .on("mouseover",(event,d)=>{
                //     console.log(d)
                // });;
        // function strokecolor(d,i){
        //     for(let index in [0,1,2]){
        //         if(process[index].indexOf(d[0].data.id)!==-1){
        //             for(let item in [0,1,2]){
        //                 if(process[index].indexOf(d[1].data.id)!==-1){
        //                     console.log(vm.color[item][index](chorddata['corr'][chorddata['label'].indexOf(d[0].data.id)][chorddata['label'].indexOf(d[1].data.id)]))
        //                     return vm.color[item][index](chorddata['corr'][chorddata['label'].indexOf(d[0].data.id)][chorddata['label'].indexOf(d[1].data.id)])
        //                 }
        //             }
        //         }
        //     }
        // }
        function overed(event, d) {
            link.style("mix-blend-mode", null);
            d3.select(this).attr("font-weight", "bold");
            d3.selectAll(d.incoming.map(d => d.path)).attr("stroke", colorin).raise();
            d3.selectAll(d.incoming.map(([d]) => d.text)).attr("fill", colorin).attr("font-weight", "bold");
            d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", colorout).raise();
            d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr("fill", colorout).attr("font-weight", "bold");
        }

        function outed(event, d) {
            link.style("mix-blend-mode", "multiply");
            d3.select(this).attr("font-weight", null);
            d3.selectAll(d.incoming.map(d => d.path)).attr("stroke", labelcolor);
            d3.selectAll(d.incoming.map(([d]) => d.text)).attr("fill", null).attr("font-weight", null);
            d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", labelcolor);
            d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr("fill", null).attr("font-weight", null);
        }
	},
	},
	mounted() {
	},
	computed:{
	}
}
</script>
