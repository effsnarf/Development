import { RepeatingTaskQueue } from "./RepeatingTaskQueue";

class DefaultDataComparer {
  clone(o1: any): any {
    if (o1 == null) return null;
    return JSON.parse(JSON.stringify(o1));
  }

  areEqual(o1: any, o2: any): boolean {
    const result = JSON.stringify(o1) === JSON.stringify(o2);
    return result;
  }
}

class DataWatcher {
  // #region Global
  private static get _queue() {
    return (window as any)._dataWatcherQueue as RepeatingTaskQueue;
  }

  private static set _queue(value) {
    (window as any)._dataWatcherQueue = value;
  }

  static get queue() {
    if (!DataWatcher._queue) {
      DataWatcher._queue = RepeatingTaskQueue.new();
    }
    return DataWatcher._queue;
  }
  // #endregion

  private dataComparer: DefaultDataComparer = new DefaultDataComparer();
  private data: any;

  private constructor(
    private getData: () => any,
    private onChange: (newData: any, oldData: any) => Promise<void>
  ) {
    this.data = this.dataComparer.clone(getData());

    DataWatcher.queue.enqueue(this.check.bind(this));
  }

  static async new(
    getData: () => any,
    onChange: (newData: any, oldData: any) => Promise<void>
  ) {
    const watcher = new DataWatcher(getData, onChange);
    return watcher;
  }

  private async check() {
    const newData = this.dataComparer.clone(this.getData());
    if (!this.dataComparer.areEqual(this.data, newData)) {
      try {
        await this.onChange(newData, this.data);
      } catch (ex) {
        console.error(ex);
      }
      this.data = newData;
    }
  }
}

export { DataWatcher };
