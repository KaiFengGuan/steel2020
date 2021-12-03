<template>
		<svg :id="menuId"></svg>
</template>

<script>
import * as d3 from 'd3';
import {processJson, wheelRound} from "./index.js"
import {mapGetters} from "vuex"
export default {
	props: {
		// contract: {
		// 	default: false,
		// 	type: Boolean,
		// 	require: true
		// }
	},
	data() {
			return {
					menuId: 'wheeling' + Math.random().toString(32).slice(-6),
					data:[],
					jsondata: undefined,
					chorddata: undefined,
					constant: {},
					height: undefined,
					width: undefined
			}
	},
	methods: {
		paintChart(jsondata, chorddata) {
			this.jsondata = jsondata, this.chorddata = chorddata;
			var wheeldata = [] , labels = [], searchLabels = [];
			for(let item in jsondata['CONTJ']){ //online
				searchLabels.push(jsondata['one_dimens'][item]['name'])
				if(processJson.flat().indexOf(jsondata['one_dimens'][item]['name']) == -1)continue
				labels.push(jsondata['one_dimens'][item]['name'])
				wheeldata.push({
					name: jsondata['one_dimens'][item]['name'],
					PCASPE: jsondata['CONTQ'][item],
					PCAT2: jsondata['CONTJ'][item],
					result_value: jsondata['one_dimens'][item]['value'],
					result_low: jsondata['one_dimens'][item]['l'],
					result_high: jsondata['one_dimens'][item]['u'],
					result_extre_high: jsondata['one_dimens'][item]['extremum_u'],
					result_extre_low: jsondata['one_dimens'][item]['extremum_l'],
					result_extre_shigh: jsondata['one_dimens'][item]['s_extremum_u'],
					result_extre_slow: jsondata['one_dimens'][item]['s_extremum_l'],
				})
			}	
			const svg = d3.select('#' + this.menuId)
				// .append('svg')
				.attr('viewBox', `${-50} ${-this.height / 2} ${this.width} ${this.height}`)
				.style('width', this.width)
				.style('height', this.height);
			svg.selectAll('*').remove();
			let s;	// why i can't delete
			this.constant.chart = new wheelRound(svg, this)
				.size([this.width, this.height])
				.data(wheeldata)
				.chord(chorddata)
				.process(processJson)
				.labels(labels)
				.render();
		},
		renderChart(){
			this.paintChart(this.jsondata, this.chorddata)
		}
	},
	mounted() {
		const parentNode = document.getElementById(this.menuId).parentNode;
		this.height = parentNode.offsetHeight;	
		this.width = parentNode.offsetWidth;

		//resize自适应变更 issue
		// document.addEventListener('resize', ()=>{
		// 	console.log(document.getElementById(this.menuId).parentNode.offsetHeight);
		// })
		// console.log(this.height, this.width);
	},
	computed:{
		...mapGetters([
			'corrSize',
			'multiPara',
			'curveSize',
			'filterStatus',
			'heatOrRiver'
		])
	},
	watch:{
		corrSize:function(){
			this.renderChart()
		},
		multiPara:function(){
			this.renderChart()
		}
	}
}
</script>

<style lang="scss" scoped>
@import url("../../assets/marey/wheel.scss");
</style>