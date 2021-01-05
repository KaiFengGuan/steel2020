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
    6:['000','B10','Z10','T10','J20','H40'],
    5:['S60','H30','SC0','H60','P30','S80','SA0','S50','S30','L30','SB0','S60']
}
// var labelColor = [ '#ff005a', '#3888fa']    //颜色控制
var labelColor = [ '#fa558f', '#7f8df5']    //颜色控制
var labelColor2 = [ '#e34649', '#5164f5'] 
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
                    colors[categorys[i]]=d3.schemeSet1[+item+1]
                }
                
            }
        }
        // for (let i = 0; i < categorys.length; i++) {
        //     colors[categorys[i]] = d3.schemeCategory10[i % 10]
        // }
        return index ? colors[index] : colors
    },
    // labelColor: ['red', d3.schemeCategory10[0]]
    labelColor2: labelColor2,
    labelColor: labelColor,
    labelColorFunc (index) {
        return labelColor[index]
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
      }
}