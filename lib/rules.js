/**
 * Rules engine for aria conformance
 *
 * https://w3c.github.io/html-aria/
 */
const { rules: elementRules, defaultRule } = require('./role-rules');
const { roles } = require('./aria-rules');

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

/**
 * Given an element, return an object with the aria information
 */
exports.match = function match(el) {
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
};

exports.roles = allRoles;
