# Website accessibility linter

A script that can be included on a web page that will check for accessibility
errors and log any errors to the JavaScript error console.

## Todo
=======

- write more readme
- config
  - can turn rules off
  - can turn all rules off
  - can add additional rules
- Add integration tests
- improve bookmarklet presentation
- exclude svg element children by default
- integrate instanbul for code coverage:
  https://blog.engineyard.com/2015/measuring-clientside-javascript-test-coverage-with-istanbul
- integrate karma for browser coverage
- option to highlight errors
- option to write out a transcript as a screenreader would read the page
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

## Misc issues

- Is is OK to use aria-label / aria-labelledby for buttons / links with hidden text
- Find out if css inserted content is included in innerText


Useful references

- https://medium.com/@jessebeach/beware-smushed-off-screen-accessible-text-5952a4c2cbfe#.4pkdrctuo
- http://www.thesitewizard.com/webdesign/access-keys-are-useless.shtml
- https://www.paciellogroup.com/blog/2016/10/a-not-so-short-note-on-aria-to-the-rescue/
- https://www.w3.org/TR/html-aria/#docconformance
- http://wps.pearsoned.com/WAI_ARIA_Testing/235/60309/15439152.cw/index.html
- http://stackoverflow.com/questions/19616893/difference-between-aria-label-and-aria-labelledby

Other conformance checkers

- https://validator.w3.org/nu/
