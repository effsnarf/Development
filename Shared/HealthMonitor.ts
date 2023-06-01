// Tracks success and failure of health checks
// in the last N minutes

interface Attempt {
  dt: number;
  success: boolean;
}

class HealthMonitor {
  private maxItems = 100;
  private attempts: Attempt[] = [];
  successRate: number = 0;

  constructor() {}

  track(success: boolean) {
    this.attempts.push({ dt: Date.now(), success });
    this.onChanged();
  }

  onChanged() {
    this.recalc();
  }

  cleanup() {
    while (this.attempts.length > this.maxItems) {
      this.attempts.shift();
    }
  }

  // Recalculate the success rate
  recalc() {
    this.cleanup();
    const attempts = [...this.attempts];
    if (attempts.length) {
      const successes = attempts.filter((a) => a.success).length;
      this.successRate = successes / attempts.length;
    }
  }
}

export { HealthMonitor };
