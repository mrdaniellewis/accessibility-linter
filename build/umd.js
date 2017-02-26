(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AccessibilityLinter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./rules":[function(require,module,exports){
"use strict";
module.exports = new Map([
  ["aria-attribute-values", require("./rules/aria/attribute-values/rule.js")],
  ["aria-deprecated-attributes", require("./rules/aria/deprecated-attributes/rule.js")],
  ["aria-immutable-role", require("./rules/aria/immutable-role/rule.js")],
  ["aria-invalid-attributes", require("./rules/aria/invalid-attributes/rule.js")],
  ["aria-no-focusable-hidden", require("./rules/aria/no-focusable-hidden/rule.js")],
  ["aria-no-none-without-presentation", require("./rules/aria/no-none-without-presentation/rule.js")],
  ["aria-roles", require("./rules/aria/roles/rule.js")],
  ["colour-contrast-aa", require("./rules/colour-contrast/aa/rule.js")],
  ["colour-contrast-aaa", require("./rules/colour-contrast/aaa/rule.js")],
  ["data-attributes", require("./rules/data-attributes/rule.js")],
  ["elements-obsolete", require("./rules/elements/obsolete/rule.js")],
  ["elements-unknown", require("./rules/elements/unknown/rule.js")],
  ["fieldset-fieldset-has-legend", require("./rules/fieldset/fieldset-has-legend/rule.js")],
  ["fieldset-legend-has-fieldset", require("./rules/fieldset/legend-has-fieldset/rule.js")],
  ["fieldset-multiple-in-fieldset", require("./rules/fieldset/multiple-in-fieldset/rule.js")],
  ["headings", require("./rules/headings/rule.js")],
  ["ids-imagemap-ids", require("./rules/ids/imagemap-ids/rule.js")],
  ["ids-labels-have-inputs", require("./rules/ids/labels-have-inputs/rule.js")],
  ["ids-list-id", require("./rules/ids/list-id/rule.js")],
  ["ids-no-duplicate-anchor-names", require("./rules/ids/no-duplicate-anchor-names/rule.js")],
  ["ids-unique-id", require("./rules/ids/unique-id/rule.js")],
  ["labels-area", require("./rules/labels/area/rule.js")],
  ["labels-aria-command", require("./rules/labels/aria-command/rule.js")],
  ["labels-controls", require("./rules/labels/controls/rule.js")],
  ["labels-headings", require("./rules/labels/headings/rule.js")],
  ["labels-img", require("./rules/labels/img/rule.js")],
  ["labels-links", require("./rules/labels/links/rule.js")],
  ["labels-tabindex", require("./rules/labels/tabindex/rule.js")],
  ["lang", require("./rules/lang/rule.js")],
  ["no-button-without-type", require("./rules/no-button-without-type/rule.js")],
  ["no-empty-select", require("./rules/no-empty-select/rule.js")],
  ["no-links-to-missing-fragments", require("./rules/no-links-to-missing-fragments/rule.js")],
  ["no-multiple-select", require("./rules/no-multiple-select/rule.js")],
  ["no-outside-controls", require("./rules/no-outside-controls/rule.js")],
  ["no-reset", require("./rules/no-reset/rule.js")],
  ["title", require("./rules/title/rule.js")],
]);
},{"./rules/aria/attribute-values/rule.js":8,"./rules/aria/deprecated-attributes/rule.js":9,"./rules/aria/immutable-role/rule.js":10,"./rules/aria/invalid-attributes/rule.js":11,"./rules/aria/no-focusable-hidden/rule.js":12,"./rules/aria/no-none-without-presentation/rule.js":13,"./rules/aria/roles/rule.js":14,"./rules/colour-contrast/aa/rule.js":15,"./rules/colour-contrast/aaa/rule.js":16,"./rules/data-attributes/rule.js":17,"./rules/elements/obsolete/rule.js":18,"./rules/elements/unknown/rule.js":19,"./rules/fieldset/fieldset-has-legend/rule.js":20,"./rules/fieldset/legend-has-fieldset/rule.js":21,"./rules/fieldset/multiple-in-fieldset/rule.js":22,"./rules/headings/rule.js":23,"./rules/ids/imagemap-ids/rule.js":24,"./rules/ids/labels-have-inputs/rule.js":25,"./rules/ids/list-id/rule.js":26,"./rules/ids/no-duplicate-anchor-names/rule.js":27,"./rules/ids/unique-id/rule.js":28,"./rules/labels/area/rule.js":29,"./rules/labels/aria-command/rule.js":30,"./rules/labels/controls/rule.js":31,"./rules/labels/headings/rule.js":32,"./rules/labels/img/rule.js":33,"./rules/labels/links/rule.js":34,"./rules/labels/tabindex/rule.js":35,"./rules/lang/rule.js":36,"./rules/no-button-without-type/rule.js":37,"./rules/no-empty-select/rule.js":38,"./rules/no-links-to-missing-fragments/rule.js":39,"./rules/no-multiple-select/rule.js":40,"./rules/no-outside-controls/rule.js":41,"./rules/no-reset/rule.js":42,"./rules/title/rule.js":44}],"./version":[function(require,module,exports){
"use strict";
module.exports = "1.5.0"
},{}],1:[function(require,module,exports){
"use strict";
/**
 * Aria rules for a HTML element
 *
 * https://w3c.github.io/html-aria/
 */

/**
 * Describes what roles and aria attributes all allowed on an element
 *
 * @typedef {Object} allowedAria
 * @property {String} selector
 * @property {String[]} implicitRoles
 * @property {String[]} roles
 * @property {Boolean} anyRole
 */

/**
 * Generate a rule
 * @returns {allowedAria}
 */
function rule({ selector = '*', implicit = [], roles = [], anyRole = false }) {
  return {
    selector,
    implicit: [].concat(implicit),
    roles: anyRole ? '*' : roles,
  };
}

// Common rules
// TODO: include aria attribute rules
const noRoleOrAria = rule({});
const noRole = rule({});
const anyRole = rule({ anyRole: true });

/** @enum {(allowedAria|allowedAria[])} */
module.exports = {
  _default: anyRole,
  a: [
    rule({
      selector: '[href]',
      implicit: 'link',
      roles: [
        'button', 'checkbox', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'radio', 'tab', 'switch', 'treeitem',
      ],
    }),
    rule({
      selector: ':not([href])',
      anyRole: true,
    }),
  ],
  address: rule({
    implicit: ['contentinfo'],
  }),
  area: [
    rule({
      selector: '[href]',
      implicit: 'link',
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
  canvas: anyRole,
  caption: noRole,
  col: noRoleOrAria,
  colgroup: noRoleOrAria,
  data: anyRole,
  datalist: rule({
    implicit: 'listbox',
  }),
  dd: rule({
    implicit: 'definition',
  }),
  details: rule({
    implicit: 'group',
  }),
  dialog: rule({
    implicit: 'dialog',
    roles: ['alertdialog'],
  }),
  div: anyRole,
  dl: rule({
    implicit: 'list',
    roles: ['group', 'presentation'],
  }),
  dt: rule({
    implicit: 'listitem',
  }),
  embed: rule({
    roles: ['application', 'document', 'presentation', 'img'],
  }),
  fieldset: rule({
    roles: ['group', 'presentation'],
  }),
  figcaption: rule({
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
      anyRole: true,
    }),
  ],
  input: [
    rule({
      selector: '[list]:not([type]),[list][type=text],[list][type=search],[list][type=tel],[list][type=url],[list][type=email]',
      implicit: 'combobox',
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
    }),
    rule({
      selector: '[type=hidden]',
      aria: false,
    }),
    rule({
      selector: '[type=number]',
      implicit: 'spinbutton',
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
    }),
    rule({
      selector: '[type=search]',
      implicit: 'searchbox',
    }),
    noRole,
  ],
  ins: anyRole,
  del: anyRole,
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
    }),
  ],
  menuitem: [
    rule({
      selector: '[type=command]',
      implicit: 'menuitem',
    }),
    rule({
      selector: '[type=checkbox]',
      implicit: 'menuitemcheckbox',
    }),
    rule({
      selector: '[type=radio]',
      implicit: 'menuitemradio',
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
    anyRole: true,
  }),
  param: noRoleOrAria,
  picture: noRoleOrAria,
  progress: rule({
    implicit: 'progressbar',
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
  }),
  table: rule({
    implicit: 'table',
    anyRole: true,
  }),
  template: noRoleOrAria,
  textarea: rule({
    implicit: 'textbox',
  }),
  tbody: rule({
    implicit: 'rowgroup',
    anyRole: true,
  }),
  thead: rule({
    implicit: 'rowgroup',
    anyRole: true,
  }),
  tfoot: rule({
    implicit: 'rowgroup',
    anyRole: true,
  }),
  title: noRoleOrAria,
  td: rule({
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
  rb: anyRole,
  rtc: anyRole,
  rt: anyRole,
  rp: anyRole,
  bdi: anyRole,
  bdo: anyRole,
  br: anyRole,
  wbr: anyRole,
  th: rule({
    implicit: ['columnheader', 'rowheader'],
    anyRole: true,
  }),
  tr: rule({
    implicit: 'row',
    anyRole: true,
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

},{}],2:[function(require,module,exports){
"use strict";
/**
 *  Aria properties
 */

/**
 * Describes an aria value
 *
 * @typedef {Object} ariaValue
 * @property {String} type One of string, integer, number, id, idlist, token, tokenlist
 * @property {String[]} tokens
 * @property {String[]} alone
 */

/**
 * Describes an aria property
 *
 * @typedef {Object} ariaProperty
 * @property {ariaValue} values
 * @property {Boolean} global
 */

const boolean = {
  type: 'true/false',
  tokens: ['true', 'false'],
};

const tristate = {
  type: 'tristate',
  tokens: ['true', 'false', 'mixed', 'undefined'],
};

const nilableBoolean = {
  type: 'true/false/undefined',
  tokens: ['true', 'false', 'undefined'],
};


/** @enum {ariaProperty} */
module.exports = {
  activedescendant: {
    values: { type: 'id' },
  },
  atomic: {
    values: boolean,
    global: true,
  },
  autocomplete: {
    values: {
      type: 'token',
      tokens: ['inline', 'list', 'both', 'none'],
    },
  },
  busy: {
    values: boolean,
    global: true,
  },
  checked: {
    values: tristate,
  },
  colcount: {
    values: { type: 'integer' },
  },
  colindex: {
    values: { type: 'integer' },
  },
  colspan: {
    values: { type: 'integer' },
  },
  controls: {
    values: { type: 'idlist' },
    global: true,
  },
  current: {
    values: {
      type: 'token',
      tokens: ['page', 'step', 'location', 'date', 'time', 'true', 'false'],
    },
    global: true,
  },
  describedby: {
    values: { type: 'idlist' },
    global: true,
  },
  details: {
    values: { type: 'id' },
    global: true,
  },
  disabled: {
    values: boolean,
    global: true,
  },
  dropeffect: {
    values: {
      type: 'tokenlist',
      tokens: ['copy', 'execute', 'link', 'move', 'none', 'popup'],
      alone: ['none'],
    },
    deprecated: true,
    global: true,
  },
  errormessage: {
    values: { type: 'id' },
    global: true,
  },
  expanded: {
    values: nilableBoolean,
  },
  flowto: {
    values: { type: 'idlist' },
    global: true,
  },
  grabbed: {
    values: nilableBoolean,
    deprecated: true,
    global: true,
  },
  haspopup: {
    values: {
      type: 'token',
      tokens: ['false', 'true', 'menu', 'listbox', 'tree', 'grid', 'dialog'],
    },
    global: true,
  },
  hidden: {
    values: nilableBoolean,
    global: true,
  },
  invalid: {
    values: {
      type: 'token',
      tokens: ['grammar', 'false', 'spelling', 'true'],
    },
    global: true,
  },
  keyshortcuts: {
    values: { type: 'string' },
    global: true,
  },
  label: {
    values: { type: 'string' },
    global: true,
  },
  labelledby: {
    values: { type: 'idlist' },
    global: true,
  },
  level: {
    values: { type: 'integer' },
  },
  live: {
    values: {
      type: 'token',
      tokens: ['assertive', 'off', 'polite'],
    },
    global: true,
  },
  modal: {
    values: boolean,
  },
  multiline: {
    values: boolean,
  },
  multiselectable: {
    values: boolean,
  },
  orientation: {
    values: {
      type: 'token',
      tokens: ['horizontal', 'undefined', 'vertical'],
    },
  },
  owns: {
    values: { type: 'idlist' },
    global: true,
  },
  placeholder: {
    values: { type: 'string' },
  },
  posinset: {
    values: { type: 'integer' },
  },
  pressed: {
    values: tristate,
  },
  readonly: {
    values: boolean,
  },
  relevant: {
    values: {
      type: 'tokenlist',
      tokens: ['additions', 'all', 'removals', 'text'],
      alone: ['all'],
    },
    global: true,
  },
  required: {
    values: boolean,
  },
  roledescription: {
    values: { type: 'string' },
    global: true,
  },
  rowcount: {
    values: { type: 'integer' },
  },
  rowindex: {
    values: { type: 'integer' },
  },
  rowspan: {
    values: { type: 'integer' },
  },
  selected: {
    values: nilableBoolean,
  },
  setsize: {
    values: { type: 'integer' },
  },
  sort: {
    values: {
      type: 'token',
      tokens: ['ascending', 'descending', 'none', 'other'],
    },
  },
  valuemax: {
    values: { type: 'number' },
  },
  valuemin: {
    values: { type: 'number' },
  },
  valuenow: {
    values: { type: 'number' },
  },
  valuetext: {
    values: { type: 'string' },
  },
};

},{}],3:[function(require,module,exports){
"use strict";
/**
 * Data for HTML elements.  Based on
 * - https://www.w3.org/TR/html52/
 * - https://w3c.github.io/html-aria/
 */

/**
 * Describes an aria property
 *
 * @typedef {Object} htmlElement
 * @property {Function} nativeLabel
 * @property {Function} nativeDescription
 * @property {Boolean} obsolete
 */

const labels = (el, utils) => {
  let found = [];
  // If more than one element has our ID we must be the first
  if (el.id && document.getElementById(el.id) === el) {
    found = utils.$$(`label[for="${utils.cssEscape(el.id)}"]`);
  }
  found.push(el.closest('label:not([for])'));
  return found.filter(Boolean).filter(elm => !utils.hidden(elm));
};

const obsolete = { obsolete: true };

/** @enum {htmlElement} */
module.exports = {
  a: {},
  abbr: {},
  acronym: obsolete,
  address: {},
  applet: obsolete,
  area: {
    nativeLabel(el) {
      return el.alt || '';
    },
  },
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
  button: {
    nativeLabel: labels,
  },
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
  img: {
    nativeLabel(el) {
      return el.alt || '';
    },
  },
  input: {
    nativeLabel(el, utils) {
      if (el.type === 'hidden') {
        return null;
      }

      if (el.type === 'image') {
        return el.alt || el.value || '';
      }

      return labels(el, utils);
    },
  },
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
  math: {},
  menu: {},
  menuitem: {},
  meta: {},
  meter: {
    nativeLabel: labels,
  },
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
  output: {
    nativeLabel: labels,
  },
  p: {},
  param: {},
  picture: {},
  plaintext: obsolete,
  pre: {},
  progress: {
    nativeLabel: labels,
  },
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
  select: {
    nativeLabel: labels,
  },
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
  svg: {},
  table: {},
  tbody: {},
  td: {},
  template: {},
  textarea: {
    nativeLabel: labels,
  },
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

},{}],4:[function(require,module,exports){
"use strict";
exports.allowedAria = require('./allowed-aria');
exports.ariaAttributes = require('./aria-attributes');
exports.elements = require('./elements');
exports.roles = require('./roles');

},{"./allowed-aria":1,"./aria-attributes":2,"./elements":3,"./roles":5}],5:[function(require,module,exports){
"use strict";
/**
 * Rules for aria properties
 *
 * https://w3c.github.io/html-aria/
 */

/**
 * Describes an aria role
 *
 * @typedef {Object} ariaRole
 * @property {String[]} allowed
 * @property {String[]} subclass
 * @property {String[]} required Required aria properties
 * @property {Boolean} nameFromContent
 * @property {Boolean} abstract
 */

/** @enum {ariaRole} */
module.exports = {
  alert: {
    allowed: ['expanded'],
    subclass: ['alertdialog'],
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
    subclass: ['columnheader', 'gridcell', 'rowheader'],
  },
  checkbox: {
    required: ['checked'],
    nameFromContent: true,
    subclass: ['menuitemcheckbox', 'switch'],
  },
  columnheader: {
    allowed: ['sort', 'readonly', 'required', 'selected', 'expanded'],
    nameFromContent: true,
  },
  combobox: {
    required: ['expanded'],
    allowed: ['autocomplete', 'required', 'activedescendant'],
  },
  command: {
    abstract: true,
    subclass: ['button', 'link', 'menuitem'],
  },
  complementary: {
    allowed: ['expanded'],
  },
  composite: {
    abstract: true,
    subclass: ['grid', 'select', 'spinbutton', 'tablist'],
  },
  contentinfo: {
    allowed: ['expanded'],
  },
  definition: {
    allowed: ['expanded'],
  },
  dialog: {
    allowed: ['expanded'],
    subclass: ['alertdialog'],
  },
  directory: {
    allowed: ['expanded'],
  },
  document: {
    allowed: ['expanded'],
    subclass: ['article'],
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
    subclass: ['treegrid'],
  },
  gridcell: {
    allowed: ['readonly', 'required', 'selected', 'expanded'],
    nameFromContent: true,
    subclass: ['columnheader', 'rowheader'],
  },
  group: {
    allowed: ['activedescendant', 'expanded'],
    subclass: ['row', 'select', 'toolbar'],
  },
  heading: {
    allowed: ['level', 'expanded'],
    nameFromContent: true,
  },
  img: {
    allowed: ['expanded'],
  },
  input: {
    abstract: true,
    subclass: ['checkbox', 'option', 'radio', 'slider', 'spinbutton', 'textbox'],
  },
  landmark: {
    abstract: true,
    subclass: ['banner', 'complementary', 'contentinfo', 'form', 'main', 'navigation', 'region', 'search'],
  },
  link: {
    allowed: ['expanded'],
    nameFromContent: true,
  },
  list: {
    allowed: ['expanded'],
    subclass: ['directory', 'feed'],
  },
  listbox: {
    allowed: ['multiselectable', 'required', 'expanded', 'activedescendant', 'expanded'],
  },
  listitem: {
    allowed: ['level', 'posinset', 'setsize', 'expanded'],
    subclass: ['treeitem'],
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
    subclass: ['menubar'],
  },
  menubar: {
    allowed: ['activedescendant'],
  },
  menuitem: {
    nameFromContent: true,
    subclass: ['menuitemcheckbox'],
  },
  menuitemcheckbox: {
    required: ['checked'],
    nameFromContent: true,
    subclass: ['menuitemradio'],
  },
  menuitemradio: {
    required: ['checked'],
    allowed: ['posinset', 'selected', 'setsize'],
    nameFromContent: true,
  },
  navigation: {
    allowed: ['expanded'],
  },
  none: {},
  note: {
    allowed: ['expanded'],
  },
  option: {
    allowed: ['checked', 'posinset', 'selected', 'setsize'],
    nameFromContent: true,
    subclass: ['treeitem'],
  },
  presentation: {},
  progressbar: {
    allowed: ['valuemax', 'valuemin', 'valuenow', 'valuetext'],
  },
  radio: {
    required: ['checked'],
    allowed: ['posinset', 'selected', 'setsize'],
    nameFromContent: true,
    subclass: ['menuitemradio'],
  },
  radiogroup: {
    allowed: ['required', 'activedescendant', 'expanded'],
  },
  range: {
    abstract: true,
    subclass: ['progressbar', 'scrollbar', 'slider', 'spinbutton'],
  },
  region: {
    allowed: ['expanded'],
  },
  roletype: {
    abstract: true,
    subclass: ['structure', 'widget', 'window'],
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
  section: {
    abstract: true,
    subclass: ['alert', 'cell', 'definition', 'figure', 'group', 'img', 'landmark', 'list', 'listitem', 'log', 'marquee', 'math', 'note', 'status', 'table', 'tabpanel', 'term', 'tooltip'],
  },
  sectionhead: {
    abstract: true,
    subclass: ['columnheader', 'heading', 'rowheader', 'tab'],
  },
  select: {
    abstract: true,
    subclass: ['combobox', 'listbox', 'menu', 'radiogroup', 'tree'],
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
    subclass: ['timer'],
  },
  structure: {
    abstract: true,
    subclass: ['application', 'document', 'none', 'presentation', 'rowgroup', 'section', 'sectionhead', 'separator'],
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
    subclass: ['grid'],
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
    subclass: ['searchbox'],
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
    subclass: ['treegrid'],
  },
  treegrid: {
    allowed: ['level', 'multiselecteable', 'readonly', 'activedescendant', 'expanded', 'required'],
  },
  treeitem: {
    allowed: ['level', 'posinset', 'setsize', 'expanded', 'checked', 'selected'],
  },
  widget: {
    abstract: true,
    subclass: ['command', 'composite', 'gridcell', 'input', 'range', 'row', 'separator', 'tab'],
  },
  window: {
    abstract: true,
    subclass: ['dialog'],
  },
};

},{}],6:[function(require,module,exports){
"use strict";
const Runner = require('./runner');
const Logger = require('./logger');
const Rule = require('./rules/rule');
const rules = require('./rules');
const Utils = require('./utils');
const version = require('./version');
const config = require('./config');
const Contrast = require('./utils/contrast');

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
    this.observer = new MutationObserver((mutations) => {
      // De-duplicate
      const nodes = new Set(mutations.map((record) => {
        if (record.type === 'childList') {
          return record.target;
        }
        return record.target.parentNode;
      }));
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
Linter.rules = rules;
Linter.Utils = Utils;
Linter.version = version;
Linter.colourContrast = Contrast.colourContrast;

},{"./config":4,"./logger":7,"./rules":"./rules","./rules/rule":43,"./runner":45,"./utils":51,"./utils/contrast":48,"./version":"./version"}],7:[function(require,module,exports){
"use strict";
/* eslint-disable no-console, class-methods-use-this */
module.exports = class Logger {
  log({ type, el, message, name }) {
    console[type].apply(console, [message, el, name].filter(Boolean));
  }
};

},{}],8:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const config = require('../../../config');

const checkers = {
  string(value) {
    return !value.trim() ? 'must be a non-empty string' : null;
  },

  integer(value) {
    return /^-?\d+$/.test(value) ? null : 'must be an integer';
  },

  number(value) {
    // Although not entirely clear, let us assume the number follows the html5 specification
    return /^-?(?:\d+\.\d+|\d+|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) ? null : 'must be a floating point number';
  },

  token(value, { tokens }) {
    return tokens.includes(value) ? null : `must be one of: ${tokens.join(', ')}`;
  },

  tokenlist(value, { tokens, alone }) {
    const values = value.split(/\s+/).filter(Boolean);
    const unknown = values.filter(token => !tokens.includes(token));
    if (values.length === 0) {
      return `must be one or more of: ${tokens.join(', ')}`;
    }
    if (unknown.length) {
      return `contains unknown values: ${unknown.join(', ')}`;
    }
    if (alone && values.length > 1) {
      const alones = values.filter(token => alone.includes(token));
      if (alones.length) {
        return `should only contain the following values on their own: ${alones.join(', ')}`;
      }
    }
    return null;
  },

  id(value) {
    if (!value.trim()) {
      return 'must be an element id';
    }

    if (/[ \t\n\f\r]/.test(value)) {
      return 'must not contain spaces';
    }

    return document.getElementById(value) ? null : `no element can be found with an id of ${value}`;
  },

  idlist(value) {
    if (!value.trim()) {
      return 'must be a list of one of more ids';
    }
    const missing = value.split(/\s+/).filter(id => !document.getElementById(id));
    if (!missing.length) {
      return null;
    }
    return missing.map(id => `no element can be found with an id of ${id}`);
  },
};

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return this._selector || (this._selector = Object.keys(config.ariaAttributes).map(name => `[aria-${name}]`).join(','));
  }

  test(el) {
    return Array.from(el.attributes)
      .map(attr => [attr.name, attr.value])
      .filter(([name]) => name.indexOf('aria-') === 0)
      .map(([name, value]) => [name.slice(5), value])
      .map(([name, value]) => [name, value, config.ariaAttributes[name]])
      .filter(([,, desc]) => desc)
      .map(([name, value, desc]) => [name, checkers[desc.values.type](value, desc.values)])
      .filter(([, errors]) => errors && errors.length)
      .reduce((ret, [name, errors]) => ret.concat([].concat(errors).map(message => `aria-${name} ${message}`)), []);
  }
};

},{"../../../config":4,"../../rule":43}],9:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const config = require('../../../config');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  deprecated() {
    return this._deprecated || (this._deprecated = Object.entries(config.ariaAttributes)
      .filter(([, value]) => value.deprecated)
      .map(([name]) => `aria-${name}`));
  }

  selector() {
    return this.deprecated().map(name => `[${name}]`).join(',');
  }

  test(el) {
    return Array.from(el.attributes)
      .filter(({ name }) => this.deprecated().includes(name))
      .map(({ name }) => `${name} is deprecated`);
  }
};

},{"../../../config":4,"../../rule":43}],10:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
    this.history = new WeakMap();
  }

  selector() {
    return '[role]';
  }

  test(el) {
    const role = el.getAttribute('role');
    if (this.history.has(el)) {
      if (this.history.get(el) !== role) {
        return 'an elements role must not be modified';
      }
    } else {
      this.history.set(el, role);
    }
    return null;
  }
};

},{"../../rule":43}],11:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const config = require('../../../config');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return '*';
  }

  test(el) {
    const invalid = Array.from(el.attributes)
      .map(attr => attr.name)
      .filter(name => name.indexOf('aria-') === 0)
      .map(name => name.slice(5))
      .filter(name => !Object.keys(config.ariaAttributes).includes(name));

    if (invalid.length) {
      return `element has unknown aria attribute${invalid.length > 1 ? 's' : ''}: ${invalid.map(name => `aria-${name}`).join(', ')}`;
    }

    return null;
  }
};

},{"../../../config":4,"../../rule":43}],12:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

