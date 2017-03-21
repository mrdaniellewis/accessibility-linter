describe('#hidden', () => {
  let utils;

  beforeEach(() => {
    utils = new AccessibilityLinter.Utils();
  });

  clean();

  it('is false for elements that are not hidden', () => {
    const el = appendToBody('<div>x</div>');
    expect(utils.hidden(el)).toEqual(false);
  });

  it('is true for elements that are display: none', () => {
    const el = appendToBody('<div style="display: none">foo</div>');
    expect(utils.hidden(el)).toEqual(true);
  });

  it('is true for elements that have a parent set to display: none', () => {
    const el = appendToBody('<div style="display: none"><p>foo</p></div>');
    expect(utils.hidden(el.querySelector('p'))).toEqual(true);
  });

  it('is true for elements that are visibility: hidden', () => {
    const el = appendToBody('<div style="visibility: hidden">foo</div>');
    expect(utils.hidden(el)).toEqual(true);
  });

  it('is true for elements that have a parent set to visibility: hidden', () => {
    const el = appendToBody('<div style="visibility: hidden"><p>foo</p></div>');
    expect(utils.hidden(el.querySelector('p'))).toEqual(true);
  });

  it('is true for elements that are visibility: collapse', () => {
    const el = appendToBody('<div style="visibility: collapse">foo</div>');
    expect(utils.hidden(el)).toEqual(true);
  });

  it('is true for elements that have a parent set to visibility: collapse', () => {
    const el = appendToBody('<div style="visibility: collapse"><p>foo</p></div>');
    expect(utils.hidden(el.querySelector('p'))).toEqual(true);
  });

  ['br', 'wbr'].forEach((name) => {
    it(`is false for a visible ${name}`, () => {
      const el = appendToBody(`<${name} />`);
      expect(utils.hidden(el)).toEqual(false);
    });

    it(`is true for a hidden ${name}`, () => {
      const el = appendToBody(`<div style="display: none"><${name} /></div>`);
      expect(utils.hidden(el.querySelector(name))).toEqual(false);
    });
  });

  it('is false for document', () => {
    expect(utils.hidden(document)).toEqual(false);
  });

  it('caches the hidden status', () => {
    const el = appendToBody('<div style="display: none">foo</div>');
    const spy = expect.spyOn(el, 'getClientRects').andCallThrough();
    utils.hidden(el);
    expect(utils.hidden(el)).toEqual(true);
    expect(spy.calls.length).toEqual(1);
  });

  it('caches per element', () => {
    const el = appendToBody('<div style="display: none">foo</div>');
    const el2 = appendToBody('<div>foo</div>');
    utils.hidden(el);
    expect(utils.hidden(el2)).toEqual(false);
  });

  it('is false for elements that have aria-hidden=true', () => {
    const el = appendToBody('<div aria-hidden="true">x</div>');
    expect(utils.hidden(el)).toEqual(false);
  });

  it('is false for elements that have a parent set to aria-hidden=true', () => {
    const el = appendToBody('<div aria-hidden="true"><p>foo</p></div>');
    expect(utils.hidden(el.querySelector('p'))).toEqual(false);
  });

  describe('ariaHidden option', () => {
    it('is true if an element is aria-hidden', () => {
      const el = appendToBody('<div aria-hidden="true">foo</div>');
      expect(utils.hidden(el, { ariaHidden: true })).toEqual(true);
    });

    it('is true if an elements parent is aria-hidden', () => {
      const el = appendToBody('<div aria-hidden="true"><p>foo</p></div>');
      expect(utils.hidden(el.querySelector('p'), { ariaHidden: true })).toEqual(true);
    });

    it('caches the hidden status', () => {
      const el = appendToBody('<div aria-hidden="true">foo</div>');
      const spy = expect.spyOn(el, 'getAttribute').andCallThrough();
      utils.hidden(el, { ariaHidden: true });
      expect(utils.hidden(el, { ariaHidden: true })).toEqual(true);
      expect(spy.calls.length).toEqual(1);
    });

    it('caches per element', () => {
      const el = appendToBody('<div style="display: none">foo</div>');
      const el2 = appendToBody('<div>foo</div>');
      utils.hidden(el, { ariaHidden: true });
      expect(utils.hidden(el2, { noAria: true })).toEqual(false);
    });

    it('caches aria and not aria separately', () => {
      const el = appendToBody('<div aria-hidden="true">foo</div>');
      utils.hidden(el, { ariaHidden: true });
      expect(utils.hidden(el)).toEqual(false);
    });
  });
});
