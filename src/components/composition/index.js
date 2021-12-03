import * as d3 from 'd3'
// import { addElement, updateElement, updateAsyncElement , updateStyles} from 'utils/element';
// import util from 'views/baogang/util.js';
import {processIcon, colourLessIcon} from "assets/images/index.js";
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
export class wheelRound{
  constructor(container, vNode) {
    this._container = container;
    this._g = null;
    this._vN = vNode;

    this._width = 640;
    this._height = 640;
    this._radius = {
      inner: 125,
      outer: 0,
      max: 0,
      bubble: 30,
      arc: 5,
      label: 15
    };
    this._fontSize = {
      info: 10,
      center: 24,
      month: 9,
      mark: 8,
      tick: 8
    };

    this._data = null;
    this._chordData = null;
    this._chartData = null;
    this._field = {
      name: 'name',
      low: 'result_low',
      high: 'result_high',
      elow: 'result_extre_low',
      ehigh: 'result_extre_high',
      avg: 'result_value',
      precipitation: 'PCASPE',
      humidity: 'PCAT2',
    }

    this._x = null; // date scale
    this._xpad = null; //pad scale
    this._y = null; // temperature scale
    this._h = null; // humidity scale
    this._hb = null;// humidity border scale
    this._barAngle = 0; // one-bar radian

    this._labels=null;
    this._dailyInfo = null;
    this._texts = {
      name: null,
      avg: null,
      deviation:null,
      high: null,
      low: null,
      prec: null,
      humidity: null,
    };

    //staticGroup
    this._sliderTimer = null;

    this._process=[];
    this._padprocess = [[],[],[]];
    this._processindex = ['heat', 'roll', 'cool'];
    this._labelcolor = ['#fcd8a9', '#cce9c7', '#c1c9ee'];
    this._flagColor = ["#e3ad92",   "#b9c6cd"];
    this._padAngle=[];
    this._linespace=6;
    this._sliderValue = 40;
    this._horizonView = true;
    this._indexdata = [];
    this._allIndex = undefined;    //index name
    this._indexScale = 0;
    this._mouseDis  = undefined;
    this._barVis = false;
    this._labelLimit = {
      precs: 0.5,
      humis: 0.5,
      result: 0.5
    };
    this._stopPropagation = (e, d) => e.stopPropagation();

    this._processClass = e => d => e + d.month,
    this._indexId = e => d => e + d.indexName,

    //mainG
    this._borderStyle ={
      color: '#b9bbbd',
      rx: 3,
      ry: 3
    }

    //contentG
    this._filter_status = false;
    this._contentG = null;
    this._heatOrRiver = false;
    this._padindex = null;
    this._processData = null;

    //Style 
    this._cleadStyle = {
      'opacity': 0.4,
      'stroke-width': 0.75
    }
    this._leadlineStyle = {
      'opacity': 0.4,
      'original_strwidth': 0.25,
      'highlight_strwidth': 0.75
    }
    this._circleStyle ={
      'original_r': 1.5,
      'highlight_r': 2
    }

    //chord
    this._graph = null;
    this._leavesData = null;
    this._lineData = null;

    this._buttonColor = '#94a7b7'; //  #678fba
    this._buttonStyle = {
      width: 40,
      height: 18 ,
      textX: 20,
      textY:  12
    };

    // 高亮
    this._upid = null;
  }
  getIndex(_){
    for (let item in this._process){
      if(this._process[item].indexOf(_)!==-1){
        return +item
      }
    }
  }

  data(_) {
    return arguments.length ? (this._data = _, this) : this._data;
  }

  chord(_) {
    return arguments.length ? (this._chordData = _, this) : this._chordData;
  }

  labels(_){
    return arguments.length ? (this._labels = _, this) : this._labels;
  }

  process(_){
    return arguments.length ? (this._process = _, this) : this._process;
  }

  field(_) {
    return arguments.length ? (this._field = _, this) : this._field;
  }

  size(_) {
    return arguments.length ? (this._width = _[0], this._height = _[1], this) : [this._width, this._height];
  }

  render() {
    this._initRadius();
    this._g == null ? undefined : this._g.remove();
    this._g = this._container.append('g')
    
    this._initdata();
    this._renderWheel();
    
    // this._vN.$watch('multiPara', () =>{
    //   // (newVal, oldVal) =>{
    //   // console.log(newVal, oldVal);
    //   console.log(this._vN.multiPara)
    //   this._updateCurve()
    // });
    this._watchVnode();
    return this;
  }

  _watchVnode(){
    this._vN.$watch('filterStatus', () =>{
      this._filter_status = this._vN.filterStatus;
      this._renderWheelFilter();
    });
    this._vN.$watch('heatOrRiver', () =>{
      this._heatOrRiver = this._vN.heatOrRiver
      this._heatOrRiver ? this._initHeatG() : this._initRiverG()
      this._renderWheelFilter();
    });
    this._vN.$watch('curveSize', () =>{
      this._updateChord();
    });
  }

  _renderWheel(){
    this._initScaleData();
    this._renderMainWheel();
    this._g.attr('transform', `translate(${this._width/3},0)`)
  }

  _initDefs(){
    const defsG = this._container.append('g')
      .attr('class', 'defsG');
    const defs = defsG.append('defs')
      .call(g => g.append('filter')
        .attr('id', 'card-shadow')
          .call(g => g.append('feDropShadow')
            .attr('dx',0)
            .attr('dy', 0)
            .attr('stdDeviation', 2.5)
            .attr('flood-color', '#bfbdbd')));//#ededed
  }

  _initRadius(){
    const r = this._radius;
    r.max = Math.min(this._width, this._height) / 2;
    r.inner = r.max * 0.30;
    r.bubble = r.max * 0.3;
    r.arc = r.max * 0.032;
    r.isize = r.max * 0.064;
    r.outer = r.max - r.bubble *1.1 - r.label;       
  }

