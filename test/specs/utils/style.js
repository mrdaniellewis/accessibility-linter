describe('#style', () => {
  let utils;

  beforeEach(() => {
    utils = new AccessibilityLinter.Utils();
  });

  clean();

  context('element styles', () => {
    it('returns computed styles', () => {
      const el = appendToBody('<div style="color: #f00;">x</div>');
      expect(utils.style(el, 'color')).toEqual('rgb(255, 0, 0)');
    });

    it('caches a computed style', () => {
      const el = appendToBody('<div style="color: #f00;">x</div>');
      const spy = expect.spyOn(window, 'getComputedStyle').andCallThrough();
      utils.style(el, 'color');
      expect(utils.style(el, 'color')).toEqual('rgb(255, 0, 0)');
      expect(spy.calls.length).toEqual(1);
    });

    it('caches per element', () => {
      const el = appendToBody('<div style="color: #f00;">x</div>');
      const el2 = appendToBody('<div style="color: #0f0;">x</div>');
      utils.style(el, 'color');
      expect(utils.style(el2, 'color')).toEqual('rgb(0, 255, 0)');
    });
  });

  context('pseudo element styles', () => {
    it('returns computed pseudo element styles', () => {
      appendToBody('<style>.pseudo-test::before { color: #00f; content: "x"; }</style>');
      const el = appendToBody('<div class="pseudo-test">x</div>');
      expect(utils.style(el, 'color', 'before')).toEqual('rgb(0, 0, 255)');
    });

    it('caches a computed style', () => {
      appendToBody('<style>.pseudo-test::before { color: #00f; content: "x"; }</style>');
      const el = appendToBody('<div class="pseudo-test">x</div>');
      const spy = expect.spyOn(window, 'getComputedStyle').andCallThrough();
      utils.style(el, 'color', 'before');
      expect(utils.style(el, 'color', 'before')).toEqual('rgb(0, 0, 255)');
      expect(spy.calls.length).toEqual(1);
    });

    it('caches separately to element styles', () => {
      appendToBody('<style>.pseudo-test::before { color: #00f; content: "x"; }</style>');
      const el = appendToBody('<div class="pseudo-test">x</div>');
      utils.style(el, 'color');
      expect(utils.style(el, 'color', 'before')).toEqual('rgb(0, 0, 255)');
    });

    it('caches per element', () => {
      appendToBody('<style>.pseudo-test::before { color: #00f; content: "x"; }</style>');
      const el = appendToBody('<div class="pseudo-test">x</div>');
      const el2 = appendToBody('<div style="color: #f00">x</div>');
      utils.style(el, 'color', 'before');
      expect(utils.style(el2, 'color', 'before')).toEqual('rgb(255, 0, 0)');
    });
  });
});
