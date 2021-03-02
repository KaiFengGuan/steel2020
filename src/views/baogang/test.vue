<template>
	<div>
		<el-row style="margin: 2px 0;background: white">
			{{bundling}}{{selectId}}
            <brushableParallel></brushableParallel>
		</el-row>
	</div>
</template>

<script>




import * as d3 from 'd3';
import util from './util.js';
import brushableParallel from "components/charts/brushableParallel.vue"
import { baogangAxios, baogangPlotAxios } from 'services/index.js'
import { mapGetters, mapMutations} from 'vuex'
var echarts = require('echarts');
export default {
	components: {brushableParallel},
	data() {
		return {
			bundling:false,
		}
	},
	computed: {
		...mapGetters([
                "selectId",
            ]),
		
	},
	created() {
		// this.day()
	},
	methods: {
		...mapMutations([
			"selectUpid"
		]),
	},
	mounted() {
		// this.getRadarIndicatorOptions();
		this.selectUpid("gyeiogeuiqug")
		// this.$store.commit("selectUpid","gyeiogeuiqug")
	}
	
}
</script>

<style>
.panel-title {
	margin: 14px;
	font-size: 14px;
	font-weight: bold;
}
</style>
<style lang="scss">
</style>