  _initdata() {
    const field = this._field;
    this._padprocess=[[],[],[]];
    this._chartData = this._data.map(d => {
      const datum = {
        indexName: d[field.name],
        date: d[field.name],
        month: this.getIndex(d[field.name]),
        low: d[field.low],
        high: d[field.high],
        elow: d[field.elow],
        ehigh: d[field.ehigh],
        avg: d[field.avg],
        precipitation: d[field.precipitation],
        humidity: d[field.humidity],
        property:[
          {'label': 'PCAT2', 'value': d[field.humidity], 'angle': 0.1 , limit: 'humis'},
          {'label': 'PCASPE', 'value': d[field.precipitation], 'angle': 0.1, limit: 'precs'},
          {'label': 'result', 'value': d[field.precipitation], 'angle': 0.2, limit: 'result'}
        ]
      };
      const e=datum;
      datum.property.map(m => {
          m.process = +datum.month
      });
      datum.property[2].value=e.avg>e.low&e.high>e.avg? 0 : 1.6;
      let deviation=e.avg>e.low&e.high>e.avg? 0 : (e.avg<e.low ? (e.low-e.avg)/e.low : (e.avg-e.high)/e.high);
      datum.deviation=deviation;
      datum.over = e.avg>e.low&e.high>e.avg? 0 : (e.avg<e.low ? (e.low-e.avg) : (e.avg-e.high));
      return datum;
    });
  }

  _initScaleData(){
    const labels = this._chartData.map(d => d.indexName),
      lows = this._chartData.map(d => d.elow),
      highs = this._chartData.map(d => d.ehigh),
      precs = this._chartData.map(d => d.precipitation),
      humis = this._chartData.map(d => d.humidity);
    this._chartData.map(d => {
      this._padprocess[d.month].push(d.indexName)
      return d;
    });
    const pad = 0;
    const angle = (Math.PI * 2 - 3 * pad )/this._data.length
    this._barAngle = (Math.PI * 2- 3 * pad) / this._data.length;
    const a = angle * this._padprocess[0].length, b = angle * this._padprocess[1].length , c = angle * this._padprocess[2].length;
    this._padAngle=[
      [-a/2, a/2 ],
      [a/2 +pad, a/2 + b + pad ],
      [a/2 + b + 2 * pad, a/2 + b + c + 2 * pad],
    ]
    this._label=labels
    this._initScales(labels, lows, highs, precs, humis);
  }

  _initScales(labels, lows, highs, precs, humis) {
    const r = this._radius;

    this._x = d3.scaleBand()
      .domain(labels)
      .range([-0.3 * Math.PI, 1.66 * Math.PI ]);
    
    this._xpad = new Array(3).fill(3).map((d, i) => 
      d3.scaleBand()
      .domain(this._padprocess[i])
      .range(this._padAngle[i]))

    this._y = d3.scaleRadial()
      .domain([d3.min(lows), d3.max(highs)]).nice()
      .range([r.inner+0.1*r.bubble, r.outer-0.15*r.bubble]);

    const bext = d3.extent(precs);
    this._labelLimit.precs = d3.quantile(precs, 0.5);
    this._hb = d3.scaleLinear()
      .domain(bext)
      .range([0 , r.bubble*0.6]);

    this._labelLimit.humis = d3.quantile(humis, 0.5);
    const hext = d3.extent(humis);
    this._h = d3.scaleLinear()
      .domain(hext)
      .range([r.outer , r.outer + r.bubble * 0.6]);
  }

  _renderMainWheel() {
    this._contentG = this._g.append('g').attr('class', 'contentG');
    this._renderWheelContent();
    this._initInnerOverlay();   //tooptip layer
    this._initChordData();      //init chord line data
    this._renderWheelChord();   //chord node and line
  }

  _renderWheelFilter(){
      let indexes;
      if(this._filter_status) {
          indexes =  d3.map(this._chartData.filter(this._outrate(true, false)), d => d.indexName);
          const angle = new Array(this._processindex.length).fill([]);
          d3.groups(this._chartData.filter(this._outrate(true, false)), d => d.month)
              .map(d => {
                  angle[d[0]] = d[1].map(d => (this._xpad[d.month](d.date) + this._barAngle/2) * 180 / Math.PI - 180 )
              });
          this._renderBorderG(angle)
      }else{
          indexes = d3.map(this._chartData, d => d.indexName);
          this._initBorderG()
      }
      let searchIndex = d => indexes.indexOf(d.indexName) !== -1 ? 'visible' : 'hidden'
      if(this._heatOrRiver){
          this._contentG.selectAll('.riverG').selectAll('g').attr('visibility', searchIndex)
      }else{
          this._contentG.selectAll('.riverG').selectAll('circle').attr('visibility', searchIndex)
      }
      this._contentG.selectAll('.outerBarG').selectAll('g').attr('visibility', searchIndex);
      this._contentG.selectAll('.outerLineG').selectAll('g').attr('visibility', searchIndex);
      this._contentG.selectAll('.innerLineG').selectAll('g').attr('visibility', searchIndex);
  }

  _renderWheelContent() {
      const processData = d3.group(this._chartData, d => d.month);
      const sample = this._sort(this._chartData);
      this._allIndex = d3.map(sample, d => d.indexName);
      this._processData = processData;
      this._padindex = [...processData.keys()];//[0, 1, 2] or [0, 2];

      this._initBorderG()
      
      this._heatOrRiver ? this._initHeatG() : this._initRiverG()

      this._initOuterBarG()
      this._initOuterLineG()

      this._initOuterElementG();

      this._initProcessCircle()
      this._initIconG()
      this._renderWheelFilter()
      this._contentG.raise()
  }
  
  _initBorderG(){
      this._contentG.selectAll('.borderG').remove()
      const lcBorderFunc = d => d3.color(this._labelcolor[d]).darker(1)
      this._contentG.selectAll('.borderG')
              .data(this._padindex)
              .join('g')
              .attr('class', 'borderG')
          .call(g => g.append('line')      //扇形左边界
              .attr('y1', this._radius.inner)
              .attr('y2', this._radius.outer)
              .attr('stroke', lcBorderFunc)
              .attr('stroke-width', 0.5)
              .attr('transform', d => `rotate(${this._padAngle[d][0]* 180 / Math.PI - 180})`))
          .call(g => g.append('line')     //扇形右边界
              .attr('y1', this._radius.inner)
              .attr('y2', this._radius.outer)
              .attr('stroke', lcBorderFunc)
              .attr('stroke-width', 0.5)
              .attr('transform', d => `rotate(${this._padAngle[d][1]* 180 / Math.PI - 180})`))
          .call(g => g.append('path')
              .attr('d', d => d3.arc()
                  .startAngle(this._padAngle[d][0])
                  .endAngle(this._padAngle[d][1])
                  .innerRadius(this._radius.outer)
                  .outerRadius(this._radius.outer + this._radius.bubble*1.1 + 0.25)(d))
              .attr('stroke', lcBorderFunc)
              .attr('fill','none')
              .attr('stroke-width', 0.5))     
  }

