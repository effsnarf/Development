import { Objects } from "./Extensions.Objects.Client";
import { Events } from "./Events";

namespace Data {
  export namespace Persister {
    export abstract class Base {
      getCollection(collection: string): Collection {
        return Collection.new(this, collection);
      }

      abstract get(key: any, defaultValue: any): Promise<any>;
      abstract set(key: any, value: any): Promise<void>;

      abstract getItem(collection: string, _id: number): Promise<any>;
      abstract addItem(collection: string, item: any): Promise<void>;
      abstract updateItem(collection: string, item: any): Promise<void>;
      abstract upsertItem(collection: string, item: any): Promise<void>;
      abstract upsertMany(collection: string, items: any[]): Promise<void>;
      async deleteItem(collection: string, _id: number): Promise<void> {
        await this.deleteMany(collection, (item: any) => item._id === _id);
      }
      abstract deleteMany(
        collection: string,
        filter: (item: any) => boolean
      ): Promise<void>;
      abstract getItems(
        collection: string,
        filter: (item: any) => boolean,
        sort: (item: any) => any,
        limit?: number
      ): Promise<any[]>;
      abstract getItemAt(collection: string, index: number): Promise<any>;
      abstract getNewest(collection: string, count: number): Promise<any>;
      abstract getIndex(collection: string, item: any): Promise<number | null>;
      abstract count(collection: string): Promise<number>;

      abstract getNewID(): Promise<number>;
    }

    export class Collection {
      private constructor(
        private persister: Base,
        private collection: string
      ) {}

      static new(persister: Base, collection: string): Collection {
        return new Collection(persister, collection);
      }

      async getItem(_id: number): Promise<any> {
        return await this.persister.getItem(this.collection, _id);
      }

      async addItem(item: any): Promise<void> {
        await this.persister.addItem(this.collection, item);
      }

      async updateItem(item: any): Promise<void> {
        await this.persister.updateItem(this.collection, item);
      }

      async upsertItem(item: any): Promise<void> {
        await this.persister.upsertItem(this.collection, item);
      }

      async upsertMany(items: any[]): Promise<void> {
        await this.persister.upsertMany(this.collection, items);
      }

      async deleteItem(_id: number): Promise<void> {
        await this.persister.deleteItem(this.collection, _id);
      }

      async deleteMany(filter: (item: any) => boolean): Promise<void> {
        await this.persister.deleteMany(this.collection, filter);
      }

      async getItems(
        filter: (item: any) => boolean = () => true,
        sort: (item: any) => any = (item: any) => item._id,
        limit?: number
      ): Promise<any[]> {
        return await this.persister.getItems(
          this.collection,
          filter,
          sort,
          limit
        );
      }

      async getItemAt(index: number): Promise<any> {
        return await this.persister.getItemAt(this.collection, index);
      }

      async getNewest(count: number): Promise<any> {
        return await this.persister.getNewest(this.collection, count);
      }

      async getIndex(item: any): Promise<number | null> {
        return await this.persister.getIndex(this.collection, item);
      }

      async count(): Promise<number> {
        return await this.persister.count(this.collection);
      }

      async getNewID(): Promise<number> {
        return await this.persister.getNewID();
      }
    }

    export class Memory extends Base {
      protected nextID: number = 1;
      protected values: any = {};
      protected collections: any = {};
      protected idToIndex: any = {};

      constructor() {
        super();
      }

      static new(): Memory {
        return new Memory();
      }

      async get(key: any, defaultValue: any): Promise<any> {
        return this.values[key] || defaultValue;
      }

      async set(key: any, value: any): Promise<void> {
        this.values[key] = value;
      }

      async getItem(collection: string, _id: number): Promise<any> {
        const index = this.getIdToIndexCollection(collection)[_id];
        if (!index) return null;
        return await this.getItemAt(collection, index);
      }

      async addItem(collection: string, item: any): Promise<void> {
        const items = await this.getCollectionArray(collection);
        if (!item._id) item._id = await this.getNewID();
        items.push(item);
        this.getIdToIndexCollection(collection)[item._id] = items.length - 1;
      }

      async updateItem(collection: string, item: any): Promise<void> {
        let items = await this.getCollectionArray(collection);
        const index = items.findIndex((i: any) => i._id === item._id);
        if (index >= 0) items[index] = item;
      }

      async upsertItem(collection: string, item: any): Promise<void> {
        if (await this.getItem(collection, item._id)) {
          await this.updateItem(collection, item);
        } else {
          await this.addItem(collection, item);
        }
      }

      async upsertMany(collection: string, items: any[]): Promise<void> {
        for (const item of items) {
          await this.upsertItem(collection, item);
        }
      }

      async deleteMany(collection: string, filter: (item: any) => boolean) {
        const deletedItems = await this.getItems(collection, filter);
        let items = await this.getCollectionArray(collection);
        items = items.filter((item: any) => !filter(item));
        this.setCollectionArray(collection, items);
        const idToIndex = this.getIdToIndexCollection(collection);
        for (const item of deletedItems) {
          delete idToIndex[item._id];
        }
      }

      async getItems(
        collection: string,
        filter: (item: any) => boolean = () => true,
        sort: (item: any) => any = (item: any) => item._id,
        limit?: number
      ): Promise<any[]> {
        let items = await this.getCollectionArray(collection);
        items = items.filter(filter);
        items = items.sort(sort);
        items = items.slice(0, limit || items.length);
        items = Objects.clone(items);
        return items;
      }

