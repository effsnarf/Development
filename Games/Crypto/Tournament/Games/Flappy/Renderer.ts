class Scaler {}

class Renderer {
  ctx: CanvasRenderingContext2D;
  private unitInCanvasVw = 5;
  private unitInCanvasVh = 5;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d") || new CanvasRenderingContext2D();
  }

  square(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    color: string,
    rotationAngle: number
  ) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const left = centerX - halfWidth;
    const top = centerY + halfHeight;
    this.ctx.fillStyle = color;

    // Save the current transformation matrix
    this.ctx.save();

    // Translate to the center of the square
    //this.ctx.translate(this.toCanvasX(centerX), this.toCanvasY(centerY));

    // Rotate the square
    //this.ctx.rotate((rotationAngle * Math.PI) / 180);

    // Draw the rotated square
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      this.toCanvasX(left),
      this.toCanvasY(top),
      this.toCanvasW(width),
      this.toCanvasH(height)
    );

    // Restore the original transformation matrix
    this.ctx.restore();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private toCanvasX(x: number): number {
    return (
      this.canvas.width / 2 +
      x * (this.unitInCanvasVw / 100) * this.canvas.width
    );
  }

  private toCanvasY(y: number): number {
    return (
      this.canvas.height / 2 -
      y * (this.unitInCanvasVw / 100) * this.canvas.height
    );
  }

  private toCanvasW(width: number): number {
    return width * (this.unitInCanvasVw / 100) * this.canvas.width;
  }

  private toCanvasH(height: number): number {
    return height * (this.unitInCanvasVh / 100) * this.canvas.height;
  }
}

export { Renderer };
