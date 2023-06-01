// Encapsulates a value that gets recalculated periodically.

class Refreshing {
  private value: any;
  private getValue: () => any;
  private interval: any;

  constructor(getValue: () => any, interval: any) {
    this.value = null;
    this.getValue = getValue;
    this.interval = interval;
    this.refresh();
  }

  private async refresh() {
    // Wait 200ms
    await new Promise((resolve) => setTimeout(resolve, 200));

    this.value = await this.getValue();
    if (typeof this.value === "object" && this.value !== null) {
      Object.assign(this, this.value);
    }

    setTimeout(this.refresh.bind(this), this.interval);
  }
}

export { Refreshing };
