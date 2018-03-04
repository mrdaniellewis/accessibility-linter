import Rule from '../../rule';
import { $$ } from '../../utils';

export default class extends Rule {
  get selector() {
    return 'a[name]';
  }

  test(el) {
    if (!el.name) {
      return 'name should not be empty';
    }
    if (el.id && el.id !== el.name) {
      return 'if the id attribute is present it must equal the name attribute';
    }
    const id = CSS.escape(el.name);
    if (id && $$(`a[name="${id}"],[id="${id}"]`).length > 1) {
      return 'name is not unique';
    }
    return null;
  }
}
