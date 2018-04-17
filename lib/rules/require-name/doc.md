Ensure all elements that need an accessible name have an accessible name

Elements that require a name include:

* form controls
* links
* headings
* `<fieldset>`
* `<details>`
* `<iframe>`
* Anything that is focusable
* Anything with a role that is defined as requiring an accessible name in the aria specification.

Types of elements can be excluded from this check using the `whitelist` option.

Incorrect code for this rule:
```html
  <input />
  <fieldset><input /></fieldset>
  <h1></h1>
  <iframe />
  <div tabindex="0" />
```

Correct code for this rule:
```html
  <label>Foo<input /></label>
  <fieldset><legend>Foo</legend><input /></fieldset>
  <h1>Foo</h1>
  <iframe title="Foo" />
  <div tabindex="0" aria-label="Foo" />
```

### Related specifications

* https://www.w3.org/TR/wai-aria-1.1/
* https://www.w3.org/TR/html52/editing.html#focus


