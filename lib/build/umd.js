/**
 * Build the umd linter
 */
const pathUtils = require('path');
const generateBuild = require('./utils').generateBuild;

const browserify = generateBuild({ standalone: 'AccessibilityLinter' });
browserify.add(pathUtils.resolve(__dirname, '..', 'linter.js'));
browserify.bundle().pipe(process.stdout);
