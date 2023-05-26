import { Lock } from "./Lock";

class ProducerConsumer {
  private queue: any[] = [];
  private lock = new Lock();

  constructor(
    initialQueueSize: number,
    private getMoreItems: (count: number) => Promise<any[]>
  ) {
    this.ensureEnoughItems(initialQueueSize);
  }

  async get(count: number): Promise<any[]> {
    // If we have enough items in the queue
    if (count <= this.queue.length) {
      //console.log(`Returning ${count} existing items from queue.`.gray);
      // Get the first available items
      const items = this.queue.splice(0, count);
      // Replenish asychronously
      this.ensureEnoughItems(count * 2);
      return items;
    }
    // If we don't have enough items in the queue
    // Replenish synchronously
    await this.ensureEnoughItems(count);
    //console.log(`Returning ${count} items from queue.`.gray);
    return this.queue.splice(0, count);
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
