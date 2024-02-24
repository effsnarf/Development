Array.prototype.last = function() {
    return this[this.length - 1];
};

var toFullUrl = (url) => {
    if (url.startsWith("/")) return `${window.location.origin}${url}`;
    if (url.startsWith("./")) return `${window.location.origin}${url.slice(1)}`;
    return url;
}

var findEl = (el, cls) => {
    if (typeof cls == "function") return 
    if (typeof cls == "string") return el.getElementsByClassName(cls)[0];
    throw new Exception("Not implemented");
};

var getElProp = (el, prop, attr) => {
    if (!prop && attr?.length) {
        if (attr == "href") {
            const aEl = el.getElementsByTagName("a")[0];
            if (aEl) return toFullUrl(aEl.getAttribute("href"));
            return "";
        }
        if (attr == "src") {
            const imgEl = el.getElementsByTagName("img")[0];
            if (imgEl) return toFullUrl(imgEl.getAttribute("src"));
            return "";
        }
    }
	var el = findEl(el, prop);
    if (!el) return "";
	if (el.tagName == "IMG") {
        let src = el.getAttribute("src");
        if (src) return toFullUrl(src);
        return "";
    }
    if (attr) return toFullUrl(el.getAttribute(attr));
    if (el.innerText?.length) return el.innerText;
    const imgEl = el.getElementsByTagName("img")[0];
    if (imgEl) return toFullUrl(imgEl.getAttribute("src"));
    return "";
};

var getFromEl = (el, prop, attr) => {
	return getElProp(el, prop, attr);
};




var articles = [...document.getElementsByClassName("slotView")]
	.map(el => ({
		title: getFromEl(el, "slotTitle"),
        subtitle: getFromEl(el, "slotSubTitle"),
        image: getFromEl(el, "imageView"),
        url: getFromEl(el, null, "href"),
	}));




    var articles = [...document.getElementsByTagName("article")]
    .map(el => ({
        title: getFromEl(el, "JtKRv"),
        image: getFromEl(el, "Quavad"),
        url: getFromEl(el, "JtKRv", "href"),
    }));