  _renderBorderG(angle){
      this._contentG.selectAll('.borderG').remove()
      const lcBorderFunc = d => d3.color(this._labelcolor[d]).darker(1),
          v = this._barAngle * 180 / Math.PI;
      const borderAngle = angle.map((d, i) => {
          d.sort((a, b) => a - b)
          let arr = [];
          if(d.length == 0)return arr
          arr = d.map(e => [e - v/2, e + v/2, i]);
          for(let index = 0; index < arr.length - 1; index++){
              if(arr[index + 1][0] - arr[index][1] < v/3){
                  arr.splice(index, 2, [arr[index][0], arr[index + 1][1], i])
                  index --
              }
          }
          return arr
      })
      this._contentG.selectAll('.borderG')
              .data(this._padindex.filter(d => angle[d].length !== 0))
              .join('g')
              .attr('class', 'borderG')
          .call(g => g.selectAll('g').data((d, i) => borderAngle[d])
              .join('g')
              .call(g => g.append('line')      //扇形左边界
                  .attr('y1', this._radius.inner)
                  .attr('y2', this._radius.outer)
                  .attr('stroke', d => lcBorderFunc(d[2]))
                  .attr('stroke-width', 0.5)
                  .attr('transform', d => `rotate(${d[0]})`))
              .call(g => g.append('line')     //扇形右边界
                  .attr('y1', this._radius.inner)
                  .attr('y2', this._radius.outer)
                  .attr('stroke', d => lcBorderFunc(d[2]))
                  .attr('stroke-width', 0.5)
                  .attr('transform', d => `rotate(${d[1]})`))
              .call(g => g.append('path')
                  .attr('d', d => d3.arc()
                      .startAngle((d[1] + 180)* Math.PI / 180)
                      .endAngle((d[0] + 180) * Math.PI / 180)
                      .innerRadius(this._radius.outer)
                      .outerRadius(this._radius.outer + this._radius.bubble*1.1 + 0.25)(d))
                  .attr('stroke', d => lcBorderFunc(d[2]))
                  .attr('fill','none')
                  .attr('stroke-width', 0.5)))
  }

  _initIconG(){
      this._contentG.selectAll('iconG')
          .data(this._padindex)
          .join(enter => enter.append('image')
              .attr('class', 'iconG')
                  .attr('id', d => `icon${d}`)
                  .attr('transform', d => `rotate(${(this._padAngle[d][0] + this._padAngle[d][1])/2 * 180 / Math.PI - 5.8})`)
                  .attr('width', this._radius.isize)
                  .attr('width', this._radius.isize)
                  .attr('y', -this._radius.inner*0.97)
                  .attr('href', d => processIcon[d]),
              update => update.attr('transform', d => `rotate(${(this._padAngle[d][0] + this._padAngle[d][1])/2 * 180 / Math.PI - 5.8})`)
                  .attr('href', d => processIcon[d])
                  .attr('id', d => `icon${d}`),
              exit => exit.remove())
          // .join('g')
          // .attr('class', 'iconG')
          // .call(g => g.append('image')
          //     .attr('class', 'icon')
          //     .attr('id', d => `icon${d}`)
          //     .attr('transform', (d , i) => `rotate(${(this._padAngle[i][0] + this._padAngle[i][1])/2 * 180 / Math.PI - 5.8})`)
          //     .attr('y', -this._radius.inner*0.97)
          //     .attr('href', (d , i) => processIcon[i]))
  }

  _initRiverG(){
      this._initInnerLineG();
      
      const lcFunc = d => this._labelcolor[d],
          lineColorFunc =  d => d3.color(this._labelcolor[d]).darker(1),
          v = this._barAngle/2,
          //河流图节点
          circleColor = d => d3.color(this._labelcolor[d.month]).darker(0.2),
          strokeColor = d => d3.color(this._labelcolor[d.month]).darker(1);
      this._contentG.selectAll('.riverG')
          .data(this._padindex)
          .join('g')
          .attr('class', 'riverG')
          .call(g => g.selectAll('g').remove())
          .call(g => g.append('path')     //河流图内层
              .attr('fill', lcFunc)
              .attr('class' , d => `innerRiver${d}`)
              .attr('fill-opacity', 0.8)
              .attr('d', d => d3.areaRadial()
                  .curve(d3.curveCardinal)
                  .angle(e => this._xpad[d](e.date) + v)
                  .innerRadius(e => this._y(e.low))
                  .outerRadius(e => this._y(e.high))(this._processData.get(d))))
          .call(g => g.append('path')     //河流图外层
              .attr('fill', lcFunc)
              .attr('class', d => `outerRiver${d}`)
              .attr('fill-opacity', 0.4)
              .attr('d', d => d3.areaRadial()
                  .curve(d3.curveCardinal)
                  .angle(e => this._xpad[d](e.indexName) + v)
                  .innerRadius(e => this._y(e.elow))
                  .outerRadius(e => this._y(e.ehigh))(this._processData.get(d))))
          .call(g => g.append('path')      //河流线
              .attr('fill', 'none')
              .attr('class', 'riverLine')
              .attr('id' , d => `riline${d}`)
              .attr('stroke', lineColorFunc)
              .attr('stroke-width', 1)
              .attr('d', d => d3.lineRadial()
                  .curve(d3.curveLinear)
                  .angle(e => this._xpad[d](e.date) + v)
                  .radius(e => this._y(e.avg))(this._processData.get(d))))
          .call(g => g.selectAll('circle')
              .data(d => this._processData.get(d))
              .join('circle')
              .attr('transform', d => `rotate(${(this._xpad[d.month](d.indexName) + v) * 180 / Math.PI - 180 })`)
              .attr('class', this._processClass('circle_color'))
              .attr('id', this._indexId('circle'))
              .attr('fill', circleColor)
              .attr('stroke', strokeColor)
              .attr('stroke-width', 0.5)
              .attr('stroke-opacity', 1)
              .attr('cy', d => this._y(d.avg))
              .attr('r', this._outrate(this._circleStyle.highlight_r, this._circleStyle.original_r))
              )
  }

