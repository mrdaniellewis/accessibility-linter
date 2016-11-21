/**
 * Build the specs
 *
 * Outputs an array of specs
 */
const { rules, readFile } = require('./utils');

const specIndex = `(function () {
  'use strict';
  const specs = window.ruleSpecs = new Map([${rules.map(rule => `
    [
      ${JSON.stringify(rule.name)},
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        ${readFile(rule.specPath).replace(/^.+$/gm, '        $&').trim()}
      },
    ],`).join('')}
  ]);
}());`;

process.stdout.write(specIndex);
