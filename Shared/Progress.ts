class Progress {
  public processed = 0;
  private percent = 0;
  private progressInterval: number = 1000 / 4;
  private lastReport = 0;

  private constructor(
    public readonly total: number,
    public readonly data: any,
    private readonly onProgress: (percent: number) => void
  ) {}

  static new(total: number, data: any, onProgress: (percent: number) => void) {
    return new Progress(total, data, onProgress);
  }

  addOne() {
    this.processed++;
  }

  done() {
    this.processed = this.total;
  }

  isTimeForAnotherReport() {
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

  get bar() {
    const tab = "        ";

    return (
      `${this.processed.toLocaleString().yellow} / ${
        this.total.toLocaleString().green
      }` +
      tab +
      this.progress.stringify("bar")
    );
  }
}

export { Progress };
