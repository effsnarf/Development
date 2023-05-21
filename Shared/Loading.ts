import * as colors from "colors";

class Loading {
  private interval: NodeJS.Timeout | null = null;
  private startTime: number | null = null;

  static startNew(info?: string): Loading {
    const loading = new Loading();
    loading.start(info);
    return loading;
  }

  start(info?: string): void {
    this.startTime = Date.now();
    this.interval = setInterval(() => {
      const elapsedTime = Date.now() - this.startTime!;
      process.stdout.write(`\r`);
      process.stdout.write(`${(elapsedTime / 1000).toFixed(2)}s ${info || ""}`);
    }, 100);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.startTime = null;
      process.stdout.write("\r");
      process.stdout.clearLine(0); // Clears the current line
    }
  }
}

export { Loading };
