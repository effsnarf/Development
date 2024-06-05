import { Element } from "./Element";
import { Game } from "./Game";

class Player extends Element {
  constructor(game: Game) {
    super(game);
  }

  private state = {
    x: 0,
    y: 0,
  };

  advance(ms: number) {
    // moves at 1 unit per second
    const speed = 1;

    const seconds = ms / 1000;

    this.state.x += speed / seconds;
  }
}

export { Player };
