# Missing alt attribute

All `<img>` elements must have an `alt` attribute. The attribute can be an empty string (`alt=""`) but it must be present.

## Rational

When a screen reader encounters an image it will read the `alt` attribute.
If the attribute is not present it will read the `src` attribute;
this will generally be a meaningless and long series of characters that should not be part of the content.

The alt text should not be a description of the image, it should be meaningful alternative text that provides value to the user.
If the image is only decorative or the alternative text would be repeating adjacent text then an empty `alt` attribute may be more appropriate.

## References

* https://www.w3.org/TR/WCAG20-TECHS/H37.html


