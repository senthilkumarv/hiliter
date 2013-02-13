describe("Highlighter", function() {
	describe("Add Highlight", function() {
	    it("should remove highlight tags with no text in them", function(done) {
			var doc = "<div>The quick brown fox <span class=\"highlight\" data-id=\"1\"></span><span data-id=\"2\" class=\"highlight\"></span><span class=\"highlight\">jumps over the lazy</span> dog.</div>";
			var sanitized_markups = Hiliter.sanitize(doc, "highlight");
	        expect(sanitized_markups).to.equal("<div>The quick brown fox <span class=\"highlight\">jumps over the lazy</span> dog.</div>");
	        done();
	    });		
	});
});