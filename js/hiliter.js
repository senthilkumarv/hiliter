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
    element.setAttribute('style', 'background-color: blue;');
    return element;
};

var wrapElementFromOffset = function(data) {
    var newRange = document.createRange();
    newRange.setStart(data.element, data.startOffset);
    newRange.setEnd(data.element, data.endOffset);
    newRange.surroundContents(data.wrapper);
};

var stripHighlightsFromDocument = function(doc, highlightClass) {
    var regex = new RegExp("(<span[^>]+class\\s*=\\s*(\"|')" + highlightClass + "\\2[^>]*>)(.*?)(</span>)",'g');
    var strippedContent = doc;
    while(true) {
		var temp = strippedContent.replace(regex, "$3");
		if(strippedContent === temp) 
		    break;
		strippedContent = temp;
    }
    return strippedContent;
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

var highlightTag = "<span class=\"highlight\">";

var addHighlight = function(content, highlight) {
    var insideTag = false;
    var startOffset = convertTextOffsetToDocumentOffset(content, highlight.startOffset);
    var endOffset = convertTextOffsetToDocumentOffset(content, highlight.endOffset);
    var htmlElement = content.substring(0, startOffset - 1) + "<span class=\"highlight\">";
    for(var i = startOffset - 1; i < endOffset; i++) {
	htmlElement += content[i];
	if(content[i] === '<')
	    htmlElement += "/span><";
	if(content[i] === '>')
	    htmlElement += highlightTag;
    }
    htmlElement += "</span>";
    return htmlElement + content.substring(endOffset);
};

var getPathTo = function(element, root) {
    if (element.id!=='')
        return 'id("'+element.id+'")';
    if (element===document.body)
        return element.tagName;

    var ix= 0;
    var siblings= element.parentNode.childNodes;
    for (var i= 0; i<siblings.length; i++) {
        var sibling= siblings[i];
        if (sibling===element)
            return getPathTo(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']';
        if (sibling.nodeType===1 && sibling.tagName===element.tagName)
            ix++;
    }
}

var highlight = function () {
    var range = window.getSelection().getRangeAt(0);
    var timeStamp = new Date().getTime();
    if(range.startContainer != range.endContainer) {
	wrapElementFromOffset(
	    {
		element: range.startContainer, 
		startOffset: range.startOffset, 
		endOffset: range.startContainer.length,
		wrapper: createWrapperWithIdentifier(timeStamp, "start")
	    });
	wrapElementFromOffset(
	    {
		element: range.endContainer, 
		startOffset: 0, 
		endOffset: range.endOffset,
		wrapper: createWrapperWithIdentifier(timeStamp, "end")
	    });
    }
    else {
	wrapElementFromOffset(
	    {
		element: range.startContainer, 
		startOffset: range.startOffset, 
		endOffset: range.startOffset,
		wrapper: createWrapperWithIdentifier(timeStamp, "start")
	    });
	wrapElementFromOffset(
	    {
		element: range.endContainer, 
		startOffset: range.endOffset, 
		endOffset: range.endOffset,
		wrapper: createWrapperWithIdentifier(timeStamp, "end")
	    });	
    }
    var commonAncestor = getNonHighlightAncestorContainer(range, 'highlighted');
    var offset = offsetFromContainer(commonAncestor.innerHTML, timeStamp);
    commonAncestor.innerHTML = addHighlight(commonAncestor.innerHTML, offset);
};
