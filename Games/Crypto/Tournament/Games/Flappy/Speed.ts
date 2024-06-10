class Speed {
  private isPressed = false;
  private acceleration = 0;
  public speed = 0;

  constructor(
    private accelerationRate: number,
    private accelerationMax: number,
    private decelerationRate: number
  ) {}

  update(ms: number, isPressed: boolean) {
    this.isPressed = isPressed;
    const seconds = ms / 1000;

    // Update acceleration based on the pressed state
    if (this.isPressed) {
      this.acceleration = Math.min(
        this.accelerationMax,
        this.acceleration + this.accelerationRate * seconds
      );
    } else {
      this.acceleration = Math.max(
        0,
        this.acceleration - this.decelerationRate * seconds
      );
    }

    // Update speed based on the acceleration
    this.speed = Math.max(0, this.acceleration);
  }
}

class JumpSpeed {
  speed = 0;

  constructor(private jumpSpeed: number, private gravity: number) {}

  jump() {
    this.speed += this.jumpSpeed;
  }

  update(ms: number) {
    const seconds = ms / 1000;

    // Apply gravity to speed
    this.speed -= this.gravity * seconds;
  }

  stop() {
    this.speed = 0;
  }
}

export { Speed, JumpSpeed };
