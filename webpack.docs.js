const path = require('path');

module.exports = {
  entry: {
    generate: './lib/build-docs.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '.temp'),
  },
  module: {
    rules: [
      { test: /\.md$/, use: 'raw-loader' },
    ],
  },
  node: false,
};
