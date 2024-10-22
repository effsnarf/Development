type Comparator<K> = (a: [K, any], b: [K, any]) => number;

class SortedMap<K, V> {
  private map: Map<K, V>;
  private sortedArray: [K, V][];
  private comparator: Comparator<K>;

  static number<V>(): SortedMap<number, V> {
    return new SortedMap<number, V>((a, b) => a[0] - b[0]);
  }

  constructor(comparator: Comparator<K>) {
    this.map = new Map<K, V>();
    this.sortedArray = [];
    this.comparator = comparator;
  }

  // Set a key-value pair and maintain sorted order
  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.removeFromSorted(key);
    }
    this.map.set(key, value);
    this.insertSorted([key, value]);
  }

  // Get a value by key
  get(key: K): V | undefined {
    return this.map.get(key);
  }

  // Remove a key-value pair
  delete(key: K): boolean {
    const existed = this.map.delete(key);
    if (existed) this.removeFromSorted(key);
    return existed;
  }

  // Get all key-value pairs sorted according to the comparator
  entries(): [K, V][] {
    return [...this.sortedArray];
  }

  // Insert an entry in the sorted array
  private insertSorted(entry: [K, V]): void {
    const index = this.binarySearch(entry);
    this.sortedArray.splice(index, 0, entry);
  }

  // Binary search to find the insertion index
  private binarySearch(entry: [K, V]): number {
    let low = 0,
      high = this.sortedArray.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const comparison = this.comparator(this.sortedArray[mid], entry);
      if (comparison < 0) low = mid + 1;
      else high = mid - 1;
    }
    return low;
  }

  // Remove an entry from the sorted array
  private removeFromSorted(key: K): void {
    const index = this.sortedArray.findIndex(([k]) => k === key);
    if (index !== -1) this.sortedArray.splice(index, 1);
  }
}

type TreeNode = {
  id: number;
  depth: number;
  name: string;
  children: TreeNode[];
  state: any; // Adjust type as needed
};

class TreeBuilder {
  private root: TreeNode;
  public currentNode: TreeNode;
  private stack: TreeNode[];
  private treeNodeID = 1;

  constructor(rootName: string) {
    this.root = {
      id: this.treeNodeID++,
      depth: 0,
      name: rootName,
      children: [],
      state: null,
    };
    this.currentNode = this.root;
    this.stack = [this.root];
  }

  openGroup(name: string, state: any = null) {
    const newNode: TreeNode = {
      id: this.treeNodeID++,
      depth: this.stack.length,
      name,
      children: [],
      state,
    };
    this.currentNode.children.push(newNode);
    this.currentNode = newNode;
    this.stack.push(newNode);
    return newNode;
  }

  closeGroup() {
    if (this.stack.length > 1) {
      const groupNode = this.stack.pop();
      this.currentNode = this.stack[this.stack.length - 1];
      return groupNode;
    }
  }

  cancelGroup() {
    if (this.stack.length <= 1) throw new Error("Cannot cancel root node");
    const groupNode = this.stack.pop();
    this.currentNode = this.stack[this.stack.length - 1];
    this.currentNode.children.pop();
  }

  getTree(): TreeNode {
    return this.root;
  }
}

export { TreeBuilder, TreeNode, SortedMap };
