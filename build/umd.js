(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AccessibilityLinter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./rules":[function(require,module,exports){
"use strict";

    const { $, $$, cssEscape } = require('./utils');
    const aria = require('./aria');
    const elements = require('./elements');
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
    return this.check(el);
  },
  check(el) {
    const role = el.getAttribute('role').trim();
    if (!role) {
      return 'role attribute should not be empty';
    }
    let error;
    const rule = aria.match(el);
    role.split(/\s+/).some((name) => {
      if (!aria.roles[name]) {
        error = `"${name}" is not a known role`;
        return true;
      }

      if (rule.implicitRoles.includes(name)) {
        error = `role "${name}" is implicit for this element and should not be specified`;
        return true;
      }

      if (!rule.allowedRoles.includes(name)) {
        error = `role "${name}" is not allowed for this element`;
      }

      return false;
    });

    return error;
  },
  selector: '[role]',
  filter(el) {
    return !this.check(el);
  },
})
        ),
      ],[
        "elements/obsolete",
        Object.assign(
          { name: "elements/obsolete" },
          ({
  message: 'do not use obsolete elements',
  selector: Object.keys(elements).filter(el => elements[el].obsolete).join(','),
})
        ),
      ],[
        "elements/unknown",
        Object.assign(
          { name: "elements/unknown" },
          ({
  message: 'unknown element',
  selector: Object.keys(elements).map(name => `:not(${name})`).join(''),
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
        "namespace-attributes",
        Object.assign(
          { name: "namespace-attributes" },
          ({
  message: (el) => {
    const names = ['data', 'data-', 'aria', 'aria-'].filter(name => el.hasAttribute(name));
    return `invalid attribute${names.length > 1 ? 's' : ''}: ${names.join(', ')}`;
  },
  selector: '[data],[data-],[aria],[aria-]',
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
  
},{"./aria":1,"./elements":4,"./utils":9}],"./version":[function(require,module,exports){
"use strict";
module.exports = "1.4.0"
},{}],1:[function(require,module,exports){
"use strict";
/**
 *  Data and functions for aria validation.  Based on
 *  - https://www.w3.org/TR/wai-aria-1.1/
 *  - https://www.w3.org/TR/html52/
 */

// const attributes = require('./attributes');
const match = require('./match');
const roles = require('./roles');

/**
 * All roles
 * @type {Object}
 */
exports.roles = roles;

/**
 * Get the elements current role based on the role attribute or implicit role
 * @param {Element} el
 * @returns {String|null}
 */
exports.getRole = (el) => {
  let role = null;
  // Should be the first non-abstract role in the list
  if ((el.getAttribute('role') || '').split(/\s+/).some((name) => {
    if (roles[name]) {
      role = name;
      return true;
    }
    return false;
  })) {
    return role;
  }
  return match(el).implicitRoles[0] || null;
};

/**
 * Get the aria rules for an element
 * @param {Element} el
 * @returns {Object}
 */
exports.getElementRules = el => match(el);

},{"./match":2,"./roles":3}],2:[function(require,module,exports){
"use strict";
/**
 * Aria rules for a HTML element
 *
 * https://w3c.github.io/html-aria/
 */

const allRoles = require('./roles');

class Rule {
  constructor({ selector = '*', implicit = [], roles = [], anyRole = false }) {
    this.selector = selector;
    this.implicitRoles = [].concat(implicit);
    this.roles = roles;
    this.anyRole = anyRole;
  }

  get allowedRoles() {
    if (this.anyRole) {
      return Object.keys(allRoles).filter(name => !this.implicitRoles.includes(name));
    }
    return this.roles;
  }
}

// Common rules
// TODO: include aria attribute rules
const noRoleOrAria = new Rule({});
const noRole = new Rule({});
const anyRole = new Rule({ anyRole: true });

// Hash of elements and rules
const rules = {
  a: [
    new Rule({
      selector: '[href]',
      implicit: 'link',
      roles: [
        'button', 'checkbox', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'radio', 'tab', 'switch', 'treeitem',
      ],
    }),
    new Rule({
      selector: ':not([href])',
      anyRole: true,
    }),
  ],
  address: new Rule({
    implicit: ['contentinfo'],
  }),
  area: [
    new Rule({
      selector: '[href]',
      implicit: 'link',
    }),
  ],
  article: new Rule({
    implicit: 'article',
    roles: ['presentation', 'document', 'application', 'main', 'region'],
  }),
  aside: new Rule({
    implicit: 'complementary',
    roles: ['note', 'region', 'search'],
  }),
  audio: new Rule({
    roles: ['application'],
  }),
  base: noRoleOrAria,
  body: new Rule({
    implicit: ['document'],
  }),
  button: [
    new Rule({
      selector: '[type=menu]',
      implicit: 'button',
      roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio'],
    }),
    new Rule({
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
  datalist: new Rule({
    implicit: 'listbox',
  }),
  dd: new Rule({
    implicit: 'definition',
  }),
  details: new Rule({
    implicit: 'group',
  }),
  dialog: new Rule({
    implicit: 'dialog',
    roles: ['alertdialog'],
  }),
  div: anyRole,
  dl: new Rule({
    implicit: 'list',
    roles: ['group', 'presentation'],
  }),
  dt: new Rule({
    implicit: 'listitem',
  }),
  embed: new Rule({
    roles: ['application', 'document', 'presentation', 'img'],
  }),
  fieldset: new Rule({
    roles: ['group', 'presentation'],
  }),
  figure: new Rule({
    implicit: 'figure',
    roles: ['group', 'presentation'],
  }),
  footer: [
    new Rule({
      selector: 'article footer,section footer',
      roles: ['group', 'presentation'],
    }),
    new Rule({
      implicit: 'contentinfo',
      roles: ['group', 'presentation'],
    }),
  ],
  form: new Rule({
    implicit: 'form',
    roles: ['search', 'presentation'],
  }),
  p: anyRole,
  pre: anyRole,
  blockquote: anyRole,
  h1: new Rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h2: new Rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h3: new Rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h4: new Rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h5: new Rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h6: new Rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  head: noRoleOrAria,
  header: [
    new Rule({
      selector: 'article header,section header',
      roles: ['group', 'presentation'],
    }),
    new Rule({
      implicit: 'banner',
      roles: ['group', 'presentation'],
    }),
  ],
  hr: new Rule({
    implicit: 'separator',
    roles: ['presentation'],
  }),
  html: noRoleOrAria,
  iframe: new Rule({
    roles: ['application', 'document', 'img'],
  }),
  img: [
    new Rule({
      selector: '[alt=""]',
      roles: ['presentation'],
      aria: false,
    }),
    new Rule({
      implicit: 'img',
      anyRole: true,
    }),
  ],
  input: [
    new Rule({
      selector: '[list]:not([type]),[list][type=text],[list][type=search],[list][type=tel],[list][type=url],[list][type=email]',
      implicit: 'combobox',
    }),
    new Rule({
      selector: '[type=button]',
      implicit: 'button',
      roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
    }),
    new Rule({
      selector: '[type=image]',
      implicit: 'button',
      roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch'],
    }),
    new Rule({
      selector: '[type=checkbox]',
      implicit: 'checkbox',
      roles: ['button', 'menuitemcheckbox', 'switch'],
    }),
    new Rule({
      selector: ':not([type]),[type=password],[type=tel],[type=text],[type=url]',
      implicit: 'textbox',
    }),
    new Rule({
      selector: '[type=email]',
      implicit: 'textbox',
    }),
    new Rule({
      selector: '[type=hidden]',
      aria: false,
    }),
    new Rule({
      selector: '[type=number]',
      implicit: 'spinbutton',
    }),
    new Rule({
      selector: '[type=radio]',
      implicit: 'radio',
      roles: ['menuitemradio'],
    }),
    new Rule({
      selector: '[type=range]',
      implicit: 'slider',
    }),
    new Rule({
      selector: '[type=reset],[type=submit]',
      implicit: 'button',
    }),
    new Rule({
      selector: '[type=search]',
      implicit: 'searchbox',
    }),
    noRole,
  ],
  ins: anyRole,
  del: anyRole,
  keygen: noRole,
  label: noRole,
  legend: noRole,
  li: [
    new Rule({
      selector: 'ol>li,ul>li',
      implicit: 'listitem',
      roles: [
        'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option',
        'presentation', 'separator', 'tab', 'treeitem',
      ],
    }),
  ],
  link: [
    new Rule({
      selector: '[href]',
      implicit: 'link',
      globalAria: false,
    }),
  ],
  main: new Rule({
    implicit: 'main',
  }),
  map: noRoleOrAria,
  math: new Rule({
    implicit: 'math',
  }),
  menu: [
    new Rule({
      selector: '[type=toolbar]',
      implicit: 'toolbar',
    }),
  ],
  menuitem: [
    new Rule({
      selector: '[type=command]',
      implicit: 'menuitem',
    }),
    new Rule({
      selector: '[type=checkbox]',
      implicit: 'menuitemcheckbox',
    }),
    new Rule({
      selector: '[type=radio]',
      implicit: 'menuitemradio',
    }),
  ],
  meta: noRoleOrAria,
  meter: new Rule({
    implicit: 'progressbar',
  }),
  nav: new Rule({
    implicit: 'navigation',
  }),
  noscript: noRoleOrAria,
  object: new Rule({
    roles: ['application', 'document', 'img'],
  }),
  ol: new Rule({
    implicit: 'list',
    roles: [
      'directory', 'group', 'listbox', 'menu', 'menubar', 'presentation',
      'radiogroup', 'tablist', 'toolbar', 'tree',
    ],
  }),
  optgroup: new Rule({
    implicit: 'group',
  }),
  option: [
    new Rule({
      selector: 'select>option,select>optgroup>option,datalist>option',
      implicit: 'option',
    }),
    noRoleOrAria,
  ],
  output: new Rule({
    implicit: 'status',
    anyRole: true,
  }),
  param: noRoleOrAria,
  picture: noRoleOrAria,
  progress: new Rule({
    implicit: 'progressbar',
  }),
  script: noRoleOrAria,
  section: new Rule({
    implicit: 'region',
    roles: [
      'alert', 'alertdialog', 'application', 'banner', 'complementary',
      'contentinfo', 'dialog', 'document', 'log', 'main', 'marquee',
      'navigation', 'search', 'status',
    ],
  }),
  select: new Rule({
    implicit: 'listbox',
  }),
  source: noRoleOrAria,
  span: anyRole,
  style: noRoleOrAria,
  svg: new Rule({
    roles: ['application', 'document', 'img'],
  }),
  summary: new Rule({
    implicit: 'button',
  }),
  table: new Rule({
    implicit: 'table',
    anyRole: true,
  }),
  template: noRoleOrAria,
  textarea: new Rule({
    implicit: 'textbox',
  }),
  tbody: new Rule({
    implicit: 'rowgroup',
    anyRole: true,
  }),
  thead: new Rule({
    implicit: 'rowgroup',
    anyRole: true,
  }),
  tfoot: new Rule({
    implicit: 'rowgroup',
    anyRole: true,
  }),
  title: noRoleOrAria,
  td: new Rule({
    implicit: 'cell',
    anyRole: true,
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
  th: new Rule({
    implicit: ['columnheader', 'rowheader'],
    anyRole: true,
  }),
  tr: new Rule({
    implicit: 'row',
    anyRole: true,
  }),
  track: noRoleOrAria,
  ul: new Rule({
    implicit: 'list',
    roles: [
      'directory', 'group', 'listbox', 'menu', 'menubar',
      'tablist', 'toolbar', 'tree', 'presentation',
    ],
  }),
  video: new Rule({
    roles: ['application'],
  }),
};

module.exports = function match(el) {
  const name = el.nodeName.toLowerCase();
  let found = rules[name];
  if (Array.isArray(found)) {
    found = found.find(item => item.selector === '*' || el.matches(item.selector));
  }
  return found || anyRole;
};

},{"./roles":3}],3:[function(require,module,exports){
"use strict";
/**
 * Rules for aria properties
 *
 * https://w3c.github.io/html-aria/
 */

module.exports = {
  alert: {
    allowed: ['expanded'],
  },
  alertdialog: {
    allowed: ['expanded', 'modal'],
  },
  application: {
    allowed: ['activedescendant'],
  },
  article: {
    allowed: ['expanded'],
  },
  banner: {
    allowed: ['expanded'],
  },
  button: {
    allowed: ['expanded', 'pressed'],
    nameFromContent: true,
  },
  cell: {
    nameFromContent: true,
  },
  checkbox: {
    required: ['checked'],
    nameFromContent: true,
  },
  columnheader: {
    allowed: ['sort', 'readonly', 'required', 'selected', 'expanded'],
    nameFromContent: true,
  },
  combobox: {
    required: ['expanded'],
    allowed: ['autocomplete', 'required', 'activedescendant'],
  },
  complementary: {
    allowed: ['expanded'],
  },
  contentinfo: {
    allowed: ['expanded'],
  },
  definition: {
    allowed: ['expanded'],
  },
  dialog: {
    allowed: ['expanded'],
  },
  directory: {
    allowed: ['expanded'],
  },
  document: {
    allowed: ['expanded'],
  },
  feed: {
    allowed: ['setsize', 'expanded'],
  },
  figure: {
    allowed: ['expanded'],
  },
  form: {
    allowed: ['expanded'],
  },
  grid: {
    allowed: ['level', 'multiselectable', 'readonly', 'activedescendant', 'expanded'],
  },
  gridcell: {
    allowed: ['readonly', 'required', 'selected', 'expanded'],
    nameFromContent: true,
  },
  group: {
    allowed: ['activedescendant', 'expanded'],
  },
  heading: {
    allowed: ['level', 'expanded'],
    nameFromContent: true,
  },
  img: {
    allowed: ['expanded'],
  },
  link: {
    allowed: ['expanded'],
    nameFromContent: true,
  },
  list: {
    allowed: ['expanded'],
  },
  listbox: {
    allowed: ['multiselectable', 'required', 'expanded', 'activedescendant', 'expanded'],
  },
  listitem: {
    allowed: ['level', 'posinset', 'setsize', 'expanded'],
  },
  log: {
    allowed: ['expanded'],
  },
  main: {
    allowed: ['expanded'],
  },
  marquee: {
    allowed: ['expanded'],
  },
  math: {
    allowed: ['expanded'],
  },
  menu: {
    allowed: ['activedescendant', 'expanded'],
  },
  menubar: {
    allowed: ['activedescendant'],
  },
  menuitem: {
    nameFromContent: true,
  },
  menuitemcheckbox: {
    required: ['checked'],
    nameFromContent: true,
  },
  menuitemradio: {
    required: ['checked'],
    allowed: ['posinset', 'selected', 'setsize'],
    nameFromContent: true,
  },
  navigation: {
    allowed: ['expanded'],
  },
  note: {
    allowed: ['expanded'],
  },
  option: {
    allowed: ['checked', 'posinset', 'selected', 'setsize'],
    nameFromContent: true,
  },
  presentation: {},
  progressbar: {
    allowed: ['valuemax', 'valuemin', 'valuenow', 'valuetext'],
  },
  radio: {
    required: ['checked'],
    allowed: ['posinset', 'selected', 'setsize'],
    nameFromContent: true,
  },
  radiogroup: {
    allowed: ['required', 'activedescendant', 'expanded'],
  },
  region: {
    allowed: ['expanded'],
  },
  row: {
    allowed: [
      'colindex', 'level', 'rowindex', 'selected', 'level', 'selected',
      'activedescendant', 'expanded',
    ],
    nameFromContent: true,
  },
  rowgroup: {
    allowed: ['activedescendant', 'expanded'],
    nameFromContent: true,
  },
  rowheader: {
    allowed: ['sort', 'readonly', 'required', 'selected', 'expanded'],
    nameFromContent: true,
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
  status: {
    allowed: ['expanded'],
  },
  switch: {
    required: ['checked'],
    nameFromContent: true,
  },
  tab: {
    allowed: ['selected', 'expanded'],
    nameFromContent: true,
  },
  table: {
    allowed: ['colcount', 'rowcount'],
  },
  tablist: {
    allowed: ['level', 'activedescendant', 'expanded'],
  },
  tabpanel: {
    allowed: ['expanded'],
  },
  term: {
    allowed: ['expanded'],
  },
  textbox: {
    allowed: ['activedescendant', 'autocomplete', 'multiline', 'placeholder', 'readonly', 'required'],
  },
  timer: {
    allowed: ['expanded'],
  },
  toolbar: {
    allowed: ['activedescendant', 'expanded'],
    nameFromContent: true,
  },
  tooltip: {
    allowed: ['expanded'],
  },
  tree: {
    allowed: ['multiselectable', 'required', 'activedescendant', 'expanded'],
    nameFromContent: true,
  },
  treegrid: {
    allowed: ['level', 'multiselecteable', 'readonly', 'activedescendant', 'expanded', 'required'],
  },
  treeitem: {
    allowed: ['level', 'posinset', 'setsize', 'expanded', 'checked', 'selected'],
  },
};

},{}],4:[function(require,module,exports){
"use strict";
/**
 * Data for HTML elements.  Based on
 * - https://www.w3.org/TR/html52/
 * - https://w3c.github.io/html-aria/
 */

const obsolete = { obsolete: true };
module.exports = {
  a: {},
  abbr: {},
  acronym: obsolete,
  address: {},
  applet: obsolete,
  area: {},
  article: {},
  aside: {},
  audio: {},
  b: {},
  base: {},
  basefont: obsolete,
  bdi: {},
  bdo: {},
  bgsound: obsolete,
  big: obsolete,
  blink: obsolete,
  blockquote: {},
  body: {},
  br: {},
  button: {},
  canvas: {},
  caption: {},
  center: obsolete,
  cite: {},
  code: {},
  col: {},
  colgroup: {},
  command: obsolete,
  data: {},
  datalist: {},
  dd: {},
  del: {},
  details: {},
  dfn: {},
  dialog: {},
  dir: obsolete,
  div: {},
  dl: {},
  dt: {},
  em: {},
  embed: {},
  fieldset: {},
  figcaption: {},
  figure: {},
  font: obsolete,
  footer: {},
  form: {},
  frame: obsolete,
  frameset: obsolete,
  h1: {},
  h2: {},
  h3: {},
  h4: {},
  h5: {},
  h6: {},
  head: {},
  header: {},
  hgroup: obsolete,
  hr: {},
  html: {},
  i: {},
  iframe: {},
  image: obsolete,
  img: {},
  input: {},
  ins: {},
  isindex: obsolete,
  kbd: {},
  keygen: obsolete,
  label: {},
  legend: {},
  li: {},
  link: {},
  listing: obsolete,
  main: {},
  map: {},
  mark: {},
  marquee: obsolete,
  menu: {},
  menuitem: {},
  meta: {},
  meter: {},
  multicol: obsolete,
  nav: {},
  nextid: obsolete,
  nobr: obsolete,
  noembed: obsolete,
  noframes: obsolete,
  noscript: {},
  object: {},
  ol: {},
  optgroup: {},
  option: {},
  output: {},
  p: {},
  param: {},
  picture: {},
  plaintext: obsolete,
  pre: {},
  progress: {},
  q: {},
  rb: {},
  rp: {},
  rt: {},
  rtc: {},
  ruby: {},
  s: {},
  samp: {},
  script: {},
  section: {},
  select: {},
  small: {},
  source: {},
  spacer: obsolete,
  span: {},
  strike: obsolete,
  strong: {},
  style: {},
  sub: {},
  summary: {},
  sup: {},
  table: {},
  tbody: {},
  td: {},
  template: {},
  textarea: {},
  tfoot: {},
  th: {},
  thead: {},
  time: {},
  title: {},
  tr: {},
  track: {},
  tt: obsolete,
  u: {},
  ul: {},
  var: {},
  video: {},
  wbr: {},
  xmp: obsolete,
};

},{}],5:[function(require,module,exports){
"use strict";
const Runner = require('./runner');
const Logger = require('./logger');
const rules = require('./rules');
const utils = require('./utils');
const version = require('./version');
const aria = require('./aria');
const elements = require('./elements');

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
Linter.aria = aria;
Linter.elements = elements;
Linter.utils = utils;

},{"./aria":1,"./elements":4,"./logger":6,"./rules":"./rules","./runner":7,"./utils":9,"./version":"./version"}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{"./utils":9}],8:[function(require,module,exports){
"use strict";
// Is the element hidden using CSS
function cssHidden(el) {
  const style = window.getComputedStyle(el);
  return style.visibility !== 'visible' || style.display === 'none';
}

// Is the element hidden from accessibility software
module.exports = function hidden(el) {
  return el.getAttribute('aria-hidden') === 'true'
    || el.getClientRects().length === 0
    || !!el.closest('[aria-hidden=true]')
    || cssHidden(el);
};

},{}],9:[function(require,module,exports){
"use strict";
/**
 * Utils for working with the DOM
 */

const hidden = require('./hidden');

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

exports.hidden = hidden;

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

},{"./hidden":8}]},{},["./rules","./version",5])(5)
});
//# sourceMappingURL=umd.js.map
