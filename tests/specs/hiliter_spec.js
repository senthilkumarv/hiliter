describe("Highlighter", function() {
	beforeEach(function(done) {
		$("#content").html("");
		done();
	});		
	describe("Add Highlight", function() {
		it("should remove highlight tags with no text in them", function(done) {
			var doc = "<div>The quick brown fox <span class=\"highlight\" data-highlight-id=\"1\"></span><span data-highlight-id=\"1\" class=\"highlight\"></span><span data-highlight-id=\"1\" class=\"highlight\">jumps over the lazy</span> dog.</div>";
			var sanitized_markups = Marker.sanitize(doc, "1");
			expect(sanitized_markups)
				.to.equal("<div>The quick brown fox <span data-highlight-id=\"1\" class=\"highlight\">jumps over the lazy</span> dog.</div>");
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

  describe("GetExistingHighlight", function(){
    it("gets highlight when span with highlight exists", function(){

      var docWithExistingHighlight = $('<div> <div id=\"container\">'+
                                       '  <span data-identifier=\"start_111\"></span>'+
                                       '  <div>'+
                                       '    Hello <span data-highlight-id=\"1\" class=\"highlight\">World</span>.'+
                                       '    Some more '+
                                       '    <span data-identifier=\"end_111\"></span>'+
                                       '    text here.'+
                                       '  </div>'+
                                       '</div> </div>')[0];
      var hasHighlight = Hiliter.getExistingHighlight(docWithExistingHighlight, "111");
      expect(hasHighlight).to.equal('1'); 
    });

    it("does not get highlight when span with highlight does not exist", function(){

      var docWithNoHighlight = $('<div> <div id=\"container\">'+
                                 '  <div>'+
                                 '    Hello <span data-highlight-id=\"1\" class=\"highlight\">World</span>.'+
                                 '  <span data-identifier=\"start_111\"></span>'+
                                 '    Some more '+
                                 '    <span data-identifier=\"end_111\"></span>'+
                                 '    Hello <span data-highlight-id=\"1\" class=\"highlight\">World</span>.'+
                                 '    text here.'+
                                 '  </div>'+
                                 '</div> </div>')[0];
      var hasHighlight = Hiliter.getExistingHighlight(docWithNoHighlight, "111");
      expect(hasHighlight).to.equal(undefined); 
    });

    it("gets existing highlight if selection start alone is in existing highlight",function(){
      var doc = $('<div><div id="content"><div>You <span data-highlight-id="4456">can select'
                  +'<span data-identifier="start_555"></span> some random</span>'
                  +' text <span data-identifier="end_555"></span> in this page</div></div></div>')[0];
    
      existingHighlightId = Hiliter.getExistingHighlight(doc, "555");
      expect(existingHighlightId).to.equal("4456");

    })

  });

    describe("highlight", function() {
            var mockMarker, mockRangey, mockFinder, hiliter;
            beforeEach(function(done) {
                    mockMarker = { setStartMarkerAt: function() {}, setEndMarkerAt: function() {}, sanitize: function() {}};
                    mockRangey = { isSelectionWithinSameParent: function() { return true; }, offsetFromContainer: function(){ return { startOffset: 1, endOffset: 1}; }, convertTextOffsetToDocumentOffset: function() {} };
                    mockFinder = { findNonHighlightAncestor: function(){
                                            return $('<div>You can select <span data-identifier="start_555"></span> some <span data-highlight-id="111" class="highlight">random</span> text <span data-identifier="end_555"></span> in this page</div>')[0];
                                               },
                 findNodePosition: function(){ return 0; } };	
                    hiliter = new HiliterCls(mockRangey, mockMarker, mockFinder);
                    window.getSelection = function() { return { getRangeAt: function() { return {};} }};
                    done();
            });

            it("should update highlight when selection already contains a highlight", function(done) {
              mockRangey = { isSelectionWithinSameParent: function() { return true; }, offsetFromContainer: function(){ return { startOffset: 1, endOffset: 3}; }, convertTextOffsetToDocumentOffset: function() {} };
              mockFinder = { findNonHighlightAncestor: function(){
                                                                  return $('<div>You can select <span data-identifier="start_555"></span> some <span data-highlight-id="111" class="highlight">random</span> text <span data-identifier="end_555"></span> in this page</div>')[0];
                                                                  },
                                                                  findNodePosition: function(){ return 0; },
                                                                  getFirstNode: function(){return $('<span data-identifier="start_555"></span>')[0];},
                                                                  getLastNode: function(){return $('<span data-identifier="end_555"></span>')[0] ;}
              };	

              hiliter = new HiliterCls(mockRangey, mockMarker, mockFinder);

              highlightData = hiliter.highlight("#content","highlight","555");
              expect(highlightData.guid).to.equal("111");
              done();
            });    
            it("should update highlight data when selection starts at the end of an existing highlight", function(done){
              mockRangey = { isSelectionWithinSameParent: function() { return true; }, offsetFromContainer: function(){ return { startOffset: 1, endOffset: 3}; }, convertTextOffsetToDocumentOffset: function() {} };
              mockFinder = { findNonHighlightAncestor: function(){
                                    return $('<div>You can <span data-highlight-id="111" class="highlight">select <span data-identifier="start_555"></span> some random</span> text <span data-identifier="end_555"></span> in this page</div>')[0];
                                    },
                                    findNodePosition: function(){ return 0; },
                                    getFirstNode: function(){return $('<span data-highlight-id="111" class="highlight">select <span data-identifier="start_555"></span> some random</span>')[0];},
                                    getLastNode: function(){return $('<span data-identifier="end_555"></span>')[0] ;}};	

              hiliter = new HiliterCls(mockRangey, mockMarker, mockFinder);

              highlightData = hiliter.highlight("#content","highlight","555");
              expect(highlightData.guid).to.equal("111");
              expect(highlightData.startOffset).to.equal(1);
              expect(highlightData.endOffset).to.equal(3);
              done();

            });

		it("should not add highlight when start and end text offsets are same", function(done) {			
			var result = hiliter.highlight("", "", "");
			expect(result).to.equal(null);
			done();
		});	

		it("should return highlight obj when start and end text offsets are not same", function(done) {			
			mockRangey.offsetFromContainer = function(){ return { startOffset: 1, endOffset: 2}; }
			var result = hiliter.highlight("", "", "");
			expect(result.commonAncestorPosition).to.equal(0);
			expect(result.startOffset).to.equal(1);
			expect(result.endOffset).to.equal(2);
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

	describe("load highlight", function() {
		var mockMarker, mockRangey, mockFinder, hiliter, findNodeByPositionStub;
		beforeEach(function(done) {
			findNodeByPositionStub = sinon.mock().returns($("#content")[0]);
			mockMarker = { setStartMarkerAt: function() {}, setEndMarkerAt: function() {}, sanitize: function() {}};
			mockRangey = { isSelectionWithinSameParent: function() { return true; }, offsetFromContainer: function(){ return { startOffset: 1, endOffset: 1}; }, convertTextOffsetToDocumentOffset: function() {} };
			mockFinder = { findNonHighlightAncestor: function(){ return { innerHTML: "" }; }, findNodePosition: function(){ return 0; }, findNodeByPosition: findNodeByPositionStub};	
			hiliter = new HiliterCls(mockRangey, mockMarker, mockFinder);
			window.getSelection = function() { return { getRangeAt: function() { return {};} }};
			done();
		});		
		it("should load highlights from given list", function(done) {
			var doc = $("#content").html("<div>Hello World. Some more text here.</div>");;
			findNodeByPositionStub.twice();
			hiliter.loadHighlights("#content", [{commonAncestorPosition: 0, startOffset: 1, endOffset: 5}, {commonAncestorPosition: 0, startOffset: 7, endOffset: 12}]);
			findNodeByPositionStub.verify();
			done();
		});
	});
	describe("Finder", function() {
		it("should find the position relative to give root", function(done) {
			var doc = $("<div><div id=\"root\"><div>Lorem ipsum dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
			var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
			var nodePosition = Finder.findNodePosition({
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
			var nodePosition = Finder.findNodePosition({
				nodeToFind: nodeToFind,
				content: doc,
				relativeTo: "#root",
			});
			expect(nodePosition)
				.to.equal(3);
			done();
		});
		it("should give the node given the node position", function(done) {
			var doc = $("<div><div id=\"root\"><div>Lorem <span data-highlight-id=\"1\" class= 'highlight'>ipsum </span>dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
			var nodePosition = 4;
			var nodeToFind = doc.querySelector('#root>div:nth-child(2)');
			var node = Finder.findNodeByPosition({
				nodePosition: nodePosition,
				content: doc,
				relativeTo: "#root",
			});
			expect(node)
				.to.equal(nodeToFind);
			done();
		});
	        describe("highlight and selection nodes", function(){	
                    it("should give the highlight node as first node between highlight id and selection id.", function(done) {
                            var doc = $("<div><div id=\"root\"><div>Lorem <span data-highlight-id=\"1\" class= 'highlight'>ipsum </span>dolor</div><span data-identifier = \"start_2\"></span>this is the selection highlight.sit <div>amet, <span>consectetur<span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
                            var highlightNode = doc.querySelector('[data-highlight-id=\"1\"]');
                            var node = Finder.getFirstNode(doc,"1","2");
                            expect(node).to.equal(highlightNode);
                            done();
                    });
                    
                    it("should give the selection node as first node between highlight id and selection id.", function(done) {
                            var doc = $("<div><div id=\"root\"><div>Lorem <span data-identifier=\"start_1\" class= 'highlight'>ipsum </span>dolor</div><span data-highlight-id = \"2\"></span>this is the selection highlight.sit <div>amet, <span>consectetur<span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
                            var selectionNode = doc.querySelector('[data-identifier=\"start_1\"]');
                            var node = Finder.getFirstNode(doc,"2","1");
                            expect(node).to.equal(selectionNode);
                            done();
                    });

                    it("should give the highlight node as last node between highlight id and selection id.", function(done) {
                            var doc = $("<div><div id=\"root\"><div>Lorem <span data-highlight-id=\"1\" class= 'highlight'>ipsum dolor this is the selection <span data-identifier = 'end_2'></span>highlight</div></span> .sit <div>amet, <span>consectetur<span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
                            var highlightNode = doc.querySelector('[data-highlight-id=\"1\"]');
                            var node = Finder.getLastNode(doc,"1","2");
                            expect(node).to.equal(highlightNode);
                            done();
                    });

                    it("should give the selection node as last node between highlight id and selection id.", function(done) {
                            var doc = $("<div><div id=\"root\"><div>Lorem <span data-highlight-id=\"1\" class= 'highlight'>ipsum dolor<span data-identifier = \"start_2\"></span></span></div>this i<span data-identifier = 'end_2'></span>hs the selection highlight.sit <div>amet, <span>consectetur<span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div><div>")[0];
                            var selectionNode = doc.querySelector('[data-identifier=\"end_2\"]');
                            var node = Finder.getLastNode(doc,"1","2");
                            expect(node).to.equal(selectionNode);
                            done();
                    });
                });

		it("should find non highlight parent", function(done) {
			$("#content").html("Find <span data-highlight-id=\"123\" id=\"highlight1\">non-highlight</span> parent");
			var parent = Finder.findNonHighlightAncestor(document.getElementById("highlight1").childNodes[0]);
			expect(parent).to.equal(document.getElementById("content"));
			done();
		});		
	});
	describe("Rangey", function() {
		it("should give selection is within same parent when start container and end container are same", function(done) {
			var range = {startContainer: 1, endContainer: 1};
			var result = Rangey.isSelectionWithinSameParent(range);
			expect(result)
				.to.equal(true);
			done();
		});
		it("should not give selection is within same parent when start container and end container are not same", function(done) {
			var range = {startContainer: 1, endContainer: 2};
			var result = Rangey.isSelectionWithinSameParent(range);
			expect(result)
				.to.equal(false);
			done();
		});	
		it("should calculate text offset from given container", function(done) {
			var text = "<div>The <span data-identifier=\"start_12345678\">quick</span> brown fox <span>jumps <span data-identifier=\"end_12345678\">over</span> the lazy dog</span>. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</div>";
			var offsets = Rangey.offsetFromContainer(text, "12345678");
			expect(offsets.startOffset)
				.to.equal(5);
			expect(offsets.endOffset)
				.to.equal(31);
			done();
		});
		it("should transform text offset to document offset", function(done) {
			var doc = '<div>Hello World.</div>';
			var documentOffset = Rangey.convertTextOffsetToDocumentOffset(doc, 6);
			expect(documentOffset)
				.to.equal(11);
			done();
		});

	});
	describe("Marker", function() {
		it("should set start marker at given offset", function(done) {
			$("#content").html("Set Markers");
			Marker.setStartMarkerAt("123", document.getElementById("content"), 0, 0);
			expect($("#content").html()).to.equal("<span data-identifier=\"start_123\"></span>Set Markers");
			done();
		});		
		it("should set end marker at given offset", function(done) {
			$("#content").html("Set Markers");
			Marker.setEndMarkerAt("123", document.getElementById("content"), 0, 0);
			expect($("#content").html()).to.equal("<span data-identifier=\"end_123\"></span>Set Markers");
			done();
		});
	});
});
