describe("Higlighter", function() {
    describe("remove highlights", function() {
	it("should strip highlight specific span tags", function() {
	    var doc = '<div>Hello <span class="highlight">dsfjdslkjflksdj</span> sfkdsjlfsdj <span class="highlight">Highlight1</span> dsfkldskf. Some <span>more</span> text here. </div>';
	    var strippedContent = stripHighlightsFromDocument(doc, "highlight");
	    expect(strippedContent).toBe('<div>Hello dsfjdslkjflksdj sfkdsjlfsdj Highlight1 dsfkldskf. Some <span>more</span> text here. </div>');
	});
	it("should strip nested highlight tags", function() {
	    var doc = '<div>Hello <span class="highlight">dsfjdslkjflksdj</span> <span class="highlight">sfkdsjlfsdj <span class="highlight">Highlight1</span></span> dsfkldskf. Some <span>more</span> text here. </div>';
	    var strippedContent = stripHighlightsFromDocument(doc, "highlight");
	    expect(strippedContent).toBe('<div>Hello dsfjdslkjflksdj sfkdsjlfsdj Highlight1 dsfkldskf. Some <span>more</span> text here. </div>');
	});
    });
    describe("offset", function() {
	it("should calculate text offset from given container", function() {
	    var text = "<div>Hello dsfjdslkjflksdj <span data-identifier=\"start_12345678\">sfkdsjlfsdj</span> Highlight1 dsfkldskf. Some <span data-identifier=\"end_12345678\"><span>more</span></span> text here. </div>";
	    var offsets = offsetFromContainer(text, "12345678");
	    expect(offsets.startOffset).toBe(22);
	    expect(offsets.endOffset).toBe(61);
	});
    });
    describe("add highlight", function() {
	it("should transform text offset to document offset", function() {
	    var doc = '<div>Hello World sfkdsjlfsdj Highlight1 dsfkldskf. Some more text here.</div>';
	    var documentOffset = convertTextOffsetToDocumentOffset(doc, 6);	    
	    expect(documentOffset).toBe(11);
	});

	it("should add the highlight tag for the give text range", function() {
	    var doc = '<div>Hello dsfjdslkjflksdj sfkdsjlfsdj Highlight1 dsfkldskf. Some more text here.</div>';
	    var highlightedContent = addHighlight(doc, {
		startOffset: 7,
		endOffset: 12,
		highlightClass: 'highlight',
	    });
	    expect(highlightedContent).toBe('<div>Hello <span class=\"highlight\">dsfjds</span>lkjflksdj sfkdsjlfsdj Highlight1 dsfkldskf. Some more text here.</div>');
	});
	
	it("should add highlight for nested tags", function(){
	   var doc = "<div>Lorem ipsum dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.";
	    var highlightContent = addHighlight(doc, {
		startOffset: 2,
		endOffset: 23
	    });
	    expect(highlightContent).toBe("<div>L<span class=\"highlight\">orem ipsum dolor</span></div><span class=\"highlight\"> sit </span><div><span class=\"highlight\">a</span>met, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.");
	});
    });
});