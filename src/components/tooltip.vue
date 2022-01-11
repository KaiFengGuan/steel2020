<template>
	<svg class='svgTooltip' height="0" width="0"></svg>
</template>

<script>
    import * as d3 from 'd3'
    import { mapGetters, mapMutations} from 'vuex'
    import {createToolTip} from './composition/boxplot.js'
    export default {
        data (){
            return {
                timer: null
            }
        },
        methods: {
            ...mapMutations([
                'removeTooltip'
            ]),
            paintChart (){
                if (this.timer)clearTimeout(this.timer)
                const svg = d3.select('.svgTooltip').attr('display', 'block')
                createToolTip(this.tipOptions, svg)
                // svg
                //     .on('mouseenter', ()=>{
                //         console.log('mouseenter')
                //         clearTimeout(this.timer)
                //     })
                //     .on('mouseleave', ()=>{
                //         d3.select('.svgTooltip').attr('display', 'none')
                //         console.log('mouseleave')
                //     })
            },
            removeChart (){
                this.timer = setTimeout(()=> {
                    d3.select('.svgTooltip').attr('display', 'none')
                }, 50)
            }
        },
        watch: {
            'tipViews': function (){
                this.tipViews ? this.paintChart() : this.removeChart()
            }
        },
        mounted (){
            // this.paintChart()
            // this.removeChart()
        },
        computed: {
            ...mapGetters([
                'tipViews',
                'tipDisplay',
                'tipOptions'
            ])
        }
    }
</script>

<style scoped lang="scss">
.svgTooltip {
	position: absolute;
    z-index: auto;
    left: '0px';
    top: '0px';
}
</style>
