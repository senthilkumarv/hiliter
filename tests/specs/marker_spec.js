describe("Marker", function() {
  it("should set start marker at given offset", function() {
    $("#content").html("Set Markers");
    new Marker(document).setStartMarkerAt("123", document.getElementById("content"), 0, 0);
    expect($("#content").html()).to.equal("<span data-identifier=\"start_123\"></span>Set Markers");
  });

  it("should set end marker at given offset", function() {
    $("#content").html("Set Markers");
    new Marker(document).setEndMarkerAt("123", document.getElementById("content"), 0, 0);
    expect($("#content").html()).to.equal("<span data-identifier=\"end_123\"></span>Set Markers");
  });
});
