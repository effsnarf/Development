import { Data } from "./Data";
import { Objects } from "./Extensions.Objects.Client";

namespace Actionable {
  export interface Doable {
    method: string;
    args: any[];
    noop?: boolean;
  }

  export interface Action {
    _id: number;
    redo: Doable;
    undo: Doable;
  }

  export class ActionStack {
    actions!: Data.List;
    pointer!: Data.Value;

    toPersistableAction: (action: Action) => Promise<any> = async (
      action: Action
    ) => action;
    fromPersistableAction: (action: any) => Promise<Action> = async (
      action: Action
    ) => action;

    executeAction!: (action: Action) => Promise<Action>;

    private constructor(
      private persister: Data.Persister.Base,
      private varName: string
    ) {}

    static async new(
      persister: Data.Persister.Base,
      varName: string
    ): Promise<ActionStack> {
      const actionStack = new ActionStack(persister, varName);

      actionStack.actions = await Data.List.new(
        persister,
        `${varName}.actions`
      );

      actionStack.pointer = await Data.Value.new(
        persister,
        `${varName}.actions.pointer`,
        -1
      );

      if (actionStack.actions.count === 0) {
        // Add a blank action to start
        await actionStack.do({
          redo: { noop: true },
          undo: { noop: true },
        });
      }

      return actionStack;
    }

    async do(action: Action | any) {
      action = await this.fromPersistableAction(action);
      action = await this._executeAction(action);
      if (!action) throw new Error("executeAction must return an action");
      if (!action.undo) throw new Error("executeAction must set action.undo");
      await this.add(action);
    }

    async add(action: Action | any) {
      action = Objects.clone(action);
      action = await this.toPersistableAction(action);
      const actionAtPointer = await this.actions.getItemAt(this.pointer.value);
      if (actionAtPointer)
        await this.actions.deleteMany(
          (action: Action) => action._id > actionAtPointer._id
        );
      await this.actions.upsert(action);
      this.pointer.value++;
    }

    async goToAction(toPointer: number) {
      if (this.pointer.value > toPointer) {
        while (this.pointer.value > toPointer) {
          await this.undo();
          return;
        }
      }
      if (this.pointer.value < toPointer) {
        while (this.pointer.value < toPointer) {
          await this.redo();
          return;
        }
      }
    }

    async undo(count: number = 1) {
      if (count < 1) return;
      for (let i = 0; i < count; i++) {
        await this._undo();
      }
    }

    async _undo() {
      if (this.pointer.value < 0) return;
      const action = await this.actions.getItemAt(this.pointer.value);
      if (!action) return;
      //await this.fromPersistableAction(action);
      await this.executeAction({
        undo: action.redo,
        redo: action.undo,
      } as Action);
      this.pointer.value--;
    }

    async redo() {
      if (this.pointer.value >= this.actions.count - 1) return;
      const action = await this.actions.getItemAt(this.pointer.value + 1);
      if (!action) return;
      await this.fromPersistableAction(action);
      await this.executeAction(action);
      this.pointer.value++;
    }

    async clear() {
      await this.actions.clear();
      this.pointer.value = -1;
    }

    private async _executeAction(action: Action) {
      action = Objects.clone(action);

      if (action.redo.noop) return action;

      return await this.executeAction(action);
    }
  }
}

export { Actionable };
