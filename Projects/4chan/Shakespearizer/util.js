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
