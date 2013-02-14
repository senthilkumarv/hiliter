describe("Highlighter", function() {
	describe("Offset", function() {
		it("should calculate text offset from given container", function(done) {
			var text = "<div>The <span data-identifier=\"start_12345678\">quick</span> brown fox <span>jumps <span data-identifier=\"end_12345678\">over</span> the lazy dog</span>. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</div>";
			var offsets = Rangey.offsetFromContainer(text, "12345678");
			expect(offsets.startOffset)
				.to.equal(5);
			expect(offsets.endOffset)
				.to.equal(31);
			done();
		});
	});
	describe("Add Highlight", function() {
		it("should remove highlight tags with no text in them", function(done) {
			var doc = "<div>The quick brown fox <span class=\"highlight\" data-highlight-id=\"1\"></span><span data-highlight-id=\"1\" class=\"highlight\"></span><span data-highlight-id=\"1\" class=\"highlight\">jumps over the lazy</span> dog.</div>";
			var sanitized_markups = Helper.sanitize(doc, "1");
			expect(sanitized_markups)
				.to.equal("<div>The quick brown fox <span data-highlight-id=\"1\" class=\"highlight\">jumps over the lazy</span> dog.</div>");
			done();
		});

		it("should transform text offset to document offset", function(done) {
			var doc = '<div>Hello World.</div>';
			var documentOffset = Rangey.convertTextOffsetToDocumentOffset(doc, 6);
			expect(documentOffset)
				.to.equal(11);
			done();
		});

		it("should add the highlight tag for the give text range", function(done) {
			var doc = $("<div>Hello World. Some more text here.</div>")[0];
			Hiliter.addHighlight(doc, {
				guid: 1,
				startOffset: 7,
				endOffset: 12,
				highlightClass: 'highlight'
			});
			expect(doc.innerHTML)
				.to.equal('Hello <span data-highlight-id=\"1\" class=\"highlight\">World</span>. Some more text here.');
			done();
		});

		it("should not add empty highlight spans for nested tags", function(done) {
			var doc = $("<div><div>Lorem ipsum dolor<br/></div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div>")[0];
			Hiliter.addHighlight(doc, {
				guid: 1,
				startOffset: 2,
				endOffset: 23,
				highlightClass: 'highlight'
			});
			expect(doc.innerHTML)
				.to.equal("<div>L<span data-highlight-id=\"1\" class=\"highlight\">orem ipsum dolor</span><br></div><span data-highlight-id=\"1\" class=\"highlight\"> sit </span><div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.");
			done();
		});

		it("should add highlight for nested tags", function(done) {
			var doc = $("<div><div>Lorem ipsum dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div>")[0];
			Hiliter.addHighlight(doc, {
				guid: 1,
				startOffset: 2,
				endOffset: 23,
				highlightClass: 'highlight'
			});
			expect(doc.innerHTML)
				.to.equal("<div>L<span data-highlight-id=\"1\" class=\"highlight\">orem ipsum dolor</span></div><span data-highlight-id=\"1\" class=\"highlight\"> sit </span><div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.");
			done();
		});
		it("should create highlight tag given id and class name", function(done) {
			var result = Hiliter.highlightTagWithId(1, "someClass");
			expect(result).
				to.equal("<span data-highlight-id=\"1\" class=\"someClass\">");
			done();
		});
	});
	describe("Remove highlight", function() {
		it("should remove highlights with given identifier", function(done) {
			var doc = $('<div>Hello <span data-highlight-id=\"1\" class=\"highlight\">World</span>. Some more text here.</div>')[0];
			Hiliter.removeHighlight(doc, 1);
			expect(doc.innerHTML)
				.to.equal("Hello World. Some more text here.");
			done();
		});
		it("should not remove highlights that does not match the given identifier", function(done) {
			var doc = $('<div>Hello <span data-highlight-id=\"1\" class=\"highlight\">World</span>. <span data-highlight-id=\"2\" class=\"highlight\">Some</span> more text here.</div>')[0];
			Hiliter.removeHighlight(doc, 1);
			expect(doc.innerHTML)
				.to.equal("Hello World. <span data-highlight-id=\"2\" class=\"highlight\">Some</span> more text here.");
			done();
		});
		it("should remove highlights with given identifier even when they are nested ", function(done) {
			var doc = $('<div>Hello <span data-highlight-id=\"1\" class=\"highlight\">Wo<span data-highlight-id=\"1\" class=\"highlight\">rl</span>d</span>. Some more text here.</div>')[0];
			Hiliter.removeHighlight(doc, 1);
			expect(doc.innerHTML)
				.to.equal("Hello World. Some more text here.");
			done();
		});		
	});
	describe("Find node position from root", function() {
		it("should find the position relative to give root", function(done) {
			var doc = $("<div><div id=\"root\"><div>Lorem ipsum dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
			var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
			var nodePosition = Hiliter.findNodePosition({
				nodeToFind: nodeToFind,
				content: doc,
				relativeTo: "#root",
			});
			expect(nodePosition)
				.to.equal(3);
			done();
		});
		it("should skip the highlight element", function(done) {
			var doc = $("<div><div id=\"root\"><div>Lorem <span data-highlight-id=\"1\" class= 'highlight'>ipsum </span>dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
			var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
			var nodePosition = Hiliter.findNodePosition({
				nodeToFind: nodeToFind,
				content: doc,
				relativeTo: "#root",
			});
			expect(nodePosition)
				.to.equal(3);
			done();
		});
	});
	describe("Find node position", function() {
		it("should give the node given the node position", function(done) {
			var doc = $("<div><div id=\"root\"><div>Lorem <span data-highlight-id=\"1\" class= 'highlight'>ipsum </span>dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
			var nodePosition = 4;
			var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
			var node = Hiliter.findNodeByPosition({
				nodePosition: nodePosition,
				content: doc,
				relativeTo: "#root",
			});
			expect(node)
				.to.equal(nodeToFind);
			done();
		});
	});
	describe("Range", function() {
		it("should give selection is within same parent when start container and end container are same", function(done) {
			var range = {startContainer: 1, endContainer: 1};
			var result = Rangey.isSelectionWithinSameParent(range);
			expect(result)
				.to.equal(true);
			done();
		});
		it("should give selection is within same parent when start container and end container are same", function(done) {
			var range = {startContainer: 1, endContainer: 2};
			var result = Rangey.isSelectionWithinSameParent(range);
			expect(result)
				.to.equal(false);
			done();
		});		
	});
});
