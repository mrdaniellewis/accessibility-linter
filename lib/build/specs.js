/**
 * Build the specs
 *
 * Outputs an array of specs
 */
const pathUtils = require('path');
const { rules, readFile, retab } = require('./utils');

const specIndex = `(function () {
  'use strict';
  window.ruleSpecs = new Map([${rules.map(path => `
    [
      ${JSON.stringify(path)},
      function() {
        ${retab(readFile(pathUtils.join('..', 'rules', path, 'spec.js')), { initial: 4 })}
      },
    ],`).join('')}
  ]);
}());`;

process.stdout.write(specIndex);
