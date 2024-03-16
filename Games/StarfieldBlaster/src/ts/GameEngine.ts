import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Color4,
  HemisphericLight,
} from "@babylonjs/core";
import { RenderLoop } from "./RenderLoop";
import { Starfield } from "./Starfield";

class GameEngine {
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
  renderLoop: RenderLoop;

  private constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0, 0, 0, 1);

    window.addEventListener("resize", () => this.engine.resize());

    const light = new HemisphericLight(
      "light",
      new Vector3(0, 1, 0),
      this.scene
    );
    light.intensity = 0.7;

    this.camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 2,
      10,
      Vector3.Zero(),
      this.scene
    );
    this.camera.minZ = 0.1;
    this.camera.maxZ = 1000;
    this.camera.attachControl(canvas, true);

    this.renderLoop = RenderLoop.start(this);
  }

  static start(canvas: HTMLCanvasElement) {
    const ge = new GameEngine(canvas);
    return ge;
  }

  render() {
    this.scene.render();
  }

  getVisibleBoundingBox() {
    const aspectRatio =
      this.engine.getRenderWidth() / this.engine.getRenderHeight();
    const vFOV = this.camera.fov; // Vertical field of view in radians
    const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * aspectRatio); // Horizontal field of view in radians

    // Calculate the dimensions of the frustum at the near and far planes
    const nearHeight = 2 * Math.tan(vFOV / 2) * this.camera.minZ;
    const nearWidth = 2 * Math.tan(hFOV / 2) * this.camera.minZ;
    const farHeight = 2 * Math.tan(vFOV / 2) * this.camera.maxZ;
    const farWidth = 2 * Math.tan(hFOV / 2) * this.camera.maxZ;

    return {
      near: { width: nearWidth, height: nearHeight },
      far: { width: farWidth, height: farHeight },
    };
  }
}

export { GameEngine };
