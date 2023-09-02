import { Objects } from "./Extensions.Objects.Client";

namespace Data {
  export namespace Persister {
    export abstract class Base {
      getCollection(collection: string): Collection {
        return Collection.new(this, collection);
      }

      abstract get(key: any, defaultValue: any): Promise<any>;
      abstract set(key: any, value: any): Promise<void>;

      abstract addItem(collection: string, item: any): Promise<void>;
      abstract updateItem(collection: string, item: any): Promise<void>;
      abstract upsertItem(collection: string, item: any): Promise<void>;
      abstract deleteItem(collection: string, _id: number): Promise<void>;
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
      abstract count(collection: string): Promise<number>;
    }

    export class Collection {
      private constructor(
        private persister: Base,
        private collection: string
      ) {}

      static new(persister: Base, collection: string): Collection {
        return new Collection(persister, collection);
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

      async count(): Promise<number> {
        return await this.persister.count(this.collection);
      }
    }

    export class Memory extends Base {
      private nextID: number = 1;
      private values: any = {};
      private collections: any = {};

      private constructor() {
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

      async addItem(collection: string, item: any): Promise<void> {
        const items = await this.getCollectionArray(collection);
        if (!item._id) item._id = await this.getNewID();
        items.push(item);
      }

      async updateItem(collection: string, item: any): Promise<void> {
        let items = await this.getCollectionArray(collection);
        const index = items.findIndex((i: any) => i._id === item._id);
        if (index >= 0) items[index] = item;
      }

      async upsertItem(collection: string, item: any): Promise<void> {
        if (item._id) {
          await this.updateItem(collection, item);
        } else {
          await this.addItem(collection, item);
        }
      }

      async deleteItem(collection: string, _id: number): Promise<void> {
        let items = await this.getCollectionArray(collection);
        items = items.filter((item: any) => item._id !== _id);
      }

      async deleteMany(collection: string, filter: (item: any) => boolean) {
        let items = await this.getCollectionArray(collection);
        items = items.filter((item: any) => !filter(item));
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

      async count(collection: string): Promise<number> {
        const items = await this.getCollectionArray(collection);
        return items.length;
      }

      private getCollectionArray(collection: string): any[] {
        if (!this.collections[collection]) this.collections[collection] = [];
        return this.collections[collection];
      }

      private async getNewID(): Promise<number> {
        return this.nextID++;
      }
    }

    export class LocalStorage extends Base {
      private constructor(private name: string) {
        super();
      }

      static new(name: string): LocalStorage {
        return new LocalStorage(name);
      }

      async get(key: any, defaultValue: any = null): Promise<any> {
        return JSON.parse(
          localStorage.getItem(`${this.name}.${key}`) ||
            JSON.stringify(defaultValue)
        );
      }

      async set(key: any, value: any): Promise<void> {
        localStorage.setItem(`${this.name}.${key}`, JSON.stringify(value));
      }

      async addItem(collection: string, item: any): Promise<void> {
        const items = await this.get(collection, []);
        if (!item._id) item._id = await this.getNewId();
        items.push(item);
        await this.set(collection, items);
      }

      async updateItem(collection: string, item: any): Promise<void> {
        let items = await this.get(collection);
        const index = items.findIndex((i: any) => i._id === item._id);
        if (index >= 0) items[index] = item;
        await this.set(collection, items);
      }

      async upsertItem(collection: string, item: any): Promise<void> {
        if (item._id) {
          await this.updateItem(collection, item);
        } else {
          await this.addItem(collection, item);
        }
      }

      async deleteItem(collection: string, _id: number): Promise<void> {
        let items = await this.get(collection);
        items = items.filter((item: any) => item._id !== _id);
        await this.set(collection, items);
      }

      async deleteMany(collection: string, filter: (item: any) => boolean) {
        let items = await this.get(collection);
        items = items.filter((item: any) => !filter(item));
        await this.set(collection, items);
      }

      async getItems(
        collection: string,
        filter: (item: any) => boolean = () => true,
        sort: (item: any) => any = (item: any) => item._id,
        limit?: number
      ): Promise<any[]> {
        let items = await this.get(collection, []);
        items = items.filter(filter);
        items = items.sort(sort);
        items = items.slice(0, limit || items.length);
        return items;
      }

      async getItemAt(collection: string, index: number): Promise<any> {
        const items = await this.get(collection, []);
        return items[index];
      }

      async count(collection: string): Promise<number> {
        const items = await this.get(collection, []);
        return items.length;
      }

      private async getNewId(): Promise<number> {
        const nextIdKey = "next.id";
        const id = await this.get(nextIdKey, 1);
        await this.set(nextIdKey, id + 1);
        return id;
      }
    }
  }

  export class Value {
    private _saveTimer: any = null;
    private _value: any = null;

    private constructor(
      private persister: Persister.Base,
      private key: string,
      private defaultValue: any = null
    ) {
      this.load();
    }

    static async new(
      persister: Persister.Base,
      key: string,
      defaultValue: any = null
    ): Promise<Value> {
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

    async getItemAt(index: number): Promise<any> {
      return await this.collection.getItemAt(index);
    }

    async getMany(filter: (item: any) => boolean): Promise<any[]> {
      return await this.collection.getItems(filter);
    }

    private async refresh(): Promise<void> {
      this.lastItems = await this.collection.getItems(
        (item: any) => true,
        (item: any) => -item._id,
        this.lastItemsCount
      );
      this.count = await this.collection.count();
    }

    async clear(): Promise<void> {
      await this.collection.deleteMany(() => true);
      await this.refresh();
    }
  }
}

export { Data };
