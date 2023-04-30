// Identity provider class
// Provides unique integer values

import { PersistedPrimitive } from '../persisted/persisted-primitive';
import { Database } from '../database/database';

class IdentityProvider {
    _id: string;
    private nextID!: PersistedPrimitive;

    constructor(_id: string) {
        this._id = _id;
    }

    static async construct(db: Database, _id: string) {
        let identityProvider = new IdentityProvider(_id);
        identityProvider.nextID = (await PersistedPrimitive.construct(db, _id, 1));
        return identityProvider;
    }

    async getNextID() {
        return (await this.nextID.increase()).redo.result;
    }

    async increase() {
        return (await this.nextID.decrease()).redo.result;
    }

    async decrease() {
        return (await this.nextID.decrease()).redo.result;
    }
}


export { IdentityProvider };
