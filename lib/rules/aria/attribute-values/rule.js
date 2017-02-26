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
