import ariaExtensions from 'aria-extensions';
import consoleReporter from './reporters/console';
import * as observers from './observers';
import Rule from './rule';
import XPathRule from './rules/xpath-rule';
import rules from './rules';
import Runner from './runner';
import symbol from './symbol';
import { version, license } from '../package.json';

const {
  $changed, $debounce, $deduplicate, $report, $reporters, $runner, $observers, $timeout,
} = symbol;

class AccessibilityLinter {
  constructor({
    rules: _rules = [], observers: _observers = [], reporters = [],
    whitelist = null, rateLimit = 0, attributeName = 'data-disable-linter', cache = true,
  }) {
    this.whitelist = whitelist;
    this.rateLimit = rateLimit;
    this.attributeName = attributeName;
    this.cache = cache;
    this.rules = _rules;
    this[$observers] = _observers.map(Observer => new Observer(els => this[$debounce](els)));
    this[$reporters] = reporters;
    this[$changed] = new Set();
  }

  run(element = document) {
    this[$report](new Runner(this).run(element));
  }

  runRule(rule, { element = document, whitelist = this.whitelist } = {}) {
    let resolvedRule = rule;
    if (typeof rule === 'string') {
      resolvedRule = this.rules.find(item => item.name === rule);
    } else if (typeof rule.run !== 'function') {
      resolvedRule = new Rule(rule);
    }
    const args = Object.assign({}, this, { rules: [resolvedRule], whitelist });
    this[$report](new Runner(args).run(element));
  }

  observe(element = document) {
    this[$changed].clear();
    this[$runner] = new Runner(this);
    this[$observers].forEach(observer => observer.observe(element));
  }

  disconnect() {
    this[$observers].forEach(observer => observer.disconnect());
    this[$runner] = null;
    this[$changed].clear();
  }

  [$debounce](elements) {
    elements.forEach(element => this[$changed].add(element));
    if (this[$timeout]) {
      return;
    }
    if (this.rateLimit < 0) {
      this[$deduplicate]();
    } else {
      this[$timeout] = setTimeout(() => {
        this[$timeout] = null;
        this[$deduplicate]();
      }, this.rateLimit);
    }
  }

  [$deduplicate]() {
    const nodes = new Set(this[$changed]);
    this[$changed].clear();

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

    this[$report](this[$runner].run(...nodes));
  }

  [$report](errors) {
    (errors || []).forEach(error => (
      this[$reporters].forEach(reporter => reporter[error.rule.type](error))
    ));
  }
}

AccessibilityLinter.consoleReporter = consoleReporter;
AccessibilityLinter.observers = observers;
AccessibilityLinter.Rule = Rule;
AccessibilityLinter.XPathRule = XPathRule;
AccessibilityLinter.rules = rules;
AccessibilityLinter.version = version;
AccessibilityLinter.license = license;
AccessibilityLinter.ariaExtensions = ariaExtensions;

export default AccessibilityLinter;
