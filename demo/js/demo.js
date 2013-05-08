var handleSelection = function() {
  var highlightData = Hiliter.highlight({
    range: window.getSelection().getRangeAt(0),
    colorOverride: 'orange'
  });
};
