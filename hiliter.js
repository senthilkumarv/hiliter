var Rangey = (function () {
  var calculateOffsetTill = function (container, endIndex) {
    var insideTag = false;
    var index = 1;
    for (var i = 0; i <= endIndex; i++) {
      if (container[i] === '<') {
        insideTag = true;
      }
      index += (insideTag) ? 0 : 1;
      if (container[i] === '>') {
        insideTag = false;
      }
    }
    return index;
  };

  var offsetFromContainer = function (content, identifier) {
    var startOffset = content.indexOf("<span data-identifier=\"start_" + identifier + "\"");
    var endOffset = content.indexOf("<span data-identifier=\"end_" + identifier + "\"");
    endOffset = content.indexOf("</span>", endOffset);
    return {
      startOffset: calculateOffsetTill(content, startOffset),
      endOffset: calculateOffsetTill(content, endOffset)
    };
  };

  var convertTextOffsetToDocumentOffset = function (content, offset) {
    var insideTag = false;
    var index = 0,
      i = 0;
    for (i = 0; i < content.length && (index != offset); i++) {
      if (content[i] === '<') {
        insideTag = true;
      }
      index += (insideTag) ? 0 : 1;
      if (content[i] === '>') {
        insideTag = false;
      }
    }
    return i;
  };

  var isSelectionWithinSameParent = function (range) {
    return range.startContainer == range.endContainer;
  };

  return {
    offsetFromContainer: offsetFromContainer,
    convertTextOffsetToDocumentOffset: convertTextOffsetToDocumentOffset,
    isSelectionWithinSameParent: isSelectionWithinSameParent
  };
})();

var Marker = function ($document) {
  var createMarkerWithIdentifier = function (identifier, type) {
    var element = $document.createElement('span');
    element.setAttribute('data-identifier', type + "_" + identifier);
    return element;
  };

  var wrapRangeWithMarker = function (element, startOffset, endOffset, marker) {
    var newRange = $document.createRange();
    newRange.setStart(element, startOffset);
    newRange.setEnd(element, endOffset);
    newRange.surroundContents(marker);
  };

  var setStartMarkerAt = function (identifier, element, startOffset, endOffset) {
    wrapRangeWithMarker(element, startOffset, endOffset, createMarkerWithIdentifier(identifier, "start"));
  };

  var setEndMarkerAt = function (identifier, element, startOffset, endOffset) {
    wrapRangeWithMarker(element, startOffset, endOffset, createMarkerWithIdentifier(identifier, "end"));
  };

  var sanitize = function (content, identifier) {
    var regex = new RegExp("(<span[^>]+data-highlight-id\\s*=\\s*(\"|')" + identifier + "\\2[^>]*>)(\\s*)(</span>)", 'g');
    return content.replace(regex, '');
  };

  return {
    setStartMarkerAt: setStartMarkerAt,
    setEndMarkerAt: setEndMarkerAt,
    sanitize: sanitize
  };
};

