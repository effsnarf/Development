// Database actions
// Abstract class that implements the doable (undo/redo) actions on the database
// Implementations of this class should implement the _get, _create, _update and _delete methods

import { IdentityProvider } from '~/code/identity-provider/identity-provider';

abstract class Database {
    icon: string = `📃`;
    public oid!: string;
    public identProv: IdentityProvider | null;

    constructor(identProv: IdentityProvider | null) {
        this.identProv = identProv;
    }

    async get(_id: any) {
        return this._get(_id);
    }

    // Get the document with the given _id
    protected abstract _get(_id: any): Promise<any>;

    async create(doc: any) {
        // If an _id is provided, check whether the document exists
        if (doc._id) {
            if (await this._get(doc._id)) {
                throw new Error(`Document ${doc._id} already exists.`);
            }
        }
        // If no _id is provided, generate one
        if (!doc._id) {
            if (!this.identProv) throw new Error(`No identity provider provided.`);
            doc._id = (await this.identProv?.getNextID());
        }

        // Create the document
        let newDoc = (await this._create(doc));

        return {
            result: newDoc,
            icon: `➕`,
            undo: {
                delete: [newDoc._id, true]
            }
        }
    }

    // Create the document
    protected abstract _create(doc: any): Promise<any>;

    async update(_id: any, doc: any, options: { upsert: boolean; }) {
        // Check whether the document exists
        let oldDoc = (await this._get(_id));
        // If the document doesn't exist
        if (!oldDoc) {
            // If upsert is not enabled, throw an error
            if (!options?.upsert) throw new Error(`Document ${_id} not found.`);
            // If upsert is enabled, create the document
            // Set the _id
            doc._id = _id;
            // Create the document
            let report = (await this.create(doc));
            // Change the icon to indicate that the document was upserted
            report.icon = `➕✏`;
            // Return the report
            return report;
        }
        // If the document exists, update the document
        let result = (await this._update(_id, doc));
        // For update, undo is to restore the old document state
        return {
            result: result,
            icon: `✏`,
            undo: {
                update: [_id, oldDoc]
            }
        }
    }

    // Update the document
    // Returns { oldDoc, newDoc }
    protected abstract _update(_id: any, doc: any): Promise<any>;

    async delete(_id: any, isUndo = false) {
        if ((!this.identProv) && (isUndo)) throw new Error(`No identity provider provided.`);
        // Save the document before deleting it, so that it can be restored if undo is called
        let doc = (await this.get(_id));
        // Delete the document
        await this._delete(_id);
        // If this is an undo operation, decrement the identity provider
        if (isUndo) {
            await this.identProv?.decrease();
        }

        return {
            result: { deletedDoc: doc },
            icon: `❌`,
            undo: {
                create: [doc]
            }
        }
    }

    // Delete the document
    protected abstract _delete(_id: any): Promise<any>;
}

// Export the Database class
export { Database };