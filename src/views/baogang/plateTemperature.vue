<template>
  <div>
    <div :id="chartId" style="width: 100%;height: 100%;overflow: hidden;"></div>
  </div>
</template>

<script>
import * as d3 from "d3";
import d3Tip from "d3-tip";
export default {
  props: ["chartId"],
  data() {
    return {
      // chartId: "plate_temperature"
    };
  },
  methods: {
    // 绘图
    paint(datas, plateTempProp, config) {
      // 处理数据
      // 准备工作
      let chart = document.getElementById(this.chartId);
      // 方法
      let translate = function(x, y) {
        return "translate(" + x + "," + y + ")";
      };
      // 属性配置
      var config = config || {
        width: chart.offsetWidth,
        margin: 10,
        height: 200,
        name: {
          width: 30,
          height: 5
        },
        cell: {
          outWidth: 25,
          outHeight: 25,
          margin: 1,
          inWidth: 22.5,
          inHeight: 22.5,
          strokeWidth: 1,
          stroke: "#c9c9c9"
        },
        columnMargin: 10,
        bar: {
          color: "#85bee6",
          outHeight: 25,
          inHeight: 22.5,
          // strokeWidth: 1,
          // stroke: "#c9c9c9",
          margin: 1
        }
      };

      // -- svg
      this.svg && this.svg.remove();
      this.svg = d3
        .select("#" + this.chartId)
        .append("svg")
        .attr("width", config.width)
        .attr("height", config.height)
        // .style("border", "1px solid #c9c9c9");
      let canvas = this.svg
        .append("g")
        .attr("transform", translate(config.margin, config.margin))
        .append("g")
        .attr("transform", translate(0, (config.height - config.cell.outHeight * 7) / 2 ))

      // call tips
      var rectTip = d3Tip()
        .attr("class", "d3-tip")
        .html(function(d) {
          return d.data;
        });
      canvas.call(rectTip);
      var barTip = d3Tip()
        .attr("class", "d3-tip")
        .html(function(d) {
          return d.coefficientOfVar;
        });
      canvas.call(barTip);

      // 颜色
      let cellColor = [];
      for (const d of datas) {
        cellColor.push(
          d3
            .scaleSequential(d3.interpolateRdYlBu)
            .domain([d.plateMinTemp, d.plateMaxTemp])
        );
      }
      // 定义渐变色图例
      // var defs = svg.append("defs");

      // var linearGradient = defs
      //   .append("linearGradient")
      //   .attr("id", "linearColor")
      //   .attr("x1", "0%")
      //   .attr("y1", "0%")
      //   .attr("x2", "100%")
      //   .attr("y2", "0%");

      // var stop1 = linearGradient
      //   .append("stop")
      //   .attr("offset", "0%")
      //   .style("stop-color", d3.interpolateBlues(0));

      // var stop2 = linearGradient
      //   .append("stop")
      //   .attr("offset", "100%")
      //   .style("stop-color", d3.interpolateBlues(1));

      let rows = canvas
        .append("g")
        .selectAll("g")
        .data(datas)
        .enter()
        .append("g")
        .attr("id", d => d.name)
        .attr("transform", (d, i) => translate(config.name.width, i * config.cell.outHeight));

      rows.append("text")
      .text(d => d.name)
      .attr("x", -config.name.width)
      .attr("y", config.name.height)
      // 矩形
      function paintRects(column, excursion) {
        let rects = rows
          .append("g")
          .selectAll("rect")
          .data((d, i) =>
            d[column].map(d => {
              return { data: d, index: i };
            })
          )
          .enter()
          .append("rect")
          .attr("fill", d => cellColor[d.index](d.data))
          .attr("width", config.cell.inWidth)
          .attr("height", config.cell.inHeight)
          .attr("stroke-width", config.cell.strokeWidth)
          .attr("stroke", config.cell.stroke)
          .attr("transform", (d, j) =>
            translate(excursion + j * config.cell.outWidth, 0)
          )
          .on("mouseover", rectTip.show)
          .on("mouseout", rectTip.hide);
        return rects;
      }
      paintRects("plateHead", 0);
      paintRects(
        "plateBody",
        plateTempProp.headNum * config.cell.outWidth + config.columnMargin
      );
      paintRects(
        "plateTail",
        (plateTempProp.headNum + plateTempProp.bodyNum) * config.cell.outWidth +
          2 * config.columnMargin
      );

      // bar length transform
      function barLength(coefficientOfVar){
        let temp = coefficientOfVar * 100; // 先放大100倍， 超过10的截止
        return ( (temp > 10 ? 10 : temp) / 10) * 100
      }
      // bar
      let barExcursion = config.cell.outWidth * (plateTempProp.headNum + plateTempProp.bodyNum + plateTempProp.tailNum) + 3 * config.columnMargin;
      let bars = rows
        .append("g")
        .append("rect")
        .attr("fill", config.bar.color)
        .attr("width", d => barLength(d.coefficientOfVar))
        .attr("height", config.bar.inHeight)
        // .attr("stroke-width", config.bar.strokeWidth)
        // .attr("stroke", config.bar.stroke)
        .attr("transform", (d, i) =>
          translate( barExcursion, 0)
        )
        .on("mouseover", barTip.show)
        .on("mouseout", barTip.hide);
    }
  }
};
</script>

<style>
@import "./d3-tip.css";
</style>
