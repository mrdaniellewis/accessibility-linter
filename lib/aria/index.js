/**
 *  Data and functions for aria validation.  Based on
 *  - https://www.w3.org/TR/wai-aria-1.1/
 *  - https://www.w3.org/TR/html52/
 */

// const attributes = require('./attributes');
const match = require('./match');
const roles = require('./roles');

/**
 * All roles
 * @type {Object}
 */
exports.roles = roles;

/**
 * Get the elements current role based on the role attribute or implicit role
 * @param {Element} el
 * @returns {String|null}
 */
exports.getRole = (el) => {
  let role = null;
  // Should be the first non-abstract role in the list
  if ((el.getAttribute('role') || '').split(/\s+/).some((name) => {
    if (roles[name]) {
      role = name;
      return true;
    }
    return false;
  })) {
    return role;
  }
  return match(el).implicitRoles[0] || null;
};

/**
 * Get the aria rules for an element
 * @param {Element} el
 * @returns {Object}
 */
exports.getElementRules = el => match(el);