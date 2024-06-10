import { Renderer } from "./Renderer";
import { Game } from "./Game";

abstract class Element {
  constructor(public game: Game) {}

  abstract advance(ms: number): void;

  render() {
    this._render(this.game.renderer);
  }

  protected abstract _render(renderer: Renderer): void;
}

export { Element };
