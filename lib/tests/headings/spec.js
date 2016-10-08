it('generates the expected error message', () => {
  expect(this.test).toGenerateErrorMessage('Headings must be nested correctly');
});

[1, 2, 3, 4, 5, 6].forEach(h => {
  [1, 2, 3, 4, 5, 6].forEach(p => {
    if (p + 1 < h) {
      it(`it adds an error for a <h${h}> that is after a <h${p}>`, () => (
        whenDomChanges(() => {
          let level = p;
          while (level > 0) {
            appendElement(`h${level}`);
            --level;
          }
          el = appendElement('h1');
        })
        .then(() => {
          expect(this.logger).toHaveEntries([this.test, el]);
        })
      ));
    }
  });
});
