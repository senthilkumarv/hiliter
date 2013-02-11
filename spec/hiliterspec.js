describe("Higlighter", function() {
    describe("offset", function() {
	it("should calculate text offset from given container", function() {
	    var text = "<div>The <span data-identifier=\"start_12345678\">quick</span> brown fox <span>jumps <span data-identifier=\"end_12345678\">over</span> the lazy dog</span>. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</div>";
	    var offsets = Hiliter.offsetFromContainer(text, "12345678");
	    expect(offsets.startOffset).toBe(5);
	    expect(offsets.endOffset).toBe(31);
	});
    });
    describe("add highlight", function() {
		it("should transform text offset to document offset", function() {
		    var doc = '<div>Hello World.</div>';
		    var documentOffset = Hiliter.convertTextOffsetToDocumentOffset(doc, 6);	    
		    expect(documentOffset).toBe(11);
		});

		it("should add the highlight tag for the give text range", function() {
		    var doc = $("<div>Hello World. Some more text here.</div>")[0];
		    Hiliter.addHighlight(doc, {
				startOffset: 7,
				endOffset: 12,
				highlightClass: 'highlight'
		    });
		    expect(doc.innerHTML).toBe('Hello <span class=\"highlight\">World.</span> Some more text here.');
		});
	
		it("should add highlight for nested tags", function(){
		   var doc = $("<div><div>Lorem ipsum dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div>")[0];
		   Hiliter.addHighlight(doc, {
			   startOffset: 2,
			   endOffset: 23,
			   highlightClass: 'highlight'
		   });
		   expect(doc.innerHTML).toBe("<div>L<span class=\"highlight\">orem ipsum dolor</span></div><span class=\"highlight\"> sit </span><div><span class=\"highlight\">a</span>met, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.");
		});
	});
	describe("find node position from root", function() {
		it("should find the position relative to give root" , function() {
			var doc = $("<div><div id=\"root\"><div>Lorem ipsum dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
			var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
			var nodePosition = Hiliter.findNodePosition({
				nodeToFind: nodeToFind,
				content: doc,
				relativeTo: "#root",
				highlightClass: "highlight"
			});			
			expect(nodePosition).toBe(3);
		});
		it("should skip the highlight element" , function() {
			var doc = $("<div><div id=\"root\"><div>Lorem <span class= 'highlight'>ipsum </span>dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
			var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
			var nodePosition = Hiliter.findNodePosition({
				nodeToFind: nodeToFind,
				content: doc,
				relativeTo: "#root",
				highlightClass: "highlight"
			});			
			expect(nodePosition).toBe(3);
		});	
	});
	describe("find node position", function() {
		it("should give the node given the node position" , function() {
			var doc = $("<div><div id=\"root\"><div>Lorem <span class= 'highlight'>ipsum </span>dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
			var nodePosition = 4;
			var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
			var node = Hiliter.findNodeByPosition({
				nodePosition: nodePosition,
				content: doc,
				relativeTo: "#root",
				highlightClass: "highlight"
			});	
			expect(node).toBe(nodeToFind);	
		});			
	});
});