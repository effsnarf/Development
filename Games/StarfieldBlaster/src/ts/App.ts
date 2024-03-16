import { Game } from "./Game";

class App {
  private game!: Game;

  private constructor() {}

  static async start(canvas: HTMLCanvasElement) {
    const app = new App();
    app.game = await Game.start(canvas);
    return app;
  }
}

(window as any).App = App;
