const messagedetails = 'a <details> must have a visible <summary> as their first child';
const messagesummary = 'a <summary> must be the first child of a <details>';

it('adds an error if a details is empty', () => {
  const el = appendToBody('<details>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messagedetails, el]);
  });
});

it('adds an error if a details does not have a summary', () => {
  const el = appendToBody('<details><div>Lorem ipsum</div></details>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messagedetails, el]);
  });
});

it('adds an error if a details has a summary that is not the first child', () => {
  const el = appendToBody(`<details>
    <div>Lorem ipsum</div>
    <summary>summary</summary>
  </details>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messagedetails, el], [messagesummary, el.querySelector('summary')]);
  });
});

it('adds an error if a details has a summary after a text node', () => {
  const el = appendToBody(`<details>
    foo
    <summary>summary</summary>
  </details>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messagedetails, el], [messagesummary, el.querySelector('summary')]);
  });
});

it('adds an error if a details has a summary as a grandchild', () => {
  const el = appendToBody(`<details>
    <div>
      <summary>summary</summary>
    </div>
  </details>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messagedetails, el], [messagesummary, el.querySelector('summary')]);
  });
});

it('adds an error if a summary is not in a details', () => {
  const el = appendToBody('<summary>foo</summary>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messagesummary, el]);
  });
});

it('adds an error if there is more than one summary', () => {
  const el = appendToBody(`<details>
    <summary>summary</summary>
    <summary>summary</summary>
  </details>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messagesummary, el.querySelectorAll('summary')[1]]);
  });
});

it('adds an error if the summary is not visible', () => {
  const el = appendToBody(`<details>
    <summary hidden>summary</summary>
  </details>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([messagedetails, el]);
  });
});

it('does not add an error if the details has a summary as the first child', () => {
  appendToBody('<details><summary>summary</summary></details>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error if the details has a summary as the first child after an empty text node', () => {
  appendToBody('<details>   <summary>summary</summary></details>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