var Finder = function ($document) {
  var filter = function (node) {
    if (node.getAttribute("data-highlight-id") === null && node.getAttribute("data-identifier") === null) return NodeFilter.FILTER_ACCEPT;
    return NodeFilter.FILTER_SKIP;
  };

  var findNodePosition = function (data) {
    var node, index = 0;
    var nodes = $document.createNodeIterator(data.content.querySelector(data.relativeTo), NodeFilter.SHOW_ELEMENT, filter, false);
    while ((node = nodes.nextNode()) !== null) {
      index++;
      if (node == data.nodeToFind) break;
    }
    return index;
  };

  var findNodeByPosition = function (data) {
    var index = 0;

    var relativeTo = $document.querySelector(data.relativeTo);
    var nodes = getNodes(relativeTo || data.content, filter);
    while ((node = nodes.nextNode()) !== null) {
      index++;
      if (index == data.nodePosition) return node;
    }
  };

  var getNodes = function (content, filter) {
    return $document.createNodeIterator(content, NodeFilter.SHOW_ELEMENT, filter, false);
  };

  var findNonHighlightAncestor = function (commonAncestor) {
    while (commonAncestor.nodeName === "#text" || commonAncestor.getAttribute("data-highlight-id")) {
      commonAncestor = commonAncestor.parentElement;
    }
    return commonAncestor;
  };

  var findAncestorByNodeName = function (commonAncestor, nodeName) {
    while (commonAncestor.nodeName.toLowerCase() !== nodeName) {
      commonAncestor = commonAncestor.parentElement;
    }
    return commonAncestor;
  };

  var findAncestor = function (commonAncestor, nodeName) {
    if (nodeName) {
      return findAncestorByNodeName(commonAncestor, nodeName);
      return findNonHighlightAncestor(commonAncestor);
    }
    return findNonHighlightAncestor(commonAncestor, nodeName);
  };

  var getFirstNode = function (content, highlightId, selectionId) {
    var nodes = getNodes(content);
    while ((node = nodes.nextNode()) !== null) {
      if (node.getAttribute("data-identifier") === "start_" + selectionId || node.getAttribute("data-highlight-id") === highlightId) {
        return node;
      }
    }
  };

  var getLastNode = function (content, highlightId, selectionId) {
    var endNode;

    var nodes = getNodes(content);
    while ((node = nodes.nextNode()) !== null) {
      if (node.getAttribute("data-identifier") === "end_" + selectionId) endNode = node;
      if (node.getAttribute("data-highlight-id") === highlightId) {
        endNode = node;
      }
    }

    if (endNode.parentNode.getAttribute("data-highlight-id") === highlightId) {
      return endNode.parentNode;
    }
    return endNode;

  };

  var isSelectionStartInHighlight = function (content, highlightId, selectionId) {
    var nodes = $document.createNodeIterator(content, NodeFilter.SHOW_ALL, null, false);
    while ((node = nodes.nextNode()) !== null) {
      if (node.getAttribute && node.getAttribute("data-highlight-id") === highlightId) return true;
      if (node.getAttribute && node.getAttribute("data-identifier") === "start_" + selectionId) break;
    }

    while ((node = nodes.nextNode()) !== null) {

      if (node.nodeType === Node.TEXT_NODE) return false;
      if (node.getAttribute && node.getAttribute("data-highlight-id") === highlightId) return true;
    }
    return true;
  };

  var isSelectionEndInHighlight = function (content, highlightId, selectionId) {
    var nodes = $document.createNodeIterator(content, NodeFilter.SHOW_ALL, null, false);
    while ((node = nodes.nextNode()) !== null) {
      if (node.getAttribute && node.getAttribute("data-highlight-id") === highlightId) break;
    }

    while ((node = nodes.nextNode()) !== null) {
      if (node.nodeType === Node.TEXT_NODE && (node.parentNode.getAttribute && node.parentNode.getAttribute("data-highlight-id") !== highlightId)) return false;
      if (node.getAttribute && node.getAttribute("data-identifier") === "end_" + selectionId) return true;
    }
    return true;
  };

  var findHighlights = function (content, selectionId) {
    var nodes = $document.createNodeIterator(content, NodeFilter.SHOW_ALL, null, false);
    var highlights = [];
    var insideCurrentSelection = false;
    var containsHighlight = function (highlightId) {
      for (var i = 0; i < highlights.length; i++) {
        if (highlights[i] === highlightId) return true;
      }
      return false;
    };
    while ((node = nodes.nextNode()) !== null) {
      if (node.getAttribute && node.getAttribute("data-identifier") === "start_" + selectionId) {
        insideCurrentSelection = true;
        var parentHighlightId = node.parentNode.getAttribute && node.parentNode.getAttribute("data-highlight-id");
        if (parentHighlightId && !containsHighlight(parentHighlightId)) highlights.push(parentHighlightId);
      }
      if (insideCurrentSelection && node.getAttribute && node.getAttribute("data-highlight-id") && !containsHighlight(node.getAttribute("data-highlight-id"))) highlights.push(node.getAttribute("data-highlight-id"));
      if (node.getAttribute && node.getAttribute("data-identifier") === "end_" + selectionId) break;
    }
    return highlights;
  };

  return {
    findNodePosition: findNodePosition,
    findNodeByPosition: findNodeByPosition,
    findAncestor: findAncestor,
    getFirstNode: getFirstNode,
    getLastNode: getLastNode,
    isSelectionStartInHighlight: isSelectionStartInHighlight,
    isSelectionEndInHighlight: isSelectionEndInHighlight,
    findHighlights: findHighlights
  };

};

