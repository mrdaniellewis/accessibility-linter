const Rule = require('../../rule');
const ExtendedArray = require('../../../support/extended-array');

/**
 *  Check the colour contrast for all visible nodes with child text nodes
 */
module.exports = class extends Rule {
  setDefaults() {
    this.enabled = false;
    this.min = 4.5;
    this.minLarge = 3;
  }

  run(context, filter = () => true, utils) {
    return this.iterate(context, utils, false)
      .filter(filter)
      .map(el => this.findAncestor(el, utils))
      .unique()
      .filter(filter)
      .map(el => [el, this.test(el, utils)])
      .filter(([, ratio]) => ratio)
      .map(([el, ratio]) => this.message(el, ratio));
  }

  iterate(node, utils, iterateSiblings) {
    let found = new ExtendedArray();
    let cursor = node;
    while (cursor) {
      if (!utils.hidden(cursor, { noAria: true })) {
        if (this.hasTextNode(cursor)) {
          found.push(cursor);
        }

        if (cursor.firstElementChild) {
          found = found.concat(this.iterate(cursor.firstElementChild, utils, true));
        }
      }

      if (iterateSiblings) {
        cursor = cursor.nextElementSibling;
      } else {
        cursor = null;
      }
    }

    return found;
  }

  // Does the element have a text node with content
  hasTextNode(el) {
    return Array.from(el.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .some(node => node.data.trim());
  }

  // Find the last ancestor or self with the same colours
  findAncestor(el, utils) {
    const colour = utils.contrast.textColour(el);
    const backgroundColour = utils.contrast.backgroundColour(el);

    let cursor = el;
    while (cursor.parentNode !== document) {
      const parent = cursor.parentNode;
      if (utils.contrast.textColour(parent) !== colour
        && utils.contrast.backgroundColour(parent) !== backgroundColour) {
        break;
      }
      cursor = parent;
    }

    return cursor;
  }

  // Does the element meet AAA or AA standards
  test(el, utils) {
    const ratio = parseFloat(utils.contrast.textContrast(el).toFixed(2));

    if (ratio >= this.min) {
      return null;
    }

    const fontSize = parseFloat(utils.style(el, 'fontSize'));
    let fontWeight = utils.style(el, 'fontWeight');
    if (fontWeight === 'bold') {
      fontWeight = 700;
    } else if (fontWeight === 'normal') {
      fontWeight = 400;
    }
    const large = fontSize >= 24 /* 18pt */ || (fontSize >= 18.66 /* 14pt */ && fontWeight >= 700);

    if (large && ratio >= this.minLarge) {
      return null;
    }

    return ratio;
  }

  message(el, ratio) {
    return { el, message: `contrast is too low ${parseFloat(ratio.toFixed(2))}:1` };
  }
};
