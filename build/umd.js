(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AccessibilityLinter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./tests":[function(require,module,exports){
"use strict";
const tests = module.exports = [];
    const defineTest = test => tests.push(test);
    defineTest({
  name: 'missing alt attribute',
  selector: 'img:not([alt])',
});

  
},{}],1:[function(require,module,exports){
"use strict";
const Runner = require('./runner');
const Logger = require('./logger');
const tests = require('./tests');
const utils = require('./utils');

module.exports = class AccessibilityLinter extends Runner {
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
    this.observer.disconnect();
    this.observer = null;
  }
};

},{"./logger":2,"./runner":3,"./tests":"./tests","./utils":4}],2:[function(require,module,exports){
"use strict";
/* eslint-disable no-console */
module.exports = class Logger {
  error(test, el) {
    console.error(test.name, el, test.docHref);
  }
};

},{}],3:[function(require,module,exports){
"use strict";
const select = require('./utils').select;

module.exports = class Runner {
  constructor(config) {
    this.tests = config.tests;
    this.whitelist = config.whitelist;
    this.logger = config.logger;

    // Elements and issues already reported
    this.reported = new WeakMap();
    // Elements that are whitelisted
    this.whitelisted = new WeakSet();
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
    select(test.selector, context)
      .filter(this.filterWhitelist, this)
      .filter(el => (this.reported.get(el) || []).includes(test.name))
      .filter(test.filter || Boolean)
      .forEach(el => {
        this.logger.error(test, el);
        this.reported.set(el, (this.reported.get(el) || []).concat(test.name));
      });
  }

  /**
   * Filter elements on the whitelist
   */
  filterWhitelist(el) {
    if (this.whitelisted.has(el)) {
      return false;
    }
    if (this.whitelist.some(test => el.matches(test))) {
      this.whitelisted.add(el);
      return false;
    }
    return true;
  }
};

},{"./utils":4}],4:[function(require,module,exports){
"use strict";
/**
 * Find DOM nodes from a selector or NodeList
 * @param {String|NodeList} selector
 * @param {HTMLElement} [context]
 */
exports.select = function select(selector, context) {
  let els = selector;
  if (typeof selector === 'string') {
    const root = context || document;
    els = root.querySelectorAll(selector);
  }
  return Array.from(els);
};

/**
 * Observe for child list mutations
 * @param {Function} fn function to call for each mutation
 */
exports.observe = function mutationObserver(fn, root) {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      Array.from(mutation.addedNodes).forEach(node => fn(node));
    });
  });
  observer.observe(root, { subtree: true, childList: true });
  return observer;
};

},{}]},{},["./tests",1])(1)
});
//# sourceMappingURL=umd.js.map
