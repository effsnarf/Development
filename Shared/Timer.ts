interface Item {
  dt: number;
  value: number;
}

class IntervalCounter {
  private _sum: number = 0;
  private items: Item[] = [];

  constructor(private readonly timeSpan: number) {}

  track(value: number) {
    const dt = Date.now();

    this.items.push({ dt, value });
    this._sum += value;

    while (this.items.length && this.items[0].dt < dt - this.timeSpan) {
      const oldItem = this.items.shift();
      if (!oldItem) throw new Error("This shouldn't happen");
      this._sum -= oldItem.value;
    }
  }

  get count() {
    return this.items.length;
  }

  get sum() {
    return this._sum;
  }

  get average() {
    return Math.round(this._sum / this.count);
  }
}

class Timer {
  private isRunning: boolean = false;
  private started: number | null = null;
  private _data: any;
  private onDone: (data: any) => void;
  private logs: Map<string, Number[]> = new Map();

  private constructor(data: any, onDone: (data: any) => any) {
    this._data = data;
    this.onDone = onDone;
  }

  static new(data: any = null, onDone: (data: any) => any = () => {}) {
    return new Timer(data, onDone);
  }

  static measure(action: () => any) {
    return Timer.new().measure({}, action);
  }

  static start() {
    const timer = Timer.new();
    timer.start();
    return timer;
  }

  log(key: string, value?: number) {
    if (!value && !this.isRunning)
      throw new Error("Timer must be running to log");
    if (!value) value = this.elapsed || 0;
    if (!this.logs.has(key)) this.logs.set(key, []);
    const log = this.logs.get(key);
    log?.push(value);
    return this;
  }

  getLogs() {
    return [...this.logs.entries()].map((e) => {
      return { key: e[0], average: e[1].average() };
    });
  }

  async measure(data: any, action: () => any) {
    data = { ...this._data, ...data };

    this.start();

    try {
      return await action();
    } catch (ex) {
      data.ex = ex;
    } finally {
      const ended = Date.now();
      this.stop();
      data.elapsed = this.elapsed;
      this.onDone(data);
    }
  }

  start() {
    this.started = Date.now();
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
  }

  restart() {
    this.stop();
    this.start();
  }

  getAvrages() {
    return [...this.logs.entries()]
      .map((e) => {
        return { key: e[0], average: e[1].average() };
      })
      .sortByDesc((e) => e.average);
  }

  get elapsed() {
    if (!this.started) return null;
    return Date.now() - this.started;
  }
}

export { Timer, IntervalCounter };
