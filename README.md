##Hiliter

Hiliter allows you to highlight document contents. It also gives out the absolute start and end positions which can be used to reload highlights in a same/different device. This library does not pollute the whole document by spannifying every word in the documents.

###How to use ?

To create a highlight

```javascript
var highlightData = Hiliter.highlight({
  range: window.getSelection().getRangeAt(0),
  colorOverride: 'orange'
});
```

Persist the contents of "highlightData" variable and pass the same to "loadHighlights" method to recreate the highlight.

```javascript
Hiliter.loadHighlights([highlightData]);
```
