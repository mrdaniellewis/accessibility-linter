const message = 'fragment not found in document';

it('it does not add an error for a link without a hash', () => {
  appendToBody('<a href="path" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('it does not add an error if a link to a hash points to a valid id', () => {
  const id = uniqueId();
  appendToBody(`<p id="${id}">p</p><a href="#${id}">link</a>`);
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('it does not add an error if a link to a hash points to a valid anchor name', () => {
  const id = uniqueId();
  appendToBody(`<a name="${id}">p</p><a href="#${id}">link</a>`);
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('it does not add an error if link with a hash points to another location', () => {
  const id = uniqueId();
  appendToBody(`<a href="other#${id}">link</a>`);
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('it does not add an error if a page with a base and a link with a hash points to another location', () => {
  const id = uniqueId();
  document.head.appendChild(buildHtml('<base href="http://www.example.com" />'));
  appendToBody(`<a href="#${id}">link</a>`);
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('it adds an error if link with a hash has no valid target on the page', () => {
  const id = uniqueId();
  const el = appendToBody(`<a href="#${id}">link</a>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('it adds an error if link with a path and hash has no valid target on the page', () => {
  const id = uniqueId();
  const el = appendToBody(`<a href="${location.pathname}#${id}">link</a>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('it adds an error if an absolute link with a hash has no valid target on the page', () => {
  const id = uniqueId();
  const el = appendToBody(`<a href="${location.href}#${id}">link</a>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('it adds an error if a page with a base and a link with a hash has no valid target on the page', () => {
  const pathParts = location.pathname.split('/');
  document.head.appendChild(buildHtml(`<base href="${pathParts.slice(0, -2).join('/')}" />`));
  const id = uniqueId();
  const el = appendToBody(`<a href="${pathParts.slice(-3).join('/')}#${id}">link</a>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('does not blow up if the hash requires css escaping', () => {
  const el = appendToBody('<a href="#%22 %5c">link</a>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});
