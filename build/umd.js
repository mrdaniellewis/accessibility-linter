(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AccessibilityLinter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./tests":[function(require,module,exports){
"use strict";

    const { $, $$, cssEscape } = require('./utils');
    module.exports = new Map([
      [
        "alt",
        Object.assign(
          { name: "alt", doc: "alt" },
          {
  message: 'missing alt attribute',
  selector: 'img:not([alt])',
}
        ),
      ],[
        "fieldset/checkbox-groups-in-fieldset",
        Object.assign(
          { name: "fieldset/checkbox-groups-in-fieldset", doc: "fieldset" },
          {
  message: 'All checkbox groups must be within a fieldset',
  selector: 'input[type=checkbox]',
  filter: (el) => {
    if (!el.name) {
      return true;
    }

    if (el.form && !(el.form.elements[el.name] instanceof NodeList)) {
      return true;
    }

    if (!el.form && $$(`input[type=checkbox][name="${cssEscape(el.name)}"]`).filter(elm => !elm.form).length === 1) {
      return true;
    }

    return el.closest('fieldset');
  },
}
        ),
      ],[
        "fieldset/fieldset-has-legend",
        Object.assign(
          { name: "fieldset/fieldset-has-legend", doc: "fieldset" },
          {
  message: 'All fieldsets must have a legend',
  selector: 'fieldset',
  filter: (el) => {
    const first = el.firstElementChild;
    return first && first.matches('legend') && first.textContent.trim();
  },
}
        ),
      ],[
        "fieldset/legend-has-fieldset",
        Object.assign(
          { name: "fieldset/legend-has-fieldset", doc: "fieldset" },
          {
  message: 'All legends must be the first child of a fieldset',
  selector: 'legend',
  // Detecting text nodes isn't worth it
  filter: el => el.parentNode.matches('fieldset') && el === el.parentNode.firstElementChild,
}
        ),
      ],[
        "fieldset/radios-in-fieldset",
        Object.assign(
          { name: "fieldset/radios-in-fieldset", doc: "fieldset" },
          {
  message: 'All radio inputs must be within a fieldset',
  selector: 'input[type=radio]',
  filter: el => el.closest('fieldset'),
}
        ),
      ],[
        "headings",
        Object.assign(
          { name: "headings", doc: undefined },
          {
  message: 'Headings must be nested correctly',
  selector: 'h2,h3,h4,h5,h6',
  allowed: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  previous(el) {
    let cursor = el.previousElementSibling;
    while (cursor && cursor.lastElementChild) {
      cursor = cursor.lastElementChild;
    }
    return cursor || el.parentElement;
  },
  filter(el) {
    let cursor = el;
    const level = +el.nodeName[1];
    do {
      cursor = this.previous(cursor) || cursor.parentElement;
      if (cursor && cursor.matches(this.allowed.join())) {
        return cursor.matches(this.allowed.slice(level - 2).join(','));
      }
    } while (cursor);
    return false;
  },
}
        ),
      ],[
        "label/inputs-are-labelled",
        Object.assign(
          { name: "label/inputs-are-labelled", doc: "label-inputs-are-labelled" },
          {
  message: 'all form elements must have a label',
  selector: 'input,select,textarea',
  filter(el) {
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
}
        ),
      ],[
        "label/labels-have-inputs",
        Object.assign(
          { name: "label/labels-have-inputs", doc: "label" },
          {
  message: 'all labels must be linked to a control',
  selector: 'label',
  filter: el => el.htmlFor && document.getElementById(el.htmlFor),
}
        ),
      ],[
        "list-id",
        Object.assign(
          { name: "list-id", doc: undefined },
          {
  message: 'no datalist found',
  selector: 'input[list]',
  filter(el) {
    const listId = el.getAttribute('list');
    return listId && $(`datalist[id="${cssEscape(listId)}"]`);
  },
}
        ),
      ],[
        "no-duplicate-anchor-names",
        Object.assign(
          { name: "no-duplicate-anchor-names", doc: undefined },
          {
  message: 'Name is not unique',
  selector: 'a[name]',
  filter(el) {
    const id = cssEscape(el.name);
    return id && $$(`a[name="${id}"],[id="${id}"]`).length === 1;
  },
}
        ),
      ],[
        "no-empty-select",
        Object.assign(
          { name: "no-empty-select", doc: undefined },
          {
  message: 'Selects should have options',
  selector: 'select',
  filter: el => $$('option', el).length,
}
        ),
      ],[
        "no-links-to-missing-fragments",
        Object.assign(
          { name: "no-links-to-missing-fragments", doc: undefined },
          {
  message: 'Fragment not found in document',
  selector: 'a[href*="#"]',
  removeHash(ob) {
    return ob.href.replace(/#.*$/, '');
  },
  filter(el) {
    if (this.removeHash(location) !== this.removeHash(el)) {
      return true;
    }
    const id = cssEscape(decodeURI(el.hash.slice(1)));
    return $(`[id="${id}"],a[name="${id}"]`);
  },
}
        ),
      ],[
        "no-multiple-select",
        Object.assign(
          { name: "no-multiple-select", doc: undefined },
          {
  message: 'Do not use multiple selects',
  selector: 'select[multiple]',
}
        ),
      ],[
        "no-outside-controls",
        Object.assign(
          { name: "no-outside-controls", doc: undefined },
          {
  message: 'All controls should be within a form',
  selector: 'input,textarea,select',
  filter: el => el.form,
}
        ),
      ],[
        "no-reset",
        Object.assign(
          { name: "no-reset", doc: undefined },
          {
  message: 'Do not use reset buttons',
  selector: 'input[type=reset],button[type=reset]',
}
        ),
      ],[
        "unique-id",
        Object.assign(
          { name: "unique-id", doc: undefined },
          {
  message: 'id is not unique',
  selector: '[id]',
  filter: el => !el.id || $$(`[id="${cssEscape(el.id)}"]`).length === 1,
}
        ),
      ]
    ]);
  
},{"./utils":4}],1:[function(require,module,exports){
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

},{"./logger":2,"./runner":3,"./tests":"./tests","./utils":4}],2:[function(require,module,exports){
"use strict";
/* eslint-disable no-console */
module.exports = class Logger {
  constructor(docLink) {
    this.docLink = docLink;
  }

  error(test, el) {
    console.error.apply(console, this.message(test, el));
  }

  warn(test, el) {
    console.warn.apply(console, this.message(test, el));
  }

  message(test, el) {
    return [
      typeof test.message === 'function' ? test.message(el) : test.message,
      el,
      this.getLink(test),
    ].filter(Boolean);
  }

  getLink(test) {
    if (!this.docLink || !test.doc) {
      return null;
    }

    return `${this.docLink}#${test.doc}`;
  }
};

},{}],3:[function(require,module,exports){
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
      .forEach((test, name) => this.runTest(test, name, context));
  }

  /**
   * Run a single test
   * @param {Object} test The test to run
   * @param {HTMLElement} [context] A context to run the tests within
   */
  runTest(test, name, context) {
    $$(test.selector, context)
      .filter(el => this.filterIgnoreAttribute(el, name))
      .filter(el => this.filterWhitelist(el, name))
      .filter(el => !isInSetArray(this.reported, el, name))
      .filter(el => (test.filter ? !test.filter(el) : true))
      .forEach((el) => {
        this.logger.error(test, el);
        addToSetArray(this.reported, el, name);
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

    const isWhitelisted = Object.keys(whitelist).some((selector) => {
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

},{"./utils":4}],4:[function(require,module,exports){
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

exports.cssEscape = function cssEscape(name) {
  return name.replace(/["\\]/g, '\\$&');
};

/**
 * Observe for child list mutations
 * @param {Function} fn function to call for each mutation
 */
exports.observe = function mutationObserver(fn, root) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
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
//# sourceMappingURL=umd.js.map
