import { Game } from "./Game";

// The game loop
class Loop {
  constructor(private game: Game) {
    this.scheduleNextTick();
  }

  private async onFrame() {
    await this.game.onFrame();
    this.scheduleNextTick();
  }

  private scheduleNextTick() {
    requestAnimationFrame(this.onFrame.bind(this));
  }
}

export { Loop };
