const merge = require('webpack-merge');
const path = require('path');

const common = {
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build'),
  },
  devtool: 'eval-source-map',
};

exports.standalone = merge(
  { entry: { standalone: './lib/index.js' } },
  common,
);

exports.umd = merge(
  {
    entry: { umd: './lib/index.js' },
    output: { library: 'AccessibilityLinter', libraryTarget: 'umd' },
  },
  common,
);
