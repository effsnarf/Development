import * as colors from "colors";

class Loading {
  private isRunning: boolean = false;
  private startTime: number | null = null;

  constructor(private info?: string) {}

  static startNew(info?: string): Loading {
    const loading = new Loading(info);
    loading.start(info);
    return loading;
  }

  start(info?: string): void {
    this.startTime = Date.now();
    this.isRunning = true;
    this.showInfo();
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.startTime = null;
    process.stdout.write("\r");
    process.stdout.clearLine(0);
  }

  private showInfo() {
    if (!this.isRunning) return;
    const elapsedTime = Date.now() - this.startTime!;
    process.stdout.write(`\r`);
    process.stdout.write(`${elapsedTime.unitifyTime()} ${this.info || ""}`);
    if (this.isRunning) {
      setTimeout(this.showInfo.bind(this), 100);
    }
  }
}

export { Loading };
