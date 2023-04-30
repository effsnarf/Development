// Passing events between components

class Events {
  private listeners: { [key: string]: Function[] } = {};

  on(name: string, callback: Function) {
    if (!this.listeners[name]) {
      this.listeners[name] = [];
    }
    this.listeners[name].push(callback);
  }

  emit(name: string, ...args: any[]) {
    if (this.listeners[name]) {
      this.listeners[name].forEach((callback) => {
        callback(...args);
      });
    }
  }
}

export { Events };