const focusable = ['button', 'input:not([type="hidden"])', 'meter', 'output', 'progress', 'select', 'textarea', 'a[href]', 'area[href]', '[tabindex]'];

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return this._selector || (this._selector = focusable.map(selector => `${selector}[aria-hidden="true"]`).join(','));
  }

  test(el, utils) {
    if (el.nodeName.toLowerCase() === 'area' || !utils.hidden(el, { noAria: true })) {
      return 'do not mark focusable elements with `aria-hidden="true"`';
    }
    return null;
  }
};

},{"../../rule":43}],13:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return '[role="none"]';
  }

  test() {
    return 'use a role of "none presentation" to support older user-agents';
  }
};

},{"../../rule":43}],14:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const config = require('../../../config');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return '[role]';
  }

  test(el, utils) {
    const role = el.getAttribute('role').trim();
    if (!role) {
      return 'role attribute should not be empty';
    }
    let error;
    const allowed = utils.aria.allowed(el);
    role.split(/\s+/).some((name) => {
      if (!config.roles[name]) {
        error = `role "${name}" is not a known role`;
        return true;
      }

      if (config.roles[name].abstract) {
        error = `role "${name}" is an abstract role and should not be used`;
        return true;
      }

      if (allowed.implicit.includes(name)) {
        error = `role "${name}" is implicit for this element and should not be specified`;
        return true;
      }

      if (allowed.roles === '*') {
        return null;
      }

      if (!allowed.roles.includes(name)) {
        error = `role "${name}" is not allowed for this element`;
      }

      return null;
    });

    return error;
  }
};

},{"../../../config":4,"../../rule":43}],15:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

