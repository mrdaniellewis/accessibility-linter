/**
 *  Data and functions for aria validation.  Based on
 *  - https://www.w3.org/TR/wai-aria-1.1/
 *  - https://www.w3.org/TR/html52/
 */
const config = require('../config');

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
 * @param {Element|String} target
 * @param {String} name
 * @returns {Boolean}
 */
exports.hasRole = (target, name) => {
  const actualRole = target instanceof Element ? exports.getRole(target) : target;
  if (!actualRole) {
    return false;
  }
  return [name].some(function hasRole(checkRole) {
    if (checkRole === actualRole) {
      return true;
    }
    return (config.roles[checkRole].subclass || []).some(hasRole);
  });
};

/**
 * Does an element have an explicitly defined role
 * @param {Element} el
 * @param {String|String[]} role
 * @returns {Boolean}
 */
exports.hasExplicitRole = (el, role) => {
  const roles = [].concat(role);
  const elementRole = (el.getAttribute('role') || '').split(/\s+/).filter(Boolean)[0];
  return roles.includes(elementRole);
};

/**
 * Does an element have an ancestor with an explicitly defined role
 * @param {Element} el
 * @param {String|String[]} role
 * @returns {Boolean}
 */
exports.hasAncestorWithExplicitRole = (el, role) => {
  let cursor = el;
  while ((cursor = cursor.parentNode) && cursor instanceof HTMLElement) {
    // eslint-disable-next-line no-loop-func
    if (exports.hasExplicitRole(cursor, role)) {
      return true;
    }
  }
  return false;
};
