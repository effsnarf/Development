import { Queue } from "../../../Shared/Queue";
import { ClientContext } from "./ClientContext";

interface DataItem {
  id: number;
  getVue: () => any;
  compName: string;
  key: string;
  newValue: any;
  oldValue: any;
}

class StateTracker {
  private id: number = 1;
  private maxItems: number = 100;
  private queue: Queue = Queue.new(this.processQueue.bind(this), 10);

  items: DataItem[];

  constructor(private client: ClientContext) {
    this.items = client.Vue.observable([]);
  }

  log(
    getVue: () => any,
    compName: string,
    key: string,
    newValue: any,
    oldValue: any
  ) {
    if (compName.startsWith("ide-")) return;
    this.queue.add(() =>
      this.items.push({
        id: this.id++,
        getVue,
        compName,
        key,
        newValue,
        oldValue,
      })
    );
  }

  clear() {
    this.queue.add(() => this.items.splice(0, this.items.length));
  }

  private async processQueue(queueItems: any[]) {
    for (const queueItem of queueItems) {
      await queueItem();
    }
  }
}

export { StateTracker };