/**
 *  Check the colour contrast for all visible nodes with child text nodes
 */
module.exports = class extends Rule {
  setDefaults() {
    this.enabled = false;
    this.min = 4.5;
    this.minLarge = 3;
  }

  run(context, filter = () => true, utils) {
    return this.iterate(context, utils, false)
      .filter(filter)
      .map(el => this.findAncestor(el, utils))
      .reduce((ar, el) => (ar.includes(el) ? ar : (ar.push(el), ar)), []) // Unique
      .filter(filter)
      .map(el => [el, this.test(el, utils)])
      .filter(([, ratio]) => ratio)
      .map(([el, ratio]) => this.message(el, ratio));
  }

  iterate(node, utils, iterateSiblings) {
    const found = [];
    let cursor = node;
    while (cursor) {
      if (utils.hidden(cursor, { noAria: true })) {
        break;
      }

      if (this.hasTextNode(cursor)) {
        found.push(cursor);
      }

      if (cursor.firstElementChild) {
        found.push.apply(found, this.iterate(cursor.firstElementChild, utils, true));
      }

      if (iterateSiblings) {
        cursor = cursor.nextElementSibling;
      } else {
        cursor = null;
      }
    }

    return found;
  }

  // Does the element have a text node with content
  hasTextNode(el) {
    return Array.from(el.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .some(node => node.data.trim());
  }

  // Find the last ancestor or self with the same colours
  findAncestor(el, utils) {
    const colour = utils.contrast.textColour(el);
    const backgroundColour = utils.contrast.backgroundColour(el);

    let cursor = el;
    while (cursor.parentNode !== document) {
      const parent = cursor.parentNode;
      if (utils.contrast.textColour(parent) !== colour
        && utils.contrast.backgroundColour(parent) !== backgroundColour) {
        break;
      }
      cursor = parent;
    }

    return cursor;
  }

  // Does the element meet AAA or AA standards
  test(el, utils) {
    const ratio = parseFloat(utils.contrast.textContrast(el).toFixed(2));

    if (ratio >= this.min) {
      return null;
    }

    const fontSize = parseFloat(utils.style(el, 'fontSize'));
    const large = fontSize >= 24 /* 18pt */ || (fontSize >= 18.66 /* 14pt */ && utils.style(el, 'fontWeight') >= 700);

    if (large && ratio >= this.minLarge) {
      return null;
    }

    return ratio;
  }

  message(el, ratio) {
    return { el, message: `contrast is too low ${parseFloat(ratio.toFixed(2))}:1`, type: this.type };
  }
};

},{"../../rule":43}],16:[function(require,module,exports){
"use strict";
const ColourContrastAARule = require('../aa/rule.js');

module.exports = class extends ColourContrastAARule {
  setDefaults() {
    this.min = 7;
    this.minLarge = 4.5;
    this.type = 'warn';
    this.enabled = false;
  }
};

},{"../aa/rule.js":15}],17:[function(require,module,exports){
"use strict";
const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return '[data],[data-]';
  }

  test() {
    return 'data is an attribute prefix';
  }
};

},{"../rule":43}],18:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const config = require('../../../config');

