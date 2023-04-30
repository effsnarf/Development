// PersistedObject class

import { Utility } from "~/code/util/utility";
import { PersistedSomething } from "~/code/persisted/persisted-something";
import { Database } from "~/code/database/database";

class PersistedObject extends PersistedSomething {
    constructor(db: Database, _id: string, defaultValue: any) {
        super(db, _id, defaultValue);
    }

    static async construct(db: Database, _id: string, defaultValue: any = {}) {
        let persisted = new PersistedObject(db, _id, defaultValue);
        await persisted.load();
        // [] accessor proxy for convenience
        persisted = (new Proxy(persisted, {
            get: (target: any, name: string) => {
                return target.proxifyNested(target.getProperty(name));
            },
            set: (target: any, name: string, value: any) => {
                // If value is a dictionary, proxy it to know when to persist nested changes
                value = target.proxifyNested(value);
                target.setProperty(name, value);
                return true;
            }
        }));
        return persisted;
    }

    getProperty(name: string) {
        return Utility.getObjProperty(super.get(), name);
    }

    async setProperty(name: string, newValue: any) {
        newValue = this.proxifyNested(newValue);
        return (await this.modify(`✏`, `✏`, (obj: any[]) => Utility.setObjProperty(obj, name, newValue)));
    }

    async load() {
        await super.load();
        // Recursively proxy all dictionaries to know when to persist nested changes
        this._value = this.proxifyNested(this._value, true);
    }

    // This method makes sure that nested dictionaries also trigger a save() on the main persisted object
    proxifyNested(obj: any, recursive: boolean = false) {
        // if obj is already a proxy, return it
        if (Utility.is.proxy(obj)) return obj;
        // if obj is not a dictionary, return it
        if (!Utility.is.dictionary(obj)) return obj;

        obj = Utility.proxify(obj,
            (target: any, name: string) => this.proxifyNested(target[name]),
            (target: any, name: string, newValue: any) => {
                target[name] = newValue;
                this.save();
                return true;
            }
        );

        if (recursive) {
            for (let key in obj) {
                obj[key] = this.proxifyNested(obj[key], true);
            }
        }

        return obj;
    }
}

export { PersistedObject };
