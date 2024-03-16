async function constantly(callback) {
    await callback();
    requestAnimationFrame(() => constantly(callback));
}

function getFields(obj, fields) {
    let result = {};
    fields.forEach(field => {
        if (obj.hasOwnProperty(field)) {
            result[field] = obj[field];
        }
    });
    return result;
}

function whenMouseMove(callback) {
    let lastX = null;
    let lastY = null;

    function onMouseMove(event) {
        if (lastX !== null && lastY !== null) {
            const deltaX = event.clientX - lastX;
            const deltaY = event.clientY - lastY;
            const pos = { x: event.clientX, y: event.clientY };
            const delta = { x: deltaX, y: deltaY };
            callback(pos, delta);
        }
        lastX = event.clientX;
        lastY = event.clientY;
    }

    document.addEventListener('mousemove', onMouseMove);

    // Function to stop tracking the mouse movement
    return {
        disconnect: () => document.removeEventListener('mousemove', onMouseMove)
    };
}

/**
 * Observes style changes of an element matching a selector in the DOM and calls a callback when such a change occurs.
 * @returns {Function} - Function to call to disconnect the observer.
 */
function whenElementStyleChanges(selector, onStyleChange) {
    const element = document.querySelector(selector);

    if (!element) {
        console.warn('Element not found for the provided selector:', selector);
        return;
    }

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                onStyleChange(element);
            }
        });
    });

    observer.observe(element, { attributes: true, attributeFilter: ['style'] });
    
    return observer;
}

/**
 * Observes the addition of elements matching a selector to the DOM and calls a callback when such an event occurs.
 * @returns {Function} - Function to call to disconnect the observer.
 */
function whenElementIsAdded(selector, onAdd, parent = document.body, observeSubtree = true) {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if ((node.matches && node.matches(selector)) || (node.querySelector && node.querySelector(selector))) {
                        onAdd(node);
                    }
                });
            }
        });
    });

    observer.observe(parent, { childList: true, subtree: observeSubtree });
    return observer;
}

// Helper function to observe only direct children of a parent
function whenDirectChildIsAdded(selector, onAdd, parent = document.body) {
    return whenElementIsAdded(selector, onAdd, parent, false);
}

/**
 * Observes the removal of elements matching a selector from the DOM and calls a callback when such an event occurs.
 * @returns {Function} - Function to call to disconnect the observer.
 */
function whenElementIsRemoved(selector, onRemove, parent = document.body, observeSubtree = true) {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.removedNodes.forEach(node => {
                    if ((node.matches && node.matches(selector)) || (node.querySelector && node.querySelector(selector))) {
                        onRemove(node);
                    }
                });
            }
        });
    });

    observer.observe(parent, { childList: true, subtree: observeSubtree });
    return observer;
}

// Helper function to observe only direct children of a parent
function whenDirectChildIsRemoved(selector, onRemove, parent = document.body) {
    return whenElementIsRemoved(selector, onRemove, parent, false);
}

