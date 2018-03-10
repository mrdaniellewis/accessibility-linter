import Rule from '../../rule';
import { $$ } from '../../utils';

export default class extends Rule {
  constructor(options) {
    super(options);
    this.emptyTitle = (options.emptyTitle || '').trim();
  }

  run(context, filter) {
    const errors = [];
    if (context === document && filter(document)) {
      const title = document.title.trim();
      if (!title || title === this.emptyTitle) {
        errors.push({ element: document, message: 'document must have a title' });
      }
    }

    $$('title', context)
      .filter(filter)
      .forEach((element, i) => {
        if (element.parentNode !== document.head) {
          errors.push({ element, message: 'must only appear in <head>' });
          return;
        }
        if (i > 0) {
          errors.push({ element, message: 'document must only have one <title> element' });
        }
      });

    return errors;
  }
}
