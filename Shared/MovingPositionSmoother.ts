type Point = { x: number; y: number };

class MovingPositionSmoother {
  private targetValue: Point;
  private smoothValue: Point;
  private smoothingFactor: number;
  private updateFunction: (smoothedValue: Point, deltaValue: Point) => void;
  private animationFrameId: number | null = null;

  constructor(
    initialValue: Point,
    smoothingFactor: number,
    updateFunction: (smoothedValue: Point, deltaValue: Point) => void
  ) {
    this.targetValue = { x: initialValue.x, y: initialValue.y };
    this.smoothValue = { x: initialValue.x, y: initialValue.y };
    this.smoothingFactor = smoothingFactor;
    this.updateFunction = updateFunction;
    this.animateInertia();
  }

  private animateInertia() {
    // Calculate the difference between the target and smooth values
    const dx = this.targetValue.x - this.smoothValue.x;
    const dy = this.targetValue.y - this.smoothValue.y;

    const delta = { x: dx, y: dy };

    // Check if the smooth value has moved significantly
    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      // Update the velocity based on the change in values
      const velocityX = dx * this.smoothingFactor;
      const velocityY = dy * this.smoothingFactor;

      // Update the smooth value with the velocity
      this.smoothValue.x += velocityX;
      this.smoothValue.y += velocityY;

      // Call the update function with the smoothed value
      if (typeof this.updateFunction === "function") {
        this.updateFunction(this.smoothValue, delta);
      }
    }

    // Continue animating inertia
    this.animationFrameId = requestAnimationFrame(() => this.animateInertia());
  }

  updateThrottled(newValue: Point) {
    // Update the target value with the new input
    this.targetValue.x = newValue.x;
    this.targetValue.y = newValue.y;
  }

  destroy() {
    // Stop the inertia animation when the object is destroyed
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

export { MovingPositionSmoother };
