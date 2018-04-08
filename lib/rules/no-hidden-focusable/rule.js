import ariaExtensions from 'aria-extensions';
import { ExtendedArray } from '../../utils';
import Rule from '../../rule';

const { aria, findFocusable } = ariaExtensions.symbols;

export default class extends Rule {
  select(context) {
    return ExtendedArray.from(context[findFocusable]());
  }

  test(element) {
    if (element.getAttribute('aria-hidden') === 'true') {
      return 'aria-hidden="true" is not allowed for a focusable element';
    }

    if (element.closest('[aria-hidden="true"]')) {
      return 'focusable elements cannot have an ancestor with aria-hidden="true"';
    }

    const explicit = element[aria].explicit;
    if (['none', 'presentation'].includes(explicit)) {
      return `focusable elements cannot have a role of ${explicit}`;
    }

    return null;
  }
}