  _initHeatG(){
      const lcFunc = d => this._labelcolor[d];
      let length = 5, padding = 5,
          height = ((this._radius.outer - this._radius.inner) - (length - 1) * padding)/length,
          heightArray = new Array(length).fill(0).map((d, i) => {
                  return {
                      'x0': i * (height + padding) + this._radius.inner,
                      'x1': i * (height + padding) + this._radius.inner + height,
                  }
              });

      this._contentG.selectAll('.riverG').remove()
      this._contentG.selectAll('.riverG')
          .data(this._padindex)
          .join('g')
          .attr('class', 'riverG')
          .selectAll('g')
          .data(d => this._processData.get(d))
          .join('g')
          .attr('class', this._processClass('heat'))
          .attr('id', this._indexId('heat'))
          .attr('transform', d => `rotate(${(this._xpad[d.month](d.indexName) ) * 180 / Math.PI - 180 })`)
          .call(g => g.selectAll('path').data(d => heatRange(d)).join('path')
              // .attr('visibility', d => d.range ? 'visible' : 'hidden')
              .attr('stroke', d => lcFunc(d.month))
              .attr('stroke-opacity', 0.25)
              .attr('fill', d => d.range ? lcFunc(d.month) : 'none')
              .attr('d', (d, i) => this._linepad(heightArray[i].x0, heightArray[i].x1)))
      function heatRange(d){
          let arr = new Array(length).fill(false),
              range = [d.elow, d.low, d.high, d.ehigh],
              index = range.findIndex(e => d.avg < e);
          index = index !== -1 ? index : length - 1; 
          arr[index] = true;
          return arr.map(f => {
              return {
                  'range': f,
                  'month': d.month
              }
          })
      }
  }

  _initOuterBarG(){
      const lcFunc = d => this._labelcolor[d.month],
          lineColorFunc =  d => d3.color(this._labelcolor[d.month]).darker(1);
      this._contentG.selectAll('.outerBarG')
          .data(this._padindex)
          .join(
              enter => enter.append('g')
                  .attr('class', 'outerBarG')
                  .selectAll('g')
                  .data(d => this._processData.get(d))
                  .join('g')
                  .attr('transform', d => `rotate(${(this._xpad[d.month](d.indexName) ) * 180 / Math.PI - 180 })`)
                  .call(g => g.append('path')
                      .attr('class', this._processClass('humidity'))
                      .attr('id', this._indexId('humidity'))
                      .attr('fill', lcFunc)
                      .attr('stroke', lineColorFunc)
                      .attr('d', d => this._linepad(this._radius.outer, this._h(d.humidity))))
                  .call(g => g.append('path')
                      .attr('class', this._processClass('precipitation'))
                      .attr('id', this._indexId('precipitation'))
                      .attr('fill', lcFunc)
                      .attr('stroke', lineColorFunc)
                      .attr('d', d => this._linepad(this._radius.outer + this._radius.bubble*1.10-this._hb(d.precipitation) , this._radius.outer + this._radius.bubble*1.10))),
              update => update.selectAll('g')
                  .data(d => this._processData.get(d))
                  .join('g')
                  .attr('transform', d => `rotate(${(this._xpad[d.month](d.indexName) ) * 180 / Math.PI - 180 })`)
                  .call(g => g.append('path')
                      .attr('class', this._processClass('humidity'))
                      .attr('id', this._indexId('humidity'))
                      .attr('fill', lcFunc)
                      .attr('stroke', lineColorFunc)
                      .attr('d', d => this._linepad(this._radius.outer, this._h(d.humidity))))
                  .call(g => g.append('path')
                      .attr('class', this._processClass('precipitation'))
                      .attr('id', this._indexId('precipitation'))
                      .attr('fill', lcFunc)
                      .attr('stroke', lineColorFunc)
                      .attr('d', d => this._linepad(this._radius.outer + this._radius.bubble*1.10-this._hb(d.precipitation) , this._radius.outer + this._radius.bubble*1.10))),
              exit => exit.remove())
  }

  _initOuterLineG(){
      const v = this._barAngle/2,
          lineStroke = d => (this._allIndex.indexOf(d.date) !== -1) ? d3.color(this._labelcolor[d.month]).darker(2) : d3.color(this._labelcolor[d.month]).darker(0.6),
          lineStrokeWidth = this._outrate(this._leadlineStyle.highlight_strwidth, this._leadlineStyle.original_strwidth);
      this._contentG
          .selectAll('.outerLineG').data(this._padindex)
              .join('g')
              .attr('class', 'outerLineG')
              .selectAll('g')
              .data(d => this._processData.get(d))
              .join('g')
              .attr('transform', d => `rotate(${(this._xpad[d.month](d.date) + v) * 180 / Math.PI - 180 })`)
              .call(g => g.append('line')
                  .attr('class' , d => 'leadline'+ d.month +' line' + d.indexName)
                  .attr('y1', d => this._h(d.humidity))
                  .attr('y2', d => this._radius.outer + this._radius.bubble*1.10-this._hb(d.precipitation))
                  .attr('stroke', lineStroke)
                  .attr('stroke-width', lineStrokeWidth)
                  .attr('opacity', this._leadlineStyle.opacity))
  }

