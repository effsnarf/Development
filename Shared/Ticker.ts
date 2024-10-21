class Ticker {
  static alertify(getMessage: (elapsed: number) => string) {
    const alertify = (window as any).alertify;
    let msg1 = null as any;
    const ticker = Ticker.new(
      200,
      (elapsed) => {
        if (elapsed < 1000) return;
        if (!ticker.isRunning) return;
        msg1 = msg1 ?? alertify?.message(getMessage(0)).delay(0);
        const message = getMessage(elapsed);
        if (!msg1) console.log(message);
        msg1?.setContent(message);
      },
      () => {
        msg1?.dismiss();
      }
    );
    return ticker;
  }

  static new(
    interval: number,
    onTick: (elapsed: number) => void,
    onStop?: Function
  ) {
    const ticker = new Ticker(interval, onTick, onStop);
    return ticker;
  }

  started = -1;
  isRunning = true;

  private constructor(
    public interval: number,
    private onTick: (elapsed: number) => void,
    private onStop?: Function,
    private alertMsg?: any
  ) {
    this.started = Date.now();
    this.anotherTick();
  }

  private anotherTick() {
    this.onTick(this.elapsed);
    if (this.isRunning) setTimeout(this.anotherTick.bind(this), this.interval);
  }

  stop() {
    this.isRunning = false;
    this.alertMsg?.dismiss();
    this.onStop?.();
  }

  dismiss() {
    this.stop();
  }

  dispose() {
    this.stop();
  }

  get elapsed() {
    return Date.now() - this.started;
  }
}

export { Ticker };
