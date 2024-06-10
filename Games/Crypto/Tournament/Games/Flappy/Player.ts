import { Input, KeyDirection } from "./Input";
import { Speed, JumpSpeed } from "./Speed";
import { Element } from "./Element";
import { Renderer } from "./Renderer";
import { Game } from "./Game";

class Player extends Element {
  private input: Input;

  private keys = {
    left: false,
    right: false,
    up: false,
  };

  constructor(game: Game) {
    super(game);
    this.input = new Input();
    this.input.on.key(this.onKey.bind(this));
  }

  private gravity = 100;

  private speed = {
    x: {
      left: this.getWalkSpeed(),
      right: this.getWalkSpeed(),
      value(player: Player) {
        const speed = -player.speed.x.left.speed + player.speed.x.right.speed;
        return speed;
      },
    },
    y: {
      jump: new JumpSpeed(30, this.gravity),
    },
  };

  private state = {
    x: 0,
    y: 0,
  };

  getWalkSpeed() {
    return new Speed(30, 10, 30);
  }

  onKey(e: KeyboardEvent, dir: KeyDirection) {
    switch (e.key) {
      case "ArrowLeft":
        this.keys.left = dir == KeyDirection.Down;
        break;
      case "ArrowRight":
        this.keys.right = dir == KeyDirection.Down;
        break;
      case "ArrowUp":
        this.keys.up = dir == KeyDirection.Down;
        if (this.keys.up) this.speed.y.jump.jump();
        break;
    }
  }

  advance(ms: number) {
    // Convert milliseconds to seconds
    const seconds = ms / 1000;

    // walk
    this.speed.x.left.update(ms, this.keys.left);
    this.speed.x.right.update(ms, this.keys.right);
    this.state.x += this.speed.x.value(this) * seconds;

    // jump
    this.speed.y.jump.update(ms);
    this.state.y += this.speed.y.jump.speed * seconds;

    // floor
    if (this.state.y < 0) {
      this.state.y = 0;
      this.speed.y.jump.stop();
    }
  }

  _render(render: Renderer) {
    render.square(this.state.x, this.state.y, 1, 1, "white", 10);
  }
}

export { Player };
