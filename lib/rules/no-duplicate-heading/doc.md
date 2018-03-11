Ensures no headings at the same level have a duplicate label

Incorrect code for this rule:
```html
  <h1>Lorem ipsum</h1>
  <h1>Lorme ipsum</h1>
```

Correct code for this rule:
```html
  <h1>Heading 1</h1>
  <h2>Lorme ipsum</h2>
  <h1>Heading 2</h1>
  <h2>Lorme ipsum</h2>
```

### Related specifications:

* https://www.w3.org/TR/html52/sections.html#the-h1-h2-h3-h4-h5-and-h6-elements
* https://www.w3.org/TR/html52/sections.html#creating-an-outline
* https://www.w3.org/TR/wai-aria-1.1/#heading
