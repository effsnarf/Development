const shakespearizer = new Shakespearizer();

const checkSettingsChange = async () => {
    const apiKey = (await promisify(chrome.storage.sync, 'get')('apiKey')).apiKey;
    if (apiKey != shakespearizer.apiKey) {
        shakespearizer.apiKey = apiKey;
        shakespearizer.onSettingsChange();
    }
    setTimeout(checkSettingsChange, 100);
}

checkSettingsChange();


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
        if (node.shakespearizing) return;
        node.shakespearizing = true;
        const text = node.textContent;
        try
        {
            const shakespearized = await shakespearizer.shakespearize(text);
            if (shakespearized == text) {
                node.shakespearizing = false;
                return;
            }
            node.unshakespearized = text;
            node.textContent = shakespearized;
            const textWrapNode = wrapTextNodeWithTooltip(node, text);
            textWrapNode.unshakespearized = text;
        }
        catch (ex) {
            node.shakespearizing = false;    
        }
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
