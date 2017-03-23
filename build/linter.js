(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AccessibilityLinter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./rules/aria/attribute-values/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const config = _dereq_('../../../config');
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
  selector() {
    return this._selector || (this._selector = Object.keys(config.ariaAttributes).map(name => `[aria-${name}]`).join(','));
  }

  test(el) {
    return ExtendedArray.from(el.attributes)
      .map(({ name, value }) => {
        if (!name.startsWith('aria-')) {
          return null;
        }
        name = name.slice(5);
        const description = config.ariaAttributes[name];
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

},{"../../../config":4,"../../../support/constants":11,"../../../support/extended-array":13,"../../rule":9}],"./rules/aria/deprecated-attributes/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const config = _dereq_('../../../config');

module.exports = class extends Rule {
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

},{"../../../config":4,"../../rule":9}],"./rules/aria/immutable-role/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/aria/invalid-attributes/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const config = _dereq_('../../../config');

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

},{"../../../config":4,"../../rule":9}],"./rules/aria/landmark/one-banner/rule.js":[function(_dereq_,module,exports){
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

},{"../../../rule":9}],"./rules/aria/landmark/one-contentinfo/rule.js":[function(_dereq_,module,exports){
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

},{"../../../rule":9}],"./rules/aria/no-focusable-hidden/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/aria/no-focusable-role-none/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/aria/no-none-without-presentation/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/aria/one-role/rule.js":[function(_dereq_,module,exports){
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

},{"../../../support/constants":11,"../../rule":9}],"./rules/aria/roles/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const config = _dereq_('../../../config');
const { rSpace } = _dereq_('../../../support/constants');

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
    role.split(rSpace).some((name) => {
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

},{"../../../config":4,"../../../support/constants":11,"../../rule":9}],"./rules/colour-contrast/aa/rule.js":[function(_dereq_,module,exports){
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
    context = context || document;
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
    return { el, message: `contrast is too low ${parseFloat(ratio.toFixed(2))}:1`, type: this.type };
  }
};

},{"../../../support/extended-array":13,"../../rule":9}],"./rules/colour-contrast/aaa/rule.js":[function(_dereq_,module,exports){
"use strict";
const ColourContrastAARule = _dereq_('../aa/rule.js');

module.exports = class extends ColourContrastAARule {
  setDefaults() {
    this.min = 7;
    this.minLarge = 4.5;
    this.enabled = false;
  }
};

},{"../aa/rule.js":"./rules/colour-contrast/aa/rule.js"}],"./rules/data-attributes/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

module.exports = class extends Rule {
  selector() {
    return '[data],[data-]';
  }

  test() {
    return 'data is an attribute prefix';
  }
};

},{"../rule":9}],"./rules/details-and-summary/rule.js":[function(_dereq_,module,exports){
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
const config = _dereq_('../../../config');

module.exports = class extends Rule {
  selector() {
    return this._selector || (this._selector = Object.keys(config.elements).filter(el => config.elements[el].obsolete).join(','));
  }

  test() {
    return 'do not use obsolete elements';
  }
};

},{"../../../config":4,"../../rule":9}],"./rules/elements/unknown/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../../rule');
const config = _dereq_('../../../config');

