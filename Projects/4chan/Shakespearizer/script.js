const repeat = async (func, delay) => {
    await func();
    setTimeout(() => repeat(func, delay), delay);
}

// Generic function to traverse each node in the DOM tree
const traverseNode = async (node, callback) => {
    // Call the callback function for the current node
    await callback(node);

    // Recursively traverse child nodes if present
    if (node.childNodes) {
        for (const child of node.childNodes) {
            await traverseNode(child, callback);
        }
    }
};

const getNodeAncestors = (node) => {
    const ancestors = [];
    let current = node.parentNode;
    while (current) {
        ancestors.push(current);
        current = current.parentNode;
    }
    return ancestors;
}

// Function to determine if a text node should be skipped
const shouldSkipTextNode = (textNode) => {
    if (textNode.unshakespearized) return true;
    if (textNode.parentNode.unshakespearized) return true;
    // If one of the ancestors is id=hoverUI, skip
    const ancestors = getNodeAncestors(textNode);
    if (ancestors.some(node => node.id === "hoverUI")) return true;
    const text = textNode.textContent;
    const skipPatterns = [/^>>\d+$/, /^\s\(You\)$/, /^\s\(OP\)$/];
    return skipPatterns.some(pattern => pattern.test(text));
};


const wrapTextNodeWithTooltip = (textNode, originalText) => {
    const span = document.createElement('span');
    span.title = originalText; // Set the tooltip
    span.textContent = textNode.textContent;
    textNode.parentNode.replaceChild(span, textNode);
    return span;
};



const shakespearizeElement = async (element) => {
    await traverseNode(element, async (node) => {
        if (node.nodeType !== Node.TEXT_NODE) return;
        if (shouldSkipTextNode(node)) return;
        //console.log(node.textContent);
        const text = node.textContent;
        node.unshakespearized = text;
        node.textContent = await shakespearizer.shakespearize(text);
        const textWrapNode = wrapTextNodeWithTooltip(node, text);
        textWrapNode.unshakespearized = text;
    });
}

const sheakspearizeElements = async (elements) => {
    for (const element of elements) {
         shakespearizeElement(element);
    }
}


const sheakspearizePosts = async () => {
    const posts = [...document.getElementsByTagName("blockquote")];
    await sheakspearizeElements(posts);
}


repeat(sheakspearizePosts, 1000);
