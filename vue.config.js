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
                // target: 'http://219.216.80.46:5555',
                // target: 'http://202.118.21.236:7205',
                changeOrigin: true,
                pathRewrite: {
                    '^/baogangapi': '/api'
                }
            },
            '/newbaogangapi': {
              target: 'http://219.216.80.146:5502',
              // target: 'http://202.118.21.236:7205',
              changeOrigin: true,
              pathRewrite: {
                  '^/newbaogangapi': '/api'
              }
          },

            'myf': {
                // target: 'http://219.216.80.62:8088',
                target: 'http://219.216.80.18:8088',
                // target: 'http://202.118.21.236:7106',
                // target: 'http://localhost:8080',
                changeOrigin: true,
                pathRewrite: {
                    // '^/myf': 'web-ssm/myf'
                    '^/myf': '/myf'
                }
            }
            // '/api': {
            //     target: 'http://node-serve:8002',
            //     changeOrigin: true
            // },
            // '/baogangapi': {
            //     // target: 'http://219.216.81.86:5000',
            //     target: 'http://python-serve:5000',
            //     changeOrigin: true,
            //     pathRewrite: {
            //         '^/baogangapi': 'api'
            //     }
            // }
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
