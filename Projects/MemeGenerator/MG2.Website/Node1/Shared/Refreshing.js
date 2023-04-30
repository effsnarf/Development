class Refreshing {
    value = null;
    getValue = null;
    interval = 0;

    constructor(getValue, interval) {
      this.value = null;
      this.getValue = getValue;
      this.interval = interval;
      this.refresh();
    }
  
    async refresh() {
      // Wait 200ms
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.value = await this.getValue();
      if (typeof (this.value) === "object" && this.value !== null) {
        Object.assign(this, this.value);
      }
      setTimeout(this.refresh.bind(this), this.interval);
    }
  }

  export { Refreshing }
