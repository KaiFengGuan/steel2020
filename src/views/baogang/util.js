import * as d3 from 'd3'

var categorys = [
    'L20',
    'H30',
    'H20',
    'SC0',
    'B10',
    '000',
    'L10',
    'H60',
    'P30',
    'S80',
    'SA0',
    'S50',
    'S30',
    'L30',
    'H10',
    'SB0',
    'P20',
    'J20',
    'S10',
    'P10',
    'S60',
    'S20'
]
var categoryslabel = {
    0:['S10','S20'],
    1:['H10','H20'],
    2:['L10','L20'],
    3:['P10','P20'],
    6:['000','B10','Z10','T10','J20'],
    5:['S60','H30','H40','SC0','H60','P30','S80','SA0','S50','S30','L30','SB0','S60']
}
// var labelColor = [ '#ff005a', '#3888fa']    //颜色控制
// var labelColor = [ '#fa558f', '#7f8df5']    //颜色控制
// var labelColor = [ "#e0978f" , "#8fa4ae"]   //blue red original
var labelColor = [ "#c65b24", "#94a7b7"] // red grey  
var noflagColor = '#71797E'
var delabelColor = ["#e3ad92",   "#b9c6cd"]
var labelColor2 = [ '#e34649', '#5164f5']
var processColor =['#fcd8a9','#cce9c7',"#c1c9ee"];
var buttonColor = ['#ffffff','#94a7b7']//un_activate,activate
var buttonTextColor = ['#94a7b7','#ffffff']//un_activate,activate
var brushHandleStroke = ['#90a4ae','#c65b24']//1st,2st


// Tabular brushColor
var brushColor = ['#90a4ae','#eeeeee','#eeeeee'] //1st/2st/overlay


var GillSans = "Gill Sans,Gill Sans MT,Calibri,Trebuchet MS,sans-serif"
var SegoeUI = "Segoe UI"
function setAttr(family, color, size, weight, style) {
  return {
    fontFamily: family,
    fontColor: color,
    fontSize: size,
    fontWeight: weight, // normal | bold | bolder | number
    fontStyle: style    // normal | italic
  }
}
// 标题字体属性
var titleFirstAttr  = setAttr(SegoeUI, "#2c3e50", "19px", "bolder", "normal")
var monthPickerAttr = setAttr(GillSans, "#6d7885", "14px", "bold", "normal")
var cardTitletAttr  = setAttr(GillSans, "#6d7885", "14px", "500", "normal")
// Embedding View
var sliderTooltipAttr = {
  line1: setAttr(GillSans, "#2c3e50", "11px", "bold", "normal"),
  line2: setAttr(GillSans, noflagColor, "11px", "normal", "normal"),
  line3: setAttr(GillSans, labelColor[1], "11px", "normal", "normal"),
  line4: setAttr(GillSans, labelColor[0], "11px", "normal", "normal")
}
var scatterTooltipAttr = {
  line1: setAttr(GillSans, "white", "12px", "bold", "normal"),
  line2: setAttr(GillSans, "white", "12px", "normal", "normal"),
  line3: setAttr(GillSans, "white", "12px", "normal", "normal")
}
var selectionTextAttr = {
  inOverlay: setAttr(GillSans, "white", "10px", "normal", "normal"),
  outOverlayColor: "#717072"
}
var buttonTextAttr = {
  baseTextAttr: setAttr(GillSans, labelColor[1], "10px", "normal", "normal"),
  unactivated_color: "white"
}
// Babular View
var tabularTooltipAttr = {
  line1: setAttr(GillSans, "white", "12px", "bold", "normal"),
  line2: setAttr(GillSans, "white", "12px", "normal", "normal"),
  line3: setAttr(GillSans, "white", "12px", "normal", "normal")
}
var tabularAxisTextAttr = setAttr(GillSans, "#2c3e50", "12px", "normal", "normal")
var tabularTipsTextAttr = setAttr(GillSans, "#2c3e50", "10px", "normal", "normal")
// Condition View
var conditionPolygonTextAttr = setAttr(GillSans, "white", "13px", "normal", "normal")
var conditionMareyTooltipAttr = {
  line1: setAttr(GillSans, "white", "15px", "bold", "normal"),
  line2: setAttr(GillSans, "white", "15px", "normal", "normal"),
  line3: setAttr(GillSans, "white", "15px", "normal", "normal")
}
var conditionRadiaTextAttr = setAttr(GillSans, "white", "9px", "normal", "normal")
var conditionMiniYAxisTextAttr = setAttr(GillSans, "black", "7.5px", "bolder", "normal")
// Diagnosis View
var diagCardTitleTextAttr = setAttr(GillSans, "none", "10px", "normal", "normal")


