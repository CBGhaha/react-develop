const webpack = require('webpack');
const path = require('path');
const common = require('./webpack.common.js');
const merge = require('webpack-merge');

const config = {
  mode: 'development',
  devServer: {
    hot: true,
    host: '0.0.0.0',
    port: 3333,
    contentBase: '/',
    historyApiFallback: {
      index: '/'
    },
    https: true
  },
  //代码调试映射模式 (map文件) 用于追踪调试报错和源码位置
  devtool: 'cheap-module-source-map', //---开发环境适合
  module: {
    rules: [
      //编译css/less文件
      {
        test: [/\.css/, /\.less/],
        use: [
          'style-loader', //style-loader将所有的计算后的样式加入页面中
          {
            loader: 'css-loader', //css-loader用于支持css的模块化 可以让css支持import require
            options: {
              minimize: true,
              importLoaders: 2,
              modules: { auto: true }
            }
          },
          {
            loader: 'postcss-loader', //css兼容性前缀
            options: {
              plugins: [
                require('autoprefixer')({
                  browsers: ['last 10 versions']
                })
              ]
            }
          },
          'less-loader',
          {
            loader: 'style-resources-loader',
            options: {
              patterns: path.join(__dirname, '../src/global-styles/themeConf.less'),
              injector: 'prepend'
            }
          }
        ],
        exclude: /node_module|dist|global/
      },
      {
        test: [/\.css/, /\.less/],
        use: [
          'style-loader', //style-loader将所有的计算后的样式加入页面中'
          {
            loader: 'css-loader', //css-loader用于支持css的模块化 可以让css支持import require
            options: {
              minimize: true,
              modules: false
            }
          },
          'less-loader',
          {
            loader: 'postcss-loader', //css兼容性前缀
            options: {
              plugins: [
                require('autoprefixer')({
                  browsers: ['last 10 versions']
                })
              ]
            }
          }
        ],
        include: /global/
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin() //HMR 模块热替换
  ]
};
module.exports = merge(common, config);
