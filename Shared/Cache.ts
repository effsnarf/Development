import fs from "fs";
import md5 from "md5";
import path from "path";
import { Lock } from "./Lock";
import { Events } from "./Events";
import { HealthMonitor } from "./HealthMonitor";
import { Database } from "./Database/Database";
import { DatabaseBase } from "./Database/DatabaseBase";

abstract class CacheBase {
  events: Events = new Events();
  health: HealthMonitor = new HealthMonitor();
  abstract get(key: string, getDefaultValue?: () => any): Promise<any>;
  abstract set(key: string, value: any): void;
  abstract has(key: string): Promise<boolean>;
}

class Cache {
  static async new(config: any): Promise<CacheBase> {
    if (!config) return await NullCache.new();
    if ("enabled" in config && !config.enabled) return await NullCache.new();

    if (Array.isArray(config)) {
      return await MultiCache.new(
        await Promise.all(config.map((item) => Cache.new(item)))
      );
    }

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

  async get(key: string, getDefaultValue?: () => any) {
    this.health.track(false);
    return !getDefaultValue ? null : await getDefaultValue();
  }

  set(key: string, value: any) {}

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

  async get(key: string, getDefaultValue?: () => any) {
    this.enqueue(key, getDefaultValue);
    let hasValue = await this.cache.has(key);
    this.health.track(hasValue);
    // If the cache doesn't have the value yet, wait for it
    while (!hasValue) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      hasValue = await this.cache.has(key);
    }
    return await this.cache.get(key, getDefaultValue);
  }

  set(key: string, value: any) {
    this.cache.set(key, value);
  }

  async has(key: string) {
    return this.cache.has(key);
  }

  private enqueue(key: string, getDefaultValue?: () => any) {
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

// A chain of caches
// This is useful for example to have a memory cache in front of a database cache
// The memory cache will be faster, but the database cache will be more persistent
class MultiCache extends CacheBase {
  private constructor(private caches: CacheBase[]) {
    super();
    console.log(`${`MultiCache`.gray}`);
  }

  static new(caches: CacheBase[]) {
    return new MultiCache(caches);
  }

  async get(key: string, getDefaultValue?: () => any) {
    for (const cache of this.caches) {
      const value = await cache.get(key);
      if (value) {
        this.health.track(true);
        return value;
      }
    }
    this.health.track(false);
    if (!getDefaultValue) return null;
    const value = await getDefaultValue();
    this.set(key, value);
    return value;
  }

  set(key: string, value: any) {
    for (const cache of this.caches) {
      cache.set(key, value);
    }
  }

  async has(key: string) {
    for (const cache of this.caches) {
      if (await cache.has(key)) return true;
    }
    return false;
  }
}

class MemoryCache extends CacheBase {
  private trimLock = new Lock();
  private maxItems = 1000;
  private values: { [key: string]: any } = {};
  private accessCounts: { [key: string]: number } = {};

  constructor() {
    super();
    console.log(`${`MemoryCache`.gray}`);
  }

  static new() {
    return new MemoryCache();
  }

  async get(key: string, getDefaultValue?: () => any) {
    this.logAccess(key);
    if (this.values[key]) {
      this.health.track(true);
      return this.values[key];
    }
    this.health.track(false);
    if (!getDefaultValue) return null;
    const value = await getDefaultValue();
    this.set(key, value);
    return value;
  }

  set(key: string, value: any) {
    this.trim();
    this.values[key] = value;
  }

  async trim() {
    await this.trimLock.acquire();
    try {
      const entries = Object.entries(this.accessCounts).sortBy(
        (item) => item[1]
      );

      while (entries.length >= this.maxItems) {
        const leastAccessedKey = (entries.shift() || [""])[0];
        this.delete(leastAccessedKey);
      }
    } finally {
      this.trimLock.release();
    }
  }

  private logAccess(key: string) {
    this.accessCounts[key] = (this.accessCounts[key] || 0) + 1;
  }

  private delete(key: string) {
    delete this.values[key];
    delete this.accessCounts[key];
  }

  async has(key: string) {
    return this.values[key];
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

  async get(key: string, getDefaultValue?: () => any) {
    try {
      const value = await this.db.get(key);
      if (value) {
        this.health.track(true);
        return value;
      }
      this.health.track(false);
      if (!getDefaultValue) return null;
      const defaultValue = await getDefaultValue();
      await this.db.set(key, defaultValue);
      return defaultValue;
    } catch (ex) {
      this.events.emit("error", ex);
      return null;
    }
  }

  set(key: string, value: any) {
    this.db.set(key, value);
  }

  async has(key: string) {
    return await this.db.get(key);
  }
}

export { Cache, CacheBase };
