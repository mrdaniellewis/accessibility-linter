Ensures that interactive content or content with a role is not included in places where it would not be perceivable to a user.

The ARIA specification includes a number a roles where the children are only exposed to the accessible tree as text.
Similarly the HTML specification states that both the `<button>` and `<a>` elements must not contain interactive children.

This rules ensures:

- these elements do not contain focusable, or interactive children.  This is a mistake that may creating confusing situation
or an unusable user interface.
- these elements no not contain elements with an explicit or implicit role.  As these elements are excluded from the
accessibility tree such elements would not be perceivable to a screen reader user.  `<a>` elements are excluded from this condition.

Incorrect code for this rule:
```html
  <button><a href="#" /></button>
  <div role="math"><h1>Foo</h1></div>
  <a href="#"><button>foo</button></a>
```

### Related specifications

* https://www.w3.org/TR/wai-aria-1.1/#childrenArePresentational
* https://w3c.github.io/core-aam/#exclude_elements2
* https://www.w3.org/TR/html52/textlevel-semantics.html#the-a-element
* https://www.w3.org/TR/html52/sec-forms.html#the-button-element
