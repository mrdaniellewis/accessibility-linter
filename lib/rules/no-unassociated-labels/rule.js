import { symbols } from 'aria-extensions';
import Rule from '../../rule';
import { rSpace } from '../../utils';

const controlSelector = 'button,input:not([type=hidden]),meter,output,progress,select,textarea';

export default class extends Rule {
  get selector() {
    return 'label';
  }

  test(el) {
    let control;
    if (el.hasAttribute('for')) {
      const id = el.htmlFor;
      if (!id) {
        return 'for attribute should not be empty';
      }
      if (rSpace.test(id)) {
        return 'for attribute should not contain space characters';
      }
      control = document.getElementById(id);
      if (!control) {
        return `cannot find an element with id "${id}"`;
      }
      if (!control.matches(controlSelector)) {
        return 'for attribute does not point to a labelable element';
      }
    } else {
      control = el.querySelector(controlSelector);
      if (!control) {
        return 'label is not associated with a control';
      }
    }

    if (el[symbols.visible] && !control[symbols.visible]) {
      return 'associated control is not visible';
    }

    return null;
  }
}
