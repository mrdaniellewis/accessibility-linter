Require all text to have a minimum contrast as specified by the WCAG AAA standard.

The guidelines specify:

* text must have minimum contrast of 7:1
* large text, bold text larger than 14pt or any text larger than 18pt, must have a minimum contrast of 4.5:1

This rule cannot test text overlaid over background images, and does not check css inserted text.

Incorrect code for this rule:
```html
  <p style="color: #eee">Lorem ipsum</p>
```

### Related specifications

* https://www.w3.org/TR/WCAG20/#visual-audio-contrast7
