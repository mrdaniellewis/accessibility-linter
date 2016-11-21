(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.accessibilityLinter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./rules":[function(require,module,exports){
"use strict";

    const { $, $$, cssEscape } = require('./utils');
    const standards = require('./standards');
    module.exports = new Map([
      [
        "alt",
        Object.assign(
          { name: "alt" },
          ({
  message: 'missing alt attribute',
  selector: 'img:not([alt])',
})
        ),
      ],[
        "aria/roles",
        Object.assign(
          { name: "aria/roles" },
          ({
  message(el) {
    const rule = standards.aria.match(el);
    const role = el.getAttribute('role');
    if (rule.implicitRoles.includes(role)) {
      return `role "${role}" is implicit for this element and not allowed`;
    }
    if (!standards.aria.roles.includes(role)) {
      return `role "${role}" is not a known role`;
    }
    return `role "${role}" is not allowed for this element`;
  },
  selector: '[role]',
  filter(el) {
    const rule = standards.aria.match(el);
    const role = el.getAttribute('role');
    return rule.allowedRoles.includes(role);
  },
})
        ),
      ],[
        "fieldset/fieldset-has-legend",
        Object.assign(
          { name: "fieldset/fieldset-has-legend" },
          ({
  message: 'All fieldsets must have a legend',
  selector: 'fieldset',
  filter: (el) => {
    const first = el.firstElementChild;
    return first && first.matches('legend') && first.textContent.trim();
  },
})
        ),
      ],[
        "fieldset/legend-has-fieldset",
        Object.assign(
          { name: "fieldset/legend-has-fieldset" },
          ({
  message: 'All legends must be the first child of a fieldset',
  selector: ':not(fieldset)>legend,fieldset>legend:not(:first-child)',
})
        ),
      ],[
        "fieldset/multiple-in-fieldset",
        Object.assign(
          { name: "fieldset/multiple-in-fieldset" },
          ({
  message: 'Multiple inputs with the same name should be in a fieldset',
  selector: 'input[name]:not([type=hidden]),textarea[name],select[name]',
  filter: (el) => {
    let group;

    if (el.form) {
      const elements = el.form.elements[el.name];
      if (elements instanceof Node) {
        return true;
      }
      group = Array.from(elements).filter(elm => elm.type !== 'hidden');
    } else {
      const namePart = `[name="${cssEscape(el.name)}"]`;
      group = $$(`input${namePart}:not([type=hidden]),textarea${namePart},select${namePart}`).filter(elm => !elm.form);
    }

    return group.length === 1 || el.closest('fieldset');
  },
})
        ),
      ],[
        "headings",
        Object.assign(
          { name: "headings" },
          ({
  message: 'Headings must be nested correctly',
  selector: 'h2,h3,h4,h5,h6',
  allowed: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  previous(el) {
    let cursor = el.previousElementSibling;
    while (cursor && cursor.lastElementChild) {
      cursor = cursor.lastElementChild;
    }
    return cursor;
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
})
        ),
      ],[
        "label/buttons-have-labels",
        Object.assign(
          { name: "label/buttons-have-labels" },
          ({
  message: 'buttons must have a label',
  selector: 'button',
  filter(el) {
    let text;
    if (el.hasAttribute('aria-labelledby')) {
      text = el.getAttribute('aria-labelledby')
        .split(/\s+/)
        .map(id => document.getElementById(id))
        .map(node => (node ? node.innerText : ''))
        .join(' ');
    } else if (el.hasAttribute('aria-label')) {
      text = el.getAttribute('aria-label');
    } else {
      text = el.innerText;
    }

    return text.trim();
  },
})
        ),
      ],[
        "label/inputs-are-labelled",
        Object.assign(
          { name: "label/inputs-are-labelled" },
          ({
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
        label = $(`label[for="${cssEscape(el.id)}"]`);
      }
      if (!label) {
        label = el.closest('label');
      }
    }

    return label && label.textContent.trim();
  },
})
        ),
      ],[
        "label/labels-have-inputs",
        Object.assign(
          { name: "label/labels-have-inputs" },
          ({
  message: 'all labels must be linked to a control',
  selector: 'label',
  filter: el => el.htmlFor && document.getElementById(el.htmlFor),
})
        ),
      ],[
        "label/links-have-labels",
        Object.assign(
          { name: "label/links-have-labels" },
          ({
  message: 'links must have a label',
  selector: 'a',
  filter(el) {
    let text;
    if (el.hasAttribute('aria-labelledby')) {
      text = el.getAttribute('aria-labelledby')
        .split(/\s+/)
        .map(id => document.getElementById(id))
        .map(node => (node ? node.innerText : ''))
        .join(' ');
    } else if (el.hasAttribute('aria-label')) {
      text = el.getAttribute('aria-label');
    } else {
      text = el.innerText;
    }

    return text.trim();
  },
})
        ),
      ],[
        "lang",
        Object.assign(
          { name: "lang" },
          // Language tags are defined in http://www.ietf.org/rfc/bcp/bcp47.txt
// This regular expression ignores reserved parts, irregular codes, extensions and private use
({
  message: el => (el.lang ? 'language code is invalid' : 'missing lang attribute'),
  selector: 'html',
  match: /^((en-gb-oed)|([a-z]{2,3}(-[a-z]{3})?(-[a-z]{4})?(-[a-z]{2}|-\d{3})?(-[a-z0-9]{5,8}|-(\d[a-z0-9]{3}))*))$/i,
  filter(el) {
    return this.match.test(el.lang);
  },
})
        ),
      ],[
        "list-id",
        Object.assign(
          { name: "list-id" },
          ({
  message: 'no datalist found',
  selector: 'input[list]',
  filter(el) {
    const listId = el.getAttribute('list');
    return listId && $(`datalist[id="${cssEscape(listId)}"]`);
  },
})
        ),
      ],[
        "no-button-without-type",
        Object.assign(
          { name: "no-button-without-type" },
          ({
  message: 'all buttons should have a type attribute',
  selector: 'button:not([type])',
})
        ),
      ],[
        "no-duplicate-anchor-names",
        Object.assign(
          { name: "no-duplicate-anchor-names" },
          ({
  message: 'Name is not unique',
  selector: 'a[name]',
  filter(el) {
    const id = cssEscape(el.name);
    return id && $$(`a[name="${id}"],[id="${id}"]`).length === 1;
  },
})
        ),
      ],[
        "no-empty-select",
        Object.assign(
          { name: "no-empty-select" },
          ({
  message: 'Selects should have options',
  selector: 'select',
  filter: el => $$('option', el).length,
})
        ),
      ],[
        "no-links-to-missing-fragments",
        Object.assign(
          { name: "no-links-to-missing-fragments" },
          ({
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
})
        ),
      ],[
        "no-multiple-select",
        Object.assign(
          { name: "no-multiple-select" },
          ({
  message: 'Do not use multiple selects',
  selector: 'select[multiple]',
})
        ),
      ],[
        "no-outside-controls",
        Object.assign(
          { name: "no-outside-controls" },
          ({
  message: 'All controls should be within a form',
  selector: 'input,textarea,select',
  filter: el => el.form,
})
        ),
      ],[
        "no-reset",
        Object.assign(
          { name: "no-reset" },
          ({
  message: 'Do not use reset buttons',
  selector: 'input[type=reset],button[type=reset]',
})
        ),
      ],[
        "title",
        Object.assign(
          { name: "title" },
          ({
  message: 'document must have a title',
  selector: 'html',
  filter() {
    return document.title.trim();
  },
})
        ),
      ],[
        "unique-id",
        Object.assign(
          { name: "unique-id" },
          ({
  message: 'id is not unique',
  selector: '[id]',
  filter: el => !el.id || $$(`[id="${cssEscape(el.id)}"]`).length === 1,
})
        ),
      ]
    ]);
  
},{"./standards":7,"./utils":8}],"./version":[function(require,module,exports){
"use strict";
module.exports = "1.3.1"
},{}],1:[function(require,module,exports){
"use strict";
/**
 * Rules for aria properties
 *
 * https://w3c.github.io/html-aria/
 */

// Aria properties that can be used on any HTML element
const globalAria = [
  'atomic', 'busy', 'controls', 'current', 'describedby', 'details',
  'disabled', 'dropeffect', 'errormessage', 'flowto', 'grabbed',
  'haspopup', 'hidden', 'invalid', 'keyshortcuts', 'label',
  'labelledby', 'live', 'owns', 'relevant', 'roledescription',
];


// All roles and their allowed aria properties
const expanded = {
  allowed: ['expanded'],
};

const roles = {
  alert: expanded,
  alertdialog: {
    allowed: ['expanded', 'modal'],
  },
  application: {
    allowed: ['activedescendant'],
  },
  article: expanded,
  banner: expanded,
  button: {
    allowed: ['expanded', 'pressed'],
  },
  cell: {},
  checkbox: {
    required: ['checked'],
  },
  columnheader: {
    allowed: ['sort', 'readonly', 'required', 'selected', 'expanded'],
  },
  combobox: {
    required: ['expanded'],
    allowed: ['autocomplete', 'required', 'activedescendant'],
  },
  complementary: expanded,
  contentinfo: expanded,
  definition: expanded,
  dialog: expanded,
  directory: expanded,
  document: expanded,
  feed: {
    allowed: ['setsize', 'expanded'],
  },
  figure: expanded,
  form: expanded,
  grid: {
    allowed: ['level', 'multiselectable', 'readonly', 'activedescendant', 'expanded'],
  },
  gridcell: {
    allowed: ['readonly', 'required', 'selected', 'expanded'],
  },
  group: {
    allowed: ['activedescendant', 'expanded'],
  },
  heading: {
    allowed: ['level', 'expanded'],
  },
  img: expanded,
  link: expanded,
  list: expanded,
  listbox: {
    allowed: ['multiselectable', 'required', 'expanded', 'activedescendant', 'expanded'],
  },
  listitem: {
    allowed: ['level', 'posinset', 'setsize', 'expanded'],
  },
  log: expanded,
  main: expanded,
  marquee: expanded,
  math: expanded,
  menu: {
    allowed: ['activedescendant', 'expanded'],
  },
  menubar: {
    allowed: ['activedescendant'],
  },
  menuitem: {},
  menuitemcheckbox: {
    required: ['checked'],
  },
  menuitemradio: {
    required: ['checked'],
    allowed: ['posinset', 'selected', 'setsize'],
  },
  navigation: expanded,
  note: expanded,
  option: {
    allowed: ['checked', 'posinset', 'selected', 'setsize'],
  },
  presentation: {},
  progressbar: {
    allowed: ['valuemax', 'valuemin', 'valuenow', 'valuetext'],
  },
  radio: {
    required: ['checked'],
    allowed: ['posinset', 'selected', 'setsize'],
  },
  radiogroup: {
    allowed: ['required', 'activedescendant', 'expanded'],
  },
  region: expanded,
  row: {
    allowed: [
      'colindex', 'level', 'rowindex', 'selected', 'level', 'selected',
      'activedescendant', 'expanded',
    ],
  },
  rowgroup: {
    allowed: ['activedescendant', 'expanded'],
  },
  rowheader: {
    allowed: ['sort', 'readonly', 'required', 'selected', 'expanded'],
  },
  scrollbar: {
    required: ['controls', 'orientation', 'valuemax', 'valuemin', 'valuenow'],
    allowed: ['expanded'],
  },
  search: {
    allowed: ['expanded', 'orientation'],
  },
  searchbox: {
    allowed: ['activedescendant', 'autocomplete', 'multiline', 'placeholder', 'readonly', 'required'],
  },
  separator: {
    allowed: ['valuetext'],
  },
  slider: {
    required: ['valuemax', 'valuemin', 'valuenow'],
    allowed: ['orientation', 'valuetext'],
  },
  spinbutton: {
    required: ['valuemax', 'valuemin', 'valuenow'],
    allowed: ['required', 'valuetext'],
  },
  status: expanded,
  switch: {
    required: ['checked'],
  },
  tab: {
    allowed: ['selected', 'expanded'],
  },
  table: {
    allowed: ['colcount', 'rowcount'],
  },
  tablist: {
    allowed: ['level', 'activedescendant', 'expanded'],
  },
  tabpanel: expanded,
  term: expanded,
  textbox: {
    allowed: ['activedescendant', 'autocomplete', 'multiline', 'placeholder', 'readonly', 'required'],
  },
  timer: expanded,
  toolbar: {
    allowed: ['activedescendant', 'expanded'],
  },
  tooltip: expanded,
  tree: {
    allowed: ['multiselectable', 'required', 'activedescendant', 'expanded'],
  },
  treegrid: ['level', 'multiselecteable', 'readonly', 'activedescendant', 'expanded', 'required'],
  treeitem: ['level', 'posinset', 'setsize', 'expanded', 'checked', 'selected'],
};

const bool = ['true', 'false'];
const tri = ['true', 'false', 'mixed'];

// Allowed aria property values
const properties = {
  activedescendant: 'id',
  atomic: bool,
  autocomplete: ['inline', 'list', 'both', 'none'],
  busy: bool,
  checked: tri,
};

exports.globalAria = globalAria;
exports.roles = roles;
exports.properties = properties;

},{}],2:[function(require,module,exports){
"use strict";
/**
 * Entry point for standalone autorunning linter
 */
const Linter = require('./linter');

let config = window.accessibilityLinterConfig;
if (!config) {
  const scriptElement = document.currentScript;
  if (scriptElement) {
    const settings = scriptElement.textContent.trim();
    if (settings) {
      config = JSON.parse(settings);
    }
  }
}

const linter = new Linter(config);
const start = () => {
  linter.run();
  linter.observe();
};

if (/^(:?interactive|complete)$/.test(document.readyState)) {
  // Document already loaded
  start();
} else {
  document.addEventListener('DOMContentLoaded', start);
}

module.exports = linter;

},{"./linter":3}],3:[function(require,module,exports){
"use strict";
const Runner = require('./runner');
const Logger = require('./logger');
const rules = require('./rules');
const utils = require('./utils');
const version = require('./version');
const standards = require('./standards');

const Linter = module.exports = class AccessibilityLinter extends Runner {
  constructor(options) {
    options = options || {};
    options.logger = options.logger || new Logger();
    options.rules = options.rules || rules;
    super(options);

    this.root = options.root || document;
  }

  /**
   * Start looking for issues
   */
  observe() {
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
Linter.rules = rules;
Linter.version = version;
Linter.standards = standards;

},{"./logger":4,"./rules":"./rules","./runner":6,"./standards":7,"./utils":8,"./version":"./version"}],4:[function(require,module,exports){
"use strict";
/* eslint-disable no-console */
module.exports = class Logger {
  constructor(docLink) {
    this.docLink = docLink;
  }

  error(rule, el) {
    console.error.apply(console, this.message(rule, el));
  }

  warn(rule, el) {
    console.warn.apply(console, this.message(rule, el));
  }

  message(rule, el) {
    return [
      typeof rule.message === 'function' ? rule.message(el) : rule.message,
      el,
      this.getLink(rule),
    ].filter(Boolean);
  }

  getLink(rule) {
    if (!this.docLink || !rule.doc) {
      return null;
    }

    return `${this.docLink}#${rule.doc}`;
  }
};

},{}],5:[function(require,module,exports){
"use strict";
/**
 * Rules for what an element allows
 *
 * https://w3c.github.io/html-aria/
 */

function rule(options = {}) {
  return Object.assign(
    {
      roles: false,
      aria: true,
      selector: '*',
      implicitAria: false,
    },
    options,
    {
      implicit: [].concat(options.implicit || []),
    }
  );
}

// Common rules
const noRoleOrAria = rule({ aria: false });
const noRole = rule();
const anyRole = rule({ roles: true });

exports.defaultRule = anyRole;

// Hash of elements and rules
exports.rules = {
  a: [
    rule({
      selector: '[href]',
      implicit: 'link',
      roles: [
        'button', 'checkbox', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'radio', 'tab', 'switch', 'treeitem',
      ],
      implicitAria: true,
    }),
    rule({
      selector: ':not([href])',
      roles: true,
    }),
  ],
  address: rule({
    implicit: ['contentinfo'],
  }),
  area: [
    rule({
      selector: '[href]',
      implicit: 'link',
      implicitAria: true,
    }),
  ],
  article: rule({
    implicit: 'article',
    roles: ['presentation', 'document', 'application', 'main', 'region'],
  }),
  aside: rule({
    implicit: 'complementary',
    roles: ['note', 'region', 'search'],
  }),
  audio: rule({
    roles: ['application'],
  }),
  base: noRoleOrAria,
  body: rule({
    implicit: ['document'],
  }),
  button: [
    rule({
      selector: '[type=menu]',
      implicit: 'button',
      roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio'],
    }),
    rule({
      implicit: 'button',
      roles: [
        'checkbox', 'link', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'radio', 'switch', 'tab',
      ],
    }),
  ],
  caption: noRole,
  col: noRoleOrAria,
  colgroup: noRoleOrAria,
  datalist: rule({
    implicit: 'listbox',
    implicitAria: true,
  }),
  dd: rule({
    implicit: 'definition',
    implicitAria: true,
  }),
  details: rule({
    implicit: 'group',
    implicitAria: true,
  }),
  dialog: rule({
    implicit: 'dialog',
    roles: ['alertdialog'],
    implicitAria: true,
  }),
  div: anyRole,
  dl: rule({
    implicit: 'list',
    roles: ['group', 'presentation'],
  }),
  dt: rule({
    implicit: 'listitem',
    implicitAria: true,
  }),
  embed: rule({
    roles: ['application', 'document', 'presentation', 'img'],
  }),
  fieldset: rule({
    roles: ['group', 'presentation'],
  }),
  figure: rule({
    implicit: 'figure',
    roles: ['group', 'presentation'],
  }),
  footer: [
    rule({
      selector: 'article footer,section footer',
      roles: ['group', 'presentation'],
    }),
    rule({
      implicit: 'contentinfo',
      roles: ['group', 'presentation'],
    }),
  ],
  form: rule({
    implicit: 'form',
    roles: ['search', 'presentation'],
  }),
  p: anyRole,
  pre: anyRole,
  blockquote: anyRole,
  h1: rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h2: rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h3: rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h4: rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h5: rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h6: rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  head: noRoleOrAria,
  header: [
    rule({
      selector: 'article header,section header',
      roles: ['group', 'presentation'],
    }),
    rule({
      implicit: 'banner',
      roles: ['group', 'presentation'],
    }),
  ],
  hr: rule({
    implicit: 'separator',
    roles: ['presentation'],
    implicitAria: true,
  }),
  html: noRoleOrAria,
  iframe: rule({
    roles: ['application', 'document', 'img'],
  }),
  img: [
    rule({
      selector: '[alt=""]',
      roles: ['presentation'],
      aria: false,
    }),
    rule({
      implicit: 'img',
      roles: true,
    }),
  ],
  input: [
    rule({
      selector: '[list]:not([type]),[list][type=text],[list][type=search],[list][type=tel],[list][type=url],[list][type=email]',
      implicit: 'combobox',
      implicitAria: true,
    }),
    rule({
      selector: '[type=button]',
      implicit: 'button',
      roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
    }),
    rule({
      selector: '[type=image]',
      implicit: 'button',
      roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch'],
    }),
    rule({
      selector: '[type=checkbox]',
      implicit: 'checkbox',
      roles: ['button', 'menuitemcheckbox', 'switch'],
    }),
    rule({
      selector: ':not([type]),[type=password],[type=tel],[type=text],[type=url]',
      implicit: 'textbox',
    }),
    rule({
      selector: '[type=email]',
      implicit: 'textbox',
      implicitAria: true,
    }),
    rule({
      selector: '[type=hidden]',
      aria: false,
    }),
    rule({
      selector: '[type=number]',
      implicit: 'spinbutton',
      implicitAria: true,
    }),
    rule({
      selector: '[type=radio]',
      implicit: 'radio',
      roles: ['menuitemradio'],
    }),
    rule({
      selector: '[type=range]',
      implicit: 'slider',
    }),
    rule({
      selector: '[type=reset],[type=submit]',
      implicit: 'button',
      implicitAria: true,
    }),
    rule({
      selector: '[type=search]',
      implicit: 'searchbox',
      implicitAria: true,
    }),
    noRole,
  ],
  ins: anyRole,
  del: anyRole,
  keygen: noRole,
  label: noRole,
  legend: noRole,
  li: [
    rule({
      selector: 'ol>li,ul>li',
      implicit: 'listitem',
      roles: [
        'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option',
        'presentation', 'separator', 'tab', 'treeitem',
      ],
    }),
  ],
  link: [
    rule({
      selector: '[href]',
      implicit: 'link',
      globalAria: false,
    }),
  ],
  main: rule({
    implicit: 'main',
  }),
  map: noRoleOrAria,
  math: rule({
    implicit: 'math',
  }),
  menu: [
    rule({
      selector: '[type=toolbar]',
      implicit: 'toolbar',
      implicitAria: true,
    }),
  ],
  menuitem: [
    rule({
      selector: '[type=command]',
      implicit: 'menuitem',
      implicitAria: true,
    }),
    rule({
      selector: '[type=checkbox]',
      implicit: 'menuitemcheckbox',
      implicitAria: true,
    }),
    rule({
      selector: '[type=radio]',
      implicit: 'menuitemradio',
      implicitAria: true,
    }),
  ],
  meta: noRoleOrAria,
  meter: rule({
    implicit: 'progressbar',
  }),
  nav: rule({
    implicit: 'navigation',
  }),
  noscript: noRoleOrAria,
  object: rule({
    roles: ['application', 'document', 'img'],
  }),
  ol: rule({
    implicit: 'list',
    roles: [
      'directory', 'group', 'listbox', 'menu', 'menubar', 'presentation',
      'radiogroup', 'tablist', 'toolbar', 'tree',
    ],
  }),
  optgroup: rule({
    implicit: 'group',
  }),
  option: [
    rule({
      selector: 'select>option,select>optgroup>option,datalist>option',
      implicit: 'option',
    }),
    noRoleOrAria,
  ],
  output: rule({
    implicit: 'status',
    roles: true,
  }),
  param: noRoleOrAria,
  picture: noRoleOrAria,
  progress: rule({
    implicit: 'progressbar',
    implicitAria: true,
  }),
  script: noRoleOrAria,
  section: rule({
    implicit: 'region',
    roles: [
      'alert', 'alertdialog', 'application', 'banner', 'complementary',
      'contentinfo', 'dialog', 'document', 'log', 'main', 'marquee',
      'navigation', 'search', 'status',
    ],
  }),
  select: rule({
    implicit: 'listbox',
  }),
  source: noRoleOrAria,
  span: anyRole,
  style: noRoleOrAria,
  svg: rule({
    roles: ['application', 'document', 'img'],
  }),
  summary: rule({
    implicit: 'button',
    implicitAria: true,
  }),
  table: rule({
    implicit: 'table',
    roles: true,
  }),
  template: noRoleOrAria,
  textarea: rule({
    implicit: 'textbox',
  }),
  tbody: rule({
    implicit: 'rowgroup',
    roles: true,
  }),
  thead: rule({
    implicit: 'rowgroup',
    roles: true,
  }),
  tfoot: rule({
    implicit: 'rowgroup',
    roles: true,
  }),
  title: noRoleOrAria,
  td: rule({
    implicit: 'cell',
    roles: true,
  }),
  em: anyRole,
  strong: anyRole,
  small: anyRole,
  s: anyRole,
  cite: anyRole,
  q: anyRole,
  dfn: anyRole,
  abbr: anyRole,
  time: anyRole,
  code: anyRole,
  var: anyRole,
  samp: anyRole,
  kbd: anyRole,
  sub: anyRole,
  sup: anyRole,
  i: anyRole,
  b: anyRole,
  u: anyRole,
  mark: anyRole,
  ruby: anyRole,
  rt: anyRole,
  rp: anyRole,
  bdi: anyRole,
  bdo: anyRole,
  br: anyRole,
  wbr: anyRole,
  th: rule({
    implicit: ['columnheader', 'rowheader'],
    roles: true,
  }),
  tr: rule({
    implicit: 'row',
    roles: true,
  }),
  track: noRoleOrAria,
  ul: rule({
    implicit: 'list',
    roles: [
      'directory', 'group', 'listbox', 'menu', 'menubar',
      'tablist', 'toolbar', 'tree', 'presentation',
    ],
  }),
  video: rule({
    roles: ['application'],
  }),
};

},{}],6:[function(require,module,exports){
"use strict";
const { $$ } = require('./utils');

const dataAttr = 'accessibility-linter';

const addToSetArray = (set, key, value) => set.set(key, (set.get(key) || []).concat(value));
const isInSetArray = (set, key, value) => (set.get(key) || []).includes(value);
const cssEscape = value => value.replace(/"/g, '\\"');

module.exports = class Runner {
  constructor(config) {
    this.rules = config.rules;
    this.ruleSettings = config.ruleSettings || {};
    this.defaultOff = !!config.defaultOff;

    this.whitelist = config.whitelist;
    this.logger = config.logger;

    // Elements and issues already reported
    this.reported = new WeakMap();
    // Elements that are whitelisted
    this.whitelisted = new WeakMap();
    // Elements with ignore attributes
    this.ignored = new WeakMap();
  }

  settings(name) {
    return this.ruleSettings[name] || {};
  }

  /**
   * Run all the rules
   * @param {HTMLElement} [context] A context to run the rules within
   */
  run(context) {
    this.rules
      .forEach((rule, name) => {
        const enabled = this.settings(name).enabled;
        if (enabled === false ||
          (enabled !== true && (this.defaultOff || rule.enabled === false))) {
          return;
        }
        this.runRule(rule, name, context);
      });
  }

  /**
   * Run a single rule
   * @param {Object} rule The rule to run
   * @param {HTMLElement} [context] A context to run the rules within
   */
  runRule(rule, name, context) {
    $$(rule.selector, context)
      .filter(el => this.filterIgnoreAttribute(el, name))
      .filter(el => this.filterWhitelist(el, name))
      .filter(el => !isInSetArray(this.reported, el, name))
      .filter(el => (rule.filter ? !rule.filter(el) : true))
      .forEach((el) => {
        const type = this.settings(name).type || rule.type || 'error';
        this.logger[type](rule, el);
        addToSetArray(this.reported, el, name);
      });
  }

  /**
   * Filter elements on the whitelist
   */
  filterWhitelist(el, name) {
    if (isInSetArray(this.whitelisted, el, name)) {
      return false;
    }

    const globalWhitelist = this.whitelist;
    const whitelist = this.settings(name).whitelist;
    const isWhitelisted = (globalWhitelist && el.matches(globalWhitelist)) ||
      (whitelist || el.matches(whitelist));

    if (isWhitelisted) {
      addToSetArray(this.whitelisted, el, name);
      return false;
    }

    return true;
  }

  filterIgnoreAttribute(el, ruleName) {
    if (isInSetArray(this.ignored, el, ruleName)) {
      return false;
    }

    const ignore = el.matches(
      `[data-${dataAttr}-ignore=""],[data-${dataAttr}-ignore~="${cssEscape(ruleName)}"]`
    );

    if (ignore) {
      addToSetArray(this.ignored, el, ruleName);
      return false;
    }

    return true;
  }
};

},{"./utils":8}],7:[function(require,module,exports){
"use strict";
/**
 * HTML standards
 *
 * https://w3c.github.io/html-aria/
 */
const { rules: elementRules, defaultRule } = require('./role-rules');
const { roles } = require('./aria-rules');

const allRoles = Object.keys(roles);

function getAllowedRoles(rule) {
  if (rule.roles === false) {
    return [];
  }
  if (rule.roles === true) {
    return allRoles.filter(role => !rule.implicit.includes(role));
  }
  return rule.roles;
}

/**
 * Given an element, return an object with the aria information
 */
exports.aria = {
  match(el) {
    const name = el.nodeName.toLowerCase();
    let rule = elementRules[name];
    if (Array.isArray(rule)) {
      rule = rule.find(item => item.selector === '*' || el.matches(item.selector));
    }
    rule = rule || defaultRule;
    const allowedRoles = getAllowedRoles(rule);

    return {
      implicitRoles: rule.implicit,
      allowedRoles,
    };
  },

  roles: allRoles,
};

},{"./aria-rules":1,"./role-rules":5}],8:[function(require,module,exports){
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

},{}]},{},["./rules","./version",2])(2)
});
//# sourceMappingURL=linter.js.map
