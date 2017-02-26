const Rule = require('../../rule');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
    this.history = new WeakMap();
  }

  selector() {
    return '[role]';
  }

  test(el) {
    const role = el.getAttribute('role');
    if (this.history.has(el)) {
      if (this.history.get(el) !== role) {
        return 'an elements role must not be modified';
      }
    } else {
      this.history.set(el, role);
    }
    return null;
  }
};
