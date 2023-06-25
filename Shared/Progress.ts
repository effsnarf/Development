class Progress {
  public processed = 0;
  private percent = 0;
  private progressInterval: number = 1000 / 4;
  private lastReport = 0;
  private showedFirstLine = false;
  private displayProgress = false;

  private constructor(
    public readonly total: number | null,
    public readonly data: any,
    private readonly onProgress: (percent: number) => void,
    private readonly started = Date.now()
  ) {}

  static newAutoDisplay(total: number | null = null, data: any = {}) {
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
    if (this.total != null) this.processed = this.total;
    this.displayProgressBar();
  }

  get isDone() {
    if (this.total == null) return false;
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
    if (this.total == null) return null;
    return this.processed / this.total;
  }

  get msLeft() {
    if (this.progress == null) return null;
    const elapsed = Date.now() - this.started;
    const percent = this.progress;
    return (elapsed / percent) * (1 - percent);
  }

  get bar() {
    const tab = "    ";

    return (
      `${this.processed.toLocaleString().yellow} / ${
        !this.total ? "?" : this.total.toLocaleString().green
      }` +
      tab +
      (this.progress == null
        ? ""
        : this.progress?.toProgressBar() +
          tab +
          `-${this.msLeft?.unitifyTime()}` +
          tab)
    );
  }
}

export { Progress };
