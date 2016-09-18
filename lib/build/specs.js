/**
 * Build the specs
 *
 * Outputs an array of specs
 */
const fs = require('fs');

const { tests } = require('./utils');

const specIndex = `(function () {
  'use strict';
  window.testSpecs = [
    ${tests.map(test => `() => {\n      ${
      fs.readFileSync(test.specPath, { encoding: 'utf8' }).replace(/^.+$/gm, '      $&').trim()
    }\n    }`).join(',\n      ')},
  ];
}());`;

process.stdout.write(specIndex);
