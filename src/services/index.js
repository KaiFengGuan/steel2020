import axios from 'axios'

let service_zero = axios.create({
    timeout: 500000
})
export let baogangAxios = service_zero.get
export let baogangPlotAxios = axios.post
