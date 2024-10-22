import { SortedMap } from "./DataStruct";

class Counter {
  private counts: Map<string, number>;

  constructor() {
    // Comparator to sort by count in descending order
    this.counts = new Map<string, number>();
  }

  // Increment the count for a given event
  increment(event: string): void {
    const currentCount = this.counts.get(event) || 0;
    this.counts.set(event, currentCount + 1);
  }

  // Get all items sorted by count
  getSortedItems(): [string, number][] {
    return [...this.counts.entries()].sort((a, b) => b[1] - a[1]);
  }
}

export { Counter };
