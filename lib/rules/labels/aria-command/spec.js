const message = 'elements with a role with a superclass of command must have a label';

it('does not add an error to elements without a role', when(() => {
  appendToBody('<div />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

['button', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio'].forEach((role) => {
  describe(`[role="${role}"]`, () => {
    it('does not add an error to elements that are hidden', when(() => {
      appendToBody(`<div role="${role}" aria-hidden="true" />`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));

    it('does not add an error to elements with a label', when(() => {
      appendToBody(`<div role="${role}">foo</div>`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));

    it('does add an error to elements without a label', when(() => {
      el = appendToBody(`<div role="${role}" />`);
    }).then(() => {
      expect(logger).toHaveEntries([message, el]);
    }));
  });
});
