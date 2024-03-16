import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  ArcRotateCamera,
  PointsCloudSystem,
  ShaderMaterial,
  Color4,
} from "@babylonjs/core";
import { GameEngine } from "./GameEngine";
import { IRenderable } from "./IRenderable";

class Star {
  constructor(public pos: Vector3) {}
}

class Starfield implements IRenderable {
  starCount: number = 2000;
  stars: Star[] = [];
  pcs!: PointsCloudSystem;
  frustum!: {
    near: { width: number; height: number };
    far: { width: number; height: number };
  };

  private constructor(private gameEngine: GameEngine) {}

  static async start(gameEngine: GameEngine) {
    const sf = new Starfield(gameEngine);
    await sf.init();
    return sf;
  }

  private async init() {
    const scene = this.gameEngine.scene;
    const camera = this.gameEngine.camera;
    const frustum = (this.frustum = this.gameEngine.getVisibleBoundingBox());

    for (let i = 0; i < this.starCount; i++) {
      // Randomly choose a depth between the near and far planes
      const cameraRange = camera.maxZ - camera.minZ;
      const z = camera.minZ + cameraRange * Math.random();

      // Interpolate the width and height within the frustum based on the z value
      const t = (z - camera.minZ) / (camera.maxZ - camera.minZ);
      const width =
        frustum.near.width + (frustum.far.width - frustum.near.width) * t;
      const height =
        frustum.near.height + (frustum.far.height - frustum.near.height) * t;

      // Randomly generate x and y within the interpolated width and height
      const x = Math.random() * width - width / 2;
      const y = Math.random() * height - height / 2;

      this.stars.push(new Star(new Vector3(x, y, z)));
    }

    await this.createPointCloud();
  }

  private async createPointCloud() {
    this.pcs = new PointsCloudSystem("pcs", 1, this.gameEngine.scene);
    this.pcs.addPoints(this.starCount);

    this.pcs.updateParticle = (particle) => {
      particle.position = this.stars[particle.idx].pos;
      // Calculate color based on the z position
      const colorFactor = Math.max(1 - particle.position.z / 50, 0.1);
      particle.color = new Color4(colorFactor, colorFactor, colorFactor, 1); // Shades of grey based on z
      return particle;
    };

    await this.pcs.buildMeshAsync();
  }

  advance(milliseconds: number) {
    for (let star of this.stars) {
      star.pos.z += milliseconds / 100;
      if (star.pos.z > 50) {
        star.pos.z = -50;
      }
    }

    this.pcs.setParticles();
  }
}

export { Starfield };
