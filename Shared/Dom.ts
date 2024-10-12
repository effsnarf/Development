// DOM Helper class

class Dom {
  static on = {
    element: {
      removed: (element: HTMLElement, callback: () => void) => {
        const observer = new MutationObserver(() => {
          if (!document.body.contains(element)) {
            observer.disconnect();
            callback();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      },
      changed: (
        element: HTMLElement,
        options: { deep: boolean; immediate: boolean },
        callback: () => void
      ) => {
        if (options.immediate) callback();
        const observer = new MutationObserver(() => {
          callback();
        });
        observer.observe(element, { childList: true, subtree: options.deep });
        // when the element is removed, disconnect the observer
        Dom.on.element.removed(element, () => {
          try {
            observer.disconnect();
          } catch (e) {
            // ignore
          }
        });
      },
    },
  };
}

export { Dom };
