import * as d3 from 'd3';
import { addElement, updateElement, updateAsyncElement , updateStyles} from 'utils/element';
export class boxplot{
  constructor(container) {
    this._container = container;
    this._g = this._container.append('g').attr('class', 'scaleGroup');
    this._margin = {top: 20, right: 20, bottom: 30, left: 40};
    this._height = 600;
    this._width = 800;
    
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
    this._passMap = options.func(this._originData);
    this._passArr = [...this._passMap.keys()];
    [this._minLen, this._maxLen]  = d3.extent(this._passArr);
    this._length = 10;
      // this._maxLen;
    this._range = this._passMap.get(this._length).range;
    // this._originData = d3.group(options.data, d => d.upid);
    // this._data = options.func(options.data);
    this._g.attr('transform', `scale(${Math.min(options.width/this._width, options.height/this._height)})`);
    return this;
  };
  render(){
    this._initScale();
    this._initBox();
    this._initAxis();
    // setTimeout(() => {this._renderAxis()}, 2000)
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
      .attr("transform", `translate(0,${this._height - this._margin.bottom})`)
      .call(d3.axisBottom(this._xScale));
    this._yAxis = g => g
    .attr("transform", `translate(${this._margin.left},0)`)
    .call(d3.axisLeft(this._yScale).ticks(null, "s"))
    .call(g => g.select(".domain").remove());
  }
  _initAxis(){
      this._g.append("g").attr('class', 'xAxis').call(this._xAxis);
      this._g.append("g").attr('class', 'yAxis').call(this._yAxis);
  }
  _renderAxis(){
    this._length = 8;
    const renderData = this._passMap.get(this._length);
    this._xScale.domain(renderData.map(d => d.key));
    this._yScale.domain([d3.min(renderData, d => d.value.min * 0.8), d3.max(renderData, d => d.value.max * 1.2)])
    this._xLinear.domain(d3.extent(renderData, d => d.key))
      .range([this._xScale(renderData[0].key), this._xScale(renderData[renderData.length - 1].key)]);
    const t = d3.transition()
      .duration(300)
      .ease(d3.easeLinear);
    // this._g.select('.xAxis').transition(t).call(this._xAxis)
    this._g.transition(t)
      .call(g => g.select('.xAxis').call(this._xAxis))
      .call(g => g.select('.yAxis').call(this._yAxis));
    this._updateBox();
    // this._initLine();
    console.log(12)
  }
  _updateBox(){
     const t = d3.transition()
      .duration(300)
      .ease(d3.easeLinear);
    this._mainGroup
      .selectAll("g")
      .transition(t)
      .attr("transform", d => `translate(${this._xLinear(d)}, 0)`)
      .attr('display', (d, i) => d < this._length ? 'block' : 'none');
    this._mainGroup.selectAll("g").filter((d, i) => d < this._length).transition(t)
      .call(g => g.selectAll("vertLine")
        .data((_, i) => [this._passMap.get(this._length)[i].value.range])
          .join("line")
            .attr("class", "vertLine")
            .attr("stroke", "#C0C0C0")
            .attr('stroke-width','1px')
            .style("width", 40)
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", range => this._yScale(range[0]))
            .attr("y2", range => this._yScale(range[1])))
      // .call(g => g.selectAll('.vertLine')
      //  .attr("y1", range => this._yScale(range[0]))
      //  .attr("y2", range => this._yScale(range[1])))
      // .call(g => g.selectAll('.horizontalLine')
      //  .attr("y1", d => this._yScale(d))
      //  .attr("y2", d => this._yScale(d)))
      // .call(g => g.selectAll('.box')
      //   .attr("y", d => this._yScale(d.value.quartiles[2]))
      //   .attr("height", d => this._yScale(d.value.quartiles[0])-this._yScale(d.value.quartiles[2])))
  }
  _initLine(){
    const datum = this._originData.get('examples0')[0];
    this._g.select('.passLine').remove();
    // console.log(datum);
    const line = d3.line().x((d, i) => this._xLinear(i)).y(d => this._yScale(d)).curve(d3.curveLinear);
    const path = this._mainGroup
      .append('path')
      .datum(datum.value)
      .attr('class', 'passLine')
      .attr('d', d => line(d))
      .attr('stroke', "#af5f68")
      .attr('display', 'none')
      .attr('stroke-width', 0.5)
      .attr('fill', 'none');
    // getTotalLength()
    this._lineTransition();
  }
  async _lineTransition(){
    const path = this._g.select('.passLine');
    const lineLength = path.node().getTotalLength();
    const t = d3.transition()
      .duration(300)
      .ease(d3.easeLinear);
    path
      .attr("stroke-dasharray", `${0},${lineLength}`)
      .attr('display', 'block');
    console.log(lineLength);
    let i = 0, n = lineLength;
    let timer = setInterval(() => {
        const t = (i + 1) / n;
        console.log(i);
        i++;
        path.transition(t) .attr("stroke-dasharray", `${t * lineLength},${lineLength}`);
        if(t > 1){
          console.log(t);
          clearInterval(timer);
        }
      },20)
  }

  _initBox(){
    const boxWidth = 50;
    // const jitterWidth = 50;
  
    console.log(this);
    console.log(this._passMap);
    this._mainGroup = this._g.append('g')
      .attr('class', 'mainGroup');
    const groups = this._mainGroup
      .selectAll("g")
      .data(new Array(this._maxLen).fill(0).map((d, i) => i))
      .join("g")
      .attr("transform", d => `translate(${this._xLinear(d)}, 0)`)
      .attr('display', (d, i) => d < this._length ? 'block' : 'none');
  
    // groups
    groups
    // .filter((d, i) => d < this._length)
      .selectAll("vertLine")
      // .data(d => [d.value.range])
      .data((_, i) => [this._passMap.get(this._length)[i].value.range])
      .join("line")
            .attr("class", "vertLine")
            .attr("stroke", "#C0C0C0")
            .attr('stroke-width','1px')
            .style("width", 40)
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", range => this._yScale(range[0]))
            .attr("y2", range => this._yScale(range[1]));
  
  // groups
  //   .selectAll("points")
  //   .data(d => d.value)
  //   .join("circle")
  //     // .attr("cx", d => 0 - jitterWidth/2 + Math.random() * jitterWidth)
  //     .attr('cx', 0)
  //     .attr("cy", d => this._yScale(d.value))
  //     .attr("r", 2)
  //     .style("fill", "#af5f68")
  //     .attr("fill-opacity", 0.8);
  
  //  groups
  //   .selectAll("box")
  //   .data(d => [d])
  //   .join("rect")
  //       .attr("class", "box")
  //       .attr("x", -boxWidth/2)
  //       .attr("y", d => this._yScale(d.value.quartiles[2]))
  //       .attr("height", d => this._yScale(d.value.quartiles[0])-this._yScale(d.value.quartiles[2]))
  //       .attr("width", boxWidth)
  //       // .attr("stroke", "#808080")
  //    .attr('stroke', 'purple')
     
  //       .style("fill", "rgb(255, 255, 255)")
  //       .style("fill-opacity", 0.7);
    
  //  groups
  //   .selectAll("horizontalLine")
  //   .data(d => [d.value.range[0], d.value.quartiles[1], d.value.range[1]])
  //   .join("line")
  //      .attr("class", "horizontalLine")
  //      .attr("stroke", "#808080")
  //      .attr('stroke-width','1px')
  //      .style("width", 40)
  //      .attr("x1", -boxWidth/2)
  //      .attr("x2", +boxWidth/2)
  //      .attr("y1", d => this._yScale(d))
  //      .attr("y2", d => this._yScale(d));
  }
} 