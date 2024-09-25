class Ticker {
  static alertify(getMessage: (elapsed: number) => string) {
    const alertify = (window as any).alertify;
    const msg1 = alertify?.message(getMessage(0)).delay(0);
    const ticker = Ticker.new(
      200,
      (elapsed) => {
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
    private onStop?: Function
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
    this.onStop?.();
  }

  dispose() {
    this.stop();
  }

  get elapsed() {
    return Date.now() - this.started;
  }
}

export { Ticker };
