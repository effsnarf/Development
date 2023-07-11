class TwoWayMap<K, V> {
  private forward: Map<K, V[]>;
  private reverse: Map<V, K[]>;

  constructor() {
    this.forward = new Map<K, V[]>();
    this.reverse = new Map<V, K[]>();
  }

  set(key: K, value: V) {
    if (!this.forward.has(key)) {
      this.forward.set(key, []);
    }
    this.forward.get(key)!.push(value);

    if (!this.reverse.has(value)) {
      this.reverse.set(value, []);
    }
    this.reverse.get(value)!.push(key);
  }

  setReverse(value: V, key: K) {
    if (!this.reverse.has(value)) {
      this.reverse.set(value, []);
    }
    this.reverse.get(value)!.push(key);

    if (!this.forward.has(key)) {
      this.forward.set(key, []);
    }
    this.forward.get(key)!.push(value);
  }

  delete(key: K) {
    const values = this.forward.get(key);
    if (!values) return;
    values.forEach((value) => {
      const keys = this.reverse.get(value);
      if (!keys) return;
      const index = keys.indexOf(key);
      if (index == -1) return;
      keys.splice(index, 1);
    });
    this.forward.delete(key);
  }

  deleteReverse(value: V) {
    const keys = this.reverse.get(value);
    if (!keys) return;
    keys.forEach((key) => {
      const values = this.forward.get(key);
      if (!values) return;
      const index = values.indexOf(value);
      if (index == -1) return;
      values.splice(index, 1);
    });
    this.reverse.delete(value);
  }

  get(key: K): V[] {
    return this.forward.get(key) || [];
  }

  getReverse(value: V): K[] {
    return this.reverse.get(value) || [];
  }

  keys(): K[] {
    return Array.from(this.forward.keys());
  }

  values(): V[] {
    return Array.from(this.reverse.keys());
  }
}

export { TwoWayMap };