module.exports = class extends Rule {
  selector() {
    return this._selector || (this._selector = Object.keys(config.elements).map(name => `:not(${name})`).join(''));
  }

  test(el) {
    if (el.closest('svg,math')) {
      return null;
    }
    return 'unknown element';
  }
};

},{"../../../config":4,"../../rule":9}],"./rules/fieldset-and-legend/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules/headings/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules/ids/form-attribute/rule.js":[function(_dereq_,module,exports){
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

},{"../../../support/constants":11,"../../rule":9}],"./rules/ids/imagemap-ids/rule.js":[function(_dereq_,module,exports){
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

},{"../../../support/constants":11,"../../rule":9}],"./rules/ids/labels-have-inputs/rule.js":[function(_dereq_,module,exports){
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

},{"../../../support/constants":11,"../../rule":9}],"./rules/ids/list-id/rule.js":[function(_dereq_,module,exports){
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

},{"../../../support/constants":11,"../../rule":9}],"./rules/ids/no-duplicate-anchor-names/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/ids/unique-id/rule.js":[function(_dereq_,module,exports){
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

},{"../../../support/constants":11,"../../rule":9}],"./rules/labels/area/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/labels/aria-command/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/labels/controls/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/labels/group/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/labels/headings/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/labels/img/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/labels/links/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/labels/tabindex/rule.js":[function(_dereq_,module,exports){
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

},{"../../rule":9}],"./rules/lang/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules/multiple-in-group/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules/no-button-without-type/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules/no-consecutive-brs/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules/no-empty-select/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules/no-links-as-buttons/rule.js":[function(_dereq_,module,exports){
"use strict";
const Rule = _dereq_('../rule');

module.exports = class extends Rule {
  selector() {
    return 'a[role=button],a[href="#"],a[href="#!"],a[href^="javascript:"]';
  }

  test(el, utils) {
    if (utils.hidden(el)) {
      return null;
    }
    return 'use a button instead of a link';
  }
};

},{"../rule":9}],"./rules/no-links-to-missing-fragments/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules/no-multiple-select/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules/no-outside-controls/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules/no-reset/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules/no-unassociated-labels/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules/title/rule.js":[function(_dereq_,module,exports){
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

},{"../rule":9}],"./rules":[function(_dereq_,module,exports){
"use strict";
module.exports = ["aria/attribute-values","aria/deprecated-attributes","aria/immutable-role","aria/invalid-attributes","aria/landmark/one-banner","aria/landmark/one-contentinfo","aria/landmark/one-main","aria/landmark/prefer-main","aria/no-focusable-hidden","aria/no-focusable-role-none","aria/no-none-without-presentation","aria/one-role","aria/roles","colour-contrast/aa","colour-contrast/aaa","data-attributes","details-and-summary","elements/obsolete","elements/unknown","fieldset-and-legend","headings","ids/form-attribute","ids/imagemap-ids","ids/labels-have-inputs","ids/list-id","ids/no-duplicate-anchor-names","ids/unique-id","labels/area","labels/aria-command","labels/controls","labels/group","labels/headings","labels/img","labels/links","labels/tabindex","lang","multiple-in-group","no-button-without-type","no-consecutive-brs","no-empty-select","no-links-as-buttons","no-links-to-missing-fragments","no-multiple-select","no-outside-controls","no-reset","no-unassociated-labels","title"];
},{}],"./version":[function(_dereq_,module,exports){
"use strict";
module.exports = "1.10.0"
},{}],1:[function(_dereq_,module,exports){
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

},{}],2:[function(_dereq_,module,exports){
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
  },
  dfn: {},
  dialog: {},
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

},{}],4:[function(_dereq_,module,exports){
"use strict";
exports.allowedAria = _dereq_('./allowed-aria');
exports.ariaAttributes = _dereq_('./aria-attributes');
exports.elements = _dereq_('./elements');
exports.roles = _dereq_('./roles');

},{"./allowed-aria":1,"./aria-attributes":2,"./elements":3,"./roles":5}],5:[function(_dereq_,module,exports){
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

},{}],6:[function(_dereq_,module,exports){
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

},{"./linter":7}],7:[function(_dereq_,module,exports){
"use strict";
const Runner = _dereq_('./runner');
const Logger = _dereq_('./logger');
const Rule = _dereq_('./rules/rule');
const rules = _dereq_('./rules');
const Utils = _dereq_('./utils');
const version = _dereq_('./version');
const config = _dereq_('./config');
const Contrast = _dereq_('./utils/contrast');

// eslint-disable-next-line global-require, import/no-dynamic-require
const ruleList = new Map(rules.map(path => [path.replace(/\//g, '-'), _dereq_(`./rules/${path}/rule.js`)]));

const Linter = module.exports = class AccessibilityLinter extends Runner {
  constructor(options) {
    options = options || {};
    options.logger = options.logger || new Logger();
    options.rules = options.rules || ruleList;
    super(options);

    this.root = options.root || document;
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
};

Linter.config = config;
Linter.Logger = Logger;
Linter.Rule = Rule;
Linter.rules = ruleList;
Linter[Symbol.for('accessibility-linter.rule-sources')] = rules;
Linter.Utils = Utils;
Linter.version = version;
Linter.colourContrast = Contrast.colourContrast;

},{"./config":4,"./logger":8,"./rules":"./rules","./rules/rule":9,"./runner":10,"./utils":19,"./utils/contrast":16,"./version":"./version"}],8:[function(_dereq_,module,exports){
"use strict";
/* eslint-disable no-console, class-methods-use-this */
module.exports = class Logger {
  log({ type, el, message, name }) {
    console[type].apply(console, [message, el, name].filter(Boolean));
  }
};

},{}],9:[function(_dereq_,module,exports){
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
          .map(message => ({ el, message, type: this.type }))
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

},{"../support/extended-array":13}],10:[function(_dereq_,module,exports){
"use strict";
const Utils = _dereq_('./utils');
const SetCache = _dereq_('./support/set-cache');

const dummyCache = {
  add() {},
  set() {},
  has() { return false; },
};

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
    this.utils = new Utils();
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
  runInternal(rule, context, filter) {
    rule.run(context, el => filter(el, rule.name), this.utils)
      .forEach((issue) => {
        this.reported.set(issue.el, rule.name);
        this.logger.log(Object.assign({ name: rule.name }, issue));
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

},{"./support/set-cache":14,"./utils":19}],11:[function(_dereq_,module,exports){
"use strict";
// https://www.w3.org/TR/html52/infrastructure.html#common-parser-idioms
exports.rSpace = /[ \t\n\f\r]+/;

},{}],12:[function(_dereq_,module,exports){
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

},{}],13:[function(_dereq_,module,exports){
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

},{}],14:[function(_dereq_,module,exports){
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

},{}],15:[function(_dereq_,module,exports){
"use strict";
/**
 *  Data and functions for aria validation.  Based on
 *  - https://www.w3.org/TR/wai-aria-1.1/
 *  - https://www.w3.org/TR/html52/
 */
const config = _dereq_('../config');
const ExtendedArray = _dereq_('../support/extended-array');

/**
 * All roles
 * @type {Object[]}
 */
exports.allowed = (el) => {
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
  if ((el.getAttribute('role') || '').split(/\s+/).filter(Boolean).some((name) => {
    if (config.roles[name] && !config.roles[name].abstract) {
      role = name;
      return true;
    }
    return false;
  })) {
    return role;
  }
  return exports.allowed(el).implicit[0] || null;
};

/**
 * Does an element have a role. This will test against abstract roles
 * @param {Element|String|null} target
 * @param {String|String[]} name
 * @returns {Boolean}
 */
exports.hasRole = (target, name) => {
  if (target === null) {
    return false;
  }
  const actualRole = typeof target === 'string' ? target : exports.getRole(target);
  if (!actualRole) {
    return false;
  }
  return [].concat(name).some(function hasRole(checkRole) {
    if (checkRole === actualRole) {
      return true;
    }
    return (config.roles[checkRole].subclass || []).some(hasRole);
  });
};

/**
 * Find the closest element with the specified role(s)
 * @param {Element} el
 * @param {String|String[]} role
 * @returns {Boolean}
 */
exports.closestRole = (el, role) => {
  const roles = [].concat(role);
  let cursor = el;
  while ((cursor = cursor.parentNode) && cursor.nodeType === Node.ELEMENT_NODE) {
    // eslint-disable-next-line no-loop-func
    if (roles.some(name => exports.hasRole(cursor, name))) {
      return cursor;
    }
  }
  return null;
};

exports.rolesOfType = (name) => {
  const roles = new ExtendedArray();
  const role = config.roles[name];
  if (!role.abstract) {
    roles.push(name);
  }
  if (role.subclass) {
    roles.push(role.subclass.map(exports.rolesOfType));
  }
  return roles.flatten();
};

},{"../config":4,"../support/extended-array":13}],16:[function(_dereq_,module,exports){
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

},{}],17:[function(_dereq_,module,exports){
"use strict";
module.exports = function cssEscape(name) {
  return name.replace(/["\\]/g, '\\$&');
};

},{}],18:[function(_dereq_,module,exports){
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

},{"../support/element-cache":12}],19:[function(_dereq_,module,exports){
"use strict";
const { $, $$ } = _dereq_('./selectors');
const { accessibleName, accessibleDescription } = _dereq_('./name');
const aria = _dereq_('./aria');
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
  constructor() {
    this._style = new Style();
    this._hidden = new Hidden(this._style);
    this._nameCache = new WeakMap();
    this._descriptionCache = new WeakMap();
    this.contrast = new Contrast(this._style);
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
Utils.prototype.aria = aria;
Utils.prototype.cssEscape = cssEscape;

module.exports = Utils;

},{"./aria":15,"./contrast":16,"./cssEscape":17,"./hidden":18,"./name":20,"./selectors":21,"./style":22}],20:[function(_dereq_,module,exports){
"use strict";
// An implementation of the text alternative computation
// https://www.w3.org/TR/accname-aam-1.1/#mapping_additional_nd_te
const { $, $$ } = _dereq_('./selectors');
const config = _dereq_('../config');
const { getRole, hasRole } = _dereq_('./aria');

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

    const element = config.elements[this.nodeName];
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

},{"../config":4,"./aria":15,"./selectors":21}],21:[function(_dereq_,module,exports){
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

},{"../support/extended-array":13}],22:[function(_dereq_,module,exports){
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

},{"../support/element-cache":12}]},{},["./rules/aria/attribute-values/rule.js","./rules/aria/deprecated-attributes/rule.js","./rules/aria/immutable-role/rule.js","./rules/aria/invalid-attributes/rule.js","./rules/aria/landmark/one-banner/rule.js","./rules/aria/landmark/one-contentinfo/rule.js","./rules/aria/landmark/one-main/rule.js","./rules/aria/landmark/prefer-main/rule.js","./rules/aria/no-focusable-hidden/rule.js","./rules/aria/no-focusable-role-none/rule.js","./rules/aria/no-none-without-presentation/rule.js","./rules/aria/one-role/rule.js","./rules/aria/roles/rule.js","./rules/colour-contrast/aa/rule.js","./rules/colour-contrast/aaa/rule.js","./rules/data-attributes/rule.js","./rules/details-and-summary/rule.js","./rules/elements/obsolete/rule.js","./rules/elements/unknown/rule.js","./rules/fieldset-and-legend/rule.js","./rules/headings/rule.js","./rules/ids/form-attribute/rule.js","./rules/ids/imagemap-ids/rule.js","./rules/ids/labels-have-inputs/rule.js","./rules/ids/list-id/rule.js","./rules/ids/no-duplicate-anchor-names/rule.js","./rules/ids/unique-id/rule.js","./rules/labels/area/rule.js","./rules/labels/aria-command/rule.js","./rules/labels/controls/rule.js","./rules/labels/group/rule.js","./rules/labels/headings/rule.js","./rules/labels/img/rule.js","./rules/labels/links/rule.js","./rules/labels/tabindex/rule.js","./rules/lang/rule.js","./rules/multiple-in-group/rule.js","./rules/no-button-without-type/rule.js","./rules/no-consecutive-brs/rule.js","./rules/no-empty-select/rule.js","./rules/no-links-as-buttons/rule.js","./rules/no-links-to-missing-fragments/rule.js","./rules/no-multiple-select/rule.js","./rules/no-outside-controls/rule.js","./rules/no-reset/rule.js","./rules/no-unassociated-labels/rule.js","./rules/title/rule.js","./rules","./version",7,6])(7)
});
//# sourceMappingURL=linter.js.map
