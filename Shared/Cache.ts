import fs from "fs";
import md5 from "md5";
import path from "path";
import { Events } from "./Events";
import { Database } from "./Database/Database";
import { DatabaseBase } from "./Database/DatabaseBase";

abstract class CacheBase {
  events: Events = new Events();
  abstract get(
    key: string,
    getDefaultValue?: () => Object
  ): Promise<Object | null>;
  abstract set(key: string, value: Object): void;
  abstract has(key: string): Promise<boolean>;
}

class Cache {
  static async new(config: any): Promise<CacheBase> {
    if (!config) return await NullCache.new();
    if ("enabled" in config && !config.enabled) return await NullCache.new();

    if (config.memory) return MemoryCache.new();
    if (config.zero) {
      return ZeroCache.new(await Cache.new(config.zero));
    }
    return await DatabaseCache.new(
      await Database.new(config.database),
      "CacheItems"
    );
    throw new Error(`Unknown cache type: ${JSON.stringify(config)}`);
  }
}

class NullCache extends CacheBase {
  private constructor() {
    super();
    console.log(`${`NullCache`.gray}`);
  }

  static async new() {
    return new NullCache();
  }

  async get(key: string, getDefaultValue?: () => Object) {
    return !getDefaultValue ? null : await getDefaultValue();
  }

  set(key: string, value: Object) {}

  async has(key: string) {
    return false;
  }
}

// Always returns the cached value, to provide zero caching
// Fetches the value again in the background
// Maintains a queue of pending fetches
// Uses another Cache as the underlying store
class ZeroCache extends CacheBase {
  private queue: { [key: string]: () => any } = {};

  private constructor(private cache: CacheBase) {
    super();
    console.log(`${`ZeroCache`.gray}`);
  }

  static new(cache: CacheBase) {
    return new ZeroCache(cache);
  }

  async get(key: string, getDefaultValue?: () => Object) {
    this.enqueue(key, getDefaultValue);
    while (!(await this.cache.has(key))) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return await this.cache.get(key, getDefaultValue);
  }

  set(key: string, value: Object) {
    this.cache.set(key, value);
  }

  async has(key: string) {
    return this.cache.has(key);
  }

  private enqueue(key: string, getDefaultValue?: () => Object) {
    if (!getDefaultValue) return;
    if (this.queue[key]) return;

    this.queue[key] = async () => {
      const value = await getDefaultValue();
      this.cache.set(key, value);
      delete this.queue[key];
    };

    this.queue[key]();
  }
}

class MemoryCache extends CacheBase {
  private items: { [key: string]: any } = {};

  constructor() {
    super();
    console.log(`${`MemoryCache`.gray}`);
  }

  static new() {
    return new MemoryCache();
  }

  async get(key: string, getDefaultValue?: () => Object) {
    if (this.items[key]) return this.items[key];
    if (!getDefaultValue) return null;
    const value = await getDefaultValue();
    this.items[key] = value;
    return value;
  }

  set(key: string, value: Object) {
    this.items[key] = value;
  }

  async has(key: string) {
    return this.items[key];
  }
}

class DatabaseCache extends CacheBase {
  private constructor(
    private db: DatabaseBase,
    private collectionName: string
  ) {
    super();
    console.log(`${`DatabaseCache`.gray}: ${db.constructor.name}`);
  }

  static new(db: DatabaseBase, collectionName: string) {
    return new DatabaseCache(db, collectionName);
  }

  async get(key: string, getDefaultValue?: () => Object) {
    try {
      const value = await this.db.get(key);
      if (value) return value;
      if (!getDefaultValue) return null;
      const defaultValue = await getDefaultValue();
      await this.db.set(key, defaultValue);
      return defaultValue;
    } catch (ex) {
      this.events.emit("error", ex);
      return null;
    }
  }

  set(key: string, value: Object) {
    this.db.set(key, value);
  }

  async has(key: string) {
    return await this.db.get(key);
  }
}

export { Cache, CacheBase };
