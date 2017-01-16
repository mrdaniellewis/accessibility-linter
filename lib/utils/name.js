// An implementation of the text alternative computation
// https://www.w3.org/TR/accname-aam-1.1/#mapping_additional_nd_te
const hidden = require('./hidden');
const { $, $$ } = require('./selectors');
const { getRole, hasRole, roles } = require('../aria');
const elements = require('../elements');

const nameFromContentRoles = Object.keys(roles).filter(name => roles[name].nameFromContent);
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
    const isHidden = hidden(this.el);
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

    const element = elements[this.nodeName];
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

    if (hidden(this.el)) {
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

