import ariaExtensions from 'aria-extensions';
import Rule from '../../rule';
import { ExtendedArray } from '../../utils';

const { backgroundColour, contrast, visible, style, textColour } = ariaExtensions.symbols;

export default class extends Rule {
  constructor(options = {}) {
    super(options);
    this.min = options.min || 4.5;
    this.minLarge = options.minLarge || 3;
  }

  hasTextNodes(node) {
    let cursor = node.firstChild;
    while (cursor) {
      if (cursor.nodeType === Node.TEXT_NODE && cursor.data.trim()) {
        return true;
      }
      cursor = cursor.nextNode;
    }
    return false;
  }

  run(context, filter) {
    const root = context === document ? document.documentElement : context;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      node => (node[visible] ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    );

    const errors = new ExtendedArray();
    let cursor = root;
    while (cursor) {
      if (filter(cursor) && this.hasTextNodes(cursor)) {
        const result = this.test(cursor);
        if (result) {
          errors.push(Object.assign({ element: cursor }, result));
        }
      }
      cursor = walker.nextNode();
    }

    return this.deduplicate(errors);
  }

  test(node) {
    const ratio = parseFloat(node[contrast].toFixed(2));

    if (ratio >= this.min) {
      return null;
    }

    const fontSize = parseFloat(node[style]('fontSize'));
    let fontWeight = node[style]('fontWeight');
    fontWeight = { bold: 700, normal: 400 }[fontWeight] || fontWeight;
    const large = fontSize >= 24 /* 18pt */ || (fontSize >= 18.66 /* 14pt */ && fontWeight >= 700);

    if (large && ratio >= this.minLarge) {
      return null;
    }

    return { ratio, large };
  }

  deduplicate(errors) {
    // Only show the first element with each background / foreground combination
    return errors
      .groupBy(({ element, large }) => `${element[textColour]}:${element[backgroundColour]}:${large ? 'l' : 's'}`)
      .map(group => ({
        element: group[0].element,
        message: this.formatMessage(group[0].ratio, group[0].large, group.length),
      }));
  }

  formatMessage(ratio, large, count) {
    const minRatio = this.formatRatio(large ? this.minLarge : this.min);
    let message = `contrast is too low ${this.formatRatio(ratio)}, minimum ${minRatio}`;
    if (count > 1) {
      message += `, plus ${count - 1} more element${count > 2 ? 's' : ''}`;
    }
    return message;
  }

  formatRatio(ratio) {
    return `${parseFloat(ratio.toFixed(2))}:1`;
  }
}
