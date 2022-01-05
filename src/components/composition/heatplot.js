import * as d3 from 'd3';
import { addElement, updateElement, attrTween} from 'utils/element';
const labelColor = [ "#c65b24", "#94a7b7"];
export function preHeat(data){
  let map = new Map();
    let passArr = new Array(data.length).fill(0).map((d, i) => {
      let datum = data[i];
      let arr = datum['sample'];
      arr.quartiles = [datum['min'], datum['mean'], datum['max']];
      arr.min = datum['emin'];
      arr.max = datum['emax'];
      arr.range = [ arr.min, arr.max];
      arr.forEach(e => {e.pass = i, e.overflow = 
        e.value > arr.range[1] || e.value < arr.range[0] ? true : false});

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
export class heatplot{
  constructor(container) {
    this._container = container;
    this._g = this._container.append('g').attr('class', 'scaleGroup');
    this._margin = {top: 20, right: 20, bottom: 40, left: 40};
    this._height = 160;
    this._width = 800;
    
    //init data
    this._originData = null;
    this._passMap = null;
    this._name = undefined;
    
    this._data = null;
    this._range = null;
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
    console.log(this._passMap);
    console.log(this._upidMap);
    this._length = this._passMap.length;
    this._name = options.label;
    this._data = options.func(options.data);
    this._g.attr('transform', `scale(${Math.min(options.height/this._height)})`); //options.width/this._width, 
    return this;
  }
  render(){
    this._initBackground();
    this._initScale();
    this._initStaticLine();
    this._initAttrs();
    this._initBox();
    let flag = true;
    this._g.on('click', ()=>{
      console.log('click')
      flag = !flag;
      this._renderChart(flag ? "21221361000" : "21221360000")
    })
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
    .domain([d3.min(renderData, d => d.value.min * 0.9), d3.max(renderData, d => d.value.max * 1.1)])
    // .domain(this._range)
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
    this._g.append('rect').attr('class', 'bottomGantt')
      .attr('transform', `translate(${this._margin.left},${this._height - this._margin.bottom / 2 - 1.5})`)
        .attr('fill', '#999999')
        .attr('height', 3)
        .attr('width', this._width - this._margin.right - this._margin.left)
    this._Gantt = this._g.append('g').attr('class', 'Gantt')
      .attr('transform', `translate(${0},${this._height - this._margin.bottom / 2 - 5})`);
    this._defs = this._g.append('linearGradient')
      .attr('id', `${this._name}-gradient`)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', '0%')
      .attr('x2', '100%')
  }
  _initAttrs(){
    const boxWidth = 50;
    const jitterWidth = 50;

    const boxScale = this._passMap.map(d => {
      let range = d3.extent(d.value, d => d.position);
      if(range[0] === undefined)return 'no Scale';
      return d3.scaleLinear().range([-jitterWidth/2, jitterWidth/2]).domain(range);
    })
    // console.log(this);
    // console.log(this._passMap);

    this._vertLineAttrs = {
      class: 'vertLine',
      stroke: '#C0C0C0',
      'stroke-width': '1px',
      x1: 0,
      x2: 0,
      y1: d => this._yScale(this._passMap[d].value.range[0]),
      y2: d => this._yScale(this._passMap[d].value.range[1]),
      // transform: d => `translate(${this._xLinear(d)}, 0)`
    };
    this._boxAttrs = {
      class: 'box',
      x: -boxWidth/2,
      y: d => this._yScale(this._passMap[d].value.quartiles[2]),
      height: d => this._yScale(this._passMap[d].value.quartiles[0])
        - this._yScale(this._passMap[d].value.quartiles[2]),
      width: boxWidth,
      stroke: 'purple',
      fill: 'rgb(255, 255, 255)',
      'fill-opacity': 0.5,
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
      // cx: 0,  //d => 0 - jitterWidth/2 + Math.random() * jitterWidth
      cx: d => boxScale[d.pass](d.position),
      cy: d => this._yScale(d.value),
      fill: d => d.overflow ? labelColor[0] : labelColor[1],//'#af5f68',
      'fill-opacity': d => d.overflow ? 1 : 0.75,
      r: 2
    };
    this._passLineAttrs = {
      class: 'passLine',
      d: d => d3.line().x(d => this._xLinear(d.pass) + boxScale[d.pass](d.position)).y(d => this._yScale(d.value)).curve(d3.curveLinear)(d),
      stroke: `url(#${this._name}-gradient)`,//'#af5f68',
      display: 'none',
      'stroke-width': 1.5,
      fill: 'none'
    }
  }
  _initBox(){
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
        .data(d => this._passMap[d].value)
        .join('circle')
        .call(g => updateElement(g, this._pointAttrs)))
      .call(g => g.selectAll('.horizontalLine')
        .data(d => {
          let datum = this._passMap[d].value;
          return [datum.range[0], datum.quartiles[1], datum.range[1]];
        })
        .join('line')
        .call(g => updateElement(g, this._horizontalLineAttrs)))
  }
  _renderChart(upid){
    // this._length = this._upidMap.get(upid).length;
    // const renderData = this._passMap;
    // this._xScale.domain(renderData.map(d => d.key));
    // this._yScale.domain([d3.min(renderData, d => d.value.min * 0.8), d3.max(renderData, d => d.value.max * 1.2)])
    // this._xLinear.domain(d3.extent(renderData, d => d.key))
    //   .range([this._xScale(renderData[0].key), this._xScale(renderData[renderData.length - 1].key)]);

    // this._updateBox();
    if(this._upidMap.get(upid) === undefined)return;
    this._g.selectAll('circle').attr('opacity', d => d.upid === upid ? 1 : 0.4)
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
      .datum(datum)
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
    // console.log(lineLength);

    const rectAttrs = {
      width: this._xScale.step(),
      height: 10,
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
    this._Gantt
      .selectAll('rect').remove();
  }
} 