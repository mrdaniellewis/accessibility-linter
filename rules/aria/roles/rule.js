({
  message(el) {
    return this.check(el);
  },
  check(el) {
    const role = el.getAttribute('role').trim();
    if (!role) {
      return 'role attribute should not be empty';
    }
    let error;
    const rule = aria.match(el);
    role.split(/\s+/).some((name) => {
      if (!aria.roles[name]) {
        error = `"${name}" is not a known role`;
        return true;
      }

      if (aria.roles[name].abstract) {
        error = `"${name}" is an abstract role and should not be used`;
        return true;
      }

      if (rule.implicitRoles.includes(name)) {
        error = `role "${name}" is implicit for this element and should not be specified`;
        return true;
      }

      if (!rule.allowedRoles.includes(name)) {
        error = `role "${name}" is not allowed for this element`;
      }

      return false;
    });

    return error;
  },
  selector: '[role]',
  filter(el) {
    return !this.check(el);
  },
});
