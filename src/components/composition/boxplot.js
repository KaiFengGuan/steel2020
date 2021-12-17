import * as d3 from 'd3';
import { addElement, updateElement, attrTween} from 'utils/element';
export function preRoll(data){
  let res = new Map(),
    map = new Map();
  for(let passNum in data){
    let datum = data[passNum].result;
    let passArr = new Array(data[passNum].passcount).fill(0).map((d, i) => {
      let arr = datum['sample'][i];
      arr.forEach(e => {e.pass = i});
      arr.quartiles = [datum['min'][i], datum['mean'][i], datum['max'][i]];
      arr.min = Math.min(...arr.map(d => d.value), datum['min'][i]);
      arr.max = Math.max(...arr.map(d => d.value), datum['max'][i]);
      arr.range = [datum['emin'][i], datum['emax'][i]];
      return {key: i,value: arr}
    });
    passArr.upid = passArr[0].value.map(e => e.upid);
    let upidArr = passArr.upid;
    for(let i in upidArr){
      map.set(upidArr[i], passArr.map(e => e.value[i].value))
    }
    res.set(data[passNum].passcount, passArr);
  }
  return [res, map];
}
export class boxplot{
  constructor(container) {
    this._container = container;
    this._g = this._container.append('g').attr('class', 'scaleGroup');
    this._margin = {top: 20, right: 20, bottom: 30, left: 40};
    this._height = 200;
    this._width = 1000;
    
    //init data
    this._originData = null;
    this._passArr = null;
    this._passMap = null;
    
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
  }
  enter(options){
    this._originData = options.data;
    [this._passMap, this._upidMap] = options.func(this._originData);
    // console.log(this._upidMap);
    this._passArr = [...this._passMap.keys()];
    [this._minLen, this._maxLen]  = d3.extent(this._passArr);
    this._length = this._maxLen;
    this._range = this._passMap.get(this._length).range;
    // this._data = options.func(options.data);
    this._g.attr('transform', `scale(${Math.min(options.height/this._height)})`); //options.width/this._width, 
    return this;
  }
  render(){
    this._initBackground();
    this._initScale();
    this._initAttrs();
    this._initBox();
    let flag = true;
    this._g.on('click', ()=>{
      console.log('click')
      flag = !flag;
      this._renderChart(flag ? "21222001000" : "21221360000")
    })
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
    .domain([d3.min(renderData, d => d.value.min * 0.8), d3.max(renderData, d => d.value.max * 1.2)])
    // .domain(this._range)
    .nice()
    .range([this._height - this._margin.bottom, this._margin.top]);
    this._xAxis = g => g
      .attr('transform', `translate(0,${this._height - this._margin.bottom})`)
      .call(d3.axisBottom(this._xScale));
    this._yAxis = g => g
    .attr('transform', `translate(${this._margin.left},0)`)
    .call(d3.axisLeft(this._yScale).ticks(null, 's'))
    .call(g => g.select('.domain').remove());

    this._g.append('g').attr('class', 'xAxis').call(this._xAxis);
    this._g.append('g').attr('class', 'yAxis').call(this._yAxis);
  }
  _initAttrs(){
    const boxWidth = 50;
    // const jitterWidth = 50;
  
    // console.log(this);
    // console.log(this._passMap);

    this._vertLineAttrs = {
      class: 'vertLine',
      stroke: '#C0C0C0',
      'stroke-width': '1px',
      x1: 0,
      x2: 0,
      y1: d => this._yScale(this._passMap.get(this._length)[d].value.range[0]),
      y2: d => this._yScale(this._passMap.get(this._length)[d].value.range[1]),
      // transform: d => `translate(${this._xLinear(d)}, 0)`
    };
    this._boxAttrs = {
      class: 'box',
      x: -boxWidth/2,
      y: d => this._yScale(this._passMap.get(this._length)[d].value.quartiles[2]),
      height: d => this._yScale(this._passMap.get(this._length)[d].value.quartiles[0])
        - this._yScale(this._passMap.get(this._length)[d].value.quartiles[2]),
      width: boxWidth,
      stroke: 'purple',
      fill: 'rgb(255, 255, 255)',
      'fill-opacity': 0.7,
      // transform: d => `translate(${this._xLinear(d)}, 0)`
    };
    this._horizontalLineAttrs = {
      'class': 'horizontalLine',
      'stroke': '#808080',
      'stroke-width': '1px',
      'x1': -boxWidth/2,
      x2: +boxWidth/2,
      y1: d => this._yScale(d),
      y2: d => this._yScale(d)
    };
    this._pointAttrs = {
      cx: 0,  //d => 0 - jitterWidth/2 + Math.random() * jitterWidth
      cy: d => this._yScale(d.value),
      fill: '#af5f68',
      'fill-opacity': 0.8,
      r: 2
    };
  }
  _initBox(){
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
    enter
      .call(g => g.selectAll('points')
        .data(d => this._passMap.get(this._length)[d].value)
        .join('circle')
        .call(g => updateElement(g, this._pointAttrs)))
      .call(g => g.selectAll('.horizontalLine')
        .data(d => {
          let datum = this._passMap.get(this._length)[d].value;
          return [datum.range[0], datum.quartiles[1], datum.range[1]];
        })
        .join('line')
        .call(g => updateElement(g, this._horizontalLineAttrs)))
  }
  _renderChart(upid){
    this._length = this._upidMap.get(upid).length;
    const renderData = this._passMap.get(this._length);
    this._xScale.domain(renderData.map(d => d.key));
    this._yScale.domain([d3.min(renderData, d => d.value.min * 0.8), d3.max(renderData, d => d.value.max * 1.2)])
    this._xLinear.domain(d3.extent(renderData, d => d.key))
      .range([this._xScale(renderData[0].key), this._xScale(renderData[renderData.length - 1].key)]);

    this._updateBox();
    this._initLine(upid);
  }
  _updateBox(){
    const t = d3.transition()
      .duration(300)
      .ease(d3.easeLinear);
    
    // this._g.select('.xAxis').transition(t).call(this._xAxis)
    this._g.transition(t)
      .call(g => g.select('.xAxis').call(this._xAxis))
      .call(g => g.select('.yAxis').call(this._yAxis));
    
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
          let datum = this._passMap.get(this._length)[d].value;
          return [datum.range[0], datum.quartiles[1], datum.range[1]];
        })
        .join(enter => addElement(enter, 'line', this._horizontalLineAttrs)
          .attr('x1', -20).attr('x2', -20),
          update => update,
          exit => exit.transition(t).remove().attr('x1', 20).attr('x2', 20)
        )
        .call(g => updateElement(g.transition(t), this._horizontalLineAttrs));

    enter.selectAll('circle')
        .data(d => this._passMap.get(this._length)[d].value)
        .join(enter => addElement(enter, 'circle', this._pointAttrs).attr('cy', d => this._yScale(d.value) - 10),
          update => update,
          exit => exit.transition(t).remove().attr('cy', d => this._yScale(d.value) + 10)
        )
        .call(g => updateElement(g.transition(t), this._pointAttrs));
  }
  _initLine(upid){
    const datum = this._upidMap.get(upid);
    this._g.select('.passLine').remove();
    // console.log(datum);
    const line = d3.line().x((d, i) => this._xLinear(i)).y(d => this._yScale(d)).curve(d3.curveLinear);
    const path = this._mainGroup
      .append('path')
      .datum(datum)
      .attr('class', 'passLine')
      .attr('d', d => line(d))
      .attr('stroke', '#af5f68')
      .attr('display', 'none')
      .attr('stroke-width', 0.5)
      .attr('fill', 'none');
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
    // console.log(lineLength);
  }
} 