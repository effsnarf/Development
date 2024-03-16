import { Controls, KeyDirection } from "./Controls";

class GameControls {
  private constructor() {
    const ctrls = Controls.new();

    ctrls.on("a", this.onPressLeft.bind(this));
    ctrls.on("d", this.onPressRight.bind(this));
  }

  static new() {
    const gc = new GameControls();
    return gc;
  }

  onPressLeft(direction: KeyDirection) {
    console.log("Left", direction);
  }

  onPressRight(direction: KeyDirection) {
    console.log("Right", direction);
  }
}

export { GameControls };
