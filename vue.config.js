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
            '/newbaogangapi': {
              target: 'http://219.216.80.146:5502',
              // target: 'http://202.118.21.236:7205',
              changeOrigin: true,
              pathRewrite: {
                  '^/newbaogangapi': '/api'
              }
          },
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