  _initInnerLineG(){
      const v = this._barAngle/2,
          lineStroke = d => (this._allIndex.indexOf(d.date) !== -1) ? d3.color(this._labelcolor[d.month]).darker(2) : d3.color(this._labelcolor[d.month]).darker(0.6),
          lineStrokeWidth = this._outrate(this._leadlineStyle.highlight_strwidth, this._leadlineStyle.original_strwidth);
      this._contentG
          .selectAll('.innerLineG').data(this._padindex)
              .join('g')
              .attr('class', 'innerLineG')
              .selectAll('g')
              .data(d => this._processData.get(d))
              .join('g')
              .attr('transform', d => `rotate(${(this._xpad[d.month](d.date) + v) * 180 / Math.PI - 180 })`)
              .call(g => g.append('line')     //line1
                  .attr('class' , d => 'leadline'+ d.month +' line' + d.indexName +' '+'linecurve')
                  .attr('id' , this._indexId('linecurve'))
                  .style('visibility', this._outrate('visible' , 'hidden' ))
                  .attr('y1', this._radius.inner*0.8 )
                  .attr('y2', d => this._y(d.avg) - 2)
                  .attr('stroke', lineStroke)
                  .attr('stroke-width', lineStrokeWidth)
                  .attr('opacity', this._leadlineStyle.opacity))
              .call(g => g.append('line')     //line2
                  .attr('class' , d => 'leadline'+ d.month +' line' + d.indexName +' '+'linestart')
                  .attr('id' , this._indexId('linestart'))
                  .attr('y1', d => this._y(d.avg)+2)
                  .attr('y2', this._radius.outer)
                  .attr('stroke', lineStroke)
                  .attr('stroke-width', lineStrokeWidth)
                  .attr('opacity', this._leadlineStyle.opacity))
  }

  _initProcessCircle(){
      const wheel = this._container,
          wm = this,
          daker = d =>  d3.color(this._labelcolor[d]).darker(0.6);
      this._contentG
          .selectAll('.processPath').data(this._padindex)
              .join('path')
              .attr('class', 'processPath')
              .attr('d', d => d3.arc()
                  .startAngle(this._padAngle[d][0])
                  .endAngle(this._padAngle[d][1])
                  .innerRadius(this._radius.inner*0.8)
                  .outerRadius(this._radius.inner)(d))
              .attr('id', d => 'process' + d)
              .attr('class', 'processPath')
              .attr('stroke', d => d3.color(this._labelcolor[d]).darker(2))
              .attr('fill',  d => this._labelcolor[d])
              .attr('stroke-width', 0.5)
              .attr('opacity', 0.6)
              .on('mouseover', (e, d) => {
                  this._hightlightcss()
                  wheel.selectAll('#riline' + d)
                      .attr('opacity', 1)
                  wheel.selectAll('.clead'+d )
                      .attr('opacity', wm._cleadStyle.opacity)
                  wheel.selectAll('.innerRiver'+d)
                      .attr('opacity', 0.8)
                  wheel.selectAll('.outerRiver'+d)
                      .attr('opacity', 0.4)
                  wheel.selectAll('#process'+d)
                      .attr('fill',d3.color(this._labelcolor[d]).darker(0.2))
                      .attr('opacity' , 0.6)
                  wheel.selectAll('#circle'+d)
                      .attr('stroke' , 'white')
                  wheel.selectAll('#icon'+d)
                      .attr('href', colourLessIcon[d])
                  wheel.selectAll('.circle_color'+d)
                      .attr('r', wm._outrate(wm._circleStyle.highlight_r + 0.5, wm._circleStyle.original_r + 0.5))
                      .attr('opacity', 1);
                  wheel.selectAll('.heat'+d)
                      .attr('opacity', 1);
                  wheel.selectAll('.precipitation'+d)
                      .attr('stroke', wm._outrate(d3.color(this._labelcolor[d]).darker(1.6), daker(d)))
                      .attr('opacity', 1)
                  wheel.selectAll('.humidity'+d)
                      .attr('stroke', wm._outrate(d3.color(this._labelcolor[d]).darker(1.6), daker(d)))
                      .attr('opacity', 1)
                  wheel.selectAll('.lead' + d )
                      .attr('stroke-width', wm._outrate(wm._leadlineStyle.highlight_strwidth, wm._leadlineStyle.original_strwidth))
                      .attr('opacity', wm._leadlineStyle.opacity)
                  wheel.selectAll('.linestart')
                      .attr('y1', d => this._y(d.avg) + wm._outrate(wm._leadlineStyle.highlight_strwidth, wm._leadlineStyle.original_strwidth)(d))
                  wheel.selectAll('.linecurve')
                      .attr('y2', d => this._y(d.avg) - wm._outrate(wm._leadlineStyle.highlight_strwidth, wm._leadlineStyle.original_strwidth)(d))
                  wheel.selectAll('.arcpie'+d).selectAll('path')
                      .attr('opacity', 1)
                      .style('stroke-width', 0.5)
                  wheel.selectAll('.arctext'+d)
                      .attr('opacity', 1)
                      .attr('fill', d3.color(this._labelcolor[d]).darker(4))
                  d3.select('.iconG').raise()
              })
              .on('mouseleave', (e, d) => {
                  this._initcss()
                  wheel.selectAll('#process' + d)
                      .attr('fill',this._labelcolor[d])
                  wheel.selectAll('#circle'+d)
                      .attr('stroke' , daker(d))
                  wheel.selectAll('#icon'+d)
                      .attr('href', processIcon[d])
                  wheel.selectAll('.circle_color'+d)
                          .attr('r', this._outrate(this._circleStyle.highlight_r, this._circleStyle.original_r));
                  wheel.selectAll('.precipitation'+d)
                      .attr('stroke',daker(d))
                  wheel.selectAll('.humidity'+d)
                      .attr('stroke',daker(d))
                  wheel.selectAll('.lead'+d)
                      .attr('stroke-width', wm._outrate(1,0.5))
                  wheel.selectAll('.linestart')
                      .attr('y1', d =>  this._y(d.avg)+2)
                  wheel.selectAll('.linecurve')
                      .attr('y2', d =>  this._y(d.avg)-2)
                  wheel.selectAll('.arcpie'+d)
                      .style('stroke-width', 0.25)
                  wheel.selectAll('.arctext'+d)
                      .attr('fill', d3.color(this._labelcolor[d]).darker(1.5))
              })
  }

