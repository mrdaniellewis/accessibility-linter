const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

const commonDev = {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    inline: false,
    publicPath: '/build',
  },
};

module.exports = [
  merge(common.standalone, commonDev),
  merge(common.umd, commonDev),
  merge(
    {
      entry: { spec: './lib/rules/rule-specs.js' },
      output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './build'),
        library: 'ruleSpecs',
        libraryExport: 'default',
      },
      module: {
        rules: [
          { test: /spec\.js$/, use: 'raw-loader' },
        ],
      },
    },
    commonDev,
  ),
  merge(
    {
      entry: { internals: './lib/internals.js' },
      output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './build'),
        library: 'internals',
      },
    },
    commonDev,
  ),
];
