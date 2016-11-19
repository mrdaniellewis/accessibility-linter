it('generates the expected error message for a missing lang attribute', () => {
  const el = document.createElement('html');
  expect(rule).toGenerateErrorMessage({ for: el }, 'missing lang attribute');
});

it('generates the expected error message for an invalid lang attribute', () => {
  const el = document.createElement('html');
  el.lang = 'x';
  expect(rule).toGenerateErrorMessage({ for: el }, 'language code is invalid');
});

it('does not add an error if there is a valid language code', () => {
  document.documentElement.lang = 'en';
  linter.run();
  expect(logger).toNotHaveEntries();
  document.documentElement.lang = '';
});

it('adds an error if there is no lang attribute', () => {
  document.documentElement.removeAttribute('lang');
  linter.run();
  expect(logger).toHaveEntries([rule, document.documentElement]);
});

it('adds an error if there is an invalid lang attribute', () => {
  document.documentElement.lang = 'x';
  linter.run();
  expect(logger).toHaveEntries([rule, document.documentElement]);
  document.documentElement.lang = '';
});

describe('valid lang attributes', () => {
  it('validates simple tags', () => {
    expect(rule.match.test('de')).toBe(true);
  });

  it('validates language-scripts', () => {
    expect(rule.match.test('zh-Hant')).toBe(true);
  });

  it('validates extended language', () => {
    expect(rule.match.test('zh-cmn-Hans-CN')).toBe(true);
  });

  it('validates three letter language', () => {
    expect(rule.match.test('yue-HK')).toBe(true);
  });

  it('validates language-script-region', () => {
    expect(rule.match.test('sr-Latn-RS')).toBe(true);
  });

  it('validates language-variant', () => {
    expect(rule.match.test('sl-rozaj-biske')).toBe(true);
  });

  it('validates language-region-variant', () => {
    expect(rule.match.test('de-CH-1901')).toBe(true);
  });

  it('validates language-script-region-variant', () => {
    expect(rule.match.test('hy-Latn-IT-arevela')).toBe(true);
  });

  it('validates language-region', () => {
    expect(rule.match.test('en-GB')).toBe(true);
  });

  it('validates language-region - three number', () => {
    expect(rule.match.test('es-419')).toBe(true);
  });

  it('validates oed', () => {
    expect(rule.match.test('en-GB-oed')).toBe(true);
  });

  it('invalidates extra white space', () => {
    expect(rule.match.test(' en ')).toBe(false);
  });

  it('invalidates invalid characters', () => {
    expect(rule.match.test('ab-%$')).toBe(false);
  });

  it('invalidates single letter codes', () => {
    expect(rule.match.test('a-DE')).toBe(false);
  });

  it('invalidates too many characters', () => {
    expect(rule.match.test('abcd-nn')).toBe(false);
  });
});
