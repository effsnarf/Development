// Tracks success and failure of health checks
// in the last N minutes

interface Attempt {
  dt: number;
  success: boolean;
}

class HealthMonitor {
  private maxItems = 1000;

  private attempts: Attempt[] = [];
  private successes: number = 0;
  successRate: number = 0;

  private values: number[] = [];
  private sum: number = 0;
  average: number = 0;

  constructor() {}

  track(value: boolean | number) {
    if (typeof value == "boolean") {
      const success = value;
      this.attempts.push({ dt: Date.now(), success });
      if (success) this.successes++;
    }
    if (typeof value == "number") {
      this.values.push(value);
      this.sum += value;
    }
    this.onChanged();
  }

  onChanged() {
    this.recalc();
  }

  // Recalculate the success rate
  recalc() {
    this.cleanup();
    if (this.attempts.length) {
      this.successRate = this.successes / this.attempts.length;
    } else {
      this.successRate = 0;
    }

    if (this.values.length) {
      this.average = this.sum / this.values.length;
    } else {
      this.average = 0;
    }
  }

  cleanup() {
    while (this.attempts.length > this.maxItems) {
      const attempt = this.attempts.shift();
      if (attempt?.success) this.successes--;
    }
    while (this.values.length > this.maxItems) {
      const value = this.values.shift();
      if (value) this.sum -= value;
    }
  }
}

export { HealthMonitor };
