# Website accessibility tester

Runs accessibility tests against the current web page and
outputs errors to the JavaScript console.

## Roadmap

- linter
  - add integration tests using minified version
- bookmarklet
  - better looking html
- Documentation
  - correct section generation
  - add stylesheet
  - add TOC
  - how to document rules
- Beautify non minified
  - Minified source maps
- Configuration
  - Can turn rules off
  - Can turn all rules off
  - Can add additional rules
- Integration tests
- Rename to unit tests
- Integrate instanbul for code coverage:
  https://blog.engineyard.com/2015/measuring-clientside-javascript-test-coverage-with-istanbul
- Integrate karma for browser coverage
- Build to gh_pages
- Highlight option
- Screenreader transcript
- remove code duplication in build process

### List of tests to create

✓ all images have alt text
✓ Controls have a label
✓ All labels are associated with a control
✓ All ids are unique
✓ Radios have a `<legend>`
✓ No `<fieldset>` without a `<legend>`
✓ No `<legend>` without a `<fieldset>`
✓ Multiple checkboxs are in a fieldset
✓ No multiple `<select>`
✓ No reset buttons
✓ No empty selects
✓ Heading levels
✓ datalist ids are valid
✓ wrap inputs in a form
- roles
  - roles are valid
  - roles are not applied where default roles exist
- aria
  - aria attribute names are valid
  - aria attribute values are valid
  - aria attributes are applied to allowed elements
  - disabled
  - required
  - readonly
  - hidden
  - invalid
- Element nesting rules
- Text nesting rule
✓ All `<a>` elements link to a valid id or name (#top)
- Do not use buttons as names
- Colour contrast checker
- Problem private use characters
- no empty headings
- buttons have labels
- links have labels
- exclude svg
- must have title
- must have lang
- no submit / reset outside of forms
- obsolete elements
- obsolete attributes

Useful references

- https://medium.com/@jessebeach/beware-smushed-off-screen-accessible-text-5952a4c2cbfe#.4pkdrctuo
- http://www.thesitewizard.com/webdesign/access-keys-are-useless.shtml
- https://www.paciellogroup.com/blog/2016/10/a-not-so-short-note-on-aria-to-the-rescue/
- https://www.w3.org/TR/html-aria/#docconformance
- http://wps.pearsoned.com/WAI_ARIA_Testing/235/60309/15439152.cw/index.html

Other conformance checkers

- https://validator.w3.org/nu/

Spec issues

- no feed
- no term - what happens to dl?
- should address really be contentinfo
