(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AccessibilityLinter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./rules/aria/allowed-attributes/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule.js');

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

},{"../../rule.js":10}],"./rules/aria/attribute-values/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const ExtendedArray = _dereq_('../../../support/extended-array');
const { rSpace } = _dereq_('../../../support/constants');

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

},{"../../../support/constants":12,"../../../support/extended-array":14,"../../rule":10}],"./rules/aria/deprecated-attributes/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/aria/immutable-role/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/aria/landmark/one-banner/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../../rule');

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

},{"../../../rule":10}],"./rules/aria/landmark/one-contentinfo/rule.js":[function(_dereq_,module,exports){
"use strict";
const BannerRule = _dereq_('../one-banner/rule');

module.exports = class extends BannerRule {
  selector() {
    return 'footer,[role~=contentinfo]';
  }

  get role() {
    return 'contentinfo';
  }
};

},{"../one-banner/rule":"./rules/aria/landmark/one-banner/rule.js"}],"./rules/aria/landmark/one-main/rule.js":[function(_dereq_,module,exports){
"use strict";
const BannerRule = _dereq_('../one-banner/rule');

module.exports = class extends BannerRule {
  selector() {
    return 'main,[role~=main]';
  }

  get role() {
    return 'main';
  }
};

},{"../one-banner/rule":"./rules/aria/landmark/one-banner/rule.js"}],"./rules/aria/landmark/prefer-main/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../../rule');

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

},{"../../../rule":10}],"./rules/aria/landmark/required/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../../rule.js');

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

},{"../../../rule.js":10}],"./rules/aria/no-focusable-hidden/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/aria/no-focusable-role-none/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/aria/no-none-without-presentation/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

module.exports = class extends Rule {
  selector() {
    return '[role="none"]';
  }

  test() {
    return 'use a role of "none presentation" to support older user-agents';
  }
};

},{"../../rule":10}],"./rules/aria/one-role/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const { rSpace } = _dereq_('../../../support/constants');

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

},{"../../../support/constants":12,"../../rule":10}],"./rules/aria/roles/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const { rSpace } = _dereq_('../../../support/constants');

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

},{"../../../support/constants":12,"../../rule":10}],"./rules/aria/unsupported-elements/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/attributes/data/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

module.exports = class extends Rule {
  selector() {
    return '[data],[data-]';
  }

  test() {
    return 'data is an attribute prefix';
  }
};

},{"../../rule":10}],"./rules/attributes/no-javascript-handlers/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule.js');

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


},{"../../rule.js":10}],"./rules/attributes/no-positive-tab-index/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule.js');

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


},{"../../rule.js":10}],"./rules/colour-contrast/aa/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const ExtendedArray = _dereq_('../../../support/extended-array');

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

},{"../../../support/extended-array":14,"../../rule":10}],"./rules/colour-contrast/aaa/rule.js":[function(_dereq_,module,exports){
"use strict";
const ColourContrastAARule = _dereq_('../aa/rule.js');

module.exports = class extends ColourContrastAARule {
  setDefaults() {
    this.min = 7;
    this.minLarge = 4.5;
    this.enabled = false;
  }
};

},{"../aa/rule.js":"./rules/colour-contrast/aa/rule.js"}],"./rules/details-and-summary/rule.js":[function(_dereq_,module,exports){
"use strict";
const FieldsetRule = _dereq_('../fieldset-and-legend/rule');

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

},{"../fieldset-and-legend/rule":"./rules/fieldset-and-legend/rule.js"}],"./rules/elements/obsolete/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

module.exports = class extends Rule {
  selector({ config }) {
    return this._selector || (this._selector = Object.keys(config.elements).filter(el => config.elements[el].obsolete).join(','));
  }

  test() {
    return 'do not use obsolete elements';
  }
};

},{"../../rule":10}],"./rules/elements/unknown/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/fieldset-and-legend/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

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

},{"../rule":10}],"./rules/headings/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

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

},{"../rule":10}],"./rules/ids/form-attribute/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const { rSpace } = _dereq_('../../../support/constants');

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

},{"../../../support/constants":12,"../../rule":10}],"./rules/ids/imagemap-ids/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const { rSpace } = _dereq_('../../../support/constants');

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

},{"../../../support/constants":12,"../../rule":10}],"./rules/ids/labels-have-inputs/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const { rSpace } = _dereq_('../../../support/constants');

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

},{"../../../support/constants":12,"../../rule":10}],"./rules/ids/list-id/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const { rSpace } = _dereq_('../../../support/constants');

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

},{"../../../support/constants":12,"../../rule":10}],"./rules/ids/no-duplicate-anchor-names/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/ids/unique-id/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const { rSpace } = _dereq_('../../../support/constants');

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

},{"../../../support/constants":12,"../../rule":10}],"./rules/labels/area/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/labels/aria-command/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/labels/controls/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/labels/group/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/labels/headings/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/labels/img/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/labels/links/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/labels/tabindex/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/lang/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

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

},{"../rule":10}],"./rules/multiple-in-group/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

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

},{"../rule":10}],"./rules/no-button-without-type/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

module.exports = class extends Rule {
  selector() {
    return 'button:not([type])';
  }

  test() {
    return 'all buttons should have a type attribute';
  }
};

},{"../rule":10}],"./rules/no-consecutive-brs/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

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

},{"../rule":10}],"./rules/no-empty-select/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

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

},{"../rule":10}],"./rules/no-links-as-buttons/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

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

},{"../rule":10}],"./rules/no-links-to-missing-fragments/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

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

},{"../rule":10}],"./rules/no-multiple-select/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

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

},{"../rule":10}],"./rules/no-outside-controls/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

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

},{"../rule":10}],"./rules/no-placeholder-links/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule.js');

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


},{"../rule.js":10}],"./rules/no-reset/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

