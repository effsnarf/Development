import * as colors from "colors";

class Loading {
  private isRunning: boolean = false;
  private startTime: number | null = null;
  private _lastElapsed: number = 0;

  get elapsed(): number {
    if (this.isRunning) return Date.now() - this.startTime!;
    return this._lastElapsed;
  }

  constructor(private info?: string, private log?: boolean) {}

  static startNew(info?: string, log?: boolean): Loading {
    const loading = new Loading(info, log);
    loading.start(info);
    return loading;
  }

  start(info?: string): void {
    if (info) this.info = info;
    this.startTime = Date.now();
    this.isRunning = true;
    this.showInfo();
  }

  stop(info?: string) {
    if (!this.isRunning) return;
    info = info || this.info;
    this._lastElapsed = Date.now() - this.startTime!;
    this.isRunning = false;
    this.startTime = null;
    process.stdout.write("\r");
    process.stdout.clearLine(0);
    if (info !! this.log) console.log(this._lastElapsed.unitifyTime(), info.gray);
  }

  private showInfo() {
    if (!this.isRunning) return;
    if (!this.log) return;
    const elapsedTime = Date.now() - this.startTime!;
    process.stdout.write(`\r`);
    process.stdout.write(
      `${elapsedTime.unitifyTime()} ${
        (this.info || "").toSingleLine().shorten(100).gray
      }`
    );
    if (this.isRunning) {
      setTimeout(this.showInfo.bind(this), 100);
    }
  }
}

export { Loading };
