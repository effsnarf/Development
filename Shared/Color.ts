class Color {
  private readonly r: number;
  private readonly g: number;
  private readonly b: number;
  private readonly a: number;

  private constructor(r: number, g: number, b: number, a: number = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  static white = new Color(1, 1, 1, 1);
  static black = new Color(0, 0, 0, 1);

  public asHexColor(): string {
    const toHex = (value: number) =>
      Math.round(value * 255)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase();
    return `#${toHex(this.r)}${toHex(this.g)}${toHex(this.b)}${this.a < 1 ? toHex(this.a) : ""}`;
  }

  public static fromHexColor(hex: string): Color {
    let r,
      g,
      b,
      a = 1;

    if (hex.length === 7) {
      // #RRGGBB format
      r = parseInt(hex.slice(1, 3), 16) / 255;
      g = parseInt(hex.slice(3, 5), 16) / 255;
      b = parseInt(hex.slice(5, 7), 16) / 255;
    } else if (hex.length === 9) {
      // #RRGGBBAA format
      r = parseInt(hex.slice(1, 3), 16) / 255;
      g = parseInt(hex.slice(3, 5), 16) / 255;
      b = parseInt(hex.slice(5, 7), 16) / 255;
      a = parseInt(hex.slice(7, 9), 16) / 255;
    } else {
      throw new Error("Invalid hex color format. Use #RRGGBB or #RRGGBBAA.");
    }

    return new Color(r, g, b, a);
  }

  get brightness(): number {
    return 0.299 * this.r + 0.587 * this.g + 0.114 * this.b;
  }

  toBlackOrWhite(): Color {
    return this.brightness > 0.5 ? Color.white : Color.black;
  }

  toContrastingTextColor(): Color {
    return this.toBlackOrWhite().invert().opacity(0.8);
  }

  invert(): Color {
    return new Color(1 - this.r, 1 - this.g, 1 - this.b, this.a);
  }

  opacity(alpha: number): Color {
    return new Color(this.r, this.g, this.b, alpha);
  }
}

export { Color };
