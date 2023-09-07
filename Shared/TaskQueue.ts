// Enqueue async tasks and run them in order
class TaskQueue {
  private tasks: Array<Function> = [];

  constructor() {
    this.next();
  }

  public enqueue(task: Function) {
    this.tasks.push(task);
    return task;
  }

  private async next() {
    const task = this.tasks.shift();
    if (task) await task();
    const delay = this.tasks.length ? 0 : 100;
    setTimeout(this.next.bind(this), delay);
  }
}

export { TaskQueue };
