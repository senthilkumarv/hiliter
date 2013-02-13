describe("Highlighter", function() {
    describe("Offset", function() {
		it("should calculate text offset from given container", function(done) {
		    var text = "<div>The <span data-identifier=\"start_12345678\">quick</span> brown fox <span>jumps <span data-identifier=\"end_12345678\">over</span> the lazy dog</span>. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</div>";
		    var offsets = Hiliter.offsetFromContainer(text, "12345678");
		    expect(offsets.startOffset).to.equal(5);
		    expect(offsets.endOffset).to.equal(31);
			done();
		});
    });
	describe("Add Highlight", function() {
	    it("should remove highlight tags with no text in them", function(done) {
			var doc = "<div>The quick brown fox <span class=\"highlight\" data-id=\"1\"></span><span data-id=\"2\" class=\"highlight\"></span><span class=\"highlight\">jumps over the lazy</span> dog.</div>";
			var sanitized_markups = Hiliter.sanitize(doc, "highlight");
	        expect(sanitized_markups).to.equal("<div>The quick brown fox <span class=\"highlight\">jumps over the lazy</span> dog.</div>");
	        done();
	    });		
		
		it("should transform text offset to document offset", function(done) {
		    var doc = '<div>Hello World.</div>';
		    var documentOffset = Hiliter.convertTextOffsetToDocumentOffset(doc, 6);	    
		    expect(documentOffset).to.equal(11);
			done();
		});

		it("should add the highlight tag for the give text range", function(done) {
		    var doc = $("<div>Hello World. Some more text here.</div>")[0];
		    Hiliter.addHighlight(doc, {
				startOffset: 7,
				endOffset: 12,
				highlightClass: 'highlight'
		    });
		    expect(doc.innerHTML).to.equal('Hello <span class=\"highlight\">World</span>. Some more text here.');
			done();
		});
	
		it("should add highlight for nested tags", function(done){
		   var doc = $("<div><div>Lorem ipsum dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div>")[0];
		   Hiliter.addHighlight(doc, {
			   startOffset: 2,
			   endOffset: 23,
			   highlightClass: 'highlight'
		   });
		   expect(doc.innerHTML).to.equal("<div>L<span class=\"highlight\">orem ipsum dolor</span></div><span class=\"highlight\"> sit </span><div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.");
		   done();
		});		
	});
	describe("Find node position from root", function() {
		it("should find the position relative to give root" , function(done) {
			var doc = $("<div><div id=\"root\"><div>Lorem ipsum dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
			var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
			var nodePosition = Hiliter.findNodePosition({
				nodeToFind: nodeToFind,
				content: doc,
				relativeTo: "#root",
				highlightClass: "highlight"
			});			
			expect(nodePosition).to.equal(3);
			done();
		});
		it("should skip the highlight element" , function(done) {
			var doc = $("<div><div id=\"root\"><div>Lorem <span class= 'highlight'>ipsum </span>dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
			var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
			var nodePosition = Hiliter.findNodePosition({
				nodeToFind: nodeToFind,
				content: doc,
				relativeTo: "#root",
				highlightClass: "highlight"
			});			
			expect(nodePosition).to.equal(3);
			done();
		});	
	});
	describe("Find node position", function() {
		it("should give the node given the node position" , function(done) {
			var doc = $("<div><div id=\"root\"><div>Lorem <span class= 'highlight'>ipsum </span>dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
			var nodePosition = 4;
			var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
			var node = Hiliter.findNodeByPosition({
				nodePosition: nodePosition,
				content: doc,
				relativeTo: "#root",
				highlightClass: "highlight"
			});	
			expect(node).to.equal(nodeToFind);	
			done();
		});			
	});		
});