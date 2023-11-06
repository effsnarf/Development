// Enqueue async tasks and run them in order
class TaskQueue {
  private tasks: Array<Function> = [];

  get count() {
    return this.tasks.length;
  }

  constructor() {
    this.next();
    this.notify();
  }

  private notify() {
    if (this.count > 100) {
      console.warn(`${this.count} tasks in queue.`);
    }
    setTimeout(this.notify.bind(this), 5000);
  }

  public enqueue(task: Function) {
    this.tasks.push(task);
    return task;
  }

  private async next() {
    const started = performance.now();
    let elapsed = 0;
    while (elapsed < 50) {
      const task = this.tasks.shift();
      if (!task) break;
      await task();
      elapsed = performance.now() - started;
    }
    const delay = this.tasks.length ? 1 : 100;
    setTimeout(this.next.bind(this), delay);
  }
}

export { TaskQueue };
