class Progress {
  public processed = 0;
  private percent = 0;
  private progressInterval: number = 1000 / 4;
  private lastReport = 0;
  private showedFirstLine = false;
  private displayProgress = false;

  private constructor(
    public readonly total: number,
    public readonly data: any,
    private readonly onProgress: (percent: number) => void,
    private readonly started = Date.now()
  ) {}

  static newAutoDisplay(total: number, data: any = {}) {
    const progress = new Progress(total, data, (percent) => {});
    progress.displayProgress = true;
    return progress;
  }

  static new(total: number, data: any, onProgress: (percent: number) => void) {
    return new Progress(total, data, onProgress);
  }

  increment() {
    this.processed++;
    this.displayIfNeeded();
  }

  done() {
    this.processed = this.total;
    this.displayProgressBar();
  }

  get isDone() {
    return this.processed >= this.total;
  }

  private displayIfNeeded() {
    if (!this.displayProgress) return;
    if (!this.isTimeForAnotherReport()) return;
    this.displayProgressBar();
  }

  private displayProgressBar() {
    if (!this.displayProgress) return;
    if (this.showedFirstLine) {
      // Go up one line
      process.stdout.write("\x1b[1A");
    }
    this.showedFirstLine = true;
    console.log(this.bar);
  }

  isTimeForAnotherReport() {
    if (this.isDone) return false;
    const now = Date.now();
    if (now - this.lastReport > this.progressInterval) {
      this.lastReport = now;
      return true;
    }
    return false;
  }

  // Between 0 and 1
  get progress() {
    return this.processed / this.total;
  }

  get msLeft() {
    const elapsed = Date.now() - this.started;
    const percent = this.progress;
    return (elapsed / percent) * (1 - percent);
  }

  get bar() {
    const tab = "    ";

    return (
      `${this.processed.toLocaleString().yellow} / ${
        this.total.toLocaleString().green
      }` +
      tab +
      this.progress.toProgressBar() +
      tab +
      `-${this.msLeft.unitifyTime()}`
    );
  }
}

export { Progress };
