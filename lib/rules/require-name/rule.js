import { roles } from 'aria-config';
import ariaExtensions from 'aria-extensions';
import { $$ } from '../../utils';
import AriaRule from '../aria-rule';

const { accessibleName, findFocusable } = ariaExtensions.symbols;

const selector = Object.entries(roles)
  .filter(([, value]) => value.accessibleNameRequired)
  .map(([key]) => key);

export default class extends AriaRule {
  get visibleOnly() {
    return 'aria';
  }

  get selector() {
    return selector;
  }

  select(context) {
    return super.select(context)
      // Some elements don't map to a role in aria 1.1 so we need to select them separately
      .concat($$('input:not([type="hidden"]),iframe,output,meter,fieldset,details', context))
      .concat(context[findFocusable]())
      .unique();
  }

  test(el) {
    if (!el[accessibleName]) {
      return 'element must have an accessible name';
    }
    return null;
  }
}
