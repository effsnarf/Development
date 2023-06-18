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
  private isRunning: boolean = false;
  private checkInterval: number = 1000;
  private dataComparer: DefaultDataComparer = new DefaultDataComparer();
  private data: any;

  constructor(
    private getData: () => any,
    private onChange: (newData: any, oldData: any) => Promise<void>
  ) {
    this.data = this.dataComparer.clone(getData());

    this.start();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.check();
  }

  stop() {
    this.isRunning = false;
  }

  private async check() {
    if (!this.isRunning) return;
    const newData = this.getData();
    if (!this.dataComparer.areEqual(this.data, newData)) {
      await this.onChange(newData, this.data);
      this.data = newData;
    }
    setTimeout(this.check, this.checkInterval);
  }
}

export { DataWatcher };
