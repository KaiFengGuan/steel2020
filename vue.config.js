const path = require('path')
// const 
function resolve (dir) {
    return path.join(__dirname, dir)
}

module.exports = {
    configureWebpack: {
      devtool: 'source-map'
    },
    lintOnSave: false,
    devServer: {
        port: 8889,
        proxy: {
            '/baogangapi': {
                target: 'http://219.216.81.96:5000',
                changeOrigin: true,
                pathRewrite: {
                    '^/baogangapi': '/api'
                }
            },
            '/newbaogangapi': {
              // target: 'http://219.216.80.146:5502',  // 613服务器后台
              // target: 'http://202.118.21.236:7205',
              target: 'http://localhost:5502',     // 宝钢出差 后台
              changeOrigin: true,
              pathRewrite: {
                '^/newbaogangapi': '/api'
              }
          }
        }
    },
    chainWebpack: config => {
        config.resolve.alias
            .set('src', resolve('src'))
            .set('assets', resolve('src/assets'))
            .set('components', resolve('src/components'))
            .set('router', resolve('src/router'))
            .set('services', resolve('src/services'))
            .set('store', resolve('src/store'))
            .set('views', resolve('src/views'))
            .set('utils', resolve('src/utils'))
    }
}
