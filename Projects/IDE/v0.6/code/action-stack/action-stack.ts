// ActionStack
// Manages a stack of actions that can be undone and redone.

import { msg } from "~/code/util/msg";
import { Keyboard } from "~/code/util/keyboard";
import { PersistedPrimitive } from "~/code/persisted/persisted-primitive";
import { PersistedArray } from "~/code/persisted/persisted-array";
import { IdentityProvider } from "~/code/identity-provider/identity-provider";
import { Database } from "~/code/database/database";
import { ModuleManager } from "../module-manager";

type TimeSpan = {
    started?: Date,
    ended?: Date,
    elapsed?: Number
}

type IconAndName = {
    icon: string;
    name: string;
}

type Doable = {
    desc: string;
    module: IconAndName,
    method: IconAndName,
    args: any[];
    result: any;
    ts: TimeSpan;
}

type Action = {
    _id: number;
    undo: Doable;
    redo: Doable;
}



class ActionStack {
    icon: string = `↶↷`;
    mm: ModuleManager;
    idKey: any;
    pointer!: PersistedPrimitive;
    items!: PersistedArray;
    ident!: IdentityProvider;

    constructor(mm: ModuleManager, db: Database, idKey: any) {
        this.mm = mm;
        this.idKey = idKey;
    }

    static async construct(mm: ModuleManager, db: Database, idKey: any) {
        let actionStack = new ActionStack(mm, db, idKey);
        // Points to the action last executed
        actionStack.pointer = (await PersistedPrimitive.construct(db, `${idKey}.pointer`, -1));
        // List of actions
        actionStack.items = (await PersistedArray.construct(db, `${idKey}.items`));
        // Identity provider
        actionStack.ident = (await IdentityProvider.construct(db, `${idKey}.ident`));
        // Create a first action to be able to undo the first action
        if (actionStack.items.length == 0) await actionStack.clear();
        // Return the action stack
        return actionStack;
    }

    async clear() {
        // Confirm
        if (!confirm(`Clear action stack?`)) return;

        await this.items.clear();
        await this.pointer.set(`🧹`, null, -1);
        //this.do()
    }

    async getChildren(_id: number) {
        return (await this.items.getChildren(_id));
    }

    async add(action: any) {
        if (!action._id) action._id = (await this.ident.getNextID());
        action = JSON.parse(JSON.stringify(action));
        this.items.push(action);
        await this.pointer.increase();
    }

    async edit(_id: number, newAction: any) {
        let index = (await this.items.findIndex((a: { _id: number; }) => (a._id == _id)));
        if (index < 0) throw new Error(`Action ${_id} not found`);
        let action = (await this.items.getItem(index));
        Object.assign(action, newAction);
        await this.items.setItem(index, newAction);
    }

    // If doing several actions at once, they will be grouped together
    // and undone/redone as a single action
    // we mark the current action _id,
    // wait for all the actions to be done and then group them into a single action
    // with undo[]/redo[] arrays instead of undo/redo
    async doGroup(actionName: string, actions: Function) {
        // Remove all actions after the pointer
        await this.items.splice(this.pointer.get() + 1, this.items.length - this.pointer.get() - 1);
        // Mark the current action _id
        let actionID = (await this.items.getItem(this.pointer.get()))._id;
        let startPointer = this.pointer.get();
        // Execute the actions
        await actions();
        // Get all the actions that were done since the marked action
        let newActions = (await this.items.filter((a: { _id: number; }) => (a._id > actionID)));
        // Remove the new actions from the stack
        await this.items.splice(startPointer + 1, newActions.length);
        // Set the pointer to the last action
        await this.pointer.set(`✏`, null, startPointer);
        // Group the undos and redos
        let undos = newActions.map((a: { undo: any; }) => (a.undo)).reverse();
        let redos = newActions.map((a: { redo: any; }) => (a.redo));
        // Create a new action with undo[]/redo[] arrays
        let action = {
            _id: (await this.ident.getNextID()),
            undos: undos,
            redos: redos,
        };
        // Add the new action to the stack
        await this.add(action);
    }

    async do(oid?: string, method?: string, args?: any[]) {
        // Remove all actions after the pointer
        await this.items.splice(this.pointer.get() + 1, this.items.length - this.pointer.get() - 1);

        let started = (new Date());
        let action = null;
        let doable = (!oid) ? null : {
            module: { name: oid },
            method: { name: method },
            args: args,
        };

        try {
            // Execute the action
            action = (await this.execute(doable as Doable, `do`));
            // Check the action
            if (!action) throw new Error(`${oid}.${method}() did not return an action.`);
        }
        catch (ex: any) {
            msg.error(ex.message);
            return;
        }
        // Measure the elapsed time
        action.redo.ts.started = started;
        action.redo.ts.ended = new Date();
        action.redo.ts.elapsed = (action.redo.ts.ended.getTime() - (action.redo.ts.started ?? (new Date())).getTime());
        // Add the new action
        await this.add(action);
        // Return the result
        return action.redo.result;
    }

    async undo() {
        if (this.pointer.get() < 0) {
            msg.error(`Nothing to undo`);
            return;
        }
        // Get the action
        let action = (await this.items.getItem(this.pointer.get()));
        // Execute the undo action
        let newAction = (await this.execute((action.undo || action.undos), `undo`));
        // Decrement the pointer
        await this.pointer.decrease();
        // Return the result
        return newAction?.redo.result;
    }

    async redo() {
        if (this.pointer.get() >= (this.items.length - 1)) {
            msg.error(`Nothing to redo`);
            return;
        }
        // Increment the pointer
        await this.pointer.increase();
        // Get the action
        let action = (await this.items.getItem(this.pointer.get()));
        // Execute the redo action
        let newAction = (await this.execute((action.redo || action.redos), `redo`));
        // Return the result
        return newAction?.redo.result;
    }

    async execute(doable: Doable, actionDirection?: string): Promise<Action | null> {
        if (!doable) return null;

        // If doable is an array, execute each doable in the array
        if (Array.isArray(doable)) {
            let result = null;
            for (let doableItem of doable) {
                result = await this.execute(doableItem, actionDirection);
            }
            return result;
        }

        return await this.mm.invoke(doable.module.name, doable.method.name, doable.args);
    }

    registerKeyboardShortcuts() {
        Keyboard.on('ctrl+z', this.undo.bind(this));
        Keyboard.on('ctrl+y', this.redo.bind(this));
    }
}


export { ActionStack, Action, Doable, IconAndName };
