<template>
	<div>
		<div :id='menuId' style='height: 100%;width:100%;padding:5px'></div>
	</div>
</template>

<script>
import * as d3 from 'd3';
import util from 'src/views/baogang/util.js';
import {mapGetters} from 'vuex'
export default {
	data() {
		return {
			menuId: 'scatterlog' + Math.random().toString(32).slice(-6),
			svg: undefined,
			data:[],
			tooltip:undefined,
			scatterdata:[],
			changeColor: false,
			categoryColors: util.categoryColor,
			labelColors: util.labelColor, // [bad, good]
			labelColorsFunc: util.labelColorFunc,
			property:['ave_temp_dis','avg_p5','crowntotal','finishtemptotal','tgtplatelength2','tgtplatethickness2','tgtwidth','wedgetotal'],
			GaleArray:[],
			mouseAttrs:{'color': '#666666', 'r': 3, 'stroke': 0.5},
			clickAttrs:{'color': '#666666', 'r': 4.5, 'stroke': 1.25},
      mouseList: undefined,
      req_count: 0
		}
	},
	methods: {
		paintChart(jsondata, req_count) {
      const vm = this;
			this.scatterdata = []
      this.scatterdata = Object.values(jsondata).sort((a, b) => new Date(a.toc) - new Date(b.toc))
      
      this.req_count = req_count;
      if (this.req_count == 1) {
        this.paintScatter();
      }
      else {
        this.transScatter();
      }
    },
    paintScatter() {
      const vm=this

			const scatterdata=this.scatterdata
      const w = document.getElementById(this.menuId).offsetWidth,
        h = document.getElementById(this.menuId).offsetHeight,
        marginH = 15,
        marginW = 15;
      const x_extent = d3.extent(scatterdata, d => d.x);
      const y_extent = d3.extent(scatterdata, d => d.y);
			const scaleX = d3.scaleLinear().range([marginW, w-marginW]).domain(x_extent);
      const scaleY = d3.scaleLinear().range([h-marginH, h -w + marginH]).domain(y_extent);
      
			this.svg !== undefined && this.svg.remove()
			this.svg = d3.select('#' + this.menuId)
				.append('svg')
				.attr('class','scatterlogger')
				.attr('width', w)
				.attr('height', h);

      var mouseTooltip = false; //tooltip mode

			var scattertooltip = g => {
				g.call(g =>g.append('g').attr('class' , 'scatter')
					.selectAll('circle.dot')
					.data(scatterdata)
					.join('circle').attr('class', 'dot')
					.attr('r', 1)
					.attr('id', d => 'scatter'+d.upid)
					.attr('cx', d => scaleX(d.x))
					.attr('cy', d => scaleY(d.y))
					.attr('fill',vm.tooltipColor)
					.attr('stroke', vm.tooltipColor)
					.attr('stroke-width', 0.25)
					.style('opacity', 1)
					.on('mouseover', (event, d)=> {
            this.initDot();
						const tooltip = vm.svg.append('g')
							.attr('class', 'scattertooltip')
							.style('font', '12px DIN');

						const path = tooltip.append('path')
              // .attr('fill', 'rgba(245, 245, 230, 0.97)');
              .attr('stroke', 'rgba(148, 167, 183, 0.4)')
              .attr('fill', 'white')

						const text = tooltip.append('g');

						const line1 = text.append('text')
							.attr('x', 0)
							.attr('y', 0)
              .style('font-family', util.scatterTooltipAttr.line1.fontFamily)
              .style('font-size', util.scatterTooltipAttr.line1.fontSize)
              .style('font-weight', util.scatterTooltipAttr.line1.fontWeight)
              .style('font-style', util.scatterTooltipAttr.line1.fontStyle)

						const line2 = text.append('text')
							.attr('x', 0)
							.attr('y', '1.1em')
              .style('font-family', util.scatterTooltipAttr.line2.fontFamily)
              .style('font-size', util.scatterTooltipAttr.line2.fontSize)
              .style('font-weight', util.scatterTooltipAttr.line2.fontWeight)
              .style('font-style', util.scatterTooltipAttr.line2.fontStyle)

						const line3 = text.append('text')
							.attr('x', 0)
              .attr('y', '2.2em')
              .style('font-family', util.scatterTooltipAttr.line3.fontFamily)
              .style('font-size', util.scatterTooltipAttr.line3.fontSize)
              .style('font-weight', util.scatterTooltipAttr.line3.fontWeight)
              .style('font-style', util.scatterTooltipAttr.line3.fontStyle)

						const label=d;				
						tooltip
              .style('display', null)
              .attr('fill', vm.tooltipColor(label))
							// .attr('fill', util.scatterTooltipAttr.line1.fontColor);
						line1.text(`upid:`+ d.upid);
						line2.text(`category: `+d.steelspec);
						line3.text(`time:`+d.toc);
						path
							.attr('stroke', vm.tooltipColor(label))
							.attr('fill', 'white');
						const box = text.node().getBBox();
						let x = event.offsetX,
							y = event.offsetY,
              padding = 10;
						if(y >= h/2){					
              path.attr('d', `
                M${box.x - 10},${box.y - 10}
                H${box.width / 2 - 5}l5,15l5,-15
                H${box.width + 10}
                v-${box.height + 20}
                h-${box.width + 20}
                z
              `)
						  text.attr('transform', `translate(${[box.x, box.y - box.height - 10]})`);
              tooltip.attr('transform', `translate(${[x - box.width/2, y + 5]})`);
						}else{
              path.attr('d', `
                M${box.x - 10},${box.y + 10}
                H${box.width / 2 - 5}l5,-15l5,15
                H${box.width + 10}
                v${box.height + 20}
                h-${box.width + 20}
                z
              `);
              text.attr('transform', `translate(${[box.x, box.y + box.height - 10]})`);
              tooltip.attr('transform', `translate(${[x - box.width/2, y + 10 + 5]})`);
            }
            tooltip.on('mouseenter', ()=>{
              mouseTooltip = true;
            })
            .on('mouseleave', () => {
              mouseTooltip = false;
              this.initDot();
              vm.$emit('scatterMouse', {upid: [d.upid],  mouse: 1});
            })
						vm.svg.selectAll('circle.dot').style('opacity', 0.1);
						vm.svg.select(`#scatter${label.upid}`).style('opacity', 1);
						vm.changeDot([label.upid], this.mouseAttrs)
						vm.$emit('scatterMouse', {upid: [d.upid],  mouse: 0});
					})
					.on('mouseout', (event, d)=> {
            const that = this;
            setTimeout(function(){
              if(mouseTooltip)return;
						  that.initDot();
              vm.$emit('scatterMouse', {upid: [d.upid],  mouse: 1});
            }, 0)
					}))
			}
			this.svg.append('g')
				.call(scattertooltip);
			this.svg.call(d3.zoom()
				.extent([[0, 0], [w, h]])
				.scaleExtent([1, 8])
				.on('zoom', zoomed))
			function zoomed({transform}) {
        vm.initDot();
				vm.svg.select('.scatter').attr('transform', transform);
			}
    },
    initDot(){
      this.paintArc(this.GaleArray)
      this.resetDot()
      this.svg.selectAll('.scattertooltip').remove();
    },
    transScatter() {
      var tran = d3.transition().delay(50).duration(500);

      const scatterdata=this.scatterdata
      const w = document.getElementById(this.menuId).offsetWidth,
        h = document.getElementById(this.menuId).offsetHeight,
        marginH = 15, 
        marginW = 15;
			const scaleX = d3.scaleLinear().range([marginW, w-marginW]).domain(d3.extent(scatterdata, d => d.x));
      const scaleY = d3.scaleLinear().range([h-marginH, h -w + marginH]).domain(d3.extent(scatterdata, d => d.y));
      
      this.svg.selectAll('circle.dot')
        .data(scatterdata)
        .transition(tran)
				.attr('cx', d => scaleX(d.x))
				.attr('cy', d => scaleY(d.y))
    },
		paintArc([dateStart,dateEnd]){
			this.GaleArray=[dateStart,dateEnd];
			const vm=this;
			var data=this.scatterdata.filter(item=>{
				let toc=new Date(item.toc)
				return toc<dateEnd&&toc>dateStart
			})
			this.svg.selectAll('.dot')
				.attr('r',1)
				.style('opacity',0.1)
				.attr('fill' , vm.tooltipColor);
			for (let item in data){
					this.svg.select('#scatter'+data[item].upid)
					.style('opacity',1);
			}
		},
		mouse(value){
			const vm=this
			this.mouseList = value
			if(value.mouse===0){
				this.changeDot(value.upid, this.mouseAttrs)
			}else{
				this.init();
				this.changeDot(this.hightlightGroup, this.clickAttrs);
			}
		},
		changeDot(array, Attrs){	//change Style
			if(array.length === 0)return;
			for(let item in array){
				this.svg.select(`#scatter${array[item]}`)
					.attr('r', Attrs.r)
					.attr('stroke', Attrs.color)
					.attr('stroke-width', Attrs.stroke).raise()
			}
		},
		resetDot(){		//reset Style before highlight
			this.mouseList !==undefined ? this.mouse(this.mouseList) : this.changeDot(this.hightlightGroup, this.clickAttrs)
		},
		init(){		//init Style
			const vm=this;
			this.svg.selectAll('.dot')
				.attr('r',1)
				.attr('fill', vm.tooltipColor)
				.attr('stroke', vm.tooltipColor)
				.attr('stroke-width', 0.25)
		},
		setTrainColor(){
			this.changeColor=!this.changeColor;
			this.init()
			this.resetDot()
		}
	},
	mounted() {
	},
	computed:{
		tooltipColor:function (){
			return this.changeColor ? d => this.categoryColors(d.productcategory) : d=> this.labelColorsFunc(+d.label)
		},
		...mapGetters([
            'hightlightGroup'
        ])
	},
	watch:{
		hightlightGroup:function(){
			if(this.hightlightGroup.length === 0)this.init()
			this.changeDot(this.hightlightGroup, this.clickAttrs)
		}
	}
}
</script>

<style scoped>
/* g .tick{
	opacity: 0.3;
} */
</style>