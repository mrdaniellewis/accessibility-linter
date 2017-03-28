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