module.exports = class extends Rule {
  selector() {
    return this._selector || (this._selector = Object.keys(config.elements).filter(el => config.elements[el].obsolete).join(','));
  }

  test() {
    return 'do not use obsolete elements';
  }
};

},{"../../../config":4,"../../rule":43}],19:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const config = require('../../../config');

module.exports = class extends Rule {
  selector() {
    return this._selector || (this._selector = Object.keys(config.elements).map(name => `:not(${name})`).join(''));
  }

  test() {
    return 'unknown element';
  }
};

},{"../../../config":4,"../../rule":43}],20:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'fieldset';
  }

  test(el) {
    const first = el.firstElementChild;
    if (first && first.matches('legend')) {
      return null;
    }
    return 'All fieldsets must have a legend';
  }
};

},{"../../rule":43}],21:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return ':not(fieldset)>legend,fieldset>legend:not(:first-child)';
  }

  test() {
    return 'All legends must be the first child of a fieldset';
  }
};

},{"../../rule":43}],22:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'input[name]:not([type=hidden]),textarea[name],select[name]';
  }

  test(el, utils) {
    let group;

    if (el.form) {
      const elements = el.form.elements[el.name];
      if (elements instanceof Node) {
        return null;
      }
      group = Array.from(elements).filter(elm => elm.type !== 'hidden');
    } else {
      const namePart = `[name="${utils.cssEscape(el.name)}"]`;
      group = utils.$$(`input${namePart}:not([type=hidden]),textarea${namePart},select${namePart}`).filter(elm => !elm.form);
    }

    if (group.length === 1 || el.closest('fieldset')) {
      return null;
    }

    return 'Multiple inputs with the same name should be in a fieldset';
  }
};

},{"../../rule":43}],23:[function(require,module,exports){
"use strict";
const Rule = require('../rule');

const allowed = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

function previous(el) {
  let cursor = el.previousElementSibling;
  while (cursor && cursor.lastElementChild) {
    cursor = cursor.lastElementChild;
  }
  return cursor;
}

module.exports = class extends Rule {
  selector() {
    return 'h2,h3,h4,h5,h6';
  }

  test(el) {
    let cursor = el;
    const level = +el.nodeName[1];
    do {
      cursor = previous(cursor) || cursor.parentElement;
      if (cursor && cursor.matches(allowed.join())) {
        if (cursor.matches(allowed.slice(level - 2).join(','))) {
          return null;
        }
        break;
      }
    } while (cursor);
    return 'Headings must be nested correctly';
  }
};

},{"../rule":43}],24:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return 'map';
  }

  test(el, utils) {
    if (!el.name) {
      return 'map elements should have a name';
    }

    const name = el.name.toLowerCase();
    const mapNames = utils.$$('map[name]').map(map => map.name.toLowerCase());
    if (mapNames.filter(item => item === name).length > 1) {
      return 'map element names must be case-insensitively unique';
    }

    const imgUseMaps = utils.$$('img[usemap]').map(img => img.useMap.toLowerCase());
    if (!imgUseMaps.includes(`#${name}`)) {
      return 'map elements should be referenced by an img usemap attribute';
    }

    return null;
  }
};

},{"../../rule":43}],25:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'label';
  }

  test(el) {
    if (el.htmlFor && document.getElementById(el.htmlFor)) {
      return null;
    }
    return 'all labels must be linked to a control';
  }
};

},{"../../rule":43}],26:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'input[list]';
  }

  test(el, utils) {
    const listId = el.getAttribute('list');
    if (listId && utils.$(`datalist[id="${utils.cssEscape(listId)}"]`)) {
      return null;
    }
    return 'no datalist found';
  }
};

},{"../../rule":43}],27:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return 'a[name]';
  }

  test(el, utils) {
    if (!el.name) {
      return 'name should not be empty';
    }
    if (el.id && el.id !== el.name) {
      return 'if the id attribute is present it must equal the name attribute';
    }
    const id = utils.cssEscape(el.name);
    if (id && utils.$$(`a[name="${id}"],[id="${id}"]`).length > 1) {
      return 'name is not unique';
    }
    return null;
  }
};

},{"../../rule":43}],28:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

