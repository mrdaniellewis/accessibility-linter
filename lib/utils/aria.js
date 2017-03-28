/**
 *  Data and functions for aria validation.  Based on
 *  - https://www.w3.org/TR/wai-aria-1.1/
 *  - https://www.w3.org/TR/html52/
 */
const ExtendedArray = require('../support/extended-array');

module.exports = class Aria {
  constructor(config) {
    this.config = config;
  }

  /**
   * An object with the role settings for the element
   * @type {Object[]}
   */
  allowed(el) {
    const name = el.nodeName.toLowerCase();
    let found = this.config.allowedAria[name];
    if (Array.isArray(found)) {
      found = found.find(item => (
        item.selector === '*' || (typeof item.selector === 'function' ? item.selector(el, this) : el.matches(item.selector))
      ));
    }
    return found || this.config.allowedAria._default;
  }

  /**
   * Get the elements current role based on the role attribute or implicit role
   * @param {Element} el
   * @returns {String|null}
   */
  getRole(el, allowed) {
    let role = null;
    // Should be the first non-abstract role in the list
    if ((el.getAttribute('role') || '').split(/\s+/).filter(Boolean).some((name) => {
      if (this.config.roles[name] && !this.config.roles[name].abstract) {
        role = name;
        return true;
      }
      return false;
    })) {
      return role;
    }
    allowed = allowed || this.allowed(el);
    return allowed.implicit[0] || null;
  }

  /**
   * Does an element have a role. This will test against abstract roles
   * @param {Element|String|null} target
   * @param {String|String[]} name
   * @param {Boolean} [options.extact=false] Match against abstract roles
   * @returns {Boolean}
   */
  hasRole(target, name, { exact = false } = {}) {
    if (target === null) {
      return false;
    }
    const actualRole = typeof target === 'string' ? target : this.getRole(target);
    if (!actualRole) {
      return false;
    }
    return [].concat(name).some(function hasRole(checkRole) {
      if (checkRole === actualRole) {
        return true;
      }
      return !exact && (this.config.roles[checkRole].subclass || []).some(hasRole, this);
    }, this);
  }

  /**
   * Find the closest element with the specified role(s)
   * @param {Element} el
   * @param {String|String[]} role
   * @param {Boolean} [options.exact=false]
   * @returns {Boolean}
   */
  closestRole(el, role, { exact = false } = {}) {
    const roles = [].concat(role);
    let cursor = el;
    while ((cursor = cursor.parentNode) && cursor.nodeType === Node.ELEMENT_NODE) {
      // eslint-disable-next-line no-loop-func
      if (roles.some(name => this.hasRole(cursor, name, { exact }))) {
        return cursor;
      }
    }
    return null;
  }

  rolesOfType(name) {
    const roles = new ExtendedArray();
    const role = this.config.roles[name];
    if (!role.abstract) {
      roles.push(name);
    }
    if (role.subclass) {
      roles.push(role.subclass.map(this.rolesOfType, this));
    }
    return roles.flatten();
  }
};
