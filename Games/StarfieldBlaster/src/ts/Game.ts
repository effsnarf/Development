import { GameEngine } from "./GameEngine";
import { Starfield } from "./Starfield";
import { Starship } from "./Starship";
import { GameControls } from "./GameControls";

class Game {
  starfield!: Starfield;
  starship!: Starship;
  gameControls!: GameControls;

  private constructor(gameEngine: GameEngine) {}

  static async start(canvas: HTMLCanvasElement) {
    const gameEngine = await GameEngine.start(canvas);
    const game = new Game(gameEngine);

    game.starfield = await Starfield.start(gameEngine);
    game.starship = await Starship.start(gameEngine);
    game.gameControls = GameControls.new();

    gameEngine.renderLoop.add(game.starfield);

    return game;
  }
}

export { Game };
