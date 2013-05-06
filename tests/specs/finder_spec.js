describe('Finder', function() {
  it('should find the position relative to give root', function() {
    var doc = $('<div><div id="root"><div>Lorem ipsum dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>')[0];
    var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
    var nodePosition = new Finder(document).findNodePosition({
      nodeToFind:nodeToFind,
      content:doc,
      relativeTo:'#root'
    });
    expect(nodePosition).to.equal(3);
  });

  it('should skip the highlight element', function() {
    var doc = $('<div><div id="root"><div>Lorem <span data-highlight-id="1" class="highlight">ipsum </span>dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>')[0];
    var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
    var nodePosition = new Finder(document).findNodePosition({
      nodeToFind:nodeToFind,
      content:doc,
      relativeTo:'#root'
    });
    expect(nodePosition).to.equal(3);
  });

  it('should give the node given the node position', function() {
    var doc = $('<div><div id="root"><div>Lorem <span data-highlight-id="1" class="highlight">ipsum </span>dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>')[0];
    var nodePosition = 4;
    var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
    var node = new Finder(document).findNodeByPosition({
      nodePosition:nodePosition,
      content:doc,
      relativeTo:'#root'
    });
    expect(node).to.equal(nodeToFind);
  });

  describe('highlight and selection nodes', function() {
    it('should give the highlight node as first node between highlight id and selection id.', function() {
      var doc = $('<div><div id="root"><div>Lorem <span data-highlight-id="1" class="highlight">ipsum </span>dolor</div><span data-identifier="start_2"></span>this is the selection highlight.sit <div>amet, <span>consectetur<span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>')[0];
      var highlightNode = doc.querySelector('[data-highlight-id="1"]');
      var node = new Finder(document).getFirstNode(doc, '1', '2');
      expect(node).to.equal(highlightNode);
    });

    it('should give the selection node as first node between highlight id and selection id.', function() {
      var doc = $('<div><div id="root"><div>Lorem <span data-identifier="start_1" class="highlight">ipsum </span>dolor</div><span data-highlight-id="2"></span>this is the selection highlight.sit <div>amet, <span>consectetur<span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>')[0];
      var selectionNode = doc.querySelector('[data-identifier="start_1"]');
      var node = new Finder(document).getFirstNode(doc, '2', '1');
      expect(node).to.equal(selectionNode);
    });

    it('should give the highlight node as last node between highlight id and selection id.', function() {
      var doc = $('<div><div id="root"><div>Lorem <span data-highlight-id="1" class="highlight">ipsum dolor this is the selection <span data-identifier="end_2"></span>highlight</div></span> .sit <div>amet, <span>consectetur<span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>')[0];
      var highlightNode = doc.querySelector('[data-highlight-id="1"]');
      var node = new Finder(document).getLastNode(doc, '1', '2');
      expect(node).to.equal(highlightNode);
    });

    it('should give the last highlight node as last node when end marker is between two highligth spans of the same highlight', function() {
      var doc = $('<div><div id="root"><div>Lorem <span data-highlight-id="1" class="highlight">ipsum dolor this is the selection </span> <span data-identifier="end_2"></span>highlight</div><span data-highlight-id="1" class="highlight">.sit</span> <div>amet, <span><span data-highlight-id="1" class="highlight lastHighlight">consectetur</span><span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>')[0];
      var highlightNode = doc.querySelector('.lastHighlight');
      var node = new Finder(document).getLastNode(doc, '1', '2');
      expect(node).to.equal(highlightNode);
    });

    it('should give the selection node as last node between highlight id and selection id.', function() {
      var doc = $('<div><div id="root"><div>Lorem <span data-highlight-id="1" class="highlight">ipsum dolor<span data-identifier="start_2"></span></span></div>this i<span data-identifier="end_2"></span>hs the selection highlight.sit <div>amet, <span>consectetur<span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>')[0];
      var selectionNode = doc.querySelector('[data-identifier="end_2"]');
      var node = new Finder(document).getLastNode(doc, '1', '2');
      expect(node).to.equal(selectionNode);
    });
  });

  describe('selection in highlight', function(){
    it('should return true if selection start is in highlight', function(){
      var doc = $('<div><div id="root"><div>Lorem <span data-highlight-id="1" class="highlight">ipsum dolor<span data-identifier="start_2"></span></span></div>this i<span data-identifier="end_2"></span>hs the selection highlight.sit <div>amet, <span>consectetur<span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>')[0];
      expect(new Finder(document).isSelectionStartInHighlight(doc, '1', '2')).to.equal(true);
    });

    it('should return false if selection start is not in highlight', function(){
      var doc = $('<div><div id="root"><div>Lorem <span data-identifier="start_1" class="highlight"></span>ipsum dolor</div><span data-highlight-id="2"></span>this is the selection highlight.sit <div>amet, <span>consectetur<span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>')[0];
      expect(new Finder(document).isSelectionStartInHighlight(doc, '2', '1')).to.equal(false);
    });

    it('should return true if selection end is in highlight', function(){
      var doc = $('<div><div id="root"><div>Lorem <span data-highlight-id="1" class="highlight">ipsum dolor<span data-identifier="start_2"></span></span></div><span data-identifier="end_2"></span>this ihs the selection highlight.sit <div>amet, <span>consectetur<span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>')[0];
      expect(new Finder(document).isSelectionEndInHighlight(doc, '1', '2')).to.equal(true);
    });

    it('should return false if selection end is not in highlight and is in a different node', function(){
      var doc = $('<div><div id="root"><div>Lorem <span data-highlight-id="1" class="highlight">ipsum dolor<span data-identifier="start_2"></span></span></div>this <span data-identifier="end_2"></span>is the selection highlight.sit <div>amet, <span>consectetur<span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>')[0];
      expect(new Finder(document).isSelectionEndInHighlight(doc, '1', '2')).to.equal(false);
    });

    it('should return false if selection end is not in highlight and is in the same node', function(){
      var doc = $('<div id="root"><div>Lorem <span data-highlight-id="1" class="highlight">ipsum dolor<span data-identifier="start_2"></span>123</span>selected<span data-identifier="end_2"></span></div></div>')[0];
      expect(new Finder(document).isSelectionEndInHighlight(doc, '1', '2')).to.equal(false);
    });
  });

  describe('number of highlights in selection', function() {
    it('should return the number of highlights in selection', function() {
      var doc = $('<div><div id="root"><div>Lorem <span data-identifier="start_1"></span>ipsum<span data-highlight-id="1" class="highlight">ipsum dolor</span></div><div>this i<span data-highlight-id="2" class="highlight">has the</span> highlight<span data-identifier="end_1"></span></div></div></div>')[0];
      expect(new Finder(document).findHighlights(doc, 1)).to.eql(['1', '2']);
    });

    it('should include highlight ids within the start of a selection ', function() {
      var doc = $('<div><div id="root"><div><span data-highlight-id="1" class="highlight">Lorem <span data-identifier="start_1"></span>ipsum ipsum dolor</span></div><div>this i<span data-highlight-id="2" class="highlight">has</span> <span data-highlight-id="2" class="highlight">the</span> highlight<span data-identifier="end_1"></span></div></div></div>')[0];
      expect(new Finder(document).findHighlights(doc, 1)).to.eql(['1', '2']);
    });

    it('should not return duplicate highlight ids', function() {
      var doc = $('<div><div id="root"><div>Lorem <span data-identifier="start_1"></span>ipsum<span data-highlight-id="1" class="highlight">ipsum dolor</span></div><div>this i<span data-highlight-id="2" class="highlight">has</span> <span data-highlight-id="2" class="highlight">the</span> highlight<span data-identifier="end_1"></span></div></div></div>')[0];
      expect(new Finder(document).findHighlights(doc, 1)).to.eql(['1', '2']);
    });

    it('should not include highlights that are before the start of selection', function() {
      var doc = $('<div><div id="root"><div><span data-highlight-id="3" class="highlight">Lorem </span><span data-identifier="start_1"></span>ipsum<span data-highlight-id="1" class="highlight">ipsum dolor</span></div><div>this i<span data-highlight-id="2" class="highlight">has the</span> highlight<span data-identifier="end_1"></span></div></div></div>')[0];
      expect(new Finder(document).findHighlights(doc, 1)).to.eql(['1', '2']);
    });

    it('should not include highlights that are after the start of selection', function() {
      var doc = $('<div><div id="root"><div>Lorem <span data-identifier="start_1"></span>ipsum<span data-highlight-id="1" class="highlight">ipsum dolor</span></div><div>this i<span data-highlight-id="2" class="highlight">has the</span> highlight<span data-identifier="end_1"></span><span data-highlight-id="4" class="highlight">lorem</span></div></div></div>')[0];
      expect(new Finder(document).findHighlights(doc, 1)).to.eql(['1', '2']);
    });
  });
});
