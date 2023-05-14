class Queue {
  private items: any[] = [];

  private constructor(
    private readonly callback: (items: any[]) => Promise<void>,
    private readonly interval: number
  ) {}

  static new(
    callback: (items: any[]) => Promise<void>,
    interval: number = 1000
  ): Queue {
    const queue = new Queue(callback, interval);
    queue.start();
    return queue;
  }

  start() {
    this.process();
  }

  private async process() {
    if (this.items.length) await this.flush();
    setTimeout(this.process.bind(this), this.interval);
  }

  add(item: any) {
    this.items.push(item);
  }

  async flush() {
    const items = this.items;
    this.items = [];
    await this.callback(items);
  }
}

export { Queue };
