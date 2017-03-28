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
