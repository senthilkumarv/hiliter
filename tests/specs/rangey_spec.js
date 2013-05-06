describe('Rangey', function() {
  it('should give selection is within same parent when start container and end container are same', function() {
    var range = {startContainer:1, endContainer:1};
    var result = Rangey.isSelectionWithinSameParent(range);
    expect(result).to.equal(true);
  });

  it('should not give selection is within same parent when start container and end container are not same', function() {
    var range = {startContainer:1, endContainer:2};
    var result = Rangey.isSelectionWithinSameParent(range);
    expect(result).to.equal(false);
  });

  it('should calculate text offset from given container', function() {
    var text = '<div>The <span data-identifier="start_12345678">quick</span> brown fox <span>jumps <span data-identifier="end_12345678">over</span> the lazy dog</span>. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</div>';
    var offsets = Rangey.offsetFromContainer(text, '12345678');
    expect(offsets.startOffset).to.equal(5);
    expect(offsets.endOffset).to.equal(31);
  });

  it('should transform text offset to document offset', function() {
    var doc = '<div>Hello World.</div>';
    var documentOffset = Rangey.convertTextOffsetToDocumentOffset(doc, 6);
    expect(documentOffset).to.equal(11);
  });
});
