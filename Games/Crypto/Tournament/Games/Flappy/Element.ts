import { Renderer } from "./Renderer";
import { Game } from "./Game";

abstract class Element {
  constructor(public game: Game) {}

  abstract advance(ms: number): void;

  abstract render(render: Renderer): void;
}

export { Element };
