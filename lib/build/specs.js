/**
 * Build the specs
 *
 * Outputs an array of specs
 */
const { tests, readFile } = require('./utils');

const specIndex = `(function () {
  'use strict';
  const specs = window.testSpecs = new Map();
  const tests = window.AccessibilityLinter.tests;
  ${tests.map(test => `
    specs.set(
      tests.find(test => test.name === ${JSON.stringify(test.name)}),
      function(context) {
        const { document, $, $$, create, whenDomChanges, append } = context;
        let el;
        ${readFile(test.specPath).replace(/^.+$/gm, '      $&').trim()}
      }
    );
  `).join('\n')}
}());`;

process.stdout.write(specIndex);
