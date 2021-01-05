<template>
  <div>
    <div class="button_bar">
      <span class="margin0_5px">操作栏:</span>
      <mu-button class="margin0_5px" color="primary" @click="getHttpData">取数</mu-button>
      <mu-button class="margin0_5px" color="primary" @click="getPlate">钢板温度</mu-button>
    </div>
    <heatmap ref="heatmap"></heatmap>
    <div style="position: absolute; left: 170px;">
      <plate-temperature chartId="chart1" ref="plateTemperature1"></plate-temperature>
      <plate-temperature chartId="chart2" ref="plateTemperature2"></plate-temperature>
      <plate-temperature chartId="chart3" ref="plateTemperature3"></plate-temperature>
    </div>
  </div>
</template>

<script>
import heatmap from "./heatmap.vue";
import plateTemperature from "./plateTemperature.vue";
import { baogangAxios } from 'services/index.js'
export default {
  components: { heatmap, plateTemperature },
  data() {
    return {
      plateTempProp: {
        slabid: "44191730513",
        headLength: 1,
        tailLength: 1,
        headNum: 8,
        bodyNum: 17,
        tailNum: 8
      }
    };
  },
  methods: {
    // 与后台交互取数http操作
    getHttpData() {
      baogangAxios(
          "/myf/l0_fqc_measure/selectFqcDataByUsid/" + "18901001100"
        )
        .then(Response_1 => {
          baogangAxios(
                "/myf/l0_fqc_measure/selectFqcCrownWedgeByUsid/" +
                "18901001100"
            )
            .then(Response_2 => {
              let xData = Response_1.data.axis_x;
              let yData = Response_1.data.axis_y;
              let rawData = Response_1.data.fqc_data;
              let xAverage = Response_1.data.fqc_datax_ave;
              let yAverage = Response_1.data.fqc_datay_ave;
              let crown = Response_2.data.crown;
              let wedge = Response_2.data.wedge;
              this.$refs.heatmap.paint(
                xData,
                yData,
                rawData,
                xAverage,
                yAverage,
                crown,
                wedge
              );
            });
        });
    },
    getPlateTemp(parameters, chartRef) {
      baogangAxios(
            "/myf/l2_cc_temp_p1p2LUp3p4p5p6/selectl2CcTempP1P6HeadBodyTail/" +
            parameters
        )
        .then(Response => {
          let datas = Response.data[0].datas;
          this.$refs[chartRef].paint(datas, this.plateTempProp);
        });
    },
    getPlate() {
      this.getPlateTemp(
        this.plateTempProp.slabid +
          "/" +
          this.plateTempProp.headLength +
          "/" +
          this.plateTempProp.tailLength +
          "/" +
          this.plateTempProp.headNum +
          "/" +
          this.plateTempProp.bodyNum +
          "/" +
          this.plateTempProp.tailNum +
          "/",
        "plateTemperature1"
      );
      this.getPlateTemp(
        "44080535348" +
          "/" +
          this.plateTempProp.headLength +
          "/" +
          this.plateTempProp.tailLength +
          "/" +
          this.plateTempProp.headNum +
          "/" +
          this.plateTempProp.bodyNum +
          "/" +
          this.plateTempProp.tailNum +
          "/",
        "plateTemperature2"
      );
      this.getPlateTemp(
        "44151935112" +
          "/" +
          this.plateTempProp.headLength +
          "/" +
          this.plateTempProp.tailLength +
          "/" +
          this.plateTempProp.headNum +
          "/" +
          this.plateTempProp.bodyNum +
          "/" +
          this.plateTempProp.tailNum +
          "/",
        "plateTemperature3"
      );
    }
  }
};
</script>

<style>
</style>
