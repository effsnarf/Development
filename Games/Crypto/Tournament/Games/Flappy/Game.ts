import { Player } from "./Player";

class Game {
  time = 0;
  private player: Player;

  constructor() {
    this.player = new Player(this);
  }
}

export { Game };
