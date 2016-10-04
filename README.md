# Website accessibility tester

Runs accessibility tests against the current web page and
outputs errors to the JavaScript console.

## Roadmap

- Test specs
- Configuration
- Documentation
- customisable config
- customisable config via `<script>` tag
- Integrate instanbul for code coverage:
  https://blog.engineyard.com/2015/measuring-clientside-javascript-test-coverage-with-istanbul
- Integrate karma for browser coverage
- Build to gh_pages
- Bookmarklet

### List of tests to create

✓ all images have alt text
✓ Controls have a label
✓ All labels are associated with a control
✓ All ids are unique
✓ Radios have a `<legend>`
✓ No `<fieldset>` without a `<legend>`
- No `<legend>` without a `<fieldset>`
- Multiple checkboxs are in a fieldset
- Colour contrast checker
- Heading levels
- No multiple `<select>`
- All `<a>` elements link to a valid id or name (#top)
- http://www.thesitewizard.com/webdesign/access-keys-are-useless.shtml
- All aria-labelledby link to valid elements
- All aria-describedby link to valid elements
- All aria-attributes have the correct value
- All roles are allowed roles
- Roles are applied to the correct elements
