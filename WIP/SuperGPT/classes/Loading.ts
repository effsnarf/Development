import "./Extensions";
import colors from "colors";

class Loading {
  private interval: NodeJS.Timeout | null = null;
  private startTime: number | null = null;

  start(): void {
    this.startTime = Date.now();
    this.interval = setInterval(() => {
      const elapsedTime = Date.now() - this.startTime!;
      process.stdout.write(`\r`);
      process.stdout.write(colors.gray(`${(elapsedTime / 1000).toFixed(2)}s`));
    }, 100);
  }

  async stop(): Promise<void> {
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