  _initOuterElementG(){
      const pieAngle = d3.pie()
              .value(d => d.angle)
              .startAngle(0.5* Math.PI)
              .endAngle(2.5 * Math.PI),
          piearc = d3.arc()
              .innerRadius(0)
              .outerRadius(this._radius.arc),
          v = this._barAngle/2;
      this._contentG.selectAll('.outerElementG')
          .data(this._padindex)
          .join(
              enter => enter.append('g')
                  .attr('class', 'outerElementG')
                  .selectAll('g')
                  .data(d => this._processData.get(d))
                  .join('g')
                  .attr('visibility', this._outrate('visible', 'hidden'))
                  .call(g => g.append('g')
                      .attr('transform', d => `rotate(${(this._xpad[d.month](d.indexName) + v) * 180 / Math.PI - 180 }) translate(${[0, this._radius.outer + this._radius.bubble*1.38]})`)
                      .selectAll('path').data(d => pieAngle(d.property))
                      .join('path')
                      .attr('d', piearc)
                      .attr('class', d => `arcpie`+ d.data.process)
                      .attr('fill', d => ((+d.data.value) > this._labelLimit[d.data.limit]? this._labelcolor[+d.data.process] : 'white'))
                      .style('stroke', d => ((+d.data.value) > this._labelLimit[d.data.limit]? 'white' : this._labelcolor[+d.data.process]))
                      .style('stroke-width', 0.5))
                  .call(g => g.append('text')
                      .attr('transform', d => `rotate(${(this._xpad[d.month](d.indexName) + 1.5 * v) * 180 / Math.PI - 180 }) translate(${[0, this._radius.outer + this._radius.bubble*1.38 + this._radius.arc/2]})`)
                      .attr('class', this._processClass('arctext'))
                      .attr('id', this._indexId('arctext'))
                      .attr('fill', d =>  d3.color(this._labelcolor[d.month]).darker(3.5))
                      .attr('font-weight', 'bold')
                      .text((d => +this._allIndex.indexOf(d.indexName) + 1)))
              ,
              update => update,
              exit => exit.remove()
          )
  }

  _initInnerOverlay(){
      this._contentG.selectAll('overlayG').remove()
      const overlayG = this._contentG.append('g')
              .attr('class', 'overlayG');
      overlayG.selectAll(' .visoverlay')
              .data(this._chartData)
              .join('g')
              .attr('class', 'visoverlay')
              .attr('transform', d => `rotate(${this._xpad[d.month](d.indexName) * 180 / Math.PI - 180})`) // rad 2 deg - 180 -> rotate back to 12 o'clock                
              .call(g => g.append('path')
                  .attr('d', this._line(this._radius.inner, this._radius.max)))
                  .on('mouseover', (e, d) => {
                      this._insertInfo(e, d);
                      this._hightlightcss()
                      this._axisenter(d.indexName, d.month);                           
                  })
                  .on('mouseleave', (e, d) => {
                      this._initcss()
                      this._axisout(d.indexName, d.month);
                  });
  }

  _initChordData(){
      const sample = this._sort(this._chartData),
      // this._chartData,
          graph = {nodes:[],links:[]};
      // this._allIndex = d3.map(sample, d => d.indexName);
      for (let item in sample){
          let i = this._chordData['label'].indexOf(sample[item].indexName),
              targets = [],
              id = sample[item].indexName;
          for (let target = +item + 1;target < sample.length ;target++){
              let j = this._chordData['label'].indexOf(sample[target].indexName);
              if(this._chordData['corr'][i][j] > this._vN.corrSize){
                  if(sample[item].month == sample[target].month){
                      targets.push(sample[target].indexName)
                      graph.links.push({'source':id,'target':sample[target].indexName,value:1})
                  }
              }
          }
          graph.nodes.push({'id':id,'group': sample[item].month,'targets':targets})
      }
      this._graph = graph;
  }

