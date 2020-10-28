var webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const common = require('./webpack.common.js');
const merge = require('webpack-merge');
const config = {
  //配置模块的读取和解析规则
  mode: 'production',
  module: {
    rules: [
      //编译css/less文件
      {
        test: [/\.css/, /\.less/],
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../'
            }
          },
          // 'style-loader', //style-loader将所有的计算后的样式加入页面中
          {
            loader: 'css-loader', //css-loader用于支持css的模块化 可以让css支持import require
            options: {
              minimize: true,
              modules: true
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
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../'
            }
          },
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
  //代码分离---
  optimization: {
    splitChunks: {
      minChunks: 1,
      chunks: 'all',
      name: true
    },
    runtimeChunk: {
      name: 'manifest'
    }
  },
  plugins: [
    new CleanWebpackPlugin(['./dist'], { root: path.resolve() }), //每次编译 清空dist文件夹
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[name].[chunkhash:8].css'
    })
  ]
};
module.exports = merge(common, config);
