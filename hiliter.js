(function() {
  var root = this

  var Rangey = root.Rangey = { }

  Rangey.offsetFromContainer = function(content, identifier) {
    var startOffset = content.indexOf('<span data-identifier="start_' + identifier + '"')
      , startOffsetOfEndTag = content.indexOf('<span data-identifier="end_' + identifier + '"')
      , endOffset = content.indexOf('</span>', startOffsetOfEndTag);

    return {
      startOffset: calculateOffsetTill(content, startOffset),
      endOffset: calculateOffsetTill(content, endOffset)
    };
  };

  Rangey.convertTextOffsetToDocumentOffset = function(content, offset) {
    var insideTag = false
      , index = 0
      , i = 0;

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

  Rangey.isSelectionWithinSameParent = function(range) {
    return range.startContainer == range.endContainer;
  };

  var calculateOffsetTill = function(container, endIndex) {
    var insideTag = false
      , index = 1;

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
})(this);

(function() {
  var root = this

  var Marker = root.Marker = function($document) {
    this.document_ = $document || window.document;
  };

  Marker.prototype.setStartMarkerAt = function(identifier, element, startOffset, endOffset) {
    wrapRangeWithMarker.call(this, element, startOffset, endOffset, createMarkerWithIdentifier.call(this, identifier, 'start'));
  };

  Marker.prototype.setEndMarkerAt = function(identifier, element, startOffset, endOffset) {
    wrapRangeWithMarker.call(this, element, startOffset, endOffset, createMarkerWithIdentifier.call(this, identifier, 'end'));
  };

  Marker.prototype.sanitize = function(content, identifier) {
    var regex = new RegExp('(<span[^>]+data-highlight-id\\s*=\\s*("|\')' + identifier + '\\2[^>]*>)(\\s*)(</span>)', 'g');
    return content.replace(regex, '');
  };

  var createMarkerWithIdentifier = function(identifier, type) {
    var element = this.document_.createElement('span');
    element.setAttribute('data-identifier', type + '_' + identifier);
    return element;
  };

  var wrapRangeWithMarker = function(element, startOffset, endOffset, marker) {
    var newRange = this.document_.createRange();
    newRange.setStart(element, startOffset);
    newRange.setEnd(element, endOffset);
    newRange.surroundContents(marker);
  };
})(this);

(function() {
  var root = this

  var Finder = root.Finder = function(document) {
    this.document_ = document || window.document;
  }

  Finder.prototype.findNodePosition = function(data) {
    var node
      , index = 0
      , nodeList = data.content.querySelector(data.relativeTo)
      , nodes = this.document_.createNodeIterator(nodeList, NodeFilter.SHOW_ELEMENT, filter, false);

    while ((node = nodes.nextNode()) !== null) {
      index++;
      if (node == data.nodeToFind) break;
    }

    return index;
  };

  Finder.prototype.findNodeByPosition = function(data) {
    var index = 0
      , relativeTo = this.document_.querySelector(data.relativeTo)
      , nodes = getNodes.call(this, relativeTo || data.content, filter);

    while ((node = nodes.nextNode()) !== null) {
      index++;
      if (index == data.nodePosition) {
        return node;
      }
    }
  };

  Finder.prototype.getFirstNode = function(content, highlightId, selectionId) {
    var nodes = getNodes.call(this, content);

    while ((node = nodes.nextNode()) !== null) {
      if (node.getAttribute('data-identifier') === 'start_' + selectionId || node.getAttribute('data-highlight-id') === highlightId) {
        return node;
      }
    }
  };

  Finder.prototype.getLastNode = function(content, highlightId, selectionId) {
    var endNode
      , nodes = getNodes.call(this, content);

    while ((node = nodes.nextNode()) !== null) {
      if (node.getAttribute('data-identifier') === 'end_' + selectionId) endNode = node;
      if (node.getAttribute('data-highlight-id') === highlightId) {
        endNode = node;
      }
    }

    if (endNode.parentNode.getAttribute('data-highlight-id') === highlightId) {
      return endNode.parentNode;
    }

    return endNode;
  };

  Finder.prototype.isSelectionStartInHighlight = function(content, highlightId, selectionId) {
    var nodes = this.document_.createNodeIterator(content, NodeFilter.SHOW_ALL, null, false);

    while ((node = nodes.nextNode()) !== null) {
      if (node.getAttribute && node.getAttribute('data-highlight-id') === highlightId) {
        return true;
      }
      if (node.getAttribute && node.getAttribute('data-identifier') === 'start_' + selectionId) {
        break;
      }
    }

    while ((node = nodes.nextNode()) !== null) {
      if (node.nodeType === Node.TEXT_NODE) {
        return false;
      }
      if (node.getAttribute && node.getAttribute('data-highlight-id') === highlightId) {
        return true;
      }
    }

    return true;
  };

  Finder.prototype.isSelectionEndInHighlight = function(content, highlightId, selectionId) {
    var nodes = this.document_.createNodeIterator(content, NodeFilter.SHOW_ALL, null, false);

    while ((node = nodes.nextNode()) !== null) {
      if (node.getAttribute && node.getAttribute('data-highlight-id') === highlightId) {
        break;
      }
    }

    while ((node = nodes.nextNode()) !== null) {
      if (node.nodeType === Node.TEXT_NODE && (node.parentNode.getAttribute && node.parentNode.getAttribute('data-highlight-id') !== highlightId)) {
        return false;
      }
      if (node.getAttribute && node.getAttribute('data-identifier') === 'end_' + selectionId) {
        return true;
      }
    }

    return true;
  };

  Finder.prototype.findHighlights = function(content, selectionId) {
    var nodes = this.document_.createNodeIterator(content, NodeFilter.SHOW_ALL, null, false)
      , highlights = []
      , insideCurrentSelection = false
      , parentHighlightId;

    var containsHighlight = function(highlightId) {
      for (var i = 0; i < highlights.length; i++) {
        if (highlights[i] === highlightId) return true;
      }

      return false;
    };

    while ((node = nodes.nextNode()) !== null) {
      if (node.getAttribute && node.getAttribute('data-identifier') === 'start_' + selectionId) {
        insideCurrentSelection = true;
        parentHighlightId = node.parentNode.getAttribute && node.parentNode.getAttribute('data-highlight-id');
        if (parentHighlightId && !containsHighlight(parentHighlightId)) {
          highlights.push(parentHighlightId);
        }
      }
      if (insideCurrentSelection && node.getAttribute && node.getAttribute('data-highlight-id') && !containsHighlight(node.getAttribute('data-highlight-id'))) {
        highlights.push(node.getAttribute('data-highlight-id'));
      }
      if (node.getAttribute && node.getAttribute('data-identifier') === 'end_' + selectionId) {
        break;
      }
    }

    return highlights;
  };

  var filter = function(node) {
    if (node.getAttribute('data-highlight-id') === null && node.getAttribute('data-identifier') === null) {
      return NodeFilter.FILTER_ACCEPT;
    }

    return NodeFilter.FILTER_SKIP;
  };

  var getNodes = function(content, filter) {
    return this.document_.createNodeIterator(content, NodeFilter.SHOW_ELEMENT, filter, false);
  };

  var findNonHighlightAncestor = function(commonAncestor) {
    while (commonAncestor.nodeName === '#text' || commonAncestor.getAttribute('data-highlight-id')) {
      commonAncestor = commonAncestor.parentElement;
    }

    return commonAncestor;
  };
})(this);

(function() {
  var root = this

  var Hiliter = root.Hiliter = function(options) {
    options = options || {};

    this.window_ = options.window || window;
    this.document_ = options.document || this.window_.document;
    this.finder_ = options.finder || new Finder(this.document_);
    this.rangey_ = options.rangey || Rangey;
    this.marker_ = options.marker || new Marker(this.document_);
    this.ancestorNodeSelector_ = options.ancestorNodeSelector || '#content';
    this.ancestorNode_ = this.document_.querySelector(this.ancestorNodeSelector_);
  }

  Hiliter.prototype.getExistingHighlight = function(content, markerId) {
    var node
      , highlightAttributeId
      , nodes;

    if (!content || !content.innerHTML) {
      return;
    }

    nodes = this.document_.createNodeIterator(content, NodeFilter.SHOW_ELEMENT, null, false);

    while ((node = nodes.nextNode()) !== null) {
      if (node.getAttribute('data-identifier') === 'start_' + markerId) {
        highlightAttributeId = node.parentNode.getAttribute('data-highlight-id');
        if (highlightAttributeId) {
          return highlightAttributeId;
        }
        break;
      }
    }

    while ((node = nodes.nextNode()) !== null) {
      highlightAttributeId = node.getAttribute('data-highlight-id');
      if (highlightAttributeId) {
        return highlightAttributeId;
      }
      if (node.getAttribute('data-identifier') === 'end_' + markerId) {
        return;
      }
    }
  };

  Hiliter.prototype.addHighlight = function(content, highlight) {
    var nodeContent = content.innerHTML
      , startOffset = this.rangey_.convertTextOffsetToDocumentOffset(nodeContent, highlight.startOffset)
      , endOffset = this.rangey_.convertTextOffsetToDocumentOffset(nodeContent, highlight.endOffset - 1)
      , htmlElement = nodeContent.substring(0, startOffset - 1) + highlightTagWithId(highlight.guid, highlight.highlightClass);

    for (var i = startOffset - 1; i < endOffset; i++) {
      htmlElement += nodeContent[i];
      if (nodeContent[i] === '<') {
        htmlElement += '/span><';
      } else if (nodeContent[i] === '>') {
        htmlElement += highlightTagWithId(highlight.guid, highlight.highlightClass);
      }
    }

    htmlElement += '</span>';

    content.innerHTML = this.marker_.sanitize(htmlElement, highlight.guid) + nodeContent.substring(endOffset);
    this.removeMarkers(content);

    return highlight.guid;
  };

  Hiliter.prototype.removeMarkers = function(content) {
    this.removeNodes(content, '[data-identifier]');
  };

  Hiliter.prototype.removeHighlight = function(identifier) {
    var allHighlightSpans = this.document_.querySelectorAll('span[data-highlight-id="' + identifier + '"]');

    for (var highlightSpan in allHighlightSpans) {
      allHighlightSpans[highlightSpan].outerHTML = allHighlightSpans[highlightSpan].innerHTML;
    }
  };

  Hiliter.prototype.clearAllHighlights = function() {
    var allHighlightSpans = this.document_.querySelectorAll('span[data-highlight-id]');

    for (var highlightSpan in allHighlightSpans) {
      allHighlightSpans[highlightSpan].outerHTML = allHighlightSpans[highlightSpan].innerHTML;
    }
  };

  Hiliter.prototype.removeNodes = function(content, selector) {
    var nodes;

    if (!content || !content.innerHTML) {
      return;
    }

    nodes = content.querySelectorAll(selector);

    for (i = 0; i < nodes.length; i++) {
      this.removeNode(nodes[i]);
    }
  };

  Hiliter.prototype.wrapSelection = function(range, identifier) {
    this.marker_.setStartMarkerAt(identifier, range.startContainer, range.startOffset, range.startOffset);
    this.marker_.setEndMarkerAt(identifier, range.endContainer, range.endOffset, range.endOffset);
  };

  Hiliter.prototype.getSelectedHighlight = function() {
    var range = this.window_.getSelection().getRangeAt(0)
      , parent = this.range_.startContainer.parentElement;

    return parent.getAttribute('data-highlight-id');
  };

  Hiliter.prototype.getMergedRange = function(range, containerSelector, existingHighlightId) {
    var selectionId = new Date().getTime();

    wrapSelection(range, selectionId);

    return createMergedRange(this.document_.querySelector(containerSelector), existingHighlightId, selectionId, this.document_);
  };

  Hiliter.prototype.createMergedRange = function(content, existingHighlightId, selectionId) {
    var startNode = this.finder_.getFirstNode(content, existingHighlightId, selectionId)
      , endNode = this.finder_.getLastNode(content, existingHighlightId, selectionId)
      , range = this.document_.createRange();

    range.setStart(startNode, 0);
    range.setEndAfter(endNode);

    return range;
  };

  Hiliter.prototype.getMergedHighlightClassNames = function(classNames, existingHighlightId) {
    var highlight = this.document_.querySelector('[data-highlight-id="' + existingHighlightId + '"]')
      , classNameArray = classNames.split(' ')
      , existingClassNames

    if (!highlight) {
      return classNames;
    }

    existingClassNames = highlight.getAttribute('class').split(' ');

    for (var i = 0; i < existingClassNames.length; i++) {
      if (classNameArray.indexOf(existingClassNames[i]) === -1) {
        classNameArray.push(existingClassNames[i]);
      }
    }

    return classNameArray.join(' ');
  };

  Hiliter.prototype.highlight = function(classNames, range, highlightId) {
    var existingHighlightId
      , offset
      , highlightData

    highlightId = (highlightId) ? highlightId : (new Date().getTime());

    this.wrapSelection(range, highlightId);

    existingHighlightId = this.getExistingHighlight(this.ancestorNode_, highlightId);

    if (existingHighlightId) {
      range = this.createMergedRange(this.ancestorNode_, existingHighlightId, highlightId, window.document_);
      this.wrapSelection(range, existingHighlightId, window.document_);
      classNames = this.getMergedHighlightClassNames(classNames, existingHighlightId, window.document_);
      highlightId = existingHighlightId;
      this.removeHighlight(this.ancestorNode_, existingHighlightId);
    }

    offset = this.rangey_.offsetFromContainer(this.ancestorNode_.innerHTML, highlightId);

    if (offset.startOffset === offset.endOffset) {
      return null;
    }

    highlightData = {
      guid: highlightId,
      startOffset: offset.startOffset,
      endOffset: offset.endOffset,
      highlightClass: classNames,
      content: range.toString()
    };

    this.addHighlight(this.ancestorNode_, highlightData);

    return highlightData;
  };

  Hiliter.prototype.findExistingHighlight = function(range) {
    var selectionId = new Date().getTime();

    this.wrapSelection(range, selectionId);

    return this.getExistingHighlight(this.document_.querySelector(this.ancestorNode_), selectionId);
  };

  Hiliter.prototype.removeNode = function(node) {
    var parentNode = node.parentNode
      , innerNode;

    while (innerNode = node.firstChild) {
      parentNode.insertBefore(innerNode, node);
    }

    parentNode.removeChild(node);
  };

  Hiliter.prototype.loadHighlights = function(highlights) {
    highlights.forEach(function(highlight) {
      this.addHighlight(this.ancestorNode_, highlight);
    })
  };

  Hiliter.prototype.isHighlighted = function(range) {
    var selectionId = new Date().getTime()
      , content = this.document_.querySelector(containerSelector)
      , existingHighlightId
      , isSelectionInHighlight;

    this.wrapSelection(range, selectionId);

    existingHighlightId = this.getExistingHighlight(this.ancestorNode_, selectionId);

    if (!existingHighlightId) {
      return false;
    }

    isSelectionInHighlight =
      this.finder_.isSelectionStartInHighlight(this.ancestorNode_, existingHighlightId, selectionId) &&
      this.finder_.isSelectionEndInHighlight(this.ancestorNode_, existingHighlightId, selectionId);

    this.removeMarkers(this.ancestorNode_);

    return isSelectionInHighlight;
  };

  Hiliter.prototype.highlightsInSelectionRange = function(containerSelector, range) {
    var selectionId = new Date().getTime()
      , content = this.document_.querySelector(containerSelector)
      , numberOfHighlights

    this.wrapSelection(range, selectionId);

    numberOfHighlights = this.finder_.findHighlights(content, selectionId);

    this.removeMarkers(content);

    return numberOfHighlights;
  };

  var highlightTagWithId = function(id, className) {
    return '<span data-highlight-id="' + id + '" class="' + className + '">';
  };

  Object.keys(Hiliter.prototype).forEach(function(k) {
    Hiliter[k] = function() {
      return Hiliter.prototype[k].apply(new Hiliter(), arguments);
    };
  });
})(this);
