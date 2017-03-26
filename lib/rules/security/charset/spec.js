it('does not add an error if there is a meta charset tag with UTF-8', () => {
  linter.run();
  expect(logger).toNotHaveEntries();
});

it('adds an error if the charset is not UTF-8', () => {
  Object.defineProperty(document, 'characterSet', { get() { return 'euc-jp'; }, configurable: true });
  linter.run();
  expect(logger).toHaveErrors(['all HTML documents should be authored in UTF-8', document.documentElement]);
  delete document.characterSet;
});

it('adds an error if there is no charset tag', () => {
  cleaner.pause();
  const charset = document.querySelector('meta[charset]');
  charset.remove();

  linter.run();
  expect(logger).toHaveErrors(['missing `<meta charset="UTF-8">`', document.head]);

  document.head.prepend(charset);
});

it('adds an error if a charset tag is not the first child of <head>', () => {
  cleaner.pause();
  const charset = document.querySelector('meta[charset]');
  document.head.appendChild(charset);

  linter.run();
  expect(logger).toHaveErrors(['meta charset should be the first child of <head>', charset]);

  document.head.prepend(charset);
});

it('adds an error if the http-equiv attribute is used', () => {
  cleaner.pause();
  const charset = document.querySelector('meta[charset]');
  charset.remove();
  const httpEquiv = buildHtml('<meta http-equiv="cOnTeNt-TyPe" content="text/html; charset=UTF-8" />');
  document.head.prepend(httpEquiv);

  linter.run();
  expect(logger).toHaveErrors(['use the form `<meta charset="UTF-8">`', httpEquiv]);

  httpEquiv.remove();
  document.head.prepend(charset);
});

it('adds an error if there are multiple meta charset tags', () => {
  const charset = document.querySelector('meta[charset]');
  const httpEquiv = buildHtml('<meta http-equiv="content-type" content="text/html; charset=UTF-8" />');
  document.head.appendChild(httpEquiv);

  linter.run();
  expect(logger).toHaveErrors(
    ['more than one meta charset tag found', charset],
    ['more than one meta charset tag found', httpEquiv],
    ['use the form `<meta charset="UTF-8">`', httpEquiv],
    ['meta charset should be the first child of <head>', httpEquiv]
  );
});

it('does not add the same error twice', () => {
  Object.defineProperty(document, 'characterSet', { get() { return 'euc-jp'; }, configurable: true });
  linter.run();
  logger.clear();
  linter.run();
  expect(logger).toNotHaveEntries();
  delete document.characterSet;
});

it('does not add errors if the context does not include <html>', () => {
  Object.defineProperty(document, 'characterSet', { get() { return 'euc-jp'; }, configurable: true });
  linter.run(document.body);
  expect(logger).toNotHaveEntries();
  delete document.characterSet;
});

