import { Game } from "./Game";

abstract class Element {
  constructor(public game: Game) {}

  abstract advance(ms: number): void;
}

export { Element };
