// Passing events between components

class Events {
  private listeners: { [key: string]: Function[] } = {};

  forward(events: Events, prefix: string) {
    events.on("*", (name: string, ...args: any[]) => {
      this.emit(`${prefix}.${name}`, ...args);
    });
  }

  on(names: string | string[], callback: Function) {
    if (typeof names === "string") {
      names = [names];
    }
    for (const name of names) {
      this.addListener(name, callback);
    }
  }

  off(names: string | string[], callback: Function) {
    if (typeof names === "string") {
      names = [names];
    }
    for (const name of names) {
      this.removeListener(name, callback);
    }
  }

  private addListener(name: string, callback: Function) {
    if (!this.listeners[name]) {
      this.listeners[name] = [];
    }
    this.listeners[name].push(callback);
  }

  private removeListener(name: string, callback: Function) {
    if (!this.listeners[name]) {
      return;
    }
    this.listeners[name] = this.listeners[name].filter(
      (listener) => listener !== callback
    );
  }

  emit(name: string, ...args: any[]) {
    if (this.listeners["*"]) {
      this.listeners["*"].forEach((callback) => {
        callback(name, ...args);
      });
    }

    if (this.listeners[name]) {
      this.listeners[name].forEach((callback) => {
        callback(...args);
      });
    }
  }
}

class Channel {
  constructor(
    public out: Events,
    public inc: Events
  ) {}
}

export { Events, Channel };
