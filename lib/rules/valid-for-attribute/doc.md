Checks the for attribute of a `<label>` element is valid.

Incorrect code for this rule:
```html
  <label for="" />                      <!-- Missing attribute value -->
  <label for="foo bar" />               <!-- Id contains spaces -->
  <label for="foo" /><div id="foo" />   <!-- Target is not a labelable element -->
```

Correct code for this rule:
```html
  <input id="foo" /><label for="foo" />
```

Related specifications:

* https://www.w3.org/TR/html52/sec-forms.html#the-label-element
