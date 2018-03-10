Checks all labels are associated with a control.

Ensures that a label has:

* A valid for attribute that is the id of a labelable control
* or the label has a descendant that is a labelable control
* and that the control is visible if the label is visible.

Incorrect code for this rule:
```html
  <label for="" />                      <!-- Missing attribute value -->
  <label for="foo bar" />               <!-- Id contains spaces -->
  <label for="foo" /><div id="foo" />   <!-- Target is not a labelable element -->
  <label><div /></label>                <!-- Label has no control -->
  <label><input hidden /></label>       <!-- The control being labelled is hidden -->
```

Correct code for this rule:
```html
  <input id="foo" /><label for="foo" />
  <label><input /></label>
```

Related specifications:

* https://www.w3.org/TR/html52/sec-forms.html#the-label-element
