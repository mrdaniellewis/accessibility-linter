let oldLang;

beforeEach(() => {
  oldLang = document.documentElement.lang;
});

afterEach(() => {
  document.documentElement.lang = oldLang;
});

describe('on <html>', () => {
  it('does not report a valid lang attribute', () => {
    document.documentElement.lang = 'en';
    linter.run();
    expect(reporter).not.toHaveErrors();
  });

  it('reports a missing lang attribute', () => {
    document.documentElement.lang = '';
    linter.run();
    expect(reporter).toHaveErrors({ message: 'missing lang attribute', element: document.documentElement });
  });

  it('reports an invalid lang attribute', () => {
    document.documentElement.lang = 'x';
    linter.run();
    expect(reporter).toHaveErrors({ message: 'language code is invalid', element: document.documentElement });
  });
});

describe('on other elements', () => {
  it('does not report a missing lang attribute', async () => {
    appendToBody('<div />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports an empty lang attribute', async () => {
    const element = appendToBody('<div lang />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'lang attribute should not be empty', element });
  });

  it('reports an invalid lang attribute', async () => {
    const element = appendToBody('<div lang="x" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'language code is invalid', element });
  });
});

describe('valid lang attributes', () => {
  [
    { name: 'validates simple lang tags', code: 'de', valid: true },
    { name: 'validates language scripts', code: 'zh-Hant', valid: true },
    { name: 'validates extended language', code: 'zh-cmn-Hans-CN', valid: true },
    { name: 'validates three letter language', code: 'yue-HK', valid: true },
    { name: 'validates language-script-region', code: 'sr-Latn-RS', valid: true },
    { name: 'validates language-variant', code: 'sl-rozaj-biske', valid: true },
    { name: 'validates language-region-variant', code: 'de-CH-1901', valid: true },
    { name: 'validates language-script-region-variant', code: 'hy-Latn-IT-arevela', valid: true },
    { name: 'validates language-region', code: 'en-GB', valid: true },
    { name: 'validates language-region - three number', code: 'es-419', valid: true },
    { name: 'validates oed', code: 'en-GB-oed', valid: true },
    { name: 'invalidates empty white space', code: ' en ', valid: false },
    { name: 'invalidates invalid characters', code: 'eb-%$', valid: false },
    { name: 'invalidates single letter codes', code: 'a-DE', valid: false },
    { name: 'invalidates too many characters', code: 'abcd-nn', valid: false },
  ].forEach(({ name, code, valid }) => {
    it(name, () => {
      document.documentElement.lang = code;
      linter.run();
      if (valid) {
        expect(reporter).not.toHaveErrors();
      } else {
        expect(reporter).toHaveErrors({ message: 'language code is invalid', element: document.documentElement });
      }
    });
  });
});
