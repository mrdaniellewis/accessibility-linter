const path = require('path');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: {
    standalone: './lib/index.js',
    umd: './lib/linter.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build'),
  },
  devtool: 'eval-source-map',
  devServer: {
    publicPath: '/build',
  },
};
