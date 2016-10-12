/**
 * Build the specs
 *
 * Outputs an array of specs
 */
const { tests, readFile } = require('./utils');

const specIndex = `(function () {
  'use strict';
  const specs = window.testSpecs = new Map([${tests.map(test => `
    [
      ${JSON.stringify(test.name)},
      function(context) {
        let el, test, logger, linter, window, document, $, when;

        before(() => {
          ({ context: { window }, context: { window: { document, when, $ } } } = context);
        });

        beforeEach(() => {
          ({test, logger, linter} = context);
        });

        ${readFile(test.specPath).replace(/^.+$/gm, '        $&').trim()}
      },
    ],`).join('')}
  ]);
}());`;

process.stdout.write(specIndex);