  _renderWheelChord(){
      const r = this._radius,
          lc = this._labelcolor,
          xpad = this._xpad,
          v = this._barAngle/2,
          chordG = this._contentG.append('g')
              .attr('transform',`rotate(${-60})`)
              .attr('class', 'chordG'),
          tree = d3.cluster()
              .size([2 * Math.PI, r.inner*0.8]),
          clusterLine = d3.lineRadial()
              .curve(d3.curveBundle.beta(this._vN.curveSize))   //d3.curveNatural
              .radius(d => d.y)
              .angle(d => d.x),
          {nodes, links} = this._graph,
          groupById = new Map,
          nodeById = new Map(nodes.map(node => [node.id, node])),
          colornone = '#ccc';

      function bilink(root) {
          const map = new Map(root.leaves().map(d => [d.data.id, d]));
          for (const d of root.leaves()) d.incoming = [], d.outgoing = d.data.targets.map(i => [d, map.get(i)]);
          for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
          return root;
      }

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
          // .sort((a, b) => d3.ascending(a.height, b.height) || d3.ascending(a.data.id, b.data.id))
          ));
      const node = chordG.append('g')
          .selectAll('g')
          .data(root.leaves())
          .join('g')
              .attr('transform', d => {
                  d.x=xpad[+d.data.group](d.data.id) + v +1/3*(Math.PI);
                  return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`
                  })
          .call(g =>g.append('path')
              .attr('transform', d => `translate(${-d.y},0)  rotate(${-90-v* 180 / Math.PI})`)
              .attr('fill', 'white')
              .attr('opacity', 0)
              .attr('d', this._line(r.inner, r.max)))
              .on('mouseover', (e, d) => {
                  this._overed(e, d.data.id, d.data.group)
              })
              .on('mouseout', (e, d) => {
                  this._outed(e, d.data.id, d.data.group)
              })
      const labelcol=(d , i) => d3.color(lc[+d[0].data.group]).darker(0.6);
      const linedata = root.leaves().flatMap(leaf => leaf.outgoing);
      this._leavesData = root.leaves();
      this._lineData = linedata;

      const link = chordG.append('g')
          .attr('class', 'linkG')
          .attr('stroke', colornone)
          .attr('fill', 'none')
          .selectAll('path')
          .data(linedata)
          .join('path')
              .attr('d', ([i, o]) => clusterLine(i.path(o)))
              .each(function(d) { d.path = this; })
              .attr('class',d=>{
                  return 'clead'+ (+d[0].data.group) + ' clinein'+d[0].data.id +' clineout'+d[1].data.id
              })
              .attr('stroke',  labelcol)
              .attr('stroke-width', this._cleadStyle['stroke-width'])
              .attr('opacity', this._cleadStyle.opacity)
  }

  _updateChord(){
    const clusterLine = d3.lineRadial()
      .curve(d3.curveBundle.beta(this._vN.curveSize))   //d3.curveNatural
      .radius(d => d.y)
      .angle(d => d.x);
    // t = d3.transition()
    //   .duration(300)
    //   .ease(d3.easeLinear);
    
      this._contentG.select('.linkG').selectAll('path')
      // .transition(t)
      .attr('d', ([i, o]) => clusterLine(i.path(o)));
  }

  _axisenter(name, key){
      const cG = this._container,
          wm = this,
          lck =  this._labelcolor[key],
          daker = d3.color(lck).darker(0.6);
      cG.selectAll('#riline'+key)
              .attr('opacity',1)
      cG.selectAll('.innerRiver'+key)
              .attr('opacity', 0.8)
      cG.selectAll('.outerRiver'+key)
          .attr('opacity', 0.4)
      cG.selectAll('#process' + key)
              .attr('opacity' , 0.6)
      cG.select('#circle'+name)
              .attr('r', this._circleStyle.highlight_r)
              .attr('opacity', 1);
      cG.select('#heat' + name)
          .attr('opacity', 1)
      cG.select('#precipitation'+name)
          .attr('stroke', wm._outrate(d3.color(lck).darker(1.6), daker))
          .attr('opacity', 1)
      cG.select('#humidity'+name)
          .attr('stroke', wm._outrate(d3.color(lck).darker(1.6), daker))
          .attr('opacity', 1)
      cG.selectAll('.line'+name)
          .attr('stroke',d3.color(lck).darker(4))
      cG.selectAll('.line' + name)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.4)
      cG.selectAll('#linestart'+ name)
          .attr('y1', d => wm._y(d.avg) + this._circleStyle.highlight_r)
      cG.selectAll('#linecurve' + name)
          .attr('y2', d => wm._y(d.avg) - this._circleStyle.highlight_r)
      cG.selectAll('.piePath'+ name).selectAll('path')
          .style('stroke-width', 0.5)
          .attr('opacity', 1)
      cG.selectAll('#arctext'+name)
              .attr('opacity', 1)
              .attr('fill', d3.color(lck).darker(4))
      cG.selectAll('.clinein' + name)
          .attr('opacity', this._cleadStyle.opacity)
      cG.selectAll('.clineout' + name)
          .attr('opacity', this._cleadStyle.opacity)
  }

  _axisout(name, key){
      const cG = this._container,
          lck =  this._labelcolor[key],
          daker = d3.color(lck).darker(0.6);
      cG.select('#circle'+name)
          .attr('r', this._circleStyle.original_r);
      cG.select('#precipitation'+name)
          .attr('stroke', daker)
      cG.select('#humidity'+name)
          .attr('stroke', daker)
      cG.selectAll('.line'+name)
          .attr('stroke', daker)        
      cG.selectAll('.line' + name)
          .attr('stroke-width', this._outrate(this._leadlineStyle.highlight_strwidth, this._leadlineStyle.original_strwidth))
      cG.selectAll('#linestart'+ name)
          .attr('y1', d =>  this._y(d.avg) + this._circleStyle.original_r)
      cG.selectAll('#linecurve' + name)
          .attr('y2', d =>  this._y(d.avg)- this._circleStyle.original_r)
      cG.selectAll('.piePath'+ name).selectAll('path')
          .style('stroke-width', 0.25)
      cG.selectAll('#arctext'+name)
          .attr('fill', d3.color(lck).darker(1.5))
      cG.selectAll('.dailyInfo').remove()
      cG.selectAll('.clineout' + name)
          .attr('opacity',0.4)
          .attr('stroke', daker).raise()
      cG.selectAll('.clinein' + name)
              .attr('opacity',0.4)
  }

  _multiplyTarget(name){
      var target=[]
      for (let item of this._leavesData){
          if(item.data.id===name){
              target=item.data.targets
          }
      }
      for (let item of this._lineData){
          if(item[1].data.id===name){
              target.push(item[0].data.id)
          }
      }
      return [...new Set(target)]
  }

  _outed(e, name, key) {
      this._initcss()
      this._axisout(name, key);
      let rlines = this._multiplyTarget(name);
      for (let index of rlines){
          this._axisout(index, key);
      }
  }

  _overed(e, name, key){
      const data = this._chartData.filter(d => d.indexName===name)[0];
      this._hightlightcss()
      this._axisenter(name, key);
      let rlines = this._multiplyTarget(name)
      for (let index of rlines){
          this._axisenter(index, key);
      }
      this._insertInfo(e, data)
  }

  _initcss(){
      const cG = this._container;
      cG.selectAll('.riverLine')
          .attr('opacity', 1)
      for (let i in [0,1,2]){
          cG.selectAll('.leadline'+i )
              .attr('opacity', this._leadlineStyle.opacity)
          cG.selectAll(`.clead${i}`)
              .attr('opacity', this._cleadStyle.opacity)
          cG.selectAll('.humidity'+i)
              .attr('opacity', 1)
          cG.selectAll('.precipitation'+i)
              .attr('opacity', 1)
          cG.selectAll('.circle_color'+i)
              .attr('opacity', 1)
          cG.selectAll('.heat' + i)
              .attr('opacity', 1)
          cG.selectAll('.arcpie'+i)
              .attr('opacity', 1)
          cG.selectAll('.arctext'+i)
              .attr('opacity', 1)
          cG.selectAll('.innerRiver'+i)
              .attr('opacity', 0.8)
          cG.selectAll('.outerRiver'+i)
              .attr('opacity', 0.4)
      }
      cG.selectAll('.processPath')
          .attr('opacity' , 0.6)
  }
  _hightlightcss(){
      const cG = this._container;
      cG.selectAll('.riverLine')
          .attr('opacity', 0.4)
      for (let i in [0,1,2]){
          cG.selectAll('.leadline' + i )
              .attr('opacity', 0.1)
          cG.selectAll('.clead' + i )
              .attr('opacity', 0.1)
          cG.selectAll('.humidity' + i)
              .attr('opacity', 0.5)
          cG.selectAll('.precipitation' + i)
              .attr('opacity', 0.5)
          cG.selectAll('.circle_color' + i)
              .attr('opacity', 0.5)
          cG.selectAll('.heat' + i)
              .attr('opacity', 0.5)
          cG.selectAll('.arcpie' + i)
              .attr('opacity', 0.5)
          cG.selectAll('.arctext' + i)
              .attr('opacity', 0.5)
          cG.selectAll('.innerRiver' + i)
              .attr('opacity', 0.4)
          cG.selectAll('.outerRiver' + i)
              .attr('opacity', 0.1)
      }
      cG.selectAll('.processPath')
          .attr('opacity' , 0.3)
  }

  _insertInfo(e, d){
      const t = this._texts,
          lck = this._labelcolor[d.month];
      let x=  e.offsetX,
          y=  e.offsetY;
      this._dailyInfo = this._container.append('g')
          // .style('visibility', 'hidden')
          .attr('transform', `translate(${[x , y - this._height/2]})`)
          .attr('class','dailyInfo')
          .attr('font-size', '7pt')
          .style('font-family', 'DIN')
          .style('font-weight', 'normal')
          .call(g => g.append('rect')
                  .attr('x' , -10)
                  .attr('y' , -15)
                  .attr('rx' , 5)
                  .attr('ry', 5)
                  .style('fill', lck)
                  .attr('stroke', 'grey')
                  .attr('stroke-width',1)
                  .attr('width', 165)
                  .attr('opacity' ,0.5)
                  .attr('height', 95))
          .call(g => g.append('g')                       
              .call(g => t.name = g.append('text').attr('fill', 'black').text('Date: '))
              .call(g =>  g.append('line').attr('x1',-1).attr('x2', 130).style('stroke', d3.color(lck).darker(4)).attr('y1', 2).attr('y2', 2).style('stroke-width', 0.5))
              .call(g => t.avg = g.append('text').attr('y', '1.3em').attr('fill', 'black').text('Avg: ')) 
              .call(g => t.deviation = g.append('text').attr('y', '2.6em').attr('fill', 'black').text('Deviation: ')))
              .call(g => t.high = g.append('text').attr('y', '3.9em').attr('fill', 'black').text('High: '))
              .call(g => t.low = g.append('text').attr('y', '5.2em').attr('fill', 'black').text('Low: '))
              .call(g => t.prec = g.append('text').attr('y', '6.5em').attr('fill', 'black').text('Prec.: '))
              .call(g =>  g.append('line').attr('x1',-1).attr('x2', 135).style('stroke', d3.color(lck).darker(4)).attr('y1', 2+4*12.4).attr('y2', 2+4*12.4).style('stroke-width', 0.5))
              .call(g => t.humidity = g.append('text').attr('y', '7.8em').attr('fill', 'black').text('Humidity: '))
      t.name.text(`Index: ${d.indexName}`);
      t.avg.text(`Value: ${d.avg.toFixed(3)}`)
      t.deviation.text(`Deviation: ${d.deviation.toFixed(3)}`)
      t.high.text(`High: ${d.high.toFixed(3)}`);
      t.low.text(`Low: ${d.low.toFixed(3)}`);
      t.prec.text(`SPE.: ${d.precipitation.toFixed(3)}`);
      t.humidity.text(`T^2: ${d.humidity.toFixed(3)}`);
      this._dailyInfo.raise();
  }
  _sort(data){
      let speSort = d3.sort(data,d=> d.precipitation),
          T2Sort = d3.sort(data,d=> d.humidity);
      var sortdata = data.filter(d =>{
          return d.deviation !==0
          // (d3.map(speSort, e=> e.indexName).indexOf(d.indexName)<= this._vN.multiPara || d3.map(T2Sort, e=> e.indexName).indexOf(d.indexName)<= this._vN.multiPara) && d.deviation !==0
      })
      var SPE=d3.sort(sortdata,d=> -d.precipitation),
          T2=d3.sort(sortdata,d=> -d.humidity),
          res=d3.sort(sortdata,d=> -d.deviation);
      for (let item in SPE){
          let query=SPE[item].indexName                     
          SPE[item].order=+item+1+(+T2.findIndex((value)=> value.indexName===query))+1+(+res.findIndex((value)=> value.indexName===query))+1
      }
      return d3.sort(SPE,d=> d.order).filter((d, i) => i <= this._vN.multiPara);
  }

  _deepCopy(obj){
      if(obj instanceof Date) return obj;
      if(typeof obj!=='object') return obj;
      var newObj=obj instanceof Array ? [] :{};
      for (let key in obj){
          if(obj.hasOwnProperty(key)){
              if(obj[key]===null){
                  newObj[key]===null;
              }
              newObj[key]=typeof obj[key] ? this._deepCopy(obj[key]) : obj[key];
          }
      }
      return newObj
  }

  _horizonColor(arr){
      let len = arr.filter(d => d.value > d.high || d.l > d.value).length;
      return d3.scaleLinear()
          .domain([0, arr.length])
          .range(['#b9c6cd', '#e3ad92'])
          .interpolate(d3.interpolateRgb.gamma(2.2))(len)
  }
  _line(y1, y2) {
      return d3.arc()
          .innerRadius(y1)
          .outerRadius(y2)
          .startAngle(Math.PI)
          .endAngle(this._barAngle + Math.PI)();
  }
  _linepad(y1, y2) {
      return d3.arc()
          .innerRadius(y1)
          .outerRadius(y2)
          .startAngle(Math.PI)
          .padAngle((this._barAngle)/this._linespace)
          .endAngle(this._barAngle + Math.PI)();
  }

  _outrate(item1 , item2){
    return d => (this._allIndex.indexOf(d.indexName) !== -1 && this._allIndex.indexOf(d.indexName) < 9) ? item1 : item2
  }
}