const rSpace = /[ \t\n\f\r]/;

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return '[id]';
  }

  test(el, utils) {
    if (!el.id) {
      return 'id should not be empty';
    }
    if (rSpace.test(el.id)) {
      return 'id should not contain space characters';
    }
    if (!el.id || utils.$$(`[id="${utils.cssEscape(el.id)}"]`).length > 1) {
      return 'id is not unique';
    }
    return null;
  }
};

},{"../../rule":43}],29:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return 'area[href]';
  }

  test(el, utils) {
    const map = el.closest('map');
    if (!map || !map.name) {
      return null;
    }
    const img = utils.$(`img[usemap="#${utils.cssEscape(map.name)}"]`);
    if (!img || utils.hidden(img)) {
      return null;
    }
    if (el.alt) {
      return null;
    }
    return 'area with a href must have a label';
  }
};

},{"../../rule":43}],30:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return '[role="button"],[role="link"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]';
  }

  test(el, utils) {
    if (utils.accessibleName(el)) {
      return null;
    }
    return 'elements with a role with a superclass of command must have a label';
  }
};

},{"../../rule":43}],31:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'button,input:not([type="hidden"]),meter,output,progress,select,textarea';
  }

  test(el, utils) {
    if (utils.accessibleName(el)) {
      return null;
    }
    return 'form controls must have a label';
  }
};

},{"../../rule":43}],32:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'h1,h2,h3,h4,h5,h6,[role="heading"]';
  }

  test(el, utils) {
    if (utils.accessibleName(el)) {
      return null;
    }
    return 'headings must have a label';
  }
};

},{"../../rule":43}],33:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return 'img:not([alt])';
  }

  test() {
    return 'missing alt attribute';
  }
};

},{"../../rule":43}],34:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'a[href]';
  }

  test(el, utils) {
    if (utils.accessibleName(el)) {
      return null;
    }
    return 'links with a href must have a label';
  }
};

},{"../../rule":43}],35:[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return '[tabindex]';
  }

  test(el, utils) {
    if (utils.accessibleName(el)) {
      return null;
    }
    return 'focusable elements must have a label';
  }
};

},{"../../rule":43}],36:[function(require,module,exports){
"use strict";
const Rule = require('../rule');

// Language tags are defined in http://www.ietf.org/rfc/bcp/bcp47.txt
const match = /^((en-gb-oed)|([a-z]{2,3}(-[a-z]{3})?(-[a-z]{4})?(-[a-z]{2}|-\d{3})?(-[a-z0-9]{5,8}|-(\d[a-z0-9]{3}))*))$/i;

module.exports = class extends Rule {
  defaultSettings() {
    this.includeHidden = true;
  }

  selector() {
    return 'html';
  }

  test(el) {
    if (!el.lang) {
      return 'missing lang attribute';
    }
    if (!match.test(el.lang)) {
      return 'language code is invalid';
    }
    return null;
  }
};

},{"../rule":43}],37:[function(require,module,exports){
"use strict";
const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'button:not([type])';
  }

  test() {
    return 'all buttons should have a type attribute';
  }
};

},{"../rule":43}],38:[function(require,module,exports){
"use strict";
const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'select';
  }

  test(el, utils) {
    if (utils.$$('option', el).length) {
      return null;
    }
    return 'selects should have options';
  }
};

},{"../rule":43}],39:[function(require,module,exports){
"use strict";
const Rule = require('../rule');

function removeHash(ob) {
  return ob.href.replace(/#.*$/, '');
}

module.exports = class extends Rule {
  selector() {
    return 'a[href*="#"]';
  }

  test(el, utils) {
    if (removeHash(window.location) !== removeHash(el)) {
      return null;
    }
    const id = utils.cssEscape(decodeURI(el.hash.slice(1)));
    if (utils.$(`[id="${id}"],a[name="${id}"]`)) {
      return null;
    }

    return 'fragment not found in document';
  }
};

},{"../rule":43}],40:[function(require,module,exports){
"use strict";
const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'select[multiple]';
  }

  test() {
    return 'do not use multiple selects';
  }
};

},{"../rule":43}],41:[function(require,module,exports){
"use strict";
const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'input,textarea,select,button:not([type]),button[type="submit"],button[type="reset"]';
  }

  test(el) {
    if (el.form) {
      return null;
    }
    return 'all controls should be associated with a form';
  }
};

},{"../rule":43}],42:[function(require,module,exports){
"use strict";
const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'input[type=reset],button[type=reset]';
  }

  test() {
    return 'do not use reset buttons';
  }
};

},{"../rule":43}],43:[function(require,module,exports){
"use strict";
module.exports = class Rule {
  constructor(settings) {
    this.includeHidden = false;
    this.type = 'error';
    this.enabled = true;
    this.setDefaults();
    Object.assign(this, settings);
  }

  /**
   * Set any default properties on the rule before the settings are merged in
   */
  setDefaults() {
    // Nothing to do here
  }

  /**
   * Run the rule
   * @param {Element} [context=document] The element to run the rule against
   * @param {Function} filter A filter to remove elements that don't need to be tested
   * @param {Object} caches Utility caches
   * @returns {String|String[]|null} Zero or more error messages
   */
  run(context, filter = () => true, utils) {
    return this.select(context, utils)
      .filter(filter)
      .filter(el => (this.includeHidden ? true : !utils.hidden(el)))
      .map(el => [el, this.test(el, utils)])
      .reduce((errors, [el, messages]) => (
        errors.concat([].concat(messages)
          .filter(Boolean)
          .map(message => ({ el, message, type: this.type }))
        )
      ), []);
  }

  /**
   * Select elements potentially breaking the rule
   */
  select(context, utils) {
    return utils.$$(this.selector(), context);
  }

  /**
   * The selector to select invalid elements
   */
  selector() { // eslint-disable-line class-methods-use-this
    throw new Error('not implemented');
  }

  /**
   * Test if an element is invalid
   * @param {Element} el The element to test
   * @param {Object} utils Utilities
   * @returns {String|String[]|null} Zero or more error messages
   */
  test(el, utils) { // eslint-disable-line no-unused-vars
    throw new Error('not implemented');
  }
};

},{}],44:[function(require,module,exports){
"use strict";
const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'html';
  }

  test() {
    if (document.title.trim()) {
      return null;
    }
    return 'document must have a title';
  }
};

},{"../rule":43}],45:[function(require,module,exports){
"use strict";
const Utils = require('./utils');

const addToSetArray = (set, key, value) => set.set(key, (set.get(key) || []).concat(value));
const isInSetArray = (set, key, value) => (set.get(key) || []).includes(value);

module.exports = class Runner {
  constructor(config) {
    const globalSettings = {};
    if (config.defaultOff) {
      globalSettings.enabled = false;
    }

    this.cacheReported = config.cacheReported !== false;
    this.ruleSettings = config.ruleSettings || {};

    this.rules = new Map(Array.from(config.rules)
      .map(([name, Rule]) => [
        name,
        new Rule(Object.assign({ name }, globalSettings, this.ruleSettings[name])),
      ])
    );

    this.ignoreAttribute = config.ignoreAttribute || 'data-accessibility-linter-ignore';

    this.whitelist = config.whitelist;
    this.logger = config.logger;

    this.reported = new WeakMap();
    this.whitelisted = new WeakMap();
    this.ignored = new WeakMap();

    this.utils = null;
  }

  /**
   * Run all the rules
   * @param {HTMLElement} [context] A context to run the rules within
   */
  run(context) {
    this.utils = new Utils();
    this.rules.forEach((rule) => {
      if (rule.enabled) {
        this.runInternal(rule, context, (el, name) => this.filter(el, name, false));
      }
    });
    this.utils = null;
  }

  /**
   * Run one rule regardless of it being enabled
   * @name {String|Rule} rule A rule or name of a rule
   * @param {HTMLElement} [context] A context
   * @param {String} [whitelist] Optionally a whitelist
   */
  runRule(rule, context, whitelist) {
    if (typeof rule === 'string') {
      rule = this.rules.get(rule);
    }
    this.utils = new Utils();
    const oldWhitelist = this.whitelist;
    if (typeof whitelist === 'string') {
      this.whitelist = whitelist;
    }
    this.runInternal(rule, context, (el, name) => this.filter(el, name, true));
    this.utils = null;
    this.whitelist = oldWhitelist;
  }

  /**
   * Filter if the element has already reported on this rule or is excluded from this rule
   * @private
   */
  filter(el, name, includeReported) {
    return this.notWhitelisted(el, name)
      && this.notIgnored(el, name)
      && (includeReported || this.notReported(el, name));
  }

  /**
   * Run a single rule
   * @private
   */
  runInternal(rule, context, filter) {
    rule.run(context, el => filter(el, rule.name), this.utils)
      .forEach((issue) => {
        if (this.cacheReported) {
          addToSetArray(this.reported, issue.el, rule.name);
        }
        this.logger.log(Object.assign({ name: rule.name }, issue));
      });
  }

  /**
   * Has this already been reported for this element
   * @private
   */
  notReported(el, name) {
    return !isInSetArray(this.reported, el, name);
  }

  /**
   * Is this element excluded by a whitelist
   * @private
   */
  notWhitelisted(el, name) {
    if (isInSetArray(this.whitelisted, el, name)) {
      return false;
    }
    const globalWhitelist = this.whitelist;
    const whitelist = this.ruleSettings[name] && this.ruleSettings[name].whitelist;
    const isWhitelisted = (globalWhitelist && el.matches(globalWhitelist)) ||
      (whitelist && el.matches(whitelist));

    if (isWhitelisted) {
      if (this.cacheReported) {
        addToSetArray(this.whitelisted, el, name);
      }
      return false;
    }
    return true;
  }

  /**
   * Is this element excluded by an attribute
   * @private
   */
  notIgnored(el, ruleName) {
    if (isInSetArray(this.ignored, el, ruleName)) {
      return false;
    }

    const ignore = el.matches(
      `[${this.ignoreAttribute}=""],[${this.ignoreAttribute}~="${this.utils.cssEscape(ruleName)}"]`
    );

    if (ignore) {
      if (this.cacheReported) {
        addToSetArray(this.ignored, el, ruleName);
      }
      return false;
    }

    return true;
  }
};

},{"./utils":51}],46:[function(require,module,exports){
"use strict";
/**
 *  Data and functions for aria validation.  Based on
 *  - https://www.w3.org/TR/wai-aria-1.1/
 *  - https://www.w3.org/TR/html52/
 */
const config = require('../config');

/**
 * All roles
 * @type {Object[]}
 */
const allowed = exports.allowed = (el) => {
  const name = el.nodeName.toLowerCase();
  let found = config.allowedAria[name];
  if (Array.isArray(found)) {
    found = found.find(item => item.selector === '*' || el.matches(item.selector));
  }
  return found || config.allowedAria._default;
};

/**
 * Get the elements current role based on the role attribute or implicit role
 * @param {Element} el
 * @returns {String|null}
 */
exports.getRole = (el) => {
  let role = null;
  // Should be the first non-abstract role in the list
  if ((el.getAttribute('role') || '').split(/\s+/).some((name) => {
    if (config.roles[name] && !config.roles[name].abstract) {
      role = name;
      return true;
    }
    return false;
  })) {
    return role;
  }
  return allowed(el).implicit[0] || null;
};

/**
 * Does an element have a role. This will test against abstract roles
 * @param {Element|String} target
 * @param {String} name
 * @returns {Boolean}
 */
exports.hasRole = (target, name) => {
  const actualRole = target instanceof Element ? exports.getRole(target) : target;
  if (!actualRole) {
    return false;
  }
  return [name].some(function hasRole(checkRole) {
    if (checkRole === actualRole) {
      return true;
    }
    return (config.roles[checkRole].subclass || []).some(hasRole);
  });
};

},{"../config":4}],47:[function(require,module,exports){
"use strict";
/**
 * Caching for element values
 */
/* eslint-disable class-methods-use-this */

function getOrSet(cache, key, setter) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const value = setter();
  cache.set(key, value);
  return value;
}

module.exports = class Cache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate a key from the options supplied to key
   */
  key(el, key) {
    return key;
  }

  setter() {
    throw new Error('unimplemented');
  }

  /**
   *  Get a value
   *  @param {Object} el A key to cache against
   */
  get(el) {
    const optionsKey = this.key.apply(this, arguments);
    const cache = getOrSet(this.cache, optionsKey, () => new WeakMap());
    return getOrSet(cache, el, () => this.setter.apply(this, arguments));
  }
};

},{}],48:[function(require,module,exports){
"use strict";
// Luminosity calculation
/* eslint-disable class-methods-use-this */

function gamma(value) {
  const n = value / 255;
  // eslint-disable-next-line no-restricted-properties
  return n <= 0.03928 ? n / 12.92 : Math.pow(((n + 0.055) / 1.055), 2.4);
}

// Create a canvas for blending colours
let _context;
function getCanvasContext() {
  if (_context) {
    return _context;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  _context = canvas.getContext('2d');
  return _context;
}

function blend(colours) {
  const context = getCanvasContext();
  context.clearRect(0, 0, 1, 1);
  colours.reverse().forEach((colour) => {
    context.fillStyle = `rgba(${colour.join(',')})`;
    context.fillRect(0, 0, 1, 1);
  });
  const colour = Array.from(context.getImageData(0, 0, 1, 1).data);
  colour[3] /= 255;
  return colour;
}

function luminosity(r, g, b) {
  // https://en.wikipedia.org/wiki/Relative_luminance
  return (0.2126 * gamma(r)) + (0.7152 * gamma(g)) + (0.0722 * gamma(b));
}

function contrastRatio(l1, l2) {
  // https://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
  if (l1 < l2) {
    [l2, l1] = [l1, l2];
  }
  return (l1 + 0.05) / (l2 + 0.05);
}

// Convert a CSS colour to an array of RGBA values
function toRgbaArray(style) {
  const el = document.createElement('div');
  el.style.color = style;
  const value = window.getComputedStyle(el).color;
  return colourParts(value); // eslint-disable-line no-use-before-define
}

/**
 * Given a colour in rgba or rgb format, get its parts
 * The parts should be in the range 0 to 1
 */
function colourParts(colour) {
  if (colour === 'transparent') {
    return [0, 0, 0, 0];
  }
  const match = colour.match(/^rgba?\((\d+), *(\d+), *(\d+)(?:, *(\d+(?:\.\d+)?))?\)$/);
  if (match) {
    return [+match[1], +match[2], +match[3], parseFloat(match[4]) || 1];
  }
  return toRgbaArray(colour);
}

module.exports = class Contrast {
  constructor(styleCache) {
    this.styleCache = styleCache;
  }

  textContrast(el) {
    return contrastRatio(this._textLuminosity(el), this._backgroundLuminosity(el));
  }

  _blendWithBackground(colour, el) {
    if (colour[3] === 1) {
      return colour;
    }
    const colourStack = [colour];
    let cursor = el;
    let currentColour = colour;
    do {
      let background;
      if (cursor === document) {
        // I assume this is always the case?
        background = [255, 255, 255, 1];
      } else {
        background = colourParts(this.styleCache.get(cursor, 'backgroundColor'));
      }
      currentColour = background;
      if (currentColour[3] !== 0) {
        colourStack.push(currentColour);
      }
    } while (currentColour[3] !== 1 && (cursor = cursor.parentNode));
    return blend(colourStack);
  }

  textColour(el) {
    const colour = colourParts(this.styleCache.get(el, 'color'));
    return this._blendWithBackground(colour, el);
  }

  backgroundColour(el) {
    return this._blendWithBackground([0, 0, 0, 0], el);
  }

  _textLuminosity(el) {
    return luminosity.apply(null, this.textColour(el));
  }

  _backgroundLuminosity(el) {
    return luminosity.apply(null, this.backgroundColour(el));
  }

  /**
   * The contrast between two colours
   */
  static colourContrast(foreground, background) {
    foreground = colourParts(foreground);
    background = colourParts(background);
    if (background[3] !== 1) {
      background = blend([background, [255, 255, 255, 1]]);
    }
    if (foreground[3] !== 1) {
      foreground = blend([foreground, background]);
    }
    return contrastRatio(
      luminosity.apply(null, foreground),
      luminosity.apply(null, background)
    );
  }
};

// The following are exposed for unit testing
module.exports.prototype._blend = blend;
module.exports.prototype._luminosity = luminosity;
module.exports.prototype._colourParts = colourParts;
module.exports.prototype._contrastRatio = contrastRatio;

},{}],49:[function(require,module,exports){
"use strict";
module.exports = function cssEscape(name) {
  return name.replace(/["\\]/g, '\\$&');
};

},{}],50:[function(require,module,exports){
"use strict";
/**
 *  Determine if an element is hidden or not
 */
/* eslint-disable class-methods-use-this */

const Cache = require('./cache');

// Is the element hidden using CSS
function cssHidden(el, style) {
  return style.get(el, 'visibility') !== 'visible' || style.get(el, 'display') === 'none';
}

// Is the element hidden from accessibility software
function hidden(el, style, noAria = false) {
  if (el === document) {
    return false;
  }
  return (!noAria && el.getAttribute('aria-hidden') === 'true')
    || el.getClientRects().length === 0
    || (!noAria && !!el.closest('[aria-hidden=true]'))
    || cssHidden(el, style);
}

/**
 *  Cache of hidden element
 */
module.exports = class HiddenCache extends Cache {
  constructor(style) {
    super();
    this.style = style;
  }

  key(el, { noAria = false } = {}) {
    return noAria;
  }

  setter(el, { noAria = false } = {}) {
    return hidden(el, this.style, noAria);
  }
};

},{"./cache":47}],51:[function(require,module,exports){
"use strict";
const { $, $$ } = require('./selectors');
const { accessibleName, accessibleDescription } = require('./name');
const aria = require('./aria');
const Contrast = require('./contrast');
const cssEscape = require('./cssEscape');
const HiddenCache = require('./hidden-cache');
const StyleCache = require('./style-cache');

const getOrSet = (cache, el, setter) => {
  if (cache.has(el)) {
    return cache.get(el);
  }

  const value = setter();
  cache.set(el, value);
  return value;
};

/**
 * Helpers functions
 */
const Utils = class Utils {
  constructor() {
    this.styleCache = new StyleCache();
    this.hiddenCache = new HiddenCache(this.styleCache);
    this.nameCache = new WeakMap();
    this.descriptionCache = new WeakMap();
    this.contrast = new Contrast(this.styleCache);
  }

  hidden(el, options) {
    return this.hiddenCache.get(el, options);
  }

  style(el, name, pseudo) {
    return this.styleCache.get(el, name, pseudo);
  }

  accessibleName(el) {
    return getOrSet(
      this.nameCache,
      el,
      () => accessibleName(el, Object.assign({ utils: this }))
    );
  }

  accessibleDescription(el) {
    return getOrSet(
      this.nameCache,
      el,
      () => accessibleDescription(el, Object.assign({ utils: this }))
    );
  }
};

Utils.prototype.$ = $;
Utils.prototype.$$ = $$;
Utils.prototype.aria = aria;
Utils.prototype.cssEscape = cssEscape;

module.exports = Utils;

},{"./aria":46,"./contrast":48,"./cssEscape":49,"./hidden-cache":50,"./name":52,"./selectors":53,"./style-cache":54}],52:[function(require,module,exports){
"use strict";
// An implementation of the text alternative computation
// https://www.w3.org/TR/accname-aam-1.1/#mapping_additional_nd_te
const { $, $$ } = require('./selectors');
const config = require('../config');
const { getRole, hasRole } = require('./aria');

const nameFromContentRoles = Object.keys(config.roles)
  .filter(name => config.roles[name].nameFromContent);
const controlRoles = ['textbox', 'combobox', 'listbox', 'range'];

class AccessibleName {
  constructor(el, options = {}) {
    this.el = el;
    this.recursion = !!options.recursion;
    this.allowHidden = !!options.allowHidden;
    this.includeHidden = !!options.includeHidden;
    this.noAriaBy = !!options.noAriaBy;
    this.history = options.history || [];
    this.isWithinWidget = 'isWithinWidget' in options ? options.isWithinWidget : hasRole(this.role, 'widget');
    this.utils = options.utils;

    this.sequence = [
      () => this.hidden(),
      () => this.ariaBy(),
      () => this.embedded(),
      () => this.ariaLabel(),
      () => this.native(),
      () => this.loop(),
      () => this.dom(),
      () => this.tooltip(),
    ];
  }

  get role() {
    return this._role || (this._role = getRole(this.el));
  }

  get nodeName() {
    return this._nodeName || (this._nodeName = this.el.nodeName.toLowerCase());
  }

  build() {
    let text = '';
    this.sequence.some(fn => (text = fn()) != null);

    text = text || '';

    if (!this.recursion) {
      // To a flat string
      text = text.trim().replace(/\s+/g, ' ');
    }

    return text;
  }

  loop() {
    return this.history.includes(this.el) ? '' : null;
  }

  hidden() {
    if (this.includeHidden) {
      return null;
    }
    const isHidden = this.utils.hidden(this.el);
    if (this.allowHidden && isHidden) {
      this.includeHidden = true;
      return null;
    }
    return isHidden ? '' : null;
  }

  ariaBy(attr = 'aria-labelledby') {
    if (this.noAriaBy) {
      return null;
    }

    const ids = this.el.getAttribute(attr) || '';
    if (ids) {
      return ids.trim().split(/\s+/)
        .map(id => document.getElementById(id))
        .filter(Boolean)
        .map(elm => this.recurse(elm, { allowHidden: true, noAriaBy: attr === 'aria-labelledby' }))
        .filter(Boolean)
        .join(' ');
    }

    return null;
  }

  ariaLabel() {
    return this.el.getAttribute('aria-label') || null;
  }

  native(prop = 'nativeLabel') {
    if (['none', 'presentation'].includes(this.role)) {
      return null;
    }

    const element = config.elements[this.nodeName];
    if (element && element[prop]) {
      const value = element[prop](this.el);
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value)) {
        return value
          .filter(Boolean)
          .map(elm => this.recurse(elm, { allowHidden: true }))
          .join(' ') || null;
      }
    }
    return null;
  }

  embedded() {
    const useEmbeddedName = this.isWithinWidget
      && this.recursion
      && controlRoles.some(name => hasRole(this.role, name));

    if (!useEmbeddedName) {
      return null;
    }

    const { el, role } = this;

    if (['input', 'textarea'].includes(this.nodeName) && !hasRole(role, 'button')) {
      return el.value;
    }

    if (this.nodeName === 'select') {
      return Array.from(this.el.selectedOptions)
        .map(option => option.value)
        .join(' ');
    }

    if (hasRole(role, 'textbox')) {
      return el.textContent;
    }

    if (hasRole(role, 'combobox')) {
      const input = $('input', el);
      if (input) {
        return input.value;
      }
      return '';
    }

    if (hasRole(role, 'listbox')) {
      return $$('[aria-selected="true"]', el)
        .map(elm => this.recurse(elm))
        .join(' ');
    }

    if (hasRole(role, 'range')) {
      return el.getAttribute('aria-valuetext') || el.getAttribute('aria-valuenow') || '';
    }

    return null;
  }

  // Find the label from the dom
  dom() {
    if (!this.recursion && !nameFromContentRoles.includes(this.role)) {
      return null;
    }

    return Array.from(this.el.childNodes)
      .map((node) => {
        if (node instanceof Text) {
          return node.textContent;
        }
        if (node instanceof Element) {
          return this.recurse(node);
        }
        return null;
      })
      .filter(Boolean)
      .join('') || null;
  }

  // Find a tooltip label
  tooltip() {
    return this.el.title || null;
  }

  recurse(el, options = {}) {
    return new this.constructor(el, Object.assign({
      history: this.history.concat(this.el),
      includeHidden: this.includeHidden,
      noAriaBy: this.noAriaBy,
      recursion: true,
      isWithinWidget: this.isWithinWidget,
      utils: this.utils,
    }, options)).build();
  }
}

class AccessibleDescription extends AccessibleName {
  constructor(el, options) {
    super(el, options);

    this.sequence.unshift(() => this.describedBy());
  }

  describedBy() {
    if (this.recursion) {
      return null;
    }

    if (this.utils.hidden(this.el)) {
      return '';
    }

    const ariaBy = this.ariaBy('aria-describedby');
    if (ariaBy !== null) {
      return ariaBy;
    }

    return this.native('nativeDescription') || '';
  }
}

exports.accessibleName = (el, options) => new AccessibleName(el, options).build();
exports.accessibleDescription = (el, options) => new AccessibleDescription(el, options).build();

},{"../config":4,"./aria":46,"./selectors":53}],53:[function(require,module,exports){
"use strict";
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

},{}],54:[function(require,module,exports){
"use strict";
/**
 * A cache of computed style properties
 */
/* eslint-disable class-methods-use-this */
const Cache = require('./cache');

function getStyle(el, name, pseudo) {
  return window.getComputedStyle(el, pseudo ? `::${pseudo}` : null)[name];
}

module.exports = class StyleCache extends Cache {
  key(el, name, pseudo) {
    return `${name}~${pseudo}`;
  }

  setter(el, name, pseudo) {
    return getStyle(el, name, pseudo);
  }
};

},{"./cache":47}]},{},["./rules","./version",6])(6)
});
//# sourceMappingURL=umd.js.map
