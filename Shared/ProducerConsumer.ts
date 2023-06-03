import { Lock } from "./Lock";

class ProducerConsumer {
  private queue: any[] = [];
  private lock = new Lock();

  constructor(
    private initialQueueSize: number,
    private getMoreItems: (count: number) => Promise<any[]>
  ) {
    this.ensureEnoughItems(initialQueueSize);
  }

  async get(count: number): Promise<any[]> {
    // If we don't have enough items in the queue
    if (count > this.queue.length) {
      // Replenish synchronously
      await this.ensureEnoughItems(this.initialQueueSize);
    } else {
      // Replenish asychronously
      if (this.queue.length < this.initialQueueSize / 2)
        this.ensureEnoughItems(this.initialQueueSize);
    }
    // Get the first available items
    const items = this.queue.splice(0, count);
    return items;
  }

  private async ensureEnoughItems(count: number): Promise<void> {
    try {
      await this.lock.acquire();
      if (this.queue.length < count) {
        //console.log(`Getting ${count} more items.`.gray);
        const newItems = await this.getMoreItems(count - this.queue.length);
        this.queue.push(...newItems);
      }
    } finally {
      this.lock.release();
    }
  }
}

export { ProducerConsumer };
