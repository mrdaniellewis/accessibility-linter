// Luminosity calculation
/* eslint-disable class-methods-use-this */

function gamma(value) {
  const n = value / 255;
  // eslint-disable-next-line no-restricted-properties
  return n <= 0.03928 ? n / 12.92 : Math.pow(((n + 0.055) / 1.055), 2.4);
}

function blendAlpha(s, d) {
  return s + (d * (1 - s));
}

function blendChannel(sc, dc, sa, da, ba) {
  return ((sc * sa) + (dc * da * (1 - sa))) / ba;
}

function blend(colours) {
  let [r, g, b, a] = [0, 0, 0, 0];
  colours.reverse().forEach(([_r, _g, _b, _a]) => {
    const aNew = blendAlpha(_a, a);
    r = blendChannel(_r, r, _a, a, aNew);
    g = blendChannel(_g, g, _a, a, aNew);
    b = blendChannel(_b, b, _a, a, aNew);
    a = aNew;
  });
  return [Math.round(r), Math.round(g), Math.round(b), a];
}

function luminosity(r, g, b) {
  // https://en.wikipedia.org/wiki/Relative_luminance
  return (0.2126 * gamma(r)) + (0.7152 * gamma(g)) + (0.0722 * gamma(b));
}

function contrastRatio(l1, l2) {
  // https://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
  if (l1 < l2) {
    [l2, l1] = [l1, l2];
  }
  return (l1 + 0.05) / (l2 + 0.05);
}

// Convert a CSS colour to an array of RGBA values
function toRgbaArray(style) {
  const el = document.createElement('div');
  el.style.color = style;
  document.body.appendChild(el);
  const value = window.getComputedStyle(el).color;
  if (!value) {
    throw new Error('unable to parse colour');
  }
  return colourParts(value); // eslint-disable-line no-use-before-define
}

/**
 * Given a colour in rgba or rgb format, get its parts
 * The parts should be in the range 0 to 1
 */
function colourParts(colour) {
  if (colour === 'transparent') {
    return [0, 0, 0, 0];
  }
  const match = colour.match(/^rgba?\((\d+), *(\d+), *(\d+)(?:, *(\d+(?:\.\d+)?))?\)$/);
  if (match) {
    return [+match[1], +match[2], +match[3], match[4] ? parseFloat(match[4]) : 1];
  }
  return toRgbaArray(colour);
}

module.exports = class Contrast {
  constructor(styleCache) {
    this.styleCache = styleCache;
  }

  textContrast(el) {
    return contrastRatio(this._textLuminosity(el), this._backgroundLuminosity(el));
  }

  _blendWithBackground(colour, el) {
    if (colour[3] === 1) {
      return colour;
    }
    const colourStack = [colour];
    let cursor = el;
    let currentColour = colour;
    do {
      let background;
      if (cursor === document) {
        // I assume this is always the case?
        background = [255, 255, 255, 1];
      } else {
        background = colourParts(this.styleCache.get(cursor, 'backgroundColor'));
      }
      currentColour = background;
      if (currentColour[3] !== 0) {
        colourStack.push(currentColour);
      }
    } while (currentColour[3] !== 1 && (cursor = cursor.parentNode));
    return blend(colourStack);
  }

  textColour(el) {
    const colour = colourParts(this.styleCache.get(el, 'color'));
    return this._blendWithBackground(colour, el);
  }

  backgroundColour(el) {
    return this._blendWithBackground([0, 0, 0, 0], el);
  }

  _textLuminosity(el) {
    return luminosity.apply(null, this.textColour(el));
  }

  _backgroundLuminosity(el) {
    return luminosity.apply(null, this.backgroundColour(el));
  }

  /**
   * The contrast between two colours
   */
  static colourContrast(foreground, background) {
    foreground = colourParts(foreground);
    background = colourParts(background);
    if (background[3] !== 1) {
      background = blend([background, [255, 255, 255, 1]]);
    }
    if (foreground[3] !== 1) {
      foreground = blend([foreground, background]);
    }
    return contrastRatio(
      luminosity.apply(null, foreground),
      luminosity.apply(null, background)
    );
  }
};

// The following are exposed for unit testing
module.exports.prototype._blend = blend;
module.exports.prototype._luminosity = luminosity;
module.exports.prototype._colourParts = colourParts;
module.exports.prototype._contrastRatio = contrastRatio;
