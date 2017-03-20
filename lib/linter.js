const Runner = require('./runner');
const Logger = require('./logger');
const Rule = require('./rules/rule');
const rules = require('./rules');
const Utils = require('./utils');
const version = require('./version');
const config = require('./config');
const Contrast = require('./utils/contrast');

// eslint-disable-next-line global-require, import/no-dynamic-require
const ruleList = new Map(rules.map(path => [path.replace(/\//g, '-'), require(`./rules/${path}/rule.js`)]));

const Linter = module.exports = class AccessibilityLinter extends Runner {
  constructor(options) {
    options = options || {};
    options.logger = options.logger || new Logger();
    options.rules = options.rules || ruleList;
    super(options);

    this.root = options.root || document;
  }

  /**
   * Start looking for issues
   */
  observe() {
    this.observer = new MutationObserver((mutations) => {
      // De-duplicate
      const nodes = new Set(mutations.map((record) => {
        if (record.type === 'childList') {
          return record.target;
        }
        return record.target.parentNode;
      }).filter(Boolean));

      // Remove nodes that are children of other nodes
      nodes.forEach((node1) => {
        nodes.forEach((node2) => {
          if (node2 === node1 || !nodes.has(node1)) {
            return;
          }
          if (node2.contains(node1)) {
            nodes.delete(node1);
          }
        });
      });
      // Remove nodes that are disconnected
      nodes.forEach((node) => {
        if (!document.contains(node)) {
          nodes.delete(node);
        }
      });
      // Run test against each node
      nodes.forEach(node => this.run(node));
    });
    this.observer.observe(
      this.root,
      { subtree: true, childList: true, attributes: true, characterData: true }
    );
  }

  /**
   * Stop looking for issues
   */
  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
};

Linter.config = config;
Linter.Logger = Logger;
Linter.Rule = Rule;
Linter.rules = ruleList;
Linter[Symbol.for('accessibility-linter.rule-sources')] = rules;
Linter.Utils = Utils;
Linter.version = version;
Linter.colourContrast = Contrast.colourContrast;
