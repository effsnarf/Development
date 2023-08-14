// Local storage database implementation

// Extends MemoryDatabase
// Saves data to local storage every time it is updated

import { msg } from "../util/msg";
import { Utility } from "../util/utility";
import { Objects } from "../../../../../Shared/Extensions.Objects.Client";
import { IdentityProvider } from "../identity-provider/identity-provider";
import { MemoryDatabase } from "./memory-database";

class LocalStorageDatabase extends MemoryDatabase {
  private idKey: string;
  private itemsKey: string;
  private _id: any;

  constructor(localStorageKey: string, identProv: IdentityProvider | null) {
    super(identProv);
    this.idKey = `${localStorageKey}.next.id`;
    this.itemsKey = `${localStorageKey}.items`;
    // loads data from local storage
    this._id = Objects.json.parse(localStorage.getItem(this.idKey) || `1`);
    this.items = Objects.json.parse(
      localStorage.getItem(this.itemsKey) || `{}`
    );

    // Rate-limits the save() function
    // Causes a bug if the whole db is deleted from local storage
    this.save = Utility.rateLimit(this._save.bind(this), 400);
  }

  static async construct(localStorageKey: string, identProv: IdentityProvider) {
    return new LocalStorageDatabase(localStorageKey, identProv);
  }

  async _create(doc: any) {
    try {
      return await super._create(doc);
    } finally {
      this.save();
    }
  }

  async _update(_id: any, doc: any) {
    try {
      return await super._update(_id, doc);
    } finally {
      this.save();
    }
  }

  async _delete(_id: any) {
    try {
      await super._delete(_id);
    } finally {
      this.save();
    }
  }

  // Saves the data to local storage
  save() {
    // This is a dummy function that gets replaced by the rate-limited version of _save() by the constructor
  }

  private _save() {
    localStorage.setItem(this.itemsKey, JSON.stringify(this.items));
  }
}

export { LocalStorageDatabase };
