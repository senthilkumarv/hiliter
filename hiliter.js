var Rangey = (function() {
	var calculateOffsetTill = function(container, endIndex) {
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

	var offsetFromContainer = function(content, identifier) {
		var startOffset = content.indexOf("<span data-identifier=\"start_" + identifier + "\"")
		var endOffset = content.indexOf("<span data-identifier=\"end_" + identifier + "\"")
		endOffset = content.indexOf("</span>", endOffset);
		return {
			startOffset: calculateOffsetTill(content, startOffset),
			endOffset: calculateOffsetTill(content, endOffset)
		};
	};

	var convertTextOffsetToDocumentOffset = function(content, offset) {
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
	
	var isSelectionWithinSameParent = function(range) {
		return range.startContainer == range.endContainer;
	};

	return {
		offsetFromContainer: offsetFromContainer,
		convertTextOffsetToDocumentOffset: convertTextOffsetToDocumentOffset,
		isSelectionWithinSameParent: isSelectionWithinSameParent
	};	
})();

var Marker = (function() {
	var createMarkerWithIdentifier = function(identifier, type) {
		var element = document.createElement('span');
		element.setAttribute('data-identifier', type + "_" + identifier);
		return element;
	};

	var wrapRangeWithMarker = function(element, startOffset, endOffset, marker) {
		var newRange = document.createRange();
		newRange.setStart(element, startOffset);
		newRange.setEnd(element, endOffset);
		newRange.surroundContents(marker);
	};

	var setStartMarkerAt = function(identifier, element, startOffset, endOffset) {
		wrapRangeWithMarker(element, startOffset, endOffset, createMarkerWithIdentifier(identifier, "start"));
	};

	var setEndMarkerAt = function(identifier, element, startOffset, endOffset) {
		wrapRangeWithMarker(element, startOffset, endOffset, createMarkerWithIdentifier(identifier, "end"));
	};

	var sanitize = function(content, identifier) {
		var regex = new RegExp("(<span[^>]+data-highlight-id\\s*=\\s*(\"|')" + identifier + "\\2[^>]*>)(\\s*)(</span>)", 'g');
		return content.replace(regex, '');
	};	
	
	return {
		setStartMarkerAt: setStartMarkerAt,
		setEndMarkerAt: setEndMarkerAt,
		sanitize: sanitize
	};
})();

var Finder = (function() {
	var filter = function(node) {
		if (node.getAttribute("data-highlight-id") === null && node.getAttribute("data-identifier") == null) return NodeFilter.FILTER_ACCEPT;
		return NodeFilter.FILTER_SKIP;
	};

	var findNodePosition = function(data) {
		var node, index = 0;
		var nodes = document.createNodeIterator(data.content.querySelector(data.relativeTo), NodeFilter.SHOW_ELEMENT, filter, false);
		while ((node = nodes.nextNode()) != null) {
			index++;
			if (node == data.nodeToFind) break;
		}
		return index;
	};

	var findNodeByPosition = function(data) {
		var index = 0;
		var relativeTo = document.querySelector(data.relativeTo);
		var nodes = document.createNodeIterator((relativeTo) ? relativeTo : data.content, NodeFilter.SHOW_ELEMENT, filter, false);
		while ((node = nodes.nextNode()) != null) {
			index++;
			if (index == data.nodePosition) return node;
		}
	};	
	
	var findNonHighlightAncestor = function(commonAncestor) {
		while (commonAncestor.nodeName === "#text" || commonAncestor.getAttribute("data-highlight-id")) {
			commonAncestor = commonAncestor.parentElement;
		}
		return commonAncestor;
	};
	
	return {
		findNodePosition: findNodePosition,
		findNodeByPosition: findNodeByPosition,
		findNonHighlightAncestor: findNonHighlightAncestor
	};
})();

var HiliterCls = function(rangey, marker, nodeFinder) {

	var highlightTagWithId = function(id, className) {
		return "<span data-highlight-id=\"" + id + "\" class=\"" + className + "\">";
	};
  
  var getExistingHighlight = function(content, markerId){
    if(!content || !content.innerHTML) return;
    var node;
		var nodes = document.createNodeIterator(content, NodeFilter.SHOW_ELEMENT, null, false);

    function moveToStartNode(nodes){
      var node;
      while((node = nodes.nextNode()) !== null) {
        if(node.getAttribute("data-identifier")==="start_" + markerId){
          break;
        }
      }
    }

    moveToStartNode(nodes);

    while ((node = nodes.nextNode()) !== null) {
      var highlightAttributeId = node.getAttribute("data-highlight-id");
      if(highlightAttributeId){
        return highlightAttributeId;
      }
      if(node.getAttribute("data-identifier")==="end_" + markerId){
        return;
      }
    }
    return;
  }

	var addHighlight = function(content, highlight) {
    var nodeContent = content.innerHTML;
    existingHighlightId = getExistingHighlight(content, highlight.guid);
    
    nodeContent = removeHighlight(content, existingHighlightId);

    highlight.guid = existingHighlightId|| highlight.guid;
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
	};

	var wrapSelection = function(range, identifier) {
		marker.setStartMarkerAt(identifier, range.startContainer, range.startOffset, range.startOffset);
		marker.setEndMarkerAt(identifier, range.endContainer, range.endOffset, range.endOffset);
	};

	var removeHighlight = function(content, identifier) {
	    var regex = new RegExp("(<span[^>]+data-highlight-id\\s*=\\s*(\"|')" + identifier + "\\2[^>]*>)(.*?)(</span>)",'g');
	    var strippedContent = content.innerHTML;
	    while(true) {
        var temp = strippedContent.replace(regex, "$3");
        if(strippedContent === temp) 
            break;
        strippedContent = temp;
	    }
		content.innerHTML = strippedContent;
		return strippedContent;
	};

	
	var getSelectedHighlight = function() {
		var range = window.getSelection()
			.getRangeAt(0);
		var parent = range.startContainer.parentElement;
		return parent.getAttribute("data-highlight-id");
	};
	
	var highlight = function(containerSelector, className, highlightId) {
    var range = window.getSelection()
			.getRangeAt(0);
		var highlightId = (highlightId) ? highlightId : (new Date()
			.getTime());
		wrapSelection(range, highlightId); 
		var commonAncestor = nodeFinder.findNonHighlightAncestor(range.commonAncestorContainer);
		var offset = rangey.offsetFromContainer(commonAncestor.innerHTML, highlightId);
		if(offset.startOffset === offset.endOffset) 
			return null;
		var highlightData = {
			guid: highlightId,
			commonAncestorPosition: nodeFinder.findNodePosition({
				nodeToFind: commonAncestor,
				content: document,
				relativeTo: containerSelector,
				highlightClass: className
			}),
			startOffset: offset.startOffset,
			endOffset: offset.endOffset,
			highlightClass: className
		};
		addHighlight(commonAncestor, highlightData);

		return highlightData;
	};

	var loadHighlights = function(containerSelector, highlights) {
		for (var i = 0; i < highlights.length; i++) {
			var commonAncestor = nodeFinder.findNodeByPosition({
				nodePosition: highlights[i].commonAncestorPosition,
				content: document.body,
				relativeTo: containerSelector,
				highlightClass: highlights[i].highlightClass
			});
			addHighlight(commonAncestor, highlights[i]);
		}
	};

	return {
		loadHighlights: loadHighlights,
		highlight: highlight,
    getExistingHighlight:getExistingHighlight,
		addHighlight: addHighlight,
		highlightTagWithId: highlightTagWithId,
		removeHighlight: removeHighlight,

		getSelectedHighlight: getSelectedHighlight
	};
};

var Hiliter = new HiliterCls(Rangey, Marker, Finder);


