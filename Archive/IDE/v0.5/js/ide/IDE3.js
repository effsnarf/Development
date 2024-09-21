let IDE3 = function() {
    this.pages = [];

    this.actions = {
        add: {
            page: () => {
                this.pages.push(null);
            }
        }
    }
}



var myExports = IDE3;

if (typeof exports !== "undefined") {
  if (typeof module !== "undefined" && module.exports) {
    exports = module.exports = myExports;
  }
}

if (typeof window != `undefined`) {
  window.IDE3 = IDE3;
}

