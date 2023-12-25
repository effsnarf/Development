let ihoverStyle = null;
let styleObserver = null;

function positionHoverUI(node) {
    const isImage = (node.tagName == "IMG");
    if (!isImage) return;
    node.style.position = "fixed";
    node.style["max-width"] = '48vw';
    // set top to center vertically on the screen
    const top = (window.innerHeight - node.clientHeight) / 2;
    node.style.top = `${top}px`;
    node.style.right = `1vw`;
    node.style.left = ``;
}

whenMouseMove((pos, delta) => {
    const nodes1 = document.querySelectorAll(".hoverUI-removing");
    const nodes2 = document.querySelectorAll("#ihover");
    const nodes = [...nodes1, ...nodes2];
    for (let node of nodes) {
        let left = parseInt(node.style.left);
        let top = parseInt(node.style.top);
        left += delta.x;
        top += delta.y;
        //node.style.left = `${left}px`;
        //node.style.top = `${top}px`;
        positionHoverUI(node);
    }
});

const onElementAdded = addedNode => {
    addedNode.remove();
    return;
    // on img.load, add .fade-in class to #ihover
    const isImage = (addedNode.tagName == "IMG");
    if (!isImage) return;
    const img = !isImage ? null : addedNode;
    // add loader
    const loader = document.createElement("div");
    loader.classList.add("loader");
    loader.classList.add("slide-in");
    addedNode.appendChild(loader);
    
    if (!isImage) addedNode.classList.add("fade-in");

    img?.addEventListener("load", () => {
        // remove loader
        loader.classList.add("slide-out");
        setTimeout(() => {
            loader.remove();
        }, 1000);
        addedNode.classList.add("fade-in");
    });
    const onStyleChange = (node) => {
        if (!node.style.left) return;
        ihoverStyle = getFields(node.style, ["left", "top", "max-width", "max-height"]);
    }
    styleObserver = whenElementStyleChanges("#ihover", (node) => {
        onStyleChange(node);
    });
    onStyleChange(addedNode);
    constantly(() => positionHoverUI(addedNode));
};

const onElementRemoved = removedNode => {
    if (!styleObserver) return;
    styleObserver.disconnect();
    const hoverUI = document.getElementById("hoverUI");
    const newNode = removedNode.cloneNode(true);
    newNode.classList.remove("fade-in");
    const fadeOutDuration = 1000;
    newNode.id = `a${Date.now()}`;
    newNode.classList.add("hoverUI-removing");
    newNode.style.position = "fixed";
    Object.assign(newNode.style, ihoverStyle);
    newNode.style.opacity = 1;
    newNode.style.transition = `opacity ${fadeOutDuration}ms`;
    hoverUI.appendChild(newNode);
    setTimeout(() => {
        // add .fade-out class to newNode
        newNode.classList.add("fade-out");
        setTimeout(() => {
            newNode.remove();
        }, fadeOutDuration);
    }, 1);
};

for (let selector of ["#ihover"]) {
    whenElementIsAdded(selector, addedNode => {
        onElementAdded(addedNode);
    });
}

for (let selector of ["#ihover"]) {
    whenElementIsRemoved(selector, removedNode => {
        onElementRemoved(removedNode);
    });
}