// Test module

import { msg } from '~/code/util/msg';
import { Actionable } from '~/code/action-stack/actionable';

import { PersistedPrimitive } from '~/code/persisted/persisted-primitive';
import { Database } from '~/code/database/database';

class Test extends Actionable {
    private db: Database;
    private tree1: any[] = [];
    private var1!: PersistedPrimitive;

    constructor(db: Database) {
        super();
        this.db = db;
    }

    static async construct(db: Database, idKey: any) {
        let test = new Test(db);
        test.var1 = (await PersistedPrimitive.construct(db, `${idKey}.var1`, 0));
        return test;
    }

    async treeTest1() {
        if (this.tree1.length >= 4) throw new Error(`Tree is full`);

        switch (this.tree1.length) {
            case 0:
                this.tree1.push((await this.db.create({ direction: `horizontal` })).result);
                break;
            case 1:
                this.tree1.push((await this.db.create({ parent: { _id: this.tree1[0]._id }, direction: `vertical` })).result);
                break;
            case 2:
                this.tree1.push((await this.db.create({ parent: { _id: this.tree1[1]._id }, direction: `horizontal` })).result);
                break;
            case 3:
                this.tree1.push((await this.db.create({ parent: { _id: this.tree1[2]._id }, direction: `vertical` })).result);
                break;
        }

        return {
            icon: `🌳`,
            undo: [`treeTest1Undo`],
            redo: {
                result: `${this.tree1.length} nodes`
            }
        }
    }

    async treeTest1Undo() {
        let node = this.tree1.pop();

        await this.db.delete(node._id, true);
    }

    async clear() {
        return (await this.set(0));
    }

    async set(newValue: number) {
        let oldValue = this.var1.get();

        let action = (await this.var1.set(`✏`, `✏`, newValue));

        this.notify();

        return action;
    }

    async increase() {
        await this.var1.increase();

        this.notify();

        return this.action({
            redo: [`➕`, `increase`, [...arguments], this.var1.get()],
            undo: [`➖`, `decrease`],
        });
    }

    async decrease() {
        await this.var1.decrease();

        this.notify();

        return this.action({
            redo: [`➖`, `decrease`, [...arguments], this.var1.get()],
            undo: [`➕`, `increase`],
        });
    }

    notify() {
        msg.alert(`var1 = ${this.var1.get()}`);
    }
}


export { Test };
