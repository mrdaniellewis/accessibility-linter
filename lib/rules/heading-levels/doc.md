Ensure headings are correctly nested.

Headings should be added in sequence with higher level headings always proceeding lower level headings.

Incorrect code for this rule:
```html
  <h1>Foo</h1><h3>Bar</h3>               <!-- missing h2 -->
  <div role="heading" aria-level="2" />  <!-- missing h1 -->
```

Correct code for this rule:
```html
  <h1>Foo</h1><h2>Bar</h2>
```
### Related specifications:

* https://www.w3.org/TR/html52/sections.html#the-h1-h2-h3-h4-h5-and-h6-elements
* https://www.w3.org/TR/html52/sections.html#creating-an-outline

