const Runner = require('./runner');
const Logger = require('./logger');
const Rule = require('./rules/rule');
const rules = require('./rules');
const Utils = require('./utils');
const version = require('./version');
const Config = require('./config');
const Contrast = require('./utils/contrast');

// eslint-disable-next-line global-require, import/no-dynamic-require
const ruleList = new Map(rules.map(path => [path.replace(/\//g, '-'), require(`./rules/${path}/rule.js`)]));

class Linter extends Runner {
  constructor(settings) {
    settings = settings || {};
    settings.logger = settings.logger || new Logger();
    settings.rules = settings.rules || ruleList;
    settings.config = new Config(settings);
    super(settings);

    this.root = settings.root || document;
  }

  /**
   * Start looking for issues
   */
  observe() {
    this.observeDomChanges();
    this.observeFocus();
  }

  /**
   * Stop looking for issues
   */
  stopObserving() {
    this.stopObservingDomChanges();
    this.stopObservingFocus();
  }

  observeDomChanges() {
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

  stopObservingDomChanges() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  handleEvent(e) {
    new Promise(resolve => resolve(this.run(e.target))); // eslint-disable-line no-new
  }

  observeFocus() {
    document.addEventListener('focus', this, { capture: true, passive: true });
    document.addEventListener('blur', this, { capture: true, passive: true });
  }

  stopObservingFocus() {
    document.removeEventListener('focus', this, { capture: true, passive: true });
    document.removeEventListener('blur', this, { capture: true, passive: true });
  }
}

Linter.Config = Config;
Linter.Logger = Logger;
Linter.Rule = Rule;
Linter.rules = ruleList;
Linter[Symbol.for('accessibility-linter.rule-sources')] = rules;
Linter.Utils = Utils;
Linter.version = version;
Linter.colourContrast = Contrast.colourContrast;

module.exports = Linter;
