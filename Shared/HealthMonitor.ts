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

  constructor() {
    this.recalc();
  }

  trackSuccess() {
    this.attempts.push({ dt: Date.now(), success: true });
    this.cleanup();
  }

  trackFailure() {
    this.attempts.push({ dt: Date.now(), success: false });
    this.cleanup();
  }

  cleanup() {
    while (this.attempts.length > this.maxItems) {
      this.attempts.shift();
    }
  }

  // Recalculate the success rate
  recalc() {
    const attempts = [...this.attempts];
    if (attempts.length) {
      const successes = attempts.filter((a) => a.success).length;
      this.successRate = successes / attempts.length;
    }
    setTimeout(this.recalc.bind(this), 1000);
  }
}

export { HealthMonitor };
