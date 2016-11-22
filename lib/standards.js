/**
 * HTML standards
 * https://www.w3.org/TR/html52/
 */
const { rules: elementRules, defaultRule } = require('./role-rules');
const { roles } = require('./aria-rules');
const { elements } = require('./element-standards');

const allRoles = Object.keys(roles);

function getAllowedRoles(rule) {
  if (rule.roles === false) {
    return [];
  }
  if (rule.roles === true) {
    return allRoles.filter(role => !rule.implicit.includes(role));
  }
  return rule.roles;
}

exports.elements = {
  obsolete: new Set(Object.keys(elements).filter(name => elements[name].obsolete)),
  valid: new Set(Object.keys(elements).filter(name => !elements[name].obsolete)),
};

exports.aria = {
  /**
   * Given an element, return an object with the aria information
   */
  match(el) {
    const name = el.nodeName.toLowerCase();
    let rule = elementRules[name];
    if (Array.isArray(rule)) {
      rule = rule.find(item => item.selector === '*' || el.matches(item.selector));
    }
    rule = rule || defaultRule;
    const allowedRoles = getAllowedRoles(rule);

    return {
      implicitRoles: rule.implicit,
      allowedRoles,
    };
  },

  roles: allRoles,
};
