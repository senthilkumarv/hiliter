describe('Highlighter', function() {
  var clearContent = function() {
    $('#content').html('');
  }

  beforeEach(clearContent);
  after(clearContent);

  describe('Add Highlight', function() {
    var hiliter;

    beforeEach(function(){
      hiliter = new Hiliter();
    });

    it('should remove highlight tags with no text in them', function() {
      var doc = '<div>The quick brown fox <span class="highlight" data-highlight-id="1"></span><span data-highlight-id="1" class="highlight"></span><span data-highlight-id="1" class="highlight">jumps over the lazy</span> dog.</div>';
      var sanitized_markups = new Marker(document).sanitize(doc, '1');
      expect(sanitized_markups)
          .to.equal('<div>The quick brown fox <span data-highlight-id="1" class="highlight">jumps over the lazy</span> dog.</div>');
    });

    it('should add the highlight tag for the give text range', function() {
      var doc = $('<div>Hello World. Some more text here.</div>')[0];
      hiliter.addHighlight(doc, {
        guid: 1,
        startOffset: 7,
        endOffset: 12,
        highlightClass: 'highlight'
      });
      expect(doc.innerHTML).to.equal('Hello <span data-highlight-id="1" class="highlight">World</span>. Some more text here.');
    });


    it("should not add empty highlight spans for nested tags", function() {
      var doc = $("<div><div>Lorem ipsum dolor<br/></div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div>")[0];
      hiliter.addHighlight(doc, {
        guid:1,
        startOffset:2,
        endOffset:23,
        highlightClass:'highlight'
      });
      expect(doc.innerHTML)
          .to.equal("<div>L<span data-highlight-id=\"1\" class=\"highlight\">orem ipsum dolor</span><br></div><span data-highlight-id=\"1\" class=\"highlight\"> sit </span><div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.");
    });

    it("should add highlight for nested tags", function() {
      var doc = $("<div><div>Lorem ipsum dolor</div> sit <div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.</div>")[0];
      hiliter.addHighlight(doc, {
        guid:1,
        startOffset:2,
        endOffset:23,
        highlightClass:'highlight'
      });
      expect(doc.innerHTML)
          .to.equal("<div>L<span data-highlight-id=\"1\" class=\"highlight\">orem ipsum dolor</span></div><span data-highlight-id=\"1\" class=\"highlight\"> sit </span><div>amet, <span>consectetur <span>adipiscing elit.</span> Phasellus et </span>lectus quam,</div> in iaculis diam.");
    });
  });

  describe("GetExistingHighlight", function() {
    it("gets highlight when span with highlight exists", function() {
      var docWithExistingHighlight = $('<div> <div id=\"container\">' +
          '  <span data-identifier=\"start_111\"></span>' +
          '  <div>' +
          '    Hello <span data-highlight-id=\"1\" class=\"highlight\">World</span>.' +
          '    Some more ' +
          '    <span data-identifier=\"end_111\"></span>' +
          '    text here.' +
          '  </div>' +
          '</div> </div>')[0];
      var hasHighlight = Hiliter.getExistingHighlight(docWithExistingHighlight, "111");
      expect(hasHighlight).to.equal('1');
    });

    it("does not get highlight when span with highlight does not exist", function() {
      var docWithNoHighlight = $('<div> <div id=\"container\">' +
          '  <div>' +
          '    Hello <span data-highlight-id=\"1\" class=\"highlight\">World</span>.' +
          '  <span data-identifier=\"start_111\"></span>' +
          '    Some more ' +
          '    <span data-identifier=\"end_111\"></span>' +
          '    Hello <span data-highlight-id=\"1\" class=\"highlight\">World</span>.' +
          '    text here.' +
          '  </div>' +
          '</div> </div>')[0];
      var hasHighlight = Hiliter.getExistingHighlight(docWithNoHighlight, "111");
      expect(hasHighlight).to.equal(undefined);
    });

    it("gets existing highlight if selection start alone is in existing highlight", function() {
      var doc = $('<div><div id="content"><div>You <span data-highlight-id="4456">can select' +
           '<span data-identifier="start_555"></span> some random</span>' +
          ' text <span data-identifier="end_555"></span> in this page</div></div></div>')[0];

      existingHighlightId = Hiliter.getExistingHighlight(doc, "555");
      expect(existingHighlightId).to.equal("4456");
    });
  });

  describe("highlight", function() {
    var mockMarker, mockRangey, mockFinder, mockWindow, hiliter;

    beforeEach(function() {
      mockMarker = {
        setStartMarkerAt: function() {
        },
        setEndMarkerAt: function() {
        },
        sanitize: function() {
        }
      };

      mockRangey = {
        isSelectionWithinSameParent: function() {
          return true;
        },
        offsetFromContainer: function() {
          return { startOffset:1, endOffset:1};
        },
        convertTextOffsetToDocumentOffset: function() {
        }
      };

      mockFinder = {
        findAncestor:
        function() {
          return $('<div>You can select <span data-identifier="start_555"></span> some <span data-highlight-id="111" class="highlight">random</span> text <span data-identifier="end_555"></span> in this page</div>')[0];
        },
        findNodePosition:function() {
          return 0;
        }
      };

      hiliter = new Hiliter({
        rangey: mockRangey,
        marker: mockMarker,
        finder: mockFinder
      });

      mockWindow = {
        document: document
      };

      mockWindow.getSelection = function() {
        return {
          getRangeAt: function() {
            return { };
          }
        };
      };
    });

    it("should update highlight when selection already contains a highlight", function() {
      mockRangey = {
        isSelectionWithinSameParent: function() {
          return true;
        },
        offsetFromContainer: function() {
          return {
            startOffset: 1,
            endOffset: 3
          };
        },
        convertTextOffsetToDocumentOffset: function() {
        }
      };

      mockFinder = {
        findAncestor: function() {
          return $('<div>You can select <span data-identifier="start_555"></span> some <span data-highlight-id="111" class="highlight">random</span> text <span data-identifier="end_555"></span> in this page</div>')[0];
        },
        findNodePosition: function() {
          return 0;
        },
        getFirstNode: function() {
          return $('<span data-identifier="start_555"></span>')[0];
        },
        getLastNode: function() {
          return $('<span data-identifier="end_555"></span>')[0];
        }
      };

      $("#content").html('<div>You can select <span data-identifier="start_555"></span> some <span data-highlight-id="111" class="highlight">random</span> text <span data-identifier="end_555"></span> in this page</div>');

      hiliter = new Hiliter({
        rangey: mockRangey,
        marker: mockMarker,
        finder: mockFinder,
        window: mockWindow
      });

      highlightData = hiliter.highlight("highlight", {}, "555");
      expect(highlightData.guid).to.equal("111");
    });

    it("should update highlight data when selection starts at the end of an existing highlight", function() {
      mockRangey = { isSelectionWithinSameParent:function() {
        return true;
      }, offsetFromContainer:function() {
        return { startOffset:1, endOffset:3};
      }, convertTextOffsetToDocumentOffset:function() {
      } };
      mockFinder = { findAncestor:function() {
        return $('<div>You can <span data-highlight-id="111" class="highlight">select <span data-identifier="start_555"></span> some random</span> text <span data-identifier="end_555"></span> in this page</div>')[0];
      },
        findNodePosition:function() {
          return 0;
        },
        getFirstNode:function() {
          return $('<span data-highlight-id="111" class="highlight">select <span data-identifier="start_555"></span> some random</span>')[0];
        },
        getLastNode:function() {
          return $('<span data-identifier="end_555"></span>')[0];
        }};

      $("#content").html('<div>You can <span data-highlight-id="111" class="highlight">select <span data-identifier="start_555"></span> some random</span> text <span data-identifier="end_555"></span> in this page</div>');

      hiliter = new Hiliter({
        rangey: mockRangey,
        marker: mockMarker,
        finder: mockFinder,
        window: mockWindow
      });

      highlightData = hiliter.highlight("highlight", {}, "555");
      expect(highlightData.guid).to.equal("111");
      expect(highlightData.startOffset).to.equal(1);
      expect(highlightData.endOffset).to.equal(3);
    });

    it("should not add highlight when start and end text offsets are same", function() {
      hiliter = new Hiliter({
        marker: mockMarker,
        window: mockWindow
      });
      var result = hiliter.highlight("", {}, "");
      expect(result).to.equal(null);
    });

    it("should return highlight obj when start and end text offsets are not same", function() {
      mockRangey.offsetFromContainer = function() {
        return {
          startOffset:1,
          endOffset: 2
        };
      };
      var result = hiliter.highlight("", mockWindow, document, "");
      expect(result.startOffset).to.equal(1);
      expect(result.endOffset).to.equal(2);
    });
  });

  describe("Remove highlight", function() {
    it("should remove highlights with given identifier", function() {
      $("#content").html('<div>Hello <span data-highlight-id=\"1\" class=\"highlight\">World</span>. Some more text here.</div>')
      Hiliter.removeHighlight(1);
      expect($("#content").html())
      .to.equal("<div>Hello World. Some more text here.</div>");
    });

    it("should not remove highlights that does not match the given identifier", function() {
      $("#content").html('<div>Hello <span data-highlight-id=\"1\" class=\"highlight\">World</span>. <span data-highlight-id=\"2\" class=\"highlight\">Some</span> more text here.</div>');
      Hiliter.removeHighlight(1);
      expect($("#content").html())
      .to.equal("<div>Hello World. <span data-highlight-id=\"2\" class=\"highlight\">Some</span> more text here.</div>");
    });
  });
});
