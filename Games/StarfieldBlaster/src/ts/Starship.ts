import { IRenderable } from "./IRenderable";
import { GameEngine } from "./GameEngine";
import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  VertexData,
} from "@babylonjs/core";

class Starship implements IRenderable {
  private constructor(private gameEngine: GameEngine) {
    this.createStarship();
  }

  static start(gameEngine: GameEngine) {
    return new Starship(gameEngine);
  }

  createStarship() {
    const scene = this.gameEngine.scene;

    const starshipBody = this.createStarshipBody(scene);

    const material = new StandardMaterial("starshipMaterial", scene);
    material.diffuseColor = new Color3(0.4, 0.4, 0.4);
    starshipBody.material = material;

    // Position the starship in the scene
    starshipBody.position = new Vector3(0, -2, 0);
  }

  private createStarshipBody(scene: any) {
    // const starshipBody = MeshBuilder.CreateBox(
    //   "starship",
    //   { width: 2, depth: 2, height: 0.5 },
    //   scene
    // );

    const starshipBody = MeshBuilder.CreateCylinder(
      "starship",
      {
        diameterTop: 0, // zero diameter at the top makes it a pyramid
        diameterBottom: 2, // width of the base
        height: 0.5, // height of the pyramid, smaller for a flattened look
        tessellation: 4, // number of sides, 4 makes it a pyramid
      },
      scene
    );

    return starshipBody;
  }

  advance() {}
}

export { Starship };
