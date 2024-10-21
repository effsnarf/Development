// Passing events between components

interface EventsOptions {
  sync?: boolean;
}

class Events {
  private _listeners: { [key: string]: Function[] } = {};

  private promiseQueue: any[] = [];

  constructor(private _options: EventsOptions = {}) {}

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
    if (!this._listeners[name]) {
      this._listeners[name] = [];
    }
    this._listeners[name].push(callback);
  }

  private removeListener(name: string, callback: Function) {
    if (!this._listeners[name]) {
      return;
    }
    this._listeners[name] = this._listeners[name].filter(
      (listener) => listener !== callback
    );
  }

  async emit(name: string, ...args: any[]) {
    if (this._listeners["*"]) {
      for (const callback of this._listeners["*"]) {
        await this._call(callback, name, ...args);
      }
    }

    if (this._listeners[name]) {
      for (const callback of this._listeners[name]) {
        await this._call(callback, ...args);
      }
    }
  }

  private async _call(callback: Function, ...args: any[]) {
    if (this._options.sync) {
      const executingPromise = this.promiseQueue.pop();
      if (executingPromise) await executingPromise;
      this.promiseQueue.push(callback(...args));
    } else {
      setTimeout(async () => await callback(...args), 0);
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
