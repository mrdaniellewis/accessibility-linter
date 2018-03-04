import Rule from '../../rule';
import { rSpace } from '../../utils';

export default class extends Rule {
  get selector() {
    return 'td[headers],th[headers]';
  }

  test(el) {
    const ids = el.getAttribute('headers');
    if (!ids) {
      return 'headers attribute should not be empty';
    }

    return ids.split(rSpace).filter(Boolean).map((id) => {
      const header = document.getElementById(id);
      if (!header) {
        return `cannot find a <th> with id "${id}"`;
      }
      if (header.nodeName.toLowerCase() !== 'th') {
        return `header id "${id}" does not point to a <th> element`;
      }
      return null;
    });
  }
}
