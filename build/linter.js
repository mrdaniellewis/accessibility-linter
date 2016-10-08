[ { name: 'alt',
    docPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/alt/doc.md',
    specPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/alt/spec.js',
    testPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/alt/test.js' },
  { name: 'fieldset-legend',
    specPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/fieldset-legend/spec.js',
    testPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/fieldset-legend/test.js' },
  { name: 'headings',
    specPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/headings/spec.js',
    testPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/headings/test.js' },
  { name: 'label',
    docPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/label/doc.md',
    specPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/label/spec.js',
    testPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/label/test.js' },
  { name: 'label-associated',
    specPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/label-associated/spec.js',
    testPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/label-associated/test.js' },
  { name: 'legend',
    specPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/legend/spec.js',
    testPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/legend/test.js' },
  { name: 'radio-fieldset',
    specPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/radio-fieldset/spec.js',
    testPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/radio-fieldset/test.js' },
  { name: 'unique-id',
    specPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/unique-id/spec.js',
    testPath: '/Users/daniellewis/code/accessibility-linter/lib/tests/unique-id/test.js' } ]
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.accessibilityLinter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./tests":[function(require,module,exports){
"use strict";
const tests = module.exports = [];
    let name;
    const { $, $$ } = require('./utils');
    const defineTest = test => tests.push(Object.assign(test, { name }));
    name = "alt";
defineTest({
  message: 'missing alt attribute',
  selector: 'img:not([alt])',
});
name = "fieldset-legend";
defineTest({
  message: 'All fieldsets must have a legend',
  selector: 'fieldset',
  filter: el => {
    const first = el.firstElementChild;
    return first && first.matches('legend') && first.textContent.trim();
  },
});
name = "headings";
defineTest({
  message: 'Headings must be nested correctly',
  selector: 'h2,h3,h4,h5,h6',
  allowed: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  filter(el) {
    let cursor = el;
    const level = +el.nodeName[1];
    do {
      cursor = cursor.previousElementSibling || cursor.parentElement;
      if (cursor && cursor.matches(this.allowed.join())) {
        return !cursor.matches(this.allowed.slice(level - 1));
      }
    } while (cursor);
    return false;
  },
});
name = "label";
defineTest({
  message: 'all form elements must have a label',
  selector: 'input,select,textarea',
  filter: el => {
    if (/^(?:submit|reset|button|image|hidden)$/.test(el.type)) {
      return true;
    }

    let label;

    if (el.hasAttribute('aria-labelledby')) {
      label = $(`#${el.getAttribute('aria-labelledby')}`);
    }

    if (!label && el.hasAttribute('aria-label')) {
      label = { textContent: el.getAttribute('aria-label') };
    }

    if (!label) {
      if (el.id) {
        label = $(`label[for="${el.id}"]`);
      }
      if (!label) {
        label = el.closest('label');
      }
    }

    return label && label.textContent.trim();
  },
});
name = "label-associated";
defineTest({
  message: 'all labels must be linked to a control',
  selector: 'label',
  filter: el => el.htmlFor && document.getElementById(el.htmlFor),
});
name = "legend";
defineTest({
  message: 'All legends must be the first child of a fieldset',
  selector: 'legend',
  filter: el => el === el.parentNode.firstElementChild,
});
name = "radio-fieldset";
defineTest({
  message: 'All radio inputs must be within a fieldset',
  selector: 'input[type=radio]',
  filter: el => el.closest('fieldset'),
});
name = "unique-id";
defineTest({
  message: 'id is not unique',
  selector: '[id]',
  filter: el => !el.id || $$(`#${el.id}`).length === 1,
});
  
},{"./utils":5}],1:[function(require,module,exports){
"use strict";
const Linter = require('./linter');

const config = window.accessibilityLinterConfig || {};
const scriptElement = document.currentScript;
if (scriptElement) {
  eval(`!function(){${scriptElement.textContent}}()`); // eslint-disable-line no-eval
  if (!('whitelist' in config)) {
    config.whitelist = scriptElement.dataset.whitelist;
  }
}

const linter = new Linter(config);
if (/^(:?interactive|complete)$/.test(document.readyState)) {
  // Document already loaded
  linter.observe();
} else {
  document.addEventListener('DOMContentLoaded', () => linter.observe());
}

module.exports = linter;

},{"./linter":2}],2:[function(require,module,exports){
"use strict";
const Runner = require('./runner');
const Logger = require('./logger');
const tests = require('./tests');
const utils = require('./utils');

const Linter = module.exports = class AccessibilityLinter extends Runner {
  constructor(options) {
    options = options || {};
    options.logger = options.logger || new Logger();
    options.tests = options.tests || tests;
    super(options);

    this.root = options.root || document;
  }

  /**
   * Start looking for issues
   */
  observe() {
    this.run(this.root);
    this.observer = utils.observe(this.run.bind(this), this.root);
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

Linter.Logger = Logger;
Linter.tests = tests;

},{"./logger":3,"./runner":4,"./tests":"./tests","./utils":5}],3:[function(require,module,exports){
"use strict";
/* eslint-disable no-console */
module.exports = class Logger {
  message(message, el) {
    if (typeof message === 'string') {
      return message;
    }
    return message(el);
  }

  error(test, el) {
    console.error(this.message(test.message, el), el);
  }

  warn(test, el) {
    console.warn(this.message(test.message, el), el);
  }
};

},{}],4:[function(require,module,exports){
"use strict";
const { $$ } = require('./utils');

const dataAttr = 'allylint';

const addToSetArray = (set, key, value) => set.set(key, (set.get(key) || []).concat(value));
const isInSetArray = (set, key, value) => (set.get(key) || []).includes(value);
const cssEscape = value => value.replace(/"/g, '\\"');

module.exports = class Runner {
  constructor(config) {
    this.tests = config.tests;
    this.whitelist = config.whitelist || {};
    this.logger = config.logger;

    // Elements and issues already reported
    this.reported = new WeakMap();
    // Elements that are whitelisted
    this.whitelisted = new WeakMap();
    // Elements with ignore attributes
    this.ignored = new WeakMap();
  }

  /**
   * Run all the tests
   * @param {HTMLElement} [context] A context to run the tests within
   */
  run(context) {
    this.tests
      .filter(test => !(test.globalOnly && context))
      .forEach(test => this.runTest(test, context));
  }

  /**
   * Run a single test
   * @param {Object} test The test to run
   * @param {HTMLElement} [context] A context to run the tests within
   */
  runTest(test, context) {
    $$(test.selector, context)
      .filter(el => this.filterIgnoreAttribute(el, test.name))
      .filter(el => this.filterWhitelist(el, test.name))
      .filter(el => !isInSetArray(this.reported, el, test.name))
      .filter(el => (test.filter ? !test.filter(el) : true))
      .forEach(el => {
        this.logger.error(test, el);
        addToSetArray(this.reported, el, test.name);
      });
  }

  /**
   * Filter elements on the whitelist
   */
  filterWhitelist(el, testName) {
    const whitelist = this.whitelist;

    if (isInSetArray(this.whitelisted, el, testName)) {
      return false;
    }

    const isWhitelisted = Object.keys(whitelist).some(selector => {
      const testList = whitelist[selector];
      if (testList && !testList.includes(testName)) {
        return false;
      }
      return el.matches(selector);
    });

    if (isWhitelisted) {
      addToSetArray(this.whitelisted, el, testName);
      return false;
    }
    return true;
  }

  filterIgnoreAttribute(el, testName) {
    if (isInSetArray(this.ignored, el, testName)) {
      return false;
    }

    const ignore = el.matches(
      `[data-${dataAttr}-ignore=""],[data-${dataAttr}-ignore~="${cssEscape(testName)}"]`
    );

    if (ignore) {
      addToSetArray(this.ignored, el, testName);
      return false;
    }

    return true;
  }
};

},{"./utils":5}],5:[function(require,module,exports){
"use strict";
/**
 * Find DOM nodes from a selector.  The found node can include the supplied context
 * @param {String|NodeList} selector
 * @param {HTMLElement} [context]
 */
exports.$$ = function $$(selector, context) {
  const root = context || document;
  const els = Array.from(root.querySelectorAll(selector));
  if (context && context instanceof Element && context.matches(selector)) {
    els.push(context);
  }
  return els;
};

exports.$ = function $(selector, context) {
  return exports.$$(selector, context)[0];
};

/**
 * Observe for child list mutations
 * @param {Function} fn function to call for each mutation
 */
exports.observe = function mutationObserver(fn, root) {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      Array.from(mutation.addedNodes)
        .filter(node => node.nodeType === Node.ELEMENT_NODE)
        .forEach(node => fn(node));
    });
  });
  observer.observe(root, { subtree: true, childList: true });
  return observer;
};

},{}]},{},["./tests",1])(1)
});
//# sourceMappingURL=linter.js.map
