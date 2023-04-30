// PersistedPrimitive class
// Provides a way to persist a value in the database

import { PersistedSomething } from './persisted-something';
import { Database } from '~/code/database/database';

class PersistedPrimitive extends PersistedSomething {
    constructor(db: Database, _id: string, defaultValue: any) {
        super(db, _id, defaultValue);
    }

    static async construct(db: Database, _id: string, defaultValue: any) {
        let persisted = new PersistedPrimitive(db, _id, defaultValue);
        await persisted.load();
        return persisted;
    }

    get() {
        return (super.get());
    }

    async increase(amount: number = 1) {
        return (await this.set(`➕`, `➖`, this.get() + amount));
    }

    async decrease(amount: number = 1) {
        return (await this.set(`➖`, `➕`, this.get() - amount));
    }
}


export { PersistedPrimitive };
