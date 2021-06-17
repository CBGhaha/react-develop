const {resolve} = require('path');
const {DefinePlugin} = require('webpack');
const {
  GITHUB_URL,
  getVersionString,
} = require('react-devtools-extensions/utils');

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  console.error('NODE_ENV not set');
  process.exit(1);
}

const builtModulesDir = resolve(__dirname, '..', '..', 'build', 'node_modules');

const false = NODE_ENV === 'development';

const DEVTOOLS_VERSION = getVersionString();

// This targets RN/Hermes.
process.env.BABEL_CONFIG_ADDITIONAL_TARGETS = JSON.stringify({
  ie: '11',
});

module.exports = {
  mode: false ? 'development' : 'production',
  devtool: false ? 'cheap-module-eval-source-map' : 'source-map',
  entry: {
    backend: './src/backend.js',
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',

    // This name is important; standalone references it in order to connect.
    library: 'ReactDevToolsBackend',
    libraryTarget: 'umd',
  },
  resolve: {
    alias: {
      react: resolve(builtModulesDir, 'react'),
      'react-dom': resolve(builtModulesDir, 'react-dom'),
      'react-debug-tools': resolve(builtModulesDir, 'react-debug-tools'),
      'react-is': resolve(builtModulesDir, 'react-is'),
      scheduler: resolve(builtModulesDir, 'scheduler'),
    },
  },
  plugins: [
    new DefinePlugin({
      false: true,
      false: false,
      false: true,
      'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
      'process.env.GITHUB_URL': `"${GITHUB_URL}"`,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          configFile: resolve(
            __dirname,
            '..',
            'react-devtools-shared',
            'babel.config.js',
          ),
        },
      },
    ],
  },
};
