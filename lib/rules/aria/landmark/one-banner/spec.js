const message = 'there should only be one element with a role of banner in each document or application';

it('does not generate an error for one header', () => {
  appendToBody('<header />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for one element with the role banner', () => {
  appendToBody('<div role="banner" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does generate an error for more than one header', () => {
  const el1 = appendToBody('<header />');
  const el2 = appendToBody('<header />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(
      [message, el1],
      [message, el2]
    );
  });
});

it('does generate an error for more than one banner', () => {
  const el1 = appendToBody('<div role="banner" />');
  const el2 = appendToBody('<header />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(
      [message, el1],
      [message, el2]
    );
  });
});

it('does generate an error if the second header is for a section', () => {
  appendToBody('<header />');
  appendToBody('<section><header /></section>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error if the banners are in separate documents', () => {
  appendToBody('<div role="banner" />');
  appendToBody('<div role="document"><header /></div>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error if the banners are in separate applications', () => {
  appendToBody('<div role="banner" />');
  appendToBody('<div role="application"><header /></div>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does generate errors for separate applications', () => {
  appendToBody('<div role="banner" />');
  const el = appendToBody('<div role="application"><header /><header /></div>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(
      [message, el.querySelector('header')],
      [message, el.querySelectorAll('header')[1]]
    );
  });
});

it('allows a role attribute to contain additional roles', () => {
  const el1 = appendToBody('<div role="banner button" />');
  const el2 = appendToBody('<header />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(
      [message, el1],
      [message, el2]
    );
  });
});

it('does not generate an error if banner is not the primary role', () => {
  appendToBody('<div role="button banner" />');
  appendToBody('<header />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

