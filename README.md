# Website accessibility tester

Runs accessibility tests against the current web page and
outputs errors to the JavaScript console.

## Todo

- write more readme
- config
  - can turn rules off
  - can turn all rules off
  - can add additional rules
- improve bookmarklet presentation
- integration test
- exclude svg children from tests
- integrate instanbul for code coverage:
  https://blog.engineyard.com/2015/measuring-clientside-javascript-test-coverage-with-istanbul
- integrate karma for browser coverage
- highlight option
- screenreader transcript
- remove code duplication in build process

## List of tests to create

- aria
  - aria attribute names are valid
  - aria attribute values are valid
  - aria attributes are applied to allowed elements
  - disabled
  - required
  - readonly
  - hidden
  - invalid
  - re-check against html 5.2 specification
- element child rules - based on HTML 5.2 spec
- no submit / reset buttons outside forms
- no buttons without labels
- no links without labels
- no empty headings
- must have title
- must have lang
- no unknown elements
- no obsolete elements
- no obsolete attributes
- problem private use characters?
- colour contrast checker

Useful references

- https://medium.com/@jessebeach/beware-smushed-off-screen-accessible-text-5952a4c2cbfe#.4pkdrctuo
- http://www.thesitewizard.com/webdesign/access-keys-are-useless.shtml
- https://www.paciellogroup.com/blog/2016/10/a-not-so-short-note-on-aria-to-the-rescue/
- https://www.w3.org/TR/html-aria/#docconformance
- http://wps.pearsoned.com/WAI_ARIA_Testing/235/60309/15439152.cw/index.html

Other conformance checkers

- https://validator.w3.org/nu/

