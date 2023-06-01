// Tracks success and failure of health checks
// in the last N minutes

interface Attempt {
  dt: number;
  success: boolean;
}

class HealthMonitor {
  private maxItems = 100;
  private attempts: Attempt[] = [];
  private successes: number = 0;
  successRate: number = 0;

  constructor() {}

  track(success: boolean) {
    this.attempts.push({ dt: Date.now(), success });
    if (success) this.successes++;
    this.onChanged();
  }

  onChanged() {
    this.recalc();
  }

  cleanup() {
    while (this.attempts.length > this.maxItems) {
      const attempt = this.attempts.shift();
      if (attempt?.success) this.successes--;
    }
  }

  // Recalculate the success rate
  recalc() {
    this.cleanup();
    if (this.attempts.length) {
      this.successRate = this.successes / this.attempts.length;
    } else {
      this.successRate = 0;
    }
  }
}

export { HealthMonitor };
