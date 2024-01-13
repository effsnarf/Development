const repeat = async (func, delay) => {
    await func();
    setTimeout(() => repeat(func, delay), delay);
}

const sheakspearizeElements = async (elements) => {
    for (const element of elements) {
        if (element.originalHTML) continue;
        const sheakspearizedHTML = await sheakspearize(element.innerHTML);
        element.originalHTML = element.innerHTML;
        element.innerHTML = sheakspearizedHTML;
    }
}


const sheakspearizePosts = async () => {
    const posts = [...document.getElementsByTagName("blockquote")];
    await sheakspearizeElements(posts);
}


repeat(sheakspearizePosts, 1000);
