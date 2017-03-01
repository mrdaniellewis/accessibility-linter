const message = 'use a button instead of a link';

it('does not add an error for a normal link', when(() => {
  el = appendToBody('<a href="/foo">foo</a>');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error if a link with role button is used', when(() => {
  el = appendToBody('<a role="button">foo</a>');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));

it('adds an error if a link has an empty fragment', when(() => {
  el = appendToBody('<a href="#">foo</a>');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));

it('adds an error if a link uses the javascript protocol', when(() => {
  el = appendToBody('<a href="javascript:print()">foo</a>');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));

it('does not add an error for a hidden link', when(() => {
  el = appendToBody('<a href="#" style="display: none;">foo</a>');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
