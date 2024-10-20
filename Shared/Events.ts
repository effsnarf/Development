// Passing events between components

interface EventsOptions {
  sync?: boolean;
}

class Events {
  private _listeners: { [key: string]: Function[] } = {};

  private _callbackQueue = [] as Function[];

  constructor(private _options: EventsOptions = {}) {
    if (this._options.sync) this._processCallbackQueue();
  }

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
        this._call(callback, name, ...args);
      }
    }

    if (this._listeners[name]) {
      for (const callback of this._listeners[name]) {
        this._call(callback, ...args);
      }
    }
  }

  private _call(callback: Function, ...args: any[]) {
    if (this._options.sync) {
      this._callbackQueue.push(async () => await callback(...args));
    } else {
      setTimeout(async () => await callback(...args), 0);
    }
  }

  private async _processCallbackQueue() {
    const callback = this._callbackQueue.shift();
    await callback?.();
    setTimeout(() => this._processCallbackQueue(), !callback ? 100 : 0);
  }
}

class Channel {
  constructor(
    public out: Events,
    public inc: Events
  ) {}
}

export { Events, Channel };
