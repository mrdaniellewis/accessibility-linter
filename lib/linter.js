import rules from './rules';
import version from './version.json';

class Linter {
  constructor() {
    console.log('Hello World!');
  }
}

Linter.version = version;
Linter.rules = rules;

export default Linter;
