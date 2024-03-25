import { Controls, KeyDirection } from "./general/Controls";

enum HDir {
  Left = "left",
  Right = "right",
}
class GameControls {
  private velocity = {
    left: 0,
    right: 0,
  };

  private constructor() {
    const ctrls = Controls.new();

    ctrls.on("a", (keyDir) => this.onPress(HDir.Left, keyDir));
    ctrls.on("d", (keyDir) => this.onPress(HDir.Right, keyDir));
  }

  static new() {
    const gc = new GameControls();
    return gc;
  }

  onPress(hDir: HDir, keyDir: KeyDirection) {
    const action = keyDir === KeyDirection.Press ? "start" : "stop";
    //this.velocity[hDir][action]();
  }
}

export { GameControls };
