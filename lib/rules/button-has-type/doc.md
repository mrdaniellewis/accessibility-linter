A `<button>` element must have a type.

It is valid for a `<button>` element to not have a type attribute, however the default type is "submit".

As buttons are typically used with JavaScript, authors are more likely to intend and expect a type of "button".

If "submit" is used where "button" is intended this could result if either a form unexpectedly submitting, or
the unnecessary use of `e.preventDefault()` in the JavaScript handler.

Incorrect code for this rule:
```html
  <button>Lorem ipsum</button>
```

Correct code for this rule:
```html
  <button type="submit">Lorem ipsum</button>
  <button type="button">Lorem ipsum</button>
```

Related specifications:

* https://www.w3.org/TR/html52/sec-forms.html#the-button-element

