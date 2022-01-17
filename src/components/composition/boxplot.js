import * as d3 from 'd3';
import { addElement, updateElement, attrTween, stringify} from 'utils/element';
const labelColor = ["#e3ad92",   "#b9c6cd"];
export function preRoll(data){
  let res = new Map(),
    map = new Map();
  for(let passNum in data){
    let datum = data[passNum].result;
    let passArr = new Array(data[passNum].passcount).fill(0).map((d, i) => {
      let arr = datum['sample'][i];
      arr.quartiles = [datum['min'][i], datum['mean'][i], datum['max'][i]];
      arr.min = Math.min(...arr.map(d => d.value), datum['emin'][i]);
      arr.max = Math.max(...arr.map(d => d.value), datum['emax'][i]);
      arr.range = [datum['emin'][i], datum['emax'][i]];
      arr.forEach(e => {e.pass = i, e.overflow = 
        e.value > arr.range[1] || e.value < arr.range[0] ? true : false});
      return {key: i,value: arr}
    });
    passArr.upid = passArr[0].value.map(e => e.upid);
    let upidArr = passArr.upid;
    for(let i in upidArr){
      map.set(upidArr[i], passArr.map(e => e.value[i]))
    }
    res.set(data[passNum].passcount, passArr);
  }
  return [res, map];
}
class box {
  constructor(container, vNode) {
    this._container = container;
    this._vNode = vNode;
    this._g = this._container.append('g').attr('class', 'scaleGroup');
    this._margin = {top: 20, right: 20, bottom: 40, left: 50};
    this._height = 160;
    this._width = 750;
    
    //init data
    this._originData = null;
    this._passMap = null;
    this._name = undefined;
    this._color = 'green'
    
    this._data = null;
    this._range = null;
    this._minLen = null;
    this._maxLen = null;
    
    // init scale
    this._xScale = null;
    this._xLinear = null;
    this._yScale = null;
    this._xAxis = null;
    this._yAxis = null;

    this._length = 0;

    //groups
    this._mainGroup = null;

    //box
    this._boxWidth = 30;

    this._selectKey = '';
    this._selectNums = 0;
    this._selectOver = 0;

    this._bottomShadowAttrs = {
      'class': 'bottomGantt',
      'display': 'none',
      'fill': '#999999',
      y: -1.5,
      height: 3,
      width: this._width - this._margin.right - this._margin.left,
      transform: `translate(${this._margin.left},${this._height - this._margin.bottom / 2 + 5})`
    }

    this._ganttAttrs = {
      class: 'Gantt',
      transform: `translate(${0},${this._height - this._margin.bottom / 2 + 5})`
    }

    this._vertLineAttrs = {
      class: 'vertLine',
      stroke: '#94a7b7',
      'stroke-width': '1px',
    };

    this._boxAttrs = {
      class: 'box',
      stroke: '#94a7b7',
      fill: 'white',
    };

    this._horizontalLineAttrs = {
      'class': 'horizontalLine',
      'stroke': '#94a7b7',
      'stroke-width': '1px'
    };
  }
}
export class boxplot extends box{
  constructor(container, vNode) {
    super(container, vNode)

    this._passArr = null;

    this._circleEvents = {};
  }
  enter(options){
    this._originData = options.data;
    [this._passMap, this._upidMap] = options.func(this._originData);
    // console.log(this._passMap);
    // console.log(this._upidMap);
    this._passArr = [...this._passMap.keys()];
    [this._minLen, this._maxLen]  = d3.extent(this._passArr);
    this._length = this._maxLen;
    this._range = this._passMap.get(this._length).range;
    this._name = options.label;
    // this._data = options.func(options.data);
    this._g.attr('transform', `scale(${Math.min(options.height/this._height)})`); //options.width/this._width, 
    return this;
  }
  render(){
    this._initBackground();
    this._initScale();
    this._initStaticLine();
    this._initAttrs();
    this._initEvents();
    this._initBox();
    return this;
  }
  _initBackground(){
    this._g.append('rect')
      .attr('fill', 'white')
      .attr('stroke', 'none')
      .attr('transform', `translate(${this._margin.right}, ${this._margin.top})`)
      .attr('width', this._width - this._margin.right - this._margin.left)
      .attr('height', this._height - this._margin.top - this._margin.bottom)
  }
  _initScale(){
    const renderData = this._passMap.get(this._length);
    this._xScale = d3.scaleBand()
      .range([this._margin.left, this._width - this._margin.right])
      .domain(renderData.map(d => d.key))
      .paddingInner(1)
      .paddingOuter(.5);
    this._xLinear = d3.scaleLinear()
      .range([this._xScale(renderData[0].key), this._xScale(renderData[renderData.length - 1].key)])
      .domain(d3.extent(renderData, d => d.key));
    this._yScale = d3.scaleLinear()
      .domain([d3.min(renderData, d => d.value.min) * 0.98, d3.max(renderData, d => d.value.max) * 1.02])
      .clamp(true)
      // .domain([ d3.min(renderData, d => d3.quantile(d.value, 0.05, e => e.value)), d3.max(renderData, d => d3.quantile(d.value, 0.95, e => e.value))])
      // .domain(this._range)
      .nice()
      .range([this._height - this._margin.bottom, this._margin.top]);
    this._xAxis = g => g
      .attr('transform', `translate(0,${this._height - this._margin.bottom})`)
      .call(d3.axisBottom(this._xScale));
    this._yAxis = g => g
      .attr('transform', `translate(${this._margin.left},0)`)
      .call(d3.axisLeft(this._yScale).ticks(3, 's'))
      // .ticks(null, 's'))
      .call(g => g.select('.domain').remove());

    this._g.append('g').attr('class', 'xAxis').call(this._xAxis);
    this._g.append('g').attr('class', 'yAxis').call(this._yAxis);
  }
  _initStaticLine(){
    this._g.call(g => addElement(g, 'rect', this._bottomShadowAttrs))
    this._Gantt = this._g.append('g').call(g => updateElement(g, this._ganttAttrs));
    this._defs = this._g.append('linearGradient')
      .attr('id', `${this._name}-gradient`)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', '0%')
      .attr('x2', '100%')
  }
  _initAttrs(){
    const boxWidth = this._xScale.step() / 3;;
    // const jitterWidth = this._boxWidth;

    Object.assign(this._vertLineAttrs, {
      y1: d => this._yScale(this._passMap.get(this._length)[d].value.range[0]),
      y2: d => this._yScale(this._passMap.get(this._length)[d].value.range[1])
    })
    Object.assign(this._boxAttrs, {
      x: -boxWidth/2,
      y: d => this._yScale(this._passMap.get(this._length)[d].value.quartiles[2]),
      height: d => this._yScale(this._passMap.get(this._length)[d].value.quartiles[0])
        - this._yScale(this._passMap.get(this._length)[d].value.quartiles[2]),
      width: boxWidth,
    });
    Object.assign(this._horizontalLineAttrs, {
      'x1': -boxWidth/2,
      x2: +boxWidth/2,
      y1: d => this._yScale(d),
      y2: d => this._yScale(d)
    });
    this._pointAttrs = {
      cx: 0,  //d => 0 - jitterWidth/2 + Math.random() * jitterWidth
      cy: d => this._yScale(d.value),
      fill: d => d.overflow ? labelColor[0] : labelColor[1],//'#af5f68',
      'fill-opacity': d => d.overflow ? 1 : 0.75,
      r: 2
    };
    this._passLineAttrs = {
      class: 'passLine',
      d: d => d3.line().x((d, i) => this._xLinear(i)).y(d => this._yScale(d)).curve(d3.curveLinear)(d),
      stroke: `url(#${this._name}-gradient)`,//'#af5f68',
      display: 'none',
      'stroke-width': 1.5,
      fill: 'none'
    }
  }
  _initEvents(){
    const that = this;
    this._circleEvents.mousemove = function(e, d){
      that._vNode.removeTooltip();
      that._updateCircle(d.upid);
      if(that._selectKey === '')that._initLine(d.upid);
      that._vNode.$nextTick(()=> that._vNode.showTooltip({
          x: e.pageX,y: e.pageY - 2,
          background: 'white',
          stroke: d3.color(that._color).darker(0.5),
          tspan: [`upid: ${d.upid}`, `pass: ${d.pass}`, `value: ${stringify(d.value)}`],
          fill: d3.color(that._color).darker(0.5)
        }));
    }
    this._circleEvents.mouseleave = function(e, d){
      that._vNode.removeTooltip();
      if(that._selectKey === '')that._removeLine();
      that._initCircle();
    }
    this._circleEvents.click = function(e, d){
      that._selectCircle(d.upid);
    }
  }
  _initBox(){
    const that = this;
    this._mainGroup = this._g.append('g')
      .attr('class', 'mainGroup');
    const groups = this._mainGroup
      .selectAll('g')
      .data(new Array(this._maxLen).fill(0).map((d, i) => i))
      .join('g')
      .attr('transform', d => `translate(${this._xLinear(d)}, 0)`)
      .attr('display', d => d < this._length ? 'block' : 'none');
    // groups
    const enter = groups.filter(d => d < this._length);
    enter
      .call(g => g.selectAll('points')
        .data(d => this._passMap.get(this._length)[d].value)
        .join('circle')
        .on('mousemove', this._circleEvents.mousemove)
        .on('mouseleave', this._circleEvents.mouseleave)
        .on('click', this._circleEvents.click)
        .call(g => updateElement(g, this._pointAttrs)))
      .call(g => g.selectAll('.horizontalLine')
        .data(d => {
          let datum = this._passMap.get(this._length)[d].value;
          return [datum.range[0], datum.quartiles[1], datum.range[1]];
        })
        .join('line')
        .call(g => updateElement(g, this._horizontalLineAttrs)))
    enter
      .call(g => g.selectAll('.vertLine')
        .data(d => [d])
          .join('line')
          .call(g => updateElement(g, this._vertLineAttrs)))
      .call(g => g.selectAll('.box')
        .data(d => [d])
          .join('rect')
          .call(g => updateElement(g, this._boxAttrs)))
      // addElement(g, 'line', this._vertLineAttrs))
      // .call(g => addElement(g, 'rect', this._boxAttrs))
  }
  _renderChart(upid){
    this._removeLine();
    this._selectKey = upid;
    if(this._upidMap.get(upid) === undefined)return;
    this._length = this._upidMap.get(upid).length;
    const renderData = this._passMap.get(this._length);
    this._xScale.domain(renderData.map(d => d.key));
    this._yScale.domain([d3.min(renderData, d => d.value.min), d3.max(renderData, d => d.value.max)])
    this._xLinear.domain(d3.extent(renderData, d => d.key))
      .range([this._xScale(renderData[0].key), this._xScale(renderData[renderData.length - 1].key)]);

    this._updateBox();
    this._selectCircle(upid);
  }
  _updateBox(){
    this._initAttrs();
    const t = d3.transition()
      .duration(300)
      .ease(d3.easeLinear);
    
    // this._g.select('.xAxis').transition(t).call(this._xAxis)
    this._g.transition(t)
      .call(g => g.select('.xAxis').call(this._xAxis))
      .call(g => g.select('.yAxis').call(this._yAxis));

    // this._g.transition(t).select('.bottomGantt')
    //   .attr('x', this._xScale(0))
    //   .attr('width', this._xScale(this._length - 1) - this._xScale(0))
    
    this._mainGroup.selectAll('g')
      .transition(t)
      .attr('transform', d => `translate(${this._xLinear(d)}, 0)`)
      .attr('display', d => d < this._length ? 'block' : 'none');

    const enter = this._mainGroup.selectAll('g').filter(d => d < this._length);
    
    enter.selectAll('circle')
    .data(d => this._passMap.get(this._length)[d].value)
    .join(enter => addElement(enter, 'circle', this._pointAttrs)
      .attr('cy', d => this._yScale(d.value) - 10)
      .on('mousemove', this._circleEvents.mousemove)
      .on('mouseleave', this._circleEvents.mouseleave)
      .on('click', this._circleEvents.click),
      update => update,
      exit => exit.transition(t).remove().attr('cy', d => this._yScale(d.value) + 10)
    )
    .call(g => updateElement(g.transition(t), this._pointAttrs));

      enter
      .call(g => g.selectAll('.vertLine')
        .data(d => [d])
          .join(enter => addElement(enter, 'line', this._vertLineAttrs)
            .attr('transform', `translate(0, -20)`),
            update => update,
            exit => exit.transition(t).remove().attr('transform', `translate(0, 20)`)
          )
          .call(g => updateElement(g.transition(t), this._vertLineAttrs)))
      .call(g => g.selectAll('.box')
          .data(d => [d])
          .join(enter => addElement(enter, 'rect', this._boxAttrs)
            .attr('transform', `translate(0, -20)`),
            update => update,
            exit => exit.transition(t).remove().attr('transform', `translate(0, 20)`)
          )
          .call(g => updateElement(g.transition(t), this._boxAttrs)));
    

    enter.selectAll('.horizontalLine')
        .data(d => {
          let datum = this._passMap.get(this._length)[d].value;
          return [datum.range[0], datum.quartiles[1], datum.range[1]];
        })
        .join(enter => addElement(enter, 'line', this._horizontalLineAttrs)
          .attr('x1', -20).attr('x2', -20),
          update => update,
          exit => exit.transition(t).remove().attr('x1', 20).attr('x2', 20)
        )
        .call(g => updateElement(g.transition(t), this._horizontalLineAttrs));

  }
  _updateCircle(upid){ //hightlight points
    const t = d3.transition()
      .duration(150)
      .ease(d3.easeQuad);
    this._mainGroup.selectAll('circle')
      .transition(t)
      .attr('opacity', d => d.upid === upid || d.upid === this._selectKey ? 1 : 0.2);

    this._mainGroup.selectAll('circle').filter(d => d.upid === upid || d.upid === this._selectKey || d.overflow).raise()
  }
  _selectCircle(upid){
    this._selectKey = upid;
    const datum = this._upidMap.get(upid);
    this._selectNums = datum.filter(d => d.overflow).length;
    
    let arr = this._passMap.get(datum.length).map(d => d.value);
    let range = arr.map(d => d.range),
      quartiles = arr.map(d => d.quartiles),
      temp1 = datum.map((d, i) => {
        let arr = range[i],
          value = d.value;
        return arr[0] >= value ? (arr[0] -value)/arr[0] : (arr[1] <= value ? (value - arr[1])/arr[1] : 0)
      }),
      temp2 = datum.map((d, i) => {
      let arr = quartiles[i],
        value = d.value;
      return arr[0] >= value ? (arr[0] -value)/arr[0] : (arr[2] <= value ? (value - arr[2])/arr[2] : 0)
    })
    this._selectOver = 1 * Math.max(...temp1) + 0 * Math.max(...temp2)
    this._initLine(upid);
    this._initCircle();
  }
  _initCircle(){
    // const t = d3.transition()
    //   .duration(150)
    //   .ease(d3.easeQuad);
    this._mainGroup.selectAll('circle')
      .attr('opacity', this._selectKey !== '' ? (d => d.upid === this._selectKey ? 1 : 0.2) : 1);

    ['horizontalLine', 'box', 'vertLine', 'passLine'].map( d => this._mainGroup.selectAll(`.${d}`).raise())
    this._mainGroup.selectAll('circle')
      .call(g => g.filter(d => d.upid !== this._selectKey || !d.overflow).lower())
      .call(g => g.filter(d => d.upid === this._selectKey || d.overflow).raise())
  }
  _initLine(upid){
    const datum = this._upidMap.get(upid);
    this._defs.selectAll('stop').remove()
    this._defs.selectAll('stop').data(new Array(this._length).fill(0).map((_, i) => i))
      .join('stop')
        .attr('offset', d => d/this._length)
        .attr('stop-color', d =>  datum[d].overflow ? labelColor[0] : labelColor[1])
    this._g.select('.passLine').remove();
    
    const path = this._mainGroup
      .append('path')
      .datum(datum.map(d => d.value))
      .call(g => updateElement(g, this._passLineAttrs));
    const lineLength = path.node().getTotalLength();
    const t = d3.transition()
      .duration(1500)
      .ease(d3.easeQuad);
    path
      .attr('stroke-dasharray', `${0},${lineLength}`)
      .attr('display', 'block');
    
    const selction = this._mainGroup.select('.passLine').transition(t);
    attrTween(selction, 'stroke-dasharray', function() {
      const length = this.getTotalLength();
      return d3.interpolate(`0,${length}`, `${length},${length}`);
    })

    this._g.transition(d3.transition()
      .duration(150)
      .ease(d3.easeQuad)).select('.bottomGantt').attr('display', 'block')

    const rectAttrs = {
      width: this._xScale.step(),
      height: 10,
      y: -5,
      fill: labelColor[0],
      x: d => this._xScale(d) - this._xScale.step()/2,
      stroke: 'none'
    }
    this._Gantt
      .selectAll('rect')
      .data(datum.filter(d => d.overflow).map(d => d.pass))
      .join(enter => addElement(enter, 'rect', rectAttrs),
        update => updateElement(update.transition().duration(150).ease(d3.easeQuad), rectAttrs),
        exit => exit.remove())
  }
  _removeLine(){
    this._g.select('.passLine').remove();
    this._g.select('.bottomGantt').attr('display', 'none')
    this._Gantt
      .selectAll('rect').remove();
  }
} 
export function preHeat(data){
  let map = new Map();
    let passArr = new Array(data.length).fill(0).map((d, i) => {
      let datum = data[i],
        arr = [];
      let temp = datum['sample'];
      temp.forEach(e => {e.pass = i, e.overflow = 
        e.value > datum['emax'] || e.value < datum['emin'] ? true : false});
      let upidMap = d3.group(temp, d => d.upid);
      for (let pass of upidMap.values()) {
        if(pass.filter(d => d.overflow).length !== 0){
          arr.push(...pass.filter(d => d.overflow))
        }else{
          pass[0].value = d3.mean(pass, d => d.value)
          arr.push(pass[0]);
        }
      }
      arr.quartiles = [datum['min'], datum['mean'], datum['max']];
      arr.min = datum['emin'];
      arr.max = datum['emax'];
      arr.range = [ arr.min, arr.max];
      for(let item in arr){
        if(arr[item].upid == undefined)continue;
        let temp = map.get(arr[item].upid);
        if(temp == undefined){
          map.set(arr[item].upid, [arr[item]])
        }else{
          temp.push(arr[item])
        }
      }
      return {key: i,value: arr}
    });
  return [passArr, map];
}
export class heatplot extends box{
  constructor(container, vNode) {
    super(container, vNode);
  }
  enter(options){
    this._originData = options.data;
    [this._passMap, this._upidMap] = options.func(this._originData);
    this._length = this._passMap.length;
    this._name = options.label;
    this._data = options.func(options.data);
    this._color = options.color;
    this._g.attr('transform', `scale(${Math.min(options.height/this._height)})`); //options.width/this._width, 
    return this;
  }
  render(){
    this._initBackground();
    this._initScale();
    this._initStaticLine();
    this._initAttrs();
    this._initBox();
    return this;
  }
  _initBackground(){
    this._g.append('rect')
      .attr('fill', 'white')
      .attr('stroke', 'none')
      .attr('transform', `translate(${this._margin.right}, ${this._margin.top})`)
      .attr('width', this._width - this._margin.right - this._margin.left)
      .attr('height', this._height - this._margin.top - this._margin.bottom)
  }
  _initScale(){
    const renderData = this._passMap;
    this._xScale = d3.scaleBand()
      .range([this._margin.left, this._width - this._margin.right])
      .domain(renderData.map(d => d.key))
      .paddingInner(1)
      .paddingOuter(.5);
    this._xLinear = d3.scaleLinear()
      .range([this._xScale(renderData[0].key), this._xScale(renderData[renderData.length - 1].key)])
      .domain(d3.extent(renderData, d => d.key));
    this._yScale = d3.scaleLinear()
      .domain([d3.min(renderData, d => d.value.min === 0 ? Infinity : d.value.min) * 0.98 , d3.max(renderData, d => d.value.max) * 1.02])
      .clamp(true)
      .nice()
      .range([this._height - this._margin.bottom, this._margin.top]);
    this._xAxis = g => g
      .attr('transform', `translate(0,${this._height - this._margin.bottom})`)
      .call(d3.axisBottom(this._xScale));
    this._yAxis = g => g
    .attr('transform', `translate(${this._margin.left},0)`)
    .call(d3.axisLeft(this._yScale).ticks(5, 's'))
    // .ticks(null, 's'))
    .call(g => g.select('.domain').remove());

    this._g.append('g').attr('class', 'xAxis').call(this._xAxis);
    this._g.append('g').attr('class', 'yAxis').call(this._yAxis);
  }
  _initStaticLine(){
    this._g.call(g => addElement(g, 'rect', this._bottomShadowAttrs));
    this._Gantt = this._g.append('g').call(g => updateElement(g, this._ganttAttrs));
    this._defs = this._g.append('linearGradient')
      .attr('id', `${this._name}-gradient`)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', '0%')
      .attr('x2', '100%')
  }
  _initAttrs(){
    this._boxWidth = this._xScale.step() / 3;
    const boxWidth = this._boxWidth;
    const jitterWidth = this._boxWidth;

    const boxScale = this._passMap.map(d => {
      let range = d3.extent(d.value, d => d.position);
      if(range[0] === undefined)return 'no Scale';
      return d3.scaleLinear().range([-jitterWidth/2, jitterWidth/2]).domain(range);
    })

    Object.assign(this._vertLineAttrs, {
      y1: d => this._yScale(this._passMap[d].value.range[0]),
      y2: d => this._yScale(this._passMap[d].value.range[1])
    });
    Object.assign(this._boxAttrs, {
      x: -boxWidth/2,
      y: d => this._yScale(this._passMap[d].value.quartiles[2]),
      height: d => this._yScale(this._passMap[d].value.quartiles[0])
        - this._yScale(this._passMap[d].value.quartiles[2]),
      width: boxWidth,
    });
    Object.assign(this._horizontalLineAttrs, {
      'x1': -boxWidth/2,
      x2: +boxWidth/2,
      y1: d => this._yScale(d),
      y2: d => this._yScale(d)
    });
    this._pointAttrs = {
      // cx: 0,  //d => 0 - jitterWidth/2 + Math.random() * jitterWidth
      // cx: d => boxScale[d.pass](d.position),
      cy: d => this._yScale(d.value),
      fill: d => d.overflow ? labelColor[0] : labelColor[1],//'#af5f68',
      'fill-opacity': d => d.overflow ? 1 : 0.75,
      r: 2
    };
    this._passLineAttrs = {
      class: 'passLine',
      d: d => d3.line().x(d => this._xLinear(d.pass)).y(d => this._yScale(d.value)).curve(d3.curveLinear)(d),
      // d: d => d3.line().x(d => this._xLinear(d.pass) + boxScale[d.pass](d.position)).y(d => this._yScale(d.value)).curve(d3.curveLinear)(d),
      stroke: `url(#${this._name}-gradient)`,//'#af5f68',
      display: 'none',
      'stroke-width': 1.5,
      fill: 'none'
    }
  }
  _initBox(){
    const that = this;
    this._mainGroup = this._g.append('g')
      .attr('class', 'mainGroup');
    const groups = this._mainGroup
      .selectAll('g')
      .data(new Array(this._length).fill(0).map((d, i) => i))
      .join('g')
      .attr('transform', d => `translate(${this._xLinear(d)}, 0)`)
      .attr('display', d => d < this._length ? 'block' : 'none');
    // groups
    const enter = groups.filter(d => d < this._length);
    
    enter
      .call(g => g.selectAll('points')
        .data(d => this._passMap[d].value)
        .join('circle')
        .call(g => updateElement(g, this._pointAttrs))
          .on('mousemove',function(e, d){
            that._vNode.removeTooltip();
            that._updateCircle(d.upid)
            that._vNode.$nextTick(()=>{that._vNode.showTooltip({
              x: e.pageX,y: e.pageY - 2,
              background: 'white',
              stroke: d3.color(that._color).darker(0.5),
              tspan: [`upid: ${d.upid}`, `position: ${stringify(d.position)}`, `value: ${stringify(d.value)}`],
              fill: d3.color(that._color).darker(0.5)
            })});
            if(that._selectKey === '')that._initLine(d.upid);
          })
          .on('mouseleave', function(e, d){
            that._vNode.removeTooltip();
            if(that._selectKey === '')that._removeLine();
            that._initCircle();
          })
          .on('click', function(e, d){
            that._selectCircle(d.upid);
          })
        );
    enter
      .call(g => g.selectAll('.horizontalLine')
        .data(d => {
          let datum = this._passMap[d].value;
          return [datum.range[0], datum.quartiles[1], datum.range[1]];
        })
        .join('line')
        .call(g => updateElement(g, this._horizontalLineAttrs)));
    enter
        .call(g => g.selectAll('.vertLine')
          .data(d => [d])
            .join('line')
            .call(g => updateElement(g, this._vertLineAttrs)))
        .call(g => g.selectAll('.box')
          .data(d => [d])
            .join('rect')
            .call(g => updateElement(g, this._boxAttrs)))
  }
  _renderChart(upid){
    this._removeLine();
    this._selectKey = upid;
    if(this._upidMap.get(upid) === undefined)return;
    this._selectCircle(upid);
  }
  _updateBox(){
    const t = d3.transition()
      .duration(300)
      .ease(d3.easeLinear);
    
    // this._g.select('.xAxis').transition(t).call(this._xAxis)
    this._g.transition(t)
      .call(g => g.select('.xAxis').call(this._xAxis))
      .call(g => g.select('.yAxis').call(this._yAxis));

    // this._g.transition(t).select('.bottomGantt')
    //   .attr('x', this._xScale(0))
    //   .attr('width', this._xScale(this._length - 1) - this._xScale(0))
    
    this._mainGroup.selectAll('g')
      .transition(t)
      .attr('transform', d => `translate(${this._xLinear(d)}, 0)`)
      .attr('display', d => d < this._length ? 'block' : 'none');

    const enter = this._mainGroup.selectAll('g').filter(d => d < this._length);
    
      enter
      .call(g => g.selectAll('.vertLine')
        .data(d => [d])
          .join(enter => addElement(enter, 'line', this._vertLineAttrs)
            .attr('transform', `translate(0, -20)`),
            update => update,
            exit => exit.transition(t).remove().attr('transform', `translate(0, 20)`)
          )
          .call(g => updateElement(g.transition(t), this._vertLineAttrs)))
      .call(g => g.selectAll('.box')
          .data(d => [d])
          .join(enter => addElement(enter, 'rect', this._boxAttrs)
            .attr('transform', `translate(0, -20)`),
            update => update,
            exit => exit.transition(t).remove().attr('transform', `translate(0, 20)`)
          )
          .call(g => updateElement(g.transition(t), this._boxAttrs)));
    

    enter.selectAll('.horizontalLine')
        .data(d => {
          let datum = this._passMap[d].value;
          return [datum.range[0], datum.quartiles[1], datum.range[1]];
        })
        .join(enter => addElement(enter, 'line', this._horizontalLineAttrs)
          .attr('x1', -20).attr('x2', -20),
          update => update,
          exit => exit.transition(t).remove().attr('x1', 20).attr('x2', 20)
        )
        .call(g => updateElement(g.transition(t), this._horizontalLineAttrs));

    enter.selectAll('circle')
        .data(d => this._passMap[d].value)
        .join(enter => addElement(enter, 'circle', this._pointAttrs).attr('cy', d => this._yScale(d.value) - 10),
          update => update,
          exit => exit.transition(t).remove().attr('cy', d => this._yScale(d.value) + 10)
        )
        .call(g => updateElement(g.transition(t), this._pointAttrs));
  }
  _selectCircle(upid){
    this._selectKey = upid;
    const datum = this._upidMap.get(upid);
    this._selectNums = [...new Set(datum.filter(d => d.overflow).map(d => d.pass))].length;
    
    let arr = this._passMap.map(d => d.value);
    let range = arr.map(d => d.range),
      quartiles = arr.map(d => d.quartiles),
      temp1 = datum.map(d => {
        let arr = range[d.pass],
          value = d.value;
        return arr[0] >= value ? (arr[0] -value)/arr[0] : (arr[1] <= value ? (value - arr[1])/arr[1] : 0)
      }),
      temp2 = datum.map(d => {
      let arr = quartiles[d.pass],
        value = d.value;
      return arr[0] >= value ? (arr[0] -value)/arr[0] : (arr[2] <= value ? (value - arr[2])/arr[2] : 0)
    })
    this._selectOver = 1 * Math.max(...temp1) + 0 * Math.max(...temp2)
    this._initLine(upid);
    this._initCircle();
  }
  _updateCircle(upid){ //hightlight points
    const t = d3.transition()
      .duration(150)
      .ease(d3.easeQuad);
    this._mainGroup.selectAll('circle')
      .transition(t)
      .attr('opacity', d => d.upid === upid || d.upid === this._selectKey ? 1 : 0.2);

    this._mainGroup.selectAll('circle').filter(d => d.upid === upid || d.upid === this._selectKey || d.overflow).raise()
  }
  _initCircle(){
    // const t = d3.transition()
    //   .duration(150)
    //   .ease(d3.easeQuad);
    this._mainGroup.selectAll('circle')
      .attr('opacity', this._selectKey !== '' ? (d => d.upid === this._selectKey ? 1 : 0.2) : 1);

    ['horizontalLine', 'box', 'vertLine', 'passLine'].map( d => this._mainGroup.selectAll(`.${d}`).raise())
    this._mainGroup.selectAll('circle')
      .call(g => g.filter(d => d.upid !== this._selectKey || !d.overflow).lower())
      .call(g => g.filter(d => d.upid === this._selectKey || d.overflow).raise())
  }
  _initLine(upid){
    const datum = this._upidMap.get(upid),
      badX = [...new Set(datum.filter(d => d.overflow).map(d => d.pass))]
    this._defs.selectAll('stop').remove();

    this._defs.selectAll('stop').data(new Array(this._length).fill(0).map((_, i) => i))
      .join('stop')
        .attr('offset', d => d/this._length)
        .attr('stop-color', d =>  badX.indexOf(d) !== -1 ? labelColor[0] : labelColor[1])
    this._g.select('.passLine').remove();

    const path = this._mainGroup
      .append('path')
      .datum(filterPass(datum))
      .call(g => updateElement(g, this._passLineAttrs));
    const lineLength = path.node().getTotalLength();
    const t = d3.transition()
      .duration(1500)
      .ease(d3.easeQuad);
    
    this._g.transition(d3.transition()
      .duration(150)
      .ease(d3.easeQuad)).select('.bottomGantt').attr('display', 'block')

    path
      .attr('stroke-dasharray', `${0},${lineLength}`)
      .attr('display', 'block');
    
    const selction = this._mainGroup.select('.passLine').transition(t);
    attrTween(selction, 'stroke-dasharray', function() {
      const length = this.getTotalLength();
      return d3.interpolate(`0,${length}`, `${length},${length}`);
    })

    const rectAttrs = {
      width: this._xScale.step(),
      height: 10,
      y: -5,
      fill: labelColor[0],
      x: d => this._xScale(d) - this._xScale.step()/2,
      stroke: 'none'
    }
    this._Gantt
      .selectAll('rect')
      .data(badX)
      .join(enter => addElement(enter, 'rect', rectAttrs),
        update => updateElement(update.transition().duration(150).ease(d3.easeQuad), rectAttrs),
        exit => exit.remove())
  }
  _removeLine(){
    this._g.selectAll('circle').attr('opacity', 1)
    this._g.select('.passLine').remove();
    this._g.select('.bottomGantt').attr('display', 'none')
    this._Gantt
      .selectAll('rect').remove();
  }
} 

