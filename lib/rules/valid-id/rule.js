import Rule from '../../rule';
import { $$, rSpace } from '../../utils';

export default class extends Rule {
  get selector() {
    return '[id]';
  }

  test(el) {
    if (!el.id) {
      return 'id should not be empty';
    }
    if (rSpace.test(el.id)) {
      return 'id should not contain space characters';
    }
    if (!el.id || $$(`[id="${CSS.escape(el.id)}"]`).length > 1) {
      return 'id is not unique';
    }
    return null;
  }
}
