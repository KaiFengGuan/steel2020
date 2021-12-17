import * as d3 from 'd3'
import { addElement, updateElement, updateAsyncElement, updateStyles, sortedIndex } from 'utils/element';
import clickIcon from "assets/images/wheel/fixed.svg"
// import util from 'views/baogang/util.js';
import { processIcon, colourLessIcon } from "assets/images/index.js";
export const processJson = [
  [
    'ave_temp_1', 'ave_temp_2', 'ave_temp_dis', 'ave_temp_pre', 'ave_temp_soak', 'ave_temp_entry_1', 'ave_temp_entry_2', 'ave_temp_entry_pre',
    'ave_temp_entry_soak', 'center_temp_dis', 'center_temp_entry_1', 'center_temp_entry_2', 'center_temp_entry_pre', 'center_temp_entry_soak',
    'temp_uniformity_dis', 'temp_uniformity_entry_1', 'temp_uniformity_entry_2', 'temp_uniformity_entry_pre', 'temp_uniformity_entry_soak',
    'skid_temp_dis', 'skid_temp_entry_1', 'skid_temp_entry_2', 'skid_temp_entry_pre', 'skid_temp_entry_soak', 'staying_time_1', 'staying_time_2',
    'staying_time_pre', 'staying_time_soak', 'sur_temp_dis', 'sur_temp_entry_1', 'sur_temp_entry_2', 'sur_temp_entry_pre', 'sur_temp_entry_soak',
    'meas_temp_0', 'meas_temp_1', 'meas_temp_10', 'meas_temp_11', 'meas_temp_12', 'meas_temp_13', 'meas_temp_14', 'meas_temp_15', 'meas_temp_16',
    'meas_temp_17', 'meas_temp_18', 'meas_temp_19', 'meas_temp_2', 'meas_temp_3', 'meas_temp_4', 'meas_temp_5', 'meas_temp_6', 'meas_temp_7',
    'meas_temp_8', 'meas_temp_9', 't_0', 't_1', 't_2', 't_3', 't_4', 't_5', 't_6'
  ],
  [
    'botbrplatecountfm', 'botbrplatecountrm',
    'botwrplatecountfm', 'botwrplatecountrm', 'crownbody', 'crownhead', 'crowntail', 'crowntotal', 'devcrownbody', 'devcrownhead', 'devcrowntail',
    'devcrowntotal', 'devfinishtempbody', 'devfinishtemphead', 'devfinishtemptail', 'devfinishtemptotal', 'wedgebody', 'wedgehead', 'wedgetail',
    'wedgetotal', 'devwedgebody', 'devwedgehead', 'devwedgetail', 'devwedgetotal', 'finishtempbody', 'finishtemphead', 'finishtemptail',
    'finishtemptotal'
  ],
  [
    'avg_fct', 'avg_p1', 'avg_p2', 'avg_p5', 'avg_sct', 'max_fct', 'max_p1', 'max_p2', 'max_p5', 'max_sct',
    'min_fct', 'min_p1', 'min_p2', 'min_p5', 'min_sct', 'std_fct', 'std_p1', 'std_p2', 'std_p5', 'std_sct'
  ]
]
import util from 'views/baogang/util.js';
import { divideData, arrowData, mergeColor, diagnosticSort, queryIcon } from "utils/data.js"
import {preRoll, boxplot} from './boxplot.js';
import rollData from 'views/data/rollData.json';
export function mergeBar(batchData, vm) {
  const context = {};
  const r = this._radius,
    R = r.outer + r.bubble * 1.05,
    wm = this,
    lc = this._labelcolor,
    xpad = this._xpad,
    v = this._barAngle / 2,
    mainG = this._g.append('g').attr('class', 'mainG'),
    line = d3.line().x(e => e[0]).y(e => e[1]).curve(d3.curveLinear),
    curve = d3.line().x(e => e[0]).y(e => e[1]).curve(d3.curveBumpX),
    pieAngle = d3.pie().value(d => d.angle).startAngle(0.5 * Math.PI).endAngle(2.5 * Math.PI),
    piearc = d3.arc().innerRadius(0).outerRadius(r.arc),
    dataInfo = this._indexdata;
  diagnosticSort(batchData);
  var limit = this._labelLimit,
    horizenEX = batchData.map(d => this._sliderArray(dataInfo, d))
      .map((d, i) => d.map((e, f) => {
        var temp = e.map(g => {
          g.i = i;
          return g
        })
        temp.i = i;
        temp.d = f;
        return temp
      }
      )),
    maxLength = batchData.length,  //batch numbers
    rectArray = new Array(maxLength).fill(0).map((d, i) => (batchData[i].length + 1) * 4.75),   //batch position
    rectPosition = Array.from(d3.cumsum(rectArray)),
    RectWidth = rectPosition[rectPosition.length - 1],
    minRect = RectWidth / (maxLength + 0.5),
    batchEX = this._divideBacthData(dataInfo, batchData);

  // for(let item in batchEX){

  // 	console.log('----------------------')
  // 	console.log(dataInfo[item].indexName, 'extremum_original_l', batchEX[item].flat().map(d => d.extremum_original_l))
  // 	console.log(dataInfo[item].indexName, 'original_value', batchEX[item].flat().map(d => d.original_value))
  // 	console.log(dataInfo[item].indexName, 'extremum_original_u', batchEX[item].flat().map(d => d.extremum_original_u))
  // 	console.log('----------------------')
  // }
  // console.log(batchData, horizenEX)
  // console.log(batchData, horizenEX, batchData.map(d => this._sliderArray(dataInfo, d)))
  // console.log(this._divideBacthData(dataInfo, batchData))
  var arcX = 200,
    merge_g = 0,
    plot_g = 0,
    rectX = r.outer + 280,  //rect_doct x
    chartHeight = this._sliderValue,   //rect max height
    chartPadding = { left: 1.5, right: 1.5, top: 2, bottom: 2, horizen: 3, vertical: 4 },
    boxMargin = { bottom: 5, top: 5, left: 5, right: 5, horizen: 10, vertical: 10 },
    chartMargin = 5,
    textWidth = 75,
    textMargin = { bottom: 5, top: 5, margin: 5, left: 5, right: 0, horizen: 5, vertical: 10 },
    cardWidth = boxMargin.horizen + RectWidth + textWidth + textMargin.horizen,
    cardMargin = 20;

  var rectNum = null,
    opacityCache = null,
    barVisObject = Object.assign({}, ...dataInfo.map(d => { return { [d.indexName]: this._barVis } })),
    indexArray = d3.map(dataInfo, (d, i) => i),
    indexSort = d3.map(dataInfo, d => d.indexName),
    indexScale = null,// index  --- sort
    rectHeight = null,
    yScaleCache = null,
    yScale = null,  //指标在y轴上的坐标
    startXY = null,
    centerY = null,
    lineToCircle = null,
    lineToRect = null,
    lastY = null,
    scaleArray = null;
  var mainAttrs = null, // init All Attrs
    lineAttrs = null,
    arcAttrs = null,
    cardAttrs = null,
    sliderAttrs = null,
    rectAttrs = null,
    dragAttrs = null,
    iconAttrs = null,
    sortAttrs = null,
    switchAttrs = null,
    linearGradientAttrs = null,
    mergeAttrs = null,
    horizenAttrs = null,
    barAttrs = null,
    textAttrs = null,
    heatMapAttrs = null,
    shapeAttrs = null,
    symbolAttrs = null;

  this._initSlider()

  initOrdinal.call(this);
  renderyScale();
  initAttrs.call(this); //init Element Attrs

  initConstant.call(this);	//init constant
  initBackG();	//init defs and background

  var lineG = mainG.append('g').attr('class', 'lineG'),
    arcG = mainG.append('g').attr('class', 'arcG');
  initLineG.call(this);
  initArcG.call(this);

  var cardG = mainG.append('g').attr('class', 'cardG');
  initCardG.call(this);

  var sliderG = mainG.append('g').attr('class', 'sliderG').attr('transform', sliderAttrs.transform);

  sliderG.append('rect')
    .attr('fill', 'white')
    .attr('transform', `translate(${[0, -wm._height / 2]})`)
    .attr('height', wm._height)
    .attr('width', RectWidth)
    .attr('stroke', 'none')
    .attr('class', 'backRect')

  var rectG = mainG.append('g').attr('class', 'rectG');

  var dragG = sliderG.append('g').attr('class', 'dragG');
  initDragG();
  var timeScale;
  //https://observablehq.com/d/d503153fbfd48b03

  var gradientG = sliderG.append('g').attr('class', 'gradientG');
  initLinearGradient();

  var mergeG = sliderG.append('g').attr('class', 'mergeG');
  var horizenG = sliderG.append('g').attr('class', 'horizenG');
  wm._horizonView ? initMergeArea() : initHorizenArea();
  if (rectArray.some(d => d === chartHeight)) initRectG()
  // initAxisG(timeScale);

  var triangleG = mainG.append('g').attr('class', 'triangleG');
  initTriangleG();

  var barG = mainG.append('g').attr('class', 'barG');
  initBarG.call(this);

  var symbolG = mainG.append('g').attr('class', 'symbolG');
  initSymbol.call(this);

  var mouseInfo = this._mouseDis !== undefined ? mouseText(this._mouseDis) : undefined,
    textG = sliderG.append('g').attr('class', 'textG');
  initMouseG();

  let sortG = this._staticGroup.append('g').attr('class', 'sortG');
  initSort.call(this);

  const switchG = this._staticGroup.append('g').attr('class', 'switchG');
  initSwitch.call(this);

  const visG = this._staticGroup.append('g').attr('class', 'visG');
  initVisG.call(this);

  const shapeGroup = sliderG.append('g').attr('class', 'shapeGroup');
  initShape();
  // const 
  // const heatMapG = mainG.append('g').attr('class', 'heatMapGroup');
  // initMapArea()
  // heatMapG.raise();

  renderSort()
  
  const plot_offset = { h: chartHeight * 1.5, w: chartHeight * 1.5/ 200 * 1000, gap: 20},
    plot_coordinate = [rectX + RectWidth + boxMargin.left + textMargin.horizen + textWidth + 50,-wm._height / 2],
    plotG = mainG.append('g').attr('class', 'plotGroup').attr('transform', `translate(${plot_coordinate})`),
    rollKeys = ['bendingforce', 'bendingforcebot', 'bendingforcetop','rollforce', 'rollforceds', 'rollforceos',
      'screwdown','shiftpos', 'speed', 'torque', 'torquebot', 'torquetop'],
    rollValues = new Array(rollKeys.length).fill(0).map(() => Math.random()),
    boxPlotBroderAttrs = {
      height: plot_offset.h,
      width: plot_offset.w,
      rx: this._borderStyle.rx,
      ry: this._borderStyle.ry,
      'stroke-width': 0.25,
      fill: 'none',
      filter: 'url(#card-shadow)',
      stroke: this._borderStyle.color
    },
    boxPlotAttrs = {
      id: d => d,
      class: 'plotChart'
      // class: 
    },
    plotGroupAttrs = {};
  let plotGroup = null;

  function scalePlotY() {
    let order = d3.scaleOrdinal().domain(rollKeys).range(sortedIndex(rollValues)),
      rectHeight = new Array(rollValues.length).fill(plot_offset.h + plot_offset.gap);
    rectHeight.unshift(0)   //定位第一个元素
    let yCoordinate = Array.from(d3.cumsum(rectHeight)),
    plot_num = Math.floor((this._height + plot_offset.gap)/(plot_offset.gap + plot_offset.h));
    plotGroupAttrs.display = d => plot_g <= order(d) && order(d) < plot_num + plot_g ? 'block' : 'none';
    let baseHeight = yCoordinate[0] - yCoordinate[plot_g];
    plotGroupAttrs.transform = d => `translate(${[0, yCoordinate[order(d)] + baseHeight]})`;
  }
  scalePlotY.call(this);
  initPlotG.call(this);

  // const iconG = mainG.append('g')
  //   // .attr('transform', textAttrs.position)
  //   .attr('transform', (d, i) => `translate(${[mouseInfo ? wm._mouseDis : 0, 0]})`)
  //   .attr('class', 'iconClass');
  // iconG
  //   .call(g => g.append('line')
  //   .attr('y1', textAttrs.line0)
  //   .attr('y2', textAttrs.line1)
  //   .attr('stroke', '#bbbcbd')
  //   .attr('stroke-width', 0.25))
  //   .call(g => g.append('image')
  //   .attr('width', '25px')
  //   .attr('height','25px')
  //   // .attr('transform', `translate(${[-45, -12.5]})`)
  //   .attr('href', clickIcon))
  // clickIcon
  function initPlotG(){
    plotG
    .append('rect')
    .attr('fill', 'white')
    .attr('stroke', 'none')
    .attr('width', boxPlotBroderAttrs.width)
    .attr('height', this._height);
    plotGroup = plotG.selectAll('g')
    .data(rollKeys)
    .join('g')
    .call(g => updateElement(g, plotGroupAttrs))
    plotGroup
      .call(g => addElement(g, 'rect', boxPlotBroderAttrs))
      .call(g => addElement(g, 'g', boxPlotAttrs));
    var plotCharts = rollKeys.map(d => {
      let res = new boxplot(plotG.select(`#${d}`)).enter({
        data: rollData[d],
        func: preRoll,
        width: plot_offset.w,
        height: plot_offset.h
      }).render()
      return res;
    })
      plotG
      .on('wheel', function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (plot_g < rollKeys.length - 1 && plot_g > 0) {
          plot_g += (e.deltaY > 0 ? 1 : -1);
        } else if (plot_g == 0) {
          plot_g += (e.deltaY > 0 ? 1 : 0);
        } else if (plot_g == rollKeys.length - 1) {
          plot_g += (e.deltaY > 0 ? 0 : -1);
        } else {
          return
        }
        const t = d3.transition()
          .duration(300)
          .ease(d3.easeLinear);
        scalePlotY.call(wm);
        plotGroup.transition(t)
          .call(g => updateElement(g, plotGroupAttrs))
      })
      .on('mouseover', function (e) { })
      .on('mouseout', function (e) { });
  }
  function initAttrs() {
    // clearAttrs();
    const textX = rectX + boxMargin.left + textMargin.left,
      chartStart = boxMargin.left + textMargin.horizen + textWidth;
    lineAttrs = {
      lineStroke: d => d3.color(lc[d.month]).darker(0.5),
      lineStrokeWidth: 1,
      numberTransform: d => `translate(${[rectX - arcX, centerY(d) + 2.5]})`,
      numberText: (d, i) => +indexScale(i) + 1,
      circleTransform: d => `translate(${[rectX - arcX, centerY(d)]})`,
      circleStroke: d => d3.color(lc[d.month]).darker(0.5),
      circleFill: d => lc[d.month],
      indexTransform: d => `translate(${[rectX - arcX + 35, centerY(d) + 2]})`,
      indexFill: d => d3.color(lc[d.month]).darker(0.5)
    }
    cardAttrs = {
      position: `translate(${[rectX, 0]})`,
      opacity: opacityCache,
      transform: (d, i) => `translate(${[0, yScale(i) - chartHeight - boxMargin.top - chartMargin / 2]})`,
      rectHeight: d => (barVisObject[d.indexName] ? 2 : 1) * chartHeight + boxMargin.top + boxMargin.bottom + chartMargin * (barVisObject[d.indexName] ? 1 : 0),
      rectWidth: cardWidth,
      lineOpacity: d => barVisObject[d.indexName] ? 'visible' : 'hidden',
      lineStroke: d => d3.color(lc[d.month]).darker(0.5),
      lineY1: chartHeight * 0.3,
      lineStrokeWidth: 1.5,
      indexNameTransform: (d, i) => `translate(${[boxMargin.left + textMargin.left, boxMargin.top / 2]})`,
      indexShadowTransform: `translate(${[boxMargin.left + textMargin.left - 4, boxMargin.top / 2 - 5]})`,
      mergeTransform: `translate(${[chartStart, chartHeight + boxMargin.top + chartMargin + chartPadding.top]})`,
      shapeTransform: `translate(${[chartStart, boxMargin.top]})`,
      mergeWidth: RectWidth,
      mergeHeight: chartHeight - chartPadding.vertical,
      shapeHeight: chartHeight - chartPadding.vertical,
      shapeWidth: RectWidth,
      merge_visible: d => barVisObject[d.indexName] ? 1 : 0
    }
    cardAttrs.lineY2 = cardAttrs.rectHeight;
    arcAttrs = {
      transform: d => `translate(${[rectX - arcX + 20, centerY(d)]})`,
      stroke: d => d3.color(lc[+d.data.process]).darker(2),
      fill: d => ((+d.data.value) > limit[d.data.limit] ? lc[+d.data.process] : 'white'),
      stroke_width: 0.25,
    }
    sliderAttrs = {
      transform: `translate(${[rectX + chartStart, 0]})`
    }
    dragAttrs = {
      transform: d => `translate(${[rectPosition[d], 0]})`,
      dragelementTrans: (d, i) => `translate(${[0, yScale(i)]})`,
      opacity: opacityCache,
      dragHeight: chartHeight,
      dragYlevel: -chartHeight
    }
    iconAttrs = {
      position: `translate(${[rectX + chartStart + RectWidth - chartHeight, 0]})`,
      transform: (d, i) => `translate(${[0, yScale(i) - chartHeight - 10 - boxMargin.top - chartMargin / 2]})`,
      opacity: opacityCache,
      elementOpacity: d => barVisObject[d.indexName] ? 'visible' : 'hidden',
      rectTransform: `translate(${[chartHeight / 2, chartHeight / 2]})`,
      rectFill: d => lc[d.month],
      icon: d => barVisObject[d.indexName] ? 'M-5,-2.5l10,0l-5,5l-5,-5zM-5,-2.5z' : 'M-2.5,0l0,-5l5,5l-5,5zM-2.5,0z'
    }
    sortAttrs = {
      transform: d => `translate(${[340 + d * 60, -this._height / 2 + 2.5]})`,
      text: ['Single', 'Indicators', 'Total'],
      sortColor: this._buttonColor,
      sortChange: (value1, value2) => d => d === (this._indexScale !== undefined ? this._indexScale : 0) ? value1 : value2
    },
      switchAttrs = {
        transform: d => `translate(${[160 + 60 * (1 - d), - this._height / 2 + 2.5]})`,
        text: ['Horizon', 'River'],
        color: this._buttonColor,
        colorfunc: (v1, v2) => d => this._horizonView == Boolean(d) ? v1 : v2
      }
    mergeAttrs = {
      transform: (d, i) => `translate(${[(i == 0 ? 0 : rectPosition[i - 1]), 0]})`,
      elementOpacity: (d, i) => barVisObject[d[0][0].indexName] ? opacityCache(d, i) : 0,
      elementTrans: (d, i) => `translate(${[0, yScale(i) + chartHeight]})`,
    }
    Object.assign(mergeAttrs, areaParameter(rectArray, horizenEX))

    horizenAttrs = {
      // transform: (d, i) =>`translate(${[i== 0 ? 0 : rectPosition[i -1 ] + chartStart, 0]})`,
      elementOpacity: (d, i) => barVisObject[d[0].indexName] ? opacityCache(d, i) : 0,
      elementTrans: (d, i) => `translate(${[0, yScale(i) + chartPadding.top + chartMargin / 2]})`,
      overlap: 3,   //horizen layer
      overlapNum: [-1, -2, -3, 0, 1, 2],
      overHeight: [-3, -2, -1, 1, 2, 3].map(d => d * cardAttrs.mergeHeight),
      elementHeight: cardAttrs.mergeHeight
    }
    horizenAttrs.horizenArea = horizenParameter();
    horizenAttrs.horizenColor = i => ['#e34649', '#f7a8a9', '#fcdcdc', '#f7f7f7', '#fcdcdc', '#f7a8a9', '#e34649'][i + (i >= 0) + horizenAttrs.overlap];
    barAttrs = {
      position: `translate(${[rectX + boxMargin.left, chartMargin / 2]})`,
      transform: (d, i) => `translate(${[chartPadding.left, yScale(i) + chartPadding.top]})`,
      opacity: (d, i) => barVisObject[d.indexName] ? opacityCache(d, i) : 0,
      borderHeight: chartHeight - chartPadding.vertical,
      borderWidth: textWidth - chartPadding.horizen
    }
    Object.assign(barAttrs, initBarData())
    barAttrs.border = {
      class: 'border',
      height: barAttrs.borderHeight,
      width: barAttrs.borderWidth,
      stroke: d => lc[d.month],
      fill: 'white',
      'stroke-width': 0.25
    };
    barAttrs.goodSteel = {
      fill: this._flagColor[1],
      x: d => barAttrs.barXscale[d.index](d.x0),
      height: d => barAttrs.barYscale[d.index](d.length),
      width: d => barAttrs.barXscale[d.index](d.x1) - barAttrs.barXscale[d.index](d.x0),
      y: d => barAttrs.borderHeight - barAttrs.barYscale[d.index](d.length),
      opacity: 1
    },
    barAttrs.badSteel = {
      fill: this._flagColor[0],
      x: d => barAttrs.barXscale[d.index](d.x0),
      height: d => barAttrs.barYscale[d.index](d.length),
      width: d => barAttrs.barXscale[d.index](d.x1) - barAttrs.barXscale[d.index](d.x0),
      y: d => barAttrs.borderHeight - barAttrs.barYscale[d.index](d.length),
      opacity: 1
    };
    textAttrs = {
      position: `translate(${[0, 0]})`,
      line0: yScale(0) - chartHeight,
      line1: lastY,
      opacity: (d, i) => opacityCache(d, i),
      transform: (d, i) => `translate(${[mouseInfo ? wm._mouseDis + 30 : 0, yScale(i) + (barVisObject[d.indexName] ? chartHeight / 2 : -chartHeight / 2)]})`,
      text: (d, i) => mouseInfo !== undefined ? (+mouseInfo[i]).toFixed(2) : ''
    }
    heatMapAttrs = {
      position: `translate(${[rectX + chartStart, 0]})`,
      transform: (d, i) => `translate(${[i == 0 ? 0 : rectPosition[i - 1], 0]})`,
      opacity: opacityCache,
      elementTrans: (d, i) => `translate(${[0, yScale(i)]})`,
      rectHeight: chartHeight / 2,
      qY: -chartHeight / 2,
      t2Y: -chartHeight
    };
    Object.assign(heatMapAttrs, heatMapParameter(rectArray, horizenEX))

    rectAttrs = {
      transform: (d, i) => `translate(${[0, yScale(i) - chartHeight]})`,
      rectHeight: chartHeight,
      rectWidth: chartHeight,
      opacity: opacityCache
    };
    let baseRadius = 2;
    shapeAttrs = {
      transform: (d, i) => `translate(${[0, yScale(i) - chartHeight / 2]})`,
      batch: batchEX.map(d => arrowData(d.flat())),
      elementOpacity: opacityCache,
      elementTrans: d => `translate(${[mergeAttrs.translateX[d.i](d.time) - 0.75 * baseRadius, 0 - 0.75 * baseRadius]})`,
      arrowTrans: d => `translate(${[mergeAttrs.translateX[d.i](d.time), 0]})`,
      interArrow: d => `translate(${[(mergeAttrs.translateX[d[0].i](d[0].time) + mergeAttrs.translateX[d[d.length - 1].i](d[d.length - 1].time)) / 2, 0]})`,
      startRibbon: d => `translate(${[mergeAttrs.translateX[d[0].i](d[0].time), 0]})`,
      endRibbon: d => `translate(${[mergeAttrs.translateX[d[d.length - 1].i](d[d.length - 1].time), 0]})`,
      interLineTrans: d => `translate(${[mergeAttrs.translateX[d[0].i](d[0].time), 0 - 0.75 * baseRadius]})`,
      interLen: d => mergeAttrs.translateX[d[d.length - 1].i](d[d.length - 1].time) - mergeAttrs.translateX[d[0].i](d[0].time)
    }
    console.log(batchEX)
    console.log(shapeAttrs.batch)
    const arrowScale = d3.scaleLinear().domain([-3, 3]).range([10, -10]);
    shapeAttrs.multiAttrs = {	//multivariate
      fill: 'green',//util.delabelColor[0],//mergeColor[0],
      stroke: 'none',
      height: baseRadius * 1.25,
      transform: shapeAttrs.elementTrans,
      width: baseRadius * 1.25
    },
      shapeAttrs.singleAttrs = {
        transform: shapeAttrs.arrowTrans,
        stroke: mergeColor[0],
        fill: 'none',
        'marker-end': 'url(#shape-arrow)',
        d: e => d3.linkVertical().x(d => d.x).y(d => d.y)({ source: { x: 0, y: e.ovrage ? (e.range > 0 ? -baseRadius : baseRadius) : 0 }, target: { x: 0, y: arrowScale(e.range) } })
      }

    symbolAttrs = {
      position: `translate(${[rectX + boxMargin.left, - chartHeight - chartMargin / 2]})`,
      transform: (d, i) => `translate(${[chartPadding.left + textWidth, yScale(i)]})`,
      opacity: opacityCache,
      borderHeight: chartHeight - chartPadding.vertical,
      borderWidth: textWidth - chartPadding.horizen,
      borderStroke: (d, i) => lc[dataInfo[i].month],
      rectHeight: chartHeight / 4,
      singleNum: d3.map(batchEX, d => d.flat().filter(e => e.dia_Status).length),
      multiNum: d3.map(batchEX, d => d.flat().filter(e => e.ovrage).length)
    }
    let position = [5, (chartHeight - chartPadding.vertical) / 2 + 5],
      singleScale = d3.scaleLinear().domain([0, d3.max(symbolAttrs.singleNum)]).range([0, symbolAttrs.borderWidth / 2]),
      multiScale = d3.scaleLinear().domain([0, d3.max(symbolAttrs.multiNum)]).range([0, symbolAttrs.borderWidth / 2]),
      siTransform = (d, i) => `translate(${[-singleScale(symbolAttrs.singleNum[i]), position[1 - wm._indexScale]]})`,
      muTransform = (d, i) => `translate(${[- multiScale(symbolAttrs.multiNum[i]), position[wm._indexScale]]})`,
      rectColor = wm._indexScale === 0 ? [util.delabelColor[0], 'url(#sort_pattern)'] : ['url(#sort_pattern)', util.delabelColor[0]];
    if (wm._indexScale === 2) {
      siTransform = (d, i) => `translate(${[-symbolAttrs.borderWidth / 2 - singleScale(symbolAttrs.singleNum[i]), d3.mean(position)]})`;
      muTransform = (d, i) => `translate(${[-symbolAttrs.borderWidth / 2, d3.mean(position)]})`;
      rectColor = ['url(#sort_pattern)', 'url(#sort_pattern)'];
    }
    symbolAttrs.sIndice = {	//singleIndice
      transform: siTransform,
      class: 'single',
      width: (d, i) => singleScale(symbolAttrs.singleNum[i]),
      height: symbolAttrs.rectHeight,
      fill: rectColor[0],	//util.delabelColor[0]
      stroke: 'none'
    },
    symbolAttrs.sText = {	//singleIndice
      x: -10,
      class: 'singleText',
      y: position[1 - wm._indexScale] + 9,
      text: (d, i) => symbolAttrs.singleNum[i],
      fill: 'rgb(142, 154, 164)',
      'font-weight': 'normal',
      'font-style': 'normal',
      'font-size': 11,
      'text-anchor': 'middle'
    },
    symbolAttrs.mIndice = {	//multivariateAttrs
      transform: muTransform,
      class: 'multivariate',
      width: (d, i) => multiScale(symbolAttrs.multiNum[i]),
      height: symbolAttrs.rectHeight,
      fill: rectColor[1],
      stroke: 'none'
    },
    symbolAttrs.mText = {	//multivariateAttrs
      // transform: muTransform,
      x: -10,
      class: 'multiText',
      y: position[wm._indexScale] + 9,
      text: (d, i) => symbolAttrs.multiNum[i],
      fill: 'rgb(142, 154, 164)',
      'font-weight': 'normal',
      'font-style': 'normal',
      'font-size': 11,
      'text-anchor': 'middle'
    };
    // const 
    // symbolAttrs.scale = {

    // }
    // const yScale = d3.scaleBand()
    //         .domain(target.map(d => targetMap[d].name))
    //         .range([0, width - headHeight])
    //         .padding(0.35);
    //       const yAxis = d3.axisLeft(yScale)
    //         .tickSizeOuter(0);
  }
  function initConstant() {
    mainAttrs = {
      // transform: [rectX, -this._height / 2],
      width: RectWidth,
      height: this._height,
      fill: 'white',
      stroke: 'none'
    }
  }
  function initBackG() {
    mainG
      .call(g => addElement(g, 'rect', mainAttrs));

    mainG.on('wheel', function (e) {
      e.stopPropagation();
      e.preventDefault();
      if (merge_g < dataInfo.length - 1 && merge_g > 0) {
        merge_g += (e.deltaY > 0 ? 1 : -1);
      } else if (merge_g == 0) {
        merge_g += (e.deltaY > 0 ? 1 : 0);
      } else if (merge_g == dataInfo.length - 1) {
        merge_g += (e.deltaY > 0 ? 0 : -1);
      } else {
        return
      }
      renderyScale();
      renderSort();
      wm._filter_status ? wm._renderWheelFilter() : undefined
    })
      .on('mouseover', function (e) { })
      .on('mouseout', function (e) { });

    initSymbolDefs();
    initArrow();
  }
  function initSymbolDefs() {
    mainG.call(g => g.append('defs')
      .append('pattern')
      .attr('id', 'sort_pattern')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternTransform', 'rotate(45)')
      .attr('width', 5)
      .attr('height', 5)
      .call(g => g.append('rect')
        .attr('width', 5)
        .attr('height', 5)
        .attr('fill', util.delabelColor[0]))
      .call(g => g.append('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', 5)
        .attr('stroke', 'white')
        .attr('stroke-width', 4)
        .attr('stroke-opacity', 1)
        .attr('fill', util.delabelColor[0])))
  }
  function initArrow() {
    const markerBoxWidth = 5;
    const markerBoxHeight = 5;
    const refX = markerBoxWidth / 2;
    const refY = markerBoxHeight / 2;
    const markerWidth = markerBoxWidth / 2;
    const markerHeight = markerBoxHeight / 2;
    const arrowPoints = [[0, 0], [0, 5], [5, 2.5]];
    // const markerBoxWidth = 4,
    //   markerBoxHeight = 4,
    //   refX = markerBoxWidth / 2,
    //   refY = markerBoxHeight / 2,
    //   arrowPoints = [[0, 0], [0, markerBoxHeight], [markerBoxWidth, refY]];
    mainG.call(g => g.append('defs')
      .append('marker')
      .attr('id', 'shape-arrow')
      .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
      .attr('refX', refX)
      .attr('refY', refY)
      .attr('markerWidth', markerBoxWidth)
      .attr('markerHeight', markerBoxHeight)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', d3.line()(arrowPoints))
      .attr('fill', util.labelColor[0])
      .attr('stroke', mergeColor[0]))
  }
  function initOrdinal() {
    //     totalSort = d3.map(d3.sort(dataInfo, d => -d.precipitation), d => d.indexName),
    //     totalArray = d3.map(indexSort, d => totalSort.indexOf(d));
    // var scaleArray = [d3.scaleOrdinal().domain(indexArray).range(sortArray), d3.scaleOrdinal().domain(indexArray).range(sortArray), d3.scaleOrdinal().domain(indexArray).range(totalArray)];
    var timeArray = batchData.map(d => d[0].toc),
      batchIndex;
    for (let item in timeArray) {
      if (timeArray[item] >= vm.steeltoc) {
        batchIndex = item
        break
      }
    }
    var singleNum = d3.map(batchEX, (d, i) => [d.flat().filter(e => e.ovrage).length, i]);
    singleNum.sort((a, b) => b[0] - a[0]);
    singleNum.forEach((d, i) => {
      d[0] = i;
    });
    singleNum.sort((a, b) => a[1] - b[1]);
    var multiNum = d3.map(batchEX, (d, i) => [d.flat().filter(e => e.dia_Status).length, i]);
    multiNum.sort((a, b) => b[0] - a[0]);
    multiNum.forEach((d, i) => {
      d[0] = i;
    });
    multiNum.sort((a, b) => a[1] - b[1]);
    var selfBatch = horizenEX[batchIndex];
    // var oversort = d3.map(d3.sort(selfBatch, d => -d3.mean(d, e => e.over)), d => d[0].indexName),
    // 		overArray = d3.map(indexSort, d => oversort.indexOf(d)),
    // 		Qsort = d3.map(d3.sort(selfBatch, d => -d3.mean(d, e => e.Q)), d => d[0].indexName),
    // 		QArray = d3.map(indexSort, d => Qsort.indexOf(d));
    var T2sort = d3.map(d3.sort(selfBatch, d => -d3.mean(d, e => e.T2)), d => d[0].indexName),
      T2Array = d3.map(indexSort, d => T2sort.indexOf(d));

    scaleArray = [
      d3.scaleOrdinal().domain(indexArray).range(singleNum.map(d => d[0])),
      d3.scaleOrdinal().domain(indexArray).range(multiNum.map(d => d[0])),
      d3.scaleOrdinal().domain(indexArray).range(T2Array)
    ];
    indexScale = this._indexScale !== undefined ? scaleArray[this._indexScale] : scaleArray[0];
  }
  function renderyScale() {
    let invert = d3.scaleOrdinal().domain(indexScale.range()).range(indexScale.domain())
    rectHeight = indexArray.map((d, i) => (barVisObject[indexSort[invert(+d)]] ? 2 : 1) * chartHeight + boxMargin.vertical + cardMargin)
    // console.log(rectHeight)
    rectHeight.unshift(0)   //定位第一个元素
    yScaleCache = Array.from(d3.cumsum(rectHeight)).map(d => -wm._height / 2 + 2 * chartHeight + d);
    rectNum = yScaleCache.filter(d => d < wm._height / 2 - chartHeight).length;
    opacityCache = (d, i) => merge_g <= indexScale(i) && indexScale(i) < rectNum + merge_g ? 1 : 0;
    var baseHeight = yScaleCache[0] - yScaleCache[merge_g];
    yScale = i => yScaleCache[indexScale(i)] + baseHeight;
    startXY = d => [R * (Math.sin(xpad[d.month](d.date) + v)), -R * Math.cos(Math.abs(xpad[d.month](d.date) + v))];
    centerY = d => startXY(d)[1] + 25 / startXY(d)[0] * startXY(d)[1];
    lastY = wm._height / 2 - chartHeight;
    lineToRect = (d, i) => {
      let cy = centerY(d),
        endY = yScale(+i) - chartHeight * 0.4;
      return [[rectX - arcX + 75, cy], [rectX - arcX + 85, cy], [rectX, endY]]
    };
    lineToCircle = d => {
      let [startX, startY] = startXY(d),
      cy = centerY(d);
      return [[startX, startY], [startX + 25, cy], [rectX - arcX + 30, cy]]
    };
    initAttrs.call(wm);
  }
  function initTriangleG() {// init triangleG
    triangleG.attr('transform', iconAttrs.position)
      .selectAll('g')
      .data(dataInfo)
      .join('g')
      .attr('class', 'iconElement')
      .attr('opacity', iconAttrs.opacity)
      .attr('transform', iconAttrs.transform)
      .call(g => g.append('circle').attr('transform', 'translate(10, 10)')
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-width', 0.25)
        .attr('filter', 'url(#card-shadow)')
        .attr('r', 10))
      .call(g => g.append('g').attr('transform', 'scale(0.02)')
        .call(g => g.append('path').attr('d', queryIcon[0]).attr('fill', '#0B72B6'))
        .call(g => g.append('path').attr('d', queryIcon[1]).attr('fill', '#0B72B6')))
      .on('click', function (e, d) {
        const t = d3.transition()
          .duration(300)
          .ease(d3.easeLinear);
        barVisObject[d.indexName] = !barVisObject[d.indexName];
        renderyScale();
        renderSort();
      })
  }
  function initLineG() {
    lineG.selectAll('g').data(dataInfo).join('g')
      .attr('opacity', opacityCache)
      .call(g => g.append('path')
        .attr('stroke', lineAttrs.lineStroke)
        .datum(lineToCircle)
        .attr('d', d => line(d))
        .attr('stroke-width', lineAttrs.lineStrokeWidth)
        .attr('fill', 'none'))
      .call(g => g.append('circle')
        .attr('fill', lineAttrs.circleFill)
        .attr('r', r.arc)
        .attr('stroke', lineAttrs.cIrcleStroke)
        .attr('transform', lineAttrs.circleTransform))
      .call(g => g.append('text')
        .attr('class', 'sortIndex')
        .text(lineAttrs.numberText)
        .attr('transform', lineAttrs.numberTransform))
      .call(g => g.append('text')
        .attr('font-size', '8px')
        .attr('class', d => `indexName arctext${d.month}`)
        .attr('id', d => `arctext${d.indexName}`)
        .attr('fill', lineAttrs.indexFill)
        .text(d => d.indexName.replace(/thickness/, '').replace(/temp_uniformity_/, '').replace(/wedge/, '').slice(0, 8))
        .attr('transform', lineAttrs.indexTransform))
      .call(g => g.append('path')
        .attr('class', 'lineToRect')
        .attr('stroke', lineAttrs.lineStroke)
        .attr('d', (d, i) => curve(lineToRect(d, i)))
        .attr('stroke-width', lineAttrs.lineStrokeWidth)
        .attr('fill', 'none')
        .on('mouseover', this._stopPropagation)
        .on('mouseout', this._stopPropagation))
    // .on('mouseover', (e, d) => {
    // 	this._overed(e, d.indexName, d.month)
    // })
    // .on('mouseout', (e, d) => {
    // 	this._outed(e, d.indexName, d.month)
    // })
  }
  function initArcG() {
    arcG.selectAll('g').data(dataInfo)
      .join('g')
      .attr('transform', arcAttrs.transform)
      .attr('opacity', opacityCache)
      .call(g => g.selectAll('path').data(d => pieAngle(d.property))
        .join('path')
        .attr('d', piearc)
        .attr('fill', arcAttrs.fill)
        .style('stroke', arcAttrs.stroke)
        .attr('opacity', 1)
        .style('stroke-width', arcAttrs.stroke_width)
      )
  }
  function initCardG() {
    cardG
      .attr('transform', cardAttrs.position)
      .selectAll('g').data(dataInfo).join('g')
      .attr('opacity', cardAttrs.opacity)
      .attr('transform', cardAttrs.transform)
      .call(g => g.append('rect')
        .attr('class', 'outer')
        .attr('height', cardAttrs.rectHeight)
        .attr('width', cardAttrs.rectWidth)
        .attr('stroke', this._borderStyle.color)
        .attr('filter', 'url(#card-shadow)')
        .attr('stroke-width', 0.25)
        .attr('rx', this._borderStyle.rx)
        .attr('ry', this._borderStyle.ry)
        .attr('fill', 'none'))
      .call(g => g.append('line')	//粗线
        .attr('visibility', cardAttrs.lineOpacity)
        .attr('y1', cardAttrs.lineY1)
        .attr('y2', cardAttrs.lineY2)
        .attr('stroke', cardAttrs.lineStroke)
        .attr('stroke-width', cardAttrs.lineStrokeWidth))
      // .call(g => g.append('line')
      // 	.attr('x1', 0.25)
      // 	.attr('y1', chartHeight + boxMargin.top + chartMargin/2)
      // 	.attr('y2', chartHeight + boxMargin.top + chartMargin/2)
      // 	.attr('x2', cardAttrs.rectWidth - 0.25)
      // 	.attr('stroke-width', 0.25)
      // 	.attr('stroke', this._borderStyle.color))
      .call(g => g.append('rect')
        .attr('class', 'shapeCard')
        .attr('transform', cardAttrs.shapeTransform)
        .attr('height', cardAttrs.shapeHeight)
        .attr('width', cardAttrs.shapeWidth)
        .attr('stroke', this._borderStyle.color)
        .attr('stroke-width', 0.25)
        .attr('fill', 'none'))
      .call(g => g.append('rect')
        .attr('class', 'mergeCard')
        .attr('opacity', cardAttrs.merge_visible)
        .attr('transform', cardAttrs.mergeTransform)
        .attr('height', cardAttrs.mergeHeight)
        .attr('width', cardAttrs.mergeWidth)
        .attr('stroke', this._borderStyle.color)
        .attr('stroke-width', 0.25)
        .attr('fill', 'none'))
      .call(g => g.append('rect')
        .attr('height', 5)
        .attr('width', d => d.indexName.length * 6.3 + 12)
        .attr('transform', cardAttrs.indexShadowTransform)
        .attr('fill', 'white')
      )
      .call(g => g.append('text')
        .attr('class', 'cardName')
        .attr('transform', cardAttrs.indexNameTransform)
        .text(d => d.indexName)
        .attr('text-anchor', 'start')
        .attr('fill', d => d3.color(lc[d.month]).darker(1)))
    // .on('mouseover', (e, d) => {
    //   this._overed(e, d.indexName, d.month)
    // })
    // .on('mouseout', (e, d) => {
    //   this._outed(e, d.indexName, d.month)
    // })
  }
  function updateCardG(t) {
    cardG
      .transition(t)
      .call(g => g.selectAll('g').attr('opacity', cardAttrs.opacity).attr('transform', cardAttrs.transform))
      .call(g => g.selectAll('.outer').attr('height', cardAttrs.rectHeight))
      .call(g => g.selectAll('line').attr('y2', cardAttrs.lineY2))
    // console.log('mergeCard', cardG.selectAll('.mergeCard'))
    // console.log('mergeCard', cardG)
    mainG.transition(t).selectAll('.mergeCard').attr('opacity', cardAttrs.merge_visible).attr('transform', cardAttrs.mergeTransform)
  }
  function initDragG() {
    dragG.selectAll('dragGroup')
      .data(Object.keys(rectPosition).slice(0, -1)).join('g')
      .attr('class', 'dragGroup')
      .attr('transform', dragAttrs.transform)
      .call(g => g
        .call(g => g.selectAll('g')
          .data(dataInfo)
          .join('g')
          .attr('class', 'dragElement')
          .attr('opacity', dragAttrs.opacity)
          .attr('transform', dragAttrs.dragelementTrans)
          .call(g => g.append('line')
            .attr('y1', chartMargin / 2 + chartPadding.top)
            .attr('stroke', '#d4dade')
            .attr('class', 'mergeDrag')
            .attr('opacity', cardAttrs.merge_visible)
            .attr('stroke-width', 2)
            .attr('y2', dragAttrs.dragHeight - chartPadding.bottom)
            .attr('stroke-dasharray', '6 6'))
          .call(g => g.append('line')
            .attr('y1', -dragAttrs.dragHeight)
            .attr('stroke', '#d4dade')
            .attr('stroke-width', 2)
            .attr('y2', -chartMargin / 2)
            .attr('stroke-dasharray', '6 6'))
          .call(g => g.append('rect')
            .attr('width', 3)
            .attr('x', -1.5)
            .attr('fill', 'white')
            .attr('y', dragAttrs.dragYlevel)
            .attr('height', dragAttrs.dragHeight)
            .attr('opacity', 0)))
        .call(d3.drag()
          .on('drag', dragMove)
        ))
  }
  function dragMove(e, d) {    //update batch
    rectPosition[d] = e.x
    rectPosition = Array.from(rectPosition);
    rectPosition.unshift(0);
    var rectlength = d3.pairs(rectPosition, (a, b) => b - a).filter((d, i) => i + 1 !== Math.ceil(maxLength / 2));
    if (!rectlength.every(d => d > chartHeight - 5)) {   //RectWidth/ maxLength/2
      minRect = chartHeight
    } else {
      minRect = (minRect == d3.min(rectlength)) ? d3.max(rectlength) : d3.min(rectlength);
    }
    if (RectWidth - (maxLength - 1) * minRect < RectWidth / maxLength) minRect = (RectWidth - RectWidth / maxLength) / (maxLength - 1)
    rectArray = new Array(maxLength).fill(minRect).map((d, i) => Math.ceil(maxLength / 2) == i + 1 ? RectWidth - (maxLength - 1) * minRect : d);
    rectPosition = d3.cumsum(rectArray)
    dragG.selectAll('.dragGroup')
      // .transition(d3.transition()
      //     .duration(200)
      //     .ease(d3.easeLinear))
      .attr('transform', d => `translate(${[rectPosition[d], 0]})`)
    initAttrs.call(wm);
    updateArea();
    updateShape();
    renderAxisG(timeScale);
    minRect !== chartHeight ? rectG.selectAll('g').remove() : initRectG();
  }
  function initSort() {//init sortG
    sortG.selectAll('g')
      .data([0, 1, 2])
      .join('g')
      .attr('transform', sortAttrs.transform)
      .call(g => g.append('rect')
        .attr('fill', sortAttrs.sortChange(sortAttrs.sortColor, '#fff'))
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('stroke', sortAttrs.sortColor)
        .attr('stroke-width', 0.5)
        .attr('height', this._buttonStyle.height)
        .attr('width', this._buttonStyle.width))
      .call(g => g.append('text')
        .attr('fill', sortAttrs.sortChange('#fff', sortAttrs.sortColor))
        .attr('x', this._buttonStyle.textX)
        .attr('y', this._buttonStyle.textY)
        .text(d => sortAttrs.text[d]))
      .on('click', (e, d) => {
        // merge_g = 0; //when sort indexes, save merge_g status or not
        indexScale = scaleArray[d];
        this._indexScale = d;
        renderyScale()
        renderSort()
      })
  }
  function mouseText(dis) {// calculate abscissa
    let sumsearch = d3.leastIndex(rectPosition, d => dis > d),
      indexsearch = sumsearch === 0 ? dis : dis - rectPosition[sumsearch],
      mouseDate = new Date(timeScale[sumsearch].invert(indexsearch)),
      selectDate = horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time).time),
      mouseInfo = horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time)[wm._horizonView ? 'ovalue' : 'ovalue']);
    // sumsearch, upid, indexName
    // console.log(horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time)['value']))
    wm._upid = horizenEX[sumsearch].map(d => d3.least(d, e => mouseDate > e.time))[0].upid;
    // if(wm._horizonView){
    //     sliderG.selectAll('circle').attr('r', 2)
    //     sliderG.selectAll('circle').attr('r', d => d.time.toString() !== selectDate[0].toString() ? 2 : 3.5)
    // }
    return mouseInfo
  }
  function renderSort() {//render sortG
    const t = d3.transition()
      .duration(300)
      .ease(d3.easeLinear);
    shapeGroup.selectAll('.shapeElement')
      .transition(t)
      .attr('transform', shapeAttrs.transform)
      .attr('opacity', shapeAttrs.elementOpacity)
    lineG
      .transition(t)
      .call(g => g.selectAll('g').attr('opacity', opacityCache))
      .call(g => g.selectAll('.sortIndex').text(lineAttrs.numberText))
      .call(g => g.selectAll('.lineToRect').attr('d', (d, i) => curve(lineToRect(d, i))));
    updateCardG(t);
    updateSymbol(t);
    mergeG
      .transition(t)
      .call(g => g.selectAll('.batchElement')
        .attr('opacity', mergeAttrs.elementOpacity)
        .attr('transform', mergeAttrs.elementTrans))
    horizenG
      .transition(t)
      .call(g => g.selectAll('.horizenElement')
        .attr('opacity', horizenAttrs.elementOpacity)
        .attr('transform', horizenAttrs.elementTrans))
    dragG.transition(t)
      .call(g => g.selectAll('.dragElement')
        .attr('opacity', dragAttrs.opacity)
        .attr('transform', dragAttrs.dragelementTrans))
      .call(g => g.selectAll('.mergeDrag')
        .attr('opacity', cardAttrs.merge_visible))
    rectG.selectAll('.rectElement')
      .transition(t)
      .attr('transform', rectAttrs.transform)
      .attr('opacity', rectAttrs.opacity)
    barG.selectAll('g')
      .transition(t)
      .attr('opacity', barAttrs.opacity)
      .attr('transform', barAttrs.transform)
    sortG
      .transition(t)
      .call(g => g.selectAll('rect').attr('fill', sortAttrs.sortChange(sortAttrs.sortColor, '#fff')))
      .call(g => g.selectAll('text').attr('fill', sortAttrs.sortChange('#fff', sortAttrs.sortColor)))
    triangleG
      .transition(t)
      .call(g => g.selectAll('.iconElement').attr('transform', iconAttrs.transform).attr('opacity', iconAttrs.opacity))
    textG
      .transition(t)
      .call(g => g.selectAll('text').attr('opacity', textAttrs.opacity).attr('transform', textAttrs.transform))
    textG.select('.mouseG').raise()
    textG.raise()
    if (wm._mouseDis !== undefined) {
      var mouseInfo = mouseText(wm._mouseDis);
      textG.selectAll('text')
        .transition(t)
        .text((d, i) => (+mouseInfo[i]).toFixed(2))
    }
    // heatMapG.selectAll('.heatMapElement')
    //   .transition(t)
    //   .attr('opacity', heatMapAttrs.opacity)
    //   .attr('class', 'heatMapElement')
    //   .attr('transform', heatMapAttrs.elementTrans)
    arcG
      .transition(t)
      .call(g => g.selectAll('g').attr('transform', arcAttrs.transform).attr('opacity', opacityCache))
    arcG.raise()
    barG.raise()
    lineG.raise()
    dragG.raise()
    cardG.raise()
    triangleG.raise()
  }
  function renderShape() {
    const t = d3.transition()
      .duration(300)
      .ease(d3.easeLinear);
    lineG.transition(t)
      .call(g => g.selectAll('rect').attr('height', lineAttrs.rectHeight).attr('transform', lineAttrs.rectTransform))
      .call(g => g.selectAll('.sortIndex').attr('transform', lineAttrs.numberTransform))
      .call(g => g.selectAll('circle').attr('transform', lineAttrs.circleTransform))
      .call(g => g.selectAll('.indexName').attr('transform', lineAttrs.indexTransform));
    dragG.selectAll('.dragGroup')
      .transition(t)
      .call(g => g.selectAll('rect').attr('y', dragAttrs.dragYlevel).attr('height', dragAttrs.dragHeight))
      .call(g => g.selectAll('.dragElement')
        .attr('opacity', dragAttrs.opacity)
        .attr('transform', dragAttrs.dragelementTrans))
    if (wm._horizonView) {
      mergeG.selectAll('.batchElement')
        .transition(t)
        .attr('opacity', mergeAttrs.elementOpacity)
        .attr('transform', mergeAttrs.elementTrans)
        .call(g => g.selectAll('.path4').attr('d', mergeAttrs.mergeArea[4]))
        .call(g => g.selectAll('.path3').attr('d', mergeAttrs.mergeArea[3]))
        .call(g => g.selectAll('.path2').attr('d', mergeAttrs.mergeArea[2]))
        .call(g => g.selectAll('.path1').attr('d', mergeAttrs.mergeArea[1]))
        .call(g => g.selectAll('.path0').attr('d', mergeAttrs.mergeArea[0]))
        .call(g => g.selectAll('.line').attr('d', mergeAttrs.mergeLine))
        .call(g => g.selectAll('circle').attr('transform', mergeAttrs.mergeLocation))
    } else {
      horizenG.selectAll('.horizenElement')
        .transition(t)
        .call(g => g.selectAll('path').attr('d', horizenAttrs.horizenArea))
        .call(g => g.selectAll('.clipRect').attr('height', horizenAttrs.elementHeight))
        .call(g => g.selectAll('use').attr('transform', (d, i) => `translate(0,${(horizenAttrs.overlapNum[i] + 1) * (horizenAttrs.elementHeight)})`))
    }
    updateBarG(t)
    textG
      .transition(t)
      .call(g => g.select('line').attr('y1', textAttrs.line0).attr('y2', textAttrs.line1)
        .attr('transform', (d, i) => `translate(${[mouseInfo ? wm._mouseDis : 0, 0]})`))
    // initMapArea()
  }
  function initSwitch() { //init switchG
    switchG.selectAll('g').data([1, 0]).join('g')
      .attr('transform', switchAttrs.transform)//280  - 100
      .call(g => g.append('rect')
        .attr('fill', switchAttrs.colorfunc(switchAttrs.color, '#fff'))
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('stroke', switchAttrs.color)
        .attr('stroke-width', 0.5)
        .attr('height', this._buttonStyle.height)
        .attr('width', this._buttonStyle.width))
      .call(g => g.append('text')
        .attr('fill', switchAttrs.colorfunc('#fff', switchAttrs.color))
        .attr('x', this._buttonStyle.textX)
        .attr('y', this._buttonStyle.textY)
        .text(d => switchAttrs.text[d]))
      .on('click', (e, d) => {
        if (wm._horizonView !== Boolean(d)) {
          wm._horizonView = Boolean(d);
          let t = d3.transition()
            .duration(300)
            .ease(d3.easeLinear);
          switchG.selectAll('rect')
            .transition(t)
            .attr('fill', switchAttrs.colorfunc(switchAttrs.color, '#fff'));
          switchG.selectAll('text')
            .transition(t)
            .attr('fill', switchAttrs.colorfunc('#fff', switchAttrs.color));
          if (wm._horizonView) {
            horizenG.selectAll('.horizenElement').remove();
            initMergeArea()
          } else {
            mergeG.selectAll('.batchElement').remove();
            initHorizenArea()
          }
        }
      })
  }
  function initVisG() {
    visG
      .attr('transform', `translate(${[280, - this._height / 2 + 2.5]})`)
    visG.append('rect')
      .attr('fill', this._barVis ? switchAttrs.color : 'white')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('stroke', switchAttrs.color)
      .attr('stroke-width', 0.5)
      .attr('height', this._buttonStyle.height)
      .attr('width', this._buttonStyle.width)
    visG.append('text')
      .attr('fill', this._barVis ? 'white' : switchAttrs.color)
      .attr('x', this._buttonStyle.textX)
      .attr('y', this._buttonStyle.textY)
      .text('vis')
    visG.on('click', function (e, d) {
      wm._barVis = !wm._barVis;
      d3.select(this).select('rect').attr('fill', wm._barVis ? switchAttrs.color : 'white')
      d3.select(this).select('text').attr('fill', wm._barVis ? 'white' : switchAttrs.color)
      barVisObject = Object.assign({}, ...dataInfo.map(d => { return { [d.indexName]: wm._barVis } }))
      renderyScale();
      renderSort();
    })
  }
  function initAxisG(batchTimeScale) { //init timeTick
    sliderG.selectAll('.axisG').data(rectPosition)
      .join('g')
      .attr('class', 'axisG')
      .attr('transform', (d, i) => `translate(${[i == 0 ? 0 : rectPosition[i - 1], lastY]})`)
      .call(g => g
        .style('font', '6px')
        .style('font-weight', 'normal')
        .style('color', 'grey')
        .each(function (d, i) {
          d3.select(this)
            .call(d3.axisBottom(batchTimeScale[i])
              .ticks(rectArray[i] < 60 ? 1 : 3)
              .tickFormat((d, i) => i === 0 ? d3.timeFormat('%d %H:%M')(d) : d3.timeFormat('%d %H:%M')(d))
              .tickSize(2)
              .tickPadding(2.5)
            )
        })
      )
      // .call(g => g.select('.domain').remove()))
      .call(g => g.selectAll('text')
        .attr('transform', 'translate(0, 12)rotate(45)'))
  }
  function initBarG() {  //init BarG
    barG
      .attr('transform', barAttrs.position)
      .selectAll('g').data(dataInfo).join('g')
      .attr('opacity', barAttrs.opacity)
      .attr('transform', barAttrs.transform)
      .call(g => addElement(g, 'rect', barAttrs.border))
      .call(g => g.selectAll('.goodSteel')
        .data((d, i) => barAttrs.barGoodData[i])
        .join('rect')
        .attr('class', 'goodSteel')
        .call(g => updateElement(g, barAttrs.goodSteel)))
      .call(g => g.selectAll('.badSteel')
        .data((d, i) => barAttrs.barBadData[i])
        .join('rect')
        .attr('class', 'badSteel')
        .call(g => updateElement(g, barAttrs.badSteel)))
      .on('click', clickScale)
  }
  function updateBarG(t) {
    barG
      .transition(t)
      .attr('transform', barAttrs.position)
      .call(g => updateElement(g.selectAll('.border'), barAttrs.border))
      .call(g => updateElement(g.selectAll('.goodSteel'), barAttrs.goodSteel))
      .call(g => updateElement(g.selectAll('.badSteel'), barAttrs.badSteel))
  }
  function initBarData() {
    const barValue = dataInfo.map((d, i) => horizenEX.map(e => e[i]).flat()),
      barData = barValue.map((d, i) => d3.bin().thresholds(30)(d.map(e => e.value)).map(e => { e.index = i; return e })),
      barYscale = barData.map(d => d3.scaleLinear().domain([0, d3.max(d, f => f.length) * 1.1]).range([0, barAttrs.borderHeight])),
      barXscale = barData.map(d => d3.scaleLinear().domain([d3.min(d, f => f.x0), d3.max(d, f => f.x1)]).range([0, barAttrs.borderWidth])),
      barGoodData = barValue.map((d, i) => d3.bin().thresholds(30)((d.filter(e => e.flag == 1)).map(e => e.value)).map(e => { e.index = i; return e })),
      barBadData = barValue.map((d, i) => d3.bin().thresholds(30)((d.filter(e => e.flag == 0)).map(e => e.value)).map(e => { e.index = i; return e }));
    return {
      barValue, barYscale, barXscale, barGoodData, barBadData, barData
    }
  }
  function initMouseG() {
    textG
      .attr('transform', textAttrs.position)
      .append('line')
      .attr('class', 'mouseG')
      .attr('y1', textAttrs.line0)
      .attr('y2', textAttrs.line1)
      .attr('transform', (d, i) => `translate(${[mouseInfo ? wm._mouseDis : 0, 0]})`)
      .attr('stroke', mouseInfo !== undefined ? '#bbbcbd' : 'none')
      .attr('stroke-width', 0.25)
    textG.selectAll('text').data(dataInfo).join('text')
      .attr('opacity', textAttrs.opacity)
      .attr('transform', textAttrs.transform)
      .text(textAttrs.text)
      .attr('fill', 'black')
    sliderG.on('mousemove', (e, d) => {
      let x = d3.pointer(e)[0];//mouse distance
      if (x <= 0) return
      textG.select('.mouseG').attr('transform', (d, i) => `translate(${[x, 0]})`).attr('stroke', '#bbbcbd')
      let upid = wm._upid;
      mouseInfo = mouseText(x);
      if (upid !== wm._upid) {
        vm.$emit('wheelMouse', { upid: [upid], mouse: 1 });
        vm.$emit('wheelMouse', { upid: [wm._upid], mouse: 0 });
      }
      wm._mouseDis = x;
      textG.selectAll('text').attr('transform', textAttrs.transform).text(textAttrs.text)
    })
    .on('mouseleave', (e, d) => {
      vm.$emit('wheelMouse', { upid: [wm._upid], mouse: 1 });
    })
    .on('click', (e, d) => {
      let x = d3.pointer(e)[0];
      if (x <= 0) return;
      iconG
        .attr('transform', `translate(${[x, 0]})`)
        .attr('display', 'block');
      // let upid = wm._upid;
      // mouseInfo = mouseText(x);
      // if (upid !== wm._upid) {
      //   vm.$emit('wheelMouse', { upid: [upid], mouse: 1 });
      //   vm.$emit('wheelMouse', { upid: [wm._upid], mouse: 0 });
      // }
      // wm._mouseDis = x;
      // textG.selectAll('text').attr('transform', textAttrs.transform).text(textAttrs.text)
    })
    console.log(textG.selectAll('text'))
  }
  function initRectG() {
    rectG
      .attr('transform', sliderAttrs.transform)
      .selectAll('.rectG').data(Object.keys(rectPosition).filter((d, i) => i !== Math.ceil(maxLength / 2) - 1))
      .join('g')
      .attr('transform', d => `translate(${[d == 0 ? 0 : rectPosition[+d - 1], 0]})`)
      .attr('class', 'rectG')
      .call(g => g.selectAll('g')
        .data(d => horizenEX[+d])
        .join('g')
        .attr('class', 'rectElement')
        .attr('opacity', rectAttrs.opacity)
        .attr('transform', rectAttrs.transform)
        .call(g => g.append('rect')
          .attr('height', rectAttrs.rectHeight)
          .attr('width', rectAttrs.rectWidth)
          .attr('fill', 'white'))
        .call(g => g.append('rect')
          .attr('x', 2)
          .attr('y', 2)
          .attr('height', rectAttrs.rectHeight - 4)
          .attr('width', rectAttrs.rectWidth - 4)
          .attr('fill', d => wm._horizonColor(d))
          .attr('stroke', function (d) {
            return d3.color(d3.select(this).attr('fill')).darker(0.5)
          })
          .on('mousemove', (e, d) => {
            e.stopPropagation()
          }))
        .call(g => g.append('polygon')
          .attr('transform', `translate(${[rectAttrs.rectWidth / 2, rectAttrs.rectHeight / 2]})`)
          .attr('points', d => wm._horizonPoint(d, rectAttrs.rectWidth / 2, true))
          .attr('fill', '#c65b24')
          .attr('opacity', 0.6)
          .attr('stroke', '#c65b24'))
        .call(g => g.append('polygon')
          .attr('transform', `translate(${[rectAttrs.rectWidth / 2, rectAttrs.rectHeight / 2]})`)
          .attr('points', d => wm._horizonPoint(d, rectAttrs.rectWidth / 2, false))
          .attr('fill', '#c65b24')
          .attr('opacity', 0.6)
          .attr('stroke', '#c65b24')))
    rectG.raise()
  }
  function infoArea(arr, index, flag) {// barG bin distribute
    let data = horizenEX.map(d => d[index]).flat().map(d => d.value),
      bin = d3.bin().thresholds(15)(data),
      y = d3.scaleLinear().domain([bin[0].x0, bin[bin.length - 1].x1]).range([2, chartHeight - 2]),
      bin2 = d3.bin().thresholds(15)(horizenEX.slice(Math.ceil(maxLength / 2) - 1, Math.ceil(maxLength / 2)).map(d => d[index]).flat().map(d => d.value)),
      x = d3.scaleLinear().domain([0, d3.max(bin, d => d.length)]).range([0, chartHeight - 2]),
      area = d3.area()
        .x0(d => chartHeight - 2 - x(d.length))
        .x1(chartHeight)
        .y(d => y((d.x0 + d.x1) / 2));
    return flag ? area(bin) : area(bin2)
  }
  function renderAxisG(batchTimeScale) {// render timeTick
    sliderG.selectAll('.axisG')
      .transition(d3.transition()
        .duration(200)
        .ease(d3.easeLinear))
      .attr('transform', (d, i) => `translate(${[i == 0 ? 0 : rectPosition[i - 1], lastY]})`)
      .each(function (d, i) {
        d3.select(this)
          .call(d3.axisBottom(batchTimeScale[i])
            .ticks(rectArray[i] < 60 ? 1 : 3)
            .tickFormat((d, i) => i === 0 ? d3.timeFormat('%d %H:%M')(d) : d3.timeFormat('%d %H:%M')(d))
            .tickSize(2)
            .tickPadding(2.5)
          )
      })
      .call(g => g.selectAll('text')
        .attr('transform', 'translate(0, 12)rotate(45)'))
  }
  function updateArea() {
    if (wm._horizonView) {
      mergeG.selectAll('.batchElement')
        .transition(d3.transition().duration(200).ease(d3.easeLinear))
        .attr('transform', mergeAttrs.elementTrans)
        .call(g => g.selectAll('.path0').attr('d', mergeAttrs.mergeArea[0]))
        .call(g => g.selectAll('.line').attr('d', mergeAttrs.mergeLine))
        .call(g => g.selectAll('circle').attr('transform', mergeAttrs.mergeLocation));
    } else {
      horizenG.selectAll('.horizenElement')
        .transition(d3.transition()
          .duration(150)
          .ease(d3.easeLinear))
        .call(g => g.selectAll('path').attr('d', horizenAttrs.horizenArea))
    }
  }
  function initLinearGradient() {
    gradientG.selectAll('g')
      .data(batchEX)
      .join('g')
      .call(g => g.append('linearGradient')
        .attr('id', (d, i) => `price-gradient${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', '0%')
        .attr('x2', '100%')
        .selectAll('stop').data(d => { return offsetParameter(d); }).enter()
        .append('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color))
    linearGradientAttrs
  }
  function offsetParameter(arr) {
    return arr.flat().map(d => {
      // console.log(mergeAttrs.mergeOffsets[arr.i](d.time))
      return {
        offset: mergeAttrs.translateX[d.i](d.time) / rectPosition[rectPosition.length - 1], //d.index/arr.length.toString()
        color: d.ovrage ? 'red' : 'blue',//util.labelScale(d.level),
      }
    })
  }
  function areaParameter() {	//area function
    let range = Array.from(d3.cumsum(rectArray));
    range.unshift(0);
    let rangeArray = d3.pairs(range);
    let xBatch = rangeArray.map((d, i) => d3.scaleLinear().range(d).domain(d3.extent(batchEX[0][i], e => e.time)));
    let yBatch = batchEX.map(d => d3.scaleLinear().range([chartPadding.bottom, chartHeight - chartPadding.top])
      .domain([d3.min(d.flat().map(d => d.min)) * 0.95, d3.max(d.flat().map(d => d.max)) * 1.05]));
    let mergeArea = [
      d3.area()
        .x(d => xBatch[d.i](d.time))
        .y0(d => -yBatch[d.d](d.sxl))
        .y1(d => -yBatch[d.d](d.sxh)),
      d3.area()
        .x(d => xBatch[d.i](d.time))
        .y0((d, i) => -yBatch[d.d](d.l))
        .y1((d, i) => -yBatch[d.d](d.exl)),
      d3.area()
        .x(d => xBatch[d.i](d.time))
        .y0((d, i) => -yBatch[d.d](d.h))
        .y1((d, i) => -yBatch[d.d](d.exh)),
      d3.area()
        .x(d => xBatch[d.i](d.time))
        .y0((d, i) => -yBatch[d.d](d.exl))
        .y1((d, i) => -yBatch[d.d](d.sxl)),
      d3.area()
        .x(d => xBatch[d.i](d.time))
        .y0((d, i) => -yBatch[d.d](d.exh))
        .y1((d, i) => -yBatch[d.d](d.sxh))
    ],
      mergeLine = d3.line().x(d => xBatch[d.i](d.time)).y((d, i) => -yBatch[d.d](d.value)).curve(d3.curveLinear),
      mergeLocation = d => `translate(${[xBatch[d.i](d.time), -yBatch[d.d](d.value)]})`;
    timeScale = xBatch;
    let translateX = xBatch;
    return { mergeArea, mergeLine, mergeLocation, translateX }
  }
  function initMergeArea() {
    mergeG.selectAll('.batchElement')
      .data(batchEX)
      .join('g')
      .attr('class', 'batchElement')
      .attr('transform', mergeAttrs.elementTrans)
      .attr('opacity', mergeAttrs.elementOpacity)
      .call(g => g.append('path')
        .attr('fill', util.labelScale(0))
        .attr('class', 'path0')
        .datum(d => d.flat())
        .attr('opacity', 0.5)
        .attr('d', mergeAttrs.mergeArea[0]))
      // .call(g => g.append('path')
      // 		.attr('stroke-width', 2)
      // 		.attr('class', 'line')
      // 		.attr('stroke', (d, i) => `url(#price-gradient${i})`)
      // 		// .attr('stroke', d3.color(util.labelScale(0)).darker(0.6))
      // 		.attr('fill', 'none')
      // 		.datum(d => d.flat())
      // 		.attr('d', mergeAttrs.mergeLine))
      .call(g => g.selectAll('.line').data(d => divideData(d.flat()))	// batchEX.map(d => console.log('data', divideData(d.flat())))
        .join('path')
        .attr('class', 'line')
        .datum(d => d)
        .attr('fill', 'none')
        .attr('d', mergeAttrs.mergeLine)
        .attr('stroke', d => d.status ? mergeColor[0] : mergeColor[1])
      )
      .call(g => g.selectAll('circle')
        .data(d => d.flat()).join('circle')
        .attr('transform', mergeAttrs.mergeLocation)
        .attr('visibility', d => d.ovrage ? 'visible' : 'hidden')
        // .attr('fill', d => util.labelScale(wm._rangeInsert(d)))
        .attr('fill', 'white')
        .attr('stroke', d => d3.color(util.labelScale(Math.abs(d.range))).darker(1))
        // .attr('fill', (d, i) => lc[dataInfo[d.d].month])
        // .attr('stroke', (d, i) => d3.color(lc[dataInfo[d.d].month]).darker(1))
        .attr('stroke-width', 1)
        .attr('r', 1.5))
  }
  function horizenParameter() {	//horizen function
    let range = Array.from(d3.cumsum(rectArray));
    range.unshift(0);
    let rangeArray = d3.pairs(range);
    let xBatch = rangeArray.map((d, i) => d3.scaleLinear().range(d).domain(d3.extent(batchEX[0][i], e => e.time)));
    let yBatch = batchEX.map(d => d.flat()).map((e, f) => {
      return d3.scaleLinear().range(horizenAttrs.overHeight)
        .domain([d3.mean(e, e => e.exl), d3.mean(e, e => e.exl), d3.mean(e, e => e.l),
        d3.mean(e, e => e.h), d3.mean(e, e => e.exh), d3.mean(e, e => e.exh)]);
    });
    let horizenArea = d3.area().curve(d3.curveBasis).x(d => xBatch[d.i](d.time)).y0(0).y1((d, i) => -yBatch[d.d](d.value));
    timeScale = xBatch;
    return horizenArea
  }
  function initHorizenArea() {
    horizenG.selectAll('.horizenElement')
      .data(batchEX.map(d => d.flat()))
      .join('g')
      .attr('class', 'horizenElement')
      .attr('opacity', horizenAttrs.elementOpacity)
      .attr('transform', horizenAttrs.elementTrans)
      .call(g => g.append('clipPath')
        .attr('id', (d, i) => `clipy${i}`)
        .append('rect')
        .attr('width', rectPosition[rectPosition.length - 1])
        .attr('class', 'clipRect')
        .attr('height', horizenAttrs.elementHeight))
      .call(g => g.append('defs').append('path')
        .attr('opacity', 0.8)
        .attr('class', 'allpath')
        .attr('id', (d, i) => `path-def${i}`)
        .datum(d => d)
        .attr('d', horizenAttrs.horizenArea))
      .call(g => g.append('g')
        .attr('clip-path', (d, i) => `url(#clipy${i})`)
        .selectAll('use')
        .data(d => new Array(horizenAttrs.overlap).fill(d))
        .enter()
        .append('use')
        .attr('fill', (d, i) => horizenAttrs.horizenColor(horizenAttrs.overlapNum[i]))
        .attr('transform', (d, i) => `translate(0,${(horizenAttrs.overlapNum[i] + 1) * (horizenAttrs.elementHeight)})`)
        .attr('href', d => `#path-def${d[0].d}`))
  }
  function heatMapParameter(array, data) {
    let xBatch = array.map((d, i) => {
      let l = array[i],
        // scale = d3.scaleLinear()
        //     .range([chartPadding.left, l - chartPadding.right])
        //     .domain(d3.extent(data[i][0], (e, f)=> e.time));
        scale = d3.scaleBand()
          .domain(d3.map(data[i][0], e => e.time.toString()))
          .range([chartPadding.left, l - chartPadding.right]);
      return scale
    });
    // let xLabelData = array.map((d,i) =>{
    //     let temp = data[i][0].map(d => xBatch[i](d.time));
    //     temp.unshift(chartPadding.left)
    //     let subtemp = d3.pairs(temp, (a, b) => b -a);
    //     let key = 2.2;
    //     let padding = subtemp.map((d, i) => {
    //         if(i !== temp.length - 1){
    //             return subtemp[i] > subtemp[i + 1] ? subtemp[i+1]/key : subtemp[i]/key;
    //         }
    //         return subtemp[i]/key
    //     })
    //     return padding
    // })
    let yBatch1 = d3.scaleLinear()
      .range([0, heatMapAttrs.rectHeight - chartPadding.top / 2])
      .domain(d3.extent(d3.map(data, d => d3.map(d, e => d3.map(e, f => f.Q))).flat(2)));
    let yBatch2 = d3.scaleLinear()
      .range([0, heatMapAttrs.rectHeight - chartPadding.top / 2])
      .domain(d3.extent(d3.map(data, d => d3.map(d, e => d3.map(e, f => f.T2))).flat(2)));
    let yColor = d3.scaleLinear()
      .domain([0, 0.25, 0.5, 0.75, 1])
      .range(util.levelColor);
    return { xBatch, yBatch1, yBatch2, yColor }
  }
  function initMapArea() {
    heatMapG
      .attr('transform', heatMapAttrs.position)
      .selectAll('.heatMapG').data(rectPosition)
      .join('g')
      .attr('class', 'heatMapG')
      .attr('transform', heatMapAttrs.elementTrans)
      .call(g => g.selectAll('g')
        .data((d, i) => horizenEX[i])
        .join('g')
        .attr('opacity', heatMapAttrs.opacity)
        .attr('class', 'heatMapElement')
        .attr('transform', heatMapAttrs.elementTrans)
        .call(g => g.selectAll('.mapQ')
          .data(d => d).join('rect')
          .attr('fill', d => heatMapAttrs.yColor(d.Q))
          .attr('stroke', '#e0e4e7')
          .attr('class', 'mapQ')
          .attr('y', heatMapAttrs.qY)
          // .attr('y', d => -qBatch(d.Q))
          // .attr('height', d => qBatch(d.Q))
          .attr('height', heatMapAttrs.rectHeight)
          .attr('width', (d, i) => heatMapAttrs.xBatch[d.i].bandwidth())
          .attr('x', (d, i) => heatMapAttrs.xBatch[d.i](d.time.toString())))
        .call(g => g.selectAll('.mapT2')
          .data(d => d).join('rect')
          .attr('fill', d => heatMapAttrs.yColor(d.T2))
          .attr('stroke', '#e0e4e7')
          .attr('class', 'mapT2')
          .attr('y', heatMapAttrs.t2Y)
          // .attr('y', d => -t2Batch(d.T2) - chartHeight/2)
          // .attr('height', d => t2Batch(d.T2))
          .attr('height', heatMapAttrs.rectHeight)
          .attr('width', (d, i) => heatMapAttrs.xBatch[d.i].bandwidth())
          .attr('x', (d, i) => heatMapAttrs.xBatch[d.i](d.time.toString()))))
  }
  function initShape() {
    const arrowScale = d3.scaleLinear().domain([-3, 3]).range([10, -10]),
      baseRadius = 2;
    shapeGroup.selectAll('shapeElement')
      .data(batchEX)
      .join('g')
      .attr('class', 'shapeElement')
      .attr('transform', shapeAttrs.transform)
      .attr('opacity', shapeAttrs.elementOpacity)
      // .call(g => g.selectAll('.multivariate').data((d, i) => shapeAttrs.batch[i].multivariate)
      //   .join('rect').attr('class', 'multivariate')
      //   .call(g => updateElement(g, shapeAttrs.multiAttrs)))
      .call(g => g.selectAll('.single').data((d, i) => shapeAttrs.batch[i].single)
        .join('path')
        .attr('class', 'single')
        .call(g => updateElement(g, shapeAttrs.singleAttrs)))
      .call(g => g.selectAll('.intersection').data((d, i) => shapeAttrs.batch[i].intersection)
        .join('g')
        .attr('class', 'intersection')
        .call(g => g.append('path')
          .attr('class', 'interArrow')
          .attr('d', e => d3.linkVertical().x(d => d.x).y(d => d.y)({ source: { x: 0, y: 0 }, target: { x: 0, y: arrowScale(e[0].range) } }))
          .attr('marker-end', 'url(#shape-arrow)')
          .attr('transform', shapeAttrs.interArrow)
          .attr('stroke', mergeColor[0])
          .attr('fill', 'none'))
        // .call(g => g.append('circle')
        // 	.attr('transform', shapeAttrs.startRibbon)
        // 	.attr('class', 'startRibbon')
        // 	.attr('stroke', mergeColor[0])
        // 	.attr('fill', 'none')
        // 	.attr('r', baseRadius))
        // .call(g => g.append('circle')
        // 	.attr('transform', shapeAttrs.endRibbon)
        // 	.attr('class', 'endRibbon')
        // 	.attr('stroke', mergeColor[0])
        // 	.attr('fill', 'none')
        // 	.attr('r', baseRadius))
        .call(g => g.append('rect')
          .attr('transform', shapeAttrs.interLineTrans)
          .attr('width', shapeAttrs.interLen)
          .attr('height', 1.25 * baseRadius)
          .attr('fill', mergeColor[0])
          .attr('stroke', 'none'))
      )
  }
  function updateShape() {
    const t = d3.transition().duration(150).ease(d3.easeLinear);
    shapeGroup.transition(t)
      .call(g => updateElement(g.selectAll('.single'), shapeAttrs.singleAttrs))
      .call(g => updateElement(g.selectAll('.multivariate'), shapeAttrs.multiAttrs))
      .call(g => g.selectAll('.intersection').selectAll('path').attr('transform', shapeAttrs.interArrow))
      .call(g => g.selectAll('.intersection').selectAll('line').attr('transform', shapeAttrs.interLineTrans).attr('x2', shapeAttrs.interLen))
      .call(g => g.selectAll('.startRibbon').attr('transform', shapeAttrs.startRibbon))
      .call(g => g.selectAll('.endRibbon').attr('transform', shapeAttrs.endRibbon))
  }
  function initSymbol() {
    symbolG.attr('transform', symbolAttrs.position)
      .call(g => g.selectAll('g')
        .data(dataInfo).join('g').attr('transform', symbolAttrs.transform).attr('opacity', symbolAttrs.opacity)
        .call(g => addElement(g, 'rect', symbolAttrs.sIndice))
        .call(g => addElement(g, 'text', symbolAttrs.sText))
        .call(g => addElement(g, 'rect', symbolAttrs.mIndice))
        .call(g => addElement(g, 'text', symbolAttrs.mText)))
  }
  function updateSymbol(t) {
    symbolG.transition(t)
      .attr('transform', symbolAttrs.position)
      .selectAll('g')
      .call(g => g.attr('transform', symbolAttrs.transform).attr('opacity', symbolAttrs.opacity))
    symbolG.transition(t)
      .call(g => updateElement(g.selectAll('.single'), symbolAttrs.sIndice))
      .call(g => updateElement(g.selectAll('.multivariate'), symbolAttrs.mIndice))
      .call(g => updateElement(g.selectAll('.singleText'), symbolAttrs.sText))
      .call(g => updateElement(g.selectAll('.multiText'), symbolAttrs.mText))
  }
  function clickScale(e, d) {
    console.log(d3.pointer(e))
    console.log(e)
    console.log(d3.select(this).node().getBBox())
    let el = vm.svg.node().appendChild(this.cloneNode(this))
    el.setAttribute('calss', `${vm.menuId}tooltip`);
    console.log(e, el.parentNode);

    //document.querySelector(`#${vm.menuId} svg`).appendChild(this.cloneNode(this)).setAttribute('calss', `${vm.menuId}tooltip`)
    // console.log(d3.select(this).attr('transform'), d3.select(this))
    // d3.select(this).select(function() {
    //     return this.parentNode.insertBefore(this.cloneNode(this), this.nextSibling);
    //   }).attr('transform', d3.select(this).attr('transform') + ' scale(2)').attr('calss', 'dfudguieruu')
  }
  function mouseOver(args) {
    opacityCache = (d, i) => {
      if (merge_g <= indexScale(i) && indexScale(i) < rectNum + merge_g) {
        if (d.indexName) {
          return args.indexOf(d.indexName) !== -1 ? 1 : 0.4
        } else if (d[0].indexName) {
          return args.indexOf(d[0].indexName) !== -1 ? 1 : 0.4
        } else if (d[0][0].indexName) {
          return args.indexOf(d[0][0].indexName) !== -1 ? 1 : 0.4
        }
      } else {
        return 0
      }
    }
    initAttrs.call(wm)
    renderSort()
  }
  function mouseOut() {
    opacityCache = (d, i) => merge_g <= indexScale(i) && indexScale(i) < rectNum + merge_g ? 1 : 0;
    initAttrs.call(wm)
    renderSort()
  }
  function searchIndexName() {
    return dataInfo.filter((d, i) => merge_g <= indexScale(i) && indexScale(i) < rectNum + merge_g).map(d => d.indexName)
  }
  function updateBar() {
    chartHeight = wm._sliderValue;
    renderyScale();
    // renderSort();
    renderShape();
    renderSort();
  }
  return {
    mouseOver,
    mouseOut,
    searchIndexName,
    updateBar
  }
}