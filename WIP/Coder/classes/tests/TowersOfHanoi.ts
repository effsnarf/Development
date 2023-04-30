class TowersOfHanoi {
  solve(discs: number): string[] {
    const steps: string[] = [];
    this.moveDiscs(discs, "A", "C", "B", steps);
    return steps;
  }

  private moveDiscs(
    numDiscs: number,
    fromRod: string,
    toRod: string,
    auxRod: string,
    steps: string[]
  ): void {
    if (numDiscs === 1) {
      steps.push(`${fromRod} -> ${toRod}`);
      return;
    }

    this.moveDiscs(numDiscs - 1, fromRod, auxRod, toRod, steps);
    steps.push(`${fromRod} -> ${toRod}`);
    this.moveDiscs(numDiscs - 1, auxRod, toRod, fromRod, steps);
  }
}

export { TowersOfHanoi };
