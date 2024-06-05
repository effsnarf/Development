import { Element } from "./Element";
import { Renderer } from "./Renderer";
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

  render(render: Renderer) {
    render.square(this.state.x, this.state.y, 1, 1, "white");
  }
}

export { Player };
