(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AccessibilityLinter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./rules/aria/allowed-attributes/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule.js');

const disableable = ['input', 'button', 'select', 'optgroup', 'textarea', 'fieldset']; // option does not need to be included
const placeholderable = ['input', 'textarea'];
const requireable = ['input', 'select', 'textarea'];
const readonlyable = ['text', 'url', 'email'];

function hasContentEditable(el) {
  return el.contentEditable === 'true' || (((el.closest('[contenteditable]') || {}).contentEditable === 'true'));
}

module.exports = class extends Rule {
  selector() {
    return '*';
  }

  test(el, utils) {
    let ariaAttributes = Array.from(el.attributes)
      .filter(({ name }) => name.startsWith('aria-'))
      .map(({ name }) => name.slice(5));

    if (!ariaAttributes.length) {
      return null;
    }

    const allowed = utils.aria.allowed(el);
    const errors = [];

    ariaAttributes = ariaAttributes.filter((name) => {
      if (!utils.config.ariaAttributes[name]) {
        errors.push(`aria-${name} is not a known aria attribute`);
        return false;
      }
      return true;
    });

    if (allowed.noAria) {
      errors.push(`no aria attributes are allowed on element. Found ${ariaAttributes.map(name => `aria-${name}`).join(', ')}`);
      return errors;
    }

    const role = utils.aria.getRole(el, allowed);

    if (['none', 'presentation'].includes(role)) {
      errors.push(`no aria attributes should be added for a role of ${role}. Found ${ariaAttributes.map(name => `aria-${name}`).join(', ')}`);
      return errors;
    }

    const nodeName = el.nodeName.toLowerCase();

    if (ariaAttributes.includes('disabled') && disableable.includes(nodeName)) {
      errors.push('do not include aria-disabled on elements with a native disabled attribute');
    }

    if (ariaAttributes.includes('hidden') && el.hidden) {
      errors.push('do not include aria-hidden on elements with a hidden attribute');
    }

    // filter global
    ariaAttributes = ariaAttributes
      .filter(name => !(utils.config.ariaAttributes[name] || {}).global);

    // filter disallowed
    const allowsRoleAttributes = allowed.roles === '*'
      || allowed.roles.includes(role)
      || (allowed.ariaForImplicit && allowed.implicit.includes(role));
    const roleConfig = utils.config.roles[role];
    ariaAttributes = ariaAttributes
      .filter((name) => {
        if (allowsRoleAttributes && roleConfig && roleConfig.allowed.includes(name)) {
          return true;
        }
        errors.push(`aria-${name} is not allowed on this element`);
        return false;
      });

    if (ariaAttributes.includes('readonly')) {
      if (el.getAttribute('aria-readonly') === 'true' && hasContentEditable(el)) {
        errors.push('do not include aria-readonly="true" on elements with contenteditable');
      }

      if (nodeName === 'textarea' || (nodeName === 'input' && readonlyable.includes(el.type))) {
        errors.push('do not include aria-readonly on elements with a native readonly attribute');
      }
    }

    if (ariaAttributes.includes('placeholder') && placeholderable.includes(nodeName)) {
      errors.push('do not include aria-placeholder on elements with a native placeholder attribute');
    }

    if (ariaAttributes.includes('required')
      && requireable.includes(nodeName)
      && el.required
      && el.getAttribute('aria-required') === 'false') {
      errors.push('do not set aria-required to false if the required attribute is set');
    }

    return errors;
  }
};

},{"../../rule.js":9}],"./rules/aria/attribute-values/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const ExtendedArray = require('../../../support/extended-array');
const { rSpace } = require('../../../support/constants');

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

    if (rSpace.test(value)) {
      return 'must not contain spaces';
    }

    return document.getElementById(value) ? null : `no element can be found with an id of ${value}`;
  },

  idlist(value) {
    if (!value.trim()) {
      return 'must be a list of one of more ids';
    }
    const missing = value.split(rSpace).filter(id => !document.getElementById(id));
    if (!missing.length) {
      return null;
    }
    return missing.map(id => `no element can be found with an id of ${id}`);
  },
};

module.exports = class extends Rule {
  selector(utils) {
    return this._selector || (this._selector = Object.keys(utils.config.ariaAttributes).map(name => `[aria-${name}]`).join(','));
  }

  test(el, utils) {
    return ExtendedArray.from(el.attributes)
      .map(({ name, value }) => {
        if (!name.startsWith('aria-')) {
          return null;
        }
        name = name.slice(5);
        const description = utils.config.ariaAttributes[name];
        if (!description) {
          return null;
        }
        return new ExtendedArray()
          .concat(checkers[description.values.type](value, description.values))
          .compact()
          .map(message => `aria-${name} ${message}`);
      })
      .compact()
      .flatten();
  }
};

},{"../../../support/constants":11,"../../../support/extended-array":13,"../../rule":9}],"./rules/aria/deprecated-attributes/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  deprecated(utils) {
    return this._deprecated || (this._deprecated = Object.entries(utils.config.ariaAttributes)
      .filter(([, value]) => value.deprecated)
      .map(([name]) => `aria-${name}`));
  }

  selector(utils) {
    return this.deprecated(utils).map(name => `[${name}]`).join(',');
  }

  test(el, utils) {
    return Array.from(el.attributes)
      .filter(({ name }) => this.deprecated(utils).includes(name))
      .map(({ name }) => `${name} is deprecated`);
  }
};

},{"../../rule":9}],"./rules/aria/immutable-role/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  constructor(settings) {
    super(settings);
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

},{"../../rule":9}],"./rules/aria/landmark/one-banner/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../../rule');

module.exports = class extends Rule {
  selector() {
    return 'header,[role~=banner]';
  }

  get role() {
    return 'banner';
  }

  get message() {
    return `there should only be one element with a role of ${this.role} in each document or application`;
  }

  test(el, utils) {
    if (!utils.aria.hasRole(el, this.role)) {
      return null;
    }

    const found = utils.$$(this.selector())
      .filter(elm => utils.aria.hasRole(elm, this.role))
      .groupBy(elm => utils.aria.closestRole(elm, ['application', 'document']))
      .filter(group => group.includes(el))
      .flatten();

    if (found.length > 1) {
      return this.message;
    }

    return null;
  }
};

},{"../../../rule":9}],"./rules/aria/landmark/one-contentinfo/rule.js":[function(require,module,exports){
"use strict";
const BannerRule = require('../one-banner/rule');

module.exports = class extends BannerRule {
  selector() {
    return 'footer,[role~=contentinfo]';
  }

  get role() {
    return 'contentinfo';
  }
};

},{"../one-banner/rule":"./rules/aria/landmark/one-banner/rule.js"}],"./rules/aria/landmark/one-main/rule.js":[function(require,module,exports){
"use strict";
const BannerRule = require('../one-banner/rule');

module.exports = class extends BannerRule {
  selector() {
    return 'main,[role~=main]';
  }

  get role() {
    return 'main';
  }
};

},{"../one-banner/rule":"./rules/aria/landmark/one-banner/rule.js"}],"./rules/aria/landmark/prefer-main/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../../rule');

module.exports = class extends Rule {
  selector() {
    return ':not(main)[role~=main]';
  }

  test(el, utils) {
    if (!utils.aria.hasRole(el, 'main')) {
      return null;
    }

    return 'use a main element for role=main';
  }
};

},{"../../../rule":9}],"./rules/aria/landmark/required/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../../rule.js');

function hasLandmark(nodeName, role, utils) {
  return utils.$$(`${nodeName},[role~=${role}]`, document.body)
    .filter(el => !utils.hidden(el))
    .filter(el => utils.aria.hasRole(el, role))
    .filter(el => utils.aria.closestRole(el, ['document', 'application']) === document.body)
    .filter(el => el.innerText)
    .length > 0;
}

module.exports = class extends Rule {
  selector() {
    return 'body';
  }

  test(el, utils) {
    const errors = [];

    if (!hasLandmark('main', 'main', utils)) {
      errors.push('document should have a <main>');
    }

    if (!hasLandmark('header', 'banner', utils)) {
      errors.push('document should have a <header>');
    }

    if (!hasLandmark('footer', 'contentinfo', utils)) {
      errors.push('document should have a <footer>');
    }

    return errors;
  }
};

},{"../../../rule.js":9}],"./rules/aria/no-focusable-hidden/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

const focusable = ['button:not(:disabled)', 'input:not([type="hidden"]):not(:disabled)', 'select:not(:disabled)', 'textarea:not(:disabled)', 'a[href]', 'area[href]', '[tabindex]'];

module.exports = class extends Rule {
  selector() {
    return this._selector || (this._selector = focusable.map(selector => `${selector}[aria-hidden="true"]`).join(','));
  }

  test(el, utils) {
    if (el.nodeName.toLowerCase() === 'area' || !utils.hidden(el)) {
      return 'do not mark focusable elements with `aria-hidden="true"`';
    }
    return null;
  }
};

},{"../../rule":9}],"./rules/aria/no-focusable-role-none/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

const focusable = 'button,input:not([type="hidden"]),meter,output,progress,select,textarea,a[href],area[href],[tabindex]';

module.exports = class extends Rule {
  selector() {
    return '[role~=none],[role~=presentation]';
  }

  test(el, utils) {
    if (el.matches(focusable) && utils.aria.hasRole(el, ['none', 'presentation'])) {
      return 'do not mark focusable elements with a role of presentation or none';
    }
    return null;
  }
};

},{"../../rule":9}],"./rules/aria/no-none-without-presentation/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return '[role="none"]';
  }

  test() {
    return 'use a role of "none presentation" to support older user-agents';
  }
};

},{"../../rule":9}],"./rules/aria/one-role/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const { rSpace } = require('../../../support/constants');

module.exports = class extends Rule {
  selector() {
    return '[role]';
  }

  test(el) {
    const roles = el.getAttribute('role').split(rSpace).filter(Boolean);
    if (roles.join(' ') === 'none presentation') {
      return null;
    }

    if (roles.length > 1) {
      return 'do not add multiple roles';
    }

    return null;
  }
};

},{"../../../support/constants":11,"../../rule":9}],"./rules/aria/roles/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const { rSpace } = require('../../../support/constants');

function isSupported(el, utils) {
  return !(utils.config.elements[el.nodeName.toLowerCase()] || {}).unsupported;
}

module.exports = class extends Rule {
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
    const supported = isSupported(el, utils);

    role.split(rSpace).some((name) => {
      if (!utils.config.roles[name]) {
        error = `role "${name}" is not a known role`;
        return true;
      }

      if (utils.config.roles[name].abstract) {
        error = `role "${name}" is an abstract role and should not be used`;
        return true;
      }

      if (supported && allowed.implicit.includes(name)) {
        error = `role "${name}" is implicit for this element and should not be specified`;
        return true;
      }

      if (allowed.roles === '*') {
        return null;
      }

      if (!allowed.roles.includes(name) && (supported || !allowed.implicit.includes(name))) {
        error = `role "${name}" is not allowed for this element`;
      }

      return null;
    });

    return error;
  }
};

},{"../../../support/constants":11,"../../rule":9}],"./rules/aria/unsupported-elements/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector(utils) {
    return this._selector || (this._selector = Array.from(Object.entries(utils.config.elements))
      .filter(([, { unsupported }]) => unsupported)
      .map(([name]) => `${name}:not([role])`)
      .join(','));
  }

  test(el, utils) {
    const allowed = utils.aria.allowed(el);
    if (!allowed.implicit.length) {
      return null;
    }

    return 'element should have a role for backwards compatibility';
  }
};

},{"../../rule":9}],"./rules/attributes/data/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return '[data],[data-]';
  }

  test() {
    return 'data is an attribute prefix';
  }
};

},{"../../rule":9}],"./rules/attributes/no-javascript-handlers/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule.js');

module.exports = class extends Rule {
  selector(utils) {
    return this._selector
      || (this._selector = utils.config.attributes.eventHandlerAttributes.map(name => `[${name}]`).join(','));
  }

  test(el, utils) {
    const handlers = Array.from(el.attributes)
      .filter(({ name }) => utils.config.attributes.eventHandlerAttributes.includes(name))
      .map(({ name }) => name);

    return `do not use event handler attributes. Found: ${handlers.join(', ')}`;
  }
};


},{"../../rule.js":9}],"./rules/attributes/no-positive-tab-index/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule.js');

module.exports = class extends Rule {
  selector() {
    return '[tabindex]';
  }

  test(el, utils) {
    if (el.tabIndex <= 0 || utils.hidden(el)) {
      return null;
    }

    return 'no tabindex greater than 0';
  }
};


},{"../../rule.js":9}],"./rules/colour-contrast/aa/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const ExtendedArray = require('../../../support/extended-array');

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
      .unique()
      .filter(filter)
      .map(el => [el, this.test(el, utils)])
      .filter(([, ratio]) => ratio)
      .map(([el, ratio]) => this.message(el, ratio));
  }

  iterate(node, utils, iterateSiblings) {
    let found = new ExtendedArray();
    let cursor = node;
    while (cursor) {
      if (!utils.hidden(cursor, { noAria: true })) {
        if (this.hasTextNode(cursor)) {
          found.push(cursor);
        }

        if (cursor.firstElementChild) {
          found = found.concat(this.iterate(cursor.firstElementChild, utils, true));
        }
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
    let fontWeight = utils.style(el, 'fontWeight');
    if (fontWeight === 'bold') {
      fontWeight = 700;
    } else if (fontWeight === 'normal') {
      fontWeight = 400;
    }
    const large = fontSize >= 24 /* 18pt */ || (fontSize >= 18.66 /* 14pt */ && fontWeight >= 700);

    if (large && ratio >= this.minLarge) {
      return null;
    }

    return ratio;
  }

  message(el, ratio) {
    return { el, message: `contrast is too low ${parseFloat(ratio.toFixed(2))}:1` };
  }
};

},{"../../../support/extended-array":13,"../../rule":9}],"./rules/colour-contrast/aaa/rule.js":[function(require,module,exports){
"use strict";
const ColourContrastAARule = require('../aa/rule.js');

module.exports = class extends ColourContrastAARule {
  setDefaults() {
    this.min = 7;
    this.minLarge = 4.5;
    this.enabled = false;
  }
};

},{"../aa/rule.js":"./rules/colour-contrast/aa/rule.js"}],"./rules/details-and-summary/rule.js":[function(require,module,exports){
"use strict";
const FieldsetRule = require('../fieldset-and-legend/rule');

module.exports = class extends FieldsetRule {
  get parent() {
    return 'details';
  }

  get child() {
    return 'summary';
  }

  isHidden(el, utils) {
    // summary will be hidden if details is not open
    return el.nodeName.toLowerCase() !== 'summary' && utils.hidden(el);
  }
};

},{"../fieldset-and-legend/rule":"./rules/fieldset-and-legend/rule.js"}],"./rules/elements/obsolete/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector({ config }) {
    return this._selector || (this._selector = Object.keys(config.elements).filter(el => config.elements[el].obsolete).join(','));
  }

  test() {
    return 'do not use obsolete elements';
  }
};

},{"../../rule":9}],"./rules/elements/unknown/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector({ config }) {
    return this._selector || (this._selector = Object.keys(config.elements).map(name => `:not(${name})`).join(''));
  }

  test(el) {
    if (el.closest('svg,math')) {
      return null;
    }
    return 'unknown element';
  }
};

},{"../../rule":9}],"./rules/fieldset-and-legend/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../rule');

function getFirstChild(el) {
  let cursor = el.firstChild;
  while (cursor instanceof Text && !cursor.data.trim()) {
    cursor = cursor.nextSibling;
  }
  return cursor;
}

module.exports = class extends Rule {
  get parent() {
    return 'fieldset';
  }

  get child() {
    return 'legend';
  }

  isHidden(el, utils) {
    return utils.hidden(el);
  }

  selector() {
    return `${this.parent},${this.child}`;
  }

  test(el, utils) {
    if (this.isHidden(el, utils)) {
      return null;
    }

    if (el.nodeName.toLowerCase() === this.parent) {
      const firstChild = getFirstChild(el);
      if (firstChild
        && firstChild instanceof HTMLElement
        && firstChild.nodeName.toLowerCase() === this.child
        && !utils.hidden(firstChild)) {
        return null;
      }
      return `a <${this.parent}> must have a visible <${this.child}> as their first child`;
    }

    // Legend
    if (el.parentNode.nodeName.toLowerCase() === this.parent) {
      const firstChild = getFirstChild(el.parentNode);
      if (firstChild === el) {
        return null;
      }
    }
    return `a <${this.child}> must be the first child of a <${this.parent}>`;
  }
};

},{"../rule":9}],"./rules/headings/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../rule');

const selector = 'h2,h3,h4,h5,h6,[role~=heading]';

function previous(el) {
  let cursor = el.previousElementSibling;
  while (cursor && cursor.lastElementChild) {
    cursor = cursor.lastElementChild;
  }
  return cursor;
}

function getLevel(el) {
  return /h[1-6]/i.test(el.nodeName) ? +el.nodeName[1] : (+el.getAttribute('aria-level') || 2);
}

module.exports = class extends Rule {
  selector() {
    return `${selector}:not([aria-level="1"])`;
  }

  test(el, utils) {
    if (!utils.aria.hasRole(el, 'heading') || utils.hidden(el)) {
      return null;
    }
    let cursor = el;
    const level = getLevel(el);
    do {
      cursor = previous(cursor) || cursor.parentElement;
      if (cursor && cursor.matches(`h1,${selector}`) && !utils.hidden(cursor) && utils.aria.hasRole(cursor, 'heading')) {
        const previousLevel = getLevel(cursor);
        if (level <= previousLevel + 1) {
          return null;
        }
        break;
      }
    } while (cursor && cursor !== document.body);
    return 'headings must be nested correctly';
  }
};

},{"../rule":9}],"./rules/ids/form-attribute/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const { rSpace } = require('../../../support/constants');

const selector = ['button', 'fieldset', 'input', 'object', 'output', 'select', 'textarea'].map(name => `${name}[form]`).join(',');

module.exports = class extends Rule {
  selector() {
    return selector;
  }

  test(el) {
    const formId = el.getAttribute('form');
    if (!formId) {
      return 'form attribute should be an id';
    }

    if (rSpace.test(formId)) {
      return 'form attribute should not contain spaces';
    }

    const form = document.getElementById(formId);
    if (!form) {
      return `cannot find element for form attribute with id "${formId}"`;
    }

    if (form.nodeName.toLowerCase() !== 'form') {
      return 'form attribute does not point to a form';
    }

    return null;
  }
};

},{"../../../support/constants":11,"../../rule":9}],"./rules/ids/imagemap-ids/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const { rSpace } = require('../../../support/constants');

module.exports = class extends Rule {
  selector() {
    return 'map';
  }

  test(el, utils) {
    if (!el.name) {
      return 'name attribute is required';
    }

    if (rSpace.test(el.name)) {
      return 'name attribute must not contain spaces';
    }

    const name = el.name.toLowerCase();
    const mapNames = utils.$$('map[name]').map(map => map.name.toLowerCase());
    if (mapNames.filter(item => item === name).length > 1) {
      return 'name attribute must be case-insensitively unique';
    }

    const imgUseMaps = utils.$$('img[usemap]').map(img => img.useMap.toLowerCase());
    if (!imgUseMaps.includes(`#${name}`)) {
      return 'name attribute should be referenced by an img usemap attribute';
    }

    if (el.id && el.id !== el.name) {
      return 'if the id attribute is present it must equal the name attribute';
    }

    return null;
  }
};

},{"../../../support/constants":11,"../../rule":9}],"./rules/ids/labels-have-inputs/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const { rSpace } = require('../../../support/constants');

module.exports = class extends Rule {
  selector() {
    return 'label[for]';
  }

  test(el) {
    if (!el.htmlFor) {
      return 'for attribute should not be empty';
    }

    if (rSpace.test(el.htmlFor)) {
      return 'for attribute should not contain spaces';
    }

    if (document.getElementById(el.htmlFor)) {
      return null;
    }

    return 'no element can be found with id of id attribute';
  }
};

},{"../../../support/constants":11,"../../rule":9}],"./rules/ids/list-id/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const { rSpace } = require('../../../support/constants');

module.exports = class extends Rule {
  selector() {
    return 'input[list]';
  }

  test(el, utils) {
    const listId = el.getAttribute('list');

    if (!listId) {
      return 'list attribute should not be empty';
    }

    if (rSpace.test(listId)) {
      return 'list attribute should not contain spaces';
    }

    if (listId && utils.$(`datalist[id="${utils.cssEscape(listId)}"]`)) {
      return null;
    }
    return 'no datalist found';
  }
};

},{"../../../support/constants":11,"../../rule":9}],"./rules/ids/no-duplicate-anchor-names/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
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

},{"../../rule":9}],"./rules/ids/unique-id/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const { rSpace } = require('../../../support/constants');

module.exports = class extends Rule {
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

},{"../../../support/constants":11,"../../rule":9}],"./rules/labels/area/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
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

},{"../../rule":9}],"./rules/labels/aria-command/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector(utils) {
    return this._selector || (this._selector = utils.aria.rolesOfType('command').map(role => `[role~="${role}"]`).join(','));
  }

  test(el, utils) {
    if (!utils.aria.hasRole(el, utils.aria.rolesOfType('command'))) {
      return null;
    }
    if (utils.hidden(el, { ariaHidden: true }) || utils.accessibleName(el)) {
      return null;
    }
    return 'elements with a role with a superclass of command must have a label';
  }
};

},{"../../rule":9}],"./rules/labels/controls/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'button,input:not([type="hidden"]),meter,output,progress,select,textarea';
  }

  test(el, utils) {
    if (utils.hidden(el, { ariaHidden: true }) || utils.accessibleName(el)) {
      return null;
    }
    return 'form controls must have a label';
  }
};

},{"../../rule":9}],"./rules/labels/group/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'fieldset,details,[role~=group],[role~=radiogroup]';
  }

  test(el, utils) {
    if (utils.hidden(el)
      || (el.nodeName.toLowerCase() !== 'fieldset' && !utils.aria.hasRole(el, ['group', 'radiogroup']))
      || utils.accessibleName(el)) {
      return null;
    }
    const name = el.matches('fieldset,details') ? el.nodeName.toLowerCase() : utils.aria.getRole(el);
    return `${name} must have a label`;
  }
};

},{"../../rule":9}],"./rules/labels/headings/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'h1,h2,h3,h4,h5,h6,[role~="heading"]';
  }

  test(el, utils) {
    if (!utils.aria.hasRole(el, 'heading')) {
      return null;
    }
    if (utils.hidden(el, { ariaHidden: true }) || utils.accessibleName(el)) {
      return null;
    }
    return 'headings must have a label';
  }
};

},{"../../rule":9}],"./rules/labels/img/rule.js":[function(require,module,exports){
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

},{"../../rule":9}],"./rules/labels/links/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'a[href]';
  }

  test(el, utils) {
    if (utils.hidden(el, { ariaHidden: true }) || utils.accessibleName(el)) {
      return null;
    }
    return 'links with a href must have a label';
  }
};

},{"../../rule":9}],"./rules/labels/tabindex/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return '[tabindex]';
  }

  test(el, utils) {
    if (utils.hidden(el, { ariaHidden: true }) || utils.accessibleName(el)) {
      return null;
    }
    return 'focusable elements must have a label';
  }
};

},{"../../rule":9}],"./rules/lang/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../rule');

// Language tags are defined in http://www.ietf.org/rfc/bcp/bcp47.txt
const match = /^((en-gb-oed)|([a-z]{2,3}(-[a-z]{3})?(-[a-z]{4})?(-[a-z]{2}|-\d{3})?(-[a-z0-9]{5,8}|-(\d[a-z0-9]{3}))*))$/i;

module.exports = class extends Rule {
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

},{"../rule":9}],"./rules/multiple-in-group/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../rule');

const excludeTypes = ['hidden', 'image', 'submit', 'reset', 'button'];
const excludeSelector = excludeTypes.map(type => `:not([type=${type}])`).join('');

module.exports = class extends Rule {
  selector() {
    return this._selector || (this._selector = `input[name]${excludeSelector},textarea[name],select[name],object[name]`);
  }

  test(el, utils) {
    if (utils.hidden(el)) {
      return null;
    }
    let group;

    if (el.form) {
      const elements = el.form.elements[el.name];
      if (elements instanceof Node) {
        return null;
      }
      group = Array.from(elements)
        .filter(elm => !excludeTypes.includes(elm.type))
        .filter(elm => !utils.hidden(elm));
    } else {
      const namePart = `[name="${utils.cssEscape(el.name)}"]`;
      group = utils.$$(`input${namePart}${excludeSelector},textarea${namePart},select${namePart},object${namePart}`)
        .filter(elm => !elm.form)
        .filter(elm => !utils.hidden(elm));
    }

    if (group.length === 1 || el.closest('fieldset') || utils.aria.closestRole(el, ['group', 'radiogroup'])) {
      return null;
    }

    return 'multiple inputs with the same name should be in a fieldset, group or radiogroup';
  }
};

},{"../rule":9}],"./rules/no-button-without-type/rule.js":[function(require,module,exports){
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

},{"../rule":9}],"./rules/no-consecutive-brs/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../rule');

function isBr(el) {
  return el instanceof Element && el.nodeName.toLowerCase() === 'br';
}

function previousElementIsBr(el, utils) {
  while ((el = el.previousSibling)) {
    if ((el instanceof Element && !utils.hidden(el)) || (el instanceof Text && el.data.trim())) {
      break;
    }
  }
  return isBr(el);
}

function nextElementIsBr(el, utils) {
  while ((el = el.nextSibling)) {
    if ((el instanceof Element && !utils.hidden(el)) || (el instanceof Text && el.data.trim())) {
      break;
    }
  }
  return isBr(el);
}

module.exports = class extends Rule {
  selector() {
    return 'br + br';
  }

  test(el, utils) {
    if (utils.hidden(el) || !previousElementIsBr(el, utils) || nextElementIsBr(el, utils)) {
      return null;
    }

    return 'do not use <br>s for spacing';
  }
};

},{"../rule":9}],"./rules/no-empty-select/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'select:not(:disabled)';
  }

  test(el, utils) {
    if (utils.hidden(el) || utils.$$('option', el).length) {
      return null;
    }
    return 'selects should have options';
  }
};

},{"../rule":9}],"./rules/no-links-as-buttons/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'a[role~=button],a[href="#"],a[href="#!"],a[href^="javascript:"]';
  }

  test(el, utils) {
    if (utils.hidden(el)) {
      return null;
    }
    return 'use a button instead of a link';
  }
};

},{"../rule":9}],"./rules/no-links-to-missing-fragments/rule.js":[function(require,module,exports){
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
    if (utils.hidden(el)) {
      return null;
    }
    if (removeHash(window.location) !== removeHash(el)) {
      return null;
    }
    const id = utils.cssEscape(decodeURI(el.hash.slice(1)));
    const found = utils.$(`[id="${id}"],a[name="${id}"]`);

    if (!found) {
      return 'fragment not found in document';
    }

    if (utils.hidden(found)) {
      return 'link target is hidden';
    }

    return null;
  }
};

},{"../rule":9}],"./rules/no-multiple-select/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'select[multiple]:not(:disabled)';
  }

  test(el, utils) {
    if (utils.hidden(el)) {
      return null;
    }
    return 'do not use multiple selects';
  }
};

},{"../rule":9}],"./rules/no-outside-controls/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'input,textarea,select,button:not([type]),button[type="submit"],button[type="reset"]';
  }

  test(el, utils) {
    if (el.form || utils.hidden(el) || el.disabled) {
      return null;
    }
    return 'all controls should be associated with a form';
  }
};

},{"../rule":9}],"./rules/no-placeholder-links/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../rule.js');

module.exports = class extends Rule {
  selector() {
    return 'a:not([href]),area:not([href])';
  }

  test(el, utils) {
    if (el.nodeName.toLowerCase() === 'a' && utils.hidden(el)) {
      return null;
    }

    return 'links should have a href attribute';
  }
};


},{"../rule.js":9}],"./rules/no-reset/rule.js":[function(require,module,exports){
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

},{"../rule":9}],"./rules/no-unassociated-labels/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../rule');

const labelable = 'input:not([type=hidden]),select,textarea,button,meter,output,progress';

module.exports = class extends Rule {
  selector() {
    return 'label';
  }

  test(el, utils) {
    if (utils.hidden(el)) {
      return null;
    }

    if (el.htmlFor) {
      const forEl = document.getElementById(el.htmlFor);
      if (!forEl) {
        return 'label is not labelling an element';
      }
      if (utils.hidden(forEl)) {
        return 'label is labelling a hidden element';
      }
      return null;
    }

    const targets = utils.$$(labelable, el);

    if (targets.length && !targets.filter(elm => !utils.hidden(elm)).length) {
      return 'label is labelling a hidden element';
    }

    if (!targets.length) {
      return 'label is not labelling an element';
    }

    return null;
  }
};

},{"../rule":9}],"./rules/security/charset/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');

