let oldLang;

beforeEach(() => {
  oldLang = document.documentElement.lang;
});

afterEach(() => {
  document.documentElement.lang = oldLang;
});

it('does not add an error if there is a valid language code', () => {
  document.documentElement.lang = 'en';
  linter.run();
  expect(logger).toNotHaveEntries();
});

it('adds an error if there is no lang attribute', () => {
  document.documentElement.removeAttribute('lang');
  linter.run();
  expect(logger).toHaveErrors(['missing lang attribute', document.documentElement]);
});

it('adds an error if there is an invalid lang attribute', () => {
  document.documentElement.lang = 'x';
  linter.run();
  expect(logger).toHaveErrors(['language code is invalid', document.documentElement]);
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
        expect(logger).toNotHaveEntries();
      } else {
        expect(logger).toHaveErrors(['language code is invalid', document.documentElement]);
      }
    });
  });
});
