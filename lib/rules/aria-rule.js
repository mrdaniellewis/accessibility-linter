import { symbols } from 'aria-extensions';
import Rule from '../rule';
import { ExtendedArray } from '../utils';

export default class AriaRule extends Rule {
  select(context) {
    const target = context === document ? document.documentElement : context;
    return ExtendedArray.from(target[symbols.findRole](this.selector));
  }
}
