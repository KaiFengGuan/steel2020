<template>
  <div :id="menuId" style="height: 100%"></div>
</template>

<script>
import * as d3 from "d3";
import { Delaunay } from "d3-delaunay";
import util from "./util.js";
import { mapGetters, mapMutations } from "vuex";
export default {
  data() {
    return {
      menuId: 'marey',
			categoryColors: util.categoryColor,
      labelColors: util.labelColor, // [bad, good]
      noflagColor: util.noflagColor,
      labelColorsFunc: util.labelColorFunc,
      
			svg: undefined,
      timesdata: undefined,
      stationsdata: undefined,
      brushdata: undefined,
      changecolor: undefined
    };
  },
  methods: {
    ...mapMutations(['hightLight']),
    paintChart(timesdata, stationsdata, changecolor, brushdata) {
      const vm = this;

      vm.timesdata = timesdata;
      vm.stationsdata = stationsdata;
      vm.brushdata = brushdata;
      vm.changecolor = changecolor;

      const WIDTH = document.getElementById(vm.menuId).offsetWidth;
      const HEIGHT = document.getElementById(vm.menuId).offsetHeight;

      vm.svg !== undefined && vm.svg.remove();
      vm.svg = d3.select('#' + vm.menuId)
        .append('svg')
        .attr('width', WIDTH)
        .attr('height', HEIGHT)
        .attr('class', 'ConditionView');
      
      class ConditionView {
        constructor (container) {
          this._container = container;
          this._g = null;

          this._mareyChart = null
        }
      }

      const conditionView = new ConditionView(vm.svg);

    }
      
  },
  mounted() {},
  computed: {
    ...mapGetters(["hightlightGroup"]),
  },
};
</script>

<style>
</style>
