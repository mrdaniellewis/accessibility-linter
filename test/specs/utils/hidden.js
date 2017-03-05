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

  it('is true for elements that have aria-hidden=true', () => {
    const el = appendToBody('<div aria-hidden="true">x</div>');
    expect(utils.hidden(el)).toEqual(true);
  });

  it('is true for elements that have a parent set to aria-hidden=true', () => {
    const el = appendToBody('<div aria-hidden="true"><p>foo</p></div>');
    expect(utils.hidden(utils.$('p', el))).toEqual(true);
  });

  it('is true for elements that are display: none', () => {
    const el = appendToBody('<div style="display: none">foo</div>');
    expect(utils.hidden(el)).toEqual(true);
  });

  it('is true for elements that have a parent set to display: none', () => {
    const el = appendToBody('<div style="display: none"><p>foo</p></div>');
    expect(utils.hidden(utils.$('p', el))).toEqual(true);
  });

  it('is true for elements that are visibility: hidden', () => {
    const el = appendToBody('<div style="visibility: hidden">foo</div>');
    expect(utils.hidden(el)).toEqual(true);
  });

  it('is true for elements that have a parent set to visibility: hidden', () => {
    const el = appendToBody('<div style="visibility: hidden"><p>foo</p></div>');
    expect(utils.hidden(utils.$('p', el))).toEqual(true);
  });

  it('is true for elements that are visibility: collapse', () => {
    const el = appendToBody('<div style="visibility: collapse">foo</div>');
    expect(utils.hidden(el)).toEqual(true);
  });

  it('is true for elements that have a parent set to visibility: collapse', () => {
    const el = appendToBody('<div style="visibility: collapse"><p>foo</p></div>');
    expect(utils.hidden(utils.$('p', el))).toEqual(true);
  });

  it('is false for document', () => {
    expect(utils.hidden(document)).toEqual(false);
  });

  it('caches the hidden status', () => {
    const el = appendToBody('<div style="display: none">foo</div>');
    const spy = expect.spyOn(el, 'getAttribute').andCallThrough();
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

  describe('noAria option', () => {
    it('ignores an aria-hidden element if true', () => {
      const el = appendToBody('<div aria-hidden="true">foo</div>');
      expect(utils.hidden(el, { noAria: true })).toEqual(false);
    });

    it('does not ignore a aria-hidden element if false', () => {
      const el = appendToBody('<div aria-hidden="true">foo</div>');
      expect(utils.hidden(el, { noAria: false })).toEqual(true);
    });

    it('caches the hidden status', () => {
      const el = appendToBody('<div aria-hidden="true">foo</div>');
      const spy = expect.spyOn(el, 'getClientRects').andCallThrough();
      utils.hidden(el, { noAria: true });
      expect(utils.hidden(el, { noAria: true })).toEqual(false);
      expect(spy.calls.length).toEqual(1);
    });

    it('caches per element', () => {
      const el = appendToBody('<div style="display: none">foo</div>');
      const el2 = appendToBody('<div>foo</div>');
      utils.hidden(el, { noAria: true });
      expect(utils.hidden(el2, { noAria: true })).toEqual(false);
    });

    it('caches aria and not aria separately', () => {
      const el = appendToBody('<div aria-hidden="true">foo</div>');
      utils.hidden(el, { noAria: false });
      expect(utils.hidden(el)).toEqual(true);
    });
  });
});
