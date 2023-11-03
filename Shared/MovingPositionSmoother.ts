type Point = { x: number; y: number };

const areEqual = (a: Point, b: Point) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y;
};

class MovingPositionSmoother {
  private target!: Point;
  private smooth!: Point;
  private nextSteps: Point[] = [];
  private isAnimating = false;
  private animationFrameId: number | null = null;

  constructor(
    private onSmoothPosChanged: (smooth: Point, delta: Point) => void
  ) {}

  getNextSteps() {
    if (!this.target) return [];

    const numSteps = 10; // Number of steps to calculate
    const steps: any[] = [];

    if (this.nextSteps.length > (numSteps - 1) * 2) return [];

    if (areEqual(this.smooth, this.target)) {
      return steps; // No need to calculate steps if already at the target
    }

    // Calculate the step size for both x and y directions
    const stepX = (this.target.x - this.smooth.x) / numSteps;
    const stepY = (this.target.y - this.smooth.y) / numSteps;

    // Generate the next steps
    for (let i = 0; i < numSteps; i++) {
      const nextStep = {
        x: this.smooth.x + stepX,
        y: this.smooth.y + stepY,
      };
      steps.push(nextStep);

      // Update the smooth position for the next iteration
      this.smooth = nextStep;
    }

    return steps;
  }

  private animateInertia() {
    if (this.isAnimating) return false;
    this.isAnimating = true;
    this.nextAnimationStep();
  }

  private animateInertiaStep() {
    if (!this.isAnimating) return;

    // Get the next step and calculate the delta
    const nextStep = this.nextSteps.shift();

    if (nextStep) {
      const delta = {
        x: nextStep.x - this.smooth.x,
        y: nextStep.y - this.smooth.y,
      };

      // Call onSmoothPosChanged with the next step and delta
      this.onSmoothPosChanged(nextStep, delta);
    }

    // Check if there are more steps
    if (this.nextSteps.length > 0) {
      // Schedule another animation frame
      this.nextAnimationStep();
    } else {
      // If no more steps but smooth is not at the target, continue animation
      if (!areEqual(this.smooth, this.target)) {
        this.calculateNextSteps();
        this.nextAnimationStep();
      } else {
        // Animation is complete
        this.isAnimating = false;
      }
    }
  }

  private nextAnimationStep() {
    requestAnimationFrame(this.animateInertiaStep.bind(this));
  }

  private calculateNextSteps() {
    if (areEqual(this.smooth, this.target)) return false;
    this.nextSteps.push(...this.getNextSteps());
    return true;
  }

  setTarget(newTarget: Point) {
    this.target = newTarget;
    if (!this.smooth) this.smooth = newTarget;
    this.calculateNextSteps();
    this.animateInertia();
  }
}

export { MovingPositionSmoother };