module.exports = class extends Rule {
  selector() {
    return 'input[type=reset],button[type=reset]';
  }

  test() {
    return 'do not use reset buttons';
  }
};

},{"../rule":10}],"./rules/no-unassociated-labels/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

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

},{"../rule":10}],"./rules/security/charset/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');

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

},{"../../rule":10}],"./rules/security/target/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const constants = _dereq_('../../../support/constants');

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

},{"../../../support/constants":12,"../../rule":10}],"./rules/title/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

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

},{"../rule":10}],"./rules":[function(_dereq_,module,exports){
"use strict";
module.exports = ["aria/allowed-attributes","aria/attribute-values","aria/deprecated-attributes","aria/immutable-role","aria/landmark/one-banner","aria/landmark/one-contentinfo","aria/landmark/one-main","aria/landmark/prefer-main","aria/landmark/required","aria/no-focusable-hidden","aria/no-focusable-role-none","aria/no-none-without-presentation","aria/one-role","aria/roles","aria/unsupported-elements","attributes/data","attributes/no-javascript-handlers","attributes/no-positive-tab-index","colour-contrast/aa","colour-contrast/aaa","details-and-summary","elements/obsolete","elements/unknown","fieldset-and-legend","headings","ids/form-attribute","ids/imagemap-ids","ids/labels-have-inputs","ids/list-id","ids/no-duplicate-anchor-names","ids/unique-id","labels/area","labels/aria-command","labels/controls","labels/group","labels/headings","labels/img","labels/links","labels/tabindex","lang","multiple-in-group","no-button-without-type","no-consecutive-brs","no-empty-select","no-links-as-buttons","no-links-to-missing-fragments","no-multiple-select","no-outside-controls","no-placeholder-links","no-reset","no-unassociated-labels","security/charset","security/target","title"];
},{}],"./version":[function(_dereq_,module,exports){
"use strict";
module.exports = "1.14.0"
},{}],1:[function(_dereq_,module,exports){
"use strict";
/**
 * Aria rules for a HTML element
 *
 * https://w3c.github.io/html-aria/
 */
const { $$ } = _dereq_('../utils/selectors.js');

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

},{"../utils/selectors.js":22}],2:[function(_dereq_,module,exports){
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

},{}],3:[function(_dereq_,module,exports){
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

},{}],4:[function(_dereq_,module,exports){
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

},{}],5:[function(_dereq_,module,exports){
"use strict";
const allowedAria = _dereq_('./allowed-aria');
const ariaAttributes = _dereq_('./aria-attributes');
const elements = _dereq_('./elements');
const attributes = _dereq_('./event-handler-attributes');
const roles = _dereq_('./roles');

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

},{"./allowed-aria":1,"./aria-attributes":2,"./elements":3,"./event-handler-attributes":4,"./roles":6}],6:[function(_dereq_,module,exports){
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

},{}],7:[function(_dereq_,module,exports){
"use strict";
/**
 * Entry point for standalone autorunning linter
 */
const Linter = _dereq_('./linter');

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

window.AccessibilityLinter = Linter;
window.accessibilityLinter = linter;

},{"./linter":8}],8:[function(_dereq_,module,exports){
"use strict";
const Runner = _dereq_('./runner');
const Logger = _dereq_('./logger');
const Rule = _dereq_('./rules/rule');
const rules = _dereq_('./rules');
const Utils = _dereq_('./utils');
const version = _dereq_('./version');
const Config = _dereq_('./config');
const Contrast = _dereq_('./utils/contrast');

// eslint-disable-next-line global-require, import/no-dynamic-require
const ruleList = new Map(rules.map(path => [path.replace(/\//g, '-'), _dereq_(`./rules/${path}/rule.js`)]));

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

},{"./config":5,"./logger":9,"./rules":"./rules","./rules/rule":10,"./runner":11,"./utils":20,"./utils/contrast":17,"./version":"./version"}],9:[function(_dereq_,module,exports){
"use strict";
/* eslint-disable no-console, class-methods-use-this */
module.exports = class Logger {
  log({ type, el, message, name }) {
    console[type].apply(console, [message, el, name].filter(Boolean));
  }
};

},{}],10:[function(_dereq_,module,exports){
"use strict";
const ExtendedArray = _dereq_('../support/extended-array');

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

},{"../support/extended-array":14}],11:[function(_dereq_,module,exports){
"use strict";
const Utils = _dereq_('./utils');
const SetCache = _dereq_('./support/set-cache');

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

},{"./support/set-cache":15,"./utils":20}],12:[function(_dereq_,module,exports){
"use strict";
// https://www.w3.org/TR/html52/infrastructure.html#common-parser-idioms
exports.rSpace = /[ \t\n\f\r]+/;

},{}],13:[function(_dereq_,module,exports){
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

},{}],14:[function(_dereq_,module,exports){
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

},{}],15:[function(_dereq_,module,exports){
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

},{}],16:[function(_dereq_,module,exports){
"use strict";
/**
 *  Data and functions for aria validation.  Based on
 *  - https://www.w3.org/TR/wai-aria-1.1/
 *  - https://www.w3.org/TR/html52/
 */
const ExtendedArray = _dereq_('../support/extended-array');

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

},{"../support/extended-array":14}],17:[function(_dereq_,module,exports){
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

},{}],18:[function(_dereq_,module,exports){
"use strict";
module.exports = function cssEscape(name) {
  return name.replace(/["\\]/g, '\\$&');
};

},{}],19:[function(_dereq_,module,exports){
"use strict";
/**
 *  Determine if an element is hidden or not
 */
/* eslint-disable class-methods-use-this */

const ElementCache = _dereq_('../support/element-cache');

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

},{"../support/element-cache":13}],20:[function(_dereq_,module,exports){
"use strict";
const { $, $$ } = _dereq_('./selectors');
const { accessibleName, accessibleDescription } = _dereq_('./name');
const Aria = _dereq_('./aria');
const Contrast = _dereq_('./contrast');
const cssEscape = _dereq_('./cssEscape');
const Hidden = _dereq_('./hidden');
const Style = _dereq_('./style');

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

},{"./aria":16,"./contrast":17,"./cssEscape":18,"./hidden":19,"./name":21,"./selectors":22,"./style":23}],21:[function(_dereq_,module,exports){
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

},{}],22:[function(_dereq_,module,exports){
"use strict";
const ExtendedArray = _dereq_('../support/extended-array');

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

},{"../support/extended-array":14}],23:[function(_dereq_,module,exports){
"use strict";
/**
 * A cache of computed style properties
 */
/* eslint-disable class-methods-use-this */
const ElementCache = _dereq_('../support/element-cache');

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

},{"../support/element-cache":13}]},{},["./rules/aria/allowed-attributes/rule.js","./rules/aria/attribute-values/rule.js","./rules/aria/deprecated-attributes/rule.js","./rules/aria/immutable-role/rule.js","./rules/aria/landmark/one-banner/rule.js","./rules/aria/landmark/one-contentinfo/rule.js","./rules/aria/landmark/one-main/rule.js","./rules/aria/landmark/prefer-main/rule.js","./rules/aria/landmark/required/rule.js","./rules/aria/no-focusable-hidden/rule.js","./rules/aria/no-focusable-role-none/rule.js","./rules/aria/no-none-without-presentation/rule.js","./rules/aria/one-role/rule.js","./rules/aria/roles/rule.js","./rules/aria/unsupported-elements/rule.js","./rules/attributes/data/rule.js","./rules/attributes/no-javascript-handlers/rule.js","./rules/attributes/no-positive-tab-index/rule.js","./rules/colour-contrast/aa/rule.js","./rules/colour-contrast/aaa/rule.js","./rules/details-and-summary/rule.js","./rules/elements/obsolete/rule.js","./rules/elements/unknown/rule.js","./rules/fieldset-and-legend/rule.js","./rules/headings/rule.js","./rules/ids/form-attribute/rule.js","./rules/ids/imagemap-ids/rule.js","./rules/ids/labels-have-inputs/rule.js","./rules/ids/list-id/rule.js","./rules/ids/no-duplicate-anchor-names/rule.js","./rules/ids/unique-id/rule.js","./rules/labels/area/rule.js","./rules/labels/aria-command/rule.js","./rules/labels/controls/rule.js","./rules/labels/group/rule.js","./rules/labels/headings/rule.js","./rules/labels/img/rule.js","./rules/labels/links/rule.js","./rules/labels/tabindex/rule.js","./rules/lang/rule.js","./rules/multiple-in-group/rule.js","./rules/no-button-without-type/rule.js","./rules/no-consecutive-brs/rule.js","./rules/no-empty-select/rule.js","./rules/no-links-as-buttons/rule.js","./rules/no-links-to-missing-fragments/rule.js","./rules/no-multiple-select/rule.js","./rules/no-outside-controls/rule.js","./rules/no-placeholder-links/rule.js","./rules/no-reset/rule.js","./rules/no-unassociated-labels/rule.js","./rules/security/charset/rule.js","./rules/security/target/rule.js","./rules/title/rule.js","./rules","./version",8,7])(8)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvcnVsZXMvYXJpYS9hbGxvd2VkLWF0dHJpYnV0ZXMvcnVsZS5qcyIsImxpYi9ydWxlcy9hcmlhL2F0dHJpYnV0ZS12YWx1ZXMvcnVsZS5qcyIsImxpYi9ydWxlcy9hcmlhL2RlcHJlY2F0ZWQtYXR0cmlidXRlcy9ydWxlLmpzIiwibGliL3J1bGVzL2FyaWEvaW1tdXRhYmxlLXJvbGUvcnVsZS5qcyIsImxpYi9ydWxlcy9hcmlhL2xhbmRtYXJrL29uZS1iYW5uZXIvcnVsZS5qcyIsImxpYi9ydWxlcy9hcmlhL2xhbmRtYXJrL29uZS1jb250ZW50aW5mby9ydWxlLmpzIiwibGliL3J1bGVzL2FyaWEvbGFuZG1hcmsvb25lLW1haW4vcnVsZS5qcyIsImxpYi9ydWxlcy9hcmlhL2xhbmRtYXJrL3ByZWZlci1tYWluL3J1bGUuanMiLCJsaWIvcnVsZXMvYXJpYS9sYW5kbWFyay9yZXF1aXJlZC9ydWxlLmpzIiwibGliL3J1bGVzL2FyaWEvbm8tZm9jdXNhYmxlLWhpZGRlbi9ydWxlLmpzIiwibGliL3J1bGVzL2FyaWEvbm8tZm9jdXNhYmxlLXJvbGUtbm9uZS9ydWxlLmpzIiwibGliL3J1bGVzL2FyaWEvbm8tbm9uZS13aXRob3V0LXByZXNlbnRhdGlvbi9ydWxlLmpzIiwibGliL3J1bGVzL2FyaWEvb25lLXJvbGUvcnVsZS5qcyIsImxpYi9ydWxlcy9hcmlhL3JvbGVzL3J1bGUuanMiLCJsaWIvcnVsZXMvYXJpYS91bnN1cHBvcnRlZC1lbGVtZW50cy9ydWxlLmpzIiwibGliL3J1bGVzL2F0dHJpYnV0ZXMvZGF0YS9ydWxlLmpzIiwibGliL3J1bGVzL2F0dHJpYnV0ZXMvbm8tamF2YXNjcmlwdC1oYW5kbGVycy9ydWxlLmpzIiwibGliL3J1bGVzL2F0dHJpYnV0ZXMvbm8tcG9zaXRpdmUtdGFiLWluZGV4L3J1bGUuanMiLCJsaWIvcnVsZXMvY29sb3VyLWNvbnRyYXN0L2FhL3J1bGUuanMiLCJsaWIvcnVsZXMvY29sb3VyLWNvbnRyYXN0L2FhYS9ydWxlLmpzIiwibGliL3J1bGVzL2RldGFpbHMtYW5kLXN1bW1hcnkvcnVsZS5qcyIsImxpYi9ydWxlcy9lbGVtZW50cy9vYnNvbGV0ZS9ydWxlLmpzIiwibGliL3J1bGVzL2VsZW1lbnRzL3Vua25vd24vcnVsZS5qcyIsImxpYi9ydWxlcy9maWVsZHNldC1hbmQtbGVnZW5kL3J1bGUuanMiLCJsaWIvcnVsZXMvaGVhZGluZ3MvcnVsZS5qcyIsImxpYi9ydWxlcy9pZHMvZm9ybS1hdHRyaWJ1dGUvcnVsZS5qcyIsImxpYi9ydWxlcy9pZHMvaW1hZ2VtYXAtaWRzL3J1bGUuanMiLCJsaWIvcnVsZXMvaWRzL2xhYmVscy1oYXZlLWlucHV0cy9ydWxlLmpzIiwibGliL3J1bGVzL2lkcy9saXN0LWlkL3J1bGUuanMiLCJsaWIvcnVsZXMvaWRzL25vLWR1cGxpY2F0ZS1hbmNob3ItbmFtZXMvcnVsZS5qcyIsImxpYi9ydWxlcy9pZHMvdW5pcXVlLWlkL3J1bGUuanMiLCJsaWIvcnVsZXMvbGFiZWxzL2FyZWEvcnVsZS5qcyIsImxpYi9ydWxlcy9sYWJlbHMvYXJpYS1jb21tYW5kL3J1bGUuanMiLCJsaWIvcnVsZXMvbGFiZWxzL2NvbnRyb2xzL3J1bGUuanMiLCJsaWIvcnVsZXMvbGFiZWxzL2dyb3VwL3J1bGUuanMiLCJsaWIvcnVsZXMvbGFiZWxzL2hlYWRpbmdzL3J1bGUuanMiLCJsaWIvcnVsZXMvbGFiZWxzL2ltZy9ydWxlLmpzIiwibGliL3J1bGVzL2xhYmVscy9saW5rcy9ydWxlLmpzIiwibGliL3J1bGVzL2xhYmVscy90YWJpbmRleC9ydWxlLmpzIiwibGliL3J1bGVzL2xhbmcvcnVsZS5qcyIsImxpYi9ydWxlcy9tdWx0aXBsZS1pbi1ncm91cC9ydWxlLmpzIiwibGliL3J1bGVzL25vLWJ1dHRvbi13aXRob3V0LXR5cGUvcnVsZS5qcyIsImxpYi9ydWxlcy9uby1jb25zZWN1dGl2ZS1icnMvcnVsZS5qcyIsImxpYi9ydWxlcy9uby1lbXB0eS1zZWxlY3QvcnVsZS5qcyIsImxpYi9ydWxlcy9uby1saW5rcy1hcy1idXR0b25zL3J1bGUuanMiLCJsaWIvcnVsZXMvbm8tbGlua3MtdG8tbWlzc2luZy1mcmFnbWVudHMvcnVsZS5qcyIsImxpYi9ydWxlcy9uby1tdWx0aXBsZS1zZWxlY3QvcnVsZS5qcyIsImxpYi9ydWxlcy9uby1vdXRzaWRlLWNvbnRyb2xzL3J1bGUuanMiLCJsaWIvcnVsZXMvbm8tcGxhY2Vob2xkZXItbGlua3MvcnVsZS5qcyIsImxpYi9ydWxlcy9uby1yZXNldC9ydWxlLmpzIiwibGliL3J1bGVzL25vLXVuYXNzb2NpYXRlZC1sYWJlbHMvcnVsZS5qcyIsImxpYi9ydWxlcy9zZWN1cml0eS9jaGFyc2V0L3J1bGUuanMiLCJsaWIvcnVsZXMvc2VjdXJpdHkvdGFyZ2V0L3J1bGUuanMiLCJsaWIvcnVsZXMvdGl0bGUvcnVsZS5qcyIsImxpYi9fc3RyZWFtXzU0LmpzIiwibGliL19zdHJlYW1fNTUuanMiLCJsaWIvY29uZmlnL2FsbG93ZWQtYXJpYS5qcyIsImxpYi9jb25maWcvYXJpYS1hdHRyaWJ1dGVzLmpzIiwibGliL2NvbmZpZy9lbGVtZW50cy5qcyIsImxpYi9jb25maWcvZXZlbnQtaGFuZGxlci1hdHRyaWJ1dGVzLmpzIiwibGliL2NvbmZpZy9pbmRleC5qcyIsImxpYi9jb25maWcvcm9sZXMuanMiLCJsaWIvaW5kZXguanMiLCJsaWIvbGludGVyLmpzIiwibGliL2xvZ2dlci5qcyIsImxpYi9ydWxlcy9ydWxlLmpzIiwibGliL3J1bm5lci5qcyIsImxpYi9zdXBwb3J0L2NvbnN0YW50cy5qcyIsImxpYi9zdXBwb3J0L2VsZW1lbnQtY2FjaGUuanMiLCJsaWIvc3VwcG9ydC9leHRlbmRlZC1hcnJheS5qcyIsImxpYi9zdXBwb3J0L3NldC1jYWNoZS5qcyIsImxpYi91dGlscy9hcmlhLmpzIiwibGliL3V0aWxzL2NvbnRyYXN0LmpzIiwibGliL3V0aWxzL2Nzc0VzY2FwZS5qcyIsImxpYi91dGlscy9oaWRkZW4uanMiLCJsaWIvdXRpbHMvaW5kZXguanMiLCJsaWIvdXRpbHMvbmFtZS5qcyIsImxpYi91dGlscy9zZWxlY3RvcnMuanMiLCJsaWIvdXRpbHMvc3R5bGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUpBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlLmpzJyk7XG5cbmNvbnN0IGRpc2FibGVhYmxlID0gWydpbnB1dCcsICdidXR0b24nLCAnc2VsZWN0JywgJ29wdGdyb3VwJywgJ3RleHRhcmVhJywgJ2ZpZWxkc2V0J107IC8vIG9wdGlvbiBkb2VzIG5vdCBuZWVkIHRvIGJlIGluY2x1ZGVkXG5jb25zdCBwbGFjZWhvbGRlcmFibGUgPSBbJ2lucHV0JywgJ3RleHRhcmVhJ107XG5jb25zdCByZXF1aXJlYWJsZSA9IFsnaW5wdXQnLCAnc2VsZWN0JywgJ3RleHRhcmVhJ107XG5jb25zdCByZWFkb25seWFibGUgPSBbJ3RleHQnLCAndXJsJywgJ2VtYWlsJ107XG5cbmZ1bmN0aW9uIGhhc0NvbnRlbnRFZGl0YWJsZShlbCkge1xuICByZXR1cm4gZWwuY29udGVudEVkaXRhYmxlID09PSAndHJ1ZScgfHwgKCgoZWwuY2xvc2VzdCgnW2NvbnRlbnRlZGl0YWJsZV0nKSB8fCB7fSkuY29udGVudEVkaXRhYmxlID09PSAndHJ1ZScpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJyonO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBsZXQgYXJpYUF0dHJpYnV0ZXMgPSBBcnJheS5mcm9tKGVsLmF0dHJpYnV0ZXMpXG4gICAgICAuZmlsdGVyKCh7IG5hbWUgfSkgPT4gbmFtZS5zdGFydHNXaXRoKCdhcmlhLScpKVxuICAgICAgLm1hcCgoeyBuYW1lIH0pID0+IG5hbWUuc2xpY2UoNSkpO1xuXG4gICAgaWYgKCFhcmlhQXR0cmlidXRlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGFsbG93ZWQgPSB1dGlscy5hcmlhLmFsbG93ZWQoZWwpO1xuICAgIGNvbnN0IGVycm9ycyA9IFtdO1xuXG4gICAgYXJpYUF0dHJpYnV0ZXMgPSBhcmlhQXR0cmlidXRlcy5maWx0ZXIoKG5hbWUpID0+IHtcbiAgICAgIGlmICghdXRpbHMuY29uZmlnLmFyaWFBdHRyaWJ1dGVzW25hbWVdKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKGBhcmlhLSR7bmFtZX0gaXMgbm90IGEga25vd24gYXJpYSBhdHRyaWJ1dGVgKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICBpZiAoYWxsb3dlZC5ub0FyaWEpIHtcbiAgICAgIGVycm9ycy5wdXNoKGBubyBhcmlhIGF0dHJpYnV0ZXMgYXJlIGFsbG93ZWQgb24gZWxlbWVudC4gRm91bmQgJHthcmlhQXR0cmlidXRlcy5tYXAobmFtZSA9PiBgYXJpYS0ke25hbWV9YCkuam9pbignLCAnKX1gKTtcbiAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgfVxuXG4gICAgY29uc3Qgcm9sZSA9IHV0aWxzLmFyaWEuZ2V0Um9sZShlbCwgYWxsb3dlZCk7XG5cbiAgICBpZiAoWydub25lJywgJ3ByZXNlbnRhdGlvbiddLmluY2x1ZGVzKHJvbGUpKSB7XG4gICAgICBlcnJvcnMucHVzaChgbm8gYXJpYSBhdHRyaWJ1dGVzIHNob3VsZCBiZSBhZGRlZCBmb3IgYSByb2xlIG9mICR7cm9sZX0uIEZvdW5kICR7YXJpYUF0dHJpYnV0ZXMubWFwKG5hbWUgPT4gYGFyaWEtJHtuYW1lfWApLmpvaW4oJywgJyl9YCk7XG4gICAgICByZXR1cm4gZXJyb3JzO1xuICAgIH1cblxuICAgIGNvbnN0IG5vZGVOYW1lID0gZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgIGlmIChhcmlhQXR0cmlidXRlcy5pbmNsdWRlcygnZGlzYWJsZWQnKSAmJiBkaXNhYmxlYWJsZS5pbmNsdWRlcyhub2RlTmFtZSkpIHtcbiAgICAgIGVycm9ycy5wdXNoKCdkbyBub3QgaW5jbHVkZSBhcmlhLWRpc2FibGVkIG9uIGVsZW1lbnRzIHdpdGggYSBuYXRpdmUgZGlzYWJsZWQgYXR0cmlidXRlJyk7XG4gICAgfVxuXG4gICAgaWYgKGFyaWFBdHRyaWJ1dGVzLmluY2x1ZGVzKCdoaWRkZW4nKSAmJiBlbC5oaWRkZW4pIHtcbiAgICAgIGVycm9ycy5wdXNoKCdkbyBub3QgaW5jbHVkZSBhcmlhLWhpZGRlbiBvbiBlbGVtZW50cyB3aXRoIGEgaGlkZGVuIGF0dHJpYnV0ZScpO1xuICAgIH1cblxuICAgIC8vIGZpbHRlciBnbG9iYWxcbiAgICBhcmlhQXR0cmlidXRlcyA9IGFyaWFBdHRyaWJ1dGVzXG4gICAgICAuZmlsdGVyKG5hbWUgPT4gISh1dGlscy5jb25maWcuYXJpYUF0dHJpYnV0ZXNbbmFtZV0gfHwge30pLmdsb2JhbCk7XG5cbiAgICAvLyBmaWx0ZXIgZGlzYWxsb3dlZFxuICAgIGNvbnN0IGFsbG93c1JvbGVBdHRyaWJ1dGVzID0gYWxsb3dlZC5yb2xlcyA9PT0gJyonXG4gICAgICB8fCBhbGxvd2VkLnJvbGVzLmluY2x1ZGVzKHJvbGUpXG4gICAgICB8fCAoYWxsb3dlZC5hcmlhRm9ySW1wbGljaXQgJiYgYWxsb3dlZC5pbXBsaWNpdC5pbmNsdWRlcyhyb2xlKSk7XG4gICAgY29uc3Qgcm9sZUNvbmZpZyA9IHV0aWxzLmNvbmZpZy5yb2xlc1tyb2xlXTtcbiAgICBhcmlhQXR0cmlidXRlcyA9IGFyaWFBdHRyaWJ1dGVzXG4gICAgICAuZmlsdGVyKChuYW1lKSA9PiB7XG4gICAgICAgIGlmIChhbGxvd3NSb2xlQXR0cmlidXRlcyAmJiByb2xlQ29uZmlnICYmIHJvbGVDb25maWcuYWxsb3dlZC5pbmNsdWRlcyhuYW1lKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVycm9ycy5wdXNoKGBhcmlhLSR7bmFtZX0gaXMgbm90IGFsbG93ZWQgb24gdGhpcyBlbGVtZW50YCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xuXG4gICAgaWYgKGFyaWFBdHRyaWJ1dGVzLmluY2x1ZGVzKCdyZWFkb25seScpKSB7XG4gICAgICBpZiAoZWwuZ2V0QXR0cmlidXRlKCdhcmlhLXJlYWRvbmx5JykgPT09ICd0cnVlJyAmJiBoYXNDb250ZW50RWRpdGFibGUoZWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKCdkbyBub3QgaW5jbHVkZSBhcmlhLXJlYWRvbmx5PVwidHJ1ZVwiIG9uIGVsZW1lbnRzIHdpdGggY29udGVudGVkaXRhYmxlJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChub2RlTmFtZSA9PT0gJ3RleHRhcmVhJyB8fCAobm9kZU5hbWUgPT09ICdpbnB1dCcgJiYgcmVhZG9ubHlhYmxlLmluY2x1ZGVzKGVsLnR5cGUpKSkge1xuICAgICAgICBlcnJvcnMucHVzaCgnZG8gbm90IGluY2x1ZGUgYXJpYS1yZWFkb25seSBvbiBlbGVtZW50cyB3aXRoIGEgbmF0aXZlIHJlYWRvbmx5IGF0dHJpYnV0ZScpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChhcmlhQXR0cmlidXRlcy5pbmNsdWRlcygncGxhY2Vob2xkZXInKSAmJiBwbGFjZWhvbGRlcmFibGUuaW5jbHVkZXMobm9kZU5hbWUpKSB7XG4gICAgICBlcnJvcnMucHVzaCgnZG8gbm90IGluY2x1ZGUgYXJpYS1wbGFjZWhvbGRlciBvbiBlbGVtZW50cyB3aXRoIGEgbmF0aXZlIHBsYWNlaG9sZGVyIGF0dHJpYnV0ZScpO1xuICAgIH1cblxuICAgIGlmIChhcmlhQXR0cmlidXRlcy5pbmNsdWRlcygncmVxdWlyZWQnKVxuICAgICAgJiYgcmVxdWlyZWFibGUuaW5jbHVkZXMobm9kZU5hbWUpXG4gICAgICAmJiBlbC5yZXF1aXJlZFxuICAgICAgJiYgZWwuZ2V0QXR0cmlidXRlKCdhcmlhLXJlcXVpcmVkJykgPT09ICdmYWxzZScpIHtcbiAgICAgIGVycm9ycy5wdXNoKCdkbyBub3Qgc2V0IGFyaWEtcmVxdWlyZWQgdG8gZmFsc2UgaWYgdGhlIHJlcXVpcmVkIGF0dHJpYnV0ZSBpcyBzZXQnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXJyb3JzO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuY29uc3QgRXh0ZW5kZWRBcnJheSA9IHJlcXVpcmUoJy4uLy4uLy4uL3N1cHBvcnQvZXh0ZW5kZWQtYXJyYXknKTtcbmNvbnN0IHsgclNwYWNlIH0gPSByZXF1aXJlKCcuLi8uLi8uLi9zdXBwb3J0L2NvbnN0YW50cycpO1xuXG5jb25zdCBjaGVja2VycyA9IHtcbiAgc3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuICF2YWx1ZS50cmltKCkgPyAnbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcnIDogbnVsbDtcbiAgfSxcblxuICBpbnRlZ2VyKHZhbHVlKSB7XG4gICAgcmV0dXJuIC9eLT9cXGQrJC8udGVzdCh2YWx1ZSkgPyBudWxsIDogJ211c3QgYmUgYW4gaW50ZWdlcic7XG4gIH0sXG5cbiAgbnVtYmVyKHZhbHVlKSB7XG4gICAgLy8gQWx0aG91Z2ggbm90IGVudGlyZWx5IGNsZWFyLCBsZXQgdXMgYXNzdW1lIHRoZSBudW1iZXIgZm9sbG93cyB0aGUgaHRtbDUgc3BlY2lmaWNhdGlvblxuICAgIHJldHVybiAvXi0/KD86XFxkK1xcLlxcZCt8XFxkK3xcXC5cXGQrKSg/OltlRV1bKy1dP1xcZCspPyQvLnRlc3QodmFsdWUpID8gbnVsbCA6ICdtdXN0IGJlIGEgZmxvYXRpbmcgcG9pbnQgbnVtYmVyJztcbiAgfSxcblxuICB0b2tlbih2YWx1ZSwgeyB0b2tlbnMgfSkge1xuICAgIHJldHVybiB0b2tlbnMuaW5jbHVkZXModmFsdWUpID8gbnVsbCA6IGBtdXN0IGJlIG9uZSBvZjogJHt0b2tlbnMuam9pbignLCAnKX1gO1xuICB9LFxuXG4gIHRva2VubGlzdCh2YWx1ZSwgeyB0b2tlbnMsIGFsb25lIH0pIHtcbiAgICBjb25zdCB2YWx1ZXMgPSB2YWx1ZS5zcGxpdCgvXFxzKy8pLmZpbHRlcihCb29sZWFuKTtcbiAgICBjb25zdCB1bmtub3duID0gdmFsdWVzLmZpbHRlcih0b2tlbiA9PiAhdG9rZW5zLmluY2x1ZGVzKHRva2VuKSk7XG4gICAgaWYgKHZhbHVlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBgbXVzdCBiZSBvbmUgb3IgbW9yZSBvZjogJHt0b2tlbnMuam9pbignLCAnKX1gO1xuICAgIH1cbiAgICBpZiAodW5rbm93bi5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBgY29udGFpbnMgdW5rbm93biB2YWx1ZXM6ICR7dW5rbm93bi5qb2luKCcsICcpfWA7XG4gICAgfVxuICAgIGlmIChhbG9uZSAmJiB2YWx1ZXMubGVuZ3RoID4gMSkge1xuICAgICAgY29uc3QgYWxvbmVzID0gdmFsdWVzLmZpbHRlcih0b2tlbiA9PiBhbG9uZS5pbmNsdWRlcyh0b2tlbikpO1xuICAgICAgaWYgKGFsb25lcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGBzaG91bGQgb25seSBjb250YWluIHRoZSBmb2xsb3dpbmcgdmFsdWVzIG9uIHRoZWlyIG93bjogJHthbG9uZXMuam9pbignLCAnKX1gO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcblxuICBpZCh2YWx1ZSkge1xuICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICByZXR1cm4gJ211c3QgYmUgYW4gZWxlbWVudCBpZCc7XG4gICAgfVxuXG4gICAgaWYgKHJTcGFjZS50ZXN0KHZhbHVlKSkge1xuICAgICAgcmV0dXJuICdtdXN0IG5vdCBjb250YWluIHNwYWNlcyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHZhbHVlKSA/IG51bGwgOiBgbm8gZWxlbWVudCBjYW4gYmUgZm91bmQgd2l0aCBhbiBpZCBvZiAke3ZhbHVlfWA7XG4gIH0sXG5cbiAgaWRsaXN0KHZhbHVlKSB7XG4gICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgIHJldHVybiAnbXVzdCBiZSBhIGxpc3Qgb2Ygb25lIG9mIG1vcmUgaWRzJztcbiAgICB9XG4gICAgY29uc3QgbWlzc2luZyA9IHZhbHVlLnNwbGl0KHJTcGFjZSkuZmlsdGVyKGlkID0+ICFkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkpO1xuICAgIGlmICghbWlzc2luZy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gbWlzc2luZy5tYXAoaWQgPT4gYG5vIGVsZW1lbnQgY2FuIGJlIGZvdW5kIHdpdGggYW4gaWQgb2YgJHtpZH1gKTtcbiAgfSxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IodXRpbHMpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0b3IgfHwgKHRoaXMuX3NlbGVjdG9yID0gT2JqZWN0LmtleXModXRpbHMuY29uZmlnLmFyaWFBdHRyaWJ1dGVzKS5tYXAobmFtZSA9PiBgW2FyaWEtJHtuYW1lfV1gKS5qb2luKCcsJykpO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICByZXR1cm4gRXh0ZW5kZWRBcnJheS5mcm9tKGVsLmF0dHJpYnV0ZXMpXG4gICAgICAubWFwKCh7IG5hbWUsIHZhbHVlIH0pID0+IHtcbiAgICAgICAgaWYgKCFuYW1lLnN0YXJ0c1dpdGgoJ2FyaWEtJykpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBuYW1lID0gbmFtZS5zbGljZSg1KTtcbiAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSB1dGlscy5jb25maWcuYXJpYUF0dHJpYnV0ZXNbbmFtZV07XG4gICAgICAgIGlmICghZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEV4dGVuZGVkQXJyYXkoKVxuICAgICAgICAgIC5jb25jYXQoY2hlY2tlcnNbZGVzY3JpcHRpb24udmFsdWVzLnR5cGVdKHZhbHVlLCBkZXNjcmlwdGlvbi52YWx1ZXMpKVxuICAgICAgICAgIC5jb21wYWN0KClcbiAgICAgICAgICAubWFwKG1lc3NhZ2UgPT4gYGFyaWEtJHtuYW1lfSAke21lc3NhZ2V9YCk7XG4gICAgICB9KVxuICAgICAgLmNvbXBhY3QoKVxuICAgICAgLmZsYXR0ZW4oKTtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBkZXByZWNhdGVkKHV0aWxzKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlcHJlY2F0ZWQgfHwgKHRoaXMuX2RlcHJlY2F0ZWQgPSBPYmplY3QuZW50cmllcyh1dGlscy5jb25maWcuYXJpYUF0dHJpYnV0ZXMpXG4gICAgICAuZmlsdGVyKChbLCB2YWx1ZV0pID0+IHZhbHVlLmRlcHJlY2F0ZWQpXG4gICAgICAubWFwKChbbmFtZV0pID0+IGBhcmlhLSR7bmFtZX1gKSk7XG4gIH1cblxuICBzZWxlY3Rvcih1dGlscykge1xuICAgIHJldHVybiB0aGlzLmRlcHJlY2F0ZWQodXRpbHMpLm1hcChuYW1lID0+IGBbJHtuYW1lfV1gKS5qb2luKCcsJyk7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGVsLmF0dHJpYnV0ZXMpXG4gICAgICAuZmlsdGVyKCh7IG5hbWUgfSkgPT4gdGhpcy5kZXByZWNhdGVkKHV0aWxzKS5pbmNsdWRlcyhuYW1lKSlcbiAgICAgIC5tYXAoKHsgbmFtZSB9KSA9PiBgJHtuYW1lfSBpcyBkZXByZWNhdGVkYCk7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgY29uc3RydWN0b3Ioc2V0dGluZ3MpIHtcbiAgICBzdXBlcihzZXR0aW5ncyk7XG4gICAgdGhpcy5oaXN0b3J5ID0gbmV3IFdlYWtNYXAoKTtcbiAgfVxuXG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnW3JvbGVdJztcbiAgfVxuXG4gIHRlc3QoZWwpIHtcbiAgICBjb25zdCByb2xlID0gZWwuZ2V0QXR0cmlidXRlKCdyb2xlJyk7XG4gICAgaWYgKHRoaXMuaGlzdG9yeS5oYXMoZWwpKSB7XG4gICAgICBpZiAodGhpcy5oaXN0b3J5LmdldChlbCkgIT09IHJvbGUpIHtcbiAgICAgICAgcmV0dXJuICdhbiBlbGVtZW50cyByb2xlIG11c3Qgbm90IGJlIG1vZGlmaWVkJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oaXN0b3J5LnNldChlbCwgcm9sZSk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnaGVhZGVyLFtyb2xlfj1iYW5uZXJdJztcbiAgfVxuXG4gIGdldCByb2xlKCkge1xuICAgIHJldHVybiAnYmFubmVyJztcbiAgfVxuXG4gIGdldCBtZXNzYWdlKCkge1xuICAgIHJldHVybiBgdGhlcmUgc2hvdWxkIG9ubHkgYmUgb25lIGVsZW1lbnQgd2l0aCBhIHJvbGUgb2YgJHt0aGlzLnJvbGV9IGluIGVhY2ggZG9jdW1lbnQgb3IgYXBwbGljYXRpb25gO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAoIXV0aWxzLmFyaWEuaGFzUm9sZShlbCwgdGhpcy5yb2xlKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZm91bmQgPSB1dGlscy4kJCh0aGlzLnNlbGVjdG9yKCkpXG4gICAgICAuZmlsdGVyKGVsbSA9PiB1dGlscy5hcmlhLmhhc1JvbGUoZWxtLCB0aGlzLnJvbGUpKVxuICAgICAgLmdyb3VwQnkoZWxtID0+IHV0aWxzLmFyaWEuY2xvc2VzdFJvbGUoZWxtLCBbJ2FwcGxpY2F0aW9uJywgJ2RvY3VtZW50J10pKVxuICAgICAgLmZpbHRlcihncm91cCA9PiBncm91cC5pbmNsdWRlcyhlbCkpXG4gICAgICAuZmxhdHRlbigpO1xuXG4gICAgaWYgKGZvdW5kLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IEJhbm5lclJ1bGUgPSByZXF1aXJlKCcuLi9vbmUtYmFubmVyL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIEJhbm5lclJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2Zvb3Rlcixbcm9sZX49Y29udGVudGluZm9dJztcbiAgfVxuXG4gIGdldCByb2xlKCkge1xuICAgIHJldHVybiAnY29udGVudGluZm8nO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBCYW5uZXJSdWxlID0gcmVxdWlyZSgnLi4vb25lLWJhbm5lci9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBCYW5uZXJSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdtYWluLFtyb2xlfj1tYWluXSc7XG4gIH1cblxuICBnZXQgcm9sZSgpIHtcbiAgICByZXR1cm4gJ21haW4nO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnOm5vdChtYWluKVtyb2xlfj1tYWluXSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICghdXRpbHMuYXJpYS5oYXNSb2xlKGVsLCAnbWFpbicpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gJ3VzZSBhIG1haW4gZWxlbWVudCBmb3Igcm9sZT1tYWluJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3J1bGUuanMnKTtcblxuZnVuY3Rpb24gaGFzTGFuZG1hcmsobm9kZU5hbWUsIHJvbGUsIHV0aWxzKSB7XG4gIHJldHVybiB1dGlscy4kJChgJHtub2RlTmFtZX0sW3JvbGV+PSR7cm9sZX1dYCwgZG9jdW1lbnQuYm9keSlcbiAgICAuZmlsdGVyKGVsID0+ICF1dGlscy5oaWRkZW4oZWwpKVxuICAgIC5maWx0ZXIoZWwgPT4gdXRpbHMuYXJpYS5oYXNSb2xlKGVsLCByb2xlKSlcbiAgICAuZmlsdGVyKGVsID0+IHV0aWxzLmFyaWEuY2xvc2VzdFJvbGUoZWwsIFsnZG9jdW1lbnQnLCAnYXBwbGljYXRpb24nXSkgPT09IGRvY3VtZW50LmJvZHkpXG4gICAgLmZpbHRlcihlbCA9PiBlbC5pbm5lclRleHQpXG4gICAgLmxlbmd0aCA+IDA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdib2R5JztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgY29uc3QgZXJyb3JzID0gW107XG5cbiAgICBpZiAoIWhhc0xhbmRtYXJrKCdtYWluJywgJ21haW4nLCB1dGlscykpIHtcbiAgICAgIGVycm9ycy5wdXNoKCdkb2N1bWVudCBzaG91bGQgaGF2ZSBhIDxtYWluPicpO1xuICAgIH1cblxuICAgIGlmICghaGFzTGFuZG1hcmsoJ2hlYWRlcicsICdiYW5uZXInLCB1dGlscykpIHtcbiAgICAgIGVycm9ycy5wdXNoKCdkb2N1bWVudCBzaG91bGQgaGF2ZSBhIDxoZWFkZXI+Jyk7XG4gICAgfVxuXG4gICAgaWYgKCFoYXNMYW5kbWFyaygnZm9vdGVyJywgJ2NvbnRlbnRpbmZvJywgdXRpbHMpKSB7XG4gICAgICBlcnJvcnMucHVzaCgnZG9jdW1lbnQgc2hvdWxkIGhhdmUgYSA8Zm9vdGVyPicpO1xuICAgIH1cblxuICAgIHJldHVybiBlcnJvcnM7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbmNvbnN0IGZvY3VzYWJsZSA9IFsnYnV0dG9uOm5vdCg6ZGlzYWJsZWQpJywgJ2lucHV0Om5vdChbdHlwZT1cImhpZGRlblwiXSk6bm90KDpkaXNhYmxlZCknLCAnc2VsZWN0Om5vdCg6ZGlzYWJsZWQpJywgJ3RleHRhcmVhOm5vdCg6ZGlzYWJsZWQpJywgJ2FbaHJlZl0nLCAnYXJlYVtocmVmXScsICdbdGFiaW5kZXhdJ107XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdG9yIHx8ICh0aGlzLl9zZWxlY3RvciA9IGZvY3VzYWJsZS5tYXAoc2VsZWN0b3IgPT4gYCR7c2VsZWN0b3J9W2FyaWEtaGlkZGVuPVwidHJ1ZVwiXWApLmpvaW4oJywnKSk7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmIChlbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnYXJlYScgfHwgIXV0aWxzLmhpZGRlbihlbCkpIHtcbiAgICAgIHJldHVybiAnZG8gbm90IG1hcmsgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGggYGFyaWEtaGlkZGVuPVwidHJ1ZVwiYCc7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuXG5jb25zdCBmb2N1c2FibGUgPSAnYnV0dG9uLGlucHV0Om5vdChbdHlwZT1cImhpZGRlblwiXSksbWV0ZXIsb3V0cHV0LHByb2dyZXNzLHNlbGVjdCx0ZXh0YXJlYSxhW2hyZWZdLGFyZWFbaHJlZl0sW3RhYmluZGV4XSc7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdbcm9sZX49bm9uZV0sW3JvbGV+PXByZXNlbnRhdGlvbl0nO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAoZWwubWF0Y2hlcyhmb2N1c2FibGUpICYmIHV0aWxzLmFyaWEuaGFzUm9sZShlbCwgWydub25lJywgJ3ByZXNlbnRhdGlvbiddKSkge1xuICAgICAgcmV0dXJuICdkbyBub3QgbWFyayBmb2N1c2FibGUgZWxlbWVudHMgd2l0aCBhIHJvbGUgb2YgcHJlc2VudGF0aW9uIG9yIG5vbmUnO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ1tyb2xlPVwibm9uZVwiXSc7XG4gIH1cblxuICB0ZXN0KCkge1xuICAgIHJldHVybiAndXNlIGEgcm9sZSBvZiBcIm5vbmUgcHJlc2VudGF0aW9uXCIgdG8gc3VwcG9ydCBvbGRlciB1c2VyLWFnZW50cyc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5jb25zdCB7IHJTcGFjZSB9ID0gcmVxdWlyZSgnLi4vLi4vLi4vc3VwcG9ydC9jb25zdGFudHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ1tyb2xlXSc7XG4gIH1cblxuICB0ZXN0KGVsKSB7XG4gICAgY29uc3Qgcm9sZXMgPSBlbC5nZXRBdHRyaWJ1dGUoJ3JvbGUnKS5zcGxpdChyU3BhY2UpLmZpbHRlcihCb29sZWFuKTtcbiAgICBpZiAocm9sZXMuam9pbignICcpID09PSAnbm9uZSBwcmVzZW50YXRpb24nKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAocm9sZXMubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuICdkbyBub3QgYWRkIG11bHRpcGxlIHJvbGVzJztcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcbmNvbnN0IHsgclNwYWNlIH0gPSByZXF1aXJlKCcuLi8uLi8uLi9zdXBwb3J0L2NvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBpc1N1cHBvcnRlZChlbCwgdXRpbHMpIHtcbiAgcmV0dXJuICEodXRpbHMuY29uZmlnLmVsZW1lbnRzW2VsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCldIHx8IHt9KS51bnN1cHBvcnRlZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ1tyb2xlXSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGNvbnN0IHJvbGUgPSBlbC5nZXRBdHRyaWJ1dGUoJ3JvbGUnKS50cmltKCk7XG4gICAgaWYgKCFyb2xlKSB7XG4gICAgICByZXR1cm4gJ3JvbGUgYXR0cmlidXRlIHNob3VsZCBub3QgYmUgZW1wdHknO1xuICAgIH1cblxuICAgIGxldCBlcnJvcjtcbiAgICBjb25zdCBhbGxvd2VkID0gdXRpbHMuYXJpYS5hbGxvd2VkKGVsKTtcbiAgICBjb25zdCBzdXBwb3J0ZWQgPSBpc1N1cHBvcnRlZChlbCwgdXRpbHMpO1xuXG4gICAgcm9sZS5zcGxpdChyU3BhY2UpLnNvbWUoKG5hbWUpID0+IHtcbiAgICAgIGlmICghdXRpbHMuY29uZmlnLnJvbGVzW25hbWVdKSB7XG4gICAgICAgIGVycm9yID0gYHJvbGUgXCIke25hbWV9XCIgaXMgbm90IGEga25vd24gcm9sZWA7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodXRpbHMuY29uZmlnLnJvbGVzW25hbWVdLmFic3RyYWN0KSB7XG4gICAgICAgIGVycm9yID0gYHJvbGUgXCIke25hbWV9XCIgaXMgYW4gYWJzdHJhY3Qgcm9sZSBhbmQgc2hvdWxkIG5vdCBiZSB1c2VkYDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzdXBwb3J0ZWQgJiYgYWxsb3dlZC5pbXBsaWNpdC5pbmNsdWRlcyhuYW1lKSkge1xuICAgICAgICBlcnJvciA9IGByb2xlIFwiJHtuYW1lfVwiIGlzIGltcGxpY2l0IGZvciB0aGlzIGVsZW1lbnQgYW5kIHNob3VsZCBub3QgYmUgc3BlY2lmaWVkYDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChhbGxvd2VkLnJvbGVzID09PSAnKicpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmICghYWxsb3dlZC5yb2xlcy5pbmNsdWRlcyhuYW1lKSAmJiAoc3VwcG9ydGVkIHx8ICFhbGxvd2VkLmltcGxpY2l0LmluY2x1ZGVzKG5hbWUpKSkge1xuICAgICAgICBlcnJvciA9IGByb2xlIFwiJHtuYW1lfVwiIGlzIG5vdCBhbGxvd2VkIGZvciB0aGlzIGVsZW1lbnRgO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9KTtcblxuICAgIHJldHVybiBlcnJvcjtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3Rvcih1dGlscykge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RvciB8fCAodGhpcy5fc2VsZWN0b3IgPSBBcnJheS5mcm9tKE9iamVjdC5lbnRyaWVzKHV0aWxzLmNvbmZpZy5lbGVtZW50cykpXG4gICAgICAuZmlsdGVyKChbLCB7IHVuc3VwcG9ydGVkIH1dKSA9PiB1bnN1cHBvcnRlZClcbiAgICAgIC5tYXAoKFtuYW1lXSkgPT4gYCR7bmFtZX06bm90KFtyb2xlXSlgKVxuICAgICAgLmpvaW4oJywnKSk7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGNvbnN0IGFsbG93ZWQgPSB1dGlscy5hcmlhLmFsbG93ZWQoZWwpO1xuICAgIGlmICghYWxsb3dlZC5pbXBsaWNpdC5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiAnZWxlbWVudCBzaG91bGQgaGF2ZSBhIHJvbGUgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5JztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ1tkYXRhXSxbZGF0YS1dJztcbiAgfVxuXG4gIHRlc3QoKSB7XG4gICAgcmV0dXJuICdkYXRhIGlzIGFuIGF0dHJpYnV0ZSBwcmVmaXgnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKHV0aWxzKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdG9yXG4gICAgICB8fCAodGhpcy5fc2VsZWN0b3IgPSB1dGlscy5jb25maWcuYXR0cmlidXRlcy5ldmVudEhhbmRsZXJBdHRyaWJ1dGVzLm1hcChuYW1lID0+IGBbJHtuYW1lfV1gKS5qb2luKCcsJykpO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBjb25zdCBoYW5kbGVycyA9IEFycmF5LmZyb20oZWwuYXR0cmlidXRlcylcbiAgICAgIC5maWx0ZXIoKHsgbmFtZSB9KSA9PiB1dGlscy5jb25maWcuYXR0cmlidXRlcy5ldmVudEhhbmRsZXJBdHRyaWJ1dGVzLmluY2x1ZGVzKG5hbWUpKVxuICAgICAgLm1hcCgoeyBuYW1lIH0pID0+IG5hbWUpO1xuXG4gICAgcmV0dXJuIGBkbyBub3QgdXNlIGV2ZW50IGhhbmRsZXIgYXR0cmlidXRlcy4gRm91bmQ6ICR7aGFuZGxlcnMuam9pbignLCAnKX1gO1xuICB9XG59O1xuXG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdbdGFiaW5kZXhdJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKGVsLnRhYkluZGV4IDw9IDAgfHwgdXRpbHMuaGlkZGVuKGVsKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuICdubyB0YWJpbmRleCBncmVhdGVyIHRoYW4gMCc7XG4gIH1cbn07XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcbmNvbnN0IEV4dGVuZGVkQXJyYXkgPSByZXF1aXJlKCcuLi8uLi8uLi9zdXBwb3J0L2V4dGVuZGVkLWFycmF5Jyk7XG5cbi8qKlxuICogIENoZWNrIHRoZSBjb2xvdXIgY29udHJhc3QgZm9yIGFsbCB2aXNpYmxlIG5vZGVzIHdpdGggY2hpbGQgdGV4dCBub2Rlc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNldERlZmF1bHRzKCkge1xuICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICAgIHRoaXMubWluID0gNC41O1xuICAgIHRoaXMubWluTGFyZ2UgPSAzO1xuICB9XG5cbiAgcnVuKGNvbnRleHQsIGZpbHRlciA9ICgpID0+IHRydWUsIHV0aWxzKSB7XG4gICAgcmV0dXJuIHRoaXMuaXRlcmF0ZShjb250ZXh0LCB1dGlscywgZmFsc2UpXG4gICAgICAuZmlsdGVyKGZpbHRlcilcbiAgICAgIC5tYXAoZWwgPT4gdGhpcy5maW5kQW5jZXN0b3IoZWwsIHV0aWxzKSlcbiAgICAgIC51bmlxdWUoKVxuICAgICAgLmZpbHRlcihmaWx0ZXIpXG4gICAgICAubWFwKGVsID0+IFtlbCwgdGhpcy50ZXN0KGVsLCB1dGlscyldKVxuICAgICAgLmZpbHRlcigoWywgcmF0aW9dKSA9PiByYXRpbylcbiAgICAgIC5tYXAoKFtlbCwgcmF0aW9dKSA9PiB0aGlzLm1lc3NhZ2UoZWwsIHJhdGlvKSk7XG4gIH1cblxuICBpdGVyYXRlKG5vZGUsIHV0aWxzLCBpdGVyYXRlU2libGluZ3MpIHtcbiAgICBsZXQgZm91bmQgPSBuZXcgRXh0ZW5kZWRBcnJheSgpO1xuICAgIGxldCBjdXJzb3IgPSBub2RlO1xuICAgIHdoaWxlIChjdXJzb3IpIHtcbiAgICAgIGlmICghdXRpbHMuaGlkZGVuKGN1cnNvciwgeyBub0FyaWE6IHRydWUgfSkpIHtcbiAgICAgICAgaWYgKHRoaXMuaGFzVGV4dE5vZGUoY3Vyc29yKSkge1xuICAgICAgICAgIGZvdW5kLnB1c2goY3Vyc29yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjdXJzb3IuZmlyc3RFbGVtZW50Q2hpbGQpIHtcbiAgICAgICAgICBmb3VuZCA9IGZvdW5kLmNvbmNhdCh0aGlzLml0ZXJhdGUoY3Vyc29yLmZpcnN0RWxlbWVudENoaWxkLCB1dGlscywgdHJ1ZSkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpdGVyYXRlU2libGluZ3MpIHtcbiAgICAgICAgY3Vyc29yID0gY3Vyc29yLm5leHRFbGVtZW50U2libGluZztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN1cnNvciA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG5cbiAgLy8gRG9lcyB0aGUgZWxlbWVudCBoYXZlIGEgdGV4dCBub2RlIHdpdGggY29udGVudFxuICBoYXNUZXh0Tm9kZShlbCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGVsLmNoaWxkTm9kZXMpXG4gICAgICAuZmlsdGVyKG5vZGUgPT4gbm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpXG4gICAgICAuc29tZShub2RlID0+IG5vZGUuZGF0YS50cmltKCkpO1xuICB9XG5cbiAgLy8gRmluZCB0aGUgbGFzdCBhbmNlc3RvciBvciBzZWxmIHdpdGggdGhlIHNhbWUgY29sb3Vyc1xuICBmaW5kQW5jZXN0b3IoZWwsIHV0aWxzKSB7XG4gICAgY29uc3QgY29sb3VyID0gdXRpbHMuY29udHJhc3QudGV4dENvbG91cihlbCk7XG4gICAgY29uc3QgYmFja2dyb3VuZENvbG91ciA9IHV0aWxzLmNvbnRyYXN0LmJhY2tncm91bmRDb2xvdXIoZWwpO1xuXG4gICAgbGV0IGN1cnNvciA9IGVsO1xuICAgIHdoaWxlIChjdXJzb3IucGFyZW50Tm9kZSAhPT0gZG9jdW1lbnQpIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IGN1cnNvci5wYXJlbnROb2RlO1xuICAgICAgaWYgKHV0aWxzLmNvbnRyYXN0LnRleHRDb2xvdXIocGFyZW50KSAhPT0gY29sb3VyXG4gICAgICAgICYmIHV0aWxzLmNvbnRyYXN0LmJhY2tncm91bmRDb2xvdXIocGFyZW50KSAhPT0gYmFja2dyb3VuZENvbG91cikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGN1cnNvciA9IHBhcmVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gY3Vyc29yO1xuICB9XG5cbiAgLy8gRG9lcyB0aGUgZWxlbWVudCBtZWV0IEFBQSBvciBBQSBzdGFuZGFyZHNcbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBjb25zdCByYXRpbyA9IHBhcnNlRmxvYXQodXRpbHMuY29udHJhc3QudGV4dENvbnRyYXN0KGVsKS50b0ZpeGVkKDIpKTtcblxuICAgIGlmIChyYXRpbyA+PSB0aGlzLm1pbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZm9udFNpemUgPSBwYXJzZUZsb2F0KHV0aWxzLnN0eWxlKGVsLCAnZm9udFNpemUnKSk7XG4gICAgbGV0IGZvbnRXZWlnaHQgPSB1dGlscy5zdHlsZShlbCwgJ2ZvbnRXZWlnaHQnKTtcbiAgICBpZiAoZm9udFdlaWdodCA9PT0gJ2JvbGQnKSB7XG4gICAgICBmb250V2VpZ2h0ID0gNzAwO1xuICAgIH0gZWxzZSBpZiAoZm9udFdlaWdodCA9PT0gJ25vcm1hbCcpIHtcbiAgICAgIGZvbnRXZWlnaHQgPSA0MDA7XG4gICAgfVxuICAgIGNvbnN0IGxhcmdlID0gZm9udFNpemUgPj0gMjQgLyogMThwdCAqLyB8fCAoZm9udFNpemUgPj0gMTguNjYgLyogMTRwdCAqLyAmJiBmb250V2VpZ2h0ID49IDcwMCk7XG5cbiAgICBpZiAobGFyZ2UgJiYgcmF0aW8gPj0gdGhpcy5taW5MYXJnZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJhdGlvO1xuICB9XG5cbiAgbWVzc2FnZShlbCwgcmF0aW8pIHtcbiAgICByZXR1cm4geyBlbCwgbWVzc2FnZTogYGNvbnRyYXN0IGlzIHRvbyBsb3cgJHtwYXJzZUZsb2F0KHJhdGlvLnRvRml4ZWQoMikpfToxYCB9O1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBDb2xvdXJDb250cmFzdEFBUnVsZSA9IHJlcXVpcmUoJy4uL2FhL3J1bGUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIENvbG91ckNvbnRyYXN0QUFSdWxlIHtcbiAgc2V0RGVmYXVsdHMoKSB7XG4gICAgdGhpcy5taW4gPSA3O1xuICAgIHRoaXMubWluTGFyZ2UgPSA0LjU7XG4gICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IEZpZWxkc2V0UnVsZSA9IHJlcXVpcmUoJy4uL2ZpZWxkc2V0LWFuZC1sZWdlbmQvcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgRmllbGRzZXRSdWxlIHtcbiAgZ2V0IHBhcmVudCgpIHtcbiAgICByZXR1cm4gJ2RldGFpbHMnO1xuICB9XG5cbiAgZ2V0IGNoaWxkKCkge1xuICAgIHJldHVybiAnc3VtbWFyeSc7XG4gIH1cblxuICBpc0hpZGRlbihlbCwgdXRpbHMpIHtcbiAgICAvLyBzdW1tYXJ5IHdpbGwgYmUgaGlkZGVuIGlmIGRldGFpbHMgaXMgbm90IG9wZW5cbiAgICByZXR1cm4gZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKSAhPT0gJ3N1bW1hcnknICYmIHV0aWxzLmhpZGRlbihlbCk7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoeyBjb25maWcgfSkge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RvciB8fCAodGhpcy5fc2VsZWN0b3IgPSBPYmplY3Qua2V5cyhjb25maWcuZWxlbWVudHMpLmZpbHRlcihlbCA9PiBjb25maWcuZWxlbWVudHNbZWxdLm9ic29sZXRlKS5qb2luKCcsJykpO1xuICB9XG5cbiAgdGVzdCgpIHtcbiAgICByZXR1cm4gJ2RvIG5vdCB1c2Ugb2Jzb2xldGUgZWxlbWVudHMnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKHsgY29uZmlnIH0pIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0b3IgfHwgKHRoaXMuX3NlbGVjdG9yID0gT2JqZWN0LmtleXMoY29uZmlnLmVsZW1lbnRzKS5tYXAobmFtZSA9PiBgOm5vdCgke25hbWV9KWApLmpvaW4oJycpKTtcbiAgfVxuXG4gIHRlc3QoZWwpIHtcbiAgICBpZiAoZWwuY2xvc2VzdCgnc3ZnLG1hdGgnKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAndW5rbm93biBlbGVtZW50JztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uL3J1bGUnKTtcblxuZnVuY3Rpb24gZ2V0Rmlyc3RDaGlsZChlbCkge1xuICBsZXQgY3Vyc29yID0gZWwuZmlyc3RDaGlsZDtcbiAgd2hpbGUgKGN1cnNvciBpbnN0YW5jZW9mIFRleHQgJiYgIWN1cnNvci5kYXRhLnRyaW0oKSkge1xuICAgIGN1cnNvciA9IGN1cnNvci5uZXh0U2libGluZztcbiAgfVxuICByZXR1cm4gY3Vyc29yO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIGdldCBwYXJlbnQoKSB7XG4gICAgcmV0dXJuICdmaWVsZHNldCc7XG4gIH1cblxuICBnZXQgY2hpbGQoKSB7XG4gICAgcmV0dXJuICdsZWdlbmQnO1xuICB9XG5cbiAgaXNIaWRkZW4oZWwsIHV0aWxzKSB7XG4gICAgcmV0dXJuIHV0aWxzLmhpZGRlbihlbCk7XG4gIH1cblxuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gYCR7dGhpcy5wYXJlbnR9LCR7dGhpcy5jaGlsZH1gO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAodGhpcy5pc0hpZGRlbihlbCwgdXRpbHMpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdGhpcy5wYXJlbnQpIHtcbiAgICAgIGNvbnN0IGZpcnN0Q2hpbGQgPSBnZXRGaXJzdENoaWxkKGVsKTtcbiAgICAgIGlmIChmaXJzdENoaWxkXG4gICAgICAgICYmIGZpcnN0Q2hpbGQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudFxuICAgICAgICAmJiBmaXJzdENoaWxkLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHRoaXMuY2hpbGRcbiAgICAgICAgJiYgIXV0aWxzLmhpZGRlbihmaXJzdENoaWxkKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBgYSA8JHt0aGlzLnBhcmVudH0+IG11c3QgaGF2ZSBhIHZpc2libGUgPCR7dGhpcy5jaGlsZH0+IGFzIHRoZWlyIGZpcnN0IGNoaWxkYDtcbiAgICB9XG5cbiAgICAvLyBMZWdlbmRcbiAgICBpZiAoZWwucGFyZW50Tm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSB0aGlzLnBhcmVudCkge1xuICAgICAgY29uc3QgZmlyc3RDaGlsZCA9IGdldEZpcnN0Q2hpbGQoZWwucGFyZW50Tm9kZSk7XG4gICAgICBpZiAoZmlyc3RDaGlsZCA9PT0gZWwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBgYSA8JHt0aGlzLmNoaWxkfT4gbXVzdCBiZSB0aGUgZmlyc3QgY2hpbGQgb2YgYSA8JHt0aGlzLnBhcmVudH0+YDtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uL3J1bGUnKTtcblxuY29uc3Qgc2VsZWN0b3IgPSAnaDIsaDMsaDQsaDUsaDYsW3JvbGV+PWhlYWRpbmddJztcblxuZnVuY3Rpb24gcHJldmlvdXMoZWwpIHtcbiAgbGV0IGN1cnNvciA9IGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7XG4gIHdoaWxlIChjdXJzb3IgJiYgY3Vyc29yLmxhc3RFbGVtZW50Q2hpbGQpIHtcbiAgICBjdXJzb3IgPSBjdXJzb3IubGFzdEVsZW1lbnRDaGlsZDtcbiAgfVxuICByZXR1cm4gY3Vyc29yO1xufVxuXG5mdW5jdGlvbiBnZXRMZXZlbChlbCkge1xuICByZXR1cm4gL2hbMS02XS9pLnRlc3QoZWwubm9kZU5hbWUpID8gK2VsLm5vZGVOYW1lWzFdIDogKCtlbC5nZXRBdHRyaWJ1dGUoJ2FyaWEtbGV2ZWwnKSB8fCAyKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gYCR7c2VsZWN0b3J9Om5vdChbYXJpYS1sZXZlbD1cIjFcIl0pYDtcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKCF1dGlscy5hcmlhLmhhc1JvbGUoZWwsICdoZWFkaW5nJykgfHwgdXRpbHMuaGlkZGVuKGVsKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGxldCBjdXJzb3IgPSBlbDtcbiAgICBjb25zdCBsZXZlbCA9IGdldExldmVsKGVsKTtcbiAgICBkbyB7XG4gICAgICBjdXJzb3IgPSBwcmV2aW91cyhjdXJzb3IpIHx8IGN1cnNvci5wYXJlbnRFbGVtZW50O1xuICAgICAgaWYgKGN1cnNvciAmJiBjdXJzb3IubWF0Y2hlcyhgaDEsJHtzZWxlY3Rvcn1gKSAmJiAhdXRpbHMuaGlkZGVuKGN1cnNvcikgJiYgdXRpbHMuYXJpYS5oYXNSb2xlKGN1cnNvciwgJ2hlYWRpbmcnKSkge1xuICAgICAgICBjb25zdCBwcmV2aW91c0xldmVsID0gZ2V0TGV2ZWwoY3Vyc29yKTtcbiAgICAgICAgaWYgKGxldmVsIDw9IHByZXZpb3VzTGV2ZWwgKyAxKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSB3aGlsZSAoY3Vyc29yICYmIGN1cnNvciAhPT0gZG9jdW1lbnQuYm9keSk7XG4gICAgcmV0dXJuICdoZWFkaW5ncyBtdXN0IGJlIG5lc3RlZCBjb3JyZWN0bHknO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuY29uc3QgeyByU3BhY2UgfSA9IHJlcXVpcmUoJy4uLy4uLy4uL3N1cHBvcnQvY29uc3RhbnRzJyk7XG5cbmNvbnN0IHNlbGVjdG9yID0gWydidXR0b24nLCAnZmllbGRzZXQnLCAnaW5wdXQnLCAnb2JqZWN0JywgJ291dHB1dCcsICdzZWxlY3QnLCAndGV4dGFyZWEnXS5tYXAobmFtZSA9PiBgJHtuYW1lfVtmb3JtXWApLmpvaW4oJywnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gc2VsZWN0b3I7XG4gIH1cblxuICB0ZXN0KGVsKSB7XG4gICAgY29uc3QgZm9ybUlkID0gZWwuZ2V0QXR0cmlidXRlKCdmb3JtJyk7XG4gICAgaWYgKCFmb3JtSWQpIHtcbiAgICAgIHJldHVybiAnZm9ybSBhdHRyaWJ1dGUgc2hvdWxkIGJlIGFuIGlkJztcbiAgICB9XG5cbiAgICBpZiAoclNwYWNlLnRlc3QoZm9ybUlkKSkge1xuICAgICAgcmV0dXJuICdmb3JtIGF0dHJpYnV0ZSBzaG91bGQgbm90IGNvbnRhaW4gc3BhY2VzJztcbiAgICB9XG5cbiAgICBjb25zdCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZm9ybUlkKTtcbiAgICBpZiAoIWZvcm0pIHtcbiAgICAgIHJldHVybiBgY2Fubm90IGZpbmQgZWxlbWVudCBmb3IgZm9ybSBhdHRyaWJ1dGUgd2l0aCBpZCBcIiR7Zm9ybUlkfVwiYDtcbiAgICB9XG5cbiAgICBpZiAoZm9ybS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpICE9PSAnZm9ybScpIHtcbiAgICAgIHJldHVybiAnZm9ybSBhdHRyaWJ1dGUgZG9lcyBub3QgcG9pbnQgdG8gYSBmb3JtJztcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcbmNvbnN0IHsgclNwYWNlIH0gPSByZXF1aXJlKCcuLi8uLi8uLi9zdXBwb3J0L2NvbnN0YW50cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnbWFwJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKCFlbC5uYW1lKSB7XG4gICAgICByZXR1cm4gJ25hbWUgYXR0cmlidXRlIGlzIHJlcXVpcmVkJztcbiAgICB9XG5cbiAgICBpZiAoclNwYWNlLnRlc3QoZWwubmFtZSkpIHtcbiAgICAgIHJldHVybiAnbmFtZSBhdHRyaWJ1dGUgbXVzdCBub3QgY29udGFpbiBzcGFjZXMnO1xuICAgIH1cblxuICAgIGNvbnN0IG5hbWUgPSBlbC5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgbWFwTmFtZXMgPSB1dGlscy4kJCgnbWFwW25hbWVdJykubWFwKG1hcCA9PiBtYXAubmFtZS50b0xvd2VyQ2FzZSgpKTtcbiAgICBpZiAobWFwTmFtZXMuZmlsdGVyKGl0ZW0gPT4gaXRlbSA9PT0gbmFtZSkubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuICduYW1lIGF0dHJpYnV0ZSBtdXN0IGJlIGNhc2UtaW5zZW5zaXRpdmVseSB1bmlxdWUnO1xuICAgIH1cblxuICAgIGNvbnN0IGltZ1VzZU1hcHMgPSB1dGlscy4kJCgnaW1nW3VzZW1hcF0nKS5tYXAoaW1nID0+IGltZy51c2VNYXAudG9Mb3dlckNhc2UoKSk7XG4gICAgaWYgKCFpbWdVc2VNYXBzLmluY2x1ZGVzKGAjJHtuYW1lfWApKSB7XG4gICAgICByZXR1cm4gJ25hbWUgYXR0cmlidXRlIHNob3VsZCBiZSByZWZlcmVuY2VkIGJ5IGFuIGltZyB1c2VtYXAgYXR0cmlidXRlJztcbiAgICB9XG5cbiAgICBpZiAoZWwuaWQgJiYgZWwuaWQgIT09IGVsLm5hbWUpIHtcbiAgICAgIHJldHVybiAnaWYgdGhlIGlkIGF0dHJpYnV0ZSBpcyBwcmVzZW50IGl0IG11c3QgZXF1YWwgdGhlIG5hbWUgYXR0cmlidXRlJztcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcbmNvbnN0IHsgclNwYWNlIH0gPSByZXF1aXJlKCcuLi8uLi8uLi9zdXBwb3J0L2NvbnN0YW50cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnbGFiZWxbZm9yXSc7XG4gIH1cblxuICB0ZXN0KGVsKSB7XG4gICAgaWYgKCFlbC5odG1sRm9yKSB7XG4gICAgICByZXR1cm4gJ2ZvciBhdHRyaWJ1dGUgc2hvdWxkIG5vdCBiZSBlbXB0eSc7XG4gICAgfVxuXG4gICAgaWYgKHJTcGFjZS50ZXN0KGVsLmh0bWxGb3IpKSB7XG4gICAgICByZXR1cm4gJ2ZvciBhdHRyaWJ1dGUgc2hvdWxkIG5vdCBjb250YWluIHNwYWNlcyc7XG4gICAgfVxuXG4gICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsLmh0bWxGb3IpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gJ25vIGVsZW1lbnQgY2FuIGJlIGZvdW5kIHdpdGggaWQgb2YgaWQgYXR0cmlidXRlJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcbmNvbnN0IHsgclNwYWNlIH0gPSByZXF1aXJlKCcuLi8uLi8uLi9zdXBwb3J0L2NvbnN0YW50cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnaW5wdXRbbGlzdF0nO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBjb25zdCBsaXN0SWQgPSBlbC5nZXRBdHRyaWJ1dGUoJ2xpc3QnKTtcblxuICAgIGlmICghbGlzdElkKSB7XG4gICAgICByZXR1cm4gJ2xpc3QgYXR0cmlidXRlIHNob3VsZCBub3QgYmUgZW1wdHknO1xuICAgIH1cblxuICAgIGlmIChyU3BhY2UudGVzdChsaXN0SWQpKSB7XG4gICAgICByZXR1cm4gJ2xpc3QgYXR0cmlidXRlIHNob3VsZCBub3QgY29udGFpbiBzcGFjZXMnO1xuICAgIH1cblxuICAgIGlmIChsaXN0SWQgJiYgdXRpbHMuJChgZGF0YWxpc3RbaWQ9XCIke3V0aWxzLmNzc0VzY2FwZShsaXN0SWQpfVwiXWApKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuICdubyBkYXRhbGlzdCBmb3VuZCc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdhW25hbWVdJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKCFlbC5uYW1lKSB7XG4gICAgICByZXR1cm4gJ25hbWUgc2hvdWxkIG5vdCBiZSBlbXB0eSc7XG4gICAgfVxuICAgIGlmIChlbC5pZCAmJiBlbC5pZCAhPT0gZWwubmFtZSkge1xuICAgICAgcmV0dXJuICdpZiB0aGUgaWQgYXR0cmlidXRlIGlzIHByZXNlbnQgaXQgbXVzdCBlcXVhbCB0aGUgbmFtZSBhdHRyaWJ1dGUnO1xuICAgIH1cbiAgICBjb25zdCBpZCA9IHV0aWxzLmNzc0VzY2FwZShlbC5uYW1lKTtcbiAgICBpZiAoaWQgJiYgdXRpbHMuJCQoYGFbbmFtZT1cIiR7aWR9XCJdLFtpZD1cIiR7aWR9XCJdYCkubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuICduYW1lIGlzIG5vdCB1bmlxdWUnO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcbmNvbnN0IHsgclNwYWNlIH0gPSByZXF1aXJlKCcuLi8uLi8uLi9zdXBwb3J0L2NvbnN0YW50cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnW2lkXSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICghZWwuaWQpIHtcbiAgICAgIHJldHVybiAnaWQgc2hvdWxkIG5vdCBiZSBlbXB0eSc7XG4gICAgfVxuICAgIGlmIChyU3BhY2UudGVzdChlbC5pZCkpIHtcbiAgICAgIHJldHVybiAnaWQgc2hvdWxkIG5vdCBjb250YWluIHNwYWNlIGNoYXJhY3RlcnMnO1xuICAgIH1cbiAgICBpZiAoIWVsLmlkIHx8IHV0aWxzLiQkKGBbaWQ9XCIke3V0aWxzLmNzc0VzY2FwZShlbC5pZCl9XCJdYCkubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuICdpZCBpcyBub3QgdW5pcXVlJztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdhcmVhW2hyZWZdJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgY29uc3QgbWFwID0gZWwuY2xvc2VzdCgnbWFwJyk7XG4gICAgaWYgKCFtYXAgfHwgIW1hcC5uYW1lKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgaW1nID0gdXRpbHMuJChgaW1nW3VzZW1hcD1cIiMke3V0aWxzLmNzc0VzY2FwZShtYXAubmFtZSl9XCJdYCk7XG4gICAgaWYgKCFpbWcgfHwgdXRpbHMuaGlkZGVuKGltZykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoZWwuYWx0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuICdhcmVhIHdpdGggYSBocmVmIG11c3QgaGF2ZSBhIGxhYmVsJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3Rvcih1dGlscykge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RvciB8fCAodGhpcy5fc2VsZWN0b3IgPSB1dGlscy5hcmlhLnJvbGVzT2ZUeXBlKCdjb21tYW5kJykubWFwKHJvbGUgPT4gYFtyb2xlfj1cIiR7cm9sZX1cIl1gKS5qb2luKCcsJykpO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAoIXV0aWxzLmFyaWEuaGFzUm9sZShlbCwgdXRpbHMuYXJpYS5yb2xlc09mVHlwZSgnY29tbWFuZCcpKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh1dGlscy5oaWRkZW4oZWwsIHsgYXJpYUhpZGRlbjogdHJ1ZSB9KSB8fCB1dGlscy5hY2Nlc3NpYmxlTmFtZShlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gJ2VsZW1lbnRzIHdpdGggYSByb2xlIHdpdGggYSBzdXBlcmNsYXNzIG9mIGNvbW1hbmQgbXVzdCBoYXZlIGEgbGFiZWwnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnYnV0dG9uLGlucHV0Om5vdChbdHlwZT1cImhpZGRlblwiXSksbWV0ZXIsb3V0cHV0LHByb2dyZXNzLHNlbGVjdCx0ZXh0YXJlYSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICh1dGlscy5oaWRkZW4oZWwsIHsgYXJpYUhpZGRlbjogdHJ1ZSB9KSB8fCB1dGlscy5hY2Nlc3NpYmxlTmFtZShlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gJ2Zvcm0gY29udHJvbHMgbXVzdCBoYXZlIGEgbGFiZWwnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnZmllbGRzZXQsZGV0YWlscyxbcm9sZX49Z3JvdXBdLFtyb2xlfj1yYWRpb2dyb3VwXSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICh1dGlscy5oaWRkZW4oZWwpXG4gICAgICB8fCAoZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKSAhPT0gJ2ZpZWxkc2V0JyAmJiAhdXRpbHMuYXJpYS5oYXNSb2xlKGVsLCBbJ2dyb3VwJywgJ3JhZGlvZ3JvdXAnXSkpXG4gICAgICB8fCB1dGlscy5hY2Nlc3NpYmxlTmFtZShlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBuYW1lID0gZWwubWF0Y2hlcygnZmllbGRzZXQsZGV0YWlscycpID8gZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA6IHV0aWxzLmFyaWEuZ2V0Um9sZShlbCk7XG4gICAgcmV0dXJuIGAke25hbWV9IG11c3QgaGF2ZSBhIGxhYmVsYDtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2gxLGgyLGgzLGg0LGg1LGg2LFtyb2xlfj1cImhlYWRpbmdcIl0nO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAoIXV0aWxzLmFyaWEuaGFzUm9sZShlbCwgJ2hlYWRpbmcnKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh1dGlscy5oaWRkZW4oZWwsIHsgYXJpYUhpZGRlbjogdHJ1ZSB9KSB8fCB1dGlscy5hY2Nlc3NpYmxlTmFtZShlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gJ2hlYWRpbmdzIG11c3QgaGF2ZSBhIGxhYmVsJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZXREZWZhdWx0cygpIHtcbiAgICB0aGlzLmluY2x1ZGVIaWRkZW4gPSB0cnVlO1xuICB9XG5cbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdpbWc6bm90KFthbHRdKSc7XG4gIH1cblxuICB0ZXN0KCkge1xuICAgIHJldHVybiAnbWlzc2luZyBhbHQgYXR0cmlidXRlJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2FbaHJlZl0nO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAodXRpbHMuaGlkZGVuKGVsLCB7IGFyaWFIaWRkZW46IHRydWUgfSkgfHwgdXRpbHMuYWNjZXNzaWJsZU5hbWUoZWwpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuICdsaW5rcyB3aXRoIGEgaHJlZiBtdXN0IGhhdmUgYSBsYWJlbCc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi8uLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdbdGFiaW5kZXhdJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKHV0aWxzLmhpZGRlbihlbCwgeyBhcmlhSGlkZGVuOiB0cnVlIH0pIHx8IHV0aWxzLmFjY2Vzc2libGVOYW1lKGVsKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAnZm9jdXNhYmxlIGVsZW1lbnRzIG11c3QgaGF2ZSBhIGxhYmVsJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uL3J1bGUnKTtcblxuLy8gTGFuZ3VhZ2UgdGFncyBhcmUgZGVmaW5lZCBpbiBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9iY3AvYmNwNDcudHh0XG5jb25zdCBtYXRjaCA9IC9eKChlbi1nYi1vZWQpfChbYS16XXsyLDN9KC1bYS16XXszfSk/KC1bYS16XXs0fSk/KC1bYS16XXsyfXwtXFxkezN9KT8oLVthLXowLTldezUsOH18LShcXGRbYS16MC05XXszfSkpKikpJC9pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnaHRtbCc7XG4gIH1cblxuICB0ZXN0KGVsKSB7XG4gICAgaWYgKCFlbC5sYW5nKSB7XG4gICAgICByZXR1cm4gJ21pc3NpbmcgbGFuZyBhdHRyaWJ1dGUnO1xuICAgIH1cbiAgICBpZiAoIW1hdGNoLnRlc3QoZWwubGFuZykpIHtcbiAgICAgIHJldHVybiAnbGFuZ3VhZ2UgY29kZSBpcyBpbnZhbGlkJztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi9ydWxlJyk7XG5cbmNvbnN0IGV4Y2x1ZGVUeXBlcyA9IFsnaGlkZGVuJywgJ2ltYWdlJywgJ3N1Ym1pdCcsICdyZXNldCcsICdidXR0b24nXTtcbmNvbnN0IGV4Y2x1ZGVTZWxlY3RvciA9IGV4Y2x1ZGVUeXBlcy5tYXAodHlwZSA9PiBgOm5vdChbdHlwZT0ke3R5cGV9XSlgKS5qb2luKCcnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0b3IgfHwgKHRoaXMuX3NlbGVjdG9yID0gYGlucHV0W25hbWVdJHtleGNsdWRlU2VsZWN0b3J9LHRleHRhcmVhW25hbWVdLHNlbGVjdFtuYW1lXSxvYmplY3RbbmFtZV1gKTtcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKHV0aWxzLmhpZGRlbihlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBsZXQgZ3JvdXA7XG5cbiAgICBpZiAoZWwuZm9ybSkge1xuICAgICAgY29uc3QgZWxlbWVudHMgPSBlbC5mb3JtLmVsZW1lbnRzW2VsLm5hbWVdO1xuICAgICAgaWYgKGVsZW1lbnRzIGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGdyb3VwID0gQXJyYXkuZnJvbShlbGVtZW50cylcbiAgICAgICAgLmZpbHRlcihlbG0gPT4gIWV4Y2x1ZGVUeXBlcy5pbmNsdWRlcyhlbG0udHlwZSkpXG4gICAgICAgIC5maWx0ZXIoZWxtID0+ICF1dGlscy5oaWRkZW4oZWxtKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG5hbWVQYXJ0ID0gYFtuYW1lPVwiJHt1dGlscy5jc3NFc2NhcGUoZWwubmFtZSl9XCJdYDtcbiAgICAgIGdyb3VwID0gdXRpbHMuJCQoYGlucHV0JHtuYW1lUGFydH0ke2V4Y2x1ZGVTZWxlY3Rvcn0sdGV4dGFyZWEke25hbWVQYXJ0fSxzZWxlY3Qke25hbWVQYXJ0fSxvYmplY3Qke25hbWVQYXJ0fWApXG4gICAgICAgIC5maWx0ZXIoZWxtID0+ICFlbG0uZm9ybSlcbiAgICAgICAgLmZpbHRlcihlbG0gPT4gIXV0aWxzLmhpZGRlbihlbG0pKTtcbiAgICB9XG5cbiAgICBpZiAoZ3JvdXAubGVuZ3RoID09PSAxIHx8IGVsLmNsb3Nlc3QoJ2ZpZWxkc2V0JykgfHwgdXRpbHMuYXJpYS5jbG9zZXN0Um9sZShlbCwgWydncm91cCcsICdyYWRpb2dyb3VwJ10pKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gJ211bHRpcGxlIGlucHV0cyB3aXRoIHRoZSBzYW1lIG5hbWUgc2hvdWxkIGJlIGluIGEgZmllbGRzZXQsIGdyb3VwIG9yIHJhZGlvZ3JvdXAnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnYnV0dG9uOm5vdChbdHlwZV0pJztcbiAgfVxuXG4gIHRlc3QoKSB7XG4gICAgcmV0dXJuICdhbGwgYnV0dG9ucyBzaG91bGQgaGF2ZSBhIHR5cGUgYXR0cmlidXRlJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uL3J1bGUnKTtcblxuZnVuY3Rpb24gaXNCcihlbCkge1xuICByZXR1cm4gZWwgaW5zdGFuY2VvZiBFbGVtZW50ICYmIGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdicic7XG59XG5cbmZ1bmN0aW9uIHByZXZpb3VzRWxlbWVudElzQnIoZWwsIHV0aWxzKSB7XG4gIHdoaWxlICgoZWwgPSBlbC5wcmV2aW91c1NpYmxpbmcpKSB7XG4gICAgaWYgKChlbCBpbnN0YW5jZW9mIEVsZW1lbnQgJiYgIXV0aWxzLmhpZGRlbihlbCkpIHx8IChlbCBpbnN0YW5jZW9mIFRleHQgJiYgZWwuZGF0YS50cmltKCkpKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGlzQnIoZWwpO1xufVxuXG5mdW5jdGlvbiBuZXh0RWxlbWVudElzQnIoZWwsIHV0aWxzKSB7XG4gIHdoaWxlICgoZWwgPSBlbC5uZXh0U2libGluZykpIHtcbiAgICBpZiAoKGVsIGluc3RhbmNlb2YgRWxlbWVudCAmJiAhdXRpbHMuaGlkZGVuKGVsKSkgfHwgKGVsIGluc3RhbmNlb2YgVGV4dCAmJiBlbC5kYXRhLnRyaW0oKSkpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaXNCcihlbCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdiciArIGJyJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKHV0aWxzLmhpZGRlbihlbCkgfHwgIXByZXZpb3VzRWxlbWVudElzQnIoZWwsIHV0aWxzKSB8fCBuZXh0RWxlbWVudElzQnIoZWwsIHV0aWxzKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuICdkbyBub3QgdXNlIDxicj5zIGZvciBzcGFjaW5nJztcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ3NlbGVjdDpub3QoOmRpc2FibGVkKSc7XG4gIH1cblxuICB0ZXN0KGVsLCB1dGlscykge1xuICAgIGlmICh1dGlscy5oaWRkZW4oZWwpIHx8IHV0aWxzLiQkKCdvcHRpb24nLCBlbCkubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuICdzZWxlY3RzIHNob3VsZCBoYXZlIG9wdGlvbnMnO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vcnVsZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnYVtyb2xlfj1idXR0b25dLGFbaHJlZj1cIiNcIl0sYVtocmVmPVwiIyFcIl0sYVtocmVmXj1cImphdmFzY3JpcHQ6XCJdJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKHV0aWxzLmhpZGRlbihlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gJ3VzZSBhIGJ1dHRvbiBpbnN0ZWFkIG9mIGEgbGluayc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi9ydWxlJyk7XG5cbmZ1bmN0aW9uIHJlbW92ZUhhc2gob2IpIHtcbiAgcmV0dXJuIG9iLmhyZWYucmVwbGFjZSgvIy4qJC8sICcnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2FbaHJlZio9XCIjXCJdJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKHV0aWxzLmhpZGRlbihlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAocmVtb3ZlSGFzaCh3aW5kb3cubG9jYXRpb24pICE9PSByZW1vdmVIYXNoKGVsKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGlkID0gdXRpbHMuY3NzRXNjYXBlKGRlY29kZVVSSShlbC5oYXNoLnNsaWNlKDEpKSk7XG4gICAgY29uc3QgZm91bmQgPSB1dGlscy4kKGBbaWQ9XCIke2lkfVwiXSxhW25hbWU9XCIke2lkfVwiXWApO1xuXG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgcmV0dXJuICdmcmFnbWVudCBub3QgZm91bmQgaW4gZG9jdW1lbnQnO1xuICAgIH1cblxuICAgIGlmICh1dGlscy5oaWRkZW4oZm91bmQpKSB7XG4gICAgICByZXR1cm4gJ2xpbmsgdGFyZ2V0IGlzIGhpZGRlbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdzZWxlY3RbbXVsdGlwbGVdOm5vdCg6ZGlzYWJsZWQpJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKHV0aWxzLmhpZGRlbihlbCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gJ2RvIG5vdCB1c2UgbXVsdGlwbGUgc2VsZWN0cyc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdpbnB1dCx0ZXh0YXJlYSxzZWxlY3QsYnV0dG9uOm5vdChbdHlwZV0pLGJ1dHRvblt0eXBlPVwic3VibWl0XCJdLGJ1dHRvblt0eXBlPVwicmVzZXRcIl0nO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAoZWwuZm9ybSB8fCB1dGlscy5oaWRkZW4oZWwpIHx8IGVsLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuICdhbGwgY29udHJvbHMgc2hvdWxkIGJlIGFzc29jaWF0ZWQgd2l0aCBhIGZvcm0nO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi4vcnVsZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnYTpub3QoW2hyZWZdKSxhcmVhOm5vdChbaHJlZl0pJztcbiAgfVxuXG4gIHRlc3QoZWwsIHV0aWxzKSB7XG4gICAgaWYgKGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdhJyAmJiB1dGlscy5oaWRkZW4oZWwpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gJ2xpbmtzIHNob3VsZCBoYXZlIGEgaHJlZiBhdHRyaWJ1dGUnO1xuICB9XG59O1xuXG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi9ydWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdpbnB1dFt0eXBlPXJlc2V0XSxidXR0b25bdHlwZT1yZXNldF0nO1xuICB9XG5cbiAgdGVzdCgpIHtcbiAgICByZXR1cm4gJ2RvIG5vdCB1c2UgcmVzZXQgYnV0dG9ucyc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IFJ1bGUgPSByZXF1aXJlKCcuLi9ydWxlJyk7XG5cbmNvbnN0IGxhYmVsYWJsZSA9ICdpbnB1dDpub3QoW3R5cGU9aGlkZGVuXSksc2VsZWN0LHRleHRhcmVhLGJ1dHRvbixtZXRlcixvdXRwdXQscHJvZ3Jlc3MnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIGV4dGVuZHMgUnVsZSB7XG4gIHNlbGVjdG9yKCkge1xuICAgIHJldHVybiAnbGFiZWwnO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAodXRpbHMuaGlkZGVuKGVsKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGVsLmh0bWxGb3IpIHtcbiAgICAgIGNvbnN0IGZvckVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWwuaHRtbEZvcik7XG4gICAgICBpZiAoIWZvckVsKSB7XG4gICAgICAgIHJldHVybiAnbGFiZWwgaXMgbm90IGxhYmVsbGluZyBhbiBlbGVtZW50JztcbiAgICAgIH1cbiAgICAgIGlmICh1dGlscy5oaWRkZW4oZm9yRWwpKSB7XG4gICAgICAgIHJldHVybiAnbGFiZWwgaXMgbGFiZWxsaW5nIGEgaGlkZGVuIGVsZW1lbnQnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0cyA9IHV0aWxzLiQkKGxhYmVsYWJsZSwgZWwpO1xuXG4gICAgaWYgKHRhcmdldHMubGVuZ3RoICYmICF0YXJnZXRzLmZpbHRlcihlbG0gPT4gIXV0aWxzLmhpZGRlbihlbG0pKS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiAnbGFiZWwgaXMgbGFiZWxsaW5nIGEgaGlkZGVuIGVsZW1lbnQnO1xuICAgIH1cblxuICAgIGlmICghdGFyZ2V0cy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiAnbGFiZWwgaXMgbm90IGxhYmVsbGluZyBhbiBlbGVtZW50JztcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBydW4oY29udGV4dCwgZmlsdGVyID0gKCkgPT4gdHJ1ZSwgdXRpbHMpIHtcbiAgICBjb25zdCBlcnJvcnMgPSBbXTtcblxuICAgIGlmICghY29udGV4dC5jb250YWlucyhkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgaWYgKGRvY3VtZW50LmNoYXJhY3RlclNldCAhPT0gJ1VURi04Jykge1xuICAgICAgZXJyb3JzLnB1c2goeyBlbDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCBtZXNzYWdlOiAnYWxsIEhUTUwgZG9jdW1lbnRzIHNob3VsZCBiZSBhdXRob3JlZCBpbiBVVEYtOCcgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgbWV0YSA9IHV0aWxzLiQkKCdtZXRhW2NoYXJzZXRdLG1ldGFbaHR0cC1lcXVpdj1cImNvbnRlbnQtdHlwZVwiIGldJyk7XG5cbiAgICBpZiAobWV0YS5sZW5ndGggPiAxKSB7XG4gICAgICBtZXRhLmZvckVhY2goZWwgPT4gZXJyb3JzLnB1c2goeyBlbCwgbWVzc2FnZTogJ21vcmUgdGhhbiBvbmUgbWV0YSBjaGFyc2V0IHRhZyBmb3VuZCcgfSkpO1xuICAgIH1cblxuICAgIGlmICghbWV0YS5sZW5ndGgpIHtcbiAgICAgIGVycm9ycy5wdXNoKHsgZWw6IGRvY3VtZW50LmhlYWQsIG1lc3NhZ2U6ICdtaXNzaW5nIGA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIj5gJyB9KTtcbiAgICB9XG5cbiAgICBtZXRhXG4gICAgICAuZmlsdGVyKGVsID0+IGVsLmh0dHBFcXVpdilcbiAgICAgIC5mb3JFYWNoKGVsID0+IGVycm9ycy5wdXNoKHsgZWwsIG1lc3NhZ2U6ICd1c2UgdGhlIGZvcm0gYDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPmAnIH0pKTtcblxuICAgIG1ldGFcbiAgICAgIC5maWx0ZXIoZWwgPT4gZG9jdW1lbnQuaGVhZC5maXJzdEVsZW1lbnRDaGlsZCAhPT0gZWwpXG4gICAgICAuZm9yRWFjaChlbCA9PiBlcnJvcnMucHVzaCh7IGVsLCBtZXNzYWdlOiAnbWV0YSBjaGFyc2V0IHNob3VsZCBiZSB0aGUgZmlyc3QgY2hpbGQgb2YgPGhlYWQ+JyB9KSk7XG5cbiAgICByZXR1cm4gZXJyb3JzLmZpbHRlcigoeyBlbCB9KSA9PiBmaWx0ZXIoZWwpKTtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uLy4uL3J1bGUnKTtcbmNvbnN0IGNvbnN0YW50cyA9IHJlcXVpcmUoJy4uLy4uLy4uL3N1cHBvcnQvY29uc3RhbnRzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgZXh0ZW5kcyBSdWxlIHtcbiAgc2VsZWN0b3IoKSB7XG4gICAgcmV0dXJuICdhW2hyZWZdW3RhcmdldF0sYXJlYVtocmVmXVt0YXJnZXRdLGZvcm1bdGFyZ2V0XSxiYXNlW3RhcmdldF0sZm9ybSBidXR0b25bdHlwZT1zdWJtaXRdW2Zvcm10YXJnZXRdLGZvcm0gaW5wdXRbdHlwZT1zdWJtaXRdW2Zvcm10YXJnZXRdLGZvcm0gaW5wdXRbdHlwZT1pbWFnZV1bZm9ybXRhcmdldF0nO1xuICB9XG5cbiAgdGVzdChlbCwgdXRpbHMpIHtcbiAgICBpZiAoZWwudGFyZ2V0ID09PSAnX3NlbGYnIHx8IGVsLmZvcm1UYXJnZXQgPT09ICdfc2VsZicpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBub2RlTmFtZSA9IGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKG5vZGVOYW1lICE9PSAnYmFzZScgJiYgbm9kZU5hbWUgIT09ICdhcmVhJyAmJiB1dGlscy5oaWRkZW4oZWwpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCByZWwgPSBlbC5yZWwgJiYgZWwucmVsLnNwbGl0KGNvbnN0YW50cy5yU3BhY2UpO1xuICAgIGlmIChyZWwgJiYgcmVsLmluY2x1ZGVzKCdub29wZW5lcicpICYmIHJlbC5pbmNsdWRlcygnbm9yZWZlcnJlcicpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBsZXQgdXJsID0gZWwuaHJlZjtcbiAgICBpZiAobm9kZU5hbWUgPT09ICdmb3JtJykge1xuICAgICAgdXJsID0gZWwuYWN0aW9uO1xuICAgIH0gZWxzZSBpZiAobm9kZU5hbWUgPT09ICdidXR0b24nIHx8IG5vZGVOYW1lID09PSAnaW5wdXQnKSB7XG4gICAgICAvLyBDaHJvbWUgcmV0dXJucyB0aGUgcGFnZSB1cmwgZm9yIGVsLmZvcm1hY3Rpb25cbiAgICAgIHVybCA9IGVsLmdldEF0dHJpYnV0ZSgnZm9ybWFjdGlvbicpIHx8IGVsLmZvcm0uYWN0aW9uO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB1cmwgPSBuZXcgVVJMKHVybCwgbG9jYXRpb24uaHJlZik7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgdXJsID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodXJsICYmIHVybC5ob3N0ID09PSBsb2NhdGlvbi5ob3N0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBsZXQgbWVzc2FnZSA9ICd0YXJnZXQgYXR0cmlidXRlIGhhcyBvcGVuZXIgdnVsbmVyYWJpbGl0eSc7XG4gICAgaWYgKG5vZGVOYW1lID09PSAnYScgfHwgbm9kZU5hbWUgPT09ICdhcmVhJykge1xuICAgICAgbWVzc2FnZSArPSAnLiBBZGQgYHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcImAnO1xuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVsZSA9IHJlcXVpcmUoJy4uL3J1bGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBleHRlbmRzIFJ1bGUge1xuICBzZWxlY3RvcigpIHtcbiAgICByZXR1cm4gJ2h0bWwnO1xuICB9XG5cbiAgdGVzdCgpIHtcbiAgICBpZiAoZG9jdW1lbnQudGl0bGUudHJpbSgpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuICdkb2N1bWVudCBtdXN0IGhhdmUgYSB0aXRsZSc7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gW1wiYXJpYS9hbGxvd2VkLWF0dHJpYnV0ZXNcIixcImFyaWEvYXR0cmlidXRlLXZhbHVlc1wiLFwiYXJpYS9kZXByZWNhdGVkLWF0dHJpYnV0ZXNcIixcImFyaWEvaW1tdXRhYmxlLXJvbGVcIixcImFyaWEvbGFuZG1hcmsvb25lLWJhbm5lclwiLFwiYXJpYS9sYW5kbWFyay9vbmUtY29udGVudGluZm9cIixcImFyaWEvbGFuZG1hcmsvb25lLW1haW5cIixcImFyaWEvbGFuZG1hcmsvcHJlZmVyLW1haW5cIixcImFyaWEvbGFuZG1hcmsvcmVxdWlyZWRcIixcImFyaWEvbm8tZm9jdXNhYmxlLWhpZGRlblwiLFwiYXJpYS9uby1mb2N1c2FibGUtcm9sZS1ub25lXCIsXCJhcmlhL25vLW5vbmUtd2l0aG91dC1wcmVzZW50YXRpb25cIixcImFyaWEvb25lLXJvbGVcIixcImFyaWEvcm9sZXNcIixcImFyaWEvdW5zdXBwb3J0ZWQtZWxlbWVudHNcIixcImF0dHJpYnV0ZXMvZGF0YVwiLFwiYXR0cmlidXRlcy9uby1qYXZhc2NyaXB0LWhhbmRsZXJzXCIsXCJhdHRyaWJ1dGVzL25vLXBvc2l0aXZlLXRhYi1pbmRleFwiLFwiY29sb3VyLWNvbnRyYXN0L2FhXCIsXCJjb2xvdXItY29udHJhc3QvYWFhXCIsXCJkZXRhaWxzLWFuZC1zdW1tYXJ5XCIsXCJlbGVtZW50cy9vYnNvbGV0ZVwiLFwiZWxlbWVudHMvdW5rbm93blwiLFwiZmllbGRzZXQtYW5kLWxlZ2VuZFwiLFwiaGVhZGluZ3NcIixcImlkcy9mb3JtLWF0dHJpYnV0ZVwiLFwiaWRzL2ltYWdlbWFwLWlkc1wiLFwiaWRzL2xhYmVscy1oYXZlLWlucHV0c1wiLFwiaWRzL2xpc3QtaWRcIixcImlkcy9uby1kdXBsaWNhdGUtYW5jaG9yLW5hbWVzXCIsXCJpZHMvdW5pcXVlLWlkXCIsXCJsYWJlbHMvYXJlYVwiLFwibGFiZWxzL2FyaWEtY29tbWFuZFwiLFwibGFiZWxzL2NvbnRyb2xzXCIsXCJsYWJlbHMvZ3JvdXBcIixcImxhYmVscy9oZWFkaW5nc1wiLFwibGFiZWxzL2ltZ1wiLFwibGFiZWxzL2xpbmtzXCIsXCJsYWJlbHMvdGFiaW5kZXhcIixcImxhbmdcIixcIm11bHRpcGxlLWluLWdyb3VwXCIsXCJuby1idXR0b24td2l0aG91dC10eXBlXCIsXCJuby1jb25zZWN1dGl2ZS1icnNcIixcIm5vLWVtcHR5LXNlbGVjdFwiLFwibm8tbGlua3MtYXMtYnV0dG9uc1wiLFwibm8tbGlua3MtdG8tbWlzc2luZy1mcmFnbWVudHNcIixcIm5vLW11bHRpcGxlLXNlbGVjdFwiLFwibm8tb3V0c2lkZS1jb250cm9sc1wiLFwibm8tcGxhY2Vob2xkZXItbGlua3NcIixcIm5vLXJlc2V0XCIsXCJuby11bmFzc29jaWF0ZWQtbGFiZWxzXCIsXCJzZWN1cml0eS9jaGFyc2V0XCIsXCJzZWN1cml0eS90YXJnZXRcIixcInRpdGxlXCJdOyIsIlwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBcIjEuMTQuMFwiIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKipcbiAqIEFyaWEgcnVsZXMgZm9yIGEgSFRNTCBlbGVtZW50XG4gKlxuICogaHR0cHM6Ly93M2MuZ2l0aHViLmlvL2h0bWwtYXJpYS9cbiAqL1xuY29uc3QgeyAkJCB9ID0gcmVxdWlyZSgnLi4vdXRpbHMvc2VsZWN0b3JzLmpzJyk7XG5cbi8qKlxuICogRGVzY3JpYmVzIHdoYXQgcm9sZXMgYW5kIGFyaWEgYXR0cmlidXRlcyBhbGwgYWxsb3dlZCBvbiBhbiBlbGVtZW50XG4gKlxuICogQHR5cGVkZWYge09iamVjdH0gYWxsb3dlZEFyaWFcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBzZWxlY3RvclxuICogQHByb3BlcnR5IHtTdHJpbmdbXX0gaW1wbGljaXRSb2xlc1xuICogQHByb3BlcnR5IHtTdHJpbmdbXX0gcm9sZXNcbiAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gYW55Um9sZVxuICovXG5cbi8qKlxuICogR2VuZXJhdGUgYSBydWxlXG4gKiBAcmV0dXJucyB7YWxsb3dlZEFyaWF9XG4gKi9cbmZ1bmN0aW9uIHJ1bGUoeyBzZWxlY3RvciA9ICcqJywgaW1wbGljaXQgPSBbXSwgcm9sZXMgPSBbXSwgYW55Um9sZSA9IGZhbHNlLCBhcmlhRm9ySW1wbGljaXQgPSBmYWxzZSwgbm9BcmlhID0gZmFsc2UgfSkge1xuICByZXR1cm4ge1xuICAgIHNlbGVjdG9yLFxuICAgIGltcGxpY2l0OiBbXS5jb25jYXQoaW1wbGljaXQpLFxuICAgIHJvbGVzOiBhbnlSb2xlID8gJyonIDogcm9sZXMsXG4gICAgbm9BcmlhLFxuICAgIGFyaWFGb3JJbXBsaWNpdCxcbiAgfTtcbn1cblxuLy8gQ29tbW9uIHJ1bGVzXG4vLyBUT0RPOiBpbmNsdWRlIGFyaWEgYXR0cmlidXRlIHJ1bGVzXG5jb25zdCBub1JvbGVPckFyaWEgPSBydWxlKHsgbm9BcmlhOiB0cnVlIH0pO1xuY29uc3Qgbm9Sb2xlID0gcnVsZSh7fSk7XG5jb25zdCBhbnlSb2xlID0gcnVsZSh7IGFueVJvbGU6IHRydWUgfSk7XG5cbi8qKiBAZW51bSB7KGFsbG93ZWRBcmlhfGFsbG93ZWRBcmlhW10pfSAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIF9kZWZhdWx0OiBhbnlSb2xlLFxuICBhOiBbXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1tocmVmXScsXG4gICAgICBpbXBsaWNpdDogJ2xpbmsnLFxuICAgICAgcm9sZXM6IFtcbiAgICAgICAgJ2J1dHRvbicsICdjaGVja2JveCcsICdtZW51aXRlbScsICdtZW51aXRlbWNoZWNrYm94JyxcbiAgICAgICAgJ21lbnVpdGVtcmFkaW8nLCAnb3B0aW9uJywgJ3JhZGlvJywgJ3RhYicsICdzd2l0Y2gnLCAndHJlZWl0ZW0nLFxuICAgICAgXSxcbiAgICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnOm5vdChbaHJlZl0pJyxcbiAgICAgIGFueVJvbGU6IHRydWUsXG4gICAgfSksXG4gIF0sXG4gIGFkZHJlc3M6IGFueVJvbGUsXG4gIGFyZWE6IFtcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW2hyZWZdJyxcbiAgICAgIGltcGxpY2l0OiAnbGluaycsXG4gICAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gICAgfSksXG4gIF0sXG4gIGFydGljbGU6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnYXJ0aWNsZScsXG4gICAgcm9sZXM6IFsnZmVlZCcsICdwcmVzZW50YXRpb24nLCAnZG9jdW1lbnQnLCAnYXBwbGljYXRpb24nLCAnbWFpbicsICdyZWdpb24nXSxcbiAgfSksXG4gIGFzaWRlOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2NvbXBsZW1lbnRhcnknLFxuICAgIHJvbGVzOiBbJ2ZlZWQnLCAnbm90ZScsICdyZWdpb24nLCAnc2VhcmNoJ10sXG4gIH0pLFxuICBhdWRpbzogcnVsZSh7XG4gICAgcm9sZXM6IFsnYXBwbGljYXRpb24nXSxcbiAgfSksXG4gIGJhc2U6IG5vUm9sZU9yQXJpYSxcbiAgYm9keTogcnVsZSh7XG4gICAgaW1wbGljaXQ6IFsnZG9jdW1lbnQnXSxcbiAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gIH0pLFxuICBidXR0b246IFtcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW3R5cGU9bWVudV0nLFxuICAgICAgaW1wbGljaXQ6ICdidXR0b24nLFxuICAgICAgcm9sZXM6IFsnbGluaycsICdtZW51aXRlbScsICdtZW51aXRlbWNoZWNrYm94JywgJ21lbnVpdGVtcmFkaW8nLCAncmFkaW8nXSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIGltcGxpY2l0OiAnYnV0dG9uJyxcbiAgICAgIHJvbGVzOiBbXG4gICAgICAgICdjaGVja2JveCcsICdsaW5rJywgJ21lbnVpdGVtJywgJ21lbnVpdGVtY2hlY2tib3gnLFxuICAgICAgICAnbWVudWl0ZW1yYWRpbycsICdyYWRpbycsICdzd2l0Y2gnLCAndGFiJyxcbiAgICAgIF0sXG4gICAgfSksXG4gIF0sXG4gIGNhbnZhczogYW55Um9sZSxcbiAgY2FwdGlvbjogbm9Sb2xlLFxuICBjb2w6IG5vUm9sZU9yQXJpYSxcbiAgY29sZ3JvdXA6IG5vUm9sZU9yQXJpYSxcbiAgZGF0YTogYW55Um9sZSxcbiAgZGF0YWxpc3Q6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnbGlzdGJveCcsXG4gICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICB9KSxcbiAgZGQ6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnZGVmaW5pdGlvbicsXG4gICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICB9KSxcbiAgZGV0YWlsczogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdncm91cCcsXG4gICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICB9KSxcbiAgZGlhbG9nOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2RpYWxvZycsXG4gICAgcm9sZXM6IFsnYWxlcnRkaWFsb2cnXSxcbiAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gIH0pLFxuICBkaXY6IGFueVJvbGUsXG4gIGRsOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2xpc3QnLFxuICAgIHJvbGVzOiBbJ2dyb3VwJywgJ3ByZXNlbnRhdGlvbiddLFxuICB9KSxcbiAgZHQ6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnbGlzdGl0ZW0nLFxuICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgfSksXG4gIGVtYmVkOiBydWxlKHtcbiAgICByb2xlczogWydhcHBsaWNhdGlvbicsICdkb2N1bWVudCcsICdwcmVzZW50YXRpb24nLCAnaW1nJ10sXG4gIH0pLFxuICBmaWVsZHNldDogcnVsZSh7XG4gICAgcm9sZXM6IFsnZ3JvdXAnLCAncHJlc2VudGF0aW9uJ10sXG4gIH0pLFxuICBmaWdjYXB0aW9uOiBydWxlKHtcbiAgICByb2xlczogWydncm91cCcsICdwcmVzZW50YXRpb24nXSxcbiAgfSksXG4gIGZpZ3VyZTogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdmaWd1cmUnLFxuICAgIHJvbGVzOiBbJ2dyb3VwJywgJ3ByZXNlbnRhdGlvbiddLFxuICB9KSxcbiAgZm9vdGVyOiBbXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcihlbCwgYXJpYSkge1xuICAgICAgICBjb25zdCBzZWxlY3RvciA9IFsnYXJ0aWNsZScsICdhc2lkZScsICdtYWluJywgJ25hdicsICdzZWN0aW9uJ10ubWFwKG5hbWUgPT4gYDpzY29wZSAke25hbWV9IGZvb3RlcmApLmpvaW4oJywnKTtcbiAgICAgICAgcmV0dXJuICQkKHNlbGVjdG9yLCBhcmlhLmNsb3Nlc3RSb2xlKGVsLCBbJ2FwcGxpY2F0aW9uJywgJ2RvY3VtZW50J10sIHsgZXhhY3Q6IHRydWUgfSkpXG4gICAgICAgICAgLmluY2x1ZGVzKGVsKTtcbiAgICAgIH0sXG4gICAgICByb2xlczogWydncm91cCcsICdwcmVzZW50YXRpb24nXSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIGltcGxpY2l0OiAnY29udGVudGluZm8nLFxuICAgICAgcm9sZXM6IFsnZ3JvdXAnLCAncHJlc2VudGF0aW9uJ10sXG4gICAgfSksXG4gIF0sXG4gIGZvcm06IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnZm9ybScsXG4gICAgcm9sZXM6IFsnc2VhcmNoJywgJ3ByZXNlbnRhdGlvbiddLFxuICB9KSxcbiAgcDogYW55Um9sZSxcbiAgcHJlOiBhbnlSb2xlLFxuICBibG9ja3F1b3RlOiBhbnlSb2xlLFxuICBoMTogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdoZWFkaW5nJyxcbiAgICByb2xlczogWyd0YWInLCAncHJlc2VudGF0aW9uJ10sXG4gIH0pLFxuICBoMjogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdoZWFkaW5nJyxcbiAgICByb2xlczogWyd0YWInLCAncHJlc2VudGF0aW9uJ10sXG4gIH0pLFxuICBoMzogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdoZWFkaW5nJyxcbiAgICByb2xlczogWyd0YWInLCAncHJlc2VudGF0aW9uJ10sXG4gIH0pLFxuICBoNDogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdoZWFkaW5nJyxcbiAgICByb2xlczogWyd0YWInLCAncHJlc2VudGF0aW9uJ10sXG4gIH0pLFxuICBoNTogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdoZWFkaW5nJyxcbiAgICByb2xlczogWyd0YWInLCAncHJlc2VudGF0aW9uJ10sXG4gIH0pLFxuICBoNjogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdoZWFkaW5nJyxcbiAgICByb2xlczogWyd0YWInLCAncHJlc2VudGF0aW9uJ10sXG4gIH0pLFxuICBoZWFkOiBub1JvbGVPckFyaWEsXG4gIGhlYWRlcjogW1xuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3IoZWwsIGFyaWEpIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSBbJ2FydGljbGUnLCAnYXNpZGUnLCAnbWFpbicsICduYXYnLCAnc2VjdGlvbiddLm1hcChuYW1lID0+IGA6c2NvcGUgJHtuYW1lfSBoZWFkZXJgKS5qb2luKCcsJyk7XG4gICAgICAgIHJldHVybiAkJChzZWxlY3RvciwgYXJpYS5jbG9zZXN0Um9sZShlbCwgWydhcHBsaWNhdGlvbicsICdkb2N1bWVudCddLCB7IGV4YWN0OiB0cnVlIH0pKVxuICAgICAgICAgIC5pbmNsdWRlcyhlbCk7XG4gICAgICB9LFxuICAgICAgcm9sZXM6IFsnZ3JvdXAnLCAncHJlc2VudGF0aW9uJ10sXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBpbXBsaWNpdDogJ2Jhbm5lcicsXG4gICAgICByb2xlczogWydncm91cCcsICdwcmVzZW50YXRpb24nXSxcbiAgICB9KSxcbiAgXSxcbiAgaHI6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnc2VwYXJhdG9yJyxcbiAgICByb2xlczogWydwcmVzZW50YXRpb24nXSxcbiAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gIH0pLFxuICBodG1sOiBub1JvbGVPckFyaWEsXG4gIGlmcmFtZTogcnVsZSh7XG4gICAgcm9sZXM6IFsnYXBwbGljYXRpb24nLCAnZG9jdW1lbnQnLCAnaW1nJ10sXG4gIH0pLFxuICBpbWc6IFtcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW2FsdD1cIlwiXScsXG4gICAgICByb2xlczogWydwcmVzZW50YXRpb24nLCAnbm9uZSddLFxuICAgICAgYXJpYTogZmFsc2UsXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBpbXBsaWNpdDogJ2ltZycsXG4gICAgICBhbnlSb2xlOiB0cnVlLFxuICAgIH0pLFxuICBdLFxuICBpbnB1dDogW1xuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3I6ICdbbGlzdF06bm90KFt0eXBlXSksW2xpc3RdW3R5cGU9dGV4dF0sW2xpc3RdW3R5cGU9c2VhcmNoXSxbbGlzdF1bdHlwZT10ZWxdLFtsaXN0XVt0eXBlPXVybF0sW2xpc3RdW3R5cGU9ZW1haWxdJyxcbiAgICAgIGltcGxpY2l0OiAnY29tYm9ib3gnLFxuICAgICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICAgIH0pLFxuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3I6ICdbdHlwZT1idXR0b25dJyxcbiAgICAgIGltcGxpY2l0OiAnYnV0dG9uJyxcbiAgICAgIHJvbGVzOiBbJ2xpbmsnLCAnbWVudWl0ZW0nLCAnbWVudWl0ZW1jaGVja2JveCcsICdtZW51aXRlbXJhZGlvJywgJ3JhZGlvJywgJ3N3aXRjaCcsICd0YWInXSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW3R5cGU9aW1hZ2VdJyxcbiAgICAgIGltcGxpY2l0OiAnYnV0dG9uJyxcbiAgICAgIHJvbGVzOiBbJ2xpbmsnLCAnbWVudWl0ZW0nLCAnbWVudWl0ZW1jaGVja2JveCcsICdtZW51aXRlbXJhZGlvJywgJ3JhZGlvJywgJ3N3aXRjaCddLFxuICAgIH0pLFxuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3I6ICdbdHlwZT1jaGVja2JveF0nLFxuICAgICAgaW1wbGljaXQ6ICdjaGVja2JveCcsXG4gICAgICByb2xlczogWydidXR0b24nLCAnbWVudWl0ZW1jaGVja2JveCcsICdzd2l0Y2gnXSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnOm5vdChbdHlwZV0pLFt0eXBlPXRlbF0sW3R5cGU9dGV4dF0sW3R5cGU9dXJsXScsXG4gICAgICBpbXBsaWNpdDogJ3RleHRib3gnLFxuICAgICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICAgIH0pLFxuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3I6ICdbdHlwZT1lbWFpbF0nLFxuICAgICAgaW1wbGljaXQ6ICd0ZXh0Ym94JyxcbiAgICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW3R5cGU9aGlkZGVuXScsXG4gICAgICBhcmlhOiBmYWxzZSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW3R5cGU9bnVtYmVyXScsXG4gICAgICBpbXBsaWNpdDogJ3NwaW5idXR0b24nLFxuICAgICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICAgIH0pLFxuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3I6ICdbdHlwZT1yYWRpb10nLFxuICAgICAgaW1wbGljaXQ6ICdyYWRpbycsXG4gICAgICByb2xlczogWydtZW51aXRlbXJhZGlvJ10sXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1t0eXBlPXJhbmdlXScsXG4gICAgICBpbXBsaWNpdDogJ3NsaWRlcicsXG4gICAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1t0eXBlPXJlc2V0XSxbdHlwZT1zdWJtaXRdJyxcbiAgICAgIGltcGxpY2l0OiAnYnV0dG9uJyxcbiAgICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgICB9KSxcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW3R5cGU9c2VhcmNoXScsXG4gICAgICBpbXBsaWNpdDogJ3NlYXJjaGJveCcsXG4gICAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gICAgfSksXG4gICAgbm9Sb2xlLFxuICBdLFxuICBpbnM6IGFueVJvbGUsXG4gIGRlbDogYW55Um9sZSxcbiAgbGFiZWw6IG5vUm9sZSxcbiAgbGVnZW5kOiBub1JvbGUsXG4gIGxpOiBbXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ29sPmxpLHVsPmxpJyxcbiAgICAgIGltcGxpY2l0OiAnbGlzdGl0ZW0nLFxuICAgICAgcm9sZXM6IFtcbiAgICAgICAgJ21lbnVpdGVtJywgJ21lbnVpdGVtY2hlY2tib3gnLCAnbWVudWl0ZW1yYWRpbycsICdvcHRpb24nLFxuICAgICAgICAncHJlc2VudGF0aW9uJywgJ3NlcGFyYXRvcicsICd0YWInLCAndHJlZWl0ZW0nLFxuICAgICAgXSxcbiAgICB9KSxcbiAgXSxcbiAgbGluazogW1xuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3I6ICdbaHJlZl0nLFxuICAgICAgaW1wbGljaXQ6ICdsaW5rJyxcbiAgICAgIGdsb2JhbEFyaWE6IGZhbHNlLFxuICAgIH0pLFxuICBdLFxuICBtYWluOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ21haW4nLFxuICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgfSksXG4gIG1hcDogbm9Sb2xlT3JBcmlhLFxuICBtYXRoOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ21hdGgnLFxuICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgfSksXG4gIG1lbnU6IFtcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW3R5cGU9Y29udGV4dF0nLFxuICAgICAgaW1wbGljaXQ6ICdtZW51JyxcbiAgICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgICB9KSxcbiAgXSxcbiAgbWVudWl0ZW06IFtcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnW3R5cGU9Y29tbWFuZF0nLFxuICAgICAgaW1wbGljaXQ6ICdtZW51aXRlbScsXG4gICAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gICAgfSksXG4gICAgcnVsZSh7XG4gICAgICBzZWxlY3RvcjogJ1t0eXBlPWNoZWNrYm94XScsXG4gICAgICBpbXBsaWNpdDogJ21lbnVpdGVtY2hlY2tib3gnLFxuICAgICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICAgIH0pLFxuICAgIHJ1bGUoe1xuICAgICAgc2VsZWN0b3I6ICdbdHlwZT1yYWRpb10nLFxuICAgICAgaW1wbGljaXQ6ICdtZW51aXRlbXJhZGlvJyxcbiAgICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgICB9KSxcbiAgXSxcbiAgbWV0YTogbm9Sb2xlT3JBcmlhLFxuICBtZXRlcjogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdwcm9ncmVzc2JhcicsXG4gIH0pLFxuICBuYXY6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnbmF2aWdhdGlvbicsXG4gICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICB9KSxcbiAgbm9zY3JpcHQ6IG5vUm9sZU9yQXJpYSxcbiAgb2JqZWN0OiBydWxlKHtcbiAgICByb2xlczogWydhcHBsaWNhdGlvbicsICdkb2N1bWVudCcsICdpbWcnXSxcbiAgfSksXG4gIG9sOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2xpc3QnLFxuICAgIHJvbGVzOiBbXG4gICAgICAnZGlyZWN0b3J5JywgJ2dyb3VwJywgJ2xpc3Rib3gnLCAnbWVudScsICdtZW51YmFyJywgJ3ByZXNlbnRhdGlvbicsXG4gICAgICAncmFkaW9ncm91cCcsICd0YWJsaXN0JywgJ3Rvb2xiYXInLCAndHJlZScsXG4gICAgXSxcbiAgfSksXG4gIG9wdGdyb3VwOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ2dyb3VwJyxcbiAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gIH0pLFxuICBvcHRpb246IFtcbiAgICBydWxlKHtcbiAgICAgIHNlbGVjdG9yOiAnc2VsZWN0Pm9wdGlvbixzZWxlY3Q+b3B0Z3JvdXA+b3B0aW9uLGRhdGFsaXN0Pm9wdGlvbicsXG4gICAgICBpbXBsaWNpdDogJ29wdGlvbicsXG4gICAgICBhcmlhRm9ySW1wbGljaXQ6IHRydWUsXG4gICAgfSksXG4gICAgbm9Sb2xlT3JBcmlhLFxuICBdLFxuICBvdXRwdXQ6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnc3RhdHVzJyxcbiAgICBhbnlSb2xlOiB0cnVlLFxuICB9KSxcbiAgcGFyYW06IG5vUm9sZU9yQXJpYSxcbiAgcGljdHVyZTogbm9Sb2xlT3JBcmlhLFxuICBwcm9ncmVzczogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdwcm9ncmVzc2JhcicsXG4gICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICB9KSxcbiAgc2NyaXB0OiBub1JvbGVPckFyaWEsXG4gIHNlY3Rpb246IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAncmVnaW9uJyxcbiAgICByb2xlczogW1xuICAgICAgJ2FsZXJ0JywgJ2FsZXJ0ZGlhbG9nJywgJ2FwcGxpY2F0aW9uJywgJ2Jhbm5lcicsICdjb21wbGVtZW50YXJ5JyxcbiAgICAgICdjb250ZW50aW5mbycsICdkaWFsb2cnLCAnZG9jdW1lbnQnLCAnZmVlZCcsICdsb2cnLCAnbWFpbicsICdtYXJxdWVlJyxcbiAgICAgICduYXZpZ2F0aW9uJywgJ3NlYXJjaCcsICdzdGF0dXMnLCAndGFicGFuZWwnLFxuICAgIF0sXG4gIH0pLFxuICBzZWxlY3Q6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnbGlzdGJveCcsXG4gICAgcm9sZXM6IFsnbWVudSddLFxuICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgfSksXG4gIHNvdXJjZTogbm9Sb2xlT3JBcmlhLFxuICBzcGFuOiBhbnlSb2xlLFxuICBzdHlsZTogbm9Sb2xlT3JBcmlhLFxuICBzdmc6IHJ1bGUoe1xuICAgIHJvbGVzOiBbJ2FwcGxpY2F0aW9uJywgJ2RvY3VtZW50JywgJ2ltZyddLFxuICB9KSxcbiAgc3VtbWFyeTogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdidXR0b24nLFxuICAgIGFyaWFGb3JJbXBsaWNpdDogdHJ1ZSxcbiAgfSksXG4gIHRhYmxlOiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ3RhYmxlJyxcbiAgICBhbnlSb2xlOiB0cnVlLFxuICB9KSxcbiAgdGVtcGxhdGU6IG5vUm9sZU9yQXJpYSxcbiAgdGV4dGFyZWE6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAndGV4dGJveCcsXG4gICAgYXJpYUZvckltcGxpY2l0OiB0cnVlLFxuICB9KSxcbiAgdGJvZHk6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAncm93Z3JvdXAnLFxuICAgIGFueVJvbGU6IHRydWUsXG4gIH0pLFxuICB0aGVhZDogcnVsZSh7XG4gICAgaW1wbGljaXQ6ICdyb3dncm91cCcsXG4gICAgYW55Um9sZTogdHJ1ZSxcbiAgfSksXG4gIHRmb290OiBydWxlKHtcbiAgICBpbXBsaWNpdDogJ3Jvd2dyb3VwJyxcbiAgICBhbnlSb2xlOiB0cnVlLFxuICB9KSxcbiAgdGl0bGU6IG5vUm9sZU9yQXJpYSxcbiAgdGQ6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnY2VsbCcsXG4gICAgYW55Um9sZTogdHJ1ZSxcbiAgfSksXG4gIGVtOiBhbnlSb2xlLFxuICBzdHJvbmc6IGFueVJvbGUsXG4gIHNtYWxsOiBhbnlSb2xlLFxuICBzOiBhbnlSb2xlLFxuICBjaXRlOiBhbnlSb2xlLFxuICBxOiBhbnlSb2xlLFxuICBkZm46IGFueVJvbGUsXG4gIGFiYnI6IGFueVJvbGUsXG4gIHRpbWU6IGFueVJvbGUsXG4gIGNvZGU6IGFueVJvbGUsXG4gIHZhcjogYW55Um9sZSxcbiAgc2FtcDogYW55Um9sZSxcbiAga2JkOiBhbnlSb2xlLFxuICBzdWI6IGFueVJvbGUsXG4gIHN1cDogYW55Um9sZSxcbiAgaTogYW55Um9sZSxcbiAgYjogYW55Um9sZSxcbiAgdTogYW55Um9sZSxcbiAgbWFyazogYW55Um9sZSxcbiAgcnVieTogYW55Um9sZSxcbiAgcmI6IGFueVJvbGUsXG4gIHJ0YzogYW55Um9sZSxcbiAgcnQ6IGFueVJvbGUsXG4gIHJwOiBhbnlSb2xlLFxuICBiZGk6IGFueVJvbGUsXG4gIGJkbzogYW55Um9sZSxcbiAgYnI6IGFueVJvbGUsXG4gIHdicjogYW55Um9sZSxcbiAgdGg6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiBbJ2NvbHVtbmhlYWRlcicsICdyb3doZWFkZXInXSxcbiAgICBhbnlSb2xlOiB0cnVlLFxuICB9KSxcbiAgdHI6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAncm93JyxcbiAgICBhbnlSb2xlOiB0cnVlLFxuICB9KSxcbiAgdHJhY2s6IG5vUm9sZU9yQXJpYSxcbiAgdWw6IHJ1bGUoe1xuICAgIGltcGxpY2l0OiAnbGlzdCcsXG4gICAgcm9sZXM6IFtcbiAgICAgICdkaXJlY3RvcnknLCAnZ3JvdXAnLCAnbGlzdGJveCcsICdtZW51JywgJ21lbnViYXInLFxuICAgICAgJ3JhZGlvZ3JvdXAnLCAndGFibGlzdCcsICd0b29sYmFyJywgJ3RyZWUnLCAncHJlc2VudGF0aW9uJyxcbiAgICBdLFxuICB9KSxcbiAgdmlkZW86IHJ1bGUoe1xuICAgIHJvbGVzOiBbJ2FwcGxpY2F0aW9uJ10sXG4gIH0pLFxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiAgQXJpYSBwcm9wZXJ0aWVzXG4gKi9cblxuLyoqXG4gKiBEZXNjcmliZXMgYW4gYXJpYSB2YWx1ZVxuICpcbiAqIEB0eXBlZGVmIHtPYmplY3R9IGFyaWFWYWx1ZVxuICogQHByb3BlcnR5IHtTdHJpbmd9IHR5cGUgT25lIG9mIHN0cmluZywgaW50ZWdlciwgbnVtYmVyLCBpZCwgaWRsaXN0LCB0b2tlbiwgdG9rZW5saXN0XG4gKiBAcHJvcGVydHkge1N0cmluZ1tdfSB0b2tlbnNcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nW119IGFsb25lXG4gKi9cblxuLyoqXG4gKiBEZXNjcmliZXMgYW4gYXJpYSBwcm9wZXJ0eVxuICpcbiAqIEB0eXBlZGVmIHtPYmplY3R9IGFyaWFQcm9wZXJ0eVxuICogQHByb3BlcnR5IHthcmlhVmFsdWV9IHZhbHVlc1xuICogQHByb3BlcnR5IHtCb29sZWFufSBnbG9iYWxcbiAqL1xuXG5jb25zdCBib29sZWFuID0ge1xuICB0eXBlOiAndG9rZW4nLFxuICB0b2tlbnM6IFsndHJ1ZScsICdmYWxzZSddLFxufTtcblxuY29uc3QgdHJpc3RhdGUgPSB7XG4gIHR5cGU6ICd0b2tlbicsXG4gIHRva2VuczogWyd0cnVlJywgJ2ZhbHNlJywgJ21peGVkJywgJ3VuZGVmaW5lZCddLFxufTtcblxuY29uc3QgbmlsYWJsZUJvb2xlYW4gPSB7XG4gIHR5cGU6ICd0b2tlbicsXG4gIHRva2VuczogWyd0cnVlJywgJ2ZhbHNlJywgJ3VuZGVmaW5lZCddLFxufTtcblxuXG4vKiogQGVudW0ge2FyaWFQcm9wZXJ0eX0gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhY3RpdmVkZXNjZW5kYW50OiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdpZCcgfSxcbiAgfSxcbiAgYXRvbWljOiB7XG4gICAgdmFsdWVzOiBib29sZWFuLFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgYXV0b2NvbXBsZXRlOiB7XG4gICAgdmFsdWVzOiB7XG4gICAgICB0eXBlOiAndG9rZW4nLFxuICAgICAgdG9rZW5zOiBbJ2lubGluZScsICdsaXN0JywgJ2JvdGgnLCAnbm9uZSddLFxuICAgIH0sXG4gIH0sXG4gIGJ1c3k6IHtcbiAgICB2YWx1ZXM6IGJvb2xlYW4sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBjaGVja2VkOiB7XG4gICAgdmFsdWVzOiB0cmlzdGF0ZSxcbiAgfSxcbiAgY29sY291bnQ6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ2ludGVnZXInIH0sXG4gIH0sXG4gIGNvbGluZGV4OiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdpbnRlZ2VyJyB9LFxuICB9LFxuICBjb2xzcGFuOiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdpbnRlZ2VyJyB9LFxuICB9LFxuICBjb250cm9sczoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnaWRsaXN0JyB9LFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgY3VycmVudDoge1xuICAgIHZhbHVlczoge1xuICAgICAgdHlwZTogJ3Rva2VuJyxcbiAgICAgIHRva2VuczogWydwYWdlJywgJ3N0ZXAnLCAnbG9jYXRpb24nLCAnZGF0ZScsICd0aW1lJywgJ3RydWUnLCAnZmFsc2UnXSxcbiAgICB9LFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgZGVzY3JpYmVkYnk6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ2lkbGlzdCcgfSxcbiAgICBnbG9iYWw6IHRydWUsXG4gIH0sXG4gIGRldGFpbHM6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ2lkJyB9LFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgZGlzYWJsZWQ6IHtcbiAgICB2YWx1ZXM6IGJvb2xlYW4sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBkcm9wZWZmZWN0OiB7XG4gICAgdmFsdWVzOiB7XG4gICAgICB0eXBlOiAndG9rZW5saXN0JyxcbiAgICAgIHRva2VuczogWydjb3B5JywgJ2V4ZWN1dGUnLCAnbGluaycsICdtb3ZlJywgJ25vbmUnLCAncG9wdXAnXSxcbiAgICAgIGFsb25lOiBbJ25vbmUnXSxcbiAgICB9LFxuICAgIGRlcHJlY2F0ZWQ6IHRydWUsXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBlcnJvcm1lc3NhZ2U6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ2lkJyB9LFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgZXhwYW5kZWQ6IHtcbiAgICB2YWx1ZXM6IG5pbGFibGVCb29sZWFuLFxuICB9LFxuICBmbG93dG86IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ2lkbGlzdCcgfSxcbiAgICBnbG9iYWw6IHRydWUsXG4gIH0sXG4gIGdyYWJiZWQ6IHtcbiAgICB2YWx1ZXM6IG5pbGFibGVCb29sZWFuLFxuICAgIGRlcHJlY2F0ZWQ6IHRydWUsXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBoYXNwb3B1cDoge1xuICAgIHZhbHVlczoge1xuICAgICAgdHlwZTogJ3Rva2VuJyxcbiAgICAgIHRva2VuczogWydmYWxzZScsICd0cnVlJywgJ21lbnUnLCAnbGlzdGJveCcsICd0cmVlJywgJ2dyaWQnLCAnZGlhbG9nJ10sXG4gICAgfSxcbiAgICBnbG9iYWw6IHRydWUsXG4gIH0sXG4gIGhpZGRlbjoge1xuICAgIHZhbHVlczogbmlsYWJsZUJvb2xlYW4sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBpbnZhbGlkOiB7XG4gICAgdmFsdWVzOiB7XG4gICAgICB0eXBlOiAndG9rZW4nLFxuICAgICAgdG9rZW5zOiBbJ2dyYW1tYXInLCAnZmFsc2UnLCAnc3BlbGxpbmcnLCAndHJ1ZSddLFxuICAgIH0sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBrZXlzaG9ydGN1dHM6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICBnbG9iYWw6IHRydWUsXG4gIH0sXG4gIGxhYmVsOiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBsYWJlbGxlZGJ5OiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdpZGxpc3QnIH0sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBsZXZlbDoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnaW50ZWdlcicgfSxcbiAgfSxcbiAgbGl2ZToge1xuICAgIHZhbHVlczoge1xuICAgICAgdHlwZTogJ3Rva2VuJyxcbiAgICAgIHRva2VuczogWydhc3NlcnRpdmUnLCAnb2ZmJywgJ3BvbGl0ZSddLFxuICAgIH0sXG4gICAgZ2xvYmFsOiB0cnVlLFxuICB9LFxuICBtb2RhbDoge1xuICAgIHZhbHVlczogYm9vbGVhbixcbiAgfSxcbiAgbXVsdGlsaW5lOiB7XG4gICAgdmFsdWVzOiBib29sZWFuLFxuICB9LFxuICBtdWx0aXNlbGVjdGFibGU6IHtcbiAgICB2YWx1ZXM6IGJvb2xlYW4sXG4gIH0sXG4gIG9yaWVudGF0aW9uOiB7XG4gICAgdmFsdWVzOiB7XG4gICAgICB0eXBlOiAndG9rZW4nLFxuICAgICAgdG9rZW5zOiBbJ2hvcml6b250YWwnLCAndW5kZWZpbmVkJywgJ3ZlcnRpY2FsJ10sXG4gICAgfSxcbiAgfSxcbiAgb3duczoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnaWRsaXN0JyB9LFxuICAgIGdsb2JhbDogdHJ1ZSxcbiAgfSxcbiAgcGxhY2Vob2xkZXI6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgfSxcbiAgcG9zaW5zZXQ6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ2ludGVnZXInIH0sXG4gIH0sXG4gIHByZXNzZWQ6IHtcbiAgICB2YWx1ZXM6IHRyaXN0YXRlLFxuICB9LFxuICByZWFkb25seToge1xuICAgIHZhbHVlczogYm9vbGVhbixcbiAgfSxcbiAgcmVsZXZhbnQ6IHtcbiAgICB2YWx1ZXM6IHtcbiAgICAgIHR5cGU6ICd0b2tlbmxpc3QnLFxuICAgICAgdG9rZW5zOiBbJ2FkZGl0aW9ucycsICdhbGwnLCAncmVtb3ZhbHMnLCAndGV4dCddLFxuICAgICAgYWxvbmU6IFsnYWxsJ10sXG4gICAgfSxcbiAgICBnbG9iYWw6IHRydWUsXG4gIH0sXG4gIHJlcXVpcmVkOiB7XG4gICAgdmFsdWVzOiBib29sZWFuLFxuICB9LFxuICByb2xlZGVzY3JpcHRpb246IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICBnbG9iYWw6IHRydWUsXG4gIH0sXG4gIHJvd2NvdW50OiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdpbnRlZ2VyJyB9LFxuICB9LFxuICByb3dpbmRleDoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnaW50ZWdlcicgfSxcbiAgfSxcbiAgcm93c3Bhbjoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnaW50ZWdlcicgfSxcbiAgfSxcbiAgc2VsZWN0ZWQ6IHtcbiAgICB2YWx1ZXM6IG5pbGFibGVCb29sZWFuLFxuICB9LFxuICBzZXRzaXplOiB7XG4gICAgdmFsdWVzOiB7IHR5cGU6ICdpbnRlZ2VyJyB9LFxuICB9LFxuICBzb3J0OiB7XG4gICAgdmFsdWVzOiB7XG4gICAgICB0eXBlOiAndG9rZW4nLFxuICAgICAgdG9rZW5zOiBbJ2FzY2VuZGluZycsICdkZXNjZW5kaW5nJywgJ25vbmUnLCAnb3RoZXInXSxcbiAgICB9LFxuICB9LFxuICB2YWx1ZW1heDoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICB9LFxuICB2YWx1ZW1pbjoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICB9LFxuICB2YWx1ZW5vdzoge1xuICAgIHZhbHVlczogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICB9LFxuICB2YWx1ZXRleHQ6IHtcbiAgICB2YWx1ZXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgfSxcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICogRGF0YSBmb3IgSFRNTCBlbGVtZW50cy4gIEJhc2VkIG9uXG4gKiAtIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9odG1sNTIvXG4gKiAtIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9odG1sLWFyaWEvXG4gKi9cblxuLyoqXG4gKiBEZXNjcmliZXMgYW4gYXJpYSBwcm9wZXJ0eVxuICpcbiAqIEB0eXBlZGVmIHtPYmplY3R9IGh0bWxFbGVtZW50XG4gKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBuYXRpdmVMYWJlbFxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gbmF0aXZlRGVzY3JpcHRpb25cbiAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gb2Jzb2xldGVcbiAqL1xuXG5jb25zdCBsYWJlbHMgPSAoZWwsIHV0aWxzKSA9PiB7XG4gIGxldCBmb3VuZCA9IFtdO1xuICAvLyBJZiBtb3JlIHRoYW4gb25lIGVsZW1lbnQgaGFzIG91ciBJRCB3ZSBtdXN0IGJlIHRoZSBmaXJzdFxuICBpZiAoZWwuaWQgJiYgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWwuaWQpID09PSBlbCkge1xuICAgIGZvdW5kID0gdXRpbHMuJCQoYGxhYmVsW2Zvcj1cIiR7dXRpbHMuY3NzRXNjYXBlKGVsLmlkKX1cIl1gKTtcbiAgfVxuICBmb3VuZC5wdXNoKGVsLmNsb3Nlc3QoJ2xhYmVsOm5vdChbZm9yXSknKSk7XG4gIHJldHVybiBmb3VuZC5maWx0ZXIoQm9vbGVhbikuZmlsdGVyKGVsbSA9PiAhdXRpbHMuaGlkZGVuKGVsbSwgeyBhcmlhSGlkZGVuOiB0cnVlIH0pKTtcbn07XG5cbmNvbnN0IG9ic29sZXRlID0geyBvYnNvbGV0ZTogdHJ1ZSB9O1xuXG4vKiogQGVudW0ge2h0bWxFbGVtZW50fSAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGE6IHt9LFxuICBhYmJyOiB7fSxcbiAgYWNyb255bTogb2Jzb2xldGUsXG4gIGFkZHJlc3M6IHt9LFxuICBhcHBsZXQ6IG9ic29sZXRlLFxuICBhcmVhOiB7XG4gICAgbmF0aXZlTGFiZWwoZWwpIHtcbiAgICAgIHJldHVybiBlbC5hbHQgfHwgJyc7XG4gICAgfSxcbiAgfSxcbiAgYXJ0aWNsZToge30sXG4gIGFzaWRlOiB7fSxcbiAgYXVkaW86IHt9LFxuICBiOiB7fSxcbiAgYmFzZToge30sXG4gIGJhc2Vmb250OiBvYnNvbGV0ZSxcbiAgYmRpOiB7fSxcbiAgYmRvOiB7fSxcbiAgYmdzb3VuZDogb2Jzb2xldGUsXG4gIGJpZzogb2Jzb2xldGUsXG4gIGJsaW5rOiBvYnNvbGV0ZSxcbiAgYmxvY2txdW90ZToge30sXG4gIGJvZHk6IHt9LFxuICBicjoge30sXG4gIGJ1dHRvbjoge1xuICAgIG5hdGl2ZUxhYmVsOiBsYWJlbHMsXG4gIH0sXG4gIGNhbnZhczoge30sXG4gIGNhcHRpb246IHt9LFxuICBjZW50ZXI6IG9ic29sZXRlLFxuICBjaXRlOiB7fSxcbiAgY29kZToge30sXG4gIGNvbDoge30sXG4gIGNvbGdyb3VwOiB7fSxcbiAgY29tbWFuZDogb2Jzb2xldGUsXG4gIGRhdGE6IHt9LFxuICBkYXRhbGlzdDoge30sXG4gIGRkOiB7fSxcbiAgZGVsOiB7fSxcbiAgZGV0YWlsczoge1xuICAgIG5hdGl2ZUxhYmVsKGVsLCB1dGlscykge1xuICAgICAgY29uc3QgZm91bmQgPSBlbC5xdWVyeVNlbGVjdG9yKCdzdW1tYXJ5Jyk7XG4gICAgICBpZiAoZm91bmQgJiYgdXRpbHMuaGlkZGVuKGZvdW5kLCB7IGFyaWFIaWRkZW46IHRydWUgfSkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gZm91bmQ7XG4gICAgfSxcbiAgICB1bnN1cHBvcnRlZDogdHJ1ZSxcbiAgfSxcbiAgZGZuOiB7fSxcbiAgZGlhbG9nOiB7XG4gICAgdW5zdXBwb3J0ZWQ6IHRydWUsXG4gIH0sXG4gIGRpcjogb2Jzb2xldGUsXG4gIGRpdjoge30sXG4gIGRsOiB7fSxcbiAgZHQ6IHt9LFxuICBlbToge30sXG4gIGVtYmVkOiB7fSxcbiAgZmllbGRzZXQ6IHtcbiAgICBuYXRpdmVMYWJlbChlbCwgdXRpbHMpIHtcbiAgICAgIGNvbnN0IGZvdW5kID0gZWwucXVlcnlTZWxlY3RvcignbGVnZW5kJyk7XG4gICAgICBpZiAoZm91bmQgJiYgdXRpbHMuaGlkZGVuKGZvdW5kLCB7IGFyaWFIaWRkZW46IHRydWUgfSkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gZm91bmQ7XG4gICAgfSxcbiAgfSxcbiAgZmlnY2FwdGlvbjoge30sXG4gIGZpZ3VyZToge30sXG4gIGZvbnQ6IG9ic29sZXRlLFxuICBmb290ZXI6IHt9LFxuICBmb3JtOiB7fSxcbiAgZnJhbWU6IG9ic29sZXRlLFxuICBmcmFtZXNldDogb2Jzb2xldGUsXG4gIGgxOiB7fSxcbiAgaDI6IHt9LFxuICBoMzoge30sXG4gIGg0OiB7fSxcbiAgaDU6IHt9LFxuICBoNjoge30sXG4gIGhlYWQ6IHt9LFxuICBoZWFkZXI6IHt9LFxuICBoZ3JvdXA6IG9ic29sZXRlLFxuICBocjoge30sXG4gIGh0bWw6IHt9LFxuICBpOiB7fSxcbiAgaWZyYW1lOiB7fSxcbiAgaW1hZ2U6IG9ic29sZXRlLFxuICBpbWc6IHtcbiAgICBuYXRpdmVMYWJlbChlbCkge1xuICAgICAgcmV0dXJuIGVsLmFsdCB8fCAnJztcbiAgICB9LFxuICB9LFxuICBpbnB1dDoge1xuICAgIG5hdGl2ZUxhYmVsKGVsLCB1dGlscykge1xuICAgICAgaWYgKGVsLnR5cGUgPT09ICdoaWRkZW4nKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAoZWwudHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICByZXR1cm4gZWwuYWx0IHx8IGVsLnZhbHVlIHx8ICcnO1xuICAgICAgfVxuXG4gICAgICBpZiAoWydzdWJtaXQnLCAncmVzZXQnLCAnYnV0dG9uJ10uaW5jbHVkZXMoZWwudHlwZSkpIHtcbiAgICAgICAgcmV0dXJuIGVsLnZhbHVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbGFiZWxzKGVsLCB1dGlscyk7XG4gICAgfSxcbiAgfSxcbiAgaW5zOiB7fSxcbiAgaXNpbmRleDogb2Jzb2xldGUsXG4gIGtiZDoge30sXG4gIGtleWdlbjogb2Jzb2xldGUsXG4gIGxhYmVsOiB7fSxcbiAgbGVnZW5kOiB7fSxcbiAgbGk6IHt9LFxuICBsaW5rOiB7fSxcbiAgbGlzdGluZzogb2Jzb2xldGUsXG4gIG1haW46IHt9LFxuICBtYXA6IHt9LFxuICBtYXJrOiB7fSxcbiAgbWFycXVlZTogb2Jzb2xldGUsXG4gIG1hdGg6IHt9LFxuICBtZW51OiB7XG4gICAgdW5zdXBwb3J0ZWQ6IHRydWUsXG4gIH0sXG4gIG1lbnVpdGVtOiB7XG4gICAgdW5zdXBwb3J0ZWQ6IHRydWUsXG4gIH0sXG4gIG1ldGE6IHt9LFxuICBtZXRlcjoge1xuICAgIG5hdGl2ZUxhYmVsOiBsYWJlbHMsXG4gIH0sXG4gIG11bHRpY29sOiBvYnNvbGV0ZSxcbiAgbmF2OiB7fSxcbiAgbmV4dGlkOiBvYnNvbGV0ZSxcbiAgbm9icjogb2Jzb2xldGUsXG4gIG5vZW1iZWQ6IG9ic29sZXRlLFxuICBub2ZyYW1lczogb2Jzb2xldGUsXG4gIG5vc2NyaXB0OiB7fSxcbiAgb2JqZWN0OiB7fSxcbiAgb2w6IHt9LFxuICBvcHRncm91cDoge30sXG4gIG9wdGlvbjoge30sXG4gIG91dHB1dDoge1xuICAgIG5hdGl2ZUxhYmVsOiBsYWJlbHMsXG4gIH0sXG4gIHA6IHt9LFxuICBwYXJhbToge30sXG4gIHBpY3R1cmU6IHt9LFxuICBwbGFpbnRleHQ6IG9ic29sZXRlLFxuICBwcmU6IHt9LFxuICBwcm9ncmVzczoge1xuICAgIG5hdGl2ZUxhYmVsOiBsYWJlbHMsXG4gIH0sXG4gIHE6IHt9LFxuICByYjoge30sXG4gIHJwOiB7fSxcbiAgcnQ6IHt9LFxuICBydGM6IHt9LFxuICBydWJ5OiB7fSxcbiAgczoge30sXG4gIHNhbXA6IHt9LFxuICBzY3JpcHQ6IHt9LFxuICBzZWN0aW9uOiB7fSxcbiAgc2VsZWN0OiB7XG4gICAgbmF0aXZlTGFiZWw6IGxhYmVscyxcbiAgfSxcbiAgc21hbGw6IHt9LFxuICBzb3VyY2U6IHt9LFxuICBzcGFjZXI6IG9ic29sZXRlLFxuICBzcGFuOiB7fSxcbiAgc3RyaWtlOiBvYnNvbGV0ZSxcbiAgc3Ryb25nOiB7fSxcbiAgc3R5bGU6IHt9LFxuICBzdWI6IHt9LFxuICBzdW1tYXJ5OiB7XG4gICAgdW5zdXBwb3J0ZWQ6IHRydWUsXG4gIH0sXG4gIHN1cDoge30sXG4gIHN2Zzoge30sXG4gIHRhYmxlOiB7fSxcbiAgdGJvZHk6IHt9LFxuICB0ZDoge30sXG4gIHRlbXBsYXRlOiB7fSxcbiAgdGV4dGFyZWE6IHtcbiAgICBuYXRpdmVMYWJlbDogbGFiZWxzLFxuICB9LFxuICB0Zm9vdDoge30sXG4gIHRoOiB7fSxcbiAgdGhlYWQ6IHt9LFxuICB0aW1lOiB7fSxcbiAgdGl0bGU6IHt9LFxuICB0cjoge30sXG4gIHRyYWNrOiB7fSxcbiAgdHQ6IG9ic29sZXRlLFxuICB1OiB7fSxcbiAgdWw6IHt9LFxuICB2YXI6IHt9LFxuICB2aWRlbzoge30sXG4gIHdicjoge30sXG4gIHhtcDogb2Jzb2xldGUsXG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5leHBvcnRzLmV2ZW50SGFuZGxlckF0dHJpYnV0ZXMgPSBbXG4gICdvbmFib3J0JyxcbiAgJ29uYXV4Y2xpY2snLFxuICAnb25ibHVyJyxcbiAgJ29uY2FuY2VsJyxcbiAgJ29uY2FucGxheScsXG4gICdvbmNhbnBsYXl0aHJvdWdoJyxcbiAgJ29uY2hhbmdlJyxcbiAgJ29uY2xpY2snLFxuICAnb25jbG9zZScsXG4gICdvbmNvbnRleHRtZW51JyxcbiAgJ29uY3VlY2hhbmdlJyxcbiAgJ29uZGJsY2xpY2snLFxuICAnb25kcmFnJyxcbiAgJ29uZHJhZ2VuZCcsXG4gICdvbmRyYWdlbnRlcicsXG4gICdvbmRyYWdleGl0JyxcbiAgJ29uZHJhZ2xlYXZlJyxcbiAgJ29uZHJhZ292ZXInLFxuICAnb25kcmFnc3RhcnQnLFxuICAnb25kcm9wJyxcbiAgJ29uZHVyYXRpb25jaGFuZ2UnLFxuICAnb25lbXB0aWVkJyxcbiAgJ29uZW5kZWQnLFxuICAnb25lcnJvcicsXG4gICdvbmZvY3VzJyxcbiAgJ29uaW5wdXQnLFxuICAnb25pbnZhbGlkJyxcbiAgJ29ua2V5ZG93bicsXG4gICdvbmtleXByZXNzJyxcbiAgJ29ua2V5dXAnLFxuICAnb25sb2FkJyxcbiAgJ29ubG9hZGVkZGF0YScsXG4gICdvbmxvYWRlZG1ldGFkYXRhJyxcbiAgJ29ubG9hZGVuZCcsXG4gICdvbmxvYWRzdGFydCcsXG4gICdvbm1vdXNlZG93bicsXG4gICdvbm1vdXNlZW50ZXInLFxuICAnb25tb3VzZWxlYXZlJyxcbiAgJ29ubW91c2Vtb3ZlJyxcbiAgJ29ubW91c2VvdXQnLFxuICAnb25tb3VzZW92ZXInLFxuICAnb25tb3VzZXVwJyxcbiAgJ29ud2hlZWwnLFxuICAnb25wYXVzZScsXG4gICdvbnBsYXknLFxuICAnb25wbGF5aW5nJyxcbiAgJ29ucHJvZ3Jlc3MnLFxuICAnb25yYXRlY2hhbmdlJyxcbiAgJ29ucmVzZXQnLFxuICAnb25yZXNpemUnLFxuICAnb25zY3JvbGwnLFxuICAnb25zZWVrZWQnLFxuICAnb25zZWVraW5nJyxcbiAgJ29uc2VsZWN0JyxcbiAgJ29uc2hvdycsXG4gICdvbnN0YWxsZWQnLFxuICAnb25zdWJtaXQnLFxuICAnb25zdXNwZW5kJyxcbiAgJ29udGltZXVwZGF0ZScsXG4gICdvbnRvZ2dsZScsXG4gICdvbnZvbHVtZWNoYW5nZScsXG4gICdvbndhaXRpbmcnLFxuXTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgYWxsb3dlZEFyaWEgPSByZXF1aXJlKCcuL2FsbG93ZWQtYXJpYScpO1xuY29uc3QgYXJpYUF0dHJpYnV0ZXMgPSByZXF1aXJlKCcuL2FyaWEtYXR0cmlidXRlcycpO1xuY29uc3QgZWxlbWVudHMgPSByZXF1aXJlKCcuL2VsZW1lbnRzJyk7XG5jb25zdCBhdHRyaWJ1dGVzID0gcmVxdWlyZSgnLi9ldmVudC1oYW5kbGVyLWF0dHJpYnV0ZXMnKTtcbmNvbnN0IHJvbGVzID0gcmVxdWlyZSgnLi9yb2xlcycpO1xuXG5mdW5jdGlvbiBleHRlbmRFbGVtZW50cyhvcmlnaW5hbCwgY29uZmlnKSB7XG4gIGNvbnN0IHNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgb3JpZ2luYWwpO1xuICBpZiAoY29uZmlnKSB7XG4gICAgT2JqZWN0LmVudHJpZXMoY29uZmlnKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgZGVsZXRlIHNldHRpbmdzW2tleV07XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNldHRpbmdzW2tleV0gPSBPYmplY3QuYXNzaWduKHt9LCBzZXR0aW5nc1trZXldIHx8IHt9LCB2YWx1ZSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHNldHRpbmdzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbmZpZyB7XG4gIGNvbnN0cnVjdG9yKHNldHRpbmdzID0ge30pIHtcbiAgICB0aGlzLmFsbG93ZWRBcmlhID0gYWxsb3dlZEFyaWE7XG4gICAgdGhpcy5hcmlhQXR0cmlidXRlcyA9IGFyaWFBdHRyaWJ1dGVzO1xuICAgIHRoaXMuZWxlbWVudHMgPSBleHRlbmRFbGVtZW50cyhlbGVtZW50cywgc2V0dGluZ3MuZWxlbWVudHMpO1xuICAgIHRoaXMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG4gICAgdGhpcy5yb2xlcyA9IHJvbGVzO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKipcbiAqIFJ1bGVzIGZvciBhcmlhIHByb3BlcnRpZXNcbiAqXG4gKiBodHRwczovL3czYy5naXRodWIuaW8vaHRtbC1hcmlhL1xuICovXG5cbi8qKlxuICogRGVzY3JpYmVzIGFuIGFyaWEgcm9sZVxuICpcbiAqIEB0eXBlZGVmIHtPYmplY3R9IGFyaWFSb2xlXG4gKiBAcHJvcGVydHkge1N0cmluZ1tdfSBhbGxvd2VkXG4gKiBAcHJvcGVydHkge1N0cmluZ1tdfSBzdWJjbGFzc1xuICogQHByb3BlcnR5IHtTdHJpbmdbXX0gcmVxdWlyZWQgUmVxdWlyZWQgYXJpYSBwcm9wZXJ0aWVzXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59IG5hbWVGcm9tQ29udGVudFxuICogQHByb3BlcnR5IHtCb29sZWFufSBhYnN0cmFjdFxuICovXG5cbi8qKiBAZW51bSB7YXJpYVJvbGV9ICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWxlcnQ6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gICAgc3ViY2xhc3M6IFsnYWxlcnRkaWFsb2cnXSxcbiAgfSxcbiAgYWxlcnRkaWFsb2c6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJywgJ21vZGFsJ10sXG4gIH0sXG4gIGFwcGxpY2F0aW9uOiB7XG4gICAgYWxsb3dlZDogWydhY3RpdmVkZXNjZW5kYW50J10sXG4gIH0sXG4gIGFydGljbGU6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIGJhbm5lcjoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgYnV0dG9uOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCcsICdwcmVzc2VkJ10sXG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICB9LFxuICBjZWxsOiB7XG4gICAgYWxsb3dlZDogWydjb2xpbmRleCcsICdjb2xzcGFuJywgJ2V4cGFuZGVkJywgJ3Jvd2luZGV4JywgJ3Jvd3NwYW4nXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gICAgc3ViY2xhc3M6IFsnY29sdW1uaGVhZGVyJywgJ2dyaWRjZWxsJywgJ3Jvd2hlYWRlciddLFxuICB9LFxuICBjaGVja2JveDoge1xuICAgIGFsbG93ZWQ6IFsncmVhZG9ubHknXSxcbiAgICByZXF1aXJlZDogWydjaGVja2VkJ10sXG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICAgIHN1YmNsYXNzOiBbJ21lbnVpdGVtY2hlY2tib3gnLCAnc3dpdGNoJ10sXG4gIH0sXG4gIGNvbHVtbmhlYWRlcjoge1xuICAgIGFsbG93ZWQ6IFsnY29saW5kZXgnLCAnY29sc3BhbicsICdleHBhbmRlZCcsICdyZWFkb25seScsICdyZXF1aXJlZCcsICdyb3dpbmRleCcsICdyb3dzcGFuJywgJ3NlbGVjdGVkJywgJ3NvcnQnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gIH0sXG4gIGNvbWJvYm94OiB7XG4gICAgcmVxdWlyZWQ6IFsnY29udHJvbHMnLCAnZXhwYW5kZWQnXSxcbiAgICBhbGxvd2VkOiBbJ2FjdGl2ZWRlc2NlbmRhbnQnLCAnYXV0b2NvbXBsZXRlJywgJ29yaWVudGF0aW9uJywgJ3JlcXVpcmVkJ10sXG4gIH0sXG4gIGNvbW1hbmQ6IHtcbiAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydidXR0b24nLCAnbGluaycsICdtZW51aXRlbSddLFxuICB9LFxuICBjb21wbGVtZW50YXJ5OiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICBjb21wb3NpdGU6IHtcbiAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydncmlkJywgJ3NlbGVjdCcsICdzcGluYnV0dG9uJywgJ3RhYmxpc3QnXSxcbiAgfSxcbiAgY29udGVudGluZm86IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIGRlZmluaXRpb246IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIGRpYWxvZzoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnLCAnbW9kYWwnXSxcbiAgICBzdWJjbGFzczogWydhbGVydGRpYWxvZyddLFxuICB9LFxuICBkaXJlY3Rvcnk6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIGRvY3VtZW50OiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICAgIHN1YmNsYXNzOiBbJ2FydGljbGUnXSxcbiAgfSxcbiAgZmVlZDoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgZmlndXJlOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICBmb3JtOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICBncmlkOiB7XG4gICAgYWxsb3dlZDogWydhY3RpdmVkZXNjZW5kYW50JywgJ2NvbGNvdW50JywgJ2V4cGFuZGVkJywgJ2xldmVsJywgJ211bHRpc2VsZWN0YWJsZScsICdyZWFkb25seScsICdyb3djb3VudCddLFxuICAgIHN1YmNsYXNzOiBbJ3RyZWVncmlkJ10sXG4gIH0sXG4gIGdyaWRjZWxsOiB7XG4gICAgYWxsb3dlZDogWydjb2xpbmRleCcsICdjb2xzcGFuJywgJ2V4cGFuZGVkJywgJ3JlYWRvbmx5JywgJ3JlcXVpcmVkJywgJ3Jvd2luZGV4JywgJ3Jvd3NwYW4nLCAnc2VsZWN0ZWQnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gICAgc3ViY2xhc3M6IFsnY29sdW1uaGVhZGVyJywgJ3Jvd2hlYWRlciddLFxuICB9LFxuICBncm91cDoge1xuICAgIGFsbG93ZWQ6IFsnYWN0aXZlZGVzY2VuZGFudCcsICdleHBhbmRlZCddLFxuICAgIHN1YmNsYXNzOiBbJ3JvdycsICdzZWxlY3QnLCAndG9vbGJhciddLFxuICB9LFxuICBoZWFkaW5nOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCcsICdsZXZlbCddLFxuICAgIG5hbWVGcm9tQ29udGVudDogdHJ1ZSxcbiAgfSxcbiAgaW1nOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICBpbnB1dDoge1xuICAgIGFic3RyYWN0OiB0cnVlLFxuICAgIHN1YmNsYXNzOiBbJ2NoZWNrYm94JywgJ29wdGlvbicsICdyYWRpbycsICdzbGlkZXInLCAnc3BpbmJ1dHRvbicsICd0ZXh0Ym94J10sXG4gIH0sXG4gIGxhbmRtYXJrOiB7XG4gICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgc3ViY2xhc3M6IFsnYmFubmVyJywgJ2NvbXBsZW1lbnRhcnknLCAnY29udGVudGluZm8nLCAnZm9ybScsICdtYWluJywgJ25hdmlnYXRpb24nLCAncmVnaW9uJywgJ3NlYXJjaCddLFxuICB9LFxuICBsaW5rOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICAgIG5hbWVGcm9tQ29udGVudDogdHJ1ZSxcbiAgfSxcbiAgbGlzdDoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgICBzdWJjbGFzczogWydkaXJlY3RvcnknLCAnZmVlZCddLFxuICB9LFxuICBsaXN0Ym94OiB7XG4gICAgYWxsb3dlZDogWydhY3RpdmVkZXNjZW5kYW50JywgJ2V4cGFuZGVkJywgJ211bHRpc2VsZWN0YWJsZScsICdvcmllbnRhdGlvbicsICdyZXF1aXJlZCddLFxuICB9LFxuICBsaXN0aXRlbToge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnLCAnbGV2ZWwnLCAncG9zaW5zZXQnLCAnc2V0c2l6ZSddLFxuICAgIHN1YmNsYXNzOiBbJ3RyZWVpdGVtJ10sXG4gIH0sXG4gIGxvZzoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgbWFpbjoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgbWFycXVlZToge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgbWF0aDoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgbWVudToge1xuICAgIGFsbG93ZWQ6IFsnYWN0aXZlZGVzY2VuZGFudCcsICdleHBhbmRlZCcsICdvcmllbnRhdGlvbiddLFxuICAgIHN1YmNsYXNzOiBbJ21lbnViYXInXSxcbiAgfSxcbiAgbWVudWJhcjoge1xuICAgIGFsbG93ZWQ6IFsnYWN0aXZlZGVzY2VuZGFudCcsICdleHBhbmRlZCcsICdvcmllbnRhdGlvbiddLFxuICB9LFxuICBtZW51aXRlbToge1xuICAgIGFsbG93ZWQ6IFsncG9zaW5zZXQnLCAnc2V0c2l6ZSddLFxuICAgIG5hbWVGcm9tQ29udGVudDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydtZW51aXRlbWNoZWNrYm94J10sXG4gIH0sXG4gIG1lbnVpdGVtY2hlY2tib3g6IHtcbiAgICByZXF1aXJlZDogWydjaGVja2VkJ10sXG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICAgIHN1YmNsYXNzOiBbJ21lbnVpdGVtcmFkaW8nXSxcbiAgfSxcbiAgbWVudWl0ZW1yYWRpbzoge1xuICAgIHJlcXVpcmVkOiBbJ2NoZWNrZWQnXSxcbiAgICBhbGxvd2VkOiBbJ3Bvc2luc2V0JywgJ3NlbGVjdGVkJywgJ3NldHNpemUnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gIH0sXG4gIG5hdmlnYXRpb246IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIG5vbmU6IHt9LFxuICBub3RlOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICBvcHRpb246IHtcbiAgICBhbGxvd2VkOiBbJ2NoZWNrZWQnLCAncG9zaW5zZXQnLCAnc2VsZWN0ZWQnLCAnc2V0c2l6ZSddLFxuICAgIG5hbWVGcm9tQ29udGVudDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWyd0cmVlaXRlbSddLFxuICB9LFxuICBwcmVzZW50YXRpb246IHt9LFxuICBwcm9ncmVzc2Jhcjoge1xuICAgIGFsbG93ZWQ6IFsndmFsdWVtYXgnLCAndmFsdWVtaW4nLCAndmFsdWVub3cnLCAndmFsdWV0ZXh0J10sXG4gIH0sXG4gIHJhZGlvOiB7XG4gICAgcmVxdWlyZWQ6IFsnY2hlY2tlZCddLFxuICAgIGFsbG93ZWQ6IFsncG9zaW5zZXQnLCAnc2V0c2l6ZSddLFxuICAgIG5hbWVGcm9tQ29udGVudDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydtZW51aXRlbXJhZGlvJ10sXG4gIH0sXG4gIHJhZGlvZ3JvdXA6IHtcbiAgICBhbGxvd2VkOiBbJ2FjdGl2ZWRlc2NlbmRhbnQnLCAnZXhwYW5kZWQnLCAncmVxdWlyZWQnLCAnb3JpZW50YXRpb24nXSxcbiAgfSxcbiAgcmFuZ2U6IHtcbiAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydwcm9ncmVzc2JhcicsICdzY3JvbGxiYXInLCAnc2xpZGVyJywgJ3NwaW5idXR0b24nXSxcbiAgfSxcbiAgcmVnaW9uOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICB9LFxuICByb2xldHlwZToge1xuICAgIGFic3RyYWN0OiB0cnVlLFxuICAgIHN1YmNsYXNzOiBbJ3N0cnVjdHVyZScsICd3aWRnZXQnLCAnd2luZG93J10sXG4gIH0sXG4gIHJvdzoge1xuICAgIGFsbG93ZWQ6IFsnYWN0aXZlZGVzY2VuZGFudCcsICdjb2xpbmRleCcsICdleHBhbmRlZCcsICdsZXZlbCcsICdyb3dpbmRleCcsICdzZWxlY3RlZCddLFxuICAgIG5hbWVGcm9tQ29udGVudDogdHJ1ZSxcbiAgfSxcbiAgcm93Z3JvdXA6IHtcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gIH0sXG4gIHJvd2hlYWRlcjoge1xuICAgIGFsbG93ZWQ6IFsnY29saW5kZXgnLCAnY29sc3BhbicsICdleHBhbmRlZCcsICdyb3dpbmRleCcsICdyb3dzcGFuJywgJ3JlYWRvbmx5JywgJ3JlcXVpcmVkJywgJ3NlbGVjdGVkJywgJ3NvcnQnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gIH0sXG4gIHNjcm9sbGJhcjoge1xuICAgIHJlcXVpcmVkOiBbJ2NvbnRyb2xzJywgJ29yaWVudGF0aW9uJywgJ3ZhbHVlbWF4JywgJ3ZhbHVlbWluJywgJ3ZhbHVlbm93J10sXG4gIH0sXG4gIHNlYXJjaDoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgc2VhcmNoYm94OiB7XG4gICAgYWxsb3dlZDogWydhY3RpdmVkZXNjZW5kYW50JywgJ2F1dG9jb21wbGV0ZScsICdtdWx0aWxpbmUnLCAncGxhY2Vob2xkZXInLCAncmVhZG9ubHknLCAncmVxdWlyZWQnXSxcbiAgfSxcbiAgc2VjdGlvbjoge1xuICAgIGFic3RyYWN0OiB0cnVlLFxuICAgIHN1YmNsYXNzOiBbJ2FsZXJ0JywgJ2NlbGwnLCAnZGVmaW5pdGlvbicsICdmaWd1cmUnLCAnZ3JvdXAnLCAnaW1nJywgJ2xhbmRtYXJrJywgJ2xpc3QnLCAnbGlzdGl0ZW0nLCAnbG9nJywgJ21hcnF1ZWUnLCAnbWF0aCcsICdub3RlJywgJ3N0YXR1cycsICd0YWJsZScsICd0YWJwYW5lbCcsICd0ZXJtJywgJ3Rvb2x0aXAnXSxcbiAgfSxcbiAgc2VjdGlvbmhlYWQ6IHtcbiAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydjb2x1bW5oZWFkZXInLCAnaGVhZGluZycsICdyb3doZWFkZXInLCAndGFiJ10sXG4gIH0sXG4gIHNlbGVjdDoge1xuICAgIGFic3RyYWN0OiB0cnVlLFxuICAgIHN1YmNsYXNzOiBbJ2NvbWJvYm94JywgJ2xpc3Rib3gnLCAnbWVudScsICdyYWRpb2dyb3VwJywgJ3RyZWUnXSxcbiAgfSxcbiAgc2VwYXJhdG9yOiB7XG4gICAgcmVxdWlyZWQ6IFsndmFsdWVtYXgnLCAndmFsdWVtaW4nLCAndmFsdWVub3cnXSxcbiAgICBhbGxvd2VkOiBbJ29yaWVudGF0aW9uJywgJ3ZhbHVldGV4dCddLFxuICB9LFxuICBzbGlkZXI6IHtcbiAgICByZXF1aXJlZDogWyd2YWx1ZW1heCcsICd2YWx1ZW1pbicsICd2YWx1ZW5vdyddLFxuICAgIGFsbG93ZWQ6IFsnb3JpZW50YXRpb24nLCAncmVhZG9ubHknLCAndmFsdWV0ZXh0J10sXG4gIH0sXG4gIHNwaW5idXR0b246IHtcbiAgICByZXF1aXJlZDogWyd2YWx1ZW1heCcsICd2YWx1ZW1pbicsICd2YWx1ZW5vdyddLFxuICAgIGFsbG93ZWQ6IFsncmVxdWlyZWQnLCAncmVhZG9ubHknLCAndmFsdWV0ZXh0J10sXG4gIH0sXG4gIHN0YXR1czoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgICBzdWJjbGFzczogWyd0aW1lciddLFxuICB9LFxuICBzdHJ1Y3R1cmU6IHtcbiAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICBzdWJjbGFzczogWydhcHBsaWNhdGlvbicsICdkb2N1bWVudCcsICdub25lJywgJ3ByZXNlbnRhdGlvbicsICdyb3dncm91cCcsICdzZWN0aW9uJywgJ3NlY3Rpb25oZWFkJywgJ3NlcGFyYXRvciddLFxuICB9LFxuICBzd2l0Y2g6IHtcbiAgICByZXF1aXJlZDogWydjaGVja2VkJ10sXG4gICAgbmFtZUZyb21Db250ZW50OiB0cnVlLFxuICB9LFxuICB0YWI6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJywgJ3Bvc2luc2V0JywgJ3NlbGVjdGVkJywgJ3NldHNpemUnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gIH0sXG4gIHRhYmxlOiB7XG4gICAgYWxsb3dlZDogWydjb2xjb3VudCcsICdleHBhbmRlZCcsICdyb3djb3VudCddLFxuICAgIHN1YmNsYXNzOiBbJ2dyaWQnXSxcbiAgfSxcbiAgdGFibGlzdDoge1xuICAgIGFsbG93ZWQ6IFsnYWN0aXZlZGVzY2VuZGFudCcsICdsZXZlbCcsICdtdWx0aXNlbGVjdGFibGUnLCAnb3JpZW50YXRpb24nXSxcbiAgfSxcbiAgdGFicGFuZWw6IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIHRlcm06IHtcbiAgICBhbGxvd2VkOiBbJ2V4cGFuZGVkJ10sXG4gIH0sXG4gIHRleHRib3g6IHtcbiAgICBhbGxvd2VkOiBbJ2FjdGl2ZWRlc2NlbmRhbnQnLCAnYXV0b2NvbXBsZXRlJywgJ211bHRpbGluZScsICdwbGFjZWhvbGRlcicsICdyZWFkb25seScsICdyZXF1aXJlZCddLFxuICAgIHN1YmNsYXNzOiBbJ3NlYXJjaGJveCddLFxuICB9LFxuICB0aW1lcjoge1xuICAgIGFsbG93ZWQ6IFsnZXhwYW5kZWQnXSxcbiAgfSxcbiAgdG9vbGJhcjoge1xuICAgIGFsbG93ZWQ6IFsnYWN0aXZlZGVzY2VuZGFudCcsICdleHBhbmRlZCcsICdvcmllbnRhdGlvbiddLFxuICB9LFxuICB0b29sdGlwOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCddLFxuICAgIG5hbWVGcm9tQ29udGVudDogdHJ1ZSxcbiAgfSxcbiAgdHJlZToge1xuICAgIGFsbG93ZWQ6IFsnYWN0aXZlZGVzY2VuZGFudCcsICdleHBhbmRlZCcsICdtdWx0aXNlbGVjdGFibGUnLCAnb3JpZW50YXRpb24nLCAncmVxdWlyZWQnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gICAgc3ViY2xhc3M6IFsndHJlZWdyaWQnXSxcbiAgfSxcbiAgdHJlZWdyaWQ6IHtcbiAgICBhbGxvd2VkOiBbJ2FjdGl2ZWRlc2NlbmRhbnQnLCAnY29sY291bnQnLCAnZXhwYW5kZWQnLCAnbGV2ZWwnLCAnbXVsdGlzZWxlY3RhYmxlJywgJ29yaWVudGF0aW9uJywgJ3JlYWRvbmx5JywgJ3JlcXVpcmVkJywgJ3Jvd2NvdW50J10sXG4gIH0sXG4gIHRyZWVpdGVtOiB7XG4gICAgYWxsb3dlZDogWydleHBhbmRlZCcsICdjaGVja2VkJywgJ2xldmVsJywgJ3Bvc2luc2V0JywgJ3NlbGVjdGVkJywgJ3NldHNpemUnXSxcbiAgICBuYW1lRnJvbUNvbnRlbnQ6IHRydWUsXG4gIH0sXG4gIHdpZGdldDoge1xuICAgIGFic3RyYWN0OiB0cnVlLFxuICAgIHN1YmNsYXNzOiBbJ2NvbW1hbmQnLCAnY29tcG9zaXRlJywgJ2dyaWRjZWxsJywgJ2lucHV0JywgJ3JhbmdlJywgJ3JvdycsICdzZXBhcmF0b3InLCAndGFiJ10sXG4gIH0sXG4gIHdpbmRvdzoge1xuICAgIGFic3RyYWN0OiB0cnVlLFxuICAgIHN1YmNsYXNzOiBbJ2RpYWxvZyddLFxuICB9LFxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiBFbnRyeSBwb2ludCBmb3Igc3RhbmRhbG9uZSBhdXRvcnVubmluZyBsaW50ZXJcbiAqL1xuY29uc3QgTGludGVyID0gcmVxdWlyZSgnLi9saW50ZXInKTtcblxubGV0IGNvbmZpZyA9IHdpbmRvdy5hY2Nlc3NpYmlsaXR5TGludGVyQ29uZmlnO1xuaWYgKCFjb25maWcpIHtcbiAgY29uc3Qgc2NyaXB0RWxlbWVudCA9IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQ7XG4gIGlmIChzY3JpcHRFbGVtZW50KSB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSBzY3JpcHRFbGVtZW50LnRleHRDb250ZW50LnRyaW0oKTtcbiAgICBpZiAoc2V0dGluZ3MpIHtcbiAgICAgIGNvbmZpZyA9IEpTT04ucGFyc2Uoc2V0dGluZ3MpO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBsaW50ZXIgPSBuZXcgTGludGVyKGNvbmZpZyk7XG5jb25zdCBzdGFydCA9ICgpID0+IHtcbiAgbGludGVyLnJ1bigpO1xuICBsaW50ZXIub2JzZXJ2ZSgpO1xufTtcblxuaWYgKC9eKDo/aW50ZXJhY3RpdmV8Y29tcGxldGUpJC8udGVzdChkb2N1bWVudC5yZWFkeVN0YXRlKSkge1xuICAvLyBEb2N1bWVudCBhbHJlYWR5IGxvYWRlZFxuICBzdGFydCgpO1xufSBlbHNlIHtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHN0YXJ0KTtcbn1cblxud2luZG93LkFjY2Vzc2liaWxpdHlMaW50ZXIgPSBMaW50ZXI7XG53aW5kb3cuYWNjZXNzaWJpbGl0eUxpbnRlciA9IGxpbnRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgUnVubmVyID0gcmVxdWlyZSgnLi9ydW5uZXInKTtcbmNvbnN0IExvZ2dlciA9IHJlcXVpcmUoJy4vbG9nZ2VyJyk7XG5jb25zdCBSdWxlID0gcmVxdWlyZSgnLi9ydWxlcy9ydWxlJyk7XG5jb25zdCBydWxlcyA9IHJlcXVpcmUoJy4vcnVsZXMnKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuY29uc3QgdmVyc2lvbiA9IHJlcXVpcmUoJy4vdmVyc2lvbicpO1xuY29uc3QgQ29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbmNvbnN0IENvbnRyYXN0ID0gcmVxdWlyZSgnLi91dGlscy9jb250cmFzdCcpO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZ2xvYmFsLXJlcXVpcmUsIGltcG9ydC9uby1keW5hbWljLXJlcXVpcmVcbmNvbnN0IHJ1bGVMaXN0ID0gbmV3IE1hcChydWxlcy5tYXAocGF0aCA9PiBbcGF0aC5yZXBsYWNlKC9cXC8vZywgJy0nKSwgcmVxdWlyZShgLi9ydWxlcy8ke3BhdGh9L3J1bGUuanNgKV0pKTtcblxuY2xhc3MgTGludGVyIGV4dGVuZHMgUnVubmVyIHtcbiAgY29uc3RydWN0b3Ioc2V0dGluZ3MpIHtcbiAgICBzZXR0aW5ncyA9IHNldHRpbmdzIHx8IHt9O1xuICAgIHNldHRpbmdzLmxvZ2dlciA9IHNldHRpbmdzLmxvZ2dlciB8fCBuZXcgTG9nZ2VyKCk7XG4gICAgc2V0dGluZ3MucnVsZXMgPSBzZXR0aW5ncy5ydWxlcyB8fCBydWxlTGlzdDtcbiAgICBzZXR0aW5ncy5jb25maWcgPSBuZXcgQ29uZmlnKHNldHRpbmdzKTtcbiAgICBzdXBlcihzZXR0aW5ncyk7XG5cbiAgICB0aGlzLnJvb3QgPSBzZXR0aW5ncy5yb290IHx8IGRvY3VtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IGxvb2tpbmcgZm9yIGlzc3Vlc1xuICAgKi9cbiAgb2JzZXJ2ZSgpIHtcbiAgICB0aGlzLm9ic2VydmVEb21DaGFuZ2VzKCk7XG4gICAgdGhpcy5vYnNlcnZlRm9jdXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wIGxvb2tpbmcgZm9yIGlzc3Vlc1xuICAgKi9cbiAgc3RvcE9ic2VydmluZygpIHtcbiAgICB0aGlzLnN0b3BPYnNlcnZpbmdEb21DaGFuZ2VzKCk7XG4gICAgdGhpcy5zdG9wT2JzZXJ2aW5nRm9jdXMoKTtcbiAgfVxuXG4gIG9ic2VydmVEb21DaGFuZ2VzKCkge1xuICAgIHRoaXMub2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB7XG4gICAgICAvLyBEZS1kdXBsaWNhdGVcbiAgICAgIGNvbnN0IG5vZGVzID0gbmV3IFNldChtdXRhdGlvbnMubWFwKChyZWNvcmQpID0+IHtcbiAgICAgICAgaWYgKHJlY29yZC50eXBlID09PSAnY2hpbGRMaXN0Jykge1xuICAgICAgICAgIHJldHVybiByZWNvcmQudGFyZ2V0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWNvcmQudGFyZ2V0LnBhcmVudE5vZGU7XG4gICAgICB9KS5maWx0ZXIoQm9vbGVhbikpO1xuXG4gICAgICAvLyBSZW1vdmUgbm9kZXMgdGhhdCBhcmUgY2hpbGRyZW4gb2Ygb3RoZXIgbm9kZXNcbiAgICAgIG5vZGVzLmZvckVhY2goKG5vZGUxKSA9PiB7XG4gICAgICAgIG5vZGVzLmZvckVhY2goKG5vZGUyKSA9PiB7XG4gICAgICAgICAgaWYgKG5vZGUyID09PSBub2RlMSB8fCAhbm9kZXMuaGFzKG5vZGUxKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobm9kZTIuY29udGFpbnMobm9kZTEpKSB7XG4gICAgICAgICAgICBub2Rlcy5kZWxldGUobm9kZTEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIC8vIFJlbW92ZSBub2RlcyB0aGF0IGFyZSBkaXNjb25uZWN0ZWRcbiAgICAgIG5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgaWYgKCFkb2N1bWVudC5jb250YWlucyhub2RlKSkge1xuICAgICAgICAgIG5vZGVzLmRlbGV0ZShub2RlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICAvLyBSdW4gdGVzdCBhZ2FpbnN0IGVhY2ggbm9kZVxuICAgICAgbm9kZXMuZm9yRWFjaChub2RlID0+IHRoaXMucnVuKG5vZGUpKTtcbiAgICB9KTtcbiAgICB0aGlzLm9ic2VydmVyLm9ic2VydmUoXG4gICAgICB0aGlzLnJvb3QsXG4gICAgICB7IHN1YnRyZWU6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSwgYXR0cmlidXRlczogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9XG4gICAgKTtcbiAgfVxuXG4gIHN0b3BPYnNlcnZpbmdEb21DaGFuZ2VzKCkge1xuICAgIGlmICh0aGlzLm9ic2VydmVyKSB7XG4gICAgICB0aGlzLm9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgIHRoaXMub2JzZXJ2ZXIgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUV2ZW50KGUpIHtcbiAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHJlc29sdmUodGhpcy5ydW4oZS50YXJnZXQpKSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3XG4gIH1cblxuICBvYnNlcnZlRm9jdXMoKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLCB7IGNhcHR1cmU6IHRydWUsIHBhc3NpdmU6IHRydWUgfSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMsIHsgY2FwdHVyZTogdHJ1ZSwgcGFzc2l2ZTogdHJ1ZSB9KTtcbiAgfVxuXG4gIHN0b3BPYnNlcnZpbmdGb2N1cygpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMsIHsgY2FwdHVyZTogdHJ1ZSwgcGFzc2l2ZTogdHJ1ZSB9KTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcywgeyBjYXB0dXJlOiB0cnVlLCBwYXNzaXZlOiB0cnVlIH0pO1xuICB9XG59XG5cbkxpbnRlci5Db25maWcgPSBDb25maWc7XG5MaW50ZXIuTG9nZ2VyID0gTG9nZ2VyO1xuTGludGVyLlJ1bGUgPSBSdWxlO1xuTGludGVyLnJ1bGVzID0gcnVsZUxpc3Q7XG5MaW50ZXJbU3ltYm9sLmZvcignYWNjZXNzaWJpbGl0eS1saW50ZXIucnVsZS1zb3VyY2VzJyldID0gcnVsZXM7XG5MaW50ZXIuVXRpbHMgPSBVdGlscztcbkxpbnRlci52ZXJzaW9uID0gdmVyc2lvbjtcbkxpbnRlci5jb2xvdXJDb250cmFzdCA9IENvbnRyYXN0LmNvbG91ckNvbnRyYXN0O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpbnRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSwgY2xhc3MtbWV0aG9kcy11c2UtdGhpcyAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBMb2dnZXIge1xuICBsb2coeyB0eXBlLCBlbCwgbWVzc2FnZSwgbmFtZSB9KSB7XG4gICAgY29uc29sZVt0eXBlXS5hcHBseShjb25zb2xlLCBbbWVzc2FnZSwgZWwsIG5hbWVdLmZpbHRlcihCb29sZWFuKSk7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IEV4dGVuZGVkQXJyYXkgPSByZXF1aXJlKCcuLi9zdXBwb3J0L2V4dGVuZGVkLWFycmF5Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUnVsZSB7XG4gIGNvbnN0cnVjdG9yKHNldHRpbmdzKSB7XG4gICAgdGhpcy50eXBlID0gJ2Vycm9yJztcbiAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuICAgIHRoaXMuc2V0RGVmYXVsdHMoKTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIHNldHRpbmdzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYW55IGRlZmF1bHQgcHJvcGVydGllcyBvbiB0aGUgcnVsZSBiZWZvcmUgdGhlIHNldHRpbmdzIGFyZSBtZXJnZWQgaW5cbiAgICovXG4gIHNldERlZmF1bHRzKCkge1xuICAgIC8vIE5vdGhpbmcgdG8gZG8gaGVyZVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biB0aGUgcnVsZVxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IFtjb250ZXh0PWRvY3VtZW50XSBUaGUgZWxlbWVudCB0byBydW4gdGhlIHJ1bGUgYWdhaW5zdFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmaWx0ZXIgQSBmaWx0ZXIgdG8gcmVtb3ZlIGVsZW1lbnRzIHRoYXQgZG9uJ3QgbmVlZCB0byBiZSB0ZXN0ZWRcbiAgICogQHBhcmFtIHtPYmplY3R9IGNhY2hlcyBVdGlsaXR5IGNhY2hlc1xuICAgKiBAcmV0dXJucyB7U3RyaW5nfFN0cmluZ1tdfG51bGx9IFplcm8gb3IgbW9yZSBlcnJvciBtZXNzYWdlc1xuICAgKi9cbiAgcnVuKGNvbnRleHQsIGZpbHRlciA9ICgpID0+IHRydWUsIHV0aWxzKSB7XG4gICAgcmV0dXJuIHV0aWxzLiQkKHRoaXMuc2VsZWN0b3IodXRpbHMpLCBjb250ZXh0KVxuICAgICAgLmZpbHRlcihmaWx0ZXIpXG4gICAgICAubWFwKGVsID0+IChcbiAgICAgICAgRXh0ZW5kZWRBcnJheS5vZih0aGlzLnRlc3QoZWwsIHV0aWxzKSlcbiAgICAgICAgICAuZmxhdHRlbigpXG4gICAgICAgICAgLmNvbXBhY3QoKVxuICAgICAgICAgIC5tYXAobWVzc2FnZSA9PiAoeyBlbCwgbWVzc2FnZSB9KSlcbiAgICAgICkpXG4gICAgICAuZmxhdHRlbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzZWxlY3RvciB0byBzZWxlY3QgaW52YWxpZCBlbGVtZW50c1xuICAgKi9cbiAgc2VsZWN0b3IoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2xhc3MtbWV0aG9kcy11c2UtdGhpc1xuICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkJyk7XG4gIH1cblxuICAvKipcbiAgICogVGVzdCBpZiBhbiBlbGVtZW50IGlzIGludmFsaWRcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbCBUaGUgZWxlbWVudCB0byB0ZXN0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSB1dGlscyBVdGlsaXRpZXNcbiAgICogQHJldHVybnMge1N0cmluZ3xTdHJpbmdbXXxudWxsfSBaZXJvIG9yIG1vcmUgZXJyb3IgbWVzc2FnZXNcbiAgICovXG4gIHRlc3QoZWwsIHV0aWxzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBpbXBsZW1lbnRlZCcpO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbmNvbnN0IFNldENhY2hlID0gcmVxdWlyZSgnLi9zdXBwb3J0L3NldC1jYWNoZScpO1xuXG5jb25zdCBkdW1teUNhY2hlID0ge1xuICBhZGQoKSB7fSxcbiAgc2V0KCkge30sXG4gIGhhcygpIHsgcmV0dXJuIGZhbHNlOyB9LFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSdW5uZXIge1xuICBjb25zdHJ1Y3RvcihzZXR0aW5ncykge1xuICAgIGNvbnN0IGdsb2JhbFNldHRpbmdzID0ge307XG4gICAgaWYgKHNldHRpbmdzLmRlZmF1bHRPZmYpIHtcbiAgICAgIGdsb2JhbFNldHRpbmdzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlUmVwb3J0ZWQgPSBzZXR0aW5ncy5jYWNoZVJlcG9ydGVkICE9PSBmYWxzZTtcbiAgICB0aGlzLnJ1bGVTZXR0aW5ncyA9IHNldHRpbmdzLnJ1bGVTZXR0aW5ncyB8fCB7fTtcbiAgICB0aGlzLmNvbmZpZyA9IHNldHRpbmdzLmNvbmZpZztcblxuICAgIHRoaXMucnVsZXMgPSBuZXcgTWFwKEFycmF5LmZyb20oc2V0dGluZ3MucnVsZXMpXG4gICAgICAubWFwKChbbmFtZSwgUnVsZV0pID0+IFtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgbmV3IFJ1bGUoT2JqZWN0LmFzc2lnbih7IG5hbWUgfSwgZ2xvYmFsU2V0dGluZ3MsIHRoaXMucnVsZVNldHRpbmdzW25hbWVdKSksXG4gICAgICBdKVxuICAgICk7XG5cbiAgICB0aGlzLmlnbm9yZUF0dHJpYnV0ZSA9IHNldHRpbmdzLmlnbm9yZUF0dHJpYnV0ZSB8fCAnZGF0YS1hY2Nlc3NpYmlsaXR5LWxpbnRlci1pZ25vcmUnO1xuXG4gICAgdGhpcy53aGl0ZWxpc3QgPSBzZXR0aW5ncy53aGl0ZWxpc3Q7XG4gICAgdGhpcy5sb2dnZXIgPSBzZXR0aW5ncy5sb2dnZXI7XG5cbiAgICBpZiAodGhpcy5jYWNoZVJlcG9ydGVkKSB7XG4gICAgICB0aGlzLnJlcG9ydGVkID0gbmV3IFNldENhY2hlKCk7XG4gICAgICB0aGlzLndoaXRlbGlzdGVkID0gbmV3IFNldENhY2hlKCk7XG4gICAgICB0aGlzLmdsb2JhbFdoaXRlbGlzdGVkID0gbmV3IFdlYWtTZXQoKTtcbiAgICAgIHRoaXMuaWdub3JlZCA9IG5ldyBTZXRDYWNoZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlcG9ydGVkID0gdGhpcy53aGl0ZWxpc3RlZCA9IHRoaXMuZ2xvYmFsV2hpdGVsaXN0ZWQgPSB0aGlzLmlnbm9yZWQgPSBkdW1teUNhY2hlO1xuICAgIH1cblxuICAgIHRoaXMudXRpbHMgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhbGwgdGhlIHJ1bGVzXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtjb250ZXh0XSBBIGNvbnRleHQgdG8gcnVuIHRoZSBydWxlcyB3aXRoaW5cbiAgICovXG4gIHJ1bihjb250ZXh0KSB7XG4gICAgdGhpcy51dGlscyA9IG5ldyBVdGlscyh0aGlzLmNvbmZpZyk7XG4gICAgQXJyYXkuZnJvbSh0aGlzLnJ1bGVzLnZhbHVlcygpKVxuICAgICAgLmZpbHRlcihydWxlID0+IHJ1bGUuZW5hYmxlZClcbiAgICAgIC5mb3JFYWNoKHJ1bGUgPT4gdGhpcy5ydW5JbnRlcm5hbChydWxlLCBjb250ZXh0LCAoZWwsIG5hbWUpID0+IHRoaXMuZmlsdGVyKGVsLCBuYW1lKSkpO1xuICAgIHRoaXMudXRpbHMgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBvbmUgcnVsZSByZWdhcmRsZXNzIG9mIGl0IGJlaW5nIGVuYWJsZWRcbiAgICogQG5hbWUge1N0cmluZ3xSdWxlfSBydWxlIEEgcnVsZSBvciBuYW1lIG9mIGEgcnVsZVxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBbY29udGV4dF0gQSBjb250ZXh0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbd2hpdGVsaXN0XSBPcHRpb25hbGx5IGEgd2hpdGVsaXN0XG4gICAqL1xuICBydW5SdWxlKHJ1bGUsIHsgY29udGV4dCwgd2hpdGVsaXN0LCBydWxlU2V0dGluZ3MgfSA9IHt9KSB7XG4gICAgaWYgKHR5cGVvZiBydWxlID09PSAnc3RyaW5nJykge1xuICAgICAgcnVsZSA9IHRoaXMucnVsZXMuZ2V0KHJ1bGUpO1xuICAgIH1cblxuICAgIGNvbnN0IHJ1bm5lciA9IG5ldyBSdW5uZXIoe1xuICAgICAgcnVsZXM6IG5ldyBNYXAoW1tydWxlLm5hbWUsIHJ1bGUuY29uc3RydWN0b3JdXSksXG4gICAgICB3aGl0ZWxpc3Q6IHdoaXRlbGlzdCB8fCB0aGlzLndoaXRlbGlzdCxcbiAgICAgIGxvZ2dlcjogdGhpcy5sb2dnZXIsXG4gICAgICBydWxlU2V0dGluZ3M6IHtcbiAgICAgICAgW3J1bGUubmFtZV06IE9iamVjdC5hc3NpZ24oXG4gICAgICAgICAge30sXG4gICAgICAgICAgcnVsZVNldHRpbmdzIHx8IHRoaXMucnVsZVNldHRpbmdzW3J1bGUubmFtZV0gfHwge30sXG4gICAgICAgICAgeyBlbmFibGVkOiB0cnVlIH1cbiAgICAgICAgKSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBydW5uZXIucnVuKGNvbnRleHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbHRlciBpZiB0aGUgZWxlbWVudCBoYXMgYWxyZWFkeSByZXBvcnRlZCBvbiB0aGlzIHJ1bGUgb3IgaXMgZXhjbHVkZWQgZnJvbSB0aGlzIHJ1bGVcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZpbHRlcihlbCwgbmFtZSkge1xuICAgIHJldHVybiB0aGlzLm5vdFdoaXRlbGlzdGVkKGVsLCBuYW1lKVxuICAgICAgJiYgdGhpcy5ub3RJZ25vcmVkKGVsLCBuYW1lKVxuICAgICAgJiYgdGhpcy5ub3RSZXBvcnRlZChlbCwgbmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogUnVuIGEgc2luZ2xlIHJ1bGVcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHJ1bkludGVybmFsKHJ1bGUsIGNvbnRleHQgPSBkb2N1bWVudCwgZmlsdGVyKSB7XG4gICAgcnVsZS5ydW4oY29udGV4dCwgZWwgPT4gZmlsdGVyKGVsLCBydWxlLm5hbWUpLCB0aGlzLnV0aWxzKVxuICAgICAgLmZvckVhY2goKGlzc3VlKSA9PiB7XG4gICAgICAgIHRoaXMucmVwb3J0ZWQuc2V0KGlzc3VlLmVsLCBydWxlLm5hbWUpO1xuICAgICAgICB0aGlzLmxvZ2dlci5sb2coT2JqZWN0LmFzc2lnbih7IG5hbWU6IHJ1bGUubmFtZSwgdHlwZTogcnVsZS50eXBlIH0sIGlzc3VlKSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYXMgdGhpcyBhbHJlYWR5IGJlZW4gcmVwb3J0ZWQgZm9yIHRoaXMgZWxlbWVudFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgbm90UmVwb3J0ZWQoZWwsIG5hbWUpIHtcbiAgICByZXR1cm4gIXRoaXMucmVwb3J0ZWQuaGFzKGVsLCBuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJcyB0aGlzIGVsZW1lbnQgZXhjbHVkZWQgYnkgYSB3aGl0ZWxpc3RcbiAgICogQHByaXZhdGVcbiAgICovXG4gIG5vdFdoaXRlbGlzdGVkKGVsLCBuYW1lKSB7XG4gICAgaWYgKHRoaXMuZ2xvYmFsV2hpdGVsaXN0ZWQuaGFzKGVsKSB8fCB0aGlzLndoaXRlbGlzdGVkLmhhcyhlbCwgbmFtZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy53aGl0ZWxpc3QgJiYgZWwubWF0Y2hlcyh0aGlzLndoaXRlbGlzdCkpIHtcbiAgICAgIHRoaXMuZ2xvYmFsV2hpdGVsaXN0ZWQuYWRkKGVsKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCB3aGl0ZWxpc3QgPSB0aGlzLnJ1bGVTZXR0aW5nc1tuYW1lXSAmJiB0aGlzLnJ1bGVTZXR0aW5nc1tuYW1lXS53aGl0ZWxpc3Q7XG4gICAgaWYgKHdoaXRlbGlzdCAmJiBlbC5tYXRjaGVzKHdoaXRlbGlzdCkpIHtcbiAgICAgIHRoaXMud2hpdGVsaXN0ZWQuc2V0KGVsLCBuYW1lKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJcyB0aGlzIGVsZW1lbnQgZXhjbHVkZWQgYnkgYW4gYXR0cmlidXRlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBub3RJZ25vcmVkKGVsLCBydWxlTmFtZSkge1xuICAgIGlmICh0aGlzLmlnbm9yZWQuaGFzKGVsLCBydWxlTmFtZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBpZ25vcmUgPSBlbC5tYXRjaGVzKFxuICAgICAgYFske3RoaXMuaWdub3JlQXR0cmlidXRlfT1cIlwiXSxbJHt0aGlzLmlnbm9yZUF0dHJpYnV0ZX1+PVwiJHt0aGlzLnV0aWxzLmNzc0VzY2FwZShydWxlTmFtZSl9XCJdYFxuICAgICk7XG5cbiAgICBpZiAoaWdub3JlKSB7XG4gICAgICB0aGlzLmlnbm9yZWQuc2V0KGVsLCBydWxlTmFtZSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8vIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9odG1sNTIvaW5mcmFzdHJ1Y3R1cmUuaHRtbCNjb21tb24tcGFyc2VyLWlkaW9tc1xuZXhwb3J0cy5yU3BhY2UgPSAvWyBcXHRcXG5cXGZcXHJdKy87XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICogQ2FjaGluZyBmb3IgZWxlbWVudCB2YWx1ZXNcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgY2xhc3MtbWV0aG9kcy11c2UtdGhpcyAqL1xuXG5mdW5jdGlvbiBnZXRPclNldChjYWNoZSwga2V5LCBzZXR0ZXIpIHtcbiAgaWYgKGNhY2hlLmhhcyhrZXkpKSB7XG4gICAgcmV0dXJuIGNhY2hlLmdldChrZXkpO1xuICB9XG4gIGNvbnN0IHZhbHVlID0gc2V0dGVyKCk7XG4gIGNhY2hlLnNldChrZXksIHZhbHVlKTtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVsZW1lbnRDYWNoZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2NhY2hlID0gbmV3IFdlYWtNYXAoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIGtleSBmcm9tIHRoZSBvcHRpb25zIHN1cHBsaWVkIHRvIGtleVxuICAgKi9cbiAga2V5KGVsLCBrZXkpIHtcbiAgICByZXR1cm4ga2V5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgc3RvcmVkIHZhbHVlXG4gICAqL1xuICBzZXR0ZXIoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdub3QgaW1wbGVtZW50ZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAgR2V0IGEgdmFsdWVcbiAgICogIEBwYXJhbSB7T2JqZWN0fSBlbCBBIGtleSB0byBjYWNoZSBhZ2FpbnN0XG4gICAqL1xuICBnZXQoZWwpIHtcbiAgICBjb25zdCBtYXAgPSBnZXRPclNldCh0aGlzLl9jYWNoZSwgZWwsICgpID0+IG5ldyBNYXAoKSk7XG4gICAgY29uc3Qgb3B0aW9uc0tleSA9IHRoaXMua2V5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIGdldE9yU2V0KG1hcCwgb3B0aW9uc0tleSwgKCkgPT4gdGhpcy5zZXR0ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRXh0ZW5kZWRBcnJheSBleHRlbmRzIEFycmF5IHtcbiAgdGFwKGZuKSB7XG4gICAgZm4odGhpcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bmlxdWUoKSB7XG4gICAgY29uc3Qgc2V0ID0gbmV3IFNldCgpO1xuICAgIHJldHVybiB0aGlzLmZpbHRlcihpdGVtID0+IChzZXQuaGFzKGl0ZW0pID8gZmFsc2UgOiBzZXQuYWRkKGl0ZW0pKSk7XG4gIH1cblxuICBncm91cEJ5KGZuKSB7XG4gICAgY29uc3QgbWFwID0gbmV3IE1hcCgpO1xuICAgIHRoaXMuZm9yRWFjaCgoaXRlbSwgaSwgYXIpID0+IHtcbiAgICAgIGNvbnN0IGtleSA9IGZuKGl0ZW0sIGksIGFyKTtcbiAgICAgIGlmIChtYXAuaGFzKGtleSkpIHtcbiAgICAgICAgbWFwLmdldChrZXkpLnB1c2goaXRlbSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXAuc2V0KGtleSwgRXh0ZW5kZWRBcnJheS5vZihpdGVtKSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIEV4dGVuZGVkQXJyYXkuZnJvbShtYXAudmFsdWVzKCkpO1xuICB9XG5cbiAgY29tcGFjdCgpIHtcbiAgICByZXR1cm4gdGhpcy5maWx0ZXIoQm9vbGVhbik7XG4gIH1cblxuICBmbGF0dGVuKCkge1xuICAgIGxldCByZXN1bHQgPSBuZXcgRXh0ZW5kZWRBcnJheSgpO1xuICAgIHRoaXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbSkpIHtcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChFeHRlbmRlZEFycmF5LmZyb20oaXRlbSkuZmxhdHRlbigpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWxlbWVudENhY2hlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fY2FjaGUgPSBuZXcgV2Vha01hcCgpO1xuICB9XG5cbiAgaGFzKGVsLCB2YWx1ZSkge1xuICAgIGNvbnN0IHNldCA9IHRoaXMuX2NhY2hlLmdldChlbCk7XG4gICAgaWYgKCFzZXQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHNldC5oYXModmFsdWUpO1xuICB9XG5cbiAgc2V0KGVsLCB2YWx1ZSkge1xuICAgIGxldCBzZXQgPSB0aGlzLl9jYWNoZS5nZXQoZWwpO1xuICAgIGlmICghc2V0KSB7XG4gICAgICBzZXQgPSBuZXcgU2V0KCk7XG4gICAgICB0aGlzLl9jYWNoZS5zZXQoZWwsIHNldCk7XG4gICAgfVxuICAgIHNldC5hZGQodmFsdWUpO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKipcbiAqICBEYXRhIGFuZCBmdW5jdGlvbnMgZm9yIGFyaWEgdmFsaWRhdGlvbi4gIEJhc2VkIG9uXG4gKiAgLSBodHRwczovL3d3dy53My5vcmcvVFIvd2FpLWFyaWEtMS4xL1xuICogIC0gaHR0cHM6Ly93d3cudzMub3JnL1RSL2h0bWw1Mi9cbiAqL1xuY29uc3QgRXh0ZW5kZWRBcnJheSA9IHJlcXVpcmUoJy4uL3N1cHBvcnQvZXh0ZW5kZWQtYXJyYXknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBBcmlhIHtcbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gIH1cblxuICAvKipcbiAgICogQW4gb2JqZWN0IHdpdGggdGhlIHJvbGUgc2V0dGluZ3MgZm9yIHRoZSBlbGVtZW50XG4gICAqIEB0eXBlIHtPYmplY3RbXX1cbiAgICovXG4gIGFsbG93ZWQoZWwpIHtcbiAgICBjb25zdCBuYW1lID0gZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBsZXQgZm91bmQgPSB0aGlzLmNvbmZpZy5hbGxvd2VkQXJpYVtuYW1lXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShmb3VuZCkpIHtcbiAgICAgIGZvdW5kID0gZm91bmQuZmluZChpdGVtID0+IChcbiAgICAgICAgaXRlbS5zZWxlY3RvciA9PT0gJyonIHx8ICh0eXBlb2YgaXRlbS5zZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJyA/IGl0ZW0uc2VsZWN0b3IoZWwsIHRoaXMpIDogZWwubWF0Y2hlcyhpdGVtLnNlbGVjdG9yKSlcbiAgICAgICkpO1xuICAgIH1cbiAgICByZXR1cm4gZm91bmQgfHwgdGhpcy5jb25maWcuYWxsb3dlZEFyaWEuX2RlZmF1bHQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBlbGVtZW50cyBjdXJyZW50IHJvbGUgYmFzZWQgb24gdGhlIHJvbGUgYXR0cmlidXRlIG9yIGltcGxpY2l0IHJvbGVcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICAgKiBAcmV0dXJucyB7U3RyaW5nfG51bGx9XG4gICAqL1xuICBnZXRSb2xlKGVsLCBhbGxvd2VkKSB7XG4gICAgbGV0IHJvbGUgPSBudWxsO1xuICAgIC8vIFNob3VsZCBiZSB0aGUgZmlyc3Qgbm9uLWFic3RyYWN0IHJvbGUgaW4gdGhlIGxpc3RcbiAgICBpZiAoKGVsLmdldEF0dHJpYnV0ZSgncm9sZScpIHx8ICcnKS5zcGxpdCgvXFxzKy8pLmZpbHRlcihCb29sZWFuKS5zb21lKChuYW1lKSA9PiB7XG4gICAgICBpZiAodGhpcy5jb25maWcucm9sZXNbbmFtZV0gJiYgIXRoaXMuY29uZmlnLnJvbGVzW25hbWVdLmFic3RyYWN0KSB7XG4gICAgICAgIHJvbGUgPSBuYW1lO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KSkge1xuICAgICAgcmV0dXJuIHJvbGU7XG4gICAgfVxuICAgIGFsbG93ZWQgPSBhbGxvd2VkIHx8IHRoaXMuYWxsb3dlZChlbCk7XG4gICAgcmV0dXJuIGFsbG93ZWQuaW1wbGljaXRbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEb2VzIGFuIGVsZW1lbnQgaGF2ZSBhIHJvbGUuIFRoaXMgd2lsbCB0ZXN0IGFnYWluc3QgYWJzdHJhY3Qgcm9sZXNcbiAgICogQHBhcmFtIHtFbGVtZW50fFN0cmluZ3xudWxsfSB0YXJnZXRcbiAgICogQHBhcmFtIHtTdHJpbmd8U3RyaW5nW119IG5hbWVcbiAgICogQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy5leHRhY3Q9ZmFsc2VdIE1hdGNoIGFnYWluc3QgYWJzdHJhY3Qgcm9sZXNcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBoYXNSb2xlKHRhcmdldCwgbmFtZSwgeyBleGFjdCA9IGZhbHNlIH0gPSB7fSkge1xuICAgIGlmICh0YXJnZXQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgYWN0dWFsUm9sZSA9IHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnID8gdGFyZ2V0IDogdGhpcy5nZXRSb2xlKHRhcmdldCk7XG4gICAgaWYgKCFhY3R1YWxSb2xlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBbXS5jb25jYXQobmFtZSkuc29tZShmdW5jdGlvbiBoYXNSb2xlKGNoZWNrUm9sZSkge1xuICAgICAgaWYgKGNoZWNrUm9sZSA9PT0gYWN0dWFsUm9sZSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAhZXhhY3QgJiYgKHRoaXMuY29uZmlnLnJvbGVzW2NoZWNrUm9sZV0uc3ViY2xhc3MgfHwgW10pLnNvbWUoaGFzUm9sZSwgdGhpcyk7XG4gICAgfSwgdGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogRmluZCB0aGUgY2xvc2VzdCBlbGVtZW50IHdpdGggdGhlIHNwZWNpZmllZCByb2xlKHMpXG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAgICogQHBhcmFtIHtTdHJpbmd8U3RyaW5nW119IHJvbGVcbiAgICogQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy5leGFjdD1mYWxzZV1cbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBjbG9zZXN0Um9sZShlbCwgcm9sZSwgeyBleGFjdCA9IGZhbHNlIH0gPSB7fSkge1xuICAgIGNvbnN0IHJvbGVzID0gW10uY29uY2F0KHJvbGUpO1xuICAgIGxldCBjdXJzb3IgPSBlbDtcbiAgICB3aGlsZSAoKGN1cnNvciA9IGN1cnNvci5wYXJlbnROb2RlKSAmJiBjdXJzb3Iubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbG9vcC1mdW5jXG4gICAgICBpZiAocm9sZXMuc29tZShuYW1lID0+IHRoaXMuaGFzUm9sZShjdXJzb3IsIG5hbWUsIHsgZXhhY3QgfSkpKSB7XG4gICAgICAgIHJldHVybiBjdXJzb3I7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcm9sZXNPZlR5cGUobmFtZSkge1xuICAgIGNvbnN0IHJvbGVzID0gbmV3IEV4dGVuZGVkQXJyYXkoKTtcbiAgICBjb25zdCByb2xlID0gdGhpcy5jb25maWcucm9sZXNbbmFtZV07XG4gICAgaWYgKCFyb2xlLmFic3RyYWN0KSB7XG4gICAgICByb2xlcy5wdXNoKG5hbWUpO1xuICAgIH1cbiAgICBpZiAocm9sZS5zdWJjbGFzcykge1xuICAgICAgcm9sZXMucHVzaChyb2xlLnN1YmNsYXNzLm1hcCh0aGlzLnJvbGVzT2ZUeXBlLCB0aGlzKSk7XG4gICAgfVxuICAgIHJldHVybiByb2xlcy5mbGF0dGVuKCk7XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8vIEx1bWlub3NpdHkgY2FsY3VsYXRpb25cbi8qIGVzbGludC1kaXNhYmxlIGNsYXNzLW1ldGhvZHMtdXNlLXRoaXMgKi9cblxuZnVuY3Rpb24gZ2FtbWEodmFsdWUpIHtcbiAgY29uc3QgbiA9IHZhbHVlIC8gMjU1O1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcmVzdHJpY3RlZC1wcm9wZXJ0aWVzXG4gIHJldHVybiBuIDw9IDAuMDM5MjggPyBuIC8gMTIuOTIgOiBNYXRoLnBvdygoKG4gKyAwLjA1NSkgLyAxLjA1NSksIDIuNCk7XG59XG5cbmZ1bmN0aW9uIGJsZW5kQWxwaGEocywgZCkge1xuICByZXR1cm4gcyArIChkICogKDEgLSBzKSk7XG59XG5cbmZ1bmN0aW9uIGJsZW5kQ2hhbm5lbChzYywgZGMsIHNhLCBkYSwgYmEpIHtcbiAgcmV0dXJuICgoc2MgKiBzYSkgKyAoZGMgKiBkYSAqICgxIC0gc2EpKSkgLyBiYTtcbn1cblxuZnVuY3Rpb24gYmxlbmQoY29sb3Vycykge1xuICBsZXQgW3IsIGcsIGIsIGFdID0gWzAsIDAsIDAsIDBdO1xuICBjb2xvdXJzLnJldmVyc2UoKS5mb3JFYWNoKChbX3IsIF9nLCBfYiwgX2FdKSA9PiB7XG4gICAgY29uc3QgYU5ldyA9IGJsZW5kQWxwaGEoX2EsIGEpO1xuICAgIHIgPSBibGVuZENoYW5uZWwoX3IsIHIsIF9hLCBhLCBhTmV3KTtcbiAgICBnID0gYmxlbmRDaGFubmVsKF9nLCBnLCBfYSwgYSwgYU5ldyk7XG4gICAgYiA9IGJsZW5kQ2hhbm5lbChfYiwgYiwgX2EsIGEsIGFOZXcpO1xuICAgIGEgPSBhTmV3O1xuICB9KTtcbiAgcmV0dXJuIFtNYXRoLnJvdW5kKHIpLCBNYXRoLnJvdW5kKGcpLCBNYXRoLnJvdW5kKGIpLCBhXTtcbn1cblxuZnVuY3Rpb24gbHVtaW5vc2l0eShyLCBnLCBiKSB7XG4gIC8vIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1JlbGF0aXZlX2x1bWluYW5jZVxuICByZXR1cm4gKDAuMjEyNiAqIGdhbW1hKHIpKSArICgwLjcxNTIgKiBnYW1tYShnKSkgKyAoMC4wNzIyICogZ2FtbWEoYikpO1xufVxuXG5mdW5jdGlvbiBjb250cmFzdFJhdGlvKGwxLCBsMikge1xuICAvLyBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMtV0NBRzIwLTIwMDgxMjExLyNjb250cmFzdC1yYXRpb2RlZlxuICBpZiAobDEgPCBsMikge1xuICAgIFtsMiwgbDFdID0gW2wxLCBsMl07XG4gIH1cbiAgcmV0dXJuIChsMSArIDAuMDUpIC8gKGwyICsgMC4wNSk7XG59XG5cbi8vIENvbnZlcnQgYSBDU1MgY29sb3VyIHRvIGFuIGFycmF5IG9mIFJHQkEgdmFsdWVzXG5mdW5jdGlvbiB0b1JnYmFBcnJheShzdHlsZSkge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBlbC5zdHlsZS5jb2xvciA9IHN0eWxlO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcbiAgY29uc3QgdmFsdWUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCkuY29sb3I7XG4gIGlmICghdmFsdWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VuYWJsZSB0byBwYXJzZSBjb2xvdXInKTtcbiAgfVxuICByZXR1cm4gY29sb3VyUGFydHModmFsdWUpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZS1iZWZvcmUtZGVmaW5lXG59XG5cbi8qKlxuICogR2l2ZW4gYSBjb2xvdXIgaW4gcmdiYSBvciByZ2IgZm9ybWF0LCBnZXQgaXRzIHBhcnRzXG4gKiBUaGUgcGFydHMgc2hvdWxkIGJlIGluIHRoZSByYW5nZSAwIHRvIDFcbiAqL1xuZnVuY3Rpb24gY29sb3VyUGFydHMoY29sb3VyKSB7XG4gIGlmIChjb2xvdXIgPT09ICd0cmFuc3BhcmVudCcpIHtcbiAgICByZXR1cm4gWzAsIDAsIDAsIDBdO1xuICB9XG4gIGNvbnN0IG1hdGNoID0gY29sb3VyLm1hdGNoKC9ecmdiYT9cXCgoXFxkKyksICooXFxkKyksICooXFxkKykoPzosICooXFxkKyg/OlxcLlxcZCspPykpP1xcKSQvKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuIFsrbWF0Y2hbMV0sICttYXRjaFsyXSwgK21hdGNoWzNdLCBtYXRjaFs0XSA/IHBhcnNlRmxvYXQobWF0Y2hbNF0pIDogMV07XG4gIH1cbiAgcmV0dXJuIHRvUmdiYUFycmF5KGNvbG91cik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ29udHJhc3Qge1xuICBjb25zdHJ1Y3RvcihzdHlsZUNhY2hlKSB7XG4gICAgdGhpcy5zdHlsZUNhY2hlID0gc3R5bGVDYWNoZTtcbiAgfVxuXG4gIHRleHRDb250cmFzdChlbCkge1xuICAgIHJldHVybiBjb250cmFzdFJhdGlvKHRoaXMuX3RleHRMdW1pbm9zaXR5KGVsKSwgdGhpcy5fYmFja2dyb3VuZEx1bWlub3NpdHkoZWwpKTtcbiAgfVxuXG4gIF9ibGVuZFdpdGhCYWNrZ3JvdW5kKGNvbG91ciwgZWwpIHtcbiAgICBpZiAoY29sb3VyWzNdID09PSAxKSB7XG4gICAgICByZXR1cm4gY29sb3VyO1xuICAgIH1cbiAgICBjb25zdCBjb2xvdXJTdGFjayA9IFtjb2xvdXJdO1xuICAgIGxldCBjdXJzb3IgPSBlbDtcbiAgICBsZXQgY3VycmVudENvbG91ciA9IGNvbG91cjtcbiAgICBkbyB7XG4gICAgICBsZXQgYmFja2dyb3VuZDtcbiAgICAgIGlmIChjdXJzb3IgPT09IGRvY3VtZW50KSB7XG4gICAgICAgIC8vIEkgYXNzdW1lIHRoaXMgaXMgYWx3YXlzIHRoZSBjYXNlP1xuICAgICAgICBiYWNrZ3JvdW5kID0gWzI1NSwgMjU1LCAyNTUsIDFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFja2dyb3VuZCA9IGNvbG91clBhcnRzKHRoaXMuc3R5bGVDYWNoZS5nZXQoY3Vyc29yLCAnYmFja2dyb3VuZENvbG9yJykpO1xuICAgICAgfVxuICAgICAgY3VycmVudENvbG91ciA9IGJhY2tncm91bmQ7XG4gICAgICBpZiAoY3VycmVudENvbG91clszXSAhPT0gMCkge1xuICAgICAgICBjb2xvdXJTdGFjay5wdXNoKGN1cnJlbnRDb2xvdXIpO1xuICAgICAgfVxuICAgIH0gd2hpbGUgKGN1cnJlbnRDb2xvdXJbM10gIT09IDEgJiYgKGN1cnNvciA9IGN1cnNvci5wYXJlbnROb2RlKSk7XG4gICAgcmV0dXJuIGJsZW5kKGNvbG91clN0YWNrKTtcbiAgfVxuXG4gIHRleHRDb2xvdXIoZWwpIHtcbiAgICBjb25zdCBjb2xvdXIgPSBjb2xvdXJQYXJ0cyh0aGlzLnN0eWxlQ2FjaGUuZ2V0KGVsLCAnY29sb3InKSk7XG4gICAgcmV0dXJuIHRoaXMuX2JsZW5kV2l0aEJhY2tncm91bmQoY29sb3VyLCBlbCk7XG4gIH1cblxuICBiYWNrZ3JvdW5kQ29sb3VyKGVsKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JsZW5kV2l0aEJhY2tncm91bmQoWzAsIDAsIDAsIDBdLCBlbCk7XG4gIH1cblxuICBfdGV4dEx1bWlub3NpdHkoZWwpIHtcbiAgICByZXR1cm4gbHVtaW5vc2l0eS5hcHBseShudWxsLCB0aGlzLnRleHRDb2xvdXIoZWwpKTtcbiAgfVxuXG4gIF9iYWNrZ3JvdW5kTHVtaW5vc2l0eShlbCkge1xuICAgIHJldHVybiBsdW1pbm9zaXR5LmFwcGx5KG51bGwsIHRoaXMuYmFja2dyb3VuZENvbG91cihlbCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBjb250cmFzdCBiZXR3ZWVuIHR3byBjb2xvdXJzXG4gICAqL1xuICBzdGF0aWMgY29sb3VyQ29udHJhc3QoZm9yZWdyb3VuZCwgYmFja2dyb3VuZCkge1xuICAgIGZvcmVncm91bmQgPSBjb2xvdXJQYXJ0cyhmb3JlZ3JvdW5kKTtcbiAgICBiYWNrZ3JvdW5kID0gY29sb3VyUGFydHMoYmFja2dyb3VuZCk7XG4gICAgaWYgKGJhY2tncm91bmRbM10gIT09IDEpIHtcbiAgICAgIGJhY2tncm91bmQgPSBibGVuZChbYmFja2dyb3VuZCwgWzI1NSwgMjU1LCAyNTUsIDFdXSk7XG4gICAgfVxuICAgIGlmIChmb3JlZ3JvdW5kWzNdICE9PSAxKSB7XG4gICAgICBmb3JlZ3JvdW5kID0gYmxlbmQoW2ZvcmVncm91bmQsIGJhY2tncm91bmRdKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRyYXN0UmF0aW8oXG4gICAgICBsdW1pbm9zaXR5LmFwcGx5KG51bGwsIGZvcmVncm91bmQpLFxuICAgICAgbHVtaW5vc2l0eS5hcHBseShudWxsLCBiYWNrZ3JvdW5kKVxuICAgICk7XG4gIH1cbn07XG5cbi8vIFRoZSBmb2xsb3dpbmcgYXJlIGV4cG9zZWQgZm9yIHVuaXQgdGVzdGluZ1xubW9kdWxlLmV4cG9ydHMucHJvdG90eXBlLl9ibGVuZCA9IGJsZW5kO1xubW9kdWxlLmV4cG9ydHMucHJvdG90eXBlLl9sdW1pbm9zaXR5ID0gbHVtaW5vc2l0eTtcbm1vZHVsZS5leHBvcnRzLnByb3RvdHlwZS5fY29sb3VyUGFydHMgPSBjb2xvdXJQYXJ0cztcbm1vZHVsZS5leHBvcnRzLnByb3RvdHlwZS5fY29udHJhc3RSYXRpbyA9IGNvbnRyYXN0UmF0aW87XG4iLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3NzRXNjYXBlKG5hbWUpIHtcbiAgcmV0dXJuIG5hbWUucmVwbGFjZSgvW1wiXFxcXF0vZywgJ1xcXFwkJicpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiAgRGV0ZXJtaW5lIGlmIGFuIGVsZW1lbnQgaXMgaGlkZGVuIG9yIG5vdFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBjbGFzcy1tZXRob2RzLXVzZS10aGlzICovXG5cbmNvbnN0IEVsZW1lbnRDYWNoZSA9IHJlcXVpcmUoJy4uL3N1cHBvcnQvZWxlbWVudC1jYWNoZScpO1xuXG4vLyBFbGVtZW50cyB0aGF0IGRvbid0IGhhdmUgY2xpZW50IHJlY3RhbmdsZXNcbmNvbnN0IG5vUmVjdHMgPSBbJ2JyJywgJ3diciddO1xuXG4vLyBJcyB0aGUgZWxlbWVudCBoaWRkZW4gdXNpbmcgQ1NTXG5mdW5jdGlvbiBjc3NIaWRkZW4oZWwsIHN0eWxlKSB7XG4gIHJldHVybiBzdHlsZS5nZXQoZWwsICd2aXNpYmlsaXR5JykgIT09ICd2aXNpYmxlJyB8fCBzdHlsZS5nZXQoZWwsICdkaXNwbGF5JykgPT09ICdub25lJztcbn1cblxuLy8gSXMgdGhlIGVsZW1lbnQgaGlkZGVuIGZyb20gYWNjZXNzaWJpbGl0eSBzb2Z0d2FyZVxuZnVuY3Rpb24gaGlkZGVuKGVsLCBzdHlsZSwgYXJpYUhpZGRlbiA9IGZhbHNlKSB7XG4gIGlmIChlbCA9PT0gZG9jdW1lbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIChhcmlhSGlkZGVuICYmIGVsLmdldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKSA9PT0gJ3RydWUnKVxuICAgIHx8ICghbm9SZWN0cy5pbmNsdWRlcyhlbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSAmJiBlbC5nZXRDbGllbnRSZWN0cygpLmxlbmd0aCA9PT0gMClcbiAgICB8fCAoYXJpYUhpZGRlbiAmJiAhIWVsLmNsb3Nlc3QoJ1thcmlhLWhpZGRlbj10cnVlXScpKVxuICAgIHx8IGNzc0hpZGRlbihlbCwgc3R5bGUpO1xufVxuXG4vKipcbiAqICBDYWNoZSBvZiBoaWRkZW4gZWxlbWVudFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEhpZGRlbiBleHRlbmRzIEVsZW1lbnRDYWNoZSB7XG4gIGNvbnN0cnVjdG9yKHN0eWxlKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnN0eWxlID0gc3R5bGU7XG4gIH1cblxuICBrZXkoZWwsIHsgYXJpYUhpZGRlbiA9IGZhbHNlIH0gPSB7fSkge1xuICAgIHJldHVybiBhcmlhSGlkZGVuO1xuICB9XG5cbiAgc2V0dGVyKGVsLCB7IGFyaWFIaWRkZW4gPSBmYWxzZSB9ID0ge30pIHtcbiAgICByZXR1cm4gaGlkZGVuKGVsLCB0aGlzLnN0eWxlLCBhcmlhSGlkZGVuKTtcbiAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuY29uc3QgeyAkLCAkJCB9ID0gcmVxdWlyZSgnLi9zZWxlY3RvcnMnKTtcbmNvbnN0IHsgYWNjZXNzaWJsZU5hbWUsIGFjY2Vzc2libGVEZXNjcmlwdGlvbiB9ID0gcmVxdWlyZSgnLi9uYW1lJyk7XG5jb25zdCBBcmlhID0gcmVxdWlyZSgnLi9hcmlhJyk7XG5jb25zdCBDb250cmFzdCA9IHJlcXVpcmUoJy4vY29udHJhc3QnKTtcbmNvbnN0IGNzc0VzY2FwZSA9IHJlcXVpcmUoJy4vY3NzRXNjYXBlJyk7XG5jb25zdCBIaWRkZW4gPSByZXF1aXJlKCcuL2hpZGRlbicpO1xuY29uc3QgU3R5bGUgPSByZXF1aXJlKCcuL3N0eWxlJyk7XG5cbmNvbnN0IGdldE9yU2V0ID0gKGNhY2hlLCBlbCwgc2V0dGVyKSA9PiB7XG4gIGlmIChjYWNoZS5oYXMoZWwpKSB7XG4gICAgcmV0dXJuIGNhY2hlLmdldChlbCk7XG4gIH1cblxuICBjb25zdCB2YWx1ZSA9IHNldHRlcigpO1xuICBjYWNoZS5zZXQoZWwsIHZhbHVlKTtcbiAgcmV0dXJuIHZhbHVlO1xufTtcblxuLyoqXG4gKiBIZWxwZXJzIGZ1bmN0aW9uc1xuICovXG5jb25zdCBVdGlscyA9IGNsYXNzIFV0aWxzIHtcbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XG4gICAgdGhpcy5fc3R5bGUgPSBuZXcgU3R5bGUoKTtcbiAgICB0aGlzLl9oaWRkZW4gPSBuZXcgSGlkZGVuKHRoaXMuX3N0eWxlKTtcbiAgICB0aGlzLl9uYW1lQ2FjaGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHRoaXMuX2Rlc2NyaXB0aW9uQ2FjaGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHRoaXMuY29udHJhc3QgPSBuZXcgQ29udHJhc3QodGhpcy5fc3R5bGUpO1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuYXJpYSA9IG5ldyBBcmlhKGNvbmZpZyk7XG4gIH1cblxuICBoaWRkZW4oZWwsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5faGlkZGVuLmdldChlbCwgb3B0aW9ucyk7XG4gIH1cblxuICBzdHlsZShlbCwgbmFtZSwgcHNldWRvKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N0eWxlLmdldChlbCwgbmFtZSwgcHNldWRvKTtcbiAgfVxuXG4gIGFjY2Vzc2libGVOYW1lKGVsKSB7XG4gICAgcmV0dXJuIGdldE9yU2V0KFxuICAgICAgdGhpcy5fbmFtZUNhY2hlLFxuICAgICAgZWwsXG4gICAgICAoKSA9PiBhY2Nlc3NpYmxlTmFtZShlbCwgT2JqZWN0LmFzc2lnbih7IHV0aWxzOiB0aGlzIH0pKVxuICAgICk7XG4gIH1cblxuICBhY2Nlc3NpYmxlRGVzY3JpcHRpb24oZWwpIHtcbiAgICByZXR1cm4gZ2V0T3JTZXQoXG4gICAgICB0aGlzLl9kZXNjcmlwdGlvbkNhY2hlLFxuICAgICAgZWwsXG4gICAgICAoKSA9PiBhY2Nlc3NpYmxlRGVzY3JpcHRpb24oZWwsIE9iamVjdC5hc3NpZ24oeyB1dGlsczogdGhpcyB9KSlcbiAgICApO1xuICB9XG59O1xuXG5VdGlscy5wcm90b3R5cGUuJCA9ICQ7XG5VdGlscy5wcm90b3R5cGUuJCQgPSAkJDtcblV0aWxzLnByb3RvdHlwZS5jc3NFc2NhcGUgPSBjc3NFc2NhcGU7XG5cbm1vZHVsZS5leHBvcnRzID0gVXRpbHM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8vIEFuIGltcGxlbWVudGF0aW9uIG9mIHRoZSB0ZXh0IGFsdGVybmF0aXZlIGNvbXB1dGF0aW9uXG4vLyBodHRwczovL3d3dy53My5vcmcvVFIvYWNjbmFtZS1hYW0tMS4xLyNtYXBwaW5nX2FkZGl0aW9uYWxfbmRfdGVcbmNvbnN0IGNvbnRyb2xSb2xlcyA9IFsndGV4dGJveCcsICdjb21ib2JveCcsICdsaXN0Ym94JywgJ3JhbmdlJ107XG5jb25zdCBuYW1lRnJvbUNvbnRlbnRSb2xlcyA9IHJvbGVzID0+IE9iamVjdC5rZXlzKHJvbGVzKVxuICAuZmlsdGVyKG5hbWUgPT4gcm9sZXNbbmFtZV0ubmFtZUZyb21Db250ZW50KTtcblxuY2xhc3MgQWNjZXNzaWJsZU5hbWUge1xuICBjb25zdHJ1Y3RvcihlbCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy51dGlscyA9IG9wdGlvbnMudXRpbHM7XG4gICAgdGhpcy5lbCA9IGVsO1xuICAgIHRoaXMucmVjdXJzaW9uID0gISFvcHRpb25zLnJlY3Vyc2lvbjtcbiAgICB0aGlzLmFsbG93SGlkZGVuID0gISFvcHRpb25zLmFsbG93SGlkZGVuO1xuICAgIHRoaXMuaW5jbHVkZUhpZGRlbiA9ICEhb3B0aW9ucy5pbmNsdWRlSGlkZGVuO1xuICAgIHRoaXMubm9BcmlhQnkgPSAhIW9wdGlvbnMubm9BcmlhQnk7XG4gICAgdGhpcy5oaXN0b3J5ID0gb3B0aW9ucy5oaXN0b3J5IHx8IFtdO1xuICAgIHRoaXMuaXNXaXRoaW5XaWRnZXQgPSAnaXNXaXRoaW5XaWRnZXQnIGluIG9wdGlvbnMgPyBvcHRpb25zLmlzV2l0aGluV2lkZ2V0IDogdGhpcy51dGlscy5hcmlhLmhhc1JvbGUodGhpcy5yb2xlLCAnd2lkZ2V0Jyk7XG5cbiAgICB0aGlzLnNlcXVlbmNlID0gW1xuICAgICAgKCkgPT4gdGhpcy5oaWRkZW4oKSxcbiAgICAgICgpID0+IHRoaXMuYXJpYUJ5KCksXG4gICAgICAoKSA9PiB0aGlzLmVtYmVkZGVkKCksXG4gICAgICAoKSA9PiB0aGlzLmFyaWFMYWJlbCgpLFxuICAgICAgKCkgPT4gdGhpcy5uYXRpdmUoKSxcbiAgICAgICgpID0+IHRoaXMubG9vcCgpLFxuICAgICAgKCkgPT4gdGhpcy5kb20oKSxcbiAgICAgICgpID0+IHRoaXMudG9vbHRpcCgpLFxuICAgIF07XG4gIH1cblxuICBnZXQgcm9sZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fcm9sZSB8fCAodGhpcy5fcm9sZSA9IHRoaXMudXRpbHMuYXJpYS5nZXRSb2xlKHRoaXMuZWwpKTtcbiAgfVxuXG4gIGdldCBub2RlTmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fbm9kZU5hbWUgfHwgKHRoaXMuX25vZGVOYW1lID0gdGhpcy5lbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKTtcbiAgfVxuXG4gIGJ1aWxkKCkge1xuICAgIGxldCB0ZXh0ID0gJyc7XG4gICAgdGhpcy5zZXF1ZW5jZS5zb21lKGZuID0+ICh0ZXh0ID0gZm4oKSkgIT0gbnVsbCk7XG5cbiAgICB0ZXh0ID0gdGV4dCB8fCAnJztcblxuICAgIGlmICghdGhpcy5yZWN1cnNpb24pIHtcbiAgICAgIC8vIFRvIGEgZmxhdCBzdHJpbmdcbiAgICAgIHRleHQgPSB0ZXh0LnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICBsb29wKCkge1xuICAgIHJldHVybiB0aGlzLmhpc3RvcnkuaW5jbHVkZXModGhpcy5lbCkgPyAnJyA6IG51bGw7XG4gIH1cblxuICBoaWRkZW4oKSB7XG4gICAgaWYgKHRoaXMuaW5jbHVkZUhpZGRlbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGlzSGlkZGVuID0gdGhpcy51dGlscy5oaWRkZW4odGhpcy5lbCwgeyBhcmlhSGlkZGVuOiB0cnVlIH0pO1xuICAgIGlmICh0aGlzLmFsbG93SGlkZGVuICYmIGlzSGlkZGVuKSB7XG4gICAgICB0aGlzLmluY2x1ZGVIaWRkZW4gPSB0cnVlO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBpc0hpZGRlbiA/ICcnIDogbnVsbDtcbiAgfVxuXG4gIGFyaWFCeShhdHRyID0gJ2FyaWEtbGFiZWxsZWRieScpIHtcbiAgICBpZiAodGhpcy5ub0FyaWFCeSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgaWRzID0gdGhpcy5lbC5nZXRBdHRyaWJ1dGUoYXR0cikgfHwgJyc7XG4gICAgaWYgKGlkcykge1xuICAgICAgcmV0dXJuIGlkcy50cmltKCkuc3BsaXQoL1xccysvKVxuICAgICAgICAubWFwKGlkID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKSlcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAubWFwKGVsbSA9PiB0aGlzLnJlY3Vyc2UoZWxtLCB7IGFsbG93SGlkZGVuOiB0cnVlLCBub0FyaWFCeTogYXR0ciA9PT0gJ2FyaWEtbGFiZWxsZWRieScgfSkpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGFyaWFMYWJlbCgpIHtcbiAgICByZXR1cm4gdGhpcy5lbC5nZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnKSB8fCBudWxsO1xuICB9XG5cbiAgbmF0aXZlKHByb3AgPSAnbmF0aXZlTGFiZWwnKSB7XG4gICAgaWYgKFsnbm9uZScsICdwcmVzZW50YXRpb24nXS5pbmNsdWRlcyh0aGlzLnJvbGUpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy51dGlscy5jb25maWcuZWxlbWVudHNbdGhpcy5ub2RlTmFtZV07XG4gICAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudFtwcm9wXSkge1xuICAgICAgbGV0IHZhbHVlID0gZWxlbWVudFtwcm9wXSh0aGlzLmVsLCB0aGlzLnV0aWxzKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgIHZhbHVlID0gW3ZhbHVlXTtcbiAgICAgIH1cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLm1hcChlbG0gPT4gdGhpcy5yZWN1cnNlKGVsbSwgeyBhbGxvd0hpZGRlbjogdHJ1ZSB9KSlcbiAgICAgICAgICAuam9pbignICcpIHx8IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZW1iZWRkZWQoKSB7XG4gICAgY29uc3QgdXNlRW1iZWRkZWROYW1lID0gdGhpcy5pc1dpdGhpbldpZGdldFxuICAgICAgJiYgdGhpcy5yZWN1cnNpb25cbiAgICAgICYmIGNvbnRyb2xSb2xlcy5zb21lKG5hbWUgPT4gdGhpcy51dGlscy5hcmlhLmhhc1JvbGUodGhpcy5yb2xlLCBuYW1lKSk7XG5cbiAgICBpZiAoIXVzZUVtYmVkZGVkTmFtZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgeyBlbCwgcm9sZSB9ID0gdGhpcztcblxuICAgIGlmIChbJ2lucHV0JywgJ3RleHRhcmVhJ10uaW5jbHVkZXModGhpcy5ub2RlTmFtZSkgJiYgIXRoaXMudXRpbHMuYXJpYS5oYXNSb2xlKHJvbGUsICdidXR0b24nKSkge1xuICAgICAgcmV0dXJuIGVsLnZhbHVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm5vZGVOYW1lID09PSAnc2VsZWN0Jykge1xuICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5lbC5zZWxlY3RlZE9wdGlvbnMpXG4gICAgICAgIC5tYXAob3B0aW9uID0+IG9wdGlvbi52YWx1ZSlcbiAgICAgICAgLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51dGlscy5hcmlhLmhhc1JvbGUocm9sZSwgJ3RleHRib3gnKSkge1xuICAgICAgcmV0dXJuIGVsLnRleHRDb250ZW50O1xuICAgIH1cblxuICAgIGlmICh0aGlzLnV0aWxzLmFyaWEuaGFzUm9sZShyb2xlLCAnY29tYm9ib3gnKSkge1xuICAgICAgY29uc3QgaW5wdXQgPSB0aGlzLnV0aWxzLiQoJ2lucHV0JywgZWwpO1xuICAgICAgaWYgKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBpbnB1dC52YWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBpZiAodGhpcy51dGlscy5hcmlhLmhhc1JvbGUocm9sZSwgJ2xpc3Rib3gnKSkge1xuICAgICAgcmV0dXJuIHRoaXMudXRpbHMuJCQoJ1thcmlhLXNlbGVjdGVkPVwidHJ1ZVwiXScsIGVsKVxuICAgICAgICAubWFwKGVsbSA9PiB0aGlzLnJlY3Vyc2UoZWxtKSlcbiAgICAgICAgLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51dGlscy5hcmlhLmhhc1JvbGUocm9sZSwgJ3JhbmdlJykpIHtcbiAgICAgIHJldHVybiBlbC5nZXRBdHRyaWJ1dGUoJ2FyaWEtdmFsdWV0ZXh0JykgfHwgZWwuZ2V0QXR0cmlidXRlKCdhcmlhLXZhbHVlbm93JykgfHwgJyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBGaW5kIHRoZSBsYWJlbCBmcm9tIHRoZSBkb21cbiAgZG9tKCkge1xuICAgIGlmICghdGhpcy5yZWN1cnNpb24gJiYgIW5hbWVGcm9tQ29udGVudFJvbGVzKHRoaXMudXRpbHMuY29uZmlnLnJvbGVzKS5pbmNsdWRlcyh0aGlzLnJvbGUpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmVsLmNoaWxkTm9kZXMpXG4gICAgICAubWFwKChub2RlKSA9PiB7XG4gICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgIHJldHVybiBub2RlLnRleHRDb250ZW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlY3Vyc2Uobm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9KVxuICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgLmpvaW4oJycpIHx8IG51bGw7XG4gIH1cblxuICAvLyBGaW5kIGEgdG9vbHRpcCBsYWJlbFxuICB0b29sdGlwKCkge1xuICAgIHJldHVybiB0aGlzLmVsLnRpdGxlIHx8IG51bGw7XG4gIH1cblxuICByZWN1cnNlKGVsLCBvcHRpb25zID0ge30pIHtcbiAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IoZWwsIE9iamVjdC5hc3NpZ24oe1xuICAgICAgaGlzdG9yeTogdGhpcy5oaXN0b3J5LmNvbmNhdCh0aGlzLmVsKSxcbiAgICAgIGluY2x1ZGVIaWRkZW46IHRoaXMuaW5jbHVkZUhpZGRlbixcbiAgICAgIG5vQXJpYUJ5OiB0aGlzLm5vQXJpYUJ5LFxuICAgICAgcmVjdXJzaW9uOiB0cnVlLFxuICAgICAgaXNXaXRoaW5XaWRnZXQ6IHRoaXMuaXNXaXRoaW5XaWRnZXQsXG4gICAgICB1dGlsczogdGhpcy51dGlscyxcbiAgICB9LCBvcHRpb25zKSkuYnVpbGQoKTtcbiAgfVxufVxuXG5jbGFzcyBBY2Nlc3NpYmxlRGVzY3JpcHRpb24gZXh0ZW5kcyBBY2Nlc3NpYmxlTmFtZSB7XG4gIGNvbnN0cnVjdG9yKGVsLCBvcHRpb25zKSB7XG4gICAgc3VwZXIoZWwsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5zZXF1ZW5jZS51bnNoaWZ0KCgpID0+IHRoaXMuZGVzY3JpYmVkQnkoKSk7XG4gIH1cblxuICBkZXNjcmliZWRCeSgpIHtcbiAgICBpZiAodGhpcy5yZWN1cnNpb24pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnV0aWxzLmhpZGRlbih0aGlzLmVsLCB7IGFyaWFIaWRkZW46IHRydWUgfSkpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBhcmlhQnkgPSB0aGlzLmFyaWFCeSgnYXJpYS1kZXNjcmliZWRieScpO1xuICAgIGlmIChhcmlhQnkgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBhcmlhQnk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubmF0aXZlKCduYXRpdmVEZXNjcmlwdGlvbicpIHx8ICcnO1xuICB9XG59XG5cbmV4cG9ydHMuYWNjZXNzaWJsZU5hbWUgPSAoZWwsIG9wdGlvbnMpID0+IG5ldyBBY2Nlc3NpYmxlTmFtZShlbCwgb3B0aW9ucykuYnVpbGQoKTtcbmV4cG9ydHMuYWNjZXNzaWJsZURlc2NyaXB0aW9uID0gKGVsLCBvcHRpb25zKSA9PiBuZXcgQWNjZXNzaWJsZURlc2NyaXB0aW9uKGVsLCBvcHRpb25zKS5idWlsZCgpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBFeHRlbmRlZEFycmF5ID0gcmVxdWlyZSgnLi4vc3VwcG9ydC9leHRlbmRlZC1hcnJheScpO1xuXG5leHBvcnRzLiQkID0gZnVuY3Rpb24gJCQoc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgY29uc3Qgcm9vdCA9IGNvbnRleHQgfHwgZG9jdW1lbnQ7XG4gIGNvbnN0IGVscyA9IEV4dGVuZGVkQXJyYXkuZnJvbShyb290LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbiAgaWYgKGNvbnRleHQgJiYgY29udGV4dCBpbnN0YW5jZW9mIEVsZW1lbnQgJiYgY29udGV4dC5tYXRjaGVzKHNlbGVjdG9yKSkge1xuICAgIGVscy5wdXNoKGNvbnRleHQpO1xuICB9XG4gIHJldHVybiBlbHM7XG59O1xuXG5leHBvcnRzLiQgPSBmdW5jdGlvbiAkKHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gIHJldHVybiBleHBvcnRzLiQkKHNlbGVjdG9yLCBjb250ZXh0KVswXTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICogQSBjYWNoZSBvZiBjb21wdXRlZCBzdHlsZSBwcm9wZXJ0aWVzXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIGNsYXNzLW1ldGhvZHMtdXNlLXRoaXMgKi9cbmNvbnN0IEVsZW1lbnRDYWNoZSA9IHJlcXVpcmUoJy4uL3N1cHBvcnQvZWxlbWVudC1jYWNoZScpO1xuXG5mdW5jdGlvbiBnZXRTdHlsZShlbCwgbmFtZSwgcHNldWRvKSB7XG4gIHJldHVybiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgcHNldWRvID8gYDo6JHtwc2V1ZG99YCA6IG51bGwpW25hbWVdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFN0eWxlIGV4dGVuZHMgRWxlbWVudENhY2hlIHtcbiAga2V5KGVsLCBuYW1lLCBwc2V1ZG8pIHtcbiAgICByZXR1cm4gYCR7bmFtZX1+JHtwc2V1ZG99YDtcbiAgfVxuXG4gIHNldHRlcihlbCwgbmFtZSwgcHNldWRvKSB7XG4gICAgcmV0dXJuIGdldFN0eWxlKGVsLCBuYW1lLCBwc2V1ZG8pO1xuICB9XG59O1xuIl19
