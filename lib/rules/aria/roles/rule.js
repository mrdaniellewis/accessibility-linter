const Rule = require('../../rule');
const config = require('../../../config');
const { rSpace } = require('../../../support/constants');

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
