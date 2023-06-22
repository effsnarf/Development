class AnalyticsTracker {
  isPaused: boolean = false;
  trackInterval: number = 100;
  timeOnSite: number = 0;

  private constructor() {
    // If the user is not looking at the page, pause tracking
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.isPaused = false;
      } else {
        this.isPaused = true;
      }
    });

    // Send a beacon when the user closes the website
    window.addEventListener("beforeunload", (event) => {
      const data = {
        timeOnSite: this.timeOnSite,
      };
      // Create and send a beacon
      navigator.sendBeacon("/analytics", JSON.stringify(data));
    });
    this.trackTick();
  }

  static async new() {
    return new AnalyticsTracker();
  }

  async trackTick() {
    if (!this.isPaused) await this.track();
    setTimeout(this.trackTick.bind(this), this.trackInterval);
  }

  async track() {
    this.timeOnSite += this.trackInterval;
  }
}

export { AnalyticsTracker };
