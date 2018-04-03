Ensures all roles on an element are valid roles.

This rule checks:

* The role attribute has a value
* Any roles are lowercase
* Roles are known roles
* Roles are not abstract
* Roles are not implicit
* Roles are allowed on the element

Incorrect code for this rule:
```html
  <div role="" />            <!-- Missing role -->
  <div role="Alert" />       <!-- Role is not all lowercase -->
  <div role="foo" />         <!-- Role is unknown -->
  <div role="command" />     <!-- Role is abstract -->
  <input role="textbox" />   <!-- Role is implicit -->
  <input role="alert" />     <!-- Role is not allowed -->
```

Correct code for this rule:
```html
  <div role="alert" />
  <div role="searchbox textbox" />
```

### Related specification

* https://www.w3.org/TR/wai-aria-1.1/#roles
* https://www.w3.org/TR/html52/dom.html#wai-aria
* https://www.w3.org/TR/html-aria/

