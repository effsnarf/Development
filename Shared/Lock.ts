class Lock {
  private queue: ((value: unknown) => void)[] = [];
  private locked: boolean = false;

  constructor() {}

  acquire() {
    return new Promise((resolve) => {
      if (!this.locked) {
        // If no one else has the lock
        // Take the lock immediately
        this.locked = true;
        resolve(null);
      } else {
        // Wait for someone else to release the lock
        this.queue.push(resolve);
        return;
      }
    });
  }

  release() {
    const resolve = this.queue.shift();
    if (resolve) {
      resolve(null);
    } else {
      this.locked = false;
    }
  }
}

export { Lock };
