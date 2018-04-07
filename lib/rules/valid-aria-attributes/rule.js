import { attributes } from 'aria-config';
import ariaExtensions from 'aria-extensions';
import XPathRule from '../xpath-rule';
import { rSpace } from '../../utils';

const { aria, role } = ariaExtensions.symbols;

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

  tristate(...args) {
    return this.token(...args);
  },

  'true/false'(...args) { // eslint-disable-line object-shorthand
    return this.token(...args);
  },

  'true/false/undefined'(...args) { // eslint-disable-line object-shorthand
    return this.token(...args);
  },

  tokenlist(value, { tokens, alone }) {
    const values = value.split(/\s+/).filter(Boolean);
    const unknown = values.filter(token => !tokens.includes(token));
    if (values.length === 0 || unknown.length) {
      return `must be one or more of: ${tokens.join(', ')}`;
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

    return document.getElementById(value) ? null : `no element can be found with an id of "${value}"`;
  },

  idlist(value) {
    if (!value.trim()) {
      return 'must be one or more ids';
    }
    return value.split(rSpace)
      .map((id, index, ids) => {
        if (ids.indexOf(id) < index) {
          return `duplicate id "${id}"`;
        }
        if (!document.getElementById(id)) {
          return `no element can be found with an id of "${id}"`;
        }
        return null;
      });
  },
};

export default class extends XPathRule {
  get selector() {
    return "*/@*[starts-with(name(), 'aria')]/..";
  }

  checkAllowed(element, name) {
    const ariaData = element[aria];
    if (ariaData.implicitAttributes.includes(name)) {
      return `aria-${name} is implicit on this element and should not be specified`;
    }
    if (!ariaData.allowedAttributes.includes(name)) {
      return `aria-${name} is not allowed on this element`;
    }
    return null;
  }

  checkValue(name, value) {
    const attr = attributes[name];
    return []
      .concat(checkers[attr.value](value, attr))
      .filter(Boolean)
      .map(error => `aria-${name} ${error}`);
  }

  checkInvalid(element, name, value) {
    if (name === 'invalid' && value === 'false' && element.willValidate && !element.checkValidity()) {
      return 'aria-invalid must not be false if checkValidity() returns false';
    }

    return null;
  }

  checkContentEditable(element, name, value) {
    if (name === 'readonly' && element.contentEditable === 'true' && value === 'true') {
      return 'aria-readonly must not be true for an element with contenteditable="true"';
    }
    return null;
  }

  checkDeprecated(name) {
    if (attributes[name].deprecated) {
      return `aria-${name} is deprecated and should not be used`;
    }
    return null;
  }

  checkHidden(element, name, value) {
    if (name === 'hidden' && value === 'true' && element.hidden) {
      return 'aria-hidden does not need to be used if "hidden" is used';
    }
    return null;
  }

  checkGlobal(element, name) {
    if (['none', 'presentation'].includes(element[role])) {
      return null;
    }
    const ariaData = element[aria];
    if (!['none', 'presentation'].includes(ariaData.explicit || ariaData.inherited)) {
      return null;
    }
    if (ariaExtensions.globalAttributes.includes(name)) {
      if (ariaData.explicit) {
        return `aria-${name} must not be used if the role is ${ariaData.explicit}`;
      }
      return `aria-${name} must not be used for an inherited role of ${ariaData.inherited}`;
    }
    return null;
  }

  test(element) {
    return Array.from(element.attributes)
      .filter(({ name }) => name.startsWith('aria-'))
      .map(({ name, value }) => [name.slice(5), value])
      .map(([name, value]) => {
        if (!attributes[name]) {
          return `aria-${name} is not a known aria attribute`;
        }
        return [
          this.checkAllowed(element, name),
          this.checkValue(name, value),
          this.checkInvalid(element, name, value),
          this.checkContentEditable(element, name, value),
          this.checkDeprecated(name),
          this.checkHidden(element, name, value),
          this.checkGlobal(element, name),
        ];
      });
  }
}
