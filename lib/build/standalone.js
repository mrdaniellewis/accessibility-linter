/**
 * Build the standalone linter
 *
 * Outputs a umd module that will autorun and start the linter
 */

const pathUtils = require('path');
const generateBuild = require('./utils').generateBuild;

const browserify = generateBuild();
browserify.add(pathUtils.resolve(__dirname, '..', 'index.js'));
browserify.bundle().pipe(process.stdout);
