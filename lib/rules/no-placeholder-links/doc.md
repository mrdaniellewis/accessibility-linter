Do not allow placeholder links.

A placeholder link is an `<a>` element with no href attribute.  This causes
the anchor to behave identically to a `<span>` element.  That is an inline
element that is not focusable.

While a placeholder link is valid html, it is often a mistake and suggests either
the href attribute has been forgotten, or the author was intending to use the
(non-focusable) link as a button.

Incorrect code for this rule:
```html
  <a>Lorem ipsum</a>
```

Correct code for this rule:
```html
  <a href="/page">Lorem ipsum</a>
```

### Related specifications:

* https://www.w3.org/TR/html52/textlevel-semantics.html#the-a-element 

