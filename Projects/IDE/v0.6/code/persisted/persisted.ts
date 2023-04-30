// Persisted class
// Provides a way to persist a value in the database

import { Actionable } from '~/code/action-stack/actionable';
import { Database } from '../database/database';

abstract class Persisted extends Actionable {
    protected db: Database;
    protected _id: string;

    constructor(db: Database, _id: string) {
        super();
        this.db = db;
        this._id = _id;
    }
}


export { Persisted };
