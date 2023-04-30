// PersistedArray class

import { PersistedSomething } from "~/code/persisted/persisted-something";
import { Database } from "~/code/database/database";

class PersistedArray extends PersistedSomething {
    constructor(db: Database, _id: string, defaultValue: any) {
        super(db, _id, defaultValue);
    }

    static async construct(db: Database, _id: string) {
        let persisted = new PersistedArray(db, _id, []);
        await persisted.load();
        return persisted;
    }

    // length property
    get length() {
        return (super.get()).length;
    }

    async getItem(index: number) {
        return super.get()[index];
    }

    async setItem(index: number, newValue: any) {
        return (await this.modify(`✏`, `✏`, (items: any[]) => (items[index] = newValue)));
    }

    async findIndex(predicate: Function) {
        return (super.get()).findIndex(predicate);
    }

    async filter(predicate: Function) {
        return (super.get()).filter(predicate);
    }

    async getChildren(parentID: number) {
        return (await this.filter((item: any) => (item.parent?._id == parentID)));
    }

    async push(item: any) {
        return (await this.modify(`➕`, `➖`, (items: any[]) => (items.push(item))));
    }

    async splice(index: number, deleteCount: number, ...newItems: any[]) {
        let delay = 50;
        // Remove one item at a time in intervals for a nice animation
        while (deleteCount > 0) {
            await this.modify(`✂`, `✂`, (items: any[]) => (items.splice(index, 1)));
            deleteCount--;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    async clear() {
        return (await this.splice(0, (await super.get()).length));
    }
}

export { PersistedArray };