function filterPass(datum){
  return d3.groups(datum, d => d.pass).map(d => {
    let arr = d[1];
    if(arr.filter(e => e.overflow).length === 0){
      return Object.assign(arr[0], { value : d3.mean(arr, e => e.value)});
    }else{
      let temp = arr.filter(e => e.overflow);
      return Object.assign(temp[0], { value : d3.mean(temp, e => e.value)});
    }
  })
}

export function createToolTip({
    background = 'pink',
    stroke =  'rgba(148, 167, 183, 0.4)',
    tspan = [1, 2, 3],
    vertical = 10,
    horizon = 8,
    x = 500,
    y = 500,
    boxWidth = 5,
    fill = 'red',
    fontSize = `12px`,
    boxHeight = 5 * 1.732
  } = {}, parentNode){
  parentNode.selectAll('*').remove();
  
  const tooltip = parentNode
					.append('g')
					.attr('class', 'tooltip')
					.style('font', '12px DIN');

  const path = tooltip.append('path')
    .attr('stroke', stroke)
    .attr('fill', background);

  const text = tooltip.append('text');

  const line = text.selectAll('tspan').data(tspan)
    .join('tspan')
    .attr('x', 0)
    .attr('y', (_, i) => `${1.2 * i}em`)
    .attr('fill', fill)
    .style('font-family', 'Din')//(GillSans, "white", "12px", "bold", "normal")
    .style('font-size', fontSize)
    // .style('font-weight', 'bold')
    .style('font-style', 'normal')
    .text(d => d);
  const box = text.node().getBBox();				
  path.attr('d', `
    M${- vertical - box.width/2},${- boxHeight}
    H${-boxWidth}l${boxWidth},${boxHeight}l${boxWidth},-${boxHeight}
    H${box.width/2 + vertical}
    v-${box.height + 2 * horizon}
    h-${box.width + 2 * vertical}
    z
  `)
	text.attr('transform', `translate(${[-box.width/2, -boxHeight/2 - box.height]})`);

  const toolBox = tooltip.node().getBBox();
  parentNode
    .style('height', toolBox.height)
    .style('width', toolBox.width);
  tooltip.attr('transform', `translate(${[toolBox.width/2, toolBox.height]})`)
  parentNode.style('top', `${y - toolBox.height}px`).style('left', `${x - toolBox.width/2}px`);
  // const bigBox = path.node().getBBox();
  // path.attr('transform', `translate(${[0, - horizon + boxHeight]})`);
}