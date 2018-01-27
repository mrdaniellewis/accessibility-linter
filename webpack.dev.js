const merge = require('webpack-merge'); // eslint-disable-line import/no-extraneous-dependencies
const common = require('./webpack.common.js');

module.exports = merge(common, {
  entry: {
    spec: './lib/rules/rule-specs.js',
  },
  devtool: 'eval-source-map',
  devServer: {
    inline: false,
    publicPath: '/build',
  },
});