module.exports = class extends Rule {
  run(context, filter = () => true, utils) {
    const errors = [];

    if (!context.contains(document.documentElement)) {
      return [];
    }

    if (document.characterSet !== 'UTF-8') {
      errors.push({ el: document.documentElement, message: 'all HTML documents should be authored in UTF-8' });
    }

    const meta = utils.$$('meta[charset],meta[http-equiv="content-type" i]');

    if (meta.length > 1) {
      meta.forEach(el => errors.push({ el, message: 'more than one meta charset tag found' }));
    }

    if (!meta.length) {
      errors.push({ el: document.head, message: 'missing `<meta charset="UTF-8">`' });
    }

    meta
      .filter(el => el.httpEquiv)
      .forEach(el => errors.push({ el, message: 'use the form `<meta charset="UTF-8">`' }));

    meta
      .filter(el => document.head.firstElementChild !== el)
      .forEach(el => errors.push({ el, message: 'meta charset should be the first child of <head>' }));

    return errors.filter(({ el }) => filter(el));
  }
};

},{"../../rule":9}],"./rules/security/target/rule.js":[function(require,module,exports){
"use strict";
const Rule = require('../../rule');
const constants = require('../../../support/constants');

module.exports = class extends Rule {
  selector() {
    return 'a[href][target],area[href][target],form[target],base[target],form button[type=submit][formtarget],form input[type=submit][formtarget],form input[type=image][formtarget]';
  }

  test(el, utils) {
    if (el.target === '_self' || el.formTarget === '_self') {
      return null;
    }
    const nodeName = el.nodeName.toLowerCase();
    if (nodeName !== 'base' && nodeName !== 'area' && utils.hidden(el)) {
      return null;
    }

    const rel = el.rel && el.rel.split(constants.rSpace);
    if (rel && rel.includes('noopener') && rel.includes('noreferrer')) {
      return null;
    }

    let url = el.href;
    if (nodeName === 'form') {
      url = el.action;
    } else if (nodeName === 'button' || nodeName === 'input') {
      // Chrome returns the page url for el.formaction
      url = el.getAttribute('formaction') || el.form.action;
    }

    try {
      url = new URL(url, location.href);
    } catch (_) {
      url = null;
    }

    if (url && url.host === location.host) {
      return null;
    }

    let message = 'target attribute has opener vulnerability';
    if (nodeName === 'a' || nodeName === 'area') {
      message += '. Add `rel="noopener noreferrer"`';
    }
    return message;
  }
};

},{"../../../support/constants":11,"../../rule":9}],"./rules/title/rule.js":[function(require,module,exports){
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

},{"../rule":9}],"./rules":[function(require,module,exports){
"use strict";
module.exports = ["aria/allowed-attributes","aria/attribute-values","aria/deprecated-attributes","aria/immutable-role","aria/landmark/one-banner","aria/landmark/one-contentinfo","aria/landmark/one-main","aria/landmark/prefer-main","aria/landmark/required","aria/no-focusable-hidden","aria/no-focusable-role-none","aria/no-none-without-presentation","aria/one-role","aria/roles","aria/unsupported-elements","attributes/data","attributes/no-javascript-handlers","attributes/no-positive-tab-index","colour-contrast/aa","colour-contrast/aaa","details-and-summary","elements/obsolete","elements/unknown","fieldset-and-legend","headings","ids/form-attribute","ids/imagemap-ids","ids/labels-have-inputs","ids/list-id","ids/no-duplicate-anchor-names","ids/unique-id","labels/area","labels/aria-command","labels/controls","labels/group","labels/headings","labels/img","labels/links","labels/tabindex","lang","multiple-in-group","no-button-without-type","no-consecutive-brs","no-empty-select","no-links-as-buttons","no-links-to-missing-fragments","no-multiple-select","no-outside-controls","no-placeholder-links","no-reset","no-unassociated-labels","security/charset","security/target","title"];
},{}],"./version":[function(require,module,exports){
"use strict";
module.exports = "1.14.0"
},{}],1:[function(require,module,exports){
"use strict";
/**
 * Aria rules for a HTML element
 *
 * https://w3c.github.io/html-aria/
 */
const { $$ } = require('../utils/selectors.js');

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
function rule({ selector = '*', implicit = [], roles = [], anyRole = false, ariaForImplicit = false, noAria = false }) {
  return {
    selector,
    implicit: [].concat(implicit),
    roles: anyRole ? '*' : roles,
    noAria,
    ariaForImplicit,
  };
}

// Common rules
// TODO: include aria attribute rules
const noRoleOrAria = rule({ noAria: true });
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
        'menuitemradio', 'option', 'radio', 'tab', 'switch', 'treeitem',
      ],
      ariaForImplicit: true,
    }),
    rule({
      selector: ':not([href])',
      anyRole: true,
    }),
  ],
  address: anyRole,
  area: [
    rule({
      selector: '[href]',
      implicit: 'link',
      ariaForImplicit: true,
    }),
  ],
  article: rule({
    implicit: 'article',
    roles: ['feed', 'presentation', 'document', 'application', 'main', 'region'],
  }),
  aside: rule({
    implicit: 'complementary',
    roles: ['feed', 'note', 'region', 'search'],
  }),
  audio: rule({
    roles: ['application'],
  }),
  base: noRoleOrAria,
  body: rule({
    implicit: ['document'],
    ariaForImplicit: true,
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
    ariaForImplicit: true,
  }),
  dd: rule({
    implicit: 'definition',
    ariaForImplicit: true,
  }),
  details: rule({
    implicit: 'group',
    ariaForImplicit: true,
  }),
  dialog: rule({
    implicit: 'dialog',
    roles: ['alertdialog'],
    ariaForImplicit: true,
  }),
  div: anyRole,
  dl: rule({
    implicit: 'list',
    roles: ['group', 'presentation'],
  }),
  dt: rule({
    implicit: 'listitem',
    ariaForImplicit: true,
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
      selector(el, aria) {
        const selector = ['article', 'aside', 'main', 'nav', 'section'].map(name => `:scope ${name} footer`).join(',');
        return $$(selector, aria.closestRole(el, ['application', 'document'], { exact: true }))
          .includes(el);
      },
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
      selector(el, aria) {
        const selector = ['article', 'aside', 'main', 'nav', 'section'].map(name => `:scope ${name} header`).join(',');
        return $$(selector, aria.closestRole(el, ['application', 'document'], { exact: true }))
          .includes(el);
      },
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
    ariaForImplicit: true,
  }),
  html: noRoleOrAria,
  iframe: rule({
    roles: ['application', 'document', 'img'],
  }),
  img: [
    rule({
      selector: '[alt=""]',
      roles: ['presentation', 'none'],
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
      ariaForImplicit: true,
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
      selector: ':not([type]),[type=tel],[type=text],[type=url]',
      implicit: 'textbox',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=email]',
      implicit: 'textbox',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=hidden]',
      aria: false,
    }),
    rule({
      selector: '[type=number]',
      implicit: 'spinbutton',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=radio]',
      implicit: 'radio',
      roles: ['menuitemradio'],
    }),
    rule({
      selector: '[type=range]',
      implicit: 'slider',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=reset],[type=submit]',
      implicit: 'button',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=search]',
      implicit: 'searchbox',
      ariaForImplicit: true,
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
    ariaForImplicit: true,
  }),
  map: noRoleOrAria,
  math: rule({
    implicit: 'math',
    ariaForImplicit: true,
  }),
  menu: [
    rule({
      selector: '[type=context]',
      implicit: 'menu',
      ariaForImplicit: true,
    }),
  ],
  menuitem: [
    rule({
      selector: '[type=command]',
      implicit: 'menuitem',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=checkbox]',
      implicit: 'menuitemcheckbox',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=radio]',
      implicit: 'menuitemradio',
      ariaForImplicit: true,
    }),
  ],
  meta: noRoleOrAria,
  meter: rule({
    implicit: 'progressbar',
  }),
  nav: rule({
    implicit: 'navigation',
    ariaForImplicit: true,
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
    ariaForImplicit: true,
  }),
  option: [
    rule({
      selector: 'select>option,select>optgroup>option,datalist>option',
      implicit: 'option',
      ariaForImplicit: true,
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
    ariaForImplicit: true,
  }),
  script: noRoleOrAria,
  section: rule({
    implicit: 'region',
    roles: [
      'alert', 'alertdialog', 'application', 'banner', 'complementary',
      'contentinfo', 'dialog', 'document', 'feed', 'log', 'main', 'marquee',
      'navigation', 'search', 'status', 'tabpanel',
    ],
  }),
  select: rule({
    implicit: 'listbox',
    roles: ['menu'],
    ariaForImplicit: true,
  }),
  source: noRoleOrAria,
  span: anyRole,
  style: noRoleOrAria,
  svg: rule({
    roles: ['application', 'document', 'img'],
  }),
  summary: rule({
    implicit: 'button',
    ariaForImplicit: true,
  }),
  table: rule({
    implicit: 'table',
    anyRole: true,
  }),
  template: noRoleOrAria,
  textarea: rule({
    implicit: 'textbox',
    ariaForImplicit: true,
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
      'radiogroup', 'tablist', 'toolbar', 'tree', 'presentation',
    ],
  }),
  video: rule({
    roles: ['application'],
  }),
};

},{"../utils/selectors.js":21}],2:[function(require,module,exports){
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
  type: 'token',
  tokens: ['true', 'false'],
};

const tristate = {
  type: 'token',
  tokens: ['true', 'false', 'mixed', 'undefined'],
};

const nilableBoolean = {
  type: 'token',
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
  return found.filter(Boolean).filter(elm => !utils.hidden(elm, { ariaHidden: true }));
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
  details: {
    nativeLabel(el, utils) {
      const found = el.querySelector('summary');
      if (found && utils.hidden(found, { ariaHidden: true })) {
        return null;
      }
      return found;
    },
    unsupported: true,
  },
  dfn: {},
  dialog: {
    unsupported: true,
  },
  dir: obsolete,
  div: {},
  dl: {},
  dt: {},
  em: {},
  embed: {},
  fieldset: {
    nativeLabel(el, utils) {
      const found = el.querySelector('legend');
      if (found && utils.hidden(found, { ariaHidden: true })) {
        return null;
      }
      return found;
    },
  },
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

      if (['submit', 'reset', 'button'].includes(el.type)) {
        return el.value;
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
  menu: {
    unsupported: true,
  },
  menuitem: {
    unsupported: true,
  },
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
  summary: {
    unsupported: true,
  },
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
exports.eventHandlerAttributes = [
  'onabort',
  'onauxclick',
  'onblur',
  'oncancel',
  'oncanplay',
  'oncanplaythrough',
  'onchange',
  'onclick',
  'onclose',
  'oncontextmenu',
  'oncuechange',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragexit',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'ondurationchange',
  'onemptied',
  'onended',
  'onerror',
  'onfocus',
  'oninput',
  'oninvalid',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onload',
  'onloadeddata',
  'onloadedmetadata',
  'onloadend',
  'onloadstart',
  'onmousedown',
  'onmouseenter',
  'onmouseleave',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onwheel',
  'onpause',
  'onplay',
  'onplaying',
  'onprogress',
  'onratechange',
  'onreset',
  'onresize',
  'onscroll',
  'onseeked',
  'onseeking',
  'onselect',
  'onshow',
  'onstalled',
  'onsubmit',
  'onsuspend',
  'ontimeupdate',
  'ontoggle',
  'onvolumechange',
  'onwaiting',
];

},{}],5:[function(require,module,exports){
"use strict";
const allowedAria = require('./allowed-aria');
const ariaAttributes = require('./aria-attributes');
const elements = require('./elements');
const attributes = require('./event-handler-attributes');
const roles = require('./roles');

function extendElements(original, config) {
  const settings = Object.assign({}, original);
  if (config) {
    Object.entries(config).forEach(([key, value]) => {
      if (!value) {
        delete settings[key];
        return;
      }
      settings[key] = Object.assign({}, settings[key] || {}, value);
    });
  }
  return settings;
}

module.exports = class Config {
  constructor(settings = {}) {
    this.allowedAria = allowedAria;
    this.ariaAttributes = ariaAttributes;
    this.elements = extendElements(elements, settings.elements);
    this.attributes = attributes;
    this.roles = roles;
  }
};

},{"./allowed-aria":1,"./aria-attributes":2,"./elements":3,"./event-handler-attributes":4,"./roles":6}],6:[function(require,module,exports){
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
    allowed: ['colindex', 'colspan', 'expanded', 'rowindex', 'rowspan'],
    nameFromContent: true,
    subclass: ['columnheader', 'gridcell', 'rowheader'],
  },
  checkbox: {
    allowed: ['readonly'],
    required: ['checked'],
    nameFromContent: true,
    subclass: ['menuitemcheckbox', 'switch'],
  },
  columnheader: {
    allowed: ['colindex', 'colspan', 'expanded', 'readonly', 'required', 'rowindex', 'rowspan', 'selected', 'sort'],
    nameFromContent: true,
  },
  combobox: {
    required: ['controls', 'expanded'],
    allowed: ['activedescendant', 'autocomplete', 'orientation', 'required'],
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
    allowed: ['expanded', 'modal'],
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
    allowed: ['expanded'],
  },
  figure: {
    allowed: ['expanded'],
  },
  form: {
    allowed: ['expanded'],
  },
  grid: {
    allowed: ['activedescendant', 'colcount', 'expanded', 'level', 'multiselectable', 'readonly', 'rowcount'],
    subclass: ['treegrid'],
  },
  gridcell: {
    allowed: ['colindex', 'colspan', 'expanded', 'readonly', 'required', 'rowindex', 'rowspan', 'selected'],
    nameFromContent: true,
    subclass: ['columnheader', 'rowheader'],
  },
  group: {
    allowed: ['activedescendant', 'expanded'],
    subclass: ['row', 'select', 'toolbar'],
  },
  heading: {
    allowed: ['expanded', 'level'],
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
    allowed: ['activedescendant', 'expanded', 'multiselectable', 'orientation', 'required'],
  },
  listitem: {
    allowed: ['expanded', 'level', 'posinset', 'setsize'],
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
    allowed: ['activedescendant', 'expanded', 'orientation'],
    subclass: ['menubar'],
  },
  menubar: {
    allowed: ['activedescendant', 'expanded', 'orientation'],
  },
  menuitem: {
    allowed: ['posinset', 'setsize'],
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
    allowed: ['posinset', 'setsize'],
    nameFromContent: true,
    subclass: ['menuitemradio'],
  },
  radiogroup: {
    allowed: ['activedescendant', 'expanded', 'required', 'orientation'],
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
    allowed: ['activedescendant', 'colindex', 'expanded', 'level', 'rowindex', 'selected'],
    nameFromContent: true,
  },
  rowgroup: {
    nameFromContent: true,
  },
  rowheader: {
    allowed: ['colindex', 'colspan', 'expanded', 'rowindex', 'rowspan', 'readonly', 'required', 'selected', 'sort'],
    nameFromContent: true,
  },
  scrollbar: {
    required: ['controls', 'orientation', 'valuemax', 'valuemin', 'valuenow'],
  },
  search: {
    allowed: ['expanded'],
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
    required: ['valuemax', 'valuemin', 'valuenow'],
    allowed: ['orientation', 'valuetext'],
  },
  slider: {
    required: ['valuemax', 'valuemin', 'valuenow'],
    allowed: ['orientation', 'readonly', 'valuetext'],
  },
  spinbutton: {
    required: ['valuemax', 'valuemin', 'valuenow'],
    allowed: ['required', 'readonly', 'valuetext'],
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
    allowed: ['expanded', 'posinset', 'selected', 'setsize'],
    nameFromContent: true,
  },
  table: {
    allowed: ['colcount', 'expanded', 'rowcount'],
    subclass: ['grid'],
  },
  tablist: {
    allowed: ['activedescendant', 'level', 'multiselectable', 'orientation'],
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
    allowed: ['activedescendant', 'expanded', 'orientation'],
  },
  tooltip: {
    allowed: ['expanded'],
    nameFromContent: true,
  },
  tree: {
    allowed: ['activedescendant', 'expanded', 'multiselectable', 'orientation', 'required'],
    nameFromContent: true,
    subclass: ['treegrid'],
  },
  treegrid: {
    allowed: ['activedescendant', 'colcount', 'expanded', 'level', 'multiselectable', 'orientation', 'readonly', 'required', 'rowcount'],
  },
  treeitem: {
    allowed: ['expanded', 'checked', 'level', 'posinset', 'selected', 'setsize'],
    nameFromContent: true,
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

},{}],7:[function(require,module,exports){
"use strict";
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

},{"./config":5,"./logger":8,"./rules":"./rules","./rules/rule":9,"./runner":10,"./utils":19,"./utils/contrast":16,"./version":"./version"}],8:[function(require,module,exports){
"use strict";
/* eslint-disable no-console, class-methods-use-this */
module.exports = class Logger {
  log({ type, el, message, name }) {
    console[type].apply(console, [message, el, name].filter(Boolean));
  }
};

},{}],9:[function(require,module,exports){
"use strict";
const ExtendedArray = require('../support/extended-array');

module.exports = class Rule {
  constructor(settings) {
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
    return utils.$$(this.selector(utils), context)
      .filter(filter)
      .map(el => (
        ExtendedArray.of(this.test(el, utils))
          .flatten()
          .compact()
          .map(message => ({ el, message }))
      ))
      .flatten();
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

},{"../support/extended-array":13}],10:[function(require,module,exports){
"use strict";
const Utils = require('./utils');
const SetCache = require('./support/set-cache');

const dummyCache = {
  add() {},
  set() {},
  has() { return false; },
};

module.exports = class Runner {
  constructor(settings) {
    const globalSettings = {};
    if (settings.defaultOff) {
      globalSettings.enabled = false;
    }

    this.cacheReported = settings.cacheReported !== false;
    this.ruleSettings = settings.ruleSettings || {};
    this.config = settings.config;

    this.rules = new Map(Array.from(settings.rules)
      .map(([name, Rule]) => [
        name,
        new Rule(Object.assign({ name }, globalSettings, this.ruleSettings[name])),
      ])
    );

    this.ignoreAttribute = settings.ignoreAttribute || 'data-accessibility-linter-ignore';

    this.whitelist = settings.whitelist;
    this.logger = settings.logger;

    if (this.cacheReported) {
      this.reported = new SetCache();
      this.whitelisted = new SetCache();
      this.globalWhitelisted = new WeakSet();
      this.ignored = new SetCache();
    } else {
      this.reported = this.whitelisted = this.globalWhitelisted = this.ignored = dummyCache;
    }

    this.utils = null;
  }

  /**
   * Run all the rules
   * @param {HTMLElement} [context] A context to run the rules within
   */
  run(context) {
    this.utils = new Utils(this.config);
    Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .forEach(rule => this.runInternal(rule, context, (el, name) => this.filter(el, name)));
    this.utils = null;
  }

  /**
   * Run one rule regardless of it being enabled
   * @name {String|Rule} rule A rule or name of a rule
   * @param {HTMLElement} [context] A context
   * @param {String} [whitelist] Optionally a whitelist
   */
  runRule(rule, { context, whitelist, ruleSettings } = {}) {
    if (typeof rule === 'string') {
      rule = this.rules.get(rule);
    }

    const runner = new Runner({
      rules: new Map([[rule.name, rule.constructor]]),
      whitelist: whitelist || this.whitelist,
      logger: this.logger,
      ruleSettings: {
        [rule.name]: Object.assign(
          {},
          ruleSettings || this.ruleSettings[rule.name] || {},
          { enabled: true }
        ),
      },
    });

    runner.run(context);
  }

  /**
   * Filter if the element has already reported on this rule or is excluded from this rule
   * @private
   */
  filter(el, name) {
    return this.notWhitelisted(el, name)
      && this.notIgnored(el, name)
      && this.notReported(el, name);
  }

  /**
   * Run a single rule
   * @private
   */
  runInternal(rule, context = document, filter) {
    rule.run(context, el => filter(el, rule.name), this.utils)
      .forEach((issue) => {
        this.reported.set(issue.el, rule.name);
        this.logger.log(Object.assign({ name: rule.name, type: rule.type }, issue));
      });
  }

  /**
   * Has this already been reported for this element
   * @private
   */
  notReported(el, name) {
    return !this.reported.has(el, name);
  }

  /**
   * Is this element excluded by a whitelist
   * @private
   */
  notWhitelisted(el, name) {
    if (this.globalWhitelisted.has(el) || this.whitelisted.has(el, name)) {
      return false;
    }

    if (this.whitelist && el.matches(this.whitelist)) {
      this.globalWhitelisted.add(el);
      return false;
    }

    const whitelist = this.ruleSettings[name] && this.ruleSettings[name].whitelist;
    if (whitelist && el.matches(whitelist)) {
      this.whitelisted.set(el, name);
      return false;
    }

    return true;
  }

  /**
   * Is this element excluded by an attribute
   * @private
   */
  notIgnored(el, ruleName) {
    if (this.ignored.has(el, ruleName)) {
      return false;
    }

    const ignore = el.matches(
      `[${this.ignoreAttribute}=""],[${this.ignoreAttribute}~="${this.utils.cssEscape(ruleName)}"]`
    );

    if (ignore) {
      this.ignored.set(el, ruleName);
      return false;
    }

    return true;
  }
};

},{"./support/set-cache":14,"./utils":19}],11:[function(require,module,exports){
"use strict";
// https://www.w3.org/TR/html52/infrastructure.html#common-parser-idioms
exports.rSpace = /[ \t\n\f\r]+/;

},{}],12:[function(require,module,exports){
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

module.exports = class ElementCache {
  constructor() {
    this._cache = new WeakMap();
  }

  /**
   * Generate a key from the options supplied to key
   */
  key(el, key) {
    return key;
  }

  /**
   * Sets stored value
   */
  setter() {
    throw new Error('not implemented');
  }

  /**
   *  Get a value
   *  @param {Object} el A key to cache against
   */
  get(el) {
    const map = getOrSet(this._cache, el, () => new Map());
    const optionsKey = this.key.apply(this, arguments);
    return getOrSet(map, optionsKey, () => this.setter.apply(this, arguments));
  }
};

},{}],13:[function(require,module,exports){
"use strict";
module.exports = class ExtendedArray extends Array {
  tap(fn) {
    fn(this);
    return this;
  }

  unique() {
    const set = new Set();
    return this.filter(item => (set.has(item) ? false : set.add(item)));
  }

  groupBy(fn) {
    const map = new Map();
    this.forEach((item, i, ar) => {
      const key = fn(item, i, ar);
      if (map.has(key)) {
        map.get(key).push(item);
      } else {
        map.set(key, ExtendedArray.of(item));
      }
    });
    return ExtendedArray.from(map.values());
  }

  compact() {
    return this.filter(Boolean);
  }

  flatten() {
    let result = new ExtendedArray();
    this.forEach((item) => {
      if (Array.isArray(item)) {
        result = result.concat(ExtendedArray.from(item).flatten());
      } else {
        result.push(item);
      }
    });
    return result;
  }
};

},{}],14:[function(require,module,exports){
"use strict";
module.exports = class ElementCache {
  constructor() {
    this._cache = new WeakMap();
  }

  has(el, value) {
    const set = this._cache.get(el);
    if (!set) {
      return false;
    }
    return set.has(value);
  }

  set(el, value) {
    let set = this._cache.get(el);
    if (!set) {
      set = new Set();
      this._cache.set(el, set);
    }
    set.add(value);
  }
};

},{}],15:[function(require,module,exports){
"use strict";
/**
 *  Data and functions for aria validation.  Based on
 *  - https://www.w3.org/TR/wai-aria-1.1/
 *  - https://www.w3.org/TR/html52/
 */
const ExtendedArray = require('../support/extended-array');

module.exports = class Aria {
  constructor(config) {
    this.config = config;
  }

  /**
   * An object with the role settings for the element
   * @type {Object[]}
   */
  allowed(el) {
    const name = el.nodeName.toLowerCase();
    let found = this.config.allowedAria[name];
    if (Array.isArray(found)) {
      found = found.find(item => (
        item.selector === '*' || (typeof item.selector === 'function' ? item.selector(el, this) : el.matches(item.selector))
      ));
    }
    return found || this.config.allowedAria._default;
  }

  /**
   * Get the elements current role based on the role attribute or implicit role
   * @param {Element} el
   * @returns {String|null}
   */
  getRole(el, allowed) {
    let role = null;
    // Should be the first non-abstract role in the list
    if ((el.getAttribute('role') || '').split(/\s+/).filter(Boolean).some((name) => {
      if (this.config.roles[name] && !this.config.roles[name].abstract) {
        role = name;
        return true;
      }
      return false;
    })) {
      return role;
    }
    allowed = allowed || this.allowed(el);
    return allowed.implicit[0] || null;
  }

  /**
   * Does an element have a role. This will test against abstract roles
   * @param {Element|String|null} target
   * @param {String|String[]} name
   * @param {Boolean} [options.extact=false] Match against abstract roles
   * @returns {Boolean}
   */
  hasRole(target, name, { exact = false } = {}) {
    if (target === null) {
      return false;
    }
    const actualRole = typeof target === 'string' ? target : this.getRole(target);
    if (!actualRole) {
      return false;
    }
    return [].concat(name).some(function hasRole(checkRole) {
      if (checkRole === actualRole) {
        return true;
      }
      return !exact && (this.config.roles[checkRole].subclass || []).some(hasRole, this);
    }, this);
  }

  /**
   * Find the closest element with the specified role(s)
   * @param {Element} el
   * @param {String|String[]} role
   * @param {Boolean} [options.exact=false]
   * @returns {Boolean}
   */
  closestRole(el, role, { exact = false } = {}) {
    const roles = [].concat(role);
    let cursor = el;
    while ((cursor = cursor.parentNode) && cursor.nodeType === Node.ELEMENT_NODE) {
      // eslint-disable-next-line no-loop-func
      if (roles.some(name => this.hasRole(cursor, name, { exact }))) {
        return cursor;
      }
    }
    return null;
  }

  rolesOfType(name) {
    const roles = new ExtendedArray();
    const role = this.config.roles[name];
    if (!role.abstract) {
      roles.push(name);
    }
    if (role.subclass) {
      roles.push(role.subclass.map(this.rolesOfType, this));
    }
    return roles.flatten();
  }
};

},{"../support/extended-array":13}],16:[function(require,module,exports){
"use strict";
// Luminosity calculation
/* eslint-disable class-methods-use-this */

function gamma(value) {
  const n = value / 255;
  // eslint-disable-next-line no-restricted-properties
  return n <= 0.03928 ? n / 12.92 : Math.pow(((n + 0.055) / 1.055), 2.4);
}

function blendAlpha(s, d) {
  return s + (d * (1 - s));
}

function blendChannel(sc, dc, sa, da, ba) {
  return ((sc * sa) + (dc * da * (1 - sa))) / ba;
}

function blend(colours) {
  let [r, g, b, a] = [0, 0, 0, 0];
  colours.reverse().forEach(([_r, _g, _b, _a]) => {
    const aNew = blendAlpha(_a, a);
    r = blendChannel(_r, r, _a, a, aNew);
    g = blendChannel(_g, g, _a, a, aNew);
    b = blendChannel(_b, b, _a, a, aNew);
    a = aNew;
  });
  return [Math.round(r), Math.round(g), Math.round(b), a];
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
  document.body.appendChild(el);
  const value = window.getComputedStyle(el).color;
  if (!value) {
    throw new Error('unable to parse colour');
  }
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
    return [+match[1], +match[2], +match[3], match[4] ? parseFloat(match[4]) : 1];
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

},{}],17:[function(require,module,exports){
"use strict";
module.exports = function cssEscape(name) {
  return name.replace(/["\\]/g, '\\$&');
};

},{}],18:[function(require,module,exports){
"use strict";
/**
 *  Determine if an element is hidden or not
 */
/* eslint-disable class-methods-use-this */

const ElementCache = require('../support/element-cache');

// Elements that don't have client rectangles
const noRects = ['br', 'wbr'];

// Is the element hidden using CSS
function cssHidden(el, style) {
  return style.get(el, 'visibility') !== 'visible' || style.get(el, 'display') === 'none';
}

// Is the element hidden from accessibility software
function hidden(el, style, ariaHidden = false) {
  if (el === document) {
    return false;
  }
  return (ariaHidden && el.getAttribute('aria-hidden') === 'true')
    || (!noRects.includes(el.nodeName.toLowerCase()) && el.getClientRects().length === 0)
    || (ariaHidden && !!el.closest('[aria-hidden=true]'))
    || cssHidden(el, style);
}

/**
 *  Cache of hidden element
 */
module.exports = class Hidden extends ElementCache {
  constructor(style) {
    super();
    this.style = style;
  }

  key(el, { ariaHidden = false } = {}) {
    return ariaHidden;
  }

  setter(el, { ariaHidden = false } = {}) {
    return hidden(el, this.style, ariaHidden);
  }
};

},{"../support/element-cache":12}],19:[function(require,module,exports){
"use strict";
const { $, $$ } = require('./selectors');
const { accessibleName, accessibleDescription } = require('./name');
const Aria = require('./aria');
const Contrast = require('./contrast');
const cssEscape = require('./cssEscape');
const Hidden = require('./hidden');
const Style = require('./style');

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
  constructor(config) {
    this._style = new Style();
    this._hidden = new Hidden(this._style);
    this._nameCache = new WeakMap();
    this._descriptionCache = new WeakMap();
    this.contrast = new Contrast(this._style);
    this.config = config;
    this.aria = new Aria(config);
  }

  hidden(el, options) {
    return this._hidden.get(el, options);
  }

  style(el, name, pseudo) {
    return this._style.get(el, name, pseudo);
  }

  accessibleName(el) {
    return getOrSet(
      this._nameCache,
      el,
      () => accessibleName(el, Object.assign({ utils: this }))
    );
  }

  accessibleDescription(el) {
    return getOrSet(
      this._descriptionCache,
      el,
      () => accessibleDescription(el, Object.assign({ utils: this }))
    );
  }
};

Utils.prototype.$ = $;
Utils.prototype.$$ = $$;
Utils.prototype.cssEscape = cssEscape;

module.exports = Utils;

},{"./aria":15,"./contrast":16,"./cssEscape":17,"./hidden":18,"./name":20,"./selectors":21,"./style":22}],20:[function(require,module,exports){
"use strict";
// An implementation of the text alternative computation
// https://www.w3.org/TR/accname-aam-1.1/#mapping_additional_nd_te
const controlRoles = ['textbox', 'combobox', 'listbox', 'range'];
const nameFromContentRoles = roles => Object.keys(roles)
  .filter(name => roles[name].nameFromContent);

class AccessibleName {
  constructor(el, options = {}) {
    this.utils = options.utils;
    this.el = el;
    this.recursion = !!options.recursion;
    this.allowHidden = !!options.allowHidden;
    this.includeHidden = !!options.includeHidden;
    this.noAriaBy = !!options.noAriaBy;
    this.history = options.history || [];
    this.isWithinWidget = 'isWithinWidget' in options ? options.isWithinWidget : this.utils.aria.hasRole(this.role, 'widget');

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
    return this._role || (this._role = this.utils.aria.getRole(this.el));
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
    const isHidden = this.utils.hidden(this.el, { ariaHidden: true });
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

    const element = this.utils.config.elements[this.nodeName];
    if (element && element[prop]) {
      let value = element[prop](this.el, this.utils);
      if (typeof value === 'string') {
        return value;
      }
      if (value instanceof HTMLElement) {
        value = [value];
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
      && controlRoles.some(name => this.utils.aria.hasRole(this.role, name));

    if (!useEmbeddedName) {
      return null;
    }

    const { el, role } = this;

    if (['input', 'textarea'].includes(this.nodeName) && !this.utils.aria.hasRole(role, 'button')) {
      return el.value;
    }

    if (this.nodeName === 'select') {
      return Array.from(this.el.selectedOptions)
        .map(option => option.value)
        .join(' ');
    }

    if (this.utils.aria.hasRole(role, 'textbox')) {
      return el.textContent;
    }

    if (this.utils.aria.hasRole(role, 'combobox')) {
      const input = this.utils.$('input', el);
      if (input) {
        return input.value;
      }
      return '';
    }

    if (this.utils.aria.hasRole(role, 'listbox')) {
      return this.utils.$$('[aria-selected="true"]', el)
        .map(elm => this.recurse(elm))
        .join(' ');
    }

    if (this.utils.aria.hasRole(role, 'range')) {
      return el.getAttribute('aria-valuetext') || el.getAttribute('aria-valuenow') || '';
    }

    return null;
  }

  // Find the label from the dom
  dom() {
    if (!this.recursion && !nameFromContentRoles(this.utils.config.roles).includes(this.role)) {
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

    if (this.utils.hidden(this.el, { ariaHidden: true })) {
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

},{}],21:[function(require,module,exports){
"use strict";
const ExtendedArray = require('../support/extended-array');

exports.$$ = function $$(selector, context) {
  const root = context || document;
  const els = ExtendedArray.from(root.querySelectorAll(selector));
  if (context && context instanceof Element && context.matches(selector)) {
    els.push(context);
  }
  return els;
};

exports.$ = function $(selector, context) {
  return exports.$$(selector, context)[0];
};

},{"../support/extended-array":13}],22:[function(require,module,exports){
"use strict";
/**
 * A cache of computed style properties
 */
/* eslint-disable class-methods-use-this */
const ElementCache = require('../support/element-cache');

function getStyle(el, name, pseudo) {
  return window.getComputedStyle(el, pseudo ? `::${pseudo}` : null)[name];
}

module.exports = class Style extends ElementCache {
  key(el, name, pseudo) {
    return `${name}~${pseudo}`;
  }

  setter(el, name, pseudo) {
    return getStyle(el, name, pseudo);
  }
};

},{"../support/element-cache":12}]},{},["./rules/aria/allowed-attributes/rule.js","./rules/aria/attribute-values/rule.js","./rules/aria/deprecated-attributes/rule.js","./rules/aria/immutable-role/rule.js","./rules/aria/landmark/one-banner/rule.js","./rules/aria/landmark/one-contentinfo/rule.js","./rules/aria/landmark/one-main/rule.js","./rules/aria/landmark/prefer-main/rule.js","./rules/aria/landmark/required/rule.js","./rules/aria/no-focusable-hidden/rule.js","./rules/aria/no-focusable-role-none/rule.js","./rules/aria/no-none-without-presentation/rule.js","./rules/aria/one-role/rule.js","./rules/aria/roles/rule.js","./rules/aria/unsupported-elements/rule.js","./rules/attributes/data/rule.js","./rules/attributes/no-javascript-handlers/rule.js","./rules/attributes/no-positive-tab-index/rule.js","./rules/colour-contrast/aa/rule.js","./rules/colour-contrast/aaa/rule.js","./rules/details-and-summary/rule.js","./rules/elements/obsolete/rule.js","./rules/elements/unknown/rule.js","./rules/fieldset-and-legend/rule.js","./rules/headings/rule.js","./rules/ids/form-attribute/rule.js","./rules/ids/imagemap-ids/rule.js","./rules/ids/labels-have-inputs/rule.js","./rules/ids/list-id/rule.js","./rules/ids/no-duplicate-anchor-names/rule.js","./rules/ids/unique-id/rule.js","./rules/labels/area/rule.js","./rules/labels/aria-command/rule.js","./rules/labels/controls/rule.js","./rules/labels/group/rule.js","./rules/labels/headings/rule.js","./rules/labels/img/rule.js","./rules/labels/links/rule.js","./rules/labels/tabindex/rule.js","./rules/lang/rule.js","./rules/multiple-in-group/rule.js","./rules/no-button-without-type/rule.js","./rules/no-consecutive-brs/rule.js","./rules/no-empty-select/rule.js","./rules/no-links-as-buttons/rule.js","./rules/no-links-to-missing-fragments/rule.js","./rules/no-multiple-select/rule.js","./rules/no-outside-controls/rule.js","./rules/no-placeholder-links/rule.js","./rules/no-reset/rule.js","./rules/no-unassociated-labels/rule.js","./rules/security/charset/rule.js","./rules/security/target/rule.js","./rules/title/rule.js","./rules","./version",7])(7)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvcnVsZXMvYXJpYS9hbGxvd2VkLWF0dHJpYnV0ZXMvcnVsZS5qcyIsImxpYi9ydWxlcy9hcmlhL2F0dHJpYnV0ZS12YWx1ZXMvcnVsZS5qcyIsImxpYi9ydWxlcy9hcmlhL2RlcHJlY2F0ZWQtYXR0cmlidXRlcy9ydWxlLmpzIiwibGliL3J1bGVzL2FyaWEvaW1tdXRhYmxlLXJvbGUvcnVsZS5qcyIsImxpYi9ydWxlcy9hcmlhL2xhbmRtYXJrL29uZS1iYW5uZXIvcnVsZS5qcyIsImxpYi9ydWxlcy9hcmlhL2xhbmRtYXJrL29uZS1jb250ZW50aW5mby9ydWxlLmpzIiwibGliL3J1bGVzL2FyaWEvbGFuZG1hcmsvb25lLW1haW4vcnVsZS5qcyIsImxpYi9ydWxlcy9hcmlhL2xhbmRtYXJrL3ByZWZlci1tYWluL3J1bGUuanMiLCJsaWIvcnVsZXMvYXJpYS9sYW5kbWFyay9yZXF1aXJlZC9ydWxlLmpzIiwibGliL3J1bGVzL2FyaWEvbm8tZm9jdXNhYmxlLWhpZGRlbi9ydWxlLmpzIiwibGliL3J1bGVzL2FyaWEvbm8tZm9jdXNhYmxlLXJvbGUtbm9uZS9ydWxlLmpzIiwibGliL3J1bGVzL2FyaWEvbm8tbm9uZS13aXRob3V0LXByZXNlbnRhdGlvbi9ydWxlLmpzIiwibGliL3J1bGVzL2FyaWEvb25lLXJvbGUvcnVsZS5qcyIsImxpYi9ydWxlcy9hcmlhL3JvbGVzL3J1bGUuanMiLCJsaWIvcnVsZXMvYXJpYS91bnN1cHBvcnRlZC1lbGVtZW50cy9ydWxlLmpzIiwibGliL3J1bGVzL2F0dHJpYnV0ZXMvZGF0YS9ydWxlLmpzIiwibGliL3J1bGVzL2F0dHJpYnV0ZXMvbm8tamF2YXNjcmlwdC1oYW5kbGVycy9ydWxlLmpzIiwibGliL3J1bGVzL2F0dHJpYnV0ZXMvbm8tcG9zaXRpdmUtdGFiLWluZGV4L3J1bGUuanMiLCJsaWIvcnVsZXMvY29sb3VyLWNvbnRyYXN0L2FhL3J1bGUuanMiLCJsaWIvcnVsZXMvY29sb3VyLWNvbnRyYXN0L2FhYS9ydWxlLmpzIiwibGliL3J1bGVzL2RldGFpbHMtYW5kLXN1bW1hcnkvcnVsZS5qcyIsImxpYi9ydWxlcy9lbGVtZW50cy9vYnNvbGV0ZS9ydWxlLmpzIiwibGliL3J1bGVzL2VsZW1lbnRzL3Vua25vd24vcnVsZS5qcyIsImxpYi9ydWxlcy9maWVsZHNldC1hbmQtbGVnZW5kL3J1bGUuanMiLCJsaWIvcnVsZXMvaGVhZGluZ3MvcnVsZS5qcyIsImxpYi9ydWxlcy9pZHMvZm9ybS1hdHRyaWJ1dGUvcnVsZS5qcyIsImxpYi9ydWxlcy9pZHMvaW1hZ2VtYXAtaWRzL3J1bGUuanMiLCJsaWIvcnVsZXMvaWRzL2xhYmVscy1oYXZlLWlucHV0cy9ydWxlLmpzIiwibGliL3J1bGVzL2lkcy9saXN0LWlkL3J1bGUuanMiLCJsaWIvcnVsZXMvaWRzL25vLWR1cGxpY2F0ZS1hbmNob3ItbmFtZXMvcnVsZS5qcyIsImxpYi9ydWxlcy9pZHMvdW5pcXVlLWlkL3J1bGUuanMiLCJsaWIvcnVsZXMvbGFiZWxzL2FyZWEvcnVsZS5qcyIsImxpYi9ydWxlcy9sYWJlbHMvYXJpYS1jb21tYW5kL3J1bGUuanMiLCJsaWIvcnVsZXMvbGFiZWxzL2NvbnRyb2xzL3J1bGUuanMiLCJsaWIvcnVsZXMvbGFiZWxzL2dyb3VwL3J1bGUuanMiLCJsaWIvcnVsZXMvbGFiZWxzL2hlYWRpbmdzL3J1bGUuanMiLCJsaWIvcnVsZXMvbGFiZWxzL2ltZy9ydWxlLmpzIiwibGliL3J1bGVzL2xhYmVscy9saW5rcy9ydWxlLmpzIiwibGliL3J1bGVzL2xhYmVscy90YWJpbmRleC9ydWxlLmpzIiwibGliL3J1bGVzL2xhbmcvcnVsZS5qcyIsImxpYi9ydWxlcy9tdWx0aXBsZS1pbi1ncm91cC9ydWxlLmpzIiwibGliL3J1bGVzL25vLWJ1dHRvbi13aXRob3V0LXR5cGUvcnVsZS5qcyIsImxpYi9ydWxlcy9uby1jb25zZWN1dGl2ZS1icnMvcnVsZS5qcyIsImxpYi9ydWxlcy9uby1lbXB0eS1zZWxlY3QvcnVsZS5qcyIsImxpYi9ydWxlcy9uby1saW5rcy1hcy1idXR0b25zL3J1bGUuanMiLCJsaWIvcnVsZXMvbm8tbGlua3MtdG8tbWlzc2luZy1mcmFnbWVudHMvcnVsZS5qcyIsImxpYi9ydWxlcy9uby1tdWx0aXBsZS1zZWxlY3QvcnVsZS5qcyIsImxpYi9ydWxlcy9uby1vdXRzaWRlLWNvbnRyb2xzL3J1bGUuanMiLCJsaWIvcnVsZXMvbm8tcGxhY2Vob2xkZXItbGlua3MvcnVsZS5qcyIsImxpYi9ydWxlcy9uby1yZXNldC9ydWxlLmpzIiwibGliL3J1bGVzL25vLXVuYXNzb2NpYXRlZC1sYWJlbHMvcnVsZS5qcyIsImxpYi9ydWxlcy9zZWN1cml0eS9jaGFyc2V0L3J1bGUuanMiLCJsaWIvcnVsZXMvc2VjdXJpdHkvdGFyZ2V0L3J1bGUuanMiLCJsaWIvcnVsZXMvdGl0bGUvcnVsZS5qcyIsImxpYi9fc3RyZWFtXzU0LmpzIiwibGliL19zdHJlYW1fNTUuanMiLCJsaWIvY29uZmlnL2FsbG93ZWQtYXJpYS5qcyIsImxpYi9jb25maWcvYXJpYS1hdHRyaWJ1dGVzLmpzIiwibGliL2NvbmZpZy9lbGVtZW50cy5qcyIsImxpYi9jb25maWcvZXZlbnQtaGFuZGxlci1hdHRyaWJ1dGVzLmpzIiwibGliL2NvbmZpZy9pbmRleC5qcyIsImxpYi9jb25maWcvcm9sZXMuanMiLCJsaWIvbGludGVyLmpzIiwibGliL2xvZ2dlci5qcyIsImxpYi9ydWxlcy9ydWxlLmpzIiwibGliL3J1bm5lci5qcyIsImxpYi9zdXBwb3J0L2NvbnN0YW50cy5qcyIsImxpYi9zdXBwb3J0L2VsZW1lbnQtY2FjaGUuanMiLCJsaWIvc3VwcG9ydC9leHRlbmRlZC1hcnJheS5qcyIsImxpYi9zdXBwb3J0L3NldC1jYWNoZS5qcyIsImxpYi91dGlscy9hcmlhLmpzIiwibGliL3V0aWxzL2NvbnRyYXN0LmpzIiwibGliL3V0aWxzL2Nzc0VzY2FwZS5qcyIsImxpYi91dGlscy9oaWRkZW4uanMiLCJsaWIvdXRpbHMvaW5kZXguanMiLCJsaWIvdXRpbHMvbmFtZS5qcyIsImxpYi91dGlscy9zZWxlY3RvcnMuanMiLCJsaWIvdXRpbHMvc3R5bGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZS5qcycpO1xuXG5jb25zdCBkaXNhYmxlYWJsZSA9IFsnaW5wdXQnLCAnYnV0dG9uJywgJ3NlbGVjdCcsICdvcHRncm91cCcsICd0ZXh0YXJlYScsICdmaWVsZHNldCddOyAvLyBvcHRpb24gZG9lcyBub3QgbmVlZCB0byBiZSBpbmNsdWRlZFxuY29uc3QgcGxhY2Vob2xkZXJhYmxlID0gWydpbnB1dCcsICd0ZXh0YXJlYSddO1xuY29uc3QgcmVxdWlyZWFibGUgPSBbJ2lucHV0JywgJ3NlbGVjdCcsICd0ZXh0YXJlYSddO1xuY29uc3QgcmVhZG9ubHlhYmxlID0gWyd0ZXh0JywgJ3VybCcsICdlbWFpbCddO1xuXG5mdW5jdGlvbiBoYXNDb250ZW50RWRpdGFibGUoZWwpIHtcbiAgcmV0dXJuIGVsLmNvbnRlbnRFZGl0YWJsZSA9PT0gJ3RydWUnIHx8ICgoKGVsLmNsb3Nlc3QoJ1tjb250ZW50ZWRpdGFibGVdJykgfHwge30pLmNvbnRlbnRFZGl0YWJsZSA9PT0gJ3RydWUnKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICcqJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgbGV0IGFyaWFBdHRyaWJ1dGVzID0gQXJyYXkuZnJvbShlbC5hdHRyaWJ1dGVzKVxuICAgICAgLmZpbHRlcigoeyBuYW1lIH0pID0+IG5hbWUuc3RhcnRzV2l0aCgnYXJpYS0nKSlcbiAgICAgIC5tYXAoKHsgbmFtZSB9KSA9PiBuYW1lLnNsaWNlKDUpKTtcblxuICAgIGlmICghYXJpYUF0dHJpYnV0ZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBhbGxvd2VkID0gdXRpbHMuYXJpYS5hbGxvd2VkKGVsKTtcbiAgICBjb25zdCBlcnJvcnMgPSBbXTtcblxuICAgIGFyaWFBdHRyaWJ1dGVzID0gYXJpYUF0dHJpYnV0ZXMuZmlsdGVyKChuYW1lKSA9PiB7XG4gICAgICBpZiAoIXV0aWxzLmNvbmZpZy5hcmlhQXR0cmlidXRlc1tuYW1lXSkge1xuICAgICAgICBlcnJvcnMucHVzaChgYXJpYS0ke25hbWV9IGlzIG5vdCBhIGtub3duIGFyaWEgYXR0cmlidXRlYCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG4gICAgaWYgKGFsbG93ZWQubm9BcmlhKSB7XG4gICAgICBlcnJvcnMucHVzaChgbm8gYXJpYSBhdHRyaWJ1dGVzIGFyZSBhbGxvd2VkIG9uIGVsZW1lbnQuIEZvdW5kICR7YXJpYUF0dHJpYnV0ZXMubWFwKG5hbWUgPT4gYGFyaWEtJHtuYW1lfWApLmpvaW4oJywgJyl9YCk7XG4gICAgICByZXR1cm4gZXJyb3JzO1xuICAgIH1cblxuICAgIGNvbnN0IHJvbGUgPSB1dGlscy5hcmlhLmdldFJvbGUoZWwsIGFsbG93ZWQpO1xuXG4gICAgaWYgKFsnbm9uZScsICdwcmVzZW50YXRpb24nXS5pbmNsdWRlcyhyb2xlKSkge1xuICAgICAgZXJyb3JzLnB1c2goYG5vIGFyaWEgYXR0cmlidXRlcyBzaG91bGQgYmUgYWRkZWQgZm9yIGEgcm9sZSBvZiAke3JvbGV9LiBGb3VuZCAke2FyaWFBdHRyaWJ1dGVzLm1hcChuYW1lID0+IGBhcmlhLSR7bmFtZX1gKS5qb2luKCcsICcpfWApO1xuICAgICAgcmV0dXJuIGVycm9ycztcbiAgICB9XG5cbiAgICBjb25zdCBub2RlTmFtZSA9IGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICBpZiAoYXJpYUF0dHJpYnV0ZXMuaW5jbHVkZXMoJ2Rpc2FibGVkJykgJiYgZGlzYWJsZWFibGUuaW5jbHVkZXMobm9kZU5hbWUpKSB7XG4gICAgICBlcnJvcnMucHVzaCgnZG8gbm90IGluY2x1ZGUgYXJpYS1kaXNhYmxlZCBvbiBlbGVtZW50cyB3aXRoIGEgbmF0aXZlIGRpc2FibGVkIGF0dHJpYnV0ZScpO1xuICAgIH1cblxuICAgIGlmIChhcmlhQXR0cmlidXRlcy5pbmNsdWRlcygnaGlkZGVuJykgJiYgZWwuaGlkZGVuKSB7XG4gICAgICBlcnJvcnMucHVzaCgnZG8gbm90IGluY2x1ZGUgYXJpYS1oaWRkZW4gb24gZWxlbWVudHMgd2l0aCBhIGhpZGRlbiBhdHRyaWJ1dGUnKTtcbiAgICB9XG5cbiAgICAvLyBmaWx0ZXIgZ2xvYmFsXG4gICAgYXJpYUF0dHJpYnV0ZXMgPSBhcmlhQXR0cmlidXRlc1xuICAgICAgLmZpbHRlcihuYW1lID0+ICEodXRpbHMuY29uZmlnLmFyaWFBdHRyaWJ1dGVzW25hbWVdIHx8IHt9KS5nbG9iYWwpO1xuXG4gICAgLy8gZmlsdGVyIGRpc2FsbG93ZWRcbiAgICBjb25zdCBhbGxvd3NSb2xlQXR0cmlidXRlcyA9IGFsbG93ZWQucm9sZXMgPT09ICcqJ1xuICAgICAgfHwgYWxsb3dlZC5yb2xlcy5pbmNsdWRlcyhyb2xlKVxuICAgICAgfHwgKGFsbG93ZWQuYXJpYUZvckltcGxpY2l0ICYmIGFsbG93ZWQuaW1wbGljaXQuaW5jbHVkZXMocm9sZSkpO1xuICAgIGNvbnN0IHJvbGVDb25maWcgPSB1dGlscy5jb25maWcucm9sZXNbcm9sZV07XG4gICAgYXJpYUF0dHJpYnV0ZXMgPSBhcmlhQXR0cmlidXRlc1xuICAgICAgLmZpbHRlcigobmFtZSkgPT4ge1xuICAgICAgICBpZiAoYWxsb3dzUm9sZUF0dHJpYnV0ZXMgJiYgcm9sZUNvbmZpZyAmJiByb2xlQ29uZmlnLmFsbG93ZWQuaW5jbHVkZXMobmFtZSkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlcnJvcnMucHVzaChgYXJpYS0ke25hbWV9IGlzIG5vdCBhbGxvd2VkIG9uIHRoaXMgZWxlbWVudGApO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcblxuICAgIGlmIChhcmlhQXR0cmlidXRlcy5pbmNsdWRlcygncmVhZG9ubHknKSkge1xuICAgICAgaWYgKGVsLmdldEF0dHJpYnV0ZSgnYXJpYS1yZWFkb25seScpID09PSAndHJ1ZScgJiYgaGFzQ29udGVudEVkaXRhYmxlKGVsKSkge1xuICAgICAgICBlcnJvcnMucHVzaCgnZG8gbm90IGluY2x1ZGUgYXJpYS1yZWFkb25seT1cInRydWVcIiBvbiBlbGVtZW50cyB3aXRoIGNvbnRlbnRlZGl0YWJsZScpO1xuICAgICAgfVxuXG4gICAgICBpZiAobm9kZU5hbWUgPT09ICd0ZXh0YXJlYScgfHwgKG5vZGVOYW1lID09PSAnaW5wdXQnICYmIHJlYWRvbmx5YWJsZS5pbmNsdWRlcyhlbC50eXBlKSkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goJ2RvIG5vdCBpbmNsdWRlIGFyaWEtcmVhZG9ubHkgb24gZWxlbWVudHMgd2l0aCBhIG5hdGl2ZSByZWFkb25seSBhdHRyaWJ1dGUnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYXJpYUF0dHJpYnV0ZXMuaW5jbHVkZXMoJ3BsYWNlaG9sZGVyJykgJiYgcGxhY2Vob2xkZXJhYmxlLmluY2x1ZGVzKG5vZGVOYW1lKSkge1xuICAgICAgZXJyb3JzLnB1c2goJ2RvIG5vdCBpbmNsdWRlIGFyaWEtcGxhY2Vob2xkZXIgb24gZWxlbWVudHMgd2l0aCBhIG5hdGl2ZSBwbGFjZWhvbGRlciBhdHRyaWJ1dGUnKTtcbiAgICB9XG5cbiAgICBpZiAoYXJpYUF0dHJpYnV0ZXMuaW5jbHVkZXMoJ3JlcXVpcmVkJylcbiAgICAgICYmIHJlcXVpcmVhYmxlLmluY2x1ZGVzKG5vZGVOYW1lKVxuICAgICAgJiYgZWwucmVxdWlyZWRcbiAgICAgICYmIGVsLmdldEF0dHJpYnV0ZSgnYXJpYS1yZXF1aXJlZCcpID09PSAnZmFsc2UnKSB7XG4gICAgICBlcnJvcnMucHVzaCgnZG8gbm90IHNldCBhcmlhLXJlcXVpcmVkIHRvIGZhbHNlIGlmIHRoZSByZXF1aXJlZCBhdHRyaWJ1dGUgaXMgc2V0Jyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVycm9ycztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcbmNvbnN0IEV4dGVuZGVkQXJyYXkgPSByZXF1aXJlKCcuLi8uLi8uLi9zdXBwb3J0L2V4dGVuZGVkLWFycmF5Jyk7XG5jb25zdCB7IHJTcGFjZSB9ID0gcmVxdWlyZSgnLi4vLi4vLi4vc3VwcG9ydC9jb25zdGFudHMnKTtcblxuY29uc3QgY2hlY2tlcnMgPSB7XG4gIHN0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiAhdmFsdWUudHJpbSgpID8gJ211c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyA6IG51bGw7XG4gIH0sXG5cbiAgaW50ZWdlcih2YWx1ZSkge1xuICAgIHJldHVybiAvXi0/XFxkKyQvLnRlc3QodmFsdWUpID8gbnVsbCA6ICdtdXN0IGJlIGFuIGludGVnZXInO1xuICB9LFxuXG4gIG51bWJlcih2YWx1ZSkge1xuICAgIC8vIEFsdGhvdWdoIG5vdCBlbnRpcmVseSBjbGVhciwgbGV0IHVzIGFzc3VtZSB0aGUgbnVtYmVyIGZvbGxvd3MgdGhlIGh0bWw1IHNwZWNpZmljYXRpb25cbiAgICByZXR1cm4gL14tPyg/OlxcZCtcXC5cXGQrfFxcZCt8XFwuXFxkKykoPzpbZUVdWystXT9cXGQrKT8kLy50ZXN0KHZhbHVlKSA/IG51bGwgOiAnbXVzdCBiZSBhIGZsb2F0aW5nIHBvaW50IG51bWJlcic7XG4gIH0sXG5cbiAgdG9rZW4odmFsdWUsIHsgdG9rZW5zIH0pIHtcbiAgICByZXR1cm4gdG9rZW5zLmluY2x1ZGVzKHZhbHVlKSA/IG51bGwgOiBgbXVzdCBiZSBvbmUgb2Y6ICR7dG9rZW5zLmpvaW4oJywgJyl9YDtcbiAgfSxcblxuICB0b2tlbmxpc3QodmFsdWUsIHsgdG9rZW5zLCBhbG9uZSB9KSB7XG4gICAgY29uc3QgdmFsdWVzID0gdmFsdWUuc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgY29uc3QgdW5rbm93biA9IHZhbHVlcy5maWx0ZXIodG9rZW4gPT4gIXRva2Vucy5pbmNsdWRlcyh0b2tlbikpO1xuICAgIGlmICh2YWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYG11c3QgYmUgb25lIG9yIG1vcmUgb2Y6ICR7dG9rZW5zLmpvaW4oJywgJyl9YDtcbiAgICB9XG4gICAgaWYgKHVua25vd24ubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gYGNvbnRhaW5zIHVua25vd24gdmFsdWVzOiAke3Vua25vd24uam9pbignLCAnKX1gO1xuICAgIH1cbiAgICBpZiAoYWxvbmUgJiYgdmFsdWVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnN0IGFsb25lcyA9IHZhbHVlcy5maWx0ZXIodG9rZW4gPT4gYWxvbmUuaW5jbHVkZXModG9rZW4pKTtcbiAgICAgIGlmIChhbG9uZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBgc2hvdWxkIG9ubHkgY29udGFpbiB0aGUgZm9sbG93aW5nIHZhbHVlcyBvbiB0aGVpciBvd246ICR7YWxvbmVzLmpvaW4oJywgJyl9YDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG5cbiAgaWQodmFsdWUpIHtcbiAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgcmV0dXJuICdtdXN0IGJlIGFuIGVsZW1lbnQgaWQnO1xuICAgIH1cblxuICAgIGlmIChyU3BhY2UudGVzdCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiAnbXVzdCBub3QgY29udGFpbiBzcGFjZXMnO1xuICAgIH1cblxuICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh2YWx1ZSkgPyBudWxsIDogYG5vIGVsZW1lbnQgY2FuIGJlIGZvdW5kIHdpdGggYW4gaWQgb2YgJHt2YWx1ZX1gO1xuICB9LFxuXG4gIGlkbGlzdCh2YWx1ZSkge1xuICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICByZXR1cm4gJ211c3QgYmUgYSBsaXN0IG9mIG9uZSBvZiBtb3JlIGlkcyc7XG4gICAgfVxuICAgIGNvbnN0IG1pc3NpbmcgPSB2YWx1ZS5zcGxpdChyU3BhY2UpLmZpbHRlcihpZCA9PiAhZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpKTtcbiAgICBpZiAoIW1pc3NpbmcubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIG1pc3NpbmcubWFwKGlkID0+IGBubyBlbGVtZW50IGNhbiBiZSBmb3VuZCB3aXRoIGFuIGlkIG9mICR7aWR9YCk7XG4gIH0sXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKHV0aWxzKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdG9yIHx8ICh0aGlzLl9zZWxlY3RvciA9IE9iamVjdC5rZXlzKHV0aWxzLmNvbmZpZy5hcmlhQXR0cmlidXRlcykubWFwKG5hbWUgPT4gYFthcmlhLSR7bmFtZX1dYCkuam9pbignLCcpKTtcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgcmV0dXJuIEV4dGVuZGVkQXJyYXkuZnJvbShlbC5hdHRyaWJ1dGVzKVxuICAgICAgLm1hcCgoeyBuYW1lLCB2YWx1ZSB9KSA9PiB7XG4gICAgICAgIGlmICghbmFtZS5zdGFydHNXaXRoKCdhcmlhLScpKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbmFtZSA9IG5hbWUuc2xpY2UoNSk7XG4gICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdXRpbHMuY29uZmlnLmFyaWFBdHRyaWJ1dGVzW25hbWVdO1xuICAgICAgICBpZiAoIWRlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBFeHRlbmRlZEFycmF5KClcbiAgICAgICAgICAuY29uY2F0KGNoZWNrZXJzW2Rlc2NyaXB0aW9uLnZhbHVlcy50eXBlXSh2YWx1ZSwgZGVzY3JpcHRpb24udmFsdWVzKSlcbiAgICAgICAgICAuY29tcGFjdCgpXG4gICAgICAgICAgLm1hcChtZXNzYWdlID0+IGBhcmlhLSR7bmFtZX0gJHttZXNzYWdlfWApO1xuICAgICAgfSlcbiAgICAgIC5jb21wYWN0KClcbiAgICAgIC5mbGF0dGVuKCk7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgZGVwcmVjYXRlZCh1dGlscykge1xuICAgIHJldHVybiB0aGlzLl9kZXByZWNhdGVkIHx8ICh0aGlzLl9kZXByZWNhdGVkID0gT2JqZWN0LmVudHJpZXModXRpbHMuY29uZmlnLmFyaWFBdHRyaWJ1dGVzKVxuICAgICAgLmZpbHRlcigoWywgdmFsdWVdKSA9PiB2YWx1ZS5kZXByZWNhdGVkKVxuICAgICAgLm1hcCgoW25hbWVdKSA9PiBgYXJpYS0ke25hbWV9YCkpO1xuICB9XG5cbiAgc2VsZWN0b3IodXRpbHMpIHtcbiAgICByZXR1cm4gdGhpcy5kZXByZWNhdGVkKHV0aWxzKS5tYXAobmFtZSA9PiBgWyR7bmFtZX1dYCkuam9pbignLCcpO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShlbC5hdHRyaWJ1dGVzKVxuICAgICAgLmZpbHRlcigoeyBuYW1lIH0pID0+IHRoaXMuZGVwcmVjYXRlZCh1dGlscykuaW5jbHVkZXMobmFtZSkpXG4gICAgICAubWFwKCh7IG5hbWUgfSkgPT4gYCR7bmFtZX0gaXMgZGVwcmVjYXRlZGApO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIGNvbnN0cnVjdG9yKHNldHRpbmdzKSB7XG4gICAgc3VwZXIoc2V0dGluZ3MpO1xuICAgIHRoaXMuaGlzdG9yeSA9IG5ldyBXZWFrTWFwKCk7XG4gIH1cblxuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ1tyb2xlXSc7XG4gIH1cblxuICB0ZXN0KGVsKSB7XG4gICAgY29uc3Qgcm9sZSA9IGVsLmdldEF0dHJpYnV0ZSgncm9sZScpO1xuICAgIGlmICh0aGlzLmhpc3RvcnkuaGFzKGVsKSkge1xuICAgICAgaWYgKHRoaXMuaGlzdG9yeS5nZXQoZWwpICE9PSByb2xlKSB7XG4gICAgICAgIHJldHVybiAnYW4gZWxlbWVudHMgcm9sZSBtdXN0IG5vdCBiZSBtb2RpZmllZCc7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaGlzdG9yeS5zZXQoZWwsIHJvbGUpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2hlYWRlcixbcm9sZX49YmFubmVyXSc7XG4gIH1cblxuICBnZXQgcm9sZSgpIHtcbiAgICByZXR1cm4gJ2Jhbm5lcic7XG4gIH1cblxuICBnZXQgbWVzc2FnZSgpIHtcbiAgICByZXR1cm4gYHRoZXJlIHNob3VsZCBvbmx5IGJlIG9uZSBlbGVtZW50IHdpdGggYSByb2xlIG9mICR7dGhpcy5yb2xlfSBpbiBlYWNoIGRvY3VtZW50IG9yIGFwcGxpY2F0aW9uYDtcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKCF1dGlscy5hcmlhLmhhc1JvbGUoZWwsIHRoaXMucm9sZSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGZvdW5kID0gdXRpbHMuJCQodGhpcy5zZWxlY3RvcigpKVxuICAgICAgLmZpbHRlcihlbG0gPT4gdXRpbHMuYXJpYS5oYXNSb2xlKGVsbSwgdGhpcy5yb2xlKSlcbiAgICAgIC5ncm91cEJ5KGVsbSA9PiB1dGlscy5hcmlhLmNsb3Nlc3RSb2xlKGVsbSwgWydhcHBsaWNhdGlvbicsICdkb2N1bWVudCddKSlcbiAgICAgIC5maWx0ZXIoZ3JvdXAgPT4gZ3JvdXAuaW5jbHVkZXMoZWwpKVxuICAgICAgLmZsYXR0ZW4oKTtcblxuICAgIGlmIChmb3VuZC5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXNzYWdlO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBCYW5uZXJSdWxlID0gcmVxdWlyZSgnLi4vb25lLWJhbm5lci9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBCYW5uZXJSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdmb290ZXIsW3JvbGV+PWNvbnRlbnRpbmZvXSc7XG4gIH1cblxuICBnZXQgcm9sZSgpIHtcbiAgICByZXR1cm4gJ2NvbnRlbnRpbmZvJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgQmFubmVyUnVsZSA9IHJlcXVpcmUoJy4uL29uZS1iYW5uZXIvcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgQmFubmVyUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnbWFpbixbcm9sZX49bWFpbl0nO1xuICB9XG5cbiAgZ2V0IHJvbGUoKSB7XG4gICAgcmV0dXJuICdtYWluJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJzpub3QobWFpbilbcm9sZX49bWFpbl0nO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAoIXV0aWxzLmFyaWEuaGFzUm9sZShlbCwgJ21haW4nKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuICd1c2UgYSBtYWluIGVsZW1lbnQgZm9yIHJvbGU9bWFpbic7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi8uLi9ydWxlLmpzJyk7XG5cbmZ1bmN0aW9uIGhhc0xhbmRtYXJrKG5vZGVOYW1lLCByb2xlLCB1dGlscykge1xuICByZXR1cm4gdXRpbHMuJCQoYCR7bm9kZU5hbWV9LFtyb2xlfj0ke3JvbGV9XWAsIGRvY3VtZW50LmJvZHkpXG4gICAgLmZpbHRlcihlbCA9PiAhdXRpbHMuaGlkZGVuKGVsKSlcbiAgICAuZmlsdGVyKGVsID0+IHV0aWxzLmFyaWEuaGFzUm9sZShlbCwgcm9sZSkpXG4gICAgLmZpbHRlcihlbCA9PiB1dGlscy5hcmlhLmNsb3Nlc3RSb2xlKGVsLCBbJ2RvY3VtZW50JywgJ2FwcGxpY2F0aW9uJ10pID09PSBkb2N1bWVudC5ib2R5KVxuICAgIC5maWx0ZXIoZWwgPT4gZWwuaW5uZXJUZXh0KVxuICAgIC5sZW5ndGggPiAwO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnYm9keSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgaWYgKCFoYXNMYW5kbWFyaygnbWFpbicsICdtYWluJywgdXRpbHMpKSB7XG4gICAgICBlcnJvcnMucHVzaCgnZG9jdW1lbnQgc2hvdWxkIGhhdmUgYSA8bWFpbj4nKTtcbiAgICB9XG5cbiAgICBpZiAoIWhhc0xhbmRtYXJrKCdoZWFkZXInLCAnYmFubmVyJywgdXRpbHMpKSB7XG4gICAgICBlcnJvcnMucHVzaCgnZG9jdW1lbnQgc2hvdWxkIGhhdmUgYSA8aGVhZGVyPicpO1xuICAgIH1cblxuICAgIGlmICghaGFzTGFuZG1hcmsoJ2Zvb3RlcicsICdjb250ZW50aW5mbycsIHV0aWxzKSkge1xuICAgICAgZXJyb3JzLnB1c2goJ2RvY3VtZW50IHNob3VsZCBoYXZlIGEgPGZvb3Rlcj4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXJyb3JzO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuXG5jb25zdCBmb2N1c2FibGUgPSBbJ2J1dHRvbjpub3QoOmRpc2FibGVkKScsICdpbnB1dDpub3QoW3R5cGU9XCJoaWRkZW5cIl0pOm5vdCg6ZGlzYWJsZWQpJywgJ3NlbGVjdDpub3QoOmRpc2FibGVkKScsICd0ZXh0YXJlYTpub3QoOmRpc2FibGVkKScsICdhW2hyZWZdJywgJ2FyZWFbaHJlZl0nLCAnW3RhYmluZGV4XSddO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RvciB8fCAodGhpcy5fc2VsZWN0b3IgPSBmb2N1c2FibGUubWFwKHNlbGVjdG9yID0+IGAke3NlbGVjdG9yfVthcmlhLWhpZGRlbj1cInRydWVcIl1gKS5qb2luKCcsJykpO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAoZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2FyZWEnIHx8ICF1dGlscy5oaWRkZW4oZWwpKSB7XG4gICAgICByZXR1cm4gJ2RvIG5vdCBtYXJrIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoIGBhcmlhLWhpZGRlbj1cInRydWVcImAnO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxuY29uc3QgZm9jdXNhYmxlID0gJ2J1dHRvbixpbnB1dDpub3QoW3R5cGU9XCJoaWRkZW5cIl0pLG1ldGVyLG91dHB1dCxwcm9ncmVzcyxzZWxlY3QsdGV4dGFyZWEsYVtocmVmXSxhcmVhW2hyZWZdLFt0YWJpbmRleF0nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnW3JvbGV+PW5vbmVdLFtyb2xlfj1wcmVzZW50YXRpb25dJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKGVsLm1hdGNoZXMoZm9jdXNhYmxlKSAmJiB1dGlscy5hcmlhLmhhc1JvbGUoZWwsIFsnbm9uZScsICdwcmVzZW50YXRpb24nXSkpIHtcbiAgICAgIHJldHVybiAnZG8gbm90IG1hcmsgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGggYSByb2xlIG9mIHByZXNlbnRhdGlvbiBvciBub25lJztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdbcm9sZT1cIm5vbmVcIl0nO1xuICB9XG5cbiAgdGVzdCgpIHtcbiAgICByZXR1cm4gJ3VzZSBhIHJvbGUgb2YgXCJub25lIHByZXNlbnRhdGlvblwiIHRvIHN1cHBvcnQgb2xkZXIgdXNlci1hZ2VudHMnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuY29uc3QgeyByU3BhY2UgfSA9IHJlcXVpcmUoJy4uLy4uLy4uL3N1cHBvcnQvY29uc3RhbnRzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdbcm9sZV0nO1xuICB9XG5cbiAgdGVzdChlbCkge1xuICAgIGNvbnN0IHJvbGVzID0gZWwuZ2V0QXR0cmlidXRlKCdyb2xlJykuc3BsaXQoclNwYWNlKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgaWYgKHJvbGVzLmpvaW4oJyAnKSA9PT0gJ25vbmUgcHJlc2VudGF0aW9uJykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHJvbGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiAnZG8gbm90IGFkZCBtdWx0aXBsZSByb2xlcyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5jb25zdCB7IHJTcGFjZSB9ID0gcmVxdWlyZSgnLi4vLi4vLi4vc3VwcG9ydC9jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gaXNTdXBwb3J0ZWQoZWwsIHV0aWxzKSB7XG4gIHJldHVybiAhKHV0aWxzLmNvbmZpZy5lbGVtZW50c1tlbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXSB8fCB7fSkudW5zdXBwb3J0ZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdbcm9sZV0nO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBjb25zdCByb2xlID0gZWwuZ2V0QXR0cmlidXRlKCdyb2xlJykudHJpbSgpO1xuICAgIGlmICghcm9sZSkge1xuICAgICAgcmV0dXJuICdyb2xlIGF0dHJpYnV0ZSBzaG91bGQgbm90IGJlIGVtcHR5JztcbiAgICB9XG5cbiAgICBsZXQgZXJyb3I7XG4gICAgY29uc3QgYWxsb3dlZCA9IHV0aWxzLmFyaWEuYWxsb3dlZChlbCk7XG4gICAgY29uc3Qgc3VwcG9ydGVkID0gaXNTdXBwb3J0ZWQoZWwsIHV0aWxzKTtcblxuICAgIHJvbGUuc3BsaXQoclNwYWNlKS5zb21lKChuYW1lKSA9PiB7XG4gICAgICBpZiAoIXV0aWxzLmNvbmZpZy5yb2xlc1tuYW1lXSkge1xuICAgICAgICBlcnJvciA9IGByb2xlIFwiJHtuYW1lfVwiIGlzIG5vdCBhIGtub3duIHJvbGVgO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHV0aWxzLmNvbmZpZy5yb2xlc1tuYW1lXS5hYnN0cmFjdCkge1xuICAgICAgICBlcnJvciA9IGByb2xlIFwiJHtuYW1lfVwiIGlzIGFuIGFic3RyYWN0IHJvbGUgYW5kIHNob3VsZCBub3QgYmUgdXNlZGA7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3VwcG9ydGVkICYmIGFsbG93ZWQuaW1wbGljaXQuaW5jbHVkZXMobmFtZSkpIHtcbiAgICAgICAgZXJyb3IgPSBgcm9sZSBcIiR7bmFtZX1cIiBpcyBpbXBsaWNpdCBmb3IgdGhpcyBlbGVtZW50IGFuZCBzaG91bGQgbm90IGJlIHNwZWNpZmllZGA7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoYWxsb3dlZC5yb2xlcyA9PT0gJyonKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWFsbG93ZWQucm9sZXMuaW5jbHVkZXMobmFtZSkgJiYgKHN1cHBvcnRlZCB8fCAhYWxsb3dlZC5pbXBsaWNpdC5pbmNsdWRlcyhuYW1lKSkpIHtcbiAgICAgICAgZXJyb3IgPSBgcm9sZSBcIiR7bmFtZX1cIiBpcyBub3QgYWxsb3dlZCBmb3IgdGhpcyBlbGVtZW50YDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZXJyb3I7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IodXRpbHMpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0b3IgfHwgKHRoaXMuX3NlbGVjdG9yID0gQXJyYXkuZnJvbShPYmplY3QuZW50cmllcyh1dGlscy5jb25maWcuZWxlbWVudHMpKVxuICAgICAgLmZpbHRlcigoWywgeyB1bnN1cHBvcnRlZCB9XSkgPT4gdW5zdXBwb3J0ZWQpXG4gICAgICAubWFwKChbbmFtZV0pID0+IGAke25hbWV9Om5vdChbcm9sZV0pYClcbiAgICAgIC5qb2luKCcsJykpO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBjb25zdCBhbGxvd2VkID0gdXRpbHMuYXJpYS5hbGxvd2VkKGVsKTtcbiAgICBpZiAoIWFsbG93ZWQuaW1wbGljaXQubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gJ2VsZW1lbnQgc2hvdWxkIGhhdmUgYSByb2xlIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdbZGF0YV0sW2RhdGEtXSc7XG4gIH1cblxuICB0ZXN0KCkge1xuICAgIHJldHVybiAnZGF0YSBpcyBhbiBhdHRyaWJ1dGUgcHJlZml4JztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3Rvcih1dGlscykge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RvclxuICAgICAgfHwgKHRoaXMuX3NlbGVjdG9yID0gdXRpbHMuY29uZmlnLmF0dHJpYnV0ZXMuZXZlbnRIYW5kbGVyQXR0cmlidXRlcy5tYXAobmFtZSA9PiBgWyR7bmFtZX1dYCkuam9pbignLCcpKTtcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgY29uc3QgaGFuZGxlcnMgPSBBcnJheS5mcm9tKGVsLmF0dHJpYnV0ZXMpXG4gICAgICAuZmlsdGVyKCh7IG5hbWUgfSkgPT4gdXRpbHMuY29uZmlnLmF0dHJpYnV0ZXMuZXZlbnRIYW5kbGVyQXR0cmlidXRlcy5pbmNsdWRlcyhuYW1lKSlcbiAgICAgIC5tYXAoKHsgbmFtZSB9KSA9PiBuYW1lKTtcblxuICAgIHJldHVybiBgZG8gbm90IHVzZSBldmVudCBoYW5kbGVyIGF0dHJpYnV0ZXMuIEZvdW5kOiAke2hhbmRsZXJzLmpvaW4oJywgJyl9YDtcbiAgfVxufTtcblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnW3RhYmluZGV4XSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmIChlbC50YWJJbmRleCA8PSAwIHx8IHV0aWxzLmhpZGRlbihlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiAnbm8gdGFiaW5kZXggZ3JlYXRlciB0aGFuIDAnO1xuICB9XG59O1xuXG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5jb25zdCBFeHRlbmRlZEFycmF5ID0gcmVxdWlyZSgnLi4vLi4vLi4vc3VwcG9ydC9leHRlbmRlZC1hcnJheScpO1xuXG4vKipcbiAqICBDaGVjayB0aGUgY29sb3VyIGNvbnRyYXN0IGZvciBhbGwgdmlzaWJsZSBub2RlcyB3aXRoIGNoaWxkIHRleHQgbm9kZXNcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZXREZWZhdWx0cygpIHtcbiAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1pbiA9IDQuNTtcbiAgICB0aGlzLm1pbkxhcmdlID0gMztcbiAgfVxuXG4gIHJ1bihjb250ZXh0LCBmaWx0ZXIgPSAoKSA9PiB0cnVlLCB1dGlscykge1xuICAgIHJldHVybiB0aGlzLml0ZXJhdGUoY29udGV4dCwgdXRpbHMsIGZhbHNlKVxuICAgICAgLmZpbHRlcihmaWx0ZXIpXG4gICAgICAubWFwKGVsID0+IHRoaXMuZmluZEFuY2VzdG9yKGVsLCB1dGlscykpXG4gICAgICAudW5pcXVlKClcbiAgICAgIC5maWx0ZXIoZmlsdGVyKVxuICAgICAgLm1hcChlbCA9PiBbZWwsIHRoaXMudGVzdChlbCwgdXRpbHMpXSlcbiAgICAgIC5maWx0ZXIoKFssIHJhdGlvXSkgPT4gcmF0aW8pXG4gICAgICAubWFwKChbZWwsIHJhdGlvXSkgPT4gdGhpcy5tZXNzYWdlKGVsLCByYXRpbykpO1xuICB9XG5cbiAgaXRlcmF0ZShub2RlLCB1dGlscywgaXRlcmF0ZVNpYmxpbmdzKSB7XG4gICAgbGV0IGZvdW5kID0gbmV3IEV4dGVuZGVkQXJyYXkoKTtcbiAgICBsZXQgY3Vyc29yID0gbm9kZTtcbiAgICB3aGlsZSAoY3Vyc29yKSB7XG4gICAgICBpZiAoIXV0aWxzLmhpZGRlbihjdXJzb3IsIHsgbm9BcmlhOiB0cnVlIH0pKSB7XG4gICAgICAgIGlmICh0aGlzLmhhc1RleHROb2RlKGN1cnNvcikpIHtcbiAgICAgICAgICBmb3VuZC5wdXNoKGN1cnNvcik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY3Vyc29yLmZpcnN0RWxlbWVudENoaWxkKSB7XG4gICAgICAgICAgZm91bmQgPSBmb3VuZC5jb25jYXQodGhpcy5pdGVyYXRlKGN1cnNvci5maXJzdEVsZW1lbnRDaGlsZCwgdXRpbHMsIHRydWUpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXRlcmF0ZVNpYmxpbmdzKSB7XG4gICAgICAgIGN1cnNvciA9IGN1cnNvci5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjdXJzb3IgPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmb3VuZDtcbiAgfVxuXG4gIC8vIERvZXMgdGhlIGVsZW1lbnQgaGF2ZSBhIHRleHQgbm9kZSB3aXRoIGNvbnRlbnRcbiAgaGFzVGV4dE5vZGUoZWwpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShlbC5jaGlsZE5vZGVzKVxuICAgICAgLmZpbHRlcihub2RlID0+IG5vZGUubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKVxuICAgICAgLnNvbWUobm9kZSA9PiBub2RlLmRhdGEudHJpbSgpKTtcbiAgfVxuXG4gIC8vIEZpbmQgdGhlIGxhc3QgYW5jZXN0b3Igb3Igc2VsZiB3aXRoIHRoZSBzYW1lIGNvbG91cnNcbiAgZmluZEFuY2VzdG9yKGVsLCB1dGlscykge1xuICAgIGNvbnN0IGNvbG91ciA9IHV0aWxzLmNvbnRyYXN0LnRleHRDb2xvdXIoZWwpO1xuICAgIGNvbnN0IGJhY2tncm91bmRDb2xvdXIgPSB1dGlscy5jb250cmFzdC5iYWNrZ3JvdW5kQ29sb3VyKGVsKTtcblxuICAgIGxldCBjdXJzb3IgPSBlbDtcbiAgICB3aGlsZSAoY3Vyc29yLnBhcmVudE5vZGUgIT09IGRvY3VtZW50KSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSBjdXJzb3IucGFyZW50Tm9kZTtcbiAgICAgIGlmICh1dGlscy5jb250cmFzdC50ZXh0Q29sb3VyKHBhcmVudCkgIT09IGNvbG91clxuICAgICAgICAmJiB1dGlscy5jb250cmFzdC5iYWNrZ3JvdW5kQ29sb3VyKHBhcmVudCkgIT09IGJhY2tncm91bmRDb2xvdXIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjdXJzb3IgPSBwYXJlbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1cnNvcjtcbiAgfVxuXG4gIC8vIERvZXMgdGhlIGVsZW1lbnQgbWVldCBBQUEgb3IgQUEgc3RhbmRhcmRzXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgY29uc3QgcmF0aW8gPSBwYXJzZUZsb2F0KHV0aWxzLmNvbnRyYXN0LnRleHRDb250cmFzdChlbCkudG9GaXhlZCgyKSk7XG5cbiAgICBpZiAocmF0aW8gPj0gdGhpcy5taW4pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGZvbnRTaXplID0gcGFyc2VGbG9hdCh1dGlscy5zdHlsZShlbCwgJ2ZvbnRTaXplJykpO1xuICAgIGxldCBmb250V2VpZ2h0ID0gdXRpbHMuc3R5bGUoZWwsICdmb250V2VpZ2h0Jyk7XG4gICAgaWYgKGZvbnRXZWlnaHQgPT09ICdib2xkJykge1xuICAgICAgZm9udFdlaWdodCA9IDcwMDtcbiAgICB9IGVsc2UgaWYgKGZvbnRXZWlnaHQgPT09ICdub3JtYWwnKSB7XG4gICAgICBmb250V2VpZ2h0ID0gNDAwO1xuICAgIH1cbiAgICBjb25zdCBsYXJnZSA9IGZvbnRTaXplID49IDI0IC8qIDE4cHQgKi8gfHwgKGZvbnRTaXplID49IDE4LjY2IC8qIDE0cHQgKi8gJiYgZm9udFdlaWdodCA+PSA3MDApO1xuXG4gICAgaWYgKGxhcmdlICYmIHJhdGlvID49IHRoaXMubWluTGFyZ2UpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiByYXRpbztcbiAgfVxuXG4gIG1lc3NhZ2UoZWwsIHJhdGlvKSB7XG4gICAgcmV0dXJuIHsgZWwsIG1lc3NhZ2U6IGBjb250cmFzdCBpcyB0b28gbG93ICR7cGFyc2VGbG9hdChyYXRpby50b0ZpeGVkKDIpKX06MWAgfTtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgQ29sb3VyQ29udHJhc3RBQVJ1bGUgPSByZXF1aXJlKCcuLi9hYS9ydWxlLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBDb2xvdXJDb250cmFzdEFBUnVsZSB7XG4gIHNldERlZmF1bHRzKCkge1xuICAgIHRoaXMubWluID0gNztcbiAgICB0aGlzLm1pbkxhcmdlID0gNC41O1xuICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBGaWVsZHNldFJ1bGUgPSByZXF1aXJlKCcuLi9maWVsZHNldC1hbmQtbGVnZW5kL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIEZpZWxkc2V0UnVsZSB7XG4gIGdldCBwYXJlbnQoKSB7XG4gICAgcmV0dXJuICdkZXRhaWxzJztcbiAgfVxuXG4gIGdldCBjaGlsZCgpIHtcbiAgICByZXR1cm4gJ3N1bW1hcnknO1xuICB9XG5cbiAgaXNIaWRkZW4oZWwsIHV0aWxzKSB7XG4gICAgLy8gc3VtbWFyeSB3aWxsIGJlIGhpZGRlbiBpZiBkZXRhaWxzIGlzIG5vdCBvcGVuXG4gICAgcmV0dXJuIGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgIT09ICdzdW1tYXJ5JyAmJiB1dGlscy5oaWRkZW4oZWwpO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKHsgY29uZmlnIH0pIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0b3IgfHwgKHRoaXMuX3NlbGVjdG9yID0gT2JqZWN0LmtleXMoY29uZmlnLmVsZW1lbnRzKS5maWx0ZXIoZWwgPT4gY29uZmlnLmVsZW1lbnRzW2VsXS5vYnNvbGV0ZSkuam9pbignLCcpKTtcbiAgfVxuXG4gIHRlc3QoKSB7XG4gICAgcmV0dXJuICdkbyBub3QgdXNlIG9ic29sZXRlIGVsZW1lbnRzJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3Rvcih7IGNvbmZpZyB9KSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdG9yIHx8ICh0aGlzLl9zZWxlY3RvciA9IE9iamVjdC5rZXlzKGNvbmZpZy5lbGVtZW50cykubWFwKG5hbWUgPT4gYDpub3QoJHtuYW1lfSlgKS5qb2luKCcnKSk7XG4gIH1cblxuICB0ZXN0KGVsKSB7XG4gICAgaWYgKGVsLmNsb3Nlc3QoJ3N2ZyxtYXRoJykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gJ3Vua25vd24gZWxlbWVudCc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi9ydWxlJyk7XG5cbmZ1bmN0aW9uIGdldEZpcnN0Q2hpbGQoZWwpIHtcbiAgbGV0IGN1cnNvciA9IGVsLmZpcnN0Q2hpbGQ7XG4gIHdoaWxlIChjdXJzb3IgaW5zdGFuY2VvZiBUZXh0ICYmICFjdXJzb3IuZGF0YS50cmltKCkpIHtcbiAgICBjdXJzb3IgPSBjdXJzb3IubmV4dFNpYmxpbmc7XG4gIH1cbiAgcmV0dXJuIGN1cnNvcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBnZXQgcGFyZW50KCkge1xuICAgIHJldHVybiAnZmllbGRzZXQnO1xuICB9XG5cbiAgZ2V0IGNoaWxkKCkge1xuICAgIHJldHVybiAnbGVnZW5kJztcbiAgfVxuXG4gIGlzSGlkZGVuKGVsLCB1dGlscykge1xuICAgIHJldHVybiB1dGlscy5oaWRkZW4oZWwpO1xuICB9XG5cbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuIGAke3RoaXMucGFyZW50fSwke3RoaXMuY2hpbGR9YDtcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKHRoaXMuaXNIaWRkZW4oZWwsIHV0aWxzKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHRoaXMucGFyZW50KSB7XG4gICAgICBjb25zdCBmaXJzdENoaWxkID0gZ2V0Rmlyc3RDaGlsZChlbCk7XG4gICAgICBpZiAoZmlyc3RDaGlsZFxuICAgICAgICAmJiBmaXJzdENoaWxkIGluc3RhbmNlb2YgSFRNTEVsZW1lbnRcbiAgICAgICAgJiYgZmlyc3RDaGlsZC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSB0aGlzLmNoaWxkXG4gICAgICAgICYmICF1dGlscy5oaWRkZW4oZmlyc3RDaGlsZCkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gYGEgPCR7dGhpcy5wYXJlbnR9PiBtdXN0IGhhdmUgYSB2aXNpYmxlIDwke3RoaXMuY2hpbGR9PiBhcyB0aGVpciBmaXJzdCBjaGlsZGA7XG4gICAgfVxuXG4gICAgLy8gTGVnZW5kXG4gICAgaWYgKGVsLnBhcmVudE5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdGhpcy5wYXJlbnQpIHtcbiAgICAgIGNvbnN0IGZpcnN0Q2hpbGQgPSBnZXRGaXJzdENoaWxkKGVsLnBhcmVudE5vZGUpO1xuICAgICAgaWYgKGZpcnN0Q2hpbGQgPT09IGVsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYGEgPCR7dGhpcy5jaGlsZH0+IG11c3QgYmUgdGhlIGZpcnN0IGNoaWxkIG9mIGEgPCR7dGhpcy5wYXJlbnR9PmA7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi9ydWxlJyk7XG5cbmNvbnN0IHNlbGVjdG9yID0gJ2gyLGgzLGg0LGg1LGg2LFtyb2xlfj1oZWFkaW5nXSc7XG5cbmZ1bmN0aW9uIHByZXZpb3VzKGVsKSB7XG4gIGxldCBjdXJzb3IgPSBlbC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xuICB3aGlsZSAoY3Vyc29yICYmIGN1cnNvci5sYXN0RWxlbWVudENoaWxkKSB7XG4gICAgY3Vyc29yID0gY3Vyc29yLmxhc3RFbGVtZW50Q2hpbGQ7XG4gIH1cbiAgcmV0dXJuIGN1cnNvcjtcbn1cblxuZnVuY3Rpb24gZ2V0TGV2ZWwoZWwpIHtcbiAgcmV0dXJuIC9oWzEtNl0vaS50ZXN0KGVsLm5vZGVOYW1lKSA/ICtlbC5ub2RlTmFtZVsxXSA6ICgrZWwuZ2V0QXR0cmlidXRlKCdhcmlhLWxldmVsJykgfHwgMik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuIGAke3NlbGVjdG9yfTpub3QoW2FyaWEtbGV2ZWw9XCIxXCJdKWA7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICghdXRpbHMuYXJpYS5oYXNSb2xlKGVsLCAnaGVhZGluZycpIHx8IHV0aWxzLmhpZGRlbihlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBsZXQgY3Vyc29yID0gZWw7XG4gICAgY29uc3QgbGV2ZWwgPSBnZXRMZXZlbChlbCk7XG4gICAgZG8ge1xuICAgICAgY3Vyc29yID0gcHJldmlvdXMoY3Vyc29yKSB8fCBjdXJzb3IucGFyZW50RWxlbWVudDtcbiAgICAgIGlmIChjdXJzb3IgJiYgY3Vyc29yLm1hdGNoZXMoYGgxLCR7c2VsZWN0b3J9YCkgJiYgIXV0aWxzLmhpZGRlbihjdXJzb3IpICYmIHV0aWxzLmFyaWEuaGFzUm9sZShjdXJzb3IsICdoZWFkaW5nJykpIHtcbiAgICAgICAgY29uc3QgcHJldmlvdXNMZXZlbCA9IGdldExldmVsKGN1cnNvcik7XG4gICAgICAgIGlmIChsZXZlbCA8PSBwcmV2aW91c0xldmVsICsgMSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gd2hpbGUgKGN1cnNvciAmJiBjdXJzb3IgIT09IGRvY3VtZW50LmJvZHkpO1xuICAgIHJldHVybiAnaGVhZGluZ3MgbXVzdCBiZSBuZXN0ZWQgY29ycmVjdGx5JztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcbmNvbnN0IHsgclNwYWNlIH0gPSByZXF1aXJlKCcuLi8uLi8uLi9zdXBwb3J0L2NvbnN0YW50cycpO1xuXG5jb25zdCBzZWxlY3RvciA9IFsnYnV0dG9uJywgJ2ZpZWxkc2V0JywgJ2lucHV0JywgJ29iamVjdCcsICdvdXRwdXQnLCAnc2VsZWN0JywgJ3RleHRhcmVhJ10ubWFwKG5hbWUgPT4gYCR7bmFtZX1bZm9ybV1gKS5qb2luKCcsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuIHNlbGVjdG9yO1xuICB9XG5cbiAgdGVzdChlbCkge1xuICAgIGNvbnN0IGZvcm1JZCA9IGVsLmdldEF0dHJpYnV0ZSgnZm9ybScpO1xuICAgIGlmICghZm9ybUlkKSB7XG4gICAgICByZXR1cm4gJ2Zvcm0gYXR0cmlidXRlIHNob3VsZCBiZSBhbiBpZCc7XG4gICAgfVxuXG4gICAgaWYgKHJTcGFjZS50ZXN0KGZvcm1JZCkpIHtcbiAgICAgIHJldHVybiAnZm9ybSBhdHRyaWJ1dGUgc2hvdWxkIG5vdCBjb250YWluIHNwYWNlcyc7XG4gICAgfVxuXG4gICAgY29uc3QgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGZvcm1JZCk7XG4gICAgaWYgKCFmb3JtKSB7XG4gICAgICByZXR1cm4gYGNhbm5vdCBmaW5kIGVsZW1lbnQgZm9yIGZvcm0gYXR0cmlidXRlIHdpdGggaWQgXCIke2Zvcm1JZH1cImA7XG4gICAgfVxuXG4gICAgaWYgKGZvcm0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSAhPT0gJ2Zvcm0nKSB7XG4gICAgICByZXR1cm4gJ2Zvcm0gYXR0cmlidXRlIGRvZXMgbm90IHBvaW50IHRvIGEgZm9ybSc7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5jb25zdCB7IHJTcGFjZSB9ID0gcmVxdWlyZSgnLi4vLi4vLi4vc3VwcG9ydC9jb25zdGFudHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ21hcCc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICghZWwubmFtZSkge1xuICAgICAgcmV0dXJuICduYW1lIGF0dHJpYnV0ZSBpcyByZXF1aXJlZCc7XG4gICAgfVxuXG4gICAgaWYgKHJTcGFjZS50ZXN0KGVsLm5hbWUpKSB7XG4gICAgICByZXR1cm4gJ25hbWUgYXR0cmlidXRlIG11c3Qgbm90IGNvbnRhaW4gc3BhY2VzJztcbiAgICB9XG5cbiAgICBjb25zdCBuYW1lID0gZWwubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IG1hcE5hbWVzID0gdXRpbHMuJCQoJ21hcFtuYW1lXScpLm1hcChtYXAgPT4gbWFwLm5hbWUudG9Mb3dlckNhc2UoKSk7XG4gICAgaWYgKG1hcE5hbWVzLmZpbHRlcihpdGVtID0+IGl0ZW0gPT09IG5hbWUpLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiAnbmFtZSBhdHRyaWJ1dGUgbXVzdCBiZSBjYXNlLWluc2Vuc2l0aXZlbHkgdW5pcXVlJztcbiAgICB9XG5cbiAgICBjb25zdCBpbWdVc2VNYXBzID0gdXRpbHMuJCQoJ2ltZ1t1c2VtYXBdJykubWFwKGltZyA9PiBpbWcudXNlTWFwLnRvTG93ZXJDYXNlKCkpO1xuICAgIGlmICghaW1nVXNlTWFwcy5pbmNsdWRlcyhgIyR7bmFtZX1gKSkge1xuICAgICAgcmV0dXJuICduYW1lIGF0dHJpYnV0ZSBzaG91bGQgYmUgcmVmZXJlbmNlZCBieSBhbiBpbWcgdXNlbWFwIGF0dHJpYnV0ZSc7XG4gICAgfVxuXG4gICAgaWYgKGVsLmlkICYmIGVsLmlkICE9PSBlbC5uYW1lKSB7XG4gICAgICByZXR1cm4gJ2lmIHRoZSBpZCBhdHRyaWJ1dGUgaXMgcHJlc2VudCBpdCBtdXN0IGVxdWFsIHRoZSBuYW1lIGF0dHJpYnV0ZSc7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5jb25zdCB7IHJTcGFjZSB9ID0gcmVxdWlyZSgnLi4vLi4vLi4vc3VwcG9ydC9jb25zdGFudHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2xhYmVsW2Zvcl0nO1xuICB9XG5cbiAgdGVzdChlbCkge1xuICAgIGlmICghZWwuaHRtbEZvcikge1xuICAgICAgcmV0dXJuICdmb3IgYXR0cmlidXRlIHNob3VsZCBub3QgYmUgZW1wdHknO1xuICAgIH1cblxuICAgIGlmIChyU3BhY2UudGVzdChlbC5odG1sRm9yKSkge1xuICAgICAgcmV0dXJuICdmb3IgYXR0cmlidXRlIHNob3VsZCBub3QgY29udGFpbiBzcGFjZXMnO1xuICAgIH1cblxuICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbC5odG1sRm9yKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuICdubyBlbGVtZW50IGNhbiBiZSBmb3VuZCB3aXRoIGlkIG9mIGlkIGF0dHJpYnV0ZSc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5jb25zdCB7IHJTcGFjZSB9ID0gcmVxdWlyZSgnLi4vLi4vLi4vc3VwcG9ydC9jb25zdGFudHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2lucHV0W2xpc3RdJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgY29uc3QgbGlzdElkID0gZWwuZ2V0QXR0cmlidXRlKCdsaXN0Jyk7XG5cbiAgICBpZiAoIWxpc3RJZCkge1xuICAgICAgcmV0dXJuICdsaXN0IGF0dHJpYnV0ZSBzaG91bGQgbm90IGJlIGVtcHR5JztcbiAgICB9XG5cbiAgICBpZiAoclNwYWNlLnRlc3QobGlzdElkKSkge1xuICAgICAgcmV0dXJuICdsaXN0IGF0dHJpYnV0ZSBzaG91bGQgbm90IGNvbnRhaW4gc3BhY2VzJztcbiAgICB9XG5cbiAgICBpZiAobGlzdElkICYmIHV0aWxzLiQoYGRhdGFsaXN0W2lkPVwiJHt1dGlscy5jc3NFc2NhcGUobGlzdElkKX1cIl1gKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAnbm8gZGF0YWxpc3QgZm91bmQnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnYVtuYW1lXSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICghZWwubmFtZSkge1xuICAgICAgcmV0dXJuICduYW1lIHNob3VsZCBub3QgYmUgZW1wdHknO1xuICAgIH1cbiAgICBpZiAoZWwuaWQgJiYgZWwuaWQgIT09IGVsLm5hbWUpIHtcbiAgICAgIHJldHVybiAnaWYgdGhlIGlkIGF0dHJpYnV0ZSBpcyBwcmVzZW50IGl0IG11c3QgZXF1YWwgdGhlIG5hbWUgYXR0cmlidXRlJztcbiAgICB9XG4gICAgY29uc3QgaWQgPSB1dGlscy5jc3NFc2NhcGUoZWwubmFtZSk7XG4gICAgaWYgKGlkICYmIHV0aWxzLiQkKGBhW25hbWU9XCIke2lkfVwiXSxbaWQ9XCIke2lkfVwiXWApLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiAnbmFtZSBpcyBub3QgdW5pcXVlJztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5jb25zdCB7IHJTcGFjZSB9ID0gcmVxdWlyZSgnLi4vLi4vLi4vc3VwcG9ydC9jb25zdGFudHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ1tpZF0nO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAoIWVsLmlkKSB7XG4gICAgICByZXR1cm4gJ2lkIHNob3VsZCBub3QgYmUgZW1wdHknO1xuICAgIH1cbiAgICBpZiAoclNwYWNlLnRlc3QoZWwuaWQpKSB7XG4gICAgICByZXR1cm4gJ2lkIHNob3VsZCBub3QgY29udGFpbiBzcGFjZSBjaGFyYWN0ZXJzJztcbiAgICB9XG4gICAgaWYgKCFlbC5pZCB8fCB1dGlscy4kJChgW2lkPVwiJHt1dGlscy5jc3NFc2NhcGUoZWwuaWQpfVwiXWApLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiAnaWQgaXMgbm90IHVuaXF1ZSc7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnYXJlYVtocmVmXSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGNvbnN0IG1hcCA9IGVsLmNsb3Nlc3QoJ21hcCcpO1xuICAgIGlmICghbWFwIHx8ICFtYXAubmFtZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGltZyA9IHV0aWxzLiQoYGltZ1t1c2VtYXA9XCIjJHt1dGlscy5jc3NFc2NhcGUobWFwLm5hbWUpfVwiXWApO1xuICAgIGlmICghaW1nIHx8IHV0aWxzLmhpZGRlbihpbWcpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKGVsLmFsdCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAnYXJlYSB3aXRoIGEgaHJlZiBtdXN0IGhhdmUgYSBsYWJlbCc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IodXRpbHMpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0b3IgfHwgKHRoaXMuX3NlbGVjdG9yID0gdXRpbHMuYXJpYS5yb2xlc09mVHlwZSgnY29tbWFuZCcpLm1hcChyb2xlID0+IGBbcm9sZX49XCIke3JvbGV9XCJdYCkuam9pbignLCcpKTtcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKCF1dGlscy5hcmlhLmhhc1JvbGUoZWwsIHV0aWxzLmFyaWEucm9sZXNPZlR5cGUoJ2NvbW1hbmQnKSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodXRpbHMuaGlkZGVuKGVsLCB7IGFyaWFIaWRkZW46IHRydWUgfSkgfHwgdXRpbHMuYWNjZXNzaWJsZU5hbWUoZWwpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuICdlbGVtZW50cyB3aXRoIGEgcm9sZSB3aXRoIGEgc3VwZXJjbGFzcyBvZiBjb21tYW5kIG11c3QgaGF2ZSBhIGxhYmVsJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2J1dHRvbixpbnB1dDpub3QoW3R5cGU9XCJoaWRkZW5cIl0pLG1ldGVyLG91dHB1dCxwcm9ncmVzcyxzZWxlY3QsdGV4dGFyZWEnO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAodXRpbHMuaGlkZGVuKGVsLCB7IGFyaWFIaWRkZW46IHRydWUgfSkgfHwgdXRpbHMuYWNjZXNzaWJsZU5hbWUoZWwpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuICdmb3JtIGNvbnRyb2xzIG11c3QgaGF2ZSBhIGxhYmVsJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2ZpZWxkc2V0LGRldGFpbHMsW3JvbGV+PWdyb3VwXSxbcm9sZX49cmFkaW9ncm91cF0nO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAodXRpbHMuaGlkZGVuKGVsKVxuICAgICAgfHwgKGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgIT09ICdmaWVsZHNldCcgJiYgIXV0aWxzLmFyaWEuaGFzUm9sZShlbCwgWydncm91cCcsICdyYWRpb2dyb3VwJ10pKVxuICAgICAgfHwgdXRpbHMuYWNjZXNzaWJsZU5hbWUoZWwpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbmFtZSA9IGVsLm1hdGNoZXMoJ2ZpZWxkc2V0LGRldGFpbHMnKSA/IGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgOiB1dGlscy5hcmlhLmdldFJvbGUoZWwpO1xuICAgIHJldHVybiBgJHtuYW1lfSBtdXN0IGhhdmUgYSBsYWJlbGA7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdoMSxoMixoMyxoNCxoNSxoNixbcm9sZX49XCJoZWFkaW5nXCJdJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKCF1dGlscy5hcmlhLmhhc1JvbGUoZWwsICdoZWFkaW5nJykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodXRpbHMuaGlkZGVuKGVsLCB7IGFyaWFIaWRkZW46IHRydWUgfSkgfHwgdXRpbHMuYWNjZXNzaWJsZU5hbWUoZWwpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuICdoZWFkaW5ncyBtdXN0IGhhdmUgYSBsYWJlbCc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2V0RGVmYXVsdHMoKSB7XG4gICAgdGhpcy5pbmNsdWRlSGlkZGVuID0gdHJ1ZTtcbiAgfVxuXG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnaW1nOm5vdChbYWx0XSknO1xuICB9XG5cbiAgdGVzdCgpIHtcbiAgICByZXR1cm4gJ21pc3NpbmcgYWx0IGF0dHJpYnV0ZSc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdhW2hyZWZdJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKHV0aWxzLmhpZGRlbihlbCwgeyBhcmlhSGlkZGVuOiB0cnVlIH0pIHx8IHV0aWxzLmFjY2Vzc2libGVOYW1lKGVsKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAnbGlua3Mgd2l0aCBhIGhyZWYgbXVzdCBoYXZlIGEgbGFiZWwnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnW3RhYmluZGV4XSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICh1dGlscy5oaWRkZW4oZWwsIHsgYXJpYUhpZGRlbjogdHJ1ZSB9KSB8fCB1dGlscy5hY2Nlc3NpYmxlTmFtZShlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gJ2ZvY3VzYWJsZSBlbGVtZW50cyBtdXN0IGhhdmUgYSBsYWJlbCc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi9ydWxlJyk7XG5cbi8vIExhbmd1YWdlIHRhZ3MgYXJlIGRlZmluZWQgaW4gaHR0cDovL3d3dy5pZXRmLm9yZy9yZmMvYmNwL2JjcDQ3LnR4dFxuY29uc3QgbWF0Y2ggPSAvXigoZW4tZ2Itb2VkKXwoW2Etel17MiwzfSgtW2Etel17M30pPygtW2Etel17NH0pPygtW2Etel17Mn18LVxcZHszfSk/KC1bYS16MC05XXs1LDh9fC0oXFxkW2EtejAtOV17M30pKSopKSQvaTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2h0bWwnO1xuICB9XG5cbiAgdGVzdChlbCkge1xuICAgIGlmICghZWwubGFuZykge1xuICAgICAgcmV0dXJuICdtaXNzaW5nIGxhbmcgYXR0cmlidXRlJztcbiAgICB9XG4gICAgaWYgKCFtYXRjaC50ZXN0KGVsLmxhbmcpKSB7XG4gICAgICByZXR1cm4gJ2xhbmd1YWdlIGNvZGUgaXMgaW52YWxpZCc7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vcnVsZScpO1xuXG5jb25zdCBleGNsdWRlVHlwZXMgPSBbJ2hpZGRlbicsICdpbWFnZScsICdzdWJtaXQnLCAncmVzZXQnLCAnYnV0dG9uJ107XG5jb25zdCBleGNsdWRlU2VsZWN0b3IgPSBleGNsdWRlVHlwZXMubWFwKHR5cGUgPT4gYDpub3QoW3R5cGU9JHt0eXBlfV0pYCkuam9pbignJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdG9yIHx8ICh0aGlzLl9zZWxlY3RvciA9IGBpbnB1dFtuYW1lXSR7ZXhjbHVkZVNlbGVjdG9yfSx0ZXh0YXJlYVtuYW1lXSxzZWxlY3RbbmFtZV0sb2JqZWN0W25hbWVdYCk7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICh1dGlscy5oaWRkZW4oZWwpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgbGV0IGdyb3VwO1xuXG4gICAgaWYgKGVsLmZvcm0pIHtcbiAgICAgIGNvbnN0IGVsZW1lbnRzID0gZWwuZm9ybS5lbGVtZW50c1tlbC5uYW1lXTtcbiAgICAgIGlmIChlbGVtZW50cyBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBncm91cCA9IEFycmF5LmZyb20oZWxlbWVudHMpXG4gICAgICAgIC5maWx0ZXIoZWxtID0+ICFleGNsdWRlVHlwZXMuaW5jbHVkZXMoZWxtLnR5cGUpKVxuICAgICAgICAuZmlsdGVyKGVsbSA9PiAhdXRpbHMuaGlkZGVuKGVsbSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBuYW1lUGFydCA9IGBbbmFtZT1cIiR7dXRpbHMuY3NzRXNjYXBlKGVsLm5hbWUpfVwiXWA7XG4gICAgICBncm91cCA9IHV0aWxzLiQkKGBpbnB1dCR7bmFtZVBhcnR9JHtleGNsdWRlU2VsZWN0b3J9LHRleHRhcmVhJHtuYW1lUGFydH0sc2VsZWN0JHtuYW1lUGFydH0sb2JqZWN0JHtuYW1lUGFydH1gKVxuICAgICAgICAuZmlsdGVyKGVsbSA9PiAhZWxtLmZvcm0pXG4gICAgICAgIC5maWx0ZXIoZWxtID0+ICF1dGlscy5oaWRkZW4oZWxtKSk7XG4gICAgfVxuXG4gICAgaWYgKGdyb3VwLmxlbmd0aCA9PT0gMSB8fCBlbC5jbG9zZXN0KCdmaWVsZHNldCcpIHx8IHV0aWxzLmFyaWEuY2xvc2VzdFJvbGUoZWwsIFsnZ3JvdXAnLCAncmFkaW9ncm91cCddKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuICdtdWx0aXBsZSBpbnB1dHMgd2l0aCB0aGUgc2FtZSBuYW1lIHNob3VsZCBiZSBpbiBhIGZpZWxkc2V0LCBncm91cCBvciByYWRpb2dyb3VwJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2J1dHRvbjpub3QoW3R5cGVdKSc7XG4gIH1cblxuICB0ZXN0KCkge1xuICAgIHJldHVybiAnYWxsIGJ1dHRvbnMgc2hvdWxkIGhhdmUgYSB0eXBlIGF0dHJpYnV0ZSc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi9ydWxlJyk7XG5cbmZ1bmN0aW9uIGlzQnIoZWwpIHtcbiAgcmV0dXJuIGVsIGluc3RhbmNlb2YgRWxlbWVudCAmJiBlbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnYnInO1xufVxuXG5mdW5jdGlvbiBwcmV2aW91c0VsZW1lbnRJc0JyKGVsLCB1dGlscykge1xuICB3aGlsZSAoKGVsID0gZWwucHJldmlvdXNTaWJsaW5nKSkge1xuICAgIGlmICgoZWwgaW5zdGFuY2VvZiBFbGVtZW50ICYmICF1dGlscy5oaWRkZW4oZWwpKSB8fCAoZWwgaW5zdGFuY2VvZiBUZXh0ICYmIGVsLmRhdGEudHJpbSgpKSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBpc0JyKGVsKTtcbn1cblxuZnVuY3Rpb24gbmV4dEVsZW1lbnRJc0JyKGVsLCB1dGlscykge1xuICB3aGlsZSAoKGVsID0gZWwubmV4dFNpYmxpbmcpKSB7XG4gICAgaWYgKChlbCBpbnN0YW5jZW9mIEVsZW1lbnQgJiYgIXV0aWxzLmhpZGRlbihlbCkpIHx8IChlbCBpbnN0YW5jZW9mIFRleHQgJiYgZWwuZGF0YS50cmltKCkpKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGlzQnIoZWwpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnYnIgKyBicic7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICh1dGlscy5oaWRkZW4oZWwpIHx8ICFwcmV2aW91c0VsZW1lbnRJc0JyKGVsLCB1dGlscykgfHwgbmV4dEVsZW1lbnRJc0JyKGVsLCB1dGlscykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiAnZG8gbm90IHVzZSA8YnI+cyBmb3Igc3BhY2luZyc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdzZWxlY3Q6bm90KDpkaXNhYmxlZCknO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAodXRpbHMuaGlkZGVuKGVsKSB8fCB1dGlscy4kJCgnb3B0aW9uJywgZWwpLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAnc2VsZWN0cyBzaG91bGQgaGF2ZSBvcHRpb25zJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2Fbcm9sZX49YnV0dG9uXSxhW2hyZWY9XCIjXCJdLGFbaHJlZj1cIiMhXCJdLGFbaHJlZl49XCJqYXZhc2NyaXB0OlwiXSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICh1dGlscy5oaWRkZW4oZWwpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuICd1c2UgYSBidXR0b24gaW5zdGVhZCBvZiBhIGxpbmsnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vcnVsZScpO1xuXG5mdW5jdGlvbiByZW1vdmVIYXNoKG9iKSB7XG4gIHJldHVybiBvYi5ocmVmLnJlcGxhY2UoLyMuKiQvLCAnJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdhW2hyZWYqPVwiI1wiXSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICh1dGlscy5oaWRkZW4oZWwpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKHJlbW92ZUhhc2god2luZG93LmxvY2F0aW9uKSAhPT0gcmVtb3ZlSGFzaChlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBpZCA9IHV0aWxzLmNzc0VzY2FwZShkZWNvZGVVUkkoZWwuaGFzaC5zbGljZSgxKSkpO1xuICAgIGNvbnN0IGZvdW5kID0gdXRpbHMuJChgW2lkPVwiJHtpZH1cIl0sYVtuYW1lPVwiJHtpZH1cIl1gKTtcblxuICAgIGlmICghZm91bmQpIHtcbiAgICAgIHJldHVybiAnZnJhZ21lbnQgbm90IGZvdW5kIGluIGRvY3VtZW50JztcbiAgICB9XG5cbiAgICBpZiAodXRpbHMuaGlkZGVuKGZvdW5kKSkge1xuICAgICAgcmV0dXJuICdsaW5rIHRhcmdldCBpcyBoaWRkZW4nO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnc2VsZWN0W211bHRpcGxlXTpub3QoOmRpc2FibGVkKSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICh1dGlscy5oaWRkZW4oZWwpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuICdkbyBub3QgdXNlIG11bHRpcGxlIHNlbGVjdHMnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnaW5wdXQsdGV4dGFyZWEsc2VsZWN0LGJ1dHRvbjpub3QoW3R5cGVdKSxidXR0b25bdHlwZT1cInN1Ym1pdFwiXSxidXR0b25bdHlwZT1cInJlc2V0XCJdJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKGVsLmZvcm0gfHwgdXRpbHMuaGlkZGVuKGVsKSB8fCBlbC5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAnYWxsIGNvbnRyb2xzIHNob3VsZCBiZSBhc3NvY2lhdGVkIHdpdGggYSBmb3JtJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uL3J1bGUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2E6bm90KFtocmVmXSksYXJlYTpub3QoW2hyZWZdKSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmIChlbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnYScgJiYgdXRpbHMuaGlkZGVuKGVsKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuICdsaW5rcyBzaG91bGQgaGF2ZSBhIGhyZWYgYXR0cmlidXRlJztcbiAgfVxufTtcblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnaW5wdXRbdHlwZT1yZXNldF0sYnV0dG9uW3R5cGU9cmVzZXRdJztcbiAgfVxuXG4gIHRlc3QoKSB7XG4gICAgcmV0dXJuICdkbyBub3QgdXNlIHJlc2V0IGJ1dHRvbnMnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vcnVsZScpO1xuXG5jb25zdCBsYWJlbGFibGUgPSAnaW5wdXQ6bm90KFt0eXBlPWhpZGRlbl0pLHNlbGVjdCx0ZXh0YXJlYSxidXR0b24sbWV0ZXIsb3V0cHV0LHByb2dyZXNzJztcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2xhYmVsJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKHV0aWxzLmhpZGRlbihlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChlbC5odG1sRm9yKSB7XG4gICAgICBjb25zdCBmb3JFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsLmh0bWxGb3IpO1xuICAgICAgaWYgKCFmb3JFbCkge1xuICAgICAgICByZXR1cm4gJ2xhYmVsIGlzIG5vdCBsYWJlbGxpbmcgYW4gZWxlbWVudCc7XG4gICAgICB9XG4gICAgICBpZiAodXRpbHMuaGlkZGVuKGZvckVsKSkge1xuICAgICAgICByZXR1cm4gJ2xhYmVsIGlzIGxhYmVsbGluZyBhIGhpZGRlbiBlbGVtZW50JztcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldHMgPSB1dGlscy4kJChsYWJlbGFibGUsIGVsKTtcblxuICAgIGlmICh0YXJnZXRzLmxlbmd0aCAmJiAhdGFyZ2V0cy5maWx0ZXIoZWxtID0+ICF1dGlscy5oaWRkZW4oZWxtKSkubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gJ2xhYmVsIGlzIGxhYmVsbGluZyBhIGhpZGRlbiBlbGVtZW50JztcbiAgICB9XG5cbiAgICBpZiAoIXRhcmdldHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gJ2xhYmVsIGlzIG5vdCBsYWJlbGxpbmcgYW4gZWxlbWVudCc7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgcnVuKGNvbnRleHQsIGZpbHRlciA9ICgpID0+IHRydWUsIHV0aWxzKSB7XG4gICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICBpZiAoIWNvbnRleHQuY29udGFpbnMoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGlmIChkb2N1bWVudC5jaGFyYWN0ZXJTZXQgIT09ICdVVEYtOCcpIHtcbiAgICAgIGVycm9ycy5wdXNoKHsgZWw6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgbWVzc2FnZTogJ2FsbCBIVE1MIGRvY3VtZW50cyBzaG91bGQgYmUgYXV0aG9yZWQgaW4gVVRGLTgnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IG1ldGEgPSB1dGlscy4kJCgnbWV0YVtjaGFyc2V0XSxtZXRhW2h0dHAtZXF1aXY9XCJjb250ZW50LXR5cGVcIiBpXScpO1xuXG4gICAgaWYgKG1ldGEubGVuZ3RoID4gMSkge1xuICAgICAgbWV0YS5mb3JFYWNoKGVsID0+IGVycm9ycy5wdXNoKHsgZWwsIG1lc3NhZ2U6ICdtb3JlIHRoYW4gb25lIG1ldGEgY2hhcnNldCB0YWcgZm91bmQnIH0pKTtcbiAgICB9XG5cbiAgICBpZiAoIW1ldGEubGVuZ3RoKSB7XG4gICAgICBlcnJvcnMucHVzaCh7IGVsOiBkb2N1bWVudC5oZWFkLCBtZXNzYWdlOiAnbWlzc2luZyBgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+YCcgfSk7XG4gICAgfVxuXG4gICAgbWV0YVxuICAgICAgLmZpbHRlcihlbCA9PiBlbC5odHRwRXF1aXYpXG4gICAgICAuZm9yRWFjaChlbCA9PiBlcnJvcnMucHVzaCh7IGVsLCBtZXNzYWdlOiAndXNlIHRoZSBmb3JtIGA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIj5gJyB9KSk7XG5cbiAgICBtZXRhXG4gICAgICAuZmlsdGVyKGVsID0+IGRvY3VtZW50LmhlYWQuZmlyc3RFbGVtZW50Q2hpbGQgIT09IGVsKVxuICAgICAgLmZvckVhY2goZWwgPT4gZXJyb3JzLnB1c2goeyBlbCwgbWVzc2FnZTogJ21ldGEgY2hhcnNldCBzaG91bGQgYmUgdGhlIGZpcnN0IGNoaWxkIG9mIDxoZWFkPicgfSkpO1xuXG4gICAgcmV0dXJuIGVycm9ycy5maWx0ZXIoKHsgZWwgfSkgPT4gZmlsdGVyKGVsKSk7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5jb25zdCBjb25zdGFudHMgPSByZXF1aXJlKCcuLi8uLi8uLi9zdXBwb3J0L2NvbnN0YW50cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnYVtocmVmXVt0YXJnZXRdLGFyZWFbaHJlZl1bdGFyZ2V0XSxmb3JtW3RhcmdldF0sYmFzZVt0YXJnZXRdLGZvcm0gYnV0dG9uW3R5cGU9c3VibWl0XVtmb3JtdGFyZ2V0XSxmb3JtIGlucHV0W3R5cGU9c3VibWl0XVtmb3JtdGFyZ2V0XSxmb3JtIGlucHV0W3R5cGU9aW1hZ2VdW2Zvcm10YXJnZXRdJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKGVsLnRhcmdldCA9PT0gJ19zZWxmJyB8fCBlbC5mb3JtVGFyZ2V0ID09PSAnX3NlbGYnKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3Qgbm9kZU5hbWUgPSBlbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChub2RlTmFtZSAhPT0gJ2Jhc2UnICYmIG5vZGVOYW1lICE9PSAnYXJlYScgJiYgdXRpbHMuaGlkZGVuKGVsKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgcmVsID0gZWwucmVsICYmIGVsLnJlbC5zcGxpdChjb25zdGFudHMuclNwYWNlKTtcbiAgICBpZiAocmVsICYmIHJlbC5pbmNsdWRlcygnbm9vcGVuZXInKSAmJiByZWwuaW5jbHVkZXMoJ25vcmVmZXJyZXInKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgbGV0IHVybCA9IGVsLmhyZWY7XG4gICAgaWYgKG5vZGVOYW1lID09PSAnZm9ybScpIHtcbiAgICAgIHVybCA9IGVsLmFjdGlvbjtcbiAgICB9IGVsc2UgaWYgKG5vZGVOYW1lID09PSAnYnV0dG9uJyB8fCBub2RlTmFtZSA9PT0gJ2lucHV0Jykge1xuICAgICAgLy8gQ2hyb21lIHJldHVybnMgdGhlIHBhZ2UgdXJsIGZvciBlbC5mb3JtYWN0aW9uXG4gICAgICB1cmwgPSBlbC5nZXRBdHRyaWJ1dGUoJ2Zvcm1hY3Rpb24nKSB8fCBlbC5mb3JtLmFjdGlvbjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgdXJsID0gbmV3IFVSTCh1cmwsIGxvY2F0aW9uLmhyZWYpO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgIHVybCA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHVybCAmJiB1cmwuaG9zdCA9PT0gbG9jYXRpb24uaG9zdCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgbGV0IG1lc3NhZ2UgPSAndGFyZ2V0IGF0dHJpYnV0ZSBoYXMgb3BlbmVyIHZ1bG5lcmFiaWxpdHknO1xuICAgIGlmIChub2RlTmFtZSA9PT0gJ2EnIHx8IG5vZGVOYW1lID09PSAnYXJlYScpIHtcbiAgICAgIG1lc3NhZ2UgKz0gJy4gQWRkIGByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCJgJztcbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdodG1sJztcbiAgfVxuXG4gIHRlc3QoKSB7XG4gICAgaWYgKGRvY3VtZW50LnRpdGxlLnRyaW0oKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAnZG9jdW1lbnQgbXVzdCBoYXZlIGEgdGl0bGUnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IFtcImFyaWEvYWxsb3dlZC1hdHRyaWJ1dGVzXCIsXCJhcmlhL2F0dHJpYnV0ZS12YWx1ZXNcIixcImFyaWEvZGVwcmVjYXRlZC1hdHRyaWJ1dGVzXCIsXCJhcmlhL2ltbXV0YWJsZS1yb2xlXCIsXCJhcmlhL2xhbmRtYXJrL29uZS1iYW5uZXJcIixcImFyaWEvbGFuZG1hcmsvb25lLWNvbnRlbnRpbmZvXCIsXCJhcmlhL2xhbmRtYXJrL29uZS1tYWluXCIsXCJhcmlhL2xhbmRtYXJrL3ByZWZlci1tYWluXCIsXCJhcmlhL2xhbmRtYXJrL3JlcXVpcmVkXCIsXCJhcmlhL25vLWZvY3VzYWJsZS1oaWRkZW5cIixcImFyaWEvbm8tZm9jdXNhYmxlLXJvbGUtbm9uZVwiLFwiYXJpYS9uby1ub25lLXdpdGhvdXQtcHJlc2VudGF0aW9uXCIsXCJhcmlhL29uZS1yb2xlXCIsXCJhcmlhL3JvbGVzXCIsXCJhcmlhL3Vuc3VwcG9ydGVkLWVsZW1lbnRzXCIsXCJhdHRyaWJ1dGVzL2RhdGFcIixcImF0dHJpYnV0ZXMvbm8tamF2YXNjcmlwdC1oYW5kbGVyc1wiLFwiYXR0cmlidXRlcy9uby1wb3NpdGl2ZS10YWItaW5kZXhcIixcImNvbG91ci1jb250cmFzdC9hYVwiLFwiY29sb3VyLWNvbnRyYXN0L2FhYVwiLFwiZGV0YWlscy1hbmQtc3VtbWFyeVwiLFwiZWxlbWVudHMvb2Jzb2xldGVcIixcImVsZW1lbnRzL3Vua25vd25cIixcImZpZWxkc2V0LWFuZC1sZWdlbmRcIixcImhlYWRpbmdzXCIsXCJpZHMvZm9ybS1hdHRyaWJ1dGVcIixcImlkcy9pbWFnZW1hcC1pZHNcIixcImlkcy9sYWJlbHMtaGF2ZS1pbnB1dHNcIixcImlkcy9saXN0LWlkXCIsXCJpZHMvbm8tZHVwbGljYXRlLWFuY2hvci1uYW1lc1wiLFwiaWRzL3VuaXF1ZS1pZFwiLFwibGFiZWxzL2FyZWFcIixcImxhYmVscy9hcmlhLWNvbW1hbmRcIixcImxhYmVscy9jb250cm9sc1wiLFwibGFiZWxzL2dyb3VwXCIsXCJsYWJlbHMvaGVhZGluZ3NcIixcImxhYmVscy9pbWdcIixcImxhYmVscy9saW5rc1wiLFwibGFiZWxzL3RhYmluZGV4XCIsXCJsYW5nXCIsXCJtdWx0aXBsZS1pbi1ncm91cFwiLFwibm8tYnV0dG9uLXdpdGhvdXQtdHlwZVwiLFwibm8tY29uc2VjdXRpdmUtYnJzXCIsXCJuby1lbXB0eS1zZWxlY3RcIixcIm5vLWxpbmtzLWFzLWJ1dHRvbnNcIixcIm5vLWxpbmtzLXRvLW1pc3NpbmctZnJhZ21lbnRzXCIsXCJuby1tdWx0aXBsZS1zZWxlY3RcIixcIm5vLW91dHNpZGUtY29udHJvbHNcIixcIm5vLXBsYWNlaG9sZGVyLWxpbmtzXCIsXCJuby1yZXNldFwiLFwibm8tdW5hc3NvY2lhdGVkLWxhYmVsc1wiLFwic2VjdXJpdHkvY2hhcnNldFwiLFwic2VjdXJpdHkvdGFyZ2V0XCIsXCJ0aXRsZVwiXTsiLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gXCIxLjE0LjBcIiIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiBBcmlhIHJ1bGVzIGZvciBhIEhUTUwgZWxlbWVudFxuICpcbiAqIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9odG1sLWFyaWEvXG4gKi9cbmNvbnN0IHsgJCQgfSA9IHJlcXVpcmUoJy4uL3V0aWxzL3NlbGVjdG9ycy5qcycpO1xuXG4vKipcbiAqIERlc2NyaWJlcyB3aGF0IHJvbGVzIGFuZCBhcmlhIGF0dHJpYnV0ZXMgYWxsIGFsbG93ZWQgb24gYW4gZWxlbWVudFxuICpcbiAqIEB0eXBlZGVmIHtPYmplY3R9IGFsbG93ZWRBcmlhXG4gKiBAcHJvcGVydHkge1N0cmluZ30gc2VsZWN0b3JcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nW119IGltcGxpY2l0Um9sZXNcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nW119IHJvbGVzXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59IGFueVJvbGVcbiAqL1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgcnVsZVxuICogQHJldHVybnMge2FsbG93ZWRBcmlhfVxuICovXG5mdW5jdGlvbiBydWxlKHsgc2VsZWN0b3IgPSAnKicsIGltcGxpY2l0ID0gW10sIHJvbGVzID0gW10sIGFueVJvbGUgPSBmYWxzZSwgYXJpYUZvckltcGxpY2l0ID0gZmFsc2UsIG5vQXJpYSA9IGZhbHNlIH0pIHtcbiAgcmV0dXJuIHtcbiAgICBzZWxlY3RvcixcbiAgICBpbXBsaWNpdDogW10uY29uY2F0KGltcGxpY2l0KSxcbiAgICByb2xlczogYW55Um9sZSA/ICcqJyA6IHJvbGVzLFxuICAgIG5vQXJpYSxcbiAgICBhcmlhRm9ySW1wbGljaXQsXG4gIH07XG59XG5cbi8vIENvbW1vbiBydWxlc1xuLy8gVE9ETzogaW5jbHVkZSBhcmlhIGF0dHJpYnV0ZSBydWxlc1xuY29uc3Qgbm9Sb2xlT3JBcmlhID0gcnVsZSh7IG5vQXJpYTogdHJ1ZSB9KTtcbmNvbnN0IG5vUm9sZSA9IHJ1bGUoe30pO1xuY29uc3QgYW55Um9sZSA9IHJ1bGUoeyBhbnlSb2xlOiB0cnVlIH0pO1xuXG4vKiogQGVudW0geyhhbGxvd2VkQXJpYXxhbGxvd2VkQXJpYVtdKX0gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICBfZGVmYXVsdDogYW55Um9sZSxcbiAgYTogW1xuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3I6ICdbaHJlZl0nLFxuICAgICAgaW1wbGljaXQ6ICdsaW5rJyxcbiAgICAgIHJvbGVzOiBbXG4gICAgICAgICdidXR0b24nLCAnY2hlY2tib3gnLCAnbWVudWl0ZW0nLCAnbWVudWl0ZW1jaGVja2JveCcsXG4gICAgICAgICdtZW51aXRlbXJhZGlvJywgJ29wdGlvbicsICdyYWRpbycsICd0YWInLCAnc3dpdGNoJywgJ3RyZWVpdGVtJyxcbiAgICAgIF0sXG4gICAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJzpub3QoW2hyZWZdKScsXG4gICAgICBhbnlSb2xlOiB0cnVlLFxuICAgIH0pLFxuICBdLFxuICBhZGRyZXNzOiBhbnlSb2xlLFxuICBhcmVhOiBbXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1tocmVmXScsXG4gICAgICBpbXBsaWNpdDogJ2xpbmsnLFxuICAgICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICAgIH0pLFxuICBdLFxuICBhcnRpY2xlOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2FydGljbGUnLFxuICAgIHJvbGVzOiBbJ2ZlZWQnLCAncHJlc2VudGF0aW9uJywgJ2RvY3VtZW50JywgJ2FwcGxpY2F0aW9uJywgJ21haW4nLCAncmVnaW9uJ10sXG4gIH0pLFxuICBhc2lkZTogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdjb21wbGVtZW50YXJ5JyxcbiAgICByb2xlczogWydmZWVkJywgJ25vdGUnLCAncmVnaW9uJywgJ3NlYXJjaCddLFxuICB9KSxcbiAgYXVkaW86IHJ1bGUoe1xuICAgIHJvbGVzOiBbJ2FwcGxpY2F0aW9uJ10sXG4gIH0pLFxuICBiYXNlOiBub1JvbGVPckFyaWEsXG4gIGJvZHk6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiBbJ2RvY3VtZW50J10sXG4gICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICB9KSxcbiAgYnV0dG9uOiBbXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1t0eXBlPW1lbnVdJyxcbiAgICAgIGltcGxpY2l0OiAnYnV0dG9uJyxcbiAgICAgIHJvbGVzOiBbJ2xpbmsnLCAnbWVudWl0ZW0nLCAnbWVudWl0ZW1jaGVja2JveCcsICdtZW51aXRlbXJhZGlvJywgJ3JhZGlvJ10sXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBpbXBsaWNpdDogJ2J1dHRvbicsXG4gICAgICByb2xlczogW1xuICAgICAgICAnY2hlY2tib3gnLCAnbGluaycsICdtZW51aXRlbScsICdtZW51aXRlbWNoZWNrYm94JyxcbiAgICAgICAgJ21lbnVpdGVtcmFkaW8nLCAncmFkaW8nLCAnc3dpdGNoJywgJ3RhYicsXG4gICAgICBdLFxuICAgIH0pLFxuICBdLFxuICBjYW52YXM6IGFueVJvbGUsXG4gIGNhcHRpb246IG5vUm9sZSxcbiAgY29sOiBub1JvbGVPckFyaWEsXG4gIGNvbGdyb3VwOiBub1JvbGVPckFyaWEsXG4gIGRhdGE6IGFueVJvbGUsXG4gIGRhdGFsaXN0OiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2xpc3Rib3gnLFxuICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgfSksXG4gIGRkOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2RlZmluaXRpb24nLFxuICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgfSksXG4gIGRldGFpbHM6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnZ3JvdXAnLFxuICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgfSksXG4gIGRpYWxvZzogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdkaWFsb2cnLFxuICAgIHJvbGVzOiBbJ2FsZXJ0ZGlhbG9nJ10sXG4gICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICB9KSxcbiAgZGl2OiBhbnlSb2xlLFxuICBkbDogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdsaXN0JyxcbiAgICByb2xlczogWydncm91cCcsICdwcmVzZW50YXRpb24nXSxcbiAgfSksXG4gIGR0OiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2xpc3RpdGVtJyxcbiAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gIH0pLFxuICBlbWJlZDogcnVsZSh7XG4gICAgcm9sZXM6IFsnYXBwbGljYXRpb24nLCAnZG9jdW1lbnQnLCAncHJlc2VudGF0aW9uJywgJ2ltZyddLFxuICB9KSxcbiAgZmllbGRzZXQ6IHJ1bGUoe1xuICAgIHJvbGVzOiBbJ2dyb3VwJywgJ3ByZXNlbnRhdGlvbiddLFxuICB9KSxcbiAgZmlnY2FwdGlvbjogcnVsZSh7XG4gICAgcm9sZXM6IFsnZ3JvdXAnLCAncHJlc2VudGF0aW9uJ10sXG4gIH0pLFxuICBmaWd1cmU6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnZmlndXJlJyxcbiAgICByb2xlczogWydncm91cCcsICdwcmVzZW50YXRpb24nXSxcbiAgfSksXG4gIGZvb3RlcjogW1xuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3IoZWwsIGFyaWEpIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSBbJ2FydGljbGUnLCAnYXNpZGUnLCAnbWFpbicsICduYXYnLCAnc2VjdGlvbiddLm1hcChuYW1lID0+IGA6c2NvcGUgJHtuYW1lfSBmb290ZXJgKS5qb2luKCcsJyk7XG4gICAgICAgIHJldHVybiAkJChzZWxlY3RvciwgYXJpYS5jbG9zZXN0Um9sZShlbCwgWydhcHBsaWNhdGlvbicsICdkb2N1bWVudCddLCB7IGV4YWN0OiB0cnVlIH0pKVxuICAgICAgICAgIC5pbmNsdWRlcyhlbCk7XG4gICAgICB9LFxuICAgICAgcm9sZXM6IFsnZ3JvdXAnLCAncHJlc2VudGF0aW9uJ10sXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBpbXBsaWNpdDogJ2NvbnRlbnRpbmZvJyxcbiAgICAgIHJvbGVzOiBbJ2dyb3VwJywgJ3ByZXNlbnRhdGlvbiddLFxuICAgIH0pLFxuICBdLFxuICBmb3JtOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2Zvcm0nLFxuICAgIHJvbGVzOiBbJ3NlYXJjaCcsICdwcmVzZW50YXRpb24nXSxcbiAgfSksXG4gIHA6IGFueVJvbGUsXG4gIHByZTogYW55Um9sZSxcbiAgYmxvY2txdW90ZTogYW55Um9sZSxcbiAgaDE6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnaGVhZGluZycsXG4gICAgcm9sZXM6IFsndGFiJywgJ3ByZXNlbnRhdGlvbiddLFxuICB9KSxcbiAgaDI6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnaGVhZGluZycsXG4gICAgcm9sZXM6IFsndGFiJywgJ3ByZXNlbnRhdGlvbiddLFxuICB9KSxcbiAgaDM6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnaGVhZGluZycsXG4gICAgcm9sZXM6IFsndGFiJywgJ3ByZXNlbnRhdGlvbiddLFxuICB9KSxcbiAgaDQ6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnaGVhZGluZycsXG4gICAgcm9sZXM6IFsndGFiJywgJ3ByZXNlbnRhdGlvbiddLFxuICB9KSxcbiAgaDU6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnaGVhZGluZycsXG4gICAgcm9sZXM6IFsndGFiJywgJ3ByZXNlbnRhdGlvbiddLFxuICB9KSxcbiAgaDY6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnaGVhZGluZycsXG4gICAgcm9sZXM6IFsndGFiJywgJ3ByZXNlbnRhdGlvbiddLFxuICB9KSxcbiAgaGVhZDogbm9Sb2xlT3JBcmlhLFxuICBoZWFkZXI6IFtcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yKGVsLCBhcmlhKSB7XG4gICAgICAgIGNvbnN0IHNlbGVjdG9yID0gWydhcnRpY2xlJywgJ2FzaWRlJywgJ21haW4nLCAnbmF2JywgJ3NlY3Rpb24nXS5tYXAobmFtZSA9PiBgOnNjb3BlICR7bmFtZX0gaGVhZGVyYCkuam9pbignLCcpO1xuICAgICAgICByZXR1cm4gJCQoc2VsZWN0b3IsIGFyaWEuY2xvc2VzdFJvbGUoZWwsIFsnYXBwbGljYXRpb24nLCAnZG9jdW1lbnQnXSwgeyBleGFjdDogdHJ1ZSB9KSlcbiAgICAgICAgICAuaW5jbHVkZXMoZWwpO1xuICAgICAgfSxcbiAgICAgIHJvbGVzOiBbJ2dyb3VwJywgJ3ByZXNlbnRhdGlvbiddLFxuICAgIH0pLFxuICAgIHJ1bGUoe1xuICAgICAgaW1wbGljaXQ6ICdiYW5uZXInLFxuICAgICAgcm9sZXM6IFsnZ3JvdXAnLCAncHJlc2VudGF0aW9uJ10sXG4gICAgfSksXG4gIF0sXG4gIGhyOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ3NlcGFyYXRvcicsXG4gICAgcm9sZXM6IFsncHJlc2VudGF0aW9uJ10sXG4gICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICB9KSxcbiAgaHRtbDogbm9Sb2xlT3JBcmlhLFxuICBpZnJhbWU6IHJ1bGUoe1xuICAgIHJvbGVzOiBbJ2FwcGxpY2F0aW9uJywgJ2RvY3VtZW50JywgJ2ltZyddLFxuICB9KSxcbiAgaW1nOiBbXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1thbHQ9XCJcIl0nLFxuICAgICAgcm9sZXM6IFsncHJlc2VudGF0aW9uJywgJ25vbmUnXSxcbiAgICAgIGFyaWE6IGZhbHNlLFxuICAgIH0pLFxuICAgIHJ1bGUoe1xuICAgICAgaW1wbGljaXQ6ICdpbWcnLFxuICAgICAgYW55Um9sZTogdHJ1ZSxcbiAgICB9KSxcbiAgXSxcbiAgaW5wdXQ6IFtcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW2xpc3RdOm5vdChbdHlwZV0pLFtsaXN0XVt0eXBlPXRleHRdLFtsaXN0XVt0eXBlPXNlYXJjaF0sW2xpc3RdW3R5cGU9dGVsXSxbbGlzdF1bdHlwZT11cmxdLFtsaXN0XVt0eXBlPWVtYWlsXScsXG4gICAgICBpbXBsaWNpdDogJ2NvbWJvYm94JyxcbiAgICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW3R5cGU9YnV0dG9uXScsXG4gICAgICBpbXBsaWNpdDogJ2J1dHRvbicsXG4gICAgICByb2xlczogWydsaW5rJywgJ21lbnVpdGVtJywgJ21lbnVpdGVtY2hlY2tib3gnLCAnbWVudWl0ZW1yYWRpbycsICdyYWRpbycsICdzd2l0Y2gnLCAndGFiJ10sXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1t0eXBlPWltYWdlXScsXG4gICAgICBpbXBsaWNpdDogJ2J1dHRvbicsXG4gICAgICByb2xlczogWydsaW5rJywgJ21lbnVpdGVtJywgJ21lbnVpdGVtY2hlY2tib3gnLCAnbWVudWl0ZW1yYWRpbycsICdyYWRpbycsICdzd2l0Y2gnXSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW3R5cGU9Y2hlY2tib3hdJyxcbiAgICAgIGltcGxpY2l0OiAnY2hlY2tib3gnLFxuICAgICAgcm9sZXM6IFsnYnV0dG9uJywgJ21lbnVpdGVtY2hlY2tib3gnLCAnc3dpdGNoJ10sXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJzpub3QoW3R5cGVdKSxbdHlwZT10ZWxdLFt0eXBlPXRleHRdLFt0eXBlPXVybF0nLFxuICAgICAgaW1wbGljaXQ6ICd0ZXh0Ym94JyxcbiAgICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW3R5cGU9ZW1haWxdJyxcbiAgICAgIGltcGxpY2l0OiAndGV4dGJveCcsXG4gICAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1t0eXBlPWhpZGRlbl0nLFxuICAgICAgYXJpYTogZmFsc2UsXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1t0eXBlPW51bWJlcl0nLFxuICAgICAgaW1wbGljaXQ6ICdzcGluYnV0dG9uJyxcbiAgICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW3R5cGU9cmFkaW9dJyxcbiAgICAgIGltcGxpY2l0OiAncmFkaW8nLFxuICAgICAgcm9sZXM6IFsnbWVudWl0ZW1yYWRpbyddLFxuICAgIH0pLFxuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3I6ICdbdHlwZT1yYW5nZV0nLFxuICAgICAgaW1wbGljaXQ6ICdzbGlkZXInLFxuICAgICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICAgIH0pLFxuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3I6ICdbdHlwZT1yZXNldF0sW3R5cGU9c3VibWl0XScsXG4gICAgICBpbXBsaWNpdDogJ2J1dHRvbicsXG4gICAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1t0eXBlPXNlYXJjaF0nLFxuICAgICAgaW1wbGljaXQ6ICdzZWFyY2hib3gnLFxuICAgICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICAgIH0pLFxuICAgIG5vUm9sZSxcbiAgXSxcbiAgaW5zOiBhbnlSb2xlLFxuICBkZWw6IGFueVJvbGUsXG4gIGxhYmVsOiBub1JvbGUsXG4gIGxlZ2VuZDogbm9Sb2xlLFxuICBsaTogW1xuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3I6ICdvbD5saSx1bD5saScsXG4gICAgICBpbXBsaWNpdDogJ2xpc3RpdGVtJyxcbiAgICAgIHJvbGVzOiBbXG4gICAgICAgICdtZW51aXRlbScsICdtZW51aXRlbWNoZWNrYm94JywgJ21lbnVpdGVtcmFkaW8nLCAnb3B0aW9uJyxcbiAgICAgICAgJ3ByZXNlbnRhdGlvbicsICdzZXBhcmF0b3InLCAndGFiJywgJ3RyZWVpdGVtJyxcbiAgICAgIF0sXG4gICAgfSksXG4gIF0sXG4gIGxpbms6IFtcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW2hyZWZdJyxcbiAgICAgIGltcGxpY2l0OiAnbGluaycsXG4gICAgICBnbG9iYWxBcmlhOiBmYWxzZSxcbiAgICB9KSxcbiAgXSxcbiAgbWFpbjogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdtYWluJyxcbiAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gIH0pLFxuICBtYXA6IG5vUm9sZU9yQXJpYSxcbiAgbWF0aDogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdtYXRoJyxcbiAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gIH0pLFxuICBtZW51OiBbXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1t0eXBlPWNvbnRleHRdJyxcbiAgICAgIGltcGxpY2l0OiAnbWVudScsXG4gICAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gICAgfSksXG4gIF0sXG4gIG1lbnVpdGVtOiBbXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1t0eXBlPWNvbW1hbmRdJyxcbiAgICAgIGltcGxpY2l0OiAnbWVudWl0ZW0nLFxuICAgICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICAgIH0pLFxuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3I6ICdbdHlwZT1jaGVja2JveF0nLFxuICAgICAgaW1wbGljaXQ6ICdtZW51aXRlbWNoZWNrYm94JyxcbiAgICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW3R5cGU9cmFkaW9dJyxcbiAgICAgIGltcGxpY2l0OiAnbWVudWl0ZW1yYWRpbycsXG4gICAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gICAgfSksXG4gIF0sXG4gIG1ldGE6IG5vUm9sZU9yQXJpYSxcbiAgbWV0ZXI6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAncHJvZ3Jlc3NiYXInLFxuICB9KSxcbiAgbmF2OiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ25hdmlnYXRpb24nLFxuICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgfSksXG4gIG5vc2NyaXB0OiBub1JvbGVPckFyaWEsXG4gIG9iamVjdDogcnVsZSh7XG4gICAgcm9sZXM6IFsnYXBwbGljYXRpb24nLCAnZG9jdW1lbnQnLCAnaW1nJ10sXG4gIH0pLFxuICBvbDogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdsaXN0JyxcbiAgICByb2xlczogW1xuICAgICAgJ2RpcmVjdG9yeScsICdncm91cCcsICdsaXN0Ym94JywgJ21lbnUnLCAnbWVudWJhcicsICdwcmVzZW50YXRpb24nLFxuICAgICAgJ3JhZGlvZ3JvdXAnLCAndGFibGlzdCcsICd0b29sYmFyJywgJ3RyZWUnLFxuICAgIF0sXG4gIH0pLFxuICBvcHRncm91cDogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdncm91cCcsXG4gICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICB9KSxcbiAgb3B0aW9uOiBbXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ3NlbGVjdD5vcHRpb24sc2VsZWN0Pm9wdGdyb3VwPm9wdGlvbixkYXRhbGlzdD5vcHRpb24nLFxuICAgICAgaW1wbGljaXQ6ICdvcHRpb24nLFxuICAgICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICAgIH0pLFxuICAgIG5vUm9sZU9yQXJpYSxcbiAgXSxcbiAgb3V0cHV0OiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ3N0YXR1cycsXG4gICAgYW55Um9sZTogdHJ1ZSxcbiAgfSksXG4gIHBhcmFtOiBub1JvbGVPckFyaWEsXG4gIHBpY3R1cmU6IG5vUm9sZU9yQXJpYSxcbiAgcHJvZ3Jlc3M6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAncHJvZ3Jlc3NiYXInLFxuICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgfSksXG4gIHNjcmlwdDogbm9Sb2xlT3JBcmlhLFxuICBzZWN0aW9uOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ3JlZ2lvbicsXG4gICAgcm9sZXM6IFtcbiAgICAgICdhbGVydCcsICdhbGVydGRpYWxvZycsICdhcHBsaWNhdGlvbicsICdiYW5uZXInLCAnY29tcGxlbWVudGFyeScsXG4gICAgICAnY29udGVudGluZm8nLCAnZGlhbG9nJywgJ2RvY3VtZW50JywgJ2ZlZWQnLCAnbG9nJywgJ21haW4nLCAnbWFycXVlZScsXG4gICAgICAnbmF2aWdhdGlvbicsICdzZWFyY2gnLCAnc3RhdHVzJywgJ3RhYnBhbmVsJyxcbiAgICBdLFxuICB9KSxcbiAgc2VsZWN0OiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2xpc3Rib3gnLFxuICAgIHJvbGVzOiBbJ21lbnUnXSxcbiAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gIH0pLFxuICBzb3VyY2U6IG5vUm9sZU9yQXJpYSxcbiAgc3BhbjogYW55Um9sZSxcbiAgc3R5bGU6IG5vUm9sZU9yQXJpYSxcbiAgc3ZnOiBydWxlKHtcbiAgICByb2xlczogWydhcHBsaWNhdGlvbicsICdkb2N1bWVudCcsICdpbWcnXSxcbiAgfSksXG4gIHN1bW1hcnk6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnYnV0dG9uJyxcbiAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gIH0pLFxuICB0YWJsZTogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICd0YWJsZScsXG4gICAgYW55Um9sZTogdHJ1ZSxcbiAgfSksXG4gIHRlbXBsYXRlOiBub1JvbGVPckFyaWEsXG4gIHRleHRhcmVhOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ3RleHRib3gnLFxuICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgfSksXG4gIHRib2R5OiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ3Jvd2dyb3VwJyxcbiAgICBhbnlSb2xlOiB0cnVlLFxuICB9KSxcbiAgdGhlYWQ6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAncm93Z3JvdXAnLFxuICAgIGFueVJvbGU6IHRydWUsXG4gIH0pLFxuICB0Zm9vdDogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdyb3dncm91cCcsXG4gICAgYW55Um9sZTogdHJ1ZSxcbiAgfSksXG4gIHRpdGxlOiBub1JvbGVPckFyaWEsXG4gIHRkOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2NlbGwnLFxuICAgIGFueVJvbGU6IHRydWUsXG4gIH0pLFxuICBlbTogYW55Um9sZSxcbiAgc3Ryb25nOiBhbnlSb2xlLFxuICBzbWFsbDogYW55Um9sZSxcbiAgczogYW55Um9sZSxcbiAgY2l0ZTogYW55Um9sZSxcbiAgcTogYW55Um9sZSxcbiAgZGZuOiBhbnlSb2xlLFxuICBhYmJyOiBhbnlSb2xlLFxuICB0aW1lOiBhbnlSb2xlLFxuICBjb2RlOiBhbnlSb2xlLFxuICB2YXI6IGFueVJvbGUsXG4gIHNhbXA6IGFueVJvbGUsXG4gIGtiZDogYW55Um9sZSxcbiAgc3ViOiBhbnlSb2xlLFxuICBzdXA6IGFueVJvbGUsXG4gIGk6IGFueVJvbGUsXG4gIGI6IGFueVJvbGUsXG4gIHU6IGFueVJvbGUsXG4gIG1hcms6IGFueVJvbGUsXG4gIHJ1Ynk6IGFueVJvbGUsXG4gIHJiOiBhbnlSb2xlLFxuICBydGM6IGFueVJvbGUsXG4gIHJ0OiBhbnlSb2xlLFxuICBycDogYW55Um9sZSxcbiAgYmRpOiBhbnlSb2xlLFxuICBiZG86IGFueVJvbGUsXG4gIGJyOiBhbnlSb2xlLFxuICB3YnI6IGFueVJvbGUsXG4gIHRoOiBydWxlKHtcbiAgICBpbXBsaWNpdDogWydjb2x1bW5oZWFkZXInLCAncm93aGVhZGVyJ10sXG4gICAgYW55Um9sZTogdHJ1ZSxcbiAgfSksXG4gIHRyOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ3JvdycsXG4gICAgYW55Um9sZTogdHJ1ZSxcbiAgfSksXG4gIHRyYWNrOiBub1JvbGVPckFyaWEsXG4gIHVsOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2xpc3QnLFxuICAgIHJvbGVzOiBbXG4gICAgICAnZGlyZWN0b3J5JywgJ2dyb3VwJywgJ2xpc3Rib3gnLCAnbWVudScsICdtZW51YmFyJyxcbiAgICAgICdyYWRpb2dyb3VwJywgJ3RhYmxpc3QnLCAndG9vbGJhcicsICd0cmVlJywgJ3ByZXNlbnRhdGlvbicsXG4gICAgXSxcbiAgfSksXG4gIHZpZGVvOiBydWxlKHtcbiAgICByb2xlczogWydhcHBsaWNhdGlvbiddLFxuICB9KSxcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICogIEFyaWEgcHJvcGVydGllc1xuICovXG5cbi8qKlxuICogRGVzY3JpYmVzIGFuIGFyaWEgdmFsdWVcbiAqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBhcmlhVmFsdWVcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSB0eXBlIE9uZSBvZiBzdHJpbmcsIGludGVnZXIsIG51bWJlciwgaWQsIGlkbGlzdCwgdG9rZW4sIHRva2VubGlzdFxuICogQHByb3BlcnR5IHtTdHJpbmdbXX0gdG9rZW5zXG4gKiBAcHJvcGVydHkge1N0cmluZ1tdfSBhbG9uZVxuICovXG5cbi8qKlxuICogRGVzY3JpYmVzIGFuIGFyaWEgcHJvcGVydHlcbiAqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBhcmlhUHJvcGVydHlcbiAqIEBwcm9wZXJ0eSB7YXJpYVZhbHVlfSB2YWx1ZXNcbiAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gZ2xvYmFsXG4gKi9cblxuY29uc3QgYm9vbGVhbiA9IHtcbiAgdHlwZTogJ3Rva2VuJyxcbiAgdG9rZW5zOiBbJ3RydWUnLCAnZmFsc2UnXSxcbn07XG5cbmNvbnN0IHRyaXN0YXRlID0ge1xuICB0eXBlOiAndG9rZW4nLFxuICB0b2tlbnM6IFsndHJ1ZScsICdmYWxzZScsICdtaXhlZCcsICd1bmRlZmluZWQnXSxcbn07XG5cbmNvbnN0IG5pbGFibGVCb29sZWFuID0ge1xuICB0eXBlOiAndG9rZW4nLFxuICB0b2tlbnM6IFsndHJ1ZScsICdmYWxzZScsICd1bmRlZmluZWQnXSxcbn07XG5cblxuLyoqIEBlbnVtIHthcmlhUHJvcGVydHl9ICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWN0aXZlZGVzY2VuZGFudDoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnaWQnIH0sXG4gIH0sXG4gIGF0b21pYzoge1xuICAgIHZhbHVlczogYm9vbGVhbixcbiAgICBnbG9iYWw6IHRydWUsXG4gIH0sXG4gIGF1dG9jb21wbGV0ZToge1xuICAgIHZhbHVlczoge1xuICAgICAgdHlwZTogJ3Rva2VuJyxcbiAgICAgIHRva2VuczogWydpbmxpbmUnLCAnbGlzdCcsICdib3RoJywgJ25vbmUnXSxcbiAgICB9LFxuICB9LFxuICBidXN5OiB7XG4gICAgdmFsdWVzOiBib29sZWFuLFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgY2hlY2tlZDoge1xuICAgIHZhbHVlczogdHJpc3RhdGUsXG4gIH0sXG4gIGNvbGNvdW50OiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdpbnRlZ2VyJyB9LFxuICB9LFxuICBjb2xpbmRleDoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnaW50ZWdlcicgfSxcbiAgfSxcbiAgY29sc3Bhbjoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnaW50ZWdlcicgfSxcbiAgfSxcbiAgY29udHJvbHM6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ2lkbGlzdCcgfSxcbiAgICBnbG9iYWw6IHRydWUsXG4gIH0sXG4gIGN1cnJlbnQ6IHtcbiAgICB2YWx1ZXM6IHtcbiAgICAgIHR5cGU6ICd0b2tlbicsXG4gICAgICB0b2tlbnM6IFsncGFnZScsICdzdGVwJywgJ2xvY2F0aW9uJywgJ2RhdGUnLCAndGltZScsICd0cnVlJywgJ2ZhbHNlJ10sXG4gICAgfSxcbiAgICBnbG9iYWw6IHRydWUsXG4gIH0sXG4gIGRlc2NyaWJlZGJ5OiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdpZGxpc3QnIH0sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBkZXRhaWxzOiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdpZCcgfSxcbiAgICBnbG9iYWw6IHRydWUsXG4gIH0sXG4gIGRpc2FibGVkOiB7XG4gICAgdmFsdWVzOiBib29sZWFuLFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgZHJvcGVmZmVjdDoge1xuICAgIHZhbHVlczoge1xuICAgICAgdHlwZTogJ3Rva2VubGlzdCcsXG4gICAgICB0b2tlbnM6IFsnY29weScsICdleGVjdXRlJywgJ2xpbmsnLCAnbW92ZScsICdub25lJywgJ3BvcHVwJ10sXG4gICAgICBhbG9uZTogWydub25lJ10sXG4gICAgfSxcbiAgICBkZXByZWNhdGVkOiB0cnVlLFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgZXJyb3JtZXNzYWdlOiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdpZCcgfSxcbiAgICBnbG9iYWw6IHRydWUsXG4gIH0sXG4gIGV4cGFuZGVkOiB7XG4gICAgdmFsdWVzOiBuaWxhYmxlQm9vbGVhbixcbiAgfSxcbiAgZmxvd3RvOiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdpZGxpc3QnIH0sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBncmFiYmVkOiB7XG4gICAgdmFsdWVzOiBuaWxhYmxlQm9vbGVhbixcbiAgICBkZXByZWNhdGVkOiB0cnVlLFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgaGFzcG9wdXA6IHtcbiAgICB2YWx1ZXM6IHtcbiAgICAgIHR5cGU6ICd0b2tlbicsXG4gICAgICB0b2tlbnM6IFsnZmFsc2UnLCAndHJ1ZScsICdtZW51JywgJ2xpc3Rib3gnLCAndHJlZScsICdncmlkJywgJ2RpYWxvZyddLFxuICAgIH0sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBoaWRkZW46IHtcbiAgICB2YWx1ZXM6IG5pbGFibGVCb29sZWFuLFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgaW52YWxpZDoge1xuICAgIHZhbHVlczoge1xuICAgICAgdHlwZTogJ3Rva2VuJyxcbiAgICAgIHRva2VuczogWydncmFtbWFyJywgJ2ZhbHNlJywgJ3NwZWxsaW5nJywgJ3RydWUnXSxcbiAgICB9LFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAga2V5c2hvcnRjdXRzOiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBsYWJlbDoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgbGFiZWxsZWRieToge1xuICAgIHZhbHVlczogeyB0eXBlOiAnaWRsaXN0JyB9LFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgbGV2ZWw6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ2ludGVnZXInIH0sXG4gIH0sXG4gIGxpdmU6IHtcbiAgICB2YWx1ZXM6IHtcbiAgICAgIHR5cGU6ICd0b2tlbicsXG4gICAgICB0b2tlbnM6IFsnYXNzZXJ0aXZlJywgJ29mZicsICdwb2xpdGUnXSxcbiAgICB9LFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgbW9kYWw6IHtcbiAgICB2YWx1ZXM6IGJvb2xlYW4sXG4gIH0sXG4gIG11bHRpbGluZToge1xuICAgIHZhbHVlczogYm9vbGVhbixcbiAgfSxcbiAgbXVsdGlzZWxlY3RhYmxlOiB7XG4gICAgdmFsdWVzOiBib29sZWFuLFxuICB9LFxuICBvcmllbnRhdGlvbjoge1xuICAgIHZhbHVlczoge1xuICAgICAgdHlwZTogJ3Rva2VuJyxcbiAgICAgIHRva2VuczogWydob3Jpem9udGFsJywgJ3VuZGVmaW5lZCcsICd2ZXJ0aWNhbCddLFxuICAgIH0sXG4gIH0sXG4gIG93bnM6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ2lkbGlzdCcgfSxcbiAgICBnbG9iYWw6IHRydWUsXG4gIH0sXG4gIHBsYWNlaG9sZGVyOiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gIH0sXG4gIHBvc2luc2V0OiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdpbnRlZ2VyJyB9LFxuICB9LFxuICBwcmVzc2VkOiB7XG4gICAgdmFsdWVzOiB0cmlzdGF0ZSxcbiAgfSxcbiAgcmVhZG9ubHk6IHtcbiAgICB2YWx1ZXM6IGJvb2xlYW4sXG4gIH0sXG4gIHJlbGV2YW50OiB7XG4gICAgdmFsdWVzOiB7XG4gICAgICB0eXBlOiAndG9rZW5saXN0JyxcbiAgICAgIHRva2VuczogWydhZGRpdGlvbnMnLCAnYWxsJywgJ3JlbW92YWxzJywgJ3RleHQnXSxcbiAgICAgIGFsb25lOiBbJ2FsbCddLFxuICAgIH0sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICByZXF1aXJlZDoge1xuICAgIHZhbHVlczogYm9vbGVhbixcbiAgfSxcbiAgcm9sZWRlc2NyaXB0aW9uOiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICByb3djb3VudDoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnaW50ZWdlcicgfSxcbiAgfSxcbiAgcm93aW5kZXg6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ2ludGVnZXInIH0sXG4gIH0sXG4gIHJvd3NwYW46IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ2ludGVnZXInIH0sXG4gIH0sXG4gIHNlbGVjdGVkOiB7XG4gICAgdmFsdWVzOiBuaWxhYmxlQm9vbGVhbixcbiAgfSxcbiAgc2V0c2l6ZToge1xuICAgIHZhbHVlczogeyB0eXBlOiAnaW50ZWdlcicgfSxcbiAgfSxcbiAgc29ydDoge1xuICAgIHZhbHVlczoge1xuICAgICAgdHlwZTogJ3Rva2VuJyxcbiAgICAgIHRva2VuczogWydhc2NlbmRpbmcnLCAnZGVzY2VuZGluZycsICdub25lJywgJ290aGVyJ10sXG4gICAgfSxcbiAgfSxcbiAgdmFsdWVtYXg6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgfSxcbiAgdmFsdWVtaW46IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgfSxcbiAgdmFsdWVub3c6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgfSxcbiAgdmFsdWV0ZXh0OiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gIH0sXG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKipcbiAqIERhdGEgZm9yIEhUTUwgZWxlbWVudHMuICBCYXNlZCBvblxuICogLSBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUyL1xuICogLSBodHRwczovL3czYy5naXRodWIuaW8vaHRtbC1hcmlhL1xuICovXG5cbi8qKlxuICogRGVzY3JpYmVzIGFuIGFyaWEgcHJvcGVydHlcbiAqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBodG1sRWxlbWVudFxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gbmF0aXZlTGFiZWxcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IG5hdGl2ZURlc2NyaXB0aW9uXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59IG9ic29sZXRlXG4gKi9cblxuY29uc3QgbGFiZWxzID0gKGVsLCB1dGlscykgPT4ge1xuICBsZXQgZm91bmQgPSBbXTtcbiAgLy8gSWYgbW9yZSB0aGFuIG9uZSBlbGVtZW50IGhhcyBvdXIgSUQgd2UgbXVzdCBiZSB0aGUgZmlyc3RcbiAgaWYgKGVsLmlkICYmIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsLmlkKSA9PT0gZWwpIHtcbiAgICBmb3VuZCA9IHV0aWxzLiQkKGBsYWJlbFtmb3I9XCIke3V0aWxzLmNzc0VzY2FwZShlbC5pZCl9XCJdYCk7XG4gIH1cbiAgZm91bmQucHVzaChlbC5jbG9zZXN0KCdsYWJlbDpub3QoW2Zvcl0pJykpO1xuICByZXR1cm4gZm91bmQuZmlsdGVyKEJvb2xlYW4pLmZpbHRlcihlbG0gPT4gIXV0aWxzLmhpZGRlbihlbG0sIHsgYXJpYUhpZGRlbjogdHJ1ZSB9KSk7XG59O1xuXG5jb25zdCBvYnNvbGV0ZSA9IHsgb2Jzb2xldGU6IHRydWUgfTtcblxuLyoqIEBlbnVtIHtodG1sRWxlbWVudH0gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhOiB7fSxcbiAgYWJicjoge30sXG4gIGFjcm9ueW06IG9ic29sZXRlLFxuICBhZGRyZXNzOiB7fSxcbiAgYXBwbGV0OiBvYnNvbGV0ZSxcbiAgYXJlYToge1xuICAgIG5hdGl2ZUxhYmVsKGVsKSB7XG4gICAgICByZXR1cm4gZWwuYWx0IHx8ICcnO1xuICAgIH0sXG4gIH0sXG4gIGFydGljbGU6IHt9LFxuICBhc2lkZToge30sXG4gIGF1ZGlvOiB7fSxcbiAgYjoge30sXG4gIGJhc2U6IHt9LFxuICBiYXNlZm9udDogb2Jzb2xldGUsXG4gIGJkaToge30sXG4gIGJkbzoge30sXG4gIGJnc291bmQ6IG9ic29sZXRlLFxuICBiaWc6IG9ic29sZXRlLFxuICBibGluazogb2Jzb2xldGUsXG4gIGJsb2NrcXVvdGU6IHt9LFxuICBib2R5OiB7fSxcbiAgYnI6IHt9LFxuICBidXR0b246IHtcbiAgICBuYXRpdmVMYWJlbDogbGFiZWxzLFxuICB9LFxuICBjYW52YXM6IHt9LFxuICBjYXB0aW9uOiB7fSxcbiAgY2VudGVyOiBvYnNvbGV0ZSxcbiAgY2l0ZToge30sXG4gIGNvZGU6IHt9LFxuICBjb2w6IHt9LFxuICBjb2xncm91cDoge30sXG4gIGNvbW1hbmQ6IG9ic29sZXRlLFxuICBkYXRhOiB7fSxcbiAgZGF0YWxpc3Q6IHt9LFxuICBkZDoge30sXG4gIGRlbDoge30sXG4gIGRldGFpbHM6IHtcbiAgICBuYXRpdmVMYWJlbChlbCwgdXRpbHMpIHtcbiAgICAgIGNvbnN0IGZvdW5kID0gZWwucXVlcnlTZWxlY3Rvcignc3VtbWFyeScpO1xuICAgICAgaWYgKGZvdW5kICYmIHV0aWxzLmhpZGRlbihmb3VuZCwgeyBhcmlhSGlkZGVuOiB0cnVlIH0pKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZvdW5kO1xuICAgIH0sXG4gICAgdW5zdXBwb3J0ZWQ6IHRydWUsXG4gIH0sXG4gIGRmbjoge30sXG4gIGRpYWxvZzoge1xuICAgIHVuc3VwcG9ydGVkOiB0cnVlLFxuICB9LFxuICBkaXI6IG9ic29sZXRlLFxuICBkaXY6IHt9LFxuICBkbDoge30sXG4gIGR0OiB7fSxcbiAgZW06IHt9LFxuICBlbWJlZDoge30sXG4gIGZpZWxkc2V0OiB7XG4gICAgbmF0aXZlTGFiZWwoZWwsIHV0aWxzKSB7XG4gICAgICBjb25zdCBmb3VuZCA9IGVsLnF1ZXJ5U2VsZWN0b3IoJ2xlZ2VuZCcpO1xuICAgICAgaWYgKGZvdW5kICYmIHV0aWxzLmhpZGRlbihmb3VuZCwgeyBhcmlhSGlkZGVuOiB0cnVlIH0pKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZvdW5kO1xuICAgIH0sXG4gIH0sXG4gIGZpZ2NhcHRpb246IHt9LFxuICBmaWd1cmU6IHt9LFxuICBmb250OiBvYnNvbGV0ZSxcbiAgZm9vdGVyOiB7fSxcbiAgZm9ybToge30sXG4gIGZyYW1lOiBvYnNvbGV0ZSxcbiAgZnJhbWVzZXQ6IG9ic29sZXRlLFxuICBoMToge30sXG4gIGgyOiB7fSxcbiAgaDM6IHt9LFxuICBoNDoge30sXG4gIGg1OiB7fSxcbiAgaDY6IHt9LFxuICBoZWFkOiB7fSxcbiAgaGVhZGVyOiB7fSxcbiAgaGdyb3VwOiBvYnNvbGV0ZSxcbiAgaHI6IHt9LFxuICBodG1sOiB7fSxcbiAgaToge30sXG4gIGlmcmFtZToge30sXG4gIGltYWdlOiBvYnNvbGV0ZSxcbiAgaW1nOiB7XG4gICAgbmF0aXZlTGFiZWwoZWwpIHtcbiAgICAgIHJldHVybiBlbC5hbHQgfHwgJyc7XG4gICAgfSxcbiAgfSxcbiAgaW5wdXQ6IHtcbiAgICBuYXRpdmVMYWJlbChlbCwgdXRpbHMpIHtcbiAgICAgIGlmIChlbC50eXBlID09PSAnaGlkZGVuJykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKGVsLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgcmV0dXJuIGVsLmFsdCB8fCBlbC52YWx1ZSB8fCAnJztcbiAgICAgIH1cblxuICAgICAgaWYgKFsnc3VibWl0JywgJ3Jlc2V0JywgJ2J1dHRvbiddLmluY2x1ZGVzKGVsLnR5cGUpKSB7XG4gICAgICAgIHJldHVybiBlbC52YWx1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGxhYmVscyhlbCwgdXRpbHMpO1xuICAgIH0sXG4gIH0sXG4gIGluczoge30sXG4gIGlzaW5kZXg6IG9ic29sZXRlLFxuICBrYmQ6IHt9LFxuICBrZXlnZW46IG9ic29sZXRlLFxuICBsYWJlbDoge30sXG4gIGxlZ2VuZDoge30sXG4gIGxpOiB7fSxcbiAgbGluazoge30sXG4gIGxpc3Rpbmc6IG9ic29sZXRlLFxuICBtYWluOiB7fSxcbiAgbWFwOiB7fSxcbiAgbWFyazoge30sXG4gIG1hcnF1ZWU6IG9ic29sZXRlLFxuICBtYXRoOiB7fSxcbiAgbWVudToge1xuICAgIHVuc3VwcG9ydGVkOiB0cnVlLFxuICB9LFxuICBtZW51aXRlbToge1xuICAgIHVuc3VwcG9ydGVkOiB0cnVlLFxuICB9LFxuICBtZXRhOiB7fSxcbiAgbWV0ZXI6IHtcbiAgICBuYXRpdmVMYWJlbDogbGFiZWxzLFxuICB9LFxuICBtdWx0aWNvbDogb2Jzb2xldGUsXG4gIG5hdjoge30sXG4gIG5leHRpZDogb2Jzb2xldGUsXG4gIG5vYnI6IG9ic29sZXRlLFxuICBub2VtYmVkOiBvYnNvbGV0ZSxcbiAgbm9mcmFtZXM6IG9ic29sZXRlLFxuICBub3NjcmlwdDoge30sXG4gIG9iamVjdDoge30sXG4gIG9sOiB7fSxcbiAgb3B0Z3JvdXA6IHt9LFxuICBvcHRpb246IHt9LFxuICBvdXRwdXQ6IHtcbiAgICBuYXRpdmVMYWJlbDogbGFiZWxzLFxuICB9LFxuICBwOiB7fSxcbiAgcGFyYW06IHt9LFxuICBwaWN0dXJlOiB7fSxcbiAgcGxhaW50ZXh0OiBvYnNvbGV0ZSxcbiAgcHJlOiB7fSxcbiAgcHJvZ3Jlc3M6IHtcbiAgICBuYXRpdmVMYWJlbDogbGFiZWxzLFxuICB9LFxuICBxOiB7fSxcbiAgcmI6IHt9LFxuICBycDoge30sXG4gIHJ0OiB7fSxcbiAgcnRjOiB7fSxcbiAgcnVieToge30sXG4gIHM6IHt9LFxuICBzYW1wOiB7fSxcbiAgc2NyaXB0OiB7fSxcbiAgc2VjdGlvbjoge30sXG4gIHNlbGVjdDoge1xuICAgIG5hdGl2ZUxhYmVsOiBsYWJlbHMsXG4gIH0sXG4gIHNtYWxsOiB7fSxcbiAgc291cmNlOiB7fSxcbiAgc3BhY2VyOiBvYnNvbGV0ZSxcbiAgc3Bhbjoge30sXG4gIHN0cmlrZTogb2Jzb2xldGUsXG4gIHN0cm9uZzoge30sXG4gIHN0eWxlOiB7fSxcbiAgc3ViOiB7fSxcbiAgc3VtbWFyeToge1xuICAgIHVuc3VwcG9ydGVkOiB0cnVlLFxuICB9LFxuICBzdXA6IHt9LFxuICBzdmc6IHt9LFxuICB0YWJsZToge30sXG4gIHRib2R5OiB7fSxcbiAgdGQ6IHt9LFxuICB0ZW1wbGF0ZToge30sXG4gIHRleHRhcmVhOiB7XG4gICAgbmF0aXZlTGFiZWw6IGxhYmVscyxcbiAgfSxcbiAgdGZvb3Q6IHt9LFxuICB0aDoge30sXG4gIHRoZWFkOiB7fSxcbiAgdGltZToge30sXG4gIHRpdGxlOiB7fSxcbiAgdHI6IHt9LFxuICB0cmFjazoge30sXG4gIHR0OiBvYnNvbGV0ZSxcbiAgdToge30sXG4gIHVsOiB7fSxcbiAgdmFyOiB7fSxcbiAgdmlkZW86IHt9LFxuICB3YnI6IHt9LFxuICB4bXA6IG9ic29sZXRlLFxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuZXhwb3J0cy5ldmVudEhhbmRsZXJBdHRyaWJ1dGVzID0gW1xuICAnb25hYm9ydCcsXG4gICdvbmF1eGNsaWNrJyxcbiAgJ29uYmx1cicsXG4gICdvbmNhbmNlbCcsXG4gICdvbmNhbnBsYXknLFxuICAnb25jYW5wbGF5dGhyb3VnaCcsXG4gICdvbmNoYW5nZScsXG4gICdvbmNsaWNrJyxcbiAgJ29uY2xvc2UnLFxuICAnb25jb250ZXh0bWVudScsXG4gICdvbmN1ZWNoYW5nZScsXG4gICdvbmRibGNsaWNrJyxcbiAgJ29uZHJhZycsXG4gICdvbmRyYWdlbmQnLFxuICAnb25kcmFnZW50ZXInLFxuICAnb25kcmFnZXhpdCcsXG4gICdvbmRyYWdsZWF2ZScsXG4gICdvbmRyYWdvdmVyJyxcbiAgJ29uZHJhZ3N0YXJ0JyxcbiAgJ29uZHJvcCcsXG4gICdvbmR1cmF0aW9uY2hhbmdlJyxcbiAgJ29uZW1wdGllZCcsXG4gICdvbmVuZGVkJyxcbiAgJ29uZXJyb3InLFxuICAnb25mb2N1cycsXG4gICdvbmlucHV0JyxcbiAgJ29uaW52YWxpZCcsXG4gICdvbmtleWRvd24nLFxuICAnb25rZXlwcmVzcycsXG4gICdvbmtleXVwJyxcbiAgJ29ubG9hZCcsXG4gICdvbmxvYWRlZGRhdGEnLFxuICAnb25sb2FkZWRtZXRhZGF0YScsXG4gICdvbmxvYWRlbmQnLFxuICAnb25sb2Fkc3RhcnQnLFxuICAnb25tb3VzZWRvd24nLFxuICAnb25tb3VzZWVudGVyJyxcbiAgJ29ubW91c2VsZWF2ZScsXG4gICdvbm1vdXNlbW92ZScsXG4gICdvbm1vdXNlb3V0JyxcbiAgJ29ubW91c2VvdmVyJyxcbiAgJ29ubW91c2V1cCcsXG4gICdvbndoZWVsJyxcbiAgJ29ucGF1c2UnLFxuICAnb25wbGF5JyxcbiAgJ29ucGxheWluZycsXG4gICdvbnByb2dyZXNzJyxcbiAgJ29ucmF0ZWNoYW5nZScsXG4gICdvbnJlc2V0JyxcbiAgJ29ucmVzaXplJyxcbiAgJ29uc2Nyb2xsJyxcbiAgJ29uc2Vla2VkJyxcbiAgJ29uc2Vla2luZycsXG4gICdvbnNlbGVjdCcsXG4gICdvbnNob3cnLFxuICAnb25zdGFsbGVkJyxcbiAgJ29uc3VibWl0JyxcbiAgJ29uc3VzcGVuZCcsXG4gICdvbnRpbWV1cGRhdGUnLFxuICAnb250b2dnbGUnLFxuICAnb252b2x1bWVjaGFuZ2UnLFxuICAnb253YWl0aW5nJyxcbl07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IGFsbG93ZWRBcmlhID0gcmVxdWlyZSgnLi9hbGxvd2VkLWFyaWEnKTtcbmNvbnN0IGFyaWFBdHRyaWJ1dGVzID0gcmVxdWlyZSgnLi9hcmlhLWF0dHJpYnV0ZXMnKTtcbmNvbnN0IGVsZW1lbnRzID0gcmVxdWlyZSgnLi9lbGVtZW50cycpO1xuY29uc3QgYXR0cmlidXRlcyA9IHJlcXVpcmUoJy4vZXZlbnQtaGFuZGxlci1hdHRyaWJ1dGVzJyk7XG5jb25zdCByb2xlcyA9IHJlcXVpcmUoJy4vcm9sZXMnKTtcblxuZnVuY3Rpb24gZXh0ZW5kRWxlbWVudHMob3JpZ2luYWwsIGNvbmZpZykge1xuICBjb25zdCBzZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIG9yaWdpbmFsKTtcbiAgaWYgKGNvbmZpZykge1xuICAgIE9iamVjdC5lbnRyaWVzKGNvbmZpZykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgIGRlbGV0ZSBzZXR0aW5nc1trZXldO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZXR0aW5nc1trZXldID0gT2JqZWN0LmFzc2lnbih7fSwgc2V0dGluZ3Nba2V5XSB8fCB7fSwgdmFsdWUpO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiBzZXR0aW5ncztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb25maWcge1xuICBjb25zdHJ1Y3RvcihzZXR0aW5ncyA9IHt9KSB7XG4gICAgdGhpcy5hbGxvd2VkQXJpYSA9IGFsbG93ZWRBcmlhO1xuICAgIHRoaXMuYXJpYUF0dHJpYnV0ZXMgPSBhcmlhQXR0cmlidXRlcztcbiAgICB0aGlzLmVsZW1lbnRzID0gZXh0ZW5kRWxlbWVudHMoZWxlbWVudHMsIHNldHRpbmdzLmVsZW1lbnRzKTtcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuICAgIHRoaXMucm9sZXMgPSByb2xlcztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiBSdWxlcyBmb3IgYXJpYSBwcm9wZXJ0aWVzXG4gKlxuICogaHR0cHM6Ly93M2MuZ2l0aHViLmlvL2h0bWwtYXJpYS9cbiAqL1xuXG4vKipcbiAqIERlc2NyaWJlcyBhbiBhcmlhIHJvbGVcbiAqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBhcmlhUm9sZVxuICogQHByb3BlcnR5IHtTdHJpbmdbXX0gYWxsb3dlZFxuICogQHByb3BlcnR5IHtTdHJpbmdbXX0gc3ViY2xhc3NcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nW119IHJlcXVpcmVkIFJlcXVpcmVkIGFyaWEgcHJvcGVydGllc1xuICogQHByb3BlcnR5IHtCb29sZWFufSBuYW1lRnJvbUNvbnRlbnRcbiAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gYWJzdHJhY3RcbiAqL1xuXG4vKiogQGVudW0ge2FyaWFSb2xlfSAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFsZXJ0OiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICAgIHN1YmNsYXNzOiBbJ2FsZXJ0ZGlhbG9nJ10sXG4gIH0sXG4gIGFsZXJ0ZGlhbG9nOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCcsICdtb2RhbCddLFxuICB9LFxuICBhcHBsaWNhdGlvbjoge1xuICAgIGFsbG93ZWQ6IFsnYWN0aXZlZGVzY2VuZGFudCddLFxuICB9LFxuICBhcnRpY2xlOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICBiYW5uZXI6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIGJ1dHRvbjoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnLCAncHJlc3NlZCddLFxuICAgIG5hbWVGcm9tQ29udGVudDogdHJ1ZSxcbiAgfSxcbiAgY2VsbDoge1xuICAgIGFsbG93ZWQ6IFsnY29saW5kZXgnLCAnY29sc3BhbicsICdleHBhbmRlZCcsICdyb3dpbmRleCcsICdyb3dzcGFuJ10sXG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICAgIHN1YmNsYXNzOiBbJ2NvbHVtbmhlYWRlcicsICdncmlkY2VsbCcsICdyb3doZWFkZXInXSxcbiAgfSxcbiAgY2hlY2tib3g6IHtcbiAgICBhbGxvd2VkOiBbJ3JlYWRvbmx5J10sXG4gICAgcmVxdWlyZWQ6IFsnY2hlY2tlZCddLFxuICAgIG5hbWVGcm9tQ29udGVudDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydtZW51aXRlbWNoZWNrYm94JywgJ3N3aXRjaCddLFxuICB9LFxuICBjb2x1bW5oZWFkZXI6IHtcbiAgICBhbGxvd2VkOiBbJ2NvbGluZGV4JywgJ2NvbHNwYW4nLCAnZXhwYW5kZWQnLCAncmVhZG9ubHknLCAncmVxdWlyZWQnLCAncm93aW5kZXgnLCAncm93c3BhbicsICdzZWxlY3RlZCcsICdzb3J0J10sXG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICB9LFxuICBjb21ib2JveDoge1xuICAgIHJlcXVpcmVkOiBbJ2NvbnRyb2xzJywgJ2V4cGFuZGVkJ10sXG4gICAgYWxsb3dlZDogWydhY3RpdmVkZXNjZW5kYW50JywgJ2F1dG9jb21wbGV0ZScsICdvcmllbnRhdGlvbicsICdyZXF1aXJlZCddLFxuICB9LFxuICBjb21tYW5kOiB7XG4gICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgc3ViY2xhc3M6IFsnYnV0dG9uJywgJ2xpbmsnLCAnbWVudWl0ZW0nXSxcbiAgfSxcbiAgY29tcGxlbWVudGFyeToge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgY29tcG9zaXRlOiB7XG4gICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgc3ViY2xhc3M6IFsnZ3JpZCcsICdzZWxlY3QnLCAnc3BpbmJ1dHRvbicsICd0YWJsaXN0J10sXG4gIH0sXG4gIGNvbnRlbnRpbmZvOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICBkZWZpbml0aW9uOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICBkaWFsb2c6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJywgJ21vZGFsJ10sXG4gICAgc3ViY2xhc3M6IFsnYWxlcnRkaWFsb2cnXSxcbiAgfSxcbiAgZGlyZWN0b3J5OiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICBkb2N1bWVudDoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgICBzdWJjbGFzczogWydhcnRpY2xlJ10sXG4gIH0sXG4gIGZlZWQ6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIGZpZ3VyZToge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgZm9ybToge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgZ3JpZDoge1xuICAgIGFsbG93ZWQ6IFsnYWN0aXZlZGVzY2VuZGFudCcsICdjb2xjb3VudCcsICdleHBhbmRlZCcsICdsZXZlbCcsICdtdWx0aXNlbGVjdGFibGUnLCAncmVhZG9ubHknLCAncm93Y291bnQnXSxcbiAgICBzdWJjbGFzczogWyd0cmVlZ3JpZCddLFxuICB9LFxuICBncmlkY2VsbDoge1xuICAgIGFsbG93ZWQ6IFsnY29saW5kZXgnLCAnY29sc3BhbicsICdleHBhbmRlZCcsICdyZWFkb25seScsICdyZXF1aXJlZCcsICdyb3dpbmRleCcsICdyb3dzcGFuJywgJ3NlbGVjdGVkJ10sXG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICAgIHN1YmNsYXNzOiBbJ2NvbHVtbmhlYWRlcicsICdyb3doZWFkZXInXSxcbiAgfSxcbiAgZ3JvdXA6IHtcbiAgICBhbGxvd2VkOiBbJ2FjdGl2ZWRlc2NlbmRhbnQnLCAnZXhwYW5kZWQnXSxcbiAgICBzdWJjbGFzczogWydyb3cnLCAnc2VsZWN0JywgJ3Rvb2xiYXInXSxcbiAgfSxcbiAgaGVhZGluZzoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnLCAnbGV2ZWwnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gIH0sXG4gIGltZzoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgaW5wdXQ6IHtcbiAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydjaGVja2JveCcsICdvcHRpb24nLCAncmFkaW8nLCAnc2xpZGVyJywgJ3NwaW5idXR0b24nLCAndGV4dGJveCddLFxuICB9LFxuICBsYW5kbWFyazoge1xuICAgIGFic3RyYWN0OiB0cnVlLFxuICAgIHN1YmNsYXNzOiBbJ2Jhbm5lcicsICdjb21wbGVtZW50YXJ5JywgJ2NvbnRlbnRpbmZvJywgJ2Zvcm0nLCAnbWFpbicsICduYXZpZ2F0aW9uJywgJ3JlZ2lvbicsICdzZWFyY2gnXSxcbiAgfSxcbiAgbGluazoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gIH0sXG4gIGxpc3Q6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gICAgc3ViY2xhc3M6IFsnZGlyZWN0b3J5JywgJ2ZlZWQnXSxcbiAgfSxcbiAgbGlzdGJveDoge1xuICAgIGFsbG93ZWQ6IFsnYWN0aXZlZGVzY2VuZGFudCcsICdleHBhbmRlZCcsICdtdWx0aXNlbGVjdGFibGUnLCAnb3JpZW50YXRpb24nLCAncmVxdWlyZWQnXSxcbiAgfSxcbiAgbGlzdGl0ZW06IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJywgJ2xldmVsJywgJ3Bvc2luc2V0JywgJ3NldHNpemUnXSxcbiAgICBzdWJjbGFzczogWyd0cmVlaXRlbSddLFxuICB9LFxuICBsb2c6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIG1haW46IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIG1hcnF1ZWU6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIG1hdGg6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIG1lbnU6IHtcbiAgICBhbGxvd2VkOiBbJ2FjdGl2ZWRlc2NlbmRhbnQnLCAnZXhwYW5kZWQnLCAnb3JpZW50YXRpb24nXSxcbiAgICBzdWJjbGFzczogWydtZW51YmFyJ10sXG4gIH0sXG4gIG1lbnViYXI6IHtcbiAgICBhbGxvd2VkOiBbJ2FjdGl2ZWRlc2NlbmRhbnQnLCAnZXhwYW5kZWQnLCAnb3JpZW50YXRpb24nXSxcbiAgfSxcbiAgbWVudWl0ZW06IHtcbiAgICBhbGxvd2VkOiBbJ3Bvc2luc2V0JywgJ3NldHNpemUnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gICAgc3ViY2xhc3M6IFsnbWVudWl0ZW1jaGVja2JveCddLFxuICB9LFxuICBtZW51aXRlbWNoZWNrYm94OiB7XG4gICAgcmVxdWlyZWQ6IFsnY2hlY2tlZCddLFxuICAgIG5hbWVGcm9tQ29udGVudDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydtZW51aXRlbXJhZGlvJ10sXG4gIH0sXG4gIG1lbnVpdGVtcmFkaW86IHtcbiAgICByZXF1aXJlZDogWydjaGVja2VkJ10sXG4gICAgYWxsb3dlZDogWydwb3NpbnNldCcsICdzZWxlY3RlZCcsICdzZXRzaXplJ10sXG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICB9LFxuICBuYXZpZ2F0aW9uOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICBub25lOiB7fSxcbiAgbm90ZToge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgb3B0aW9uOiB7XG4gICAgYWxsb3dlZDogWydjaGVja2VkJywgJ3Bvc2luc2V0JywgJ3NlbGVjdGVkJywgJ3NldHNpemUnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gICAgc3ViY2xhc3M6IFsndHJlZWl0ZW0nXSxcbiAgfSxcbiAgcHJlc2VudGF0aW9uOiB7fSxcbiAgcHJvZ3Jlc3NiYXI6IHtcbiAgICBhbGxvd2VkOiBbJ3ZhbHVlbWF4JywgJ3ZhbHVlbWluJywgJ3ZhbHVlbm93JywgJ3ZhbHVldGV4dCddLFxuICB9LFxuICByYWRpbzoge1xuICAgIHJlcXVpcmVkOiBbJ2NoZWNrZWQnXSxcbiAgICBhbGxvd2VkOiBbJ3Bvc2luc2V0JywgJ3NldHNpemUnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gICAgc3ViY2xhc3M6IFsnbWVudWl0ZW1yYWRpbyddLFxuICB9LFxuICByYWRpb2dyb3VwOiB7XG4gICAgYWxsb3dlZDogWydhY3RpdmVkZXNjZW5kYW50JywgJ2V4cGFuZGVkJywgJ3JlcXVpcmVkJywgJ29yaWVudGF0aW9uJ10sXG4gIH0sXG4gIHJhbmdlOiB7XG4gICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgc3ViY2xhc3M6IFsncHJvZ3Jlc3NiYXInLCAnc2Nyb2xsYmFyJywgJ3NsaWRlcicsICdzcGluYnV0dG9uJ10sXG4gIH0sXG4gIHJlZ2lvbjoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgcm9sZXR5cGU6IHtcbiAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydzdHJ1Y3R1cmUnLCAnd2lkZ2V0JywgJ3dpbmRvdyddLFxuICB9LFxuICByb3c6IHtcbiAgICBhbGxvd2VkOiBbJ2FjdGl2ZWRlc2NlbmRhbnQnLCAnY29saW5kZXgnLCAnZXhwYW5kZWQnLCAnbGV2ZWwnLCAncm93aW5kZXgnLCAnc2VsZWN0ZWQnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gIH0sXG4gIHJvd2dyb3VwOiB7XG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICB9LFxuICByb3doZWFkZXI6IHtcbiAgICBhbGxvd2VkOiBbJ2NvbGluZGV4JywgJ2NvbHNwYW4nLCAnZXhwYW5kZWQnLCAncm93aW5kZXgnLCAncm93c3BhbicsICdyZWFkb25seScsICdyZXF1aXJlZCcsICdzZWxlY3RlZCcsICdzb3J0J10sXG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICB9LFxuICBzY3JvbGxiYXI6IHtcbiAgICByZXF1aXJlZDogWydjb250cm9scycsICdvcmllbnRhdGlvbicsICd2YWx1ZW1heCcsICd2YWx1ZW1pbicsICd2YWx1ZW5vdyddLFxuICB9LFxuICBzZWFyY2g6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIHNlYXJjaGJveDoge1xuICAgIGFsbG93ZWQ6IFsnYWN0aXZlZGVzY2VuZGFudCcsICdhdXRvY29tcGxldGUnLCAnbXVsdGlsaW5lJywgJ3BsYWNlaG9sZGVyJywgJ3JlYWRvbmx5JywgJ3JlcXVpcmVkJ10sXG4gIH0sXG4gIHNlY3Rpb246IHtcbiAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydhbGVydCcsICdjZWxsJywgJ2RlZmluaXRpb24nLCAnZmlndXJlJywgJ2dyb3VwJywgJ2ltZycsICdsYW5kbWFyaycsICdsaXN0JywgJ2xpc3RpdGVtJywgJ2xvZycsICdtYXJxdWVlJywgJ21hdGgnLCAnbm90ZScsICdzdGF0dXMnLCAndGFibGUnLCAndGFicGFuZWwnLCAndGVybScsICd0b29sdGlwJ10sXG4gIH0sXG4gIHNlY3Rpb25oZWFkOiB7XG4gICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgc3ViY2xhc3M6IFsnY29sdW1uaGVhZGVyJywgJ2hlYWRpbmcnLCAncm93aGVhZGVyJywgJ3RhYiddLFxuICB9LFxuICBzZWxlY3Q6IHtcbiAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydjb21ib2JveCcsICdsaXN0Ym94JywgJ21lbnUnLCAncmFkaW9ncm91cCcsICd0cmVlJ10sXG4gIH0sXG4gIHNlcGFyYXRvcjoge1xuICAgIHJlcXVpcmVkOiBbJ3ZhbHVlbWF4JywgJ3ZhbHVlbWluJywgJ3ZhbHVlbm93J10sXG4gICAgYWxsb3dlZDogWydvcmllbnRhdGlvbicsICd2YWx1ZXRleHQnXSxcbiAgfSxcbiAgc2xpZGVyOiB7XG4gICAgcmVxdWlyZWQ6IFsndmFsdWVtYXgnLCAndmFsdWVtaW4nLCAndmFsdWVub3cnXSxcbiAgICBhbGxvd2VkOiBbJ29yaWVudGF0aW9uJywgJ3JlYWRvbmx5JywgJ3ZhbHVldGV4dCddLFxuICB9LFxuICBzcGluYnV0dG9uOiB7XG4gICAgcmVxdWlyZWQ6IFsndmFsdWVtYXgnLCAndmFsdWVtaW4nLCAndmFsdWVub3cnXSxcbiAgICBhbGxvd2VkOiBbJ3JlcXVpcmVkJywgJ3JlYWRvbmx5JywgJ3ZhbHVldGV4dCddLFxuICB9LFxuICBzdGF0dXM6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gICAgc3ViY2xhc3M6IFsndGltZXInXSxcbiAgfSxcbiAgc3RydWN0dXJlOiB7XG4gICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgc3ViY2xhc3M6IFsnYXBwbGljYXRpb24nLCAnZG9jdW1lbnQnLCAnbm9uZScsICdwcmVzZW50YXRpb24nLCAncm93Z3JvdXAnLCAnc2VjdGlvbicsICdzZWN0aW9uaGVhZCcsICdzZXBhcmF0b3InXSxcbiAgfSxcbiAgc3dpdGNoOiB7XG4gICAgcmVxdWlyZWQ6IFsnY2hlY2tlZCddLFxuICAgIG5hbWVGcm9tQ29udGVudDogdHJ1ZSxcbiAgfSxcbiAgdGFiOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCcsICdwb3NpbnNldCcsICdzZWxlY3RlZCcsICdzZXRzaXplJ10sXG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICB9LFxuICB0YWJsZToge1xuICAgIGFsbG93ZWQ6IFsnY29sY291bnQnLCAnZXhwYW5kZWQnLCAncm93Y291bnQnXSxcbiAgICBzdWJjbGFzczogWydncmlkJ10sXG4gIH0sXG4gIHRhYmxpc3Q6IHtcbiAgICBhbGxvd2VkOiBbJ2FjdGl2ZWRlc2NlbmRhbnQnLCAnbGV2ZWwnLCAnbXVsdGlzZWxlY3RhYmxlJywgJ29yaWVudGF0aW9uJ10sXG4gIH0sXG4gIHRhYnBhbmVsOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICB0ZXJtOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICB0ZXh0Ym94OiB7XG4gICAgYWxsb3dlZDogWydhY3RpdmVkZXNjZW5kYW50JywgJ2F1dG9jb21wbGV0ZScsICdtdWx0aWxpbmUnLCAncGxhY2Vob2xkZXInLCAncmVhZG9ubHknLCAncmVxdWlyZWQnXSxcbiAgICBzdWJjbGFzczogWydzZWFyY2hib3gnXSxcbiAgfSxcbiAgdGltZXI6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIHRvb2xiYXI6IHtcbiAgICBhbGxvd2VkOiBbJ2FjdGl2ZWRlc2NlbmRhbnQnLCAnZXhwYW5kZWQnLCAnb3JpZW50YXRpb24nXSxcbiAgfSxcbiAgdG9vbHRpcDoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gIH0sXG4gIHRyZWU6IHtcbiAgICBhbGxvd2VkOiBbJ2FjdGl2ZWRlc2NlbmRhbnQnLCAnZXhwYW5kZWQnLCAnbXVsdGlzZWxlY3RhYmxlJywgJ29yaWVudGF0aW9uJywgJ3JlcXVpcmVkJ10sXG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICAgIHN1YmNsYXNzOiBbJ3RyZWVncmlkJ10sXG4gIH0sXG4gIHRyZWVncmlkOiB7XG4gICAgYWxsb3dlZDogWydhY3RpdmVkZXNjZW5kYW50JywgJ2NvbGNvdW50JywgJ2V4cGFuZGVkJywgJ2xldmVsJywgJ211bHRpc2VsZWN0YWJsZScsICdvcmllbnRhdGlvbicsICdyZWFkb25seScsICdyZXF1aXJlZCcsICdyb3djb3VudCddLFxuICB9LFxuICB0cmVlaXRlbToge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnLCAnY2hlY2tlZCcsICdsZXZlbCcsICdwb3NpbnNldCcsICdzZWxlY3RlZCcsICdzZXRzaXplJ10sXG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICB9LFxuICB3aWRnZXQ6IHtcbiAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydjb21tYW5kJywgJ2NvbXBvc2l0ZScsICdncmlkY2VsbCcsICdpbnB1dCcsICdyYW5nZScsICdyb3cnLCAnc2VwYXJhdG9yJywgJ3RhYiddLFxuICB9LFxuICB3aW5kb3c6IHtcbiAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydkaWFsb2cnXSxcbiAgfSxcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bm5lciA9IHJlcXVpcmUoJy4vcnVubmVyJyk7XG5jb25zdCBMb2dnZXIgPSByZXF1aXJlKCcuL2xvZ2dlcicpO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4vcnVsZXMvcnVsZScpO1xuY29uc3QgcnVsZXMgPSByZXF1aXJlKCcuL3J1bGVzJyk7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbmNvbnN0IHZlcnNpb24gPSByZXF1aXJlKCcuL3ZlcnNpb24nKTtcbmNvbnN0IENvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG5jb25zdCBDb250cmFzdCA9IHJlcXVpcmUoJy4vdXRpbHMvY29udHJhc3QnKTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGdsb2JhbC1yZXF1aXJlLCBpbXBvcnQvbm8tZHluYW1pYy1yZXF1aXJlXG5jb25zdCBydWxlTGlzdCA9IG5ldyBNYXAocnVsZXMubWFwKHBhdGggPT4gW3BhdGgucmVwbGFjZSgvXFwvL2csICctJyksIHJlcXVpcmUoYC4vcnVsZXMvJHtwYXRofS9ydWxlLmpzYCldKSk7XG5cbmNsYXNzIExpbnRlciBleHRlbmRzIFJ1bm5lciB7XG4gIGNvbnN0cnVjdG9yKHNldHRpbmdzKSB7XG4gICAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCB7fTtcbiAgICBzZXR0aW5ncy5sb2dnZXIgPSBzZXR0aW5ncy5sb2dnZXIgfHwgbmV3IExvZ2dlcigpO1xuICAgIHNldHRpbmdzLnJ1bGVzID0gc2V0dGluZ3MucnVsZXMgfHwgcnVsZUxpc3Q7XG4gICAgc2V0dGluZ3MuY29uZmlnID0gbmV3IENvbmZpZyhzZXR0aW5ncyk7XG4gICAgc3VwZXIoc2V0dGluZ3MpO1xuXG4gICAgdGhpcy5yb290ID0gc2V0dGluZ3Mucm9vdCB8fCBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCBsb29raW5nIGZvciBpc3N1ZXNcbiAgICovXG4gIG9ic2VydmUoKSB7XG4gICAgdGhpcy5vYnNlcnZlRG9tQ2hhbmdlcygpO1xuICAgIHRoaXMub2JzZXJ2ZUZvY3VzKCk7XG4gIH1cblxuICAvKipcbiAgICogU3RvcCBsb29raW5nIGZvciBpc3N1ZXNcbiAgICovXG4gIHN0b3BPYnNlcnZpbmcoKSB7XG4gICAgdGhpcy5zdG9wT2JzZXJ2aW5nRG9tQ2hhbmdlcygpO1xuICAgIHRoaXMuc3RvcE9ic2VydmluZ0ZvY3VzKCk7XG4gIH1cblxuICBvYnNlcnZlRG9tQ2hhbmdlcygpIHtcbiAgICB0aGlzLm9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9ucykgPT4ge1xuICAgICAgLy8gRGUtZHVwbGljYXRlXG4gICAgICBjb25zdCBub2RlcyA9IG5ldyBTZXQobXV0YXRpb25zLm1hcCgocmVjb3JkKSA9PiB7XG4gICAgICAgIGlmIChyZWNvcmQudHlwZSA9PT0gJ2NoaWxkTGlzdCcpIHtcbiAgICAgICAgICByZXR1cm4gcmVjb3JkLnRhcmdldDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVjb3JkLnRhcmdldC5wYXJlbnROb2RlO1xuICAgICAgfSkuZmlsdGVyKEJvb2xlYW4pKTtcblxuICAgICAgLy8gUmVtb3ZlIG5vZGVzIHRoYXQgYXJlIGNoaWxkcmVuIG9mIG90aGVyIG5vZGVzXG4gICAgICBub2Rlcy5mb3JFYWNoKChub2RlMSkgPT4ge1xuICAgICAgICBub2Rlcy5mb3JFYWNoKChub2RlMikgPT4ge1xuICAgICAgICAgIGlmIChub2RlMiA9PT0gbm9kZTEgfHwgIW5vZGVzLmhhcyhub2RlMSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5vZGUyLmNvbnRhaW5zKG5vZGUxKSkge1xuICAgICAgICAgICAgbm9kZXMuZGVsZXRlKG5vZGUxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICAvLyBSZW1vdmUgbm9kZXMgdGhhdCBhcmUgZGlzY29ubmVjdGVkXG4gICAgICBub2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgIGlmICghZG9jdW1lbnQuY29udGFpbnMobm9kZSkpIHtcbiAgICAgICAgICBub2Rlcy5kZWxldGUobm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gUnVuIHRlc3QgYWdhaW5zdCBlYWNoIG5vZGVcbiAgICAgIG5vZGVzLmZvckVhY2gobm9kZSA9PiB0aGlzLnJ1bihub2RlKSk7XG4gICAgfSk7XG4gICAgdGhpcy5vYnNlcnZlci5vYnNlcnZlKFxuICAgICAgdGhpcy5yb290LFxuICAgICAgeyBzdWJ0cmVlOiB0cnVlLCBjaGlsZExpc3Q6IHRydWUsIGF0dHJpYnV0ZXM6IHRydWUsIGNoYXJhY3RlckRhdGE6IHRydWUgfVxuICAgICk7XG4gIH1cblxuICBzdG9wT2JzZXJ2aW5nRG9tQ2hhbmdlcygpIHtcbiAgICBpZiAodGhpcy5vYnNlcnZlcikge1xuICAgICAgdGhpcy5vYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICB0aGlzLm9ic2VydmVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVFdmVudChlKSB7XG4gICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiByZXNvbHZlKHRoaXMucnVuKGUudGFyZ2V0KSkpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ld1xuICB9XG5cbiAgb2JzZXJ2ZUZvY3VzKCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcywgeyBjYXB0dXJlOiB0cnVlLCBwYXNzaXZlOiB0cnVlIH0pO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLCB7IGNhcHR1cmU6IHRydWUsIHBhc3NpdmU6IHRydWUgfSk7XG4gIH1cblxuICBzdG9wT2JzZXJ2aW5nRm9jdXMoKSB7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLCB7IGNhcHR1cmU6IHRydWUsIHBhc3NpdmU6IHRydWUgfSk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMsIHsgY2FwdHVyZTogdHJ1ZSwgcGFzc2l2ZTogdHJ1ZSB9KTtcbiAgfVxufVxuXG5MaW50ZXIuQ29uZmlnID0gQ29uZmlnO1xuTGludGVyLkxvZ2dlciA9IExvZ2dlcjtcbkxpbnRlci5SdWxlID0gUnVsZTtcbkxpbnRlci5ydWxlcyA9IHJ1bGVMaXN0O1xuTGludGVyW1N5bWJvbC5mb3IoJ2FjY2Vzc2liaWxpdHktbGludGVyLnJ1bGUtc291cmNlcycpXSA9IHJ1bGVzO1xuTGludGVyLlV0aWxzID0gVXRpbHM7XG5MaW50ZXIudmVyc2lvbiA9IHZlcnNpb247XG5MaW50ZXIuY29sb3VyQ29udHJhc3QgPSBDb250cmFzdC5jb2xvdXJDb250cmFzdDtcblxubW9kdWxlLmV4cG9ydHMgPSBMaW50ZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUsIGNsYXNzLW1ldGhvZHMtdXNlLXRoaXMgKi9cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTG9nZ2VyIHtcbiAgbG9nKHsgdHlwZSwgZWwsIG1lc3NhZ2UsIG5hbWUgfSkge1xuICAgIGNvbnNvbGVbdHlwZV0uYXBwbHkoY29uc29sZSwgW21lc3NhZ2UsIGVsLCBuYW1lXS5maWx0ZXIoQm9vbGVhbikpO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBFeHRlbmRlZEFycmF5ID0gcmVxdWlyZSgnLi4vc3VwcG9ydC9leHRlbmRlZC1hcnJheScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJ1bGUge1xuICBjb25zdHJ1Y3RvcihzZXR0aW5ncykge1xuICAgIHRoaXMudHlwZSA9ICdlcnJvcic7XG4gICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcbiAgICB0aGlzLnNldERlZmF1bHRzKCk7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCBzZXR0aW5ncyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGFueSBkZWZhdWx0IHByb3BlcnRpZXMgb24gdGhlIHJ1bGUgYmVmb3JlIHRoZSBzZXR0aW5ncyBhcmUgbWVyZ2VkIGluXG4gICAqL1xuICBzZXREZWZhdWx0cygpIHtcbiAgICAvLyBOb3RoaW5nIHRvIGRvIGhlcmVcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gdGhlIHJ1bGVcbiAgICogQHBhcmFtIHtFbGVtZW50fSBbY29udGV4dD1kb2N1bWVudF0gVGhlIGVsZW1lbnQgdG8gcnVuIHRoZSBydWxlIGFnYWluc3RcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZmlsdGVyIEEgZmlsdGVyIHRvIHJlbW92ZSBlbGVtZW50cyB0aGF0IGRvbid0IG5lZWQgdG8gYmUgdGVzdGVkXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjYWNoZXMgVXRpbGl0eSBjYWNoZXNcbiAgICogQHJldHVybnMge1N0cmluZ3xTdHJpbmdbXXxudWxsfSBaZXJvIG9yIG1vcmUgZXJyb3IgbWVzc2FnZXNcbiAgICovXG4gIHJ1bihjb250ZXh0LCBmaWx0ZXIgPSAoKSA9PiB0cnVlLCB1dGlscykge1xuICAgIHJldHVybiB1dGlscy4kJCh0aGlzLnNlbGVjdG9yKHV0aWxzKSwgY29udGV4dClcbiAgICAgIC5maWx0ZXIoZmlsdGVyKVxuICAgICAgLm1hcChlbCA9PiAoXG4gICAgICAgIEV4dGVuZGVkQXJyYXkub2YodGhpcy50ZXN0KGVsLCB1dGlscykpXG4gICAgICAgICAgLmZsYXR0ZW4oKVxuICAgICAgICAgIC5jb21wYWN0KClcbiAgICAgICAgICAubWFwKG1lc3NhZ2UgPT4gKHsgZWwsIG1lc3NhZ2UgfSkpXG4gICAgICApKVxuICAgICAgLmZsYXR0ZW4oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2VsZWN0b3IgdG8gc2VsZWN0IGludmFsaWQgZWxlbWVudHNcbiAgICovXG4gIHNlbGVjdG9yKCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNsYXNzLW1ldGhvZHMtdXNlLXRoaXNcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBpbXBsZW1lbnRlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRlc3QgaWYgYW4gZWxlbWVudCBpcyBpbnZhbGlkXG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZWwgVGhlIGVsZW1lbnQgdG8gdGVzdFxuICAgKiBAcGFyYW0ge09iamVjdH0gdXRpbHMgVXRpbGl0aWVzXG4gICAqIEByZXR1cm5zIHtTdHJpbmd8U3RyaW5nW118bnVsbH0gWmVybyBvciBtb3JlIGVycm9yIG1lc3NhZ2VzXG4gICAqL1xuICB0ZXN0KGVsLCB1dGlscykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgdGhyb3cgbmV3IEVycm9yKCdub3QgaW1wbGVtZW50ZWQnKTtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5jb25zdCBTZXRDYWNoZSA9IHJlcXVpcmUoJy4vc3VwcG9ydC9zZXQtY2FjaGUnKTtcblxuY29uc3QgZHVtbXlDYWNoZSA9IHtcbiAgYWRkKCkge30sXG4gIHNldCgpIHt9LFxuICBoYXMoKSB7IHJldHVybiBmYWxzZTsgfSxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUnVubmVyIHtcbiAgY29uc3RydWN0b3Ioc2V0dGluZ3MpIHtcbiAgICBjb25zdCBnbG9iYWxTZXR0aW5ncyA9IHt9O1xuICAgIGlmIChzZXR0aW5ncy5kZWZhdWx0T2ZmKSB7XG4gICAgICBnbG9iYWxTZXR0aW5ncy5lbmFibGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZVJlcG9ydGVkID0gc2V0dGluZ3MuY2FjaGVSZXBvcnRlZCAhPT0gZmFsc2U7XG4gICAgdGhpcy5ydWxlU2V0dGluZ3MgPSBzZXR0aW5ncy5ydWxlU2V0dGluZ3MgfHwge307XG4gICAgdGhpcy5jb25maWcgPSBzZXR0aW5ncy5jb25maWc7XG5cbiAgICB0aGlzLnJ1bGVzID0gbmV3IE1hcChBcnJheS5mcm9tKHNldHRpbmdzLnJ1bGVzKVxuICAgICAgLm1hcCgoW25hbWUsIFJ1bGVdKSA9PiBbXG4gICAgICAgIG5hbWUsXG4gICAgICAgIG5ldyBSdWxlKE9iamVjdC5hc3NpZ24oeyBuYW1lIH0sIGdsb2JhbFNldHRpbmdzLCB0aGlzLnJ1bGVTZXR0aW5nc1tuYW1lXSkpLFxuICAgICAgXSlcbiAgICApO1xuXG4gICAgdGhpcy5pZ25vcmVBdHRyaWJ1dGUgPSBzZXR0aW5ncy5pZ25vcmVBdHRyaWJ1dGUgfHwgJ2RhdGEtYWNjZXNzaWJpbGl0eS1saW50ZXItaWdub3JlJztcblxuICAgIHRoaXMud2hpdGVsaXN0ID0gc2V0dGluZ3Mud2hpdGVsaXN0O1xuICAgIHRoaXMubG9nZ2VyID0gc2V0dGluZ3MubG9nZ2VyO1xuXG4gICAgaWYgKHRoaXMuY2FjaGVSZXBvcnRlZCkge1xuICAgICAgdGhpcy5yZXBvcnRlZCA9IG5ldyBTZXRDYWNoZSgpO1xuICAgICAgdGhpcy53aGl0ZWxpc3RlZCA9IG5ldyBTZXRDYWNoZSgpO1xuICAgICAgdGhpcy5nbG9iYWxXaGl0ZWxpc3RlZCA9IG5ldyBXZWFrU2V0KCk7XG4gICAgICB0aGlzLmlnbm9yZWQgPSBuZXcgU2V0Q2FjaGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZXBvcnRlZCA9IHRoaXMud2hpdGVsaXN0ZWQgPSB0aGlzLmdsb2JhbFdoaXRlbGlzdGVkID0gdGhpcy5pZ25vcmVkID0gZHVtbXlDYWNoZTtcbiAgICB9XG5cbiAgICB0aGlzLnV0aWxzID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYWxsIHRoZSBydWxlc1xuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBbY29udGV4dF0gQSBjb250ZXh0IHRvIHJ1biB0aGUgcnVsZXMgd2l0aGluXG4gICAqL1xuICBydW4oY29udGV4dCkge1xuICAgIHRoaXMudXRpbHMgPSBuZXcgVXRpbHModGhpcy5jb25maWcpO1xuICAgIEFycmF5LmZyb20odGhpcy5ydWxlcy52YWx1ZXMoKSlcbiAgICAgIC5maWx0ZXIocnVsZSA9PiBydWxlLmVuYWJsZWQpXG4gICAgICAuZm9yRWFjaChydWxlID0+IHRoaXMucnVuSW50ZXJuYWwocnVsZSwgY29udGV4dCwgKGVsLCBuYW1lKSA9PiB0aGlzLmZpbHRlcihlbCwgbmFtZSkpKTtcbiAgICB0aGlzLnV0aWxzID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gb25lIHJ1bGUgcmVnYXJkbGVzcyBvZiBpdCBiZWluZyBlbmFibGVkXG4gICAqIEBuYW1lIHtTdHJpbmd8UnVsZX0gcnVsZSBBIHJ1bGUgb3IgbmFtZSBvZiBhIHJ1bGVcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gW2NvbnRleHRdIEEgY29udGV4dFxuICAgKiBAcGFyYW0ge1N0cmluZ30gW3doaXRlbGlzdF0gT3B0aW9uYWxseSBhIHdoaXRlbGlzdFxuICAgKi9cbiAgcnVuUnVsZShydWxlLCB7IGNvbnRleHQsIHdoaXRlbGlzdCwgcnVsZVNldHRpbmdzIH0gPSB7fSkge1xuICAgIGlmICh0eXBlb2YgcnVsZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJ1bGUgPSB0aGlzLnJ1bGVzLmdldChydWxlKTtcbiAgICB9XG5cbiAgICBjb25zdCBydW5uZXIgPSBuZXcgUnVubmVyKHtcbiAgICAgIHJ1bGVzOiBuZXcgTWFwKFtbcnVsZS5uYW1lLCBydWxlLmNvbnN0cnVjdG9yXV0pLFxuICAgICAgd2hpdGVsaXN0OiB3aGl0ZWxpc3QgfHwgdGhpcy53aGl0ZWxpc3QsXG4gICAgICBsb2dnZXI6IHRoaXMubG9nZ2VyLFxuICAgICAgcnVsZVNldHRpbmdzOiB7XG4gICAgICAgIFtydWxlLm5hbWVdOiBPYmplY3QuYXNzaWduKFxuICAgICAgICAgIHt9LFxuICAgICAgICAgIHJ1bGVTZXR0aW5ncyB8fCB0aGlzLnJ1bGVTZXR0aW5nc1tydWxlLm5hbWVdIHx8IHt9LFxuICAgICAgICAgIHsgZW5hYmxlZDogdHJ1ZSB9XG4gICAgICAgICksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcnVubmVyLnJ1bihjb250ZXh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWx0ZXIgaWYgdGhlIGVsZW1lbnQgaGFzIGFscmVhZHkgcmVwb3J0ZWQgb24gdGhpcyBydWxlIG9yIGlzIGV4Y2x1ZGVkIGZyb20gdGhpcyBydWxlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmaWx0ZXIoZWwsIG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5ub3RXaGl0ZWxpc3RlZChlbCwgbmFtZSlcbiAgICAgICYmIHRoaXMubm90SWdub3JlZChlbCwgbmFtZSlcbiAgICAgICYmIHRoaXMubm90UmVwb3J0ZWQoZWwsIG5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIHNpbmdsZSBydWxlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBydW5JbnRlcm5hbChydWxlLCBjb250ZXh0ID0gZG9jdW1lbnQsIGZpbHRlcikge1xuICAgIHJ1bGUucnVuKGNvbnRleHQsIGVsID0+IGZpbHRlcihlbCwgcnVsZS5uYW1lKSwgdGhpcy51dGlscylcbiAgICAgIC5mb3JFYWNoKChpc3N1ZSkgPT4ge1xuICAgICAgICB0aGlzLnJlcG9ydGVkLnNldChpc3N1ZS5lbCwgcnVsZS5uYW1lKTtcbiAgICAgICAgdGhpcy5sb2dnZXIubG9nKE9iamVjdC5hc3NpZ24oeyBuYW1lOiBydWxlLm5hbWUsIHR5cGU6IHJ1bGUudHlwZSB9LCBpc3N1ZSkpO1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSGFzIHRoaXMgYWxyZWFkeSBiZWVuIHJlcG9ydGVkIGZvciB0aGlzIGVsZW1lbnRcbiAgICogQHByaXZhdGVcbiAgICovXG4gIG5vdFJlcG9ydGVkKGVsLCBuYW1lKSB7XG4gICAgcmV0dXJuICF0aGlzLnJlcG9ydGVkLmhhcyhlbCwgbmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogSXMgdGhpcyBlbGVtZW50IGV4Y2x1ZGVkIGJ5IGEgd2hpdGVsaXN0XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBub3RXaGl0ZWxpc3RlZChlbCwgbmFtZSkge1xuICAgIGlmICh0aGlzLmdsb2JhbFdoaXRlbGlzdGVkLmhhcyhlbCkgfHwgdGhpcy53aGl0ZWxpc3RlZC5oYXMoZWwsIG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMud2hpdGVsaXN0ICYmIGVsLm1hdGNoZXModGhpcy53aGl0ZWxpc3QpKSB7XG4gICAgICB0aGlzLmdsb2JhbFdoaXRlbGlzdGVkLmFkZChlbCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgd2hpdGVsaXN0ID0gdGhpcy5ydWxlU2V0dGluZ3NbbmFtZV0gJiYgdGhpcy5ydWxlU2V0dGluZ3NbbmFtZV0ud2hpdGVsaXN0O1xuICAgIGlmICh3aGl0ZWxpc3QgJiYgZWwubWF0Y2hlcyh3aGl0ZWxpc3QpKSB7XG4gICAgICB0aGlzLndoaXRlbGlzdGVkLnNldChlbCwgbmFtZSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogSXMgdGhpcyBlbGVtZW50IGV4Y2x1ZGVkIGJ5IGFuIGF0dHJpYnV0ZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgbm90SWdub3JlZChlbCwgcnVsZU5hbWUpIHtcbiAgICBpZiAodGhpcy5pZ25vcmVkLmhhcyhlbCwgcnVsZU5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgaWdub3JlID0gZWwubWF0Y2hlcyhcbiAgICAgIGBbJHt0aGlzLmlnbm9yZUF0dHJpYnV0ZX09XCJcIl0sWyR7dGhpcy5pZ25vcmVBdHRyaWJ1dGV9fj1cIiR7dGhpcy51dGlscy5jc3NFc2NhcGUocnVsZU5hbWUpfVwiXWBcbiAgICApO1xuXG4gICAgaWYgKGlnbm9yZSkge1xuICAgICAgdGhpcy5pZ25vcmVkLnNldChlbCwgcnVsZU5hbWUpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vLyBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUyL2luZnJhc3RydWN0dXJlLmh0bWwjY29tbW9uLXBhcnNlci1pZGlvbXNcbmV4cG9ydHMuclNwYWNlID0gL1sgXFx0XFxuXFxmXFxyXSsvO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKipcbiAqIENhY2hpbmcgZm9yIGVsZW1lbnQgdmFsdWVzXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIGNsYXNzLW1ldGhvZHMtdXNlLXRoaXMgKi9cblxuZnVuY3Rpb24gZ2V0T3JTZXQoY2FjaGUsIGtleSwgc2V0dGVyKSB7XG4gIGlmIChjYWNoZS5oYXMoa2V5KSkge1xuICAgIHJldHVybiBjYWNoZS5nZXQoa2V5KTtcbiAgfVxuICBjb25zdCB2YWx1ZSA9IHNldHRlcigpO1xuICBjYWNoZS5zZXQoa2V5LCB2YWx1ZSk7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFbGVtZW50Q2FjaGUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9jYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgYSBrZXkgZnJvbSB0aGUgb3B0aW9ucyBzdXBwbGllZCB0byBrZXlcbiAgICovXG4gIGtleShlbCwga2V5KSB7XG4gICAgcmV0dXJuIGtleTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHN0b3JlZCB2YWx1ZVxuICAgKi9cbiAgc2V0dGVyKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkJyk7XG4gIH1cblxuICAvKipcbiAgICogIEdldCBhIHZhbHVlXG4gICAqICBAcGFyYW0ge09iamVjdH0gZWwgQSBrZXkgdG8gY2FjaGUgYWdhaW5zdFxuICAgKi9cbiAgZ2V0KGVsKSB7XG4gICAgY29uc3QgbWFwID0gZ2V0T3JTZXQodGhpcy5fY2FjaGUsIGVsLCAoKSA9PiBuZXcgTWFwKCkpO1xuICAgIGNvbnN0IG9wdGlvbnNLZXkgPSB0aGlzLmtleS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHJldHVybiBnZXRPclNldChtYXAsIG9wdGlvbnNLZXksICgpID0+IHRoaXMuc2V0dGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEV4dGVuZGVkQXJyYXkgZXh0ZW5kcyBBcnJheSB7XG4gIHRhcChmbikge1xuICAgIGZuKHRoaXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5pcXVlKCkge1xuICAgIGNvbnN0IHNldCA9IG5ldyBTZXQoKTtcbiAgICByZXR1cm4gdGhpcy5maWx0ZXIoaXRlbSA9PiAoc2V0LmhhcyhpdGVtKSA/IGZhbHNlIDogc2V0LmFkZChpdGVtKSkpO1xuICB9XG5cbiAgZ3JvdXBCeShmbikge1xuICAgIGNvbnN0IG1hcCA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLmZvckVhY2goKGl0ZW0sIGksIGFyKSA9PiB7XG4gICAgICBjb25zdCBrZXkgPSBmbihpdGVtLCBpLCBhcik7XG4gICAgICBpZiAobWFwLmhhcyhrZXkpKSB7XG4gICAgICAgIG1hcC5nZXQoa2V5KS5wdXNoKGl0ZW0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWFwLnNldChrZXksIEV4dGVuZGVkQXJyYXkub2YoaXRlbSkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBFeHRlbmRlZEFycmF5LmZyb20obWFwLnZhbHVlcygpKTtcbiAgfVxuXG4gIGNvbXBhY3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmlsdGVyKEJvb2xlYW4pO1xuICB9XG5cbiAgZmxhdHRlbigpIHtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IEV4dGVuZGVkQXJyYXkoKTtcbiAgICB0aGlzLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pKSB7XG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoRXh0ZW5kZWRBcnJheS5mcm9tKGl0ZW0pLmZsYXR0ZW4oKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQucHVzaChpdGVtKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVsZW1lbnRDYWNoZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2NhY2hlID0gbmV3IFdlYWtNYXAoKTtcbiAgfVxuXG4gIGhhcyhlbCwgdmFsdWUpIHtcbiAgICBjb25zdCBzZXQgPSB0aGlzLl9jYWNoZS5nZXQoZWwpO1xuICAgIGlmICghc2V0KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBzZXQuaGFzKHZhbHVlKTtcbiAgfVxuXG4gIHNldChlbCwgdmFsdWUpIHtcbiAgICBsZXQgc2V0ID0gdGhpcy5fY2FjaGUuZ2V0KGVsKTtcbiAgICBpZiAoIXNldCkge1xuICAgICAgc2V0ID0gbmV3IFNldCgpO1xuICAgICAgdGhpcy5fY2FjaGUuc2V0KGVsLCBzZXQpO1xuICAgIH1cbiAgICBzZXQuYWRkKHZhbHVlKTtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiAgRGF0YSBhbmQgZnVuY3Rpb25zIGZvciBhcmlhIHZhbGlkYXRpb24uICBCYXNlZCBvblxuICogIC0gaHR0cHM6Ly93d3cudzMub3JnL1RSL3dhaS1hcmlhLTEuMS9cbiAqICAtIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9odG1sNTIvXG4gKi9cbmNvbnN0IEV4dGVuZGVkQXJyYXkgPSByZXF1aXJlKCcuLi9zdXBwb3J0L2V4dGVuZGVkLWFycmF5Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQXJpYSB7XG4gIGNvbnN0cnVjdG9yKGNvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIG9iamVjdCB3aXRoIHRoZSByb2xlIHNldHRpbmdzIGZvciB0aGUgZWxlbWVudFxuICAgKiBAdHlwZSB7T2JqZWN0W119XG4gICAqL1xuICBhbGxvd2VkKGVsKSB7XG4gICAgY29uc3QgbmFtZSA9IGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgbGV0IGZvdW5kID0gdGhpcy5jb25maWcuYWxsb3dlZEFyaWFbbmFtZV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZm91bmQpKSB7XG4gICAgICBmb3VuZCA9IGZvdW5kLmZpbmQoaXRlbSA9PiAoXG4gICAgICAgIGl0ZW0uc2VsZWN0b3IgPT09ICcqJyB8fCAodHlwZW9mIGl0ZW0uc2VsZWN0b3IgPT09ICdmdW5jdGlvbicgPyBpdGVtLnNlbGVjdG9yKGVsLCB0aGlzKSA6IGVsLm1hdGNoZXMoaXRlbS5zZWxlY3RvcikpXG4gICAgICApKTtcbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kIHx8IHRoaXMuY29uZmlnLmFsbG93ZWRBcmlhLl9kZWZhdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZWxlbWVudHMgY3VycmVudCByb2xlIGJhc2VkIG9uIHRoZSByb2xlIGF0dHJpYnV0ZSBvciBpbXBsaWNpdCByb2xlXG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAgICogQHJldHVybnMge1N0cmluZ3xudWxsfVxuICAgKi9cbiAgZ2V0Um9sZShlbCwgYWxsb3dlZCkge1xuICAgIGxldCByb2xlID0gbnVsbDtcbiAgICAvLyBTaG91bGQgYmUgdGhlIGZpcnN0IG5vbi1hYnN0cmFjdCByb2xlIGluIHRoZSBsaXN0XG4gICAgaWYgKChlbC5nZXRBdHRyaWJ1dGUoJ3JvbGUnKSB8fCAnJykuc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbikuc29tZSgobmFtZSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uZmlnLnJvbGVzW25hbWVdICYmICF0aGlzLmNvbmZpZy5yb2xlc1tuYW1lXS5hYnN0cmFjdCkge1xuICAgICAgICByb2xlID0gbmFtZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSkpIHtcbiAgICAgIHJldHVybiByb2xlO1xuICAgIH1cbiAgICBhbGxvd2VkID0gYWxsb3dlZCB8fCB0aGlzLmFsbG93ZWQoZWwpO1xuICAgIHJldHVybiBhbGxvd2VkLmltcGxpY2l0WzBdIHx8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogRG9lcyBhbiBlbGVtZW50IGhhdmUgYSByb2xlLiBUaGlzIHdpbGwgdGVzdCBhZ2FpbnN0IGFic3RyYWN0IHJvbGVzXG4gICAqIEBwYXJhbSB7RWxlbWVudHxTdHJpbmd8bnVsbH0gdGFyZ2V0XG4gICAqIEBwYXJhbSB7U3RyaW5nfFN0cmluZ1tdfSBuYW1lXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuZXh0YWN0PWZhbHNlXSBNYXRjaCBhZ2FpbnN0IGFic3RyYWN0IHJvbGVzXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgaGFzUm9sZSh0YXJnZXQsIG5hbWUsIHsgZXhhY3QgPSBmYWxzZSB9ID0ge30pIHtcbiAgICBpZiAodGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGFjdHVhbFJvbGUgPSB0eXBlb2YgdGFyZ2V0ID09PSAnc3RyaW5nJyA/IHRhcmdldCA6IHRoaXMuZ2V0Um9sZSh0YXJnZXQpO1xuICAgIGlmICghYWN0dWFsUm9sZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gW10uY29uY2F0KG5hbWUpLnNvbWUoZnVuY3Rpb24gaGFzUm9sZShjaGVja1JvbGUpIHtcbiAgICAgIGlmIChjaGVja1JvbGUgPT09IGFjdHVhbFJvbGUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gIWV4YWN0ICYmICh0aGlzLmNvbmZpZy5yb2xlc1tjaGVja1JvbGVdLnN1YmNsYXNzIHx8IFtdKS5zb21lKGhhc1JvbGUsIHRoaXMpO1xuICAgIH0sIHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmQgdGhlIGNsb3Nlc3QgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcm9sZShzKVxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7U3RyaW5nfFN0cmluZ1tdfSByb2xlXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuZXhhY3Q9ZmFsc2VdXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgY2xvc2VzdFJvbGUoZWwsIHJvbGUsIHsgZXhhY3QgPSBmYWxzZSB9ID0ge30pIHtcbiAgICBjb25zdCByb2xlcyA9IFtdLmNvbmNhdChyb2xlKTtcbiAgICBsZXQgY3Vyc29yID0gZWw7XG4gICAgd2hpbGUgKChjdXJzb3IgPSBjdXJzb3IucGFyZW50Tm9kZSkgJiYgY3Vyc29yLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWxvb3AtZnVuY1xuICAgICAgaWYgKHJvbGVzLnNvbWUobmFtZSA9PiB0aGlzLmhhc1JvbGUoY3Vyc29yLCBuYW1lLCB7IGV4YWN0IH0pKSkge1xuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJvbGVzT2ZUeXBlKG5hbWUpIHtcbiAgICBjb25zdCByb2xlcyA9IG5ldyBFeHRlbmRlZEFycmF5KCk7XG4gICAgY29uc3Qgcm9sZSA9IHRoaXMuY29uZmlnLnJvbGVzW25hbWVdO1xuICAgIGlmICghcm9sZS5hYnN0cmFjdCkge1xuICAgICAgcm9sZXMucHVzaChuYW1lKTtcbiAgICB9XG4gICAgaWYgKHJvbGUuc3ViY2xhc3MpIHtcbiAgICAgIHJvbGVzLnB1c2gocm9sZS5zdWJjbGFzcy5tYXAodGhpcy5yb2xlc09mVHlwZSwgdGhpcykpO1xuICAgIH1cbiAgICByZXR1cm4gcm9sZXMuZmxhdHRlbigpO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vLyBMdW1pbm9zaXR5IGNhbGN1bGF0aW9uXG4vKiBlc2xpbnQtZGlzYWJsZSBjbGFzcy1tZXRob2RzLXVzZS10aGlzICovXG5cbmZ1bmN0aW9uIGdhbW1hKHZhbHVlKSB7XG4gIGNvbnN0IG4gPSB2YWx1ZSAvIDI1NTtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXJlc3RyaWN0ZWQtcHJvcGVydGllc1xuICByZXR1cm4gbiA8PSAwLjAzOTI4ID8gbiAvIDEyLjkyIDogTWF0aC5wb3coKChuICsgMC4wNTUpIC8gMS4wNTUpLCAyLjQpO1xufVxuXG5mdW5jdGlvbiBibGVuZEFscGhhKHMsIGQpIHtcbiAgcmV0dXJuIHMgKyAoZCAqICgxIC0gcykpO1xufVxuXG5mdW5jdGlvbiBibGVuZENoYW5uZWwoc2MsIGRjLCBzYSwgZGEsIGJhKSB7XG4gIHJldHVybiAoKHNjICogc2EpICsgKGRjICogZGEgKiAoMSAtIHNhKSkpIC8gYmE7XG59XG5cbmZ1bmN0aW9uIGJsZW5kKGNvbG91cnMpIHtcbiAgbGV0IFtyLCBnLCBiLCBhXSA9IFswLCAwLCAwLCAwXTtcbiAgY29sb3Vycy5yZXZlcnNlKCkuZm9yRWFjaCgoW19yLCBfZywgX2IsIF9hXSkgPT4ge1xuICAgIGNvbnN0IGFOZXcgPSBibGVuZEFscGhhKF9hLCBhKTtcbiAgICByID0gYmxlbmRDaGFubmVsKF9yLCByLCBfYSwgYSwgYU5ldyk7XG4gICAgZyA9IGJsZW5kQ2hhbm5lbChfZywgZywgX2EsIGEsIGFOZXcpO1xuICAgIGIgPSBibGVuZENoYW5uZWwoX2IsIGIsIF9hLCBhLCBhTmV3KTtcbiAgICBhID0gYU5ldztcbiAgfSk7XG4gIHJldHVybiBbTWF0aC5yb3VuZChyKSwgTWF0aC5yb3VuZChnKSwgTWF0aC5yb3VuZChiKSwgYV07XG59XG5cbmZ1bmN0aW9uIGx1bWlub3NpdHkociwgZywgYikge1xuICAvLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9SZWxhdGl2ZV9sdW1pbmFuY2VcbiAgcmV0dXJuICgwLjIxMjYgKiBnYW1tYShyKSkgKyAoMC43MTUyICogZ2FtbWEoZykpICsgKDAuMDcyMiAqIGdhbW1hKGIpKTtcbn1cblxuZnVuY3Rpb24gY29udHJhc3RSYXRpbyhsMSwgbDIpIHtcbiAgLy8gaHR0cHM6Ly93d3cudzMub3JnL1RSLzIwMDgvUkVDLVdDQUcyMC0yMDA4MTIxMS8jY29udHJhc3QtcmF0aW9kZWZcbiAgaWYgKGwxIDwgbDIpIHtcbiAgICBbbDIsIGwxXSA9IFtsMSwgbDJdO1xuICB9XG4gIHJldHVybiAobDEgKyAwLjA1KSAvIChsMiArIDAuMDUpO1xufVxuXG4vLyBDb252ZXJ0IGEgQ1NTIGNvbG91ciB0byBhbiBhcnJheSBvZiBSR0JBIHZhbHVlc1xuZnVuY3Rpb24gdG9SZ2JhQXJyYXkoc3R5bGUpIHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZWwuc3R5bGUuY29sb3IgPSBzdHlsZTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XG4gIGNvbnN0IHZhbHVlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwpLmNvbG9yO1xuICBpZiAoIXZhbHVlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1bmFibGUgdG8gcGFyc2UgY29sb3VyJyk7XG4gIH1cbiAgcmV0dXJuIGNvbG91clBhcnRzKHZhbHVlKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2UtYmVmb3JlLWRlZmluZVxufVxuXG4vKipcbiAqIEdpdmVuIGEgY29sb3VyIGluIHJnYmEgb3IgcmdiIGZvcm1hdCwgZ2V0IGl0cyBwYXJ0c1xuICogVGhlIHBhcnRzIHNob3VsZCBiZSBpbiB0aGUgcmFuZ2UgMCB0byAxXG4gKi9cbmZ1bmN0aW9uIGNvbG91clBhcnRzKGNvbG91cikge1xuICBpZiAoY29sb3VyID09PSAndHJhbnNwYXJlbnQnKSB7XG4gICAgcmV0dXJuIFswLCAwLCAwLCAwXTtcbiAgfVxuICBjb25zdCBtYXRjaCA9IGNvbG91ci5tYXRjaCgvXnJnYmE/XFwoKFxcZCspLCAqKFxcZCspLCAqKFxcZCspKD86LCAqKFxcZCsoPzpcXC5cXGQrKT8pKT9cXCkkLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiBbK21hdGNoWzFdLCArbWF0Y2hbMl0sICttYXRjaFszXSwgbWF0Y2hbNF0gPyBwYXJzZUZsb2F0KG1hdGNoWzRdKSA6IDFdO1xuICB9XG4gIHJldHVybiB0b1JnYmFBcnJheShjb2xvdXIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbnRyYXN0IHtcbiAgY29uc3RydWN0b3Ioc3R5bGVDYWNoZSkge1xuICAgIHRoaXMuc3R5bGVDYWNoZSA9IHN0eWxlQ2FjaGU7XG4gIH1cblxuICB0ZXh0Q29udHJhc3QoZWwpIHtcbiAgICByZXR1cm4gY29udHJhc3RSYXRpbyh0aGlzLl90ZXh0THVtaW5vc2l0eShlbCksIHRoaXMuX2JhY2tncm91bmRMdW1pbm9zaXR5KGVsKSk7XG4gIH1cblxuICBfYmxlbmRXaXRoQmFja2dyb3VuZChjb2xvdXIsIGVsKSB7XG4gICAgaWYgKGNvbG91clszXSA9PT0gMSkge1xuICAgICAgcmV0dXJuIGNvbG91cjtcbiAgICB9XG4gICAgY29uc3QgY29sb3VyU3RhY2sgPSBbY29sb3VyXTtcbiAgICBsZXQgY3Vyc29yID0gZWw7XG4gICAgbGV0IGN1cnJlbnRDb2xvdXIgPSBjb2xvdXI7XG4gICAgZG8ge1xuICAgICAgbGV0IGJhY2tncm91bmQ7XG4gICAgICBpZiAoY3Vyc29yID09PSBkb2N1bWVudCkge1xuICAgICAgICAvLyBJIGFzc3VtZSB0aGlzIGlzIGFsd2F5cyB0aGUgY2FzZT9cbiAgICAgICAgYmFja2dyb3VuZCA9IFsyNTUsIDI1NSwgMjU1LCAxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJhY2tncm91bmQgPSBjb2xvdXJQYXJ0cyh0aGlzLnN0eWxlQ2FjaGUuZ2V0KGN1cnNvciwgJ2JhY2tncm91bmRDb2xvcicpKTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRDb2xvdXIgPSBiYWNrZ3JvdW5kO1xuICAgICAgaWYgKGN1cnJlbnRDb2xvdXJbM10gIT09IDApIHtcbiAgICAgICAgY29sb3VyU3RhY2sucHVzaChjdXJyZW50Q29sb3VyKTtcbiAgICAgIH1cbiAgICB9IHdoaWxlIChjdXJyZW50Q29sb3VyWzNdICE9PSAxICYmIChjdXJzb3IgPSBjdXJzb3IucGFyZW50Tm9kZSkpO1xuICAgIHJldHVybiBibGVuZChjb2xvdXJTdGFjayk7XG4gIH1cblxuICB0ZXh0Q29sb3VyKGVsKSB7XG4gICAgY29uc3QgY29sb3VyID0gY29sb3VyUGFydHModGhpcy5zdHlsZUNhY2hlLmdldChlbCwgJ2NvbG9yJykpO1xuICAgIHJldHVybiB0aGlzLl9ibGVuZFdpdGhCYWNrZ3JvdW5kKGNvbG91ciwgZWwpO1xuICB9XG5cbiAgYmFja2dyb3VuZENvbG91cihlbCkge1xuICAgIHJldHVybiB0aGlzLl9ibGVuZFdpdGhCYWNrZ3JvdW5kKFswLCAwLCAwLCAwXSwgZWwpO1xuICB9XG5cbiAgX3RleHRMdW1pbm9zaXR5KGVsKSB7XG4gICAgcmV0dXJuIGx1bWlub3NpdHkuYXBwbHkobnVsbCwgdGhpcy50ZXh0Q29sb3VyKGVsKSk7XG4gIH1cblxuICBfYmFja2dyb3VuZEx1bWlub3NpdHkoZWwpIHtcbiAgICByZXR1cm4gbHVtaW5vc2l0eS5hcHBseShudWxsLCB0aGlzLmJhY2tncm91bmRDb2xvdXIoZWwpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgY29udHJhc3QgYmV0d2VlbiB0d28gY29sb3Vyc1xuICAgKi9cbiAgc3RhdGljIGNvbG91ckNvbnRyYXN0KGZvcmVncm91bmQsIGJhY2tncm91bmQpIHtcbiAgICBmb3JlZ3JvdW5kID0gY29sb3VyUGFydHMoZm9yZWdyb3VuZCk7XG4gICAgYmFja2dyb3VuZCA9IGNvbG91clBhcnRzKGJhY2tncm91bmQpO1xuICAgIGlmIChiYWNrZ3JvdW5kWzNdICE9PSAxKSB7XG4gICAgICBiYWNrZ3JvdW5kID0gYmxlbmQoW2JhY2tncm91bmQsIFsyNTUsIDI1NSwgMjU1LCAxXV0pO1xuICAgIH1cbiAgICBpZiAoZm9yZWdyb3VuZFszXSAhPT0gMSkge1xuICAgICAgZm9yZWdyb3VuZCA9IGJsZW5kKFtmb3JlZ3JvdW5kLCBiYWNrZ3JvdW5kXSk7XG4gICAgfVxuICAgIHJldHVybiBjb250cmFzdFJhdGlvKFxuICAgICAgbHVtaW5vc2l0eS5hcHBseShudWxsLCBmb3JlZ3JvdW5kKSxcbiAgICAgIGx1bWlub3NpdHkuYXBwbHkobnVsbCwgYmFja2dyb3VuZClcbiAgICApO1xuICB9XG59O1xuXG4vLyBUaGUgZm9sbG93aW5nIGFyZSBleHBvc2VkIGZvciB1bml0IHRlc3Rpbmdcbm1vZHVsZS5leHBvcnRzLnByb3RvdHlwZS5fYmxlbmQgPSBibGVuZDtcbm1vZHVsZS5leHBvcnRzLnByb3RvdHlwZS5fbHVtaW5vc2l0eSA9IGx1bWlub3NpdHk7XG5tb2R1bGUuZXhwb3J0cy5wcm90b3R5cGUuX2NvbG91clBhcnRzID0gY29sb3VyUGFydHM7XG5tb2R1bGUuZXhwb3J0cy5wcm90b3R5cGUuX2NvbnRyYXN0UmF0aW8gPSBjb250cmFzdFJhdGlvO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNzc0VzY2FwZShuYW1lKSB7XG4gIHJldHVybiBuYW1lLnJlcGxhY2UoL1tcIlxcXFxdL2csICdcXFxcJCYnKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICogIERldGVybWluZSBpZiBhbiBlbGVtZW50IGlzIGhpZGRlbiBvciBub3RcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgY2xhc3MtbWV0aG9kcy11c2UtdGhpcyAqL1xuXG5jb25zdCBFbGVtZW50Q2FjaGUgPSByZXF1aXJlKCcuLi9zdXBwb3J0L2VsZW1lbnQtY2FjaGUnKTtcblxuLy8gRWxlbWVudHMgdGhhdCBkb24ndCBoYXZlIGNsaWVudCByZWN0YW5nbGVzXG5jb25zdCBub1JlY3RzID0gWydicicsICd3YnInXTtcblxuLy8gSXMgdGhlIGVsZW1lbnQgaGlkZGVuIHVzaW5nIENTU1xuZnVuY3Rpb24gY3NzSGlkZGVuKGVsLCBzdHlsZSkge1xuICByZXR1cm4gc3R5bGUuZ2V0KGVsLCAndmlzaWJpbGl0eScpICE9PSAndmlzaWJsZScgfHwgc3R5bGUuZ2V0KGVsLCAnZGlzcGxheScpID09PSAnbm9uZSc7XG59XG5cbi8vIElzIHRoZSBlbGVtZW50IGhpZGRlbiBmcm9tIGFjY2Vzc2liaWxpdHkgc29mdHdhcmVcbmZ1bmN0aW9uIGhpZGRlbihlbCwgc3R5bGUsIGFyaWFIaWRkZW4gPSBmYWxzZSkge1xuICBpZiAoZWwgPT09IGRvY3VtZW50KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiAoYXJpYUhpZGRlbiAmJiBlbC5nZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJykgPT09ICd0cnVlJylcbiAgICB8fCAoIW5vUmVjdHMuaW5jbHVkZXMoZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkgJiYgZWwuZ2V0Q2xpZW50UmVjdHMoKS5sZW5ndGggPT09IDApXG4gICAgfHwgKGFyaWFIaWRkZW4gJiYgISFlbC5jbG9zZXN0KCdbYXJpYS1oaWRkZW49dHJ1ZV0nKSlcbiAgICB8fCBjc3NIaWRkZW4oZWwsIHN0eWxlKTtcbn1cblxuLyoqXG4gKiAgQ2FjaGUgb2YgaGlkZGVuIGVsZW1lbnRcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBIaWRkZW4gZXh0ZW5kcyBFbGVtZW50Q2FjaGUge1xuICBjb25zdHJ1Y3RvcihzdHlsZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5zdHlsZSA9IHN0eWxlO1xuICB9XG5cbiAga2V5KGVsLCB7IGFyaWFIaWRkZW4gPSBmYWxzZSB9ID0ge30pIHtcbiAgICByZXR1cm4gYXJpYUhpZGRlbjtcbiAgfVxuXG4gIHNldHRlcihlbCwgeyBhcmlhSGlkZGVuID0gZmFsc2UgfSA9IHt9KSB7XG4gICAgcmV0dXJuIGhpZGRlbihlbCwgdGhpcy5zdHlsZSwgYXJpYUhpZGRlbik7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IHsgJCwgJCQgfSA9IHJlcXVpcmUoJy4vc2VsZWN0b3JzJyk7XG5jb25zdCB7IGFjY2Vzc2libGVOYW1lLCBhY2Nlc3NpYmxlRGVzY3JpcHRpb24gfSA9IHJlcXVpcmUoJy4vbmFtZScpO1xuY29uc3QgQXJpYSA9IHJlcXVpcmUoJy4vYXJpYScpO1xuY29uc3QgQ29udHJhc3QgPSByZXF1aXJlKCcuL2NvbnRyYXN0Jyk7XG5jb25zdCBjc3NFc2NhcGUgPSByZXF1aXJlKCcuL2Nzc0VzY2FwZScpO1xuY29uc3QgSGlkZGVuID0gcmVxdWlyZSgnLi9oaWRkZW4nKTtcbmNvbnN0IFN0eWxlID0gcmVxdWlyZSgnLi9zdHlsZScpO1xuXG5jb25zdCBnZXRPclNldCA9IChjYWNoZSwgZWwsIHNldHRlcikgPT4ge1xuICBpZiAoY2FjaGUuaGFzKGVsKSkge1xuICAgIHJldHVybiBjYWNoZS5nZXQoZWwpO1xuICB9XG5cbiAgY29uc3QgdmFsdWUgPSBzZXR0ZXIoKTtcbiAgY2FjaGUuc2V0KGVsLCB2YWx1ZSk7XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cbi8qKlxuICogSGVscGVycyBmdW5jdGlvbnNcbiAqL1xuY29uc3QgVXRpbHMgPSBjbGFzcyBVdGlscyB7XG4gIGNvbnN0cnVjdG9yKGNvbmZpZykge1xuICAgIHRoaXMuX3N0eWxlID0gbmV3IFN0eWxlKCk7XG4gICAgdGhpcy5faGlkZGVuID0gbmV3IEhpZGRlbih0aGlzLl9zdHlsZSk7XG4gICAgdGhpcy5fbmFtZUNhY2hlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB0aGlzLl9kZXNjcmlwdGlvbkNhY2hlID0gbmV3IFdlYWtNYXAoKTtcbiAgICB0aGlzLmNvbnRyYXN0ID0gbmV3IENvbnRyYXN0KHRoaXMuX3N0eWxlKTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLmFyaWEgPSBuZXcgQXJpYShjb25maWcpO1xuICB9XG5cbiAgaGlkZGVuKGVsLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hpZGRlbi5nZXQoZWwsIG9wdGlvbnMpO1xuICB9XG5cbiAgc3R5bGUoZWwsIG5hbWUsIHBzZXVkbykge1xuICAgIHJldHVybiB0aGlzLl9zdHlsZS5nZXQoZWwsIG5hbWUsIHBzZXVkbyk7XG4gIH1cblxuICBhY2Nlc3NpYmxlTmFtZShlbCkge1xuICAgIHJldHVybiBnZXRPclNldChcbiAgICAgIHRoaXMuX25hbWVDYWNoZSxcbiAgICAgIGVsLFxuICAgICAgKCkgPT4gYWNjZXNzaWJsZU5hbWUoZWwsIE9iamVjdC5hc3NpZ24oeyB1dGlsczogdGhpcyB9KSlcbiAgICApO1xuICB9XG5cbiAgYWNjZXNzaWJsZURlc2NyaXB0aW9uKGVsKSB7XG4gICAgcmV0dXJuIGdldE9yU2V0KFxuICAgICAgdGhpcy5fZGVzY3JpcHRpb25DYWNoZSxcbiAgICAgIGVsLFxuICAgICAgKCkgPT4gYWNjZXNzaWJsZURlc2NyaXB0aW9uKGVsLCBPYmplY3QuYXNzaWduKHsgdXRpbHM6IHRoaXMgfSkpXG4gICAgKTtcbiAgfVxufTtcblxuVXRpbHMucHJvdG90eXBlLiQgPSAkO1xuVXRpbHMucHJvdG90eXBlLiQkID0gJCQ7XG5VdGlscy5wcm90b3R5cGUuY3NzRXNjYXBlID0gY3NzRXNjYXBlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vLyBBbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgdGV4dCBhbHRlcm5hdGl2ZSBjb21wdXRhdGlvblxuLy8gaHR0cHM6Ly93d3cudzMub3JnL1RSL2FjY25hbWUtYWFtLTEuMS8jbWFwcGluZ19hZGRpdGlvbmFsX25kX3RlXG5jb25zdCBjb250cm9sUm9sZXMgPSBbJ3RleHRib3gnLCAnY29tYm9ib3gnLCAnbGlzdGJveCcsICdyYW5nZSddO1xuY29uc3QgbmFtZUZyb21Db250ZW50Um9sZXMgPSByb2xlcyA9PiBPYmplY3Qua2V5cyhyb2xlcylcbiAgLmZpbHRlcihuYW1lID0+IHJvbGVzW25hbWVdLm5hbWVGcm9tQ29udGVudCk7XG5cbmNsYXNzIEFjY2Vzc2libGVOYW1lIHtcbiAgY29uc3RydWN0b3IoZWwsIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMudXRpbHMgPSBvcHRpb25zLnV0aWxzO1xuICAgIHRoaXMuZWwgPSBlbDtcbiAgICB0aGlzLnJlY3Vyc2lvbiA9ICEhb3B0aW9ucy5yZWN1cnNpb247XG4gICAgdGhpcy5hbGxvd0hpZGRlbiA9ICEhb3B0aW9ucy5hbGxvd0hpZGRlbjtcbiAgICB0aGlzLmluY2x1ZGVIaWRkZW4gPSAhIW9wdGlvbnMuaW5jbHVkZUhpZGRlbjtcbiAgICB0aGlzLm5vQXJpYUJ5ID0gISFvcHRpb25zLm5vQXJpYUJ5O1xuICAgIHRoaXMuaGlzdG9yeSA9IG9wdGlvbnMuaGlzdG9yeSB8fCBbXTtcbiAgICB0aGlzLmlzV2l0aGluV2lkZ2V0ID0gJ2lzV2l0aGluV2lkZ2V0JyBpbiBvcHRpb25zID8gb3B0aW9ucy5pc1dpdGhpbldpZGdldCA6IHRoaXMudXRpbHMuYXJpYS5oYXNSb2xlKHRoaXMucm9sZSwgJ3dpZGdldCcpO1xuXG4gICAgdGhpcy5zZXF1ZW5jZSA9IFtcbiAgICAgICgpID0+IHRoaXMuaGlkZGVuKCksXG4gICAgICAoKSA9PiB0aGlzLmFyaWFCeSgpLFxuICAgICAgKCkgPT4gdGhpcy5lbWJlZGRlZCgpLFxuICAgICAgKCkgPT4gdGhpcy5hcmlhTGFiZWwoKSxcbiAgICAgICgpID0+IHRoaXMubmF0aXZlKCksXG4gICAgICAoKSA9PiB0aGlzLmxvb3AoKSxcbiAgICAgICgpID0+IHRoaXMuZG9tKCksXG4gICAgICAoKSA9PiB0aGlzLnRvb2x0aXAoKSxcbiAgICBdO1xuICB9XG5cbiAgZ2V0IHJvbGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JvbGUgfHwgKHRoaXMuX3JvbGUgPSB0aGlzLnV0aWxzLmFyaWEuZ2V0Um9sZSh0aGlzLmVsKSk7XG4gIH1cblxuICBnZXQgbm9kZU5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25vZGVOYW1lIHx8ICh0aGlzLl9ub2RlTmFtZSA9IHRoaXMuZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKSk7XG4gIH1cblxuICBidWlsZCgpIHtcbiAgICBsZXQgdGV4dCA9ICcnO1xuICAgIHRoaXMuc2VxdWVuY2Uuc29tZShmbiA9PiAodGV4dCA9IGZuKCkpICE9IG51bGwpO1xuXG4gICAgdGV4dCA9IHRleHQgfHwgJyc7XG5cbiAgICBpZiAoIXRoaXMucmVjdXJzaW9uKSB7XG4gICAgICAvLyBUbyBhIGZsYXQgc3RyaW5nXG4gICAgICB0ZXh0ID0gdGV4dC50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xuICAgIH1cblxuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgbG9vcCgpIHtcbiAgICByZXR1cm4gdGhpcy5oaXN0b3J5LmluY2x1ZGVzKHRoaXMuZWwpID8gJycgOiBudWxsO1xuICB9XG5cbiAgaGlkZGVuKCkge1xuICAgIGlmICh0aGlzLmluY2x1ZGVIaWRkZW4pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBpc0hpZGRlbiA9IHRoaXMudXRpbHMuaGlkZGVuKHRoaXMuZWwsIHsgYXJpYUhpZGRlbjogdHJ1ZSB9KTtcbiAgICBpZiAodGhpcy5hbGxvd0hpZGRlbiAmJiBpc0hpZGRlbikge1xuICAgICAgdGhpcy5pbmNsdWRlSGlkZGVuID0gdHJ1ZTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gaXNIaWRkZW4gPyAnJyA6IG51bGw7XG4gIH1cblxuICBhcmlhQnkoYXR0ciA9ICdhcmlhLWxhYmVsbGVkYnknKSB7XG4gICAgaWYgKHRoaXMubm9BcmlhQnkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGlkcyA9IHRoaXMuZWwuZ2V0QXR0cmlidXRlKGF0dHIpIHx8ICcnO1xuICAgIGlmIChpZHMpIHtcbiAgICAgIHJldHVybiBpZHMudHJpbSgpLnNwbGl0KC9cXHMrLylcbiAgICAgICAgLm1hcChpZCA9PiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLm1hcChlbG0gPT4gdGhpcy5yZWN1cnNlKGVsbSwgeyBhbGxvd0hpZGRlbjogdHJ1ZSwgbm9BcmlhQnk6IGF0dHIgPT09ICdhcmlhLWxhYmVsbGVkYnknIH0pKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgIC5qb2luKCcgJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBhcmlhTGFiZWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuZWwuZ2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJykgfHwgbnVsbDtcbiAgfVxuXG4gIG5hdGl2ZShwcm9wID0gJ25hdGl2ZUxhYmVsJykge1xuICAgIGlmIChbJ25vbmUnLCAncHJlc2VudGF0aW9uJ10uaW5jbHVkZXModGhpcy5yb2xlKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMudXRpbHMuY29uZmlnLmVsZW1lbnRzW3RoaXMubm9kZU5hbWVdO1xuICAgIGlmIChlbGVtZW50ICYmIGVsZW1lbnRbcHJvcF0pIHtcbiAgICAgIGxldCB2YWx1ZSA9IGVsZW1lbnRbcHJvcF0odGhpcy5lbCwgdGhpcy51dGlscyk7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgICB2YWx1ZSA9IFt2YWx1ZV07XG4gICAgICB9XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5tYXAoZWxtID0+IHRoaXMucmVjdXJzZShlbG0sIHsgYWxsb3dIaWRkZW46IHRydWUgfSkpXG4gICAgICAgICAgLmpvaW4oJyAnKSB8fCBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGVtYmVkZGVkKCkge1xuICAgIGNvbnN0IHVzZUVtYmVkZGVkTmFtZSA9IHRoaXMuaXNXaXRoaW5XaWRnZXRcbiAgICAgICYmIHRoaXMucmVjdXJzaW9uXG4gICAgICAmJiBjb250cm9sUm9sZXMuc29tZShuYW1lID0+IHRoaXMudXRpbHMuYXJpYS5oYXNSb2xlKHRoaXMucm9sZSwgbmFtZSkpO1xuXG4gICAgaWYgKCF1c2VFbWJlZGRlZE5hbWUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHsgZWwsIHJvbGUgfSA9IHRoaXM7XG5cbiAgICBpZiAoWydpbnB1dCcsICd0ZXh0YXJlYSddLmluY2x1ZGVzKHRoaXMubm9kZU5hbWUpICYmICF0aGlzLnV0aWxzLmFyaWEuaGFzUm9sZShyb2xlLCAnYnV0dG9uJykpIHtcbiAgICAgIHJldHVybiBlbC52YWx1ZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5ub2RlTmFtZSA9PT0gJ3NlbGVjdCcpIHtcbiAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuZWwuc2VsZWN0ZWRPcHRpb25zKVxuICAgICAgICAubWFwKG9wdGlvbiA9PiBvcHRpb24udmFsdWUpXG4gICAgICAgIC5qb2luKCcgJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudXRpbHMuYXJpYS5oYXNSb2xlKHJvbGUsICd0ZXh0Ym94JykpIHtcbiAgICAgIHJldHVybiBlbC50ZXh0Q29udGVudDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51dGlscy5hcmlhLmhhc1JvbGUocm9sZSwgJ2NvbWJvYm94JykpIHtcbiAgICAgIGNvbnN0IGlucHV0ID0gdGhpcy51dGlscy4kKCdpbnB1dCcsIGVsKTtcbiAgICAgIGlmIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gaW5wdXQudmFsdWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudXRpbHMuYXJpYS5oYXNSb2xlKHJvbGUsICdsaXN0Ym94JykpIHtcbiAgICAgIHJldHVybiB0aGlzLnV0aWxzLiQkKCdbYXJpYS1zZWxlY3RlZD1cInRydWVcIl0nLCBlbClcbiAgICAgICAgLm1hcChlbG0gPT4gdGhpcy5yZWN1cnNlKGVsbSkpXG4gICAgICAgIC5qb2luKCcgJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudXRpbHMuYXJpYS5oYXNSb2xlKHJvbGUsICdyYW5nZScpKSB7XG4gICAgICByZXR1cm4gZWwuZ2V0QXR0cmlidXRlKCdhcmlhLXZhbHVldGV4dCcpIHx8IGVsLmdldEF0dHJpYnV0ZSgnYXJpYS12YWx1ZW5vdycpIHx8ICcnO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gRmluZCB0aGUgbGFiZWwgZnJvbSB0aGUgZG9tXG4gIGRvbSgpIHtcbiAgICBpZiAoIXRoaXMucmVjdXJzaW9uICYmICFuYW1lRnJvbUNvbnRlbnRSb2xlcyh0aGlzLnV0aWxzLmNvbmZpZy5yb2xlcykuaW5jbHVkZXModGhpcy5yb2xlKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5lbC5jaGlsZE5vZGVzKVxuICAgICAgLm1hcCgobm9kZSkgPT4ge1xuICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICByZXR1cm4gbm9kZS50ZXh0Q29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWN1cnNlKG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSlcbiAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgIC5qb2luKCcnKSB8fCBudWxsO1xuICB9XG5cbiAgLy8gRmluZCBhIHRvb2x0aXAgbGFiZWxcbiAgdG9vbHRpcCgpIHtcbiAgICByZXR1cm4gdGhpcy5lbC50aXRsZSB8fCBudWxsO1xuICB9XG5cbiAgcmVjdXJzZShlbCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yKGVsLCBPYmplY3QuYXNzaWduKHtcbiAgICAgIGhpc3Rvcnk6IHRoaXMuaGlzdG9yeS5jb25jYXQodGhpcy5lbCksXG4gICAgICBpbmNsdWRlSGlkZGVuOiB0aGlzLmluY2x1ZGVIaWRkZW4sXG4gICAgICBub0FyaWFCeTogdGhpcy5ub0FyaWFCeSxcbiAgICAgIHJlY3Vyc2lvbjogdHJ1ZSxcbiAgICAgIGlzV2l0aGluV2lkZ2V0OiB0aGlzLmlzV2l0aGluV2lkZ2V0LFxuICAgICAgdXRpbHM6IHRoaXMudXRpbHMsXG4gICAgfSwgb3B0aW9ucykpLmJ1aWxkKCk7XG4gIH1cbn1cblxuY2xhc3MgQWNjZXNzaWJsZURlc2NyaXB0aW9uIGV4dGVuZHMgQWNjZXNzaWJsZU5hbWUge1xuICBjb25zdHJ1Y3RvcihlbCwgb3B0aW9ucykge1xuICAgIHN1cGVyKGVsLCBvcHRpb25zKTtcblxuICAgIHRoaXMuc2VxdWVuY2UudW5zaGlmdCgoKSA9PiB0aGlzLmRlc2NyaWJlZEJ5KCkpO1xuICB9XG5cbiAgZGVzY3JpYmVkQnkoKSB7XG4gICAgaWYgKHRoaXMucmVjdXJzaW9uKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51dGlscy5oaWRkZW4odGhpcy5lbCwgeyBhcmlhSGlkZGVuOiB0cnVlIH0pKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgY29uc3QgYXJpYUJ5ID0gdGhpcy5hcmlhQnkoJ2FyaWEtZGVzY3JpYmVkYnknKTtcbiAgICBpZiAoYXJpYUJ5ICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gYXJpYUJ5O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm5hdGl2ZSgnbmF0aXZlRGVzY3JpcHRpb24nKSB8fCAnJztcbiAgfVxufVxuXG5leHBvcnRzLmFjY2Vzc2libGVOYW1lID0gKGVsLCBvcHRpb25zKSA9PiBuZXcgQWNjZXNzaWJsZU5hbWUoZWwsIG9wdGlvbnMpLmJ1aWxkKCk7XG5leHBvcnRzLmFjY2Vzc2libGVEZXNjcmlwdGlvbiA9IChlbCwgb3B0aW9ucykgPT4gbmV3IEFjY2Vzc2libGVEZXNjcmlwdGlvbihlbCwgb3B0aW9ucykuYnVpbGQoKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgRXh0ZW5kZWRBcnJheSA9IHJlcXVpcmUoJy4uL3N1cHBvcnQvZXh0ZW5kZWQtYXJyYXknKTtcblxuZXhwb3J0cy4kJCA9IGZ1bmN0aW9uICQkKHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gIGNvbnN0IHJvb3QgPSBjb250ZXh0IHx8IGRvY3VtZW50O1xuICBjb25zdCBlbHMgPSBFeHRlbmRlZEFycmF5LmZyb20ocm9vdC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG4gIGlmIChjb250ZXh0ICYmIGNvbnRleHQgaW5zdGFuY2VvZiBFbGVtZW50ICYmIGNvbnRleHQubWF0Y2hlcyhzZWxlY3RvcikpIHtcbiAgICBlbHMucHVzaChjb250ZXh0KTtcbiAgfVxuICByZXR1cm4gZWxzO1xufTtcblxuZXhwb3J0cy4kID0gZnVuY3Rpb24gJChzZWxlY3RvciwgY29udGV4dCkge1xuICByZXR1cm4gZXhwb3J0cy4kJChzZWxlY3RvciwgY29udGV4dClbMF07XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKipcbiAqIEEgY2FjaGUgb2YgY29tcHV0ZWQgc3R5bGUgcHJvcGVydGllc1xuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBjbGFzcy1tZXRob2RzLXVzZS10aGlzICovXG5jb25zdCBFbGVtZW50Q2FjaGUgPSByZXF1aXJlKCcuLi9zdXBwb3J0L2VsZW1lbnQtY2FjaGUnKTtcblxuZnVuY3Rpb24gZ2V0U3R5bGUoZWwsIG5hbWUsIHBzZXVkbykge1xuICByZXR1cm4gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwsIHBzZXVkbyA/IGA6OiR7cHNldWRvfWAgOiBudWxsKVtuYW1lXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTdHlsZSBleHRlbmRzIEVsZW1lbnRDYWNoZSB7XG4gIGtleShlbCwgbmFtZSwgcHNldWRvKSB7XG4gICAgcmV0dXJuIGAke25hbWV9fiR7cHNldWRvfWA7XG4gIH1cblxuICBzZXR0ZXIoZWwsIG5hbWUsIHBzZXVkbykge1xuICAgIHJldHVybiBnZXRTdHlsZShlbCwgbmFtZSwgcHNldWRvKTtcbiAgfVxufTtcbiJdfQ==
