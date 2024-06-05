class Renderer {
  ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d") || new CanvasRenderingContext2D();
  }

  square(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    color: string
  ) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const left = centerX - halfWidth;
    const top = centerY - halfHeight;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(left, top, width, height);
  }
}

export { Renderer };
