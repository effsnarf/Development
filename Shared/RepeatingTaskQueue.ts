class RepeatingTaskQueue {
  // Meaning the queue will cycle through all tasks every [cycleInterval] milliseconds
  private cycleInterval: number = 1000;
  private tasks: (() => Promise<void>)[] = [];
  private index: number = 0;

  private constructor() {
    this.index = 0;
    this.next();
  }

  static new() {
    const queue = new RepeatingTaskQueue();
    return queue;
  }

  private async next() {
    const task = this.tasks[this.index];
    if (task) await task();
    this.index = (this.index + 1) % this.tasks.length || 0;

    setTimeout(this.next.bind(this), this.cycleInterval / this.tasks.length);
  }

  enqueue(task: () => Promise<void>) {
    this.tasks.push(task);
  }
}

export { RepeatingTaskQueue };
