# Website accessibility tester

Runs accessibility tests against the current web page and
outputs errors to the JavaScript console.

## Roadmap

- linter
  - add integration tests using minified version
- bookmarklet
  - get minified working
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
- add version
- check css is properly escaped when querying by attribute and add tests
- add el2 as pre-existing global

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
- datalist ids are valid
- any other id associations?
- wrap inputs in a form
- roles
  - roles are valid
  - roles are not applied where default roles exist
- aria
  - aria attribute names are valid
  - aria attribute values are valid
  - aria attributes are applied to allowed elements
  - aria id lists point to valid elements
  - aria attributes are correct for roles
- All `<a>` elements link to a valid id or name (#top)
- Do not use buttons as names
- Colour contrast checker
- Problem private use characters

- http://www.thesitewizard.com/webdesign/access-keys-are-useless.shtml
