import { Loop } from "./Loop";
import { Renderer } from "./Renderer";
import { Player } from "./Player";

class Game {
  time = 0;
  lastTick = 0;
  private loop: Loop;
  public renderer: Renderer;
  private player: Player;

  constructor(canvas: HTMLCanvasElement) {
    this.lastTick = Date.now();
    this.renderer = new Renderer(canvas);
    this.player = new Player(this);
    this.loop = new Loop(this);
  }

  async onFrame() {
    const now = Date.now();
    const tickDiff = now - this.lastTick;
    this.lastTick = now;
    const elements = this.getElements();
    for (const element of elements) {
      await element.advance(tickDiff);
    }
    this.renderer.clear();
    for (const element of elements) {
      await element.render();
    }
  }

  getElements() {
    return [this.player];
  }
}

export { Game };
