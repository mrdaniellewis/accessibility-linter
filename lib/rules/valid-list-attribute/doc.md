`<input>` elements using the list attribute should point to valid `<datalist>` elements.

This checks the list attribute is valid, is used on the correct input types and points to an existing `<datalist>` element.

Incorrect code for this rule:
```html
  <input list="" />                     <!-- Missing attribute value -->
  <input list="foo bar" />              <!-- Id contains spaces -->
  <input type="checkbox" list="foo" />  <!-- Attribute used on the wrong input type -->
  <input list="foo" /><div id="foo" />  <!-- Target is not a datalist -->
```

Correct code for this rule:
```html
  <datalist id="foo"></datalist>
  <input list="foo" />
```

Related specifications:

* https://www.w3.org/TR/html52/sec-forms.html#the-list-attribute
