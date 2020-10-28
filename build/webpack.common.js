const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');

const config = {
  entry: {
    main: ['babel-polyfill', path.resolve(__dirname, '../src')], //项目的主入口
    //代码分离---提取公共库
    // vendor: ['react', 'react-router-dom', 'react-dom']
  },
  output: {
    filename: '[name].[hash].js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/',
    chunkFilename: '[name].[chunkhash:8].js', //在entry中未定义的js 一般是动态按需加载时的js
    crossOriginLoading: 'anonymous'
  },
  //配置模块的读取和解析规则
  module: {
    rules: [
      {
        test: /\.js/,
        use: [
          {
            loader: 'babel-loader'
          }
        ],
        exclude: path.resolve(__dirname, './node_module')
      },
      //支持图片  import
      {
        test: /\.(png|jsp|gif|ttf|woff|eot|svg|svga)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              query: {
                limit: 8192
              }
            }
          }
        ]
      }
    ]
  },
  resolve: {
    //设置文件夹别名
    alias: {
      '@': path.resolve(__dirname, '../src'),
      components: path.resolve(__dirname, '../src/components') //匹配路径components
    },
    extensions: ['.js', '.less', '.json', '.jsx'],
    modules: ['node_modules']
  },
  plugins: [
    //自动生成html模板
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(__dirname, '../src/index.html'),
      BASE_URL: '/'
    }),
    new Dotenv({
      path: path.join(__dirname, `../env/.env.${process.env.BUILD_ENV}`)
    }),
    new CopyPlugin([
      {
        from: 'public/*',
        to: path.resolve('./dist/'),
        flatten: true
      }
    ])
  ],

  target: 'web',
  externals: {
    // 把导入语句里的 jquery 替换成运行环境里的全局变量 jQuery
    jQuery: 'jQuery',
    katex: 'katex'
  }
};
module.exports = config;
