/**
 * The build script for creating the project
 */
/* eslint-disable global-require */
const fs = require('fs');
const pathUtils = require('path');

// Generate the array of tests
const path = pathUtils.resolve(__dirname, 'tests');
const testDirs = fs.readdirSync(path).map(filename => pathUtils.resolve(path, filename));
const tests = testDirs.map(filename => require(pathUtils.resolve(path, 'test')));
const specs = testDirs.map(filename => require(pathUtils.resolve(path, 'spec')));
// const docs = ...

// Browserify the main script

// Browserify the test scripts
