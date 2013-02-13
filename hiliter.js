var Hiliter = (function () {
var getNonHighlightAncestorContainer = function(range, highlightClass) {
	var commonAncestor = range.commonAncestorContainer;
	while(commonAncestor.nodeName === "#text" || commonAncestor.className === highlightClass) {
		commonAncestor = commonAncestor.parentElement;
	}
	return commonAncestor;
};

var createWrapperWithIdentifier = function(identifier, type) {
    var element = document.createElement('span');
    element.setAttribute('data-identifier', type + "_" + identifier);
    return element;
};

var wrapElementFromOffset = function(data) {
    var newRange = document.createRange();
    newRange.setStart(data.element, data.startOffset);
    newRange.setEnd(data.element, data.endOffset);
    newRange.surroundContents(data.wrapper);
};

var calculateOffsetTill = function(container, endIndex) {
    var insideTag = false;
    var index = 1;
    for(var i=0; i<=endIndex; i++) {
	if(container[i] === '<') {
	        insideTag = true;
	    }
	index += (insideTag) ? 0 : 1;  
	if(container[i] === '>') {
	        insideTag = false;
	    }
    }
    return index;
};

var offsetFromContainer = function(content, instance) {
    var startOffset = content.indexOf("<span data-identifier=\"start_" + instance + "\"")
    var endOffset = content.indexOf("<span data-identifier=\"end_" + instance + "\"")
    endOffset = content.indexOf("</span>", endOffset);
    return {
	startOffset: calculateOffsetTill(content, startOffset),
	endOffset: calculateOffsetTill(content, endOffset)
    };
};

var convertTextOffsetToDocumentOffset = function(content, offset) {
    var insideTag = false;
    var index = 0, i = 0;
    for(i=0; i< content.length && (index != offset); i++) {
	if(content[i] === '<') {
	   insideTag = true;
	}
	index += (insideTag) ? 0 : 1;  	
	if(content[i] === '>') {
	   insideTag = false;
	}
    }
    return i;
};

var sanitize = function(content, className) {
	var regex = new RegExp("(<span[^>]+class\\s*=\\s*(\"|')" + className + "\\2[^>]*>)(\\s*)(</span>)",'g');
	//var regexp = new RegExp("<span class=\"" + className + "\"\\s*>\\s*</span>", 'g');
	return content.replace(regex, '');
};

var highlightTagWithClass = function(className) {
	return "<span class=\"" + className + "\">";
};

var addHighlight = function(content, highlight) {
    var nodeContent = content.innerHTML;
    var startOffset = convertTextOffsetToDocumentOffset(nodeContent, highlight.startOffset);
    var endOffset = convertTextOffsetToDocumentOffset(nodeContent, highlight.endOffset - 1);
    var htmlElement = nodeContent.substring(0, startOffset - 1) + highlightTagWithClass(highlight.highlightClass);
    for(var i = startOffset - 1; i < endOffset; i++) {
	    htmlElement += nodeContent[i];
	    if(nodeContent[i] === '<')
	        htmlElement += "/span><";
	    if(nodeContent[i] === '>')
	        htmlElement += highlightTagWithClass(highlight.highlightClass);
    }
    htmlElement += "</span>";
    content.innerHTML = htmlElement + nodeContent.substring(endOffset);
};

var findNodePosition = function(data) {
	var filter = function(node) {	    
		if (node.className.search(data.highlightClass) === -1 && node.getAttribute("data-identifier") == null) return NodeFilter.FILTER_ACCEPT;
		return NodeFilter.FILTER_SKIP;
	};
	var node, index = 0;
	var nodes = document.createNodeIterator(data.content.querySelector(data.relativeTo), NodeFilter.SHOW_ELEMENT, filter, false);	
	while((node = nodes.nextNode()) != null) {
	    index ++;
		if(node == data.nodeToFind) break;
	}
	return index;
};

var findNodeByPosition = function(data){
	var filter = function(node) {	    
		if (node.className.search(data.highlightClass) === -1 && node.getAttribute("data-identifier") == null) return NodeFilter.FILTER_ACCEPT;
		return NodeFilter.FILTER_SKIP;
	};
	var index = 0;
	var relativeTo = document.querySelector(data.relativeTo);
	var nodes = document.createNodeIterator((relativeTo)?relativeTo:data.content, NodeFilter.SHOW_ELEMENT, filter, false);
	while((node = nodes.nextNode())!= null){
		index++;
		if(index == data.nodePosition)
		return node;
	}		
};

var wrapSelectionWithDifferentParents = function(range, instanceId) {
	wrapElementFromOffset({
		element: range.startContainer, 
		startOffset: range.startOffset, 
		endOffset: range.startContainer.length,
		wrapper: createWrapperWithIdentifier(instanceId, "start")
	});
	wrapElementFromOffset({
		element: range.endContainer, 
		startOffset: 0, 
		endOffset: range.endOffset,
		wrapper: createWrapperWithIdentifier(instanceId, "end")
	});	
};

var wrapSelectionWithSameParent = function(range, instanceId) {
	wrapElementFromOffset({
		element: range.startContainer, 
		startOffset: range.startOffset, 
		endOffset: range.startOffset,
		wrapper: createWrapperWithIdentifier(instanceId, "start")
	});
	wrapElementFromOffset({
		element: range.endContainer, 
		startOffset: range.endOffset, 
		endOffset: range.endOffset,
		wrapper: createWrapperWithIdentifier(instanceId, "end")
	});		
};

var isSelectionWithinSameParent = function(range) {
	return range.startContainer == range.endContainer;
};

var highlight = function (containerSelector, className) {
    var range = window.getSelection().getRangeAt(0);
    var timeStamp = new Date().getTime();
	isSelectionWithinSameParent(range) ? wrapSelectionWithSameParent(range, timeStamp) : wrapSelectionWithDifferentParents(range, timeStamp);		
    var commonAncestor = getNonHighlightAncestorContainer(range, className);
    var offset = offsetFromContainer(commonAncestor.innerHTML, timeStamp);
	var highlightData = {
		commonAncestorPosition: findNodePosition({
			nodeToFind: commonAncestor,
			content: document,
			relativeTo: containerSelector,
			highlightClass: className}),
		startOffset: offset.startOffset,
		endOffset: offset.endOffset,
		highlightClass: className
	};
	addHighlight(commonAncestor, highlightData);
	return highlightData;
};

var loadHighlights = function(containerSelector, highlights) {
	for(var i = 0;i<highlights.length;i++) {
		var commonAncestor = findNodeByPosition({
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
		findNodeByPosition: findNodeByPosition,
		findNodePosition: findNodePosition,
		addHighlight: addHighlight,
		offsetFromContainer: offsetFromContainer,
		convertTextOffsetToDocumentOffset: convertTextOffsetToDocumentOffset,
		sanitize: sanitize
	};
})();