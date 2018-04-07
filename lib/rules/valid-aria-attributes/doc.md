Check that all aria attributes used on an element are valid and have valid values.

- Valid attributes, their values and their use with roles are defined in the [ARIA specification](https://www.w3.org/TR/wai-aria-1.1)
- The allowed attributes for any element are specified in [ARIA in HTML](https://www.w3.org/TR/html-aria/)

Incorrect code for this rule:
```html
  <div aria-foo="bar" />                             <!-- unknown attribute -->
  <div aria-invalid="bar" />                         <!-- invalid attribute value -->
  <div aria-grabbed="true" />                        <!-- deprecated attribute -->
  <div aria-invalid="false" required value="" />     <!-- invalid value contradicts native constraints -->
  <div aria-hidden="true" hidden />                  <!-- unnessecery use of aria-hidden -->
  <div role="presentation" aria-invalid="false" />   <!-- global aria attribute overriding role of presentation -->
```

### Related specifications

* https://www.w3.org/TR/wai-aria-1.1/
* https://www.w3.org/TR/html-aria/

