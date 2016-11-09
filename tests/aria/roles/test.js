({
  message(el) {
    const rule = rules.match(el);
    const role = el.getAttribute('role');
    if (rule.implicitRoles.includes(role)) {
      return `role "${role}" is implicit for this element and not allowed`;
    }
    if (!rules.roles.includes(role)) {
      return `role "${role}" is not a known role`;
    }
    return `role "${role}" is not allowed for this element`;
  },
  selector: '[role]',
  filter(el) {
    const rule = rules.match(el);
    const role = el.getAttribute('role');
    return rule.allowedRoles.includes(role);
  },
});
