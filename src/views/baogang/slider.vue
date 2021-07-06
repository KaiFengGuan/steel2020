<template>
  <div :id="menuId" style="width: 100%; height: 100%;">
    <!-- <el-button>123</el-button> -->
  </div>
</template>

<script>
import * as d3 from 'd3'
import util from './util.js'

import { mapGetters, mapMutations } from 'vuex'
import { forEach } from './sampledata/stationdata.js'
export default {
  data() {
    return {
      menuId: 'slider',
      svg: undefined
    }
  },

  mounted() {},
  computed: {
    ...mapGetters(['labelColor', 'noflagColor', 'startDate', 'endDate', 'brushSelectColor'])
  },
  methods: {
    ...mapMutations(['setStartDate', 'setEndDate']),
    paintChart(brushData) {
      // console.log(brushData)
      // console.log(brushData)
      const width = document.getElementById(this.menuId).offsetWidth,
        height = document.getElementById(this.menuId).offsetHeight - 5,
        miniMargin = { top: 5, right: 40, bottom: 10, left: 10 },
        miniHeight = height - miniMargin.bottom - miniMargin.top,
        miniXScale = d3
          .scaleBand()
          .domain(brushData.endTimeOutput)
          .range([miniMargin.left, width - miniMargin.right])
          // .paddingInner(0.5)
      const vm = this
      let flag = 0
      // y
      const miniYScale = d3
        .scaleLinear()
        .domain([0, d3.max(brushData.good_flag, (d, i) => d + brushData.bad_flag[i] + brushData.no_flag[i])])
        .nice()
        .range([0, miniHeight * 0.75])
      var timeout = undefined
      this.svg !== undefined && this.svg.remove()
      this.svg = d3
        .select('#' + this.menuId)
        .append('svg')
        .attr('class', 'timeSlider')
        .attr('width', width)
        .attr('height', height + 5)
      const svg = this.svg,
        keys = brushData.endTimeOutput.map((d, i) => i)
      const mainG = svg.append('g').attr('class', 'mainG')
      const selectionG = svg.append('g').attr('class', 'selectionG')
      const curve = d3.curveBundle.beta(1)
      const newDate = []
      const endTimeOutput1 = brushData.endTimeOutput
      const no_flag1 = brushData.no_flag
      const good_flag1 = brushData.good_flag
      const bad_flag1 = brushData.bad_flag

      endTimeOutput1.forEach((d, i) => newDate.push({ endTimeOutput: d, no_flag: no_flag1[i], good_flag: good_flag1[i], bad_flag: bad_flag1[i] }))
      const stack = d3.stack().keys(['no_flag', 'good_flag', 'bad_flag']).order(d3.stackOrderNone).offset(d3.stackOffsetNone)
      const series = stack(newDate)
      // console.log('series: ', series)
      const miniXScale1 = d3
        .scaleBand()
        .domain(brushData.endTimeOutput)
        .range([miniMargin.left, width - miniMargin.right])
        // .paddingInner(0.5)

      const miniYScale1 = d3
        .scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
        .nice()
        .range([miniHeight - miniMargin.bottom, miniMargin.top])
      // const z = d3.scaleBand().domain([0, 1, 2]).range()
      const z = ['#71797E', '#94a7b7', '#c65b24']

      const area = d3
        .area()
        .curve(curve)
        .x(d => miniXScale1(d.data.endTimeOutput))
        .y0(d => miniYScale1(d[0]))
        .y1(d => miniYScale1(d[1]))
      mainG
        .append('g')
        .attr('class', 'AreaRiver')
        .attr('transform', `translate(${0},${8})`)
        .selectAll('path')
        .data(series)
        .join('path')
        .attr('d', area)
        .attr('fill', (d, i) => z[i])
        .attr('opacity', 0.2) 
      const miniBars = svg
        .select('.mainG')
        .append('g')
        .attr('class', 'barGroup')
        .selectAll('.bar')
        .data(keys)
        .join('g')
        .call(g =>
          g
            .append('rect')
            .attr('class', 'nobar')
            .attr('x', d => miniXScale(brushData.endTimeOutput[d]))
            .attr('y', d => miniHeight - miniYScale(brushData.no_flag[d]))
            .attr('width', miniXScale.bandwidth())
            .attr('height', d => miniYScale(brushData.no_flag[d]))
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('fill', this.noflagColor)
        )
        .call(g =>
          g
            .append('rect')
            .attr('class', 'goodbar')
            .attr('x', d => miniXScale(brushData.endTimeOutput[d]))
            .attr('y', d => miniHeight - miniYScale(brushData.no_flag[d]) - miniYScale(brushData.good_flag[d]))
            .attr('width', miniXScale.bandwidth())
            .attr('height', d => miniYScale(brushData.good_flag[d]))
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('fill', this.labelColor[1])
        )
        .call(g =>
          g
            .append('rect')
            .attr('class', 'badbar')
            .attr('x', d => miniXScale(brushData.endTimeOutput[d]))
            .attr('y', d => miniHeight - miniYScale(brushData.no_flag[d]) - miniYScale(brushData.good_flag[d]) - miniYScale(brushData.bad_flag[d]))
            .attr('width', miniXScale.bandwidth())
            .attr('height', d => miniYScale(brushData.bad_flag[d]))
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('fill', this.labelColor[0])
        )
        .on('mouseover', mouseover)
        .on('mouseout', mouseout)

      const arc = d3
          .arc()
          .innerRadius(0)
          .outerRadius(10)
          .startAngle(0)
          .endAngle(2 * Math.PI),
        x = d3.scaleLinear([0, 1], [miniMargin.left, width - miniMargin.right]),
        brushHandle = (g, selection) =>
          g
            .selectAll('.handle--custom')
            .data([{ type: 'w' }, { type: 'e' }])
            .join(enter =>
              enter
                .append('path')
                .attr('class', 'handle--custom')
                .attr('fill', (d, i) => (i === 0 ? d3.color(this.labelColor[1 - i]) : util.delabelColor[1 - i]))
                // .attr("fill", (d, i) => this.labelColor[i])
                // .attr("fill-opacity", 0.8)
                .attr('stroke', (d, i) => (i === 0 ? d3.color(this.labelColor[1 - i]).darker(0.5) : d3.color(util.delabelColor[1 - i]).darker(0.5)))
                .attr('stroke-width', 2)
                .attr('cursor', 'ew-resize')
                .attr('d', arc)
            )
            .attr('display', selection === null ? 'none' : null)
            .attr('id', (d, i) => 'handle' + i)
            .attr('coordinate', selection === null ? null : (d, i) => [selection[i], height - miniMargin.bottom - 5])
            .attr('transform', selection === null ? null : (d, i) => `translate(${selection[i]},${height - miniMargin.bottom - 5})`),
        brush = d3
          .brushX()
          .extent([
            [miniMargin.left, height - miniMargin.bottom - 11],
            [width - miniMargin.right, height - 7]
          ])
          .on('start brush', brushed)
          .on('end', endSelect)
      // svg.append('g').call(brush).call(brush.move, [50, 75])原始的
      selectionG.append('g').call(brush).call(brush.move, [60, 100])
      // vm.setStartDate(new Date(new Date(brushData.endTimeOutput[0]) - 0.5 * 86400 * 1000))
      // vm.setEndDate(new Date(brushData.endTimeOutput[brushData.endTimeOutput.length - 1]))

      function brushed({ selection }) {
        const brushEnter = d3.map(brushData.endTimeOutput, d => {
          return miniXScale(d) >= selection[0] && selection[1] >= miniXScale(d)
        })

        let good = 0,
          bad = 0
        brushEnter.map((d, i) => {
          if (d) {
            good += brushData.good_flag[i]
            bad += brushData.bad_flag[i]
          }
        })

        d3.selectAll('.goodbar').attr('opacity', (d, i) => (brushEnter[i] ? 1 : 0.2))
        d3.selectAll('.badbar').attr('opacity', (d, i) => (brushEnter[i] ? 1 : 0.2))
        d3.selectAll('.nobar').attr('opacity', (d, i) => (brushEnter[i] ? 1 : 0.2))
        const textX = +d3.select('.selection').attr('x') + +d3.select('.selection').attr('width') / 2,
          textY = +d3.select('.selection').attr('y') + 11
        d3.select('.selectionText').remove()
        // svg原始的
        selectionG
          .append('text')
          .attr('class', 'selectionText')
          .attr('x', textX)
          .attr('y', textY)
          .attr('text-anchor', 'middle')
          .attr('font-family', util.selectionTextAttr.inOverlay.fontFamily)
          // .attr('stroke', 'none')
          .attr('fill', util.selectionTextAttr.inOverlay.fontColor)
          .attr('font-size', util.selectionTextAttr.inOverlay.fontSize)
          .style('font-weight', util.selectionTextAttr.inOverlay.fontWeight)
          .style('font-style', util.selectionTextAttr.inOverlay.fontStyle)
          .text(good + bad)
        // console.log(d3.select('.selectionText').node().getBBox())
        if (d3.select('.selection').attr('width') - 20 < d3.select('.selectionText').node().getBBox().width) {
          d3.select('.selectionText')
            .attr('fill', util.selectionTextAttr.outOverlayColor)
            .attr('y', textY + 12)
          if (good + bad == 0) d3.select('.selectionText').remove()
        }
        // console.log(d3.select(".selection"))
        d3.selectAll('.handletext').remove()
        if (good + bad !== 0 && selection !== null) {
          svg
            .selectAll('.handletext')
            .data(selection)
            .join(enter =>
              enter
                .append('text')
                .attr('class', 'handletext')
                .attr('text-anchor', 'middle')
                .attr('font-family', util.selectionTextAttr.inOverlay.fontFamily)
                .attr('transform', (d, i) => `translate(${selection[i]},${height - miniMargin.bottom})`)
                .attr('stroke', 'none')
                .attr('fill', util.selectionTextAttr.inOverlay.fontColor)
                .attr('font-size', util.selectionTextAttr.inOverlay.fontSize)
                .style('font-weight', util.selectionTextAttr.inOverlay.fontWeight)
                .style('font-style', util.selectionTextAttr.inOverlay.fontStyle)
                .text((d, i) => (i === 0 ? 100 - ((bad / (bad + good)) * 100).toFixed(0) : ((bad / (bad + good)) * 100).toFixed(0)))
            )
          // .join("g")
          // .call(g => g.append("text")
          //     .attr("class", "handletext")
          //     .attr("text-anchor", "middle")
          //     .attr("font-family", "DIN")
          //     .attr("transform", (d, i) => `translate(${selection[i]},${(height  - miniMargin.bottom)})`)
          //     .attr("stroke", "none")
          //     .attr("fill", "black")
          //     .attr("font-size", "12px")
          //     .text((d, i) => i === 0 ? (bad/ (bad + good)*100).toFixed(0) : 100 - (bad/ (bad + good)*100).toFixed(0)))
        }
        d3.select(this).call(brushHandle, selection)
        svg.select('.selection').attr('fill-opacity', 1).attr('fill', '#b9c6cd').attr('stroke', '#b5c1c7')
        svg.select('.overlay').attr('stroke', '#bbbbbb').attr('stroke-width', 1).attr('fill', '#eeeeee').attr('rx', 8).attr('ry', 8)
        svg.select('.overlay').attr('stroke', '#b9c6cd').attr('stroke-width', 1).attr('fill', '#eeeeee').attr('rx', 8).attr('ry', 8)

        svg.selectAll('.handle--custom').raise()

        // 提取刷选的数据绘制刷选河流图
        svg.selectAll('.upperRiver').remove()
        const upperData = []

        brushEnter.forEach((d, i) => {
          if (d) {
            upperData.push({
              endTimeOutput: brushData.endTimeOutput[i],
              no_flag: brushData.no_flag[i],
              good_flag: brushData.good_flag[i],
              bad_flag: brushData.bad_flag[i]
              // bad_flag: brushData.bad_flag[i]
            })
          }
        })
        // console.log('upperDate',upperData);
        const upperSeries = stack(upperData)
        // svg原始的
        mainG
          .append('g')
          .attr('class', 'upperRiver')
          .attr('transform', `translate(${0},${10})`)
          .selectAll('path')
          .data(upperSeries)
          .join('path')
          .attr('d', area)
          .attr('fill', (d, i) => z[i])
          .attr('opacity', 0.6)
        //刷选河流图结束
        svg.selectAll('.barGroup').raise()
        svg.selectAll('.upperRiver').attr('opacity', flag === 0 ? 0 : 1)
      }
      function endSelect({ selection }) {
        if (timeout !== undefined) {
          clearTimeout(timeout)
        }
        if (selection == null) return
        const brushTime = d3.filter(brushData.endTimeOutput, d => {
          return miniXScale(d) >= selection[0] && selection[1] >= miniXScale(d)
        })
        const brushEnter = d3.map(brushData.endTimeOutput, d => {
          return miniXScale(d) >= selection[0] && selection[1] >= miniXScale(d)
        })
        let good = 0,
          bad = 0
        brushEnter.map((d, i) => {
          if (d) {
            good += brushData.good_flag[i]
            bad += brushData.bad_flag[i]
          }
        })
        if (good + bad === 0) {
          return
        } else {
          timeout = setTimeout(function uploaddate() {
            if (selection.length >= 2) {
              vm.setStartDate(new Date(new Date(brushTime[0]) - 0.5 * 86400 * 1000))
              vm.setEndDate(new Date(brushTime[brushTime.length - 1]))
            } else {
              vm.setStartDate(new Date(new Date(brushTime[0]) - 0.5 * 86400 * 1000))
              vm.setEndDate(new Date(brushTime[0]))
            }
            svg.select('.selection').attr('fill-opacity', 1).attr('fill', vm.brushSelectColor)
          }, 1000)
        }
      }
      // function uploaddate(selection, brushTime){
      //     console.log("dufvuu")
      //     if(selection.length >= 2){
      //         vm.setStartDate(new Date(new Date(brushTime[0]) - 0.5*86400*1000))
      //         vm.setEndDate(new Date(brushTime[brushTime.length - 1]))
      //     }else{
      //         vm.setStartDate(new Date(new Date(brushTime[0]) - 0.5*86400*1000))
      //         vm.setEndDate(new Date(brushTime[0]))
      //     }
      // }
      // svg.join('g').append('rect').attr('x', '310').attr('y', '20').attr('width', '40').attr('height', '20').attr('fill', '#ccc')
      svg
        .append('g')
        .attr('class', 'myButton')
        .attr('transform', `translate(${width - 40},${10})`)
        .append('g')
        .attr('class', 'barChange')
        .append('rect')
        .attr('width', 30)
        .attr('height', 15)
        .attr('fill', 'white')
        .attr('stroke', util.delabelColor[1])
        .attr('rx', 5)
        .attr('ry', 5)

      svg.select('.barChange')
        .append('text')
        .attr('fill', '#2c3e50')
        .text('Bar')
        .attr('text-anchor', 'middle')
        .attr('font-size', util.buttonTextAttr.baseTextAttr.fontSize)
        .attr('font-family', util.buttonTextAttr.baseTextAttr.fontFamily)
        .attr('font-weight', util.buttonTextAttr.baseTextAttr.fontWeight)
        .attr('font-style', util.buttonTextAttr.baseTextAttr.fontStyle)
        .attr('x', '13.5')
        .attr('y', '9')
        .attr('dy', '2')

      svg.select('.myButton')
        .append('g')
        .attr('class', 'areaChange')
        .append('rect')
        .attr('x', '0')
        .attr('y', '20')
        .attr('width', '30')
        .attr('height', '15')
        .attr('fill', 'white')
        .attr('stroke', util.labelColor[1])
        .attr('rx', '5')
        .attr('ry', '5')

      svg.select('.areaChange')
        .append('text')
        .text('Area')
        .attr('fill', '#2c3e50')
        .attr('font-size', util.buttonTextAttr.baseTextAttr.fontSize)
        .attr('font-family', util.buttonTextAttr.baseTextAttr.fontFamily)
        .attr('font-weight', util.buttonTextAttr.baseTextAttr.fontWeight)
        .attr('font-style', util.buttonTextAttr.baseTextAttr.fontStyle)
        .attr('text-anchor', 'middle')
        .attr('x', '14.5')
        .attr('y', '31')
      flag === 0 ? switchBar() : 1
      svg.select('.barChange').attr('cursor', 'pointer').on('click', switchBar)
      svg.select('.areaChange').attr('cursor', 'pointer').on('click', switchArea)
      svg.select('.upperRiver').attr('opacity', 0)
      function switchBar(event, d) {
        const t = d3.transition().duration(750).ease(d3.easeLinear)
        svg.select('.upperRiver').transition(d3.transition().duration(750).ease(d3.easeLinear)).attr('opacity', 0)
        svg.select('.AreaRiver').transition(d3.transition().duration(750).ease(d3.easeLinear)).attr('opacity', 0)
        svg.select('.barGroup').selectAll('g').transition(d3.transition().duration(750).ease(d3.easeLinear)).attr('opacity', 1)
        flag = 0
        svg.select('.areaChange').select('rect').attr('fill', util.buttonTextAttr.unactivated_color)
        svg.select('.areaChange').select('text').attr('fill', util.buttonTextAttr.baseTextAttr.fontColor)
        svg.select('.barChange').select('rect').attr('fill', util.buttonTextAttr.baseTextAttr.fontColor)
        svg.select('.barChange').select('text').attr('fill', util.buttonTextAttr.unactivated_color)
      }
      function switchArea() {
        const t = d3.transition().duration(2000).ease(d3.easeLinear)
        flag = 1
        svg.select('.upperRiver').transition(t).attr('opacity', 1)
        svg.select('.barChange')
          .call(g => g.select('rect').attr('fill', 'white'))
        svg.select('.AreaRiver').attr('opacity', 1)
        svg.select('.barGroup').selectAll('g').attr('opacity', 0)
        svg.select('.barChange').select('rect').attr('fill', util.buttonTextAttr.unactivated_color)
        svg.select('.barChange').select('text').attr('fill', util.buttonTextAttr.baseTextAttr.fontColor)
        svg.select('.areaChange').select('rect').attr('fill', util.buttonTextAttr.baseTextAttr.fontColor)
        svg.select('.areaChange').select('text').attr('fill', util.buttonTextAttr.unactivated_color)
      }

      function mouseover(event, d) {
        const tooltip = svg.append('g').attr('class', 'tooltip').style('font', '11px DIN')

        const path = tooltip.append('path').attr('stroke', 'rgba(148, 167, 183, 0.4)').attr('fill', 'white')

        const text = tooltip.append('text')

        const line1 = text.append('tspan').attr('x', 0).attr('y', 0)
            .style('font-family', util.sliderTooltipAttr.line1.fontFamily)
            .style('color', util.sliderTooltipAttr.line1.fontColor)
            .style('font-size', util.sliderTooltipAttr.line1.fontSize)
            .style('font-weight', util.sliderTooltipAttr.line1.fontWeight)
            .style('font-style', util.sliderTooltipAttr.line1.fontStyle)

        const line2 = text.append('tspan').attr('x', 0).attr('y', '1.3em')
            .style('font-family', util.sliderTooltipAttr.line2.fontFamily)
            .style('font-size', util.sliderTooltipAttr.line2.fontSize)
            .style('font-weight', util.sliderTooltipAttr.line2.fontWeight)
            .style('font-style', util.sliderTooltipAttr.line2.fontStyle)

        const line3 = text.append('tspan').attr('x', 0).attr('y', '2.6em')
            .style('font-family', util.sliderTooltipAttr.line3.fontFamily)
            .style('font-size', util.sliderTooltipAttr.line3.fontSize)
            .style('font-weight', util.sliderTooltipAttr.line3.fontWeight)
            .style('font-style', util.sliderTooltipAttr.line3.fontStyle)

        const line4 = text.append('tspan').attr('x', 0).attr('y', '3.9em')
            .style('font-family', util.sliderTooltipAttr.line4.fontFamily)
            .style('font-size', util.sliderTooltipAttr.line4.fontSize)
            .style('font-weight', util.sliderTooltipAttr.line4.fontWeight)
            .style('font-style', util.sliderTooltipAttr.line4.fontStyle)

        tooltip.style('display', null).attr('fill', 'white')
        line1.text(`Time : ` + brushData.endTimeOutput[d]).attr('fill', '#2c3e50')
        line2.text(`No : ` + brushData.no_flag[d]).attr('fill', util.sliderTooltipAttr.line2.fontColor)
        line3.text(`Good : ` + brushData.good_flag[d]).attr('fill', util.sliderTooltipAttr.line3.fontColor)
        line4.text(`Bad  : ` + brushData.bad_flag[d]).attr('fill', util.sliderTooltipAttr.line4.fontColor)
        const box = text.node().getBBox()
        let x = event.offsetX,
          y = event.offsetY
        if (x + box.width < width - miniMargin.right + 10) {
          path.attr(
            'd',
            `
                        M${box.x - 10},${box.y - 5}
                        h${box.width + 20}
                        v${box.height + 10}
                        h-${box.width + 20}
                        v-${box.height / 2 - 5}
                        l-15,-5l15,-5
                        V${box.y - 5}
                        z
                    `
          )
          tooltip.attr('transform', `translate(${[x + 30, y - 10]})`)
        } else {
          path.attr(
            'd',
            `
                        M${box.x - 10},${box.y - 5}
                        h${box.width + 20}
                        v${box.height / 2 - 5}
                        l15,5l-15,5
                        v${box.height / 2 + 5}
                        h-${box.width + 20}
                        V${box.y - 5}
                        z
                    `
          )
          tooltip.attr('transform', `translate(${[x - box.width - 25, y - 10]})`)
        }
        d3.select('.tooltip').raise()
      }
      function mouseout(event, d) {
        svg.selectAll('.tooltip').remove()
      }
      setInterval(function selectionOR() {
        svg.select('.selection').attr('fill-opacity', 1).attr('fill', vm.brushSelectColor)
      }, 1000)
    }
  },
  mounted() {}
}
</script>

<style scoped>
/* .domain {
    stroke: "#E6E5F0";
}
.tick line {
    stroke: "#E6E5F0";
} */
</style>
