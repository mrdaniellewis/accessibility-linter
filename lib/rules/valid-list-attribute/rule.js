import Rule from '../../rule';
import { rSpace } from '../../utils';

export default class extends Rule {
  get selector() {
    return 'input[list]';
  }

  test(el) {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if (['hidden', 'checkbox', 'radio', 'file', 'submit', 'image', 'reset', 'button'].includes(type)) {
      return 'list attribute is not valid for this input type';
    }

    const id = el.getAttribute('list');
    if (!id) {
      return 'list attribute should not be empty';
    }
    if (rSpace.test(id)) {
      return 'list attribute should not contain space characters';
    }
    const datalist = document.getElementById(id);
    if (!datalist) {
      return `cannot find <datalist> with id "${id}"`;
    }

    if (!(datalist instanceof HTMLDataListElement)) {
      return 'list attribute does not point to a <datalist> element';
    }

    return null;
  }
}
