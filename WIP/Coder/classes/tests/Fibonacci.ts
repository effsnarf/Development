class Fibonacci {
  calculate(n: number): number {
    if (n < 2) return n;
    else return this.calculate(n - 1) + this.calculate(n - 2);
  }
}

export { Fibonacci };
