/**
 *  Data and functions for aria validation.  Based on
 *  - https://www.w3.org/TR/wai-aria-1.1/
 *  - https://www.w3.org/TR/html52/
 */
const config = require('../config');
const ExtendedArray = require('../support/extended-array');

/**
 * All roles
 * @type {Object[]}
 */
exports.allowed = (el) => {
  const name = el.nodeName.toLowerCase();
  let found = config.allowedAria[name];
  if (Array.isArray(found)) {
    found = found.find(item => (
      item.selector === '*' || (typeof item.selector === 'function' ? item.selector(el) : el.matches(item.selector))
    ));
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
 * @param {Boolean} [options.extact=false] Match against abstract roles
 * @returns {Boolean}
 */
exports.hasRole = (target, name, { exact = false } = {}) => {
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
    return !exact && (config.roles[checkRole].subclass || []).some(hasRole);
  });
};

/**
 * Find the closest element with the specified role(s)
 * @param {Element} el
 * @param {String|String[]} role
 * @param {Boolean} [options.exact=false]
 * @returns {Boolean}
 */
exports.closestRole = (el, role, { exact = false } = {}) => {
  const roles = [].concat(role);
  let cursor = el;
  while ((cursor = cursor.parentNode) && cursor.nodeType === Node.ELEMENT_NODE) {
    // eslint-disable-next-line no-loop-func
    if (roles.some(name => exports.hasRole(cursor, name, { exact }))) {
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
