const messageFieldset = 'a <fieldset> must have a visible <legend> as their first child';
const messageLegend = 'a <legend> must be the first child of a <fieldset>';

it('adds an error if a fieldset is empty', () => {
  const el = appendToBody('<fieldset>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messageFieldset, el]);
  });
});

it('adds an error if a fieldset does not have a legend', () => {
  const el = appendToBody('<fieldset><div>Lorem ipsum</div></fieldset>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messageFieldset, el]);
  });
});

it('adds an error if a fieldset has a legend that is not the first child', () => {
  const el = appendToBody(`<fieldset>
    <div>Lorem ipsum</div>
    <legend>legend</legend>
  </fieldset>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messageFieldset, el], [messageLegend, el.querySelector('legend')]);
  });
});

it('adds an error if a fieldset has a legend after a text node', () => {
  const el = appendToBody(`<fieldset>
    foo
    <legend>legend</legend>
  </fieldset>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messageFieldset, el], [messageLegend, el.querySelector('legend')]);
  });
});

it('adds an error if a fieldset has a legend as a grandchild', () => {
  const el = appendToBody(`<fieldset>
    <div>
      <legend>legend</legend>
    </div>
  </fieldset>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messageFieldset, el], [messageLegend, el.querySelector('legend')]);
  });
});

it('adds an error if a legend is not in a fieldset', () => {
  const el = appendToBody('<legend>foo</legend>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messageLegend, el]);
  });
});

it('adds an error if there is more than one legend', () => {
  const el = appendToBody(`<fieldset>
    <legend>legend</legend>
    <legend>legend</legend>
  </fieldset>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messageLegend, el.querySelectorAll('legend')[1]]);
  });
});

it('adds an error if the legend is not visible', () => {
  const el = appendToBody(`<fieldset>
    <legend hidden>legend</legend>
  </fieldset>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messageFieldset, el]);
  });
});

it('does not add an error if the fieldset has a legend as the first child', () => {
  appendToBody('<fieldset><legend>legend</legend></fieldset>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error if the fieldset has a legend as the first child after an empty text node', () => {
  appendToBody('<fieldset>   <legend>legend</legend></fieldset>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
