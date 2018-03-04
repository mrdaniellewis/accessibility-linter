import Rule from '../../rule';
import { rSpace } from '../../utils';

const selector = ['button', 'fieldset', 'input', 'object', 'output', 'select', 'textarea']
  .map(name => `${name}[form]`)
  .join(',');

export default class extends Rule {
  get selector() {
    return selector;
  }

  test(el) {
    const id = el.getAttribute('form');
    if (!id) {
      return 'form attribute should not be empty';
    }
    if (rSpace.test(id)) {
      return 'form attribute should not contain space characters';
    }
    const form = document.getElementById(id);
    if (!form) {
      return `cannot find form with id "${id}"`;
    }

    if (!(form instanceof HTMLFormElement)) {
      return 'form attribute does not point to a <form> element';
    }

    return null;
  }
}
