// In-memory database implementation

import { IdentityProvider } from '../identity-provider/identity-provider';
import { Database } from './database';

class MemoryDatabase extends Database {
    protected items: any;

    constructor(identProv: IdentityProvider | null) {
        super(identProv);
        this.items = {};
    }

    protected _get(_id: any) {
        return this.items[_id];
    }

    protected async _create(doc: any) {
        this.items[doc._id] = doc;
        return doc;
    }

    protected async _update(_id: any, doc: any) {
        this.items[_id] = doc;
        return doc;
    }

    protected async _delete(_id: any) {
        delete this.items[_id];
    }
}


export { MemoryDatabase };