var HiliterCls = function (rangey, marker, nodeFinder, ancestorNode) {
  var highlightTagWithId = function (id, className) {
    return "<span data-highlight-id=\"" + id + "\" class=\"" + className + "\">";
  };

  var getExistingHighlight = function (content, markerId) {
    if (!content || !content.innerHTML) return;
    var node;
    var highlightAttributeId;
    var nodes = document.createNodeIterator(content, NodeFilter.SHOW_ELEMENT, null, false);
    while ((node = nodes.nextNode()) !== null) {
      if (node.getAttribute("data-identifier") === "start_" + markerId) {
        highlightAttributeId = node.parentNode.getAttribute("data-highlight-id");
        if (highlightAttributeId) {
          return highlightAttributeId;
        }
        break;
      }
    }

    while ((node = nodes.nextNode()) !== null) {
      highlightAttributeId = node.getAttribute("data-highlight-id");
      if (highlightAttributeId) {
        return highlightAttributeId;
      }
      if (node.getAttribute("data-identifier") === "end_" + markerId) {
        return;
      }
    }
    return;
  };

  var addHighlight = function (content, highlight) {
    var nodeContent = content.innerHTML;

    var startOffset = rangey.convertTextOffsetToDocumentOffset(nodeContent, highlight.startOffset);
    var endOffset = rangey.convertTextOffsetToDocumentOffset(nodeContent, highlight.endOffset - 1);
    var htmlElement = nodeContent.substring(0, startOffset - 1) + highlightTagWithId(highlight.guid, highlight.highlightClass);
    for (var i = startOffset - 1; i < endOffset; i++) {
      htmlElement += nodeContent[i];
      if (nodeContent[i] === '<') htmlElement += "/span><";
      if (nodeContent[i] === '>') htmlElement += highlightTagWithId(highlight.guid, highlight.highlightClass);
    }
    htmlElement += "</span>";
    content.innerHTML = marker.sanitize(htmlElement, highlight.guid) + nodeContent.substring(endOffset);
    removeMarkers(content);
    return highlight.guid;
  };

  var removeMarkers = function (content) {
    removeNodes(content, '[data-identifier]');
  };


  var removeHighlight = function ($document, identifier) {
    var $allHighlightSpans = $document.querySelectorAll('span[data-highlight-id="' + identifier + '"]');
    for (var highlightSpan in $allHighlightSpans) {
      $allHighlightSpans[highlightSpan].outerHTML = $allHighlightSpans[highlightSpan].innerHTML;
    }
  };

  var clearAllHighlights = function ($document) {
    var $allHighlightSpans = $document.querySelectorAll('span[data-highlight-id]');
    for (var highlightSpan in $allHighlightSpans) {
      $allHighlightSpans[highlightSpan].outerHTML = $allHighlightSpans[highlightSpan].innerHTML;
    }
  };

  var removeNodes = function (content, selector) {
    if (!content || !content.innerHTML) return;
    var nodes = content.querySelectorAll(selector);
    for (i = 0; i < nodes.length; i++) {
      removeNode(nodes[i]);
    }
  };

  var wrapSelection = function (range, identifier) {
    marker.setStartMarkerAt(identifier, range.startContainer, range.startOffset, range.startOffset);
    marker.setEndMarkerAt(identifier, range.endContainer, range.endOffset, range.endOffset);
  };

  var getSelectedHighlight = function ($window) {
    var range = $window.getSelection()
      .getRangeAt(0);
    var parent = range.startContainer.parentElement;
    return parent.getAttribute("data-highlight-id");
  };

  var getMergedRange = function (range, containerSelector, existingHighlightId, $document) {
    marker = marker || new Marker($document);
    nodeFinder = nodeFinder || new Finder($document);
    var selectionId = new Date().getTime();
    wrapSelection(range, selectionId);
    return createMergedRange($document.querySelector(containerSelector), existingHighlightId, selectionId, $document);
  };

  var createMergedRange = function (content, existingHighlightId, selectionId, $document) {
    var startNode = nodeFinder.getFirstNode(content, existingHighlightId, selectionId);
    var endNode = nodeFinder.getLastNode(content, existingHighlightId, selectionId);

    var range = $document.createRange();
    range.setStart(startNode, 0);
    range.setEndAfter(endNode);
    return range;
  };

  var getMergedHighlightClassNames = function (classNames, existingHighlightId, $document) {
    var highlight = $document.querySelector('[data-highlight-id="' + existingHighlightId + '"]');
    var classNameArray = classNames.split(" ");
    if (!highlight) {
      return classNames;
    }
    var existingClassNames = highlight.getAttribute("class").split(" ");
    for (var i = 0; i < existingClassNames.length; i++) {
      if (classNameArray.indexOf(existingClassNames[i]) === -1) {
        classNameArray.push(existingClassNames[i]);
      }
    }
    return classNameArray.join(" ");
  };

  var highlight = function (containerSelector, classNames, range, $window, $document, highlightId) {
    marker = marker || new Marker($document);
    nodeFinder = nodeFinder || new Finder($document);
    highlightId = (highlightId) ? highlightId : (new Date().getTime());

    wrapSelection(range, highlightId);
    var existingHighlightId = getExistingHighlight(nodeFinder.findAncestor(range.commonAncestorContainer, ancestorNode), highlightId);

    if (existingHighlightId) {
      var content = $document.querySelector(containerSelector);
      range = createMergedRange(content, existingHighlightId, highlightId, $document);
      wrapSelection(range, existingHighlightId, $document);
      classNames = getMergedHighlightClassNames(classNames, existingHighlightId, $document);
      highlightId = existingHighlightId;
      removeHighlight(content, existingHighlightId);
    }

    var commonAncestor = nodeFinder.findAncestor(range.commonAncestorContainer, ancestorNode);
    var offset = rangey.offsetFromContainer(commonAncestor.innerHTML, highlightId);
    if (offset.startOffset === offset.endOffset) return null;

    var ancestorPosition = nodeFinder.findNodePosition({
      nodeToFind: commonAncestor,
      content: $document,
      relativeTo: containerSelector
    });

    var highlightData = {
      guid: highlightId,
      commonAncestorPosition: ancestorPosition,
      startOffset: offset.startOffset,
      endOffset: offset.endOffset,
      highlightClass: classNames,
      content: range.toString()
    };

    addHighlight(commonAncestor, highlightData);
    return highlightData;
  };

  var findExistingHighlight = function (range, $document) {
    marker = marker || new Marker($document);
    nodeFinder = nodeFinder || new Finder($document);
    var selectionId = new Date().getTime();
    wrapSelection(range, selectionId);
    var highlight = getExistingHighlight(nodeFinder.findAncestor(range.commonAncestorContainer, ancestorNode), selectionId);
    return highlight;
  };

  var removeNode = function (node) {

    var parentNode = node.parentNode;
    var innerNode;

    while (innerNode = node.firstChild) {
      parentNode.insertBefore(innerNode, node);
    }
    parentNode.removeChild(node);
  };

  var loadHighlights = function (containerSelector, highlights, $window, $document) {
    marker = marker || new Marker($document);
    nodeFinder = nodeFinder || new Finder($document);
    for (var i = 0; i < highlights.length; i++) {
      var commonAncestor = nodeFinder.findNodeByPosition({
        nodePosition: highlights[i].commonAncestorPosition,
        content: $document.body,
        relativeTo: containerSelector,
        highlightClass: highlights[i].highlightClass
      });
      addHighlight(commonAncestor, highlights[i]);
    }
  };

  var isHighlighted = function (containerSelector, range, $document) {
    marker = marker || new Marker($document);
    nodeFinder = nodeFinder || new Finder($document);
    var selectionId = new Date().getTime();
    var content = $document.querySelector(containerSelector);
    wrapSelection(range, selectionId);
    var existingHighlightId = getExistingHighlight(nodeFinder.findAncestor(range.commonAncestorContainer, ancestorNode), selectionId);
    if (!existingHighlightId) return false;

    var isSelectionInHighlight = nodeFinder.isSelectionStartInHighlight(content, existingHighlightId, selectionId) && nodeFinder.isSelectionEndInHighlight(content, existingHighlightId, selectionId);
    removeMarkers(content);
    return isSelectionInHighlight;
  };

  var highlightsInSelectionRange = function (containerSelector, range, $document) {
    marker = marker || new Marker($document);
    nodeFinder = nodeFinder || new Finder($document);
    var selectionId = new Date().getTime();
    var content = $document.querySelector(containerSelector);
    wrapSelection(range, selectionId);
    var numberOfHighlights = nodeFinder.findHighlights(content, selectionId);
    removeMarkers(content);
    return numberOfHighlights;
  };

  var reset = function () {
    marker = null;
    nodeFinder = null;
  };
  var useAncestorNode = function (ancestorNodeName) {
    ancestorNode = ancestorNodeName;
  };


  return {
    loadHighlights: loadHighlights,
    highlight: highlight,
    getExistingHighlight: getExistingHighlight,
    addHighlight: addHighlight,
    highlightTagWithId: highlightTagWithId,
    removeHighlight: removeHighlight,
    clearAllHighlights: clearAllHighlights,
    getSelectedHighlight: getSelectedHighlight,
    isHighlighted: isHighlighted,
    highlightsInSelectionRange: highlightsInSelectionRange,
    findExistingHighlight: findExistingHighlight,
    getMergedRange: getMergedRange,
    reset: reset,
    useAncestorNode: useAncestorNode
  };
};
var Hiliter = new HiliterCls(Rangey);