/**
 * Build the specs
 *
 * Outputs an array of specs
 */
const { rules } = require('./utils');

const specIndex = `(function () {
  'use strict';
  window.ruleSpecs = [${rules.map(path => `\n    ${JSON.stringify(path)},`).join('')}
  ];
}());`;

process.stdout.write(specIndex);
