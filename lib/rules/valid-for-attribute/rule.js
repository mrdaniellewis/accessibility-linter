import Rule from '../../rule';
import { rSpace } from '../../utils';

export default class extends Rule {
  get selector() {
    return 'label[for]';
  }

  test(el) {
    const id = el.htmlFor;
    if (!id) {
      return 'for attribute should not be empty';
    }
    if (rSpace.test(id)) {
      return 'for attribute should not contain space characters';
    }
    const control = document.getElementById(id);
    if (!control) {
      return `cannot find an element with id "${id}"`;
    }

    if (!control.matches('button,input:not([type=hidden]),meter,output,progress,select,textarea')) {
      return 'for attribute does not point to a labelable element';
    }

    return null;
  }
}
