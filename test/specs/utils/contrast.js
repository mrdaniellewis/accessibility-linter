describe('#contrast', () => {
  let contrast;

  beforeEach(() => {
    contrast = new AccessibilityLinter.Utils().contrast;
  });

  describe('#_luminosity', () => {
    it('is 0 for black', () => {
      expect(contrast._luminosity(0, 0, 0)).toEqual(0);
    });

    it('is 1 for white', () => {
      expect(contrast._luminosity(255, 255, 255)).toEqual(1);
    });

    it('is 0.2126 for red', () => {
      expect(contrast._luminosity(255, 0, 0)).toEqual(0.2126);
    });

    it('is 0.7152 for green', () => {
      expect(contrast._luminosity(0, 255, 0)).toEqual(0.7152);
    });

    it('is 0.0722 for blue', () => {
      expect(contrast._luminosity(0, 0, 255)).toEqual(0.0722);
    });

    it('is correct for 1% grey', () => {
      expect(contrast._luminosity(255 * 0.01, 255 * 0.01, 255 * 0.01).toFixed(4)).toEqual('0.0008');
    });

    it('is correct for 50% grey', () => {
      expect(contrast._luminosity(255 * 0.5, 255 * 0.5, 255 * 0.5).toFixed(4)).toEqual('0.2140');
    });
  });

  describe('#contrastRatio', () => {
    it('is 1 for all black', () => {
      expect(contrast._contrastRatio(0, 0)).toEqual(1);
    });

    it('is 1 for all white', () => {
      expect(contrast._contrastRatio(1, 1)).toEqual(1);
    });

    it('is 1 for all 0.5', () => {
      expect(contrast._contrastRatio(0.5, 0.5)).toEqual(1);
    });

    it('is 21 for maximum contrast', () => {
      expect(contrast._contrastRatio(1, 0)).toEqual(21);
    });

    it('is correct for 1 / 0.5 luminosity', () => {
      expect(contrast._contrastRatio(1, 0.5).toFixed(4)).toEqual('1.9091');
    });

    it('is accepts luminosities in any order', () => {
      expect(contrast._contrastRatio(0, 1)).toEqual(21);
    });
  });

  describe('#blend', () => {
    it('returns solid foreground colours as is', () => {
      expect(contrast._blend([[30, 40, 50, 1], [60, 70, 80, 0.4]]))
        .toEqual([30, 40, 50, 1]);
    });

    it('returns the background colour if the foreground is transparent', () => {
      expect(contrast._blend([[10, 10, 10, 0], [30, 40, 50, 0.4]]))
        .toEqual([30, 40, 50, 0.4]);
    });

    it('it blends alpha with a solid colour', () => {
      expect(contrast._blend([[20, 20, 20, 0.2], [30, 40, 50, 1]]))
        .toEqual([28, 36, 44, 1]);
    });

    it('it blends alpha with an alpha', () => {
      expect(contrast._blend([[20, 40, 60, 0.5], [80, 90, 100, 0.2]]))
        .toEqual([30, 48, 67, 0.6]);
    });

    it('it blends multiple colours', () => {
      expect(contrast._blend([[20, 40, 60, 0.5], [80, 90, 100, 0.2], [110, 120, 130, 1]]))
        .toEqual([62, 77, 92, 1]);
    });
  });

  describe('#_colourParts', () => {
    it('parses "transparent"', () => {
      expect(contrast._colourParts('transparent')).toEqual([0, 0, 0, 0]);
    });

    it('parses transparent rgba', () => {
      expect(contrast._colourParts('rgba(0, 0, 0, 0)')).toEqual([0, 0, 0, 0]);
    });

    it('parses rgb', () => {
      expect(contrast._colourParts('rgb(51, 102, 153)')).toEqual([51, 102, 153, 1]);
    });

    it('parses rgba with a whole alpha', () => {
      expect(contrast._colourParts('rgba(51, 102, 153, 1)')).toEqual([51, 102, 153, 1]);
    });

    it('parses rgb without spaces', () => {
      expect(contrast._colourParts('rgb(51,102,153)')).toEqual([51, 102, 153, 1]);
    });

    it('parses rgba with a decimal alpha', () => {
      expect(contrast._colourParts('rgba(51, 102, 153, 0.3)')).toEqual([51, 102, 153, 0.3]);
    });

    it('parses hex', () => {
      expect(contrast._colourParts('#1f2f3f')).toEqual([31, 47, 63, 1]);
    });

    it('parses shorthand hex', () => {
      expect(contrast._colourParts('#123')).toEqual([17, 34, 51, 1]);
    });

    it('parses named colours', () => {
      expect(contrast._colourParts('rebeccapurple')).toEqual([102, 51, 153, 1]);
    });
  });

  describe('AccessibilityLinter.colourContrast', () => {
    const colourContrast = AccessibilityLinter.colourContrast;

    it('returns 1 for same luminosities', () => {
      expect(colourContrast('#aaa', '#aaa')).toEqual(1);
    });

    it('returns 21 for maximum contrast', () => {
      expect(colourContrast('#fff', '#000')).toEqual(21);
    });

    it('returns 9.04 or #aaa on #000 for something', () => {
      expect(colourContrast('#aaa', '#000').toFixed(2)).toEqual('9.04');
    });

    it('can handle named colours', () => {
      expect(colourContrast('red', 'green').toFixed(2)).toEqual('1.28');
    });

    it('it blends rgba', () => {
      expect(colourContrast('rgba(17, 85, 170, .6)', 'rgba(0, 0, 0, .2)').toFixed(2)).toEqual('2.38');
    });
  });

  describe('#textColour', () => {
    clean();

    it('returns the text colour', () => {
      const el = appendToBody('<div style="color: #f00" />');
      expect(contrast.textColour(el)).toEqual([255, 0, 0, 1]);
    });

    it('blends alpha with the background', () => {
      const el = appendToBody('<div style="color: rgba(51, 102, 153, .5); background-color: #123" />');
      expect(contrast.textColour(el)).toEqual([34, 68, 102, 1]);
    });

    it('blends alpha with a parent background', () => {
      const el = appendToBody('<div style="background-color: #123"><div style="color: rgba(51, 102, 153, .5);" /></div>');
      expect(contrast.textColour(el.firstChild)).toEqual([34, 68, 102, 1]);
    });

    it('blends with the document default colour', () => {
      const el = appendToBody('<div style="color: rgba(51, 102, 153, .5);" />');
      expect(contrast.textColour(el)).toEqual([153, 179, 204, 1]);
    });

    it('only looks up styles for each element once', () => {
      const el = appendToBody('<div style="color: #f00" />');
      expect(contrast.textColour(el)).toEqual([255, 0, 0, 1]);
      const spy = expect.spyOn(window, 'getComputedStyle').andCallThrough();
      expect(contrast.textColour(el)).toEqual([255, 0, 0, 1]);
      expect(spy.calls.length).toEqual(0);
    });

    it('stops looking up background-color after an opaque colour is found', () => {
      const spy = expect.spyOn(window, 'getComputedStyle').andCallThrough();
      const el = appendToBody('<div style="color: rgba(51, 102, 153, .5); background-color: #123" />');
      expect(contrast.textColour(el)).toEqual([34, 68, 102, 1]);
      expect(spy.calls.length).toEqual(2);
    });
  });

  describe('#backgroundColour', () => {
    clean();

    it('returns the background colour', () => {
      const el = appendToBody('<div style="background-color: #f00" />');
      expect(contrast.backgroundColour(el)).toEqual([255, 0, 0, 1]);
    });

    it('blends alpha with a parent background', () => {
      const el = appendToBody('<div style="background-color: #123"><div style="background-color: rgba(51, 102, 153, .5);" /></div>');
      expect(contrast.backgroundColour(el.firstChild)).toEqual([34, 68, 102, 1]);
    });

    it('blends with the document default colour', () => {
      const el = appendToBody('<div style="background-color: rgba(51, 102, 153, .5);" />');
      expect(contrast.backgroundColour(el)).toEqual([153, 179, 204, 1]);
    });

    it('only looks up styles for each element once', () => {
      const el = appendToBody('<div style="background-color: #f00" />');
      expect(contrast.backgroundColour(el)).toEqual([255, 0, 0, 1]);
      const spy = expect.spyOn(window, 'getComputedStyle').andCallThrough();
      expect(contrast.backgroundColour(el)).toEqual([255, 0, 0, 1]);
      expect(spy.calls.length).toEqual(0);
    });

    it('stops looking up background-color after an opaque colour is found', () => {
      const spy = expect.spyOn(window, 'getComputedStyle').andCallThrough();
      const el = appendToBody('<div style="background-color: #123"><div style="background-color: rgba(51, 102, 153, .5);" /></div>');
      expect(contrast.backgroundColour(el.firstChild)).toEqual([34, 68, 102, 1]);
      expect(spy.calls.length).toEqual(2);
    });
  });

  describe('#textContrast', () => {
    clean();

    it('returns 1 for same colour', () => {
      const el = appendToBody('<div style="color: #f00; background-color: #f00;"></div>');
      expect(contrast.textContrast(el)).toEqual(1);
    });

    it('returns 21 for white text on a black background', () => {
      const el = appendToBody('<div style="color: #fff; background-color: #000;"></div>');
      expect(contrast.textContrast(el)).toEqual(21);
    });

    it('returns 21 for black text on a white background', () => {
      const el = appendToBody('<div style="color: #000; background-color: #fff;"></div>');
      expect(contrast.textContrast(el)).toEqual(21);
    });

    it('returns 9.04 for #000 on #aaa', () => {
      const el = appendToBody('<div style="color: #000; background-color: #aaa;"></div>');
      expect(contrast.textContrast(el).toFixed(2)).toEqual('9.04');
    });

    it('returns 9.06 for #00000099 on #ccc (foreground with alpha)', () => {
      const el = appendToBody('<div style="color: rgba(0, 0, 0, .6); background-color: #ccc;"></div>');
      expect(contrast.textContrast(el).toFixed(2)).toEqual('4.87');
    });

    it('returns the correct value for a background color applied to a parent', () => {
      const el = appendToBody('<div style="background-color: #aaa"><div style="color: #000"></div></div>');
      expect(contrast.textContrast(el.firstChild).toFixed(2)).toEqual('9.04');
    });

    it('returns the correct value for a background color applied to a grand-parent', () => {
      const el = appendToBody('<div style="background-color: #aaa"><div><div style="color: #000"></div></div></div>');
      expect(contrast.textContrast(el.firstChild.firstChild).toFixed(2)).toEqual('9.04');
    });

    it('returns the correct value for no background colour up to document', () => {
      const el = appendToBody('<div style="color: #aaa" />');
      expect(contrast.textContrast(el).toFixed(2)).toEqual('2.32');
    });

    it('returns the correct value for alpha transparencies on background', () => {
      const el = appendToBody('<div style="color: rgba(255, 0, 0, .6);"><div style="color: #000" /></div>');
      expect(contrast.textContrast(el).toFixed(2)).toEqual('2.86');
    });
  });
});