// var labelColor = ['#ff005a', '#3888fa', '#88fa38', '#fa3888', '#38faaa']   //多个颜色
export default {
    // 除子节点
    removeAllChildren (div) {
        while (
            div.hasChildNodes() //当div下还存在子节点时 循环继续
        ) {
            div.removeChild(div.firstChild)
        }
    },
    // 补零函数
    addZero (d, n = 2){
        return (Array(n).fill(0).join('') + d).slice(-n)
    },
    // 时间格式化
    timeFormat (val) {
        
        let y = val.getFullYear()
        let m = ('0' + (+val.getMonth() + 1)).slice(-2)
        let d = ('0' + val.getDate()).slice(-2)
        let h = ('0' + val.getHours()).slice(-2)
        let min = ('0' + val.getMinutes()).slice(-2)
        let s = ('0' + val.getSeconds()).slice(-2)
        return y + '-' + m + '-' + d + ' ' + h + ':' + min + ':' + s
    },

    categorys: categorys,
    categoryColor (index){
        var colors = {}
        for (let i = 0; i < categorys.length; i++) {
            for (let item in categoryslabel){
                if(categoryslabel[item].includes(index)){
                    if(item == 2 )item = 3
                    colors[categorys[i]]=d3.schemeTableau10[+item]
                }
                
            }
        }
        // for (let i = 0; i < categorys.length; i++) {
        //     colors[categorys[i]] = d3.schemeCategory10[i % 10]
        // }
        if(index==='H40'){
            return d3.schemeTableau10[6]
        }
        return index ? colors[index] : colors
    },
    
    // labelColor: ['red', d3.schemeCategory10[0]]
    labelColor2: labelColor2,
    labelColor: labelColor,
    noflagColor: noflagColor,
    delabelColor: delabelColor,
    processColor: processColor,
    brushColor:brushColor,
    buttonColor:buttonColor,
    buttonTextColor:buttonTextColor,
    brushHandleStroke:brushHandleStroke,
    labelColorFunc (index) {
        return index !== 404 ? labelColor[index] : noflagColor
    },
    colorScale(index){
      var ribbon = d3.interpolate('white','#c65b24')
      var linear = d3.scaleLinear().domain([0,100]).range([0,1])
      return ribbon(linear(index))
    },
    setPoData(matrix) {
        let m = matrix.length
        let n = matrix[0].length
        let result = []
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                result.push([i, j, matrix[i][j]])
            }
        }
        return result
    },
    getDateList (startDate, endDate) {
        function  timeFormat (val) {
        
            let y = val.getFullYear()
            let m = ('0' + (+val.getMonth() + 1)).slice(-2)
            let d = ('0' + val.getDate()).slice(-2)
            let h = ('0' + val.getHours()).slice(-2)
            let min = ('0' + val.getMinutes()).slice(-2)
            let s = ('0' + val.getSeconds()).slice(-2)
            return y + '-' + m + '-' + d + ' ' + h + ':' + min + ':' + s
        }
        const dateList = []
        dateList.push(new Date(startDate))
        while (true) {
            if (startDate.getHours()===12){
                startDate.setDate(startDate.getDate() + 1)
                startDate.setHours(0)
            }else if(startDate.getHours()===0){
                startDate.setHours(12)
            }      
          if (startDate.getTime() < endDate.getTime()) {
            dateList.push(new Date(startDate))  
          } else {
            break
          }

        }
        dateList.push(new Date(endDate))
        return dateList.map(item=>timeFormat(item))
      },


    monthPickerAttr: monthPickerAttr,
    titleFirstAttr: titleFirstAttr,
    cardTitletAttr: cardTitletAttr,

    sliderTooltipAttr: sliderTooltipAttr,
    scatterTooltipAttr: scatterTooltipAttr,
    selectionTextAttr: selectionTextAttr,
    buttonTextAttr: buttonTextAttr,

    tabularTooltipAttr: tabularTooltipAttr,
    tabularAxisTextAttr: tabularAxisTextAttr,
    tabularTipsTextAttr: tabularTipsTextAttr,

    conditionPolygonTextAttr: conditionPolygonTextAttr,
    conditionMareyTooltipAttr: conditionMareyTooltipAttr,
    conditionRadiaTextAttr: conditionRadiaTextAttr,
    conditionMiniYAxisTextAttr: conditionMiniYAxisTextAttr,
    diagCardTitleTextAttr: diagCardTitleTextAttr
}