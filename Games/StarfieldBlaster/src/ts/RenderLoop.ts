import { IRenderable } from "./IRenderable";
import { Scene } from "@babylonjs/core";
import { GameEngine } from "./GameEngine";

class RenderLoop {
  renderables: IRenderable[] = [];
  private isRunning: boolean = false;
  private lastRendered: number = 0;

  private constructor(private gameEngine: GameEngine) {
    this._start();
  }

  static start(gameEngine: GameEngine) {
    return new RenderLoop(gameEngine);
  }

  add(renderable: IRenderable) {
    this.renderables.push(renderable);
  }

  private _start() {
    this.isRunning = true;
    this.loopFrame();
  }

  private loopFrame() {
    if (!this.isRunning) return;
    if (!this.lastRendered) this.lastRendered = Date.now();
    this.gameEngine.render();
    const timePassed = Date.now() - this.lastRendered;
    this.advance(timePassed);
    this.lastRendered = Date.now();
    requestAnimationFrame(this.loopFrame.bind(this));
  }

  private advance(milliseconds: number) {
    for (const renderable of this.renderables) {
      renderable.advance(milliseconds);
    }
  }
}

export { RenderLoop as RenderLoop };