      async getItemAt(collection: string, index: number): Promise<any> {
        const items = await this.getCollectionArray(collection);
        return items[index];
      }

      async getNewest(collection: string, count: number): Promise<any> {
        const items = await this.getCollectionArray(collection);
        return items.slice(-count);
      }

      async getIndex(collection: string, item: any): Promise<number | null> {
        const _id = (item._id || item) as number;
        return this.getIdToIndexCollection(collection)[_id];
      }

      async count(collection: string): Promise<number> {
        const items = await this.getCollectionArray(collection);
        return items.length;
      }

      private getCollectionArray(collection: string): any[] {
        if (!this.collections[collection]) this.collections[collection] = [];
        return this.collections[collection];
      }

      private setCollectionArray(collection: string, items: any[]): void {
        this.collections[collection] = items;
      }

      async getNewID(): Promise<number> {
        return this.nextID++;
      }

      private getIdToIndexCollection(collection: string): any {
        if (!this.idToIndex[collection]) this.idToIndex[collection] = {};
        return this.idToIndex[collection];
      }
    }

    export class LocalStorage extends Memory {
      private constructor(private name: string) {
        super();
        // Whenever one of these is called, save the data to local storage
        const members = [
          "set",
          "addItem",
          "updateItem",
          "upsertItem",
          "deleteItem",
          "deleteMany",
          "getNewID",
        ];
        const self = this as any;
        for (const member of members) {
          const original = self[member];
          self[member] = async (...args: any[]) => {
            const result = await original.apply(this, args);
            this.save();
            return result;
          };
        }
      }

      static new2(name: string): LocalStorage {
        const storage = new LocalStorage(name);
        storage.load();
        return storage;
      }

      static new(): LocalStorage {
        throw new Error("Use new2 to create a LocalStorage instance");
      }

      private save(): void {
        const data = {
          nextID: this.nextID,
          values: this.values,
          collections: this.collections,
          idToIndex: this.idToIndex,
        };
        localStorage.setItem(this.name, JSON.stringify(this));
      }

      private load(): void {
        const data = JSON.parse(localStorage.getItem(this.name) || "{}");
        this.nextID = data.nextID || 1;
        this.values = data.values || {};
        this.collections = data.collections || {};
        this.idToIndex = data.idToIndex || {};
      }
    }
  }

  export class Value<T> {
    private _saveTimer: any = null;
    private _value: any = null;
    events: Events = new Events();

    private constructor(
      private persister: Persister.Base,
      private key: string,
      private defaultValue: T | null = null
    ) {
      this.load();
    }

    static async new<T>(
      persister: Persister.Base,
      key: string,
      defaultValue: T | null = null
    ): Promise<Value<T>> {
      const value = new Value(persister, key, defaultValue);
      await value.load();
      return value;
    }

    get value(): any {
      return this._value;
    }

    set value(value: any) {
      this._value = value;
      this.save();
      this.events.emit("change", value);
    }

    async load() {
      this._value = await this.persister.get(this.key, this.defaultValue);
    }

    private async save() {
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(this.saveNow.bind(this), 1000);
    }

    private async saveNow() {
      await this.persister.set(this.key, this._value);
    }
  }

  export class List {
    private collection: Persister.Collection;
    lastItems: any[] = [];
    count: number = 0;

    private constructor(
      private persister: Persister.Base,
      collection: string,
      private lastItemsCount = 10
    ) {
      this.collection = persister.getCollection(collection);
    }

    static async new(
      persister: Persister.Base,
      collection: string,
      lastItemsCount = 10
    ): Promise<List> {
      const list = new List(persister, collection, lastItemsCount);
      await list.refresh();
      return list;
    }

    async add(item: any): Promise<void> {
      await this.collection.addItem(item);
      await this.refresh();
    }

    async delete(item: any): Promise<void> {
      await this.collection.deleteItem(item._id);
      await this.refresh();
    }

    async deleteMany(filter: (item: any) => boolean): Promise<void> {
      await this.collection.deleteMany(filter);
    }

    async update(item: any): Promise<void> {
      await this.collection.updateItem(item);
      await this.refresh();
    }

    async upsert(item: any): Promise<void> {
      await this.collection.upsertItem(item);
      await this.refresh();
    }

    async upsertMany(items: any[]): Promise<void> {
      await this.collection.upsertMany(items);
      await this.refresh();
    }

    async getItemAt(index: number): Promise<any> {
      return await this.collection.getItemAt(index);
    }

    async getMany(filter: (item: any) => boolean): Promise<any[]> {
      return await this.collection.getItems(filter);
    }

    async getNewest(count: number = 1): Promise<any> {
      return await this.collection.getNewest(count);
    }

    async getIndex(item: any): Promise<number | null> {
      return await this.collection.getIndex(item);
    }

    private async refresh(): Promise<void> {
      this.lastItems = await this.collection.getItems(
        (item: any) => true,
        (item: any) => item._id,
        this.lastItemsCount
      );
      this.count = await this.collection.count();
    }

    async clear(): Promise<void> {
      await this.collection.deleteMany(() => true);
      await this.refresh();
    }

    async getNewID(): Promise<number> {
      return await this.collection.getNewID();
    }
  }
}

export { Data };
