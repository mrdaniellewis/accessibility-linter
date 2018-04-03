import Rule from '../rule';

export default class DomIteratorRule extends Rule {
  run(context, filter) {
    const root = context === document ? document.documentElement : context;
    const walker = document.createNodeIterator(
      root,
      NodeFilter.SHOW_ELEMENT,
    );
    const errors = [];
    let cursor = root;
    while (cursor) {
      if (filter(cursor)) {
        const result = this.test(cursor);
        if (result) {
          errors.push(Object.assign({ element: cursor }, result));
        }
      }
      cursor = walker.nextNode();
    }
    return errors;
  }
}
