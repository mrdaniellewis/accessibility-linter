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
      function() {
        let el, test, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        ${readFile(test.specPath).replace(/^.+$/gm, '        $&').trim()}
      },
    ],`).join('')}
  ]);
}());`;

process.stdout.write(specIndex);
