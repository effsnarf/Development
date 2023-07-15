// PersistedObject class
// Persistes an object to the database
// Can be used for primitives and small arrays or objects

import { msg } from "~/code/util/msg";
import { Persisted } from "./persisted";
import { Database } from "../database/database";
import { Action } from "~/code/action-stack/action-stack";

abstract class PersistedSomething extends Persisted {
  private key: number = 1;
  protected _value: any;

  constructor(db: Database, _id: string, defaultValue: any) {
    super(db, _id);
    this._value = defaultValue;
  }

  get() {
    return this._value;
  }

  async set(
    redoIcon: string,
    undoIcon: string | null,
    newValue: any
  ): Promise<Action> {
    let oldValue = Objects.json.parse(JSON.stringify(this._value));
    newValue = Objects.json.parse(JSON.stringify(newValue));

    this._value = newValue;

    await this.save();

    this.hasChanged();

    return this.action({
      redo: [redoIcon, `set`, [redoIcon, undoIcon, newValue], newValue],
      undo: [undoIcon, `set`, [undoIcon, redoIcon, oldValue]],
    });
  }

  protected async modify(redoIcon: string, undoIcon: string, modify: Function) {
    let oldValue = Objects.json.parse(JSON.stringify(this._value));

    await modify(this._value);

    return await this.set(redoIcon, undoIcon, this._value);
  }

  protected async load() {
    let doc = await this.db.get(this._id);
    if (doc) {
      this._value = doc.value;
    }
  }

  protected async save() {
    await this.db.update(this._id, { value: this._value }, { upsert: true });
  }

  hasChanged() {
    this.key++;
  }
}

export { PersistedSomething };
