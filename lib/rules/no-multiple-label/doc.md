Ensure controls only have one associated label.

While it is not against the HTML specification for a control to have multiple labels,
screen-reader support for this is poor and only a one label is read out.  There is no definition
of which label takes precedence leading to unpredictable labelling across different screen readers.

```html
  <label>foo<label>bar<input /></label></label>                      <!-- Nested implicit labels -->
  <label>foo<input id="foo" /></label><label for="foo">bar</label>   <!-- Multiple labels -->
```

Correct code for this rule:
```html
  <input id="foo" /><label for="foo">foo</label>
  <label>foo<input /></label>
```

Related specifications:

* https://www.w3.org/TR/html52/sec-forms.html#the-label-element
