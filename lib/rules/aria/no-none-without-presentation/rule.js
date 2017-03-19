const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return '[role="none"]';
  }

  test() {
    return 'use a role of "none presentation" to support older user-agents';
  }
};
