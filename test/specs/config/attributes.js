describe('#attributes', () => {
  const eventHandlerAttributes = [
    'onabort', 'onauxclick', 'onblur', 'oncancel', 'oncanplay',
    'oncanplaythrough', 'onchange', 'onclick', 'onclose', 'oncontextmenu',
    'oncuechange', 'ondblclick', 'ondrag', 'ondragend', 'ondragenter',
    'ondragexit', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop',
    'ondurationchange', 'onemptied', 'onended', 'onerror', 'onfocus',
    'oninput', 'oninvalid', 'onkeydown', 'onkeypress', 'onkeyup', 'onload',
    'onloadeddata', 'onloadedmetadata', 'onloadend', 'onloadstart',
    'onmousedown', 'onmouseenter', 'onmouseleave', 'onmousemove',
    'onmouseout', 'onmouseover', 'onmouseup', 'onwheel', 'onpause',
    'onplay', 'onplaying', 'onprogress', 'onratechange', 'onreset',
    'onresize', 'onscroll', 'onseeked', 'onseeking', 'onselect', 'onshow',
    'onstalled', 'onsubmit', 'onsuspend', 'ontimeupdate', 'ontoggle',
    'onvolumechange', 'onwaiting'];

  let attributes;
  beforeEach(() => {
    attributes = new AccessibilityLinter.Config().attributes;
  });

  it('is a property of config', () => {
    expect(attributes).toExist();
  });

  describe('eventHandlerAttributes', () => {
    it('contains all the event handlers', () => {
      expect(attributes.eventHandlerAttributes).toEqual(eventHandlerAttributes);
    });
  });
});
