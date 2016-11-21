it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('Fragment not found in document');
});

it('it does not add an error for a link without a hash', when(() => {
  appendToBody('<a href="path" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('it does not add an error if a link to a hash points to a valid id', when(() => {
  const id = uniqueId();
  appendToBody(`<p id="${id}">p</p><a href="#${id}">link</a>`);
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('it does not add an error if a link to a hash points to a valid anchor name', when(() => {
  const id = uniqueId();
  appendToBody(`<a name="${id}">p</p><a href="#${id}">link</a>`);
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('it does not add an error if link with a hash points to another location', when(() => {
  const id = uniqueId();
  appendToBody(`<a href="other#${id}">link</a>`);
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('it does not add an error if a page with a base and a link with a hash points to another location', when(() => {
  const id = uniqueId();
  $('<base href="http://www.example.com" />').appendTo('head');
  appendToBody(`<a href="#${id}">link</a>`);
}).then(() => {
  expect(logger).toNotHaveEntries();
  $('base').remove();
}));

it('it adds an error if link with a hash has no valid target on the page', when(() => {
  const id = uniqueId();
  el = appendToBody(`<a href="#${id}">link</a>`);
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('it adds an error if link with a path and hash has no valid target on the page', when(() => {
  const id = uniqueId();
  el = appendToBody(`<a href="${location.pathname}#${id}">link</a>`);
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('it adds an error if an absolute link with a hash has no valid target on the page', when(() => {
  const id = uniqueId();
  el = appendToBody(`<a href="${location.href}#${id}">link</a>`);
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('it adds an error if a page with a base and a link with a hash has no valid target on the page', when(() => {
  const pathParts = location.pathname.split('/');
  $(`<base href="${pathParts.slice(0, -2).join('/')}" />`).appendTo('head');
  const id = uniqueId();
  el = appendToBody(`<a href="${pathParts.slice(-3).join('/')}#${id}">link</a>`);
}).then(() => {
  $('base').remove();
  expect(logger).toHaveEntries([rule, el]);
}));

it('does not blow up if the hash requires css escaping', when(() => {
  el = appendToBody('<a href="#%22 %5c">link</a>');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